import { getAnalysisUserContext, type AnalysisUserContext } from "../../firebase/auth";
import {
  createAnalysisSession,
  deleteAnalysisSession,
  getAnalysisSession,
  listAnalysisSessionsByAthlete,
  updateAnalysisSession,
} from "../../services/analysisFirestoreService";
import type {
  AnalysisCategory,
  AnalysisSession,
  AnalysisSessionStatus,
  AnalysisTimestamp,
} from "../../types/analysis";
import { escapeAttribute, escapeHtml } from "./html";
import type { PageRenderContext } from "./pageShell";
import { renderSessionFormFields } from "./NewAnalysisSessionPage";

type Navigate = (path: string) => void;

const SESSION_CATEGORIES = new Set<AnalysisCategory>(["biomechanics", "pace", "equipment", "composite"]);
const SESSION_STATUSES = new Set<AnalysisSessionStatus>(["draft", "processing", "ready", "reviewed", "archived"]);

export function initializeAnalysisSessionMvp(root: HTMLElement, context: PageRenderContext, navigate: Navigate): void {
  bindCreateForm(root, navigate);
  bindDeleteSessionActions(root, navigate);

  if (root.querySelector("[data-session-list]")) {
    void loadSessionList(root);
  }

  if (root.querySelector("[data-dashboard-recent-sessions]")) {
    void loadDashboardSessions(root);
  }

  const detail = root.querySelector<HTMLElement>("[data-session-detail]");
  if (detail && context.sessionId) {
    void loadSessionDetail(detail, context.sessionId);
  }
}

function bindCreateForm(root: HTMLElement, navigate: Navigate): void {
  const form = root.querySelector<HTMLFormElement>('form[data-session-form][data-mode="create"]');

  if (!form) {
    return;
  }

  setDefaultDate(form);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const context = await getAnalysisUserContext();
      const payload = buildCreatePayload(form, context);
      setFormDisabled(form, true);
      setFormStatus(form, "Creating session...", "neutral");
      const session = await createAnalysisSession(context, payload);
      setFormStatus(form, "Session created.", "success");
      navigate(`/analysis/sessions/${session.id}`);
    } catch (error) {
      setFormStatus(form, getErrorMessage(error), "error");
      setFormDisabled(form, false);
    }
  });
}

function bindDeleteSessionActions(root: HTMLElement, navigate: Navigate): void {
  if (root.dataset.sessionDeleteBound === "true") {
    return;
  }

  root.dataset.sessionDeleteBound = "true";

  root.addEventListener("click", async (event) => {
    const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>("button[data-delete-session-id]") : null;

    if (!target || !root.contains(target)) {
      return;
    }

    event.preventDefault();
    const sessionId = target.dataset.deleteSessionId;

    if (!sessionId) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this Analysis Session? Linked biomechanics, pace, equipment, and report data will not be deleted yet.",
    );

    if (!confirmed) {
      return;
    }

    const originalHtml = target.innerHTML;
    const status = findDeleteStatus(target);

    target.disabled = true;
    target.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>Deleting...`;
    setDeleteStatus(status, "Deleting session...", "neutral");

    try {
      const context = await getAnalysisUserContext();
      await deleteAnalysisSession(context, sessionId);
      navigate("/analysis/sessions");
    } catch (error) {
      target.disabled = false;
      target.innerHTML = originalHtml;
      setDeleteStatus(status, getErrorMessage(error), "error");
    }
  });
}

async function loadSessionList(root: HTMLElement): Promise<void> {
  const container = root.querySelector<HTMLElement>("[data-session-list]");

  if (!container) {
    return;
  }

  try {
    const context = await getAnalysisUserContext();
    const sessions = await loadSessions(context);
    container.innerHTML = renderSessionList(sessions);
  } catch (error) {
    container.innerHTML = renderErrorState("Unable to load sessions", getErrorMessage(error));
  }
}

async function loadDashboardSessions(root: HTMLElement): Promise<void> {
  const container = root.querySelector<HTMLElement>("[data-dashboard-recent-sessions]");
  const count = root.querySelector<HTMLElement>("[data-session-count]");

  if (!container) {
    return;
  }

  try {
    const context = await getAnalysisUserContext();
    const sessions = await loadSessions(context);
    const recentSessions = sessions.slice(0, 3);

    if (count) {
      count.textContent = String(sessions.length);
    }

    container.innerHTML = recentSessions.length > 0
      ? renderSessionList(recentSessions, "Recent sessions")
      : renderEmptyState("No analysis sessions yet", "Create the first Analysis V1 session to start building the review workflow.");
  } catch (error) {
    if (count) {
      count.textContent = "!";
    }

    container.innerHTML = renderErrorState("Unable to load dashboard sessions", getErrorMessage(error));
  }
}

async function loadSessionDetail(container: HTMLElement, sessionId: string): Promise<void> {
  const state = container.querySelector<HTMLElement>("[data-session-detail-state]");

  if (!state) {
    return;
  }

  try {
    const context = await getAnalysisUserContext();
    const session = await getAnalysisSession(context, sessionId);

    if (!session) {
      state.innerHTML = renderEmptyState("Session not found", "The requested Analysis V1 session does not exist for this athlete.");
      return;
    }

    state.innerHTML = renderSessionDetail(session);
    const form = state.querySelector<HTMLFormElement>('form[data-session-form][data-mode="edit"]');

    if (form) {
      populateForm(form, session);
      form.addEventListener("submit", async (event) => {
        event.preventDefault();

        try {
          const payload = buildUpdatePayload(form);
          setFormDisabled(form, true);
          setFormStatus(form, "Saving session...", "neutral");
          await updateAnalysisSession(context, session.id, payload);
          setFormStatus(form, "Session saved.", "success");
          setFormDisabled(form, false);
        } catch (error) {
          setFormStatus(form, getErrorMessage(error), "error");
          setFormDisabled(form, false);
        }
      });
    }
  } catch (error) {
    state.innerHTML = renderErrorState("Unable to load session", getErrorMessage(error));
  }
}

async function loadSessions(context: AnalysisUserContext): Promise<AnalysisSession[]> {
  const sessions = await listAnalysisSessionsByAthlete(context, context.athleteId);
  return [...sessions].sort((first, second) => getTimestampMs(second.startedAt) - getTimestampMs(first.startedAt));
}

function buildCreatePayload(form: HTMLFormElement, context: AnalysisUserContext): Omit<AnalysisSession, "id" | "createdAt" | "updatedAt"> {
  const values = readSessionForm(form);

  return {
    ownerUserId: context.ownerUserId,
    athleteId: context.athleteId,
    sourceApp: "blaze-skate-analysis",
    schemaVersion: "skatingx-analysis-v1",
    title: values.title,
    category: values.category,
    status: values.status,
    sourceType: "manual-entry",
    startedAt: values.startedAt,
    videoIds: [],
    findingIds: [],
    summary: values.summary,
    tags: values.tags,
  };
}

function buildUpdatePayload(form: HTMLFormElement): Partial<Omit<AnalysisSession, "id" | "ownerUserId" | "createdAt" | "updatedAt">> {
  const values = readSessionForm(form);

  return {
    title: values.title,
    category: values.category,
    status: values.status,
    startedAt: values.startedAt,
    summary: values.summary,
    tags: values.tags,
  };
}

function readSessionForm(form: HTMLFormElement): {
  readonly title: string;
  readonly startedAt: string;
  readonly category: AnalysisCategory;
  readonly status: AnalysisSessionStatus;
  readonly summary: string;
  readonly tags: readonly string[];
} {
  const formData = new FormData(form);
  const title = String(formData.get("title") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const category = coerceCategory(String(formData.get("type") ?? "composite"));
  const status = coerceStatus(String(formData.get("status") ?? "draft"));
  const summary = String(formData.get("summary") ?? "").trim();
  const tags = String(formData.get("focusAreas") ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (!title) {
    throw new Error("Title is required.");
  }

  if (!date) {
    throw new Error("Date is required.");
  }

  return {
    title,
    startedAt: `${date}T00:00:00.000Z`,
    category,
    status,
    summary,
    tags,
  };
}

function renderSessionList(sessions: readonly AnalysisSession[], title = "Saved sessions"): string {
  if (sessions.length === 0) {
    return renderEmptyState("No sessions to display", "Create a new Analysis V1 session to populate this list.");
  }

  return `
    <div class="space-y-3">
      <h2 class="text-sm font-black uppercase tracking-[0.18em] text-slate-400">${escapeHtml(title)}</h2>
      <div class="grid grid-cols-1 gap-3">
        ${sessions.map(renderSessionCard).join("")}
      </div>
    </div>
  `;
}

function renderSessionCard(session: AnalysisSession): string {
  const sessionHref = `/analysis/sessions/${encodeURIComponent(session.id)}`;
  const focusAreas = session.tags?.length ? session.tags.map((tag) => `<span class="rounded-full bg-slate-900 border border-slate-700 px-2.5 py-1 text-xs text-slate-300">${escapeHtml(tag)}</span>`).join("") : `<span class="text-xs text-slate-500">No focus areas</span>`;

  return `
    <article data-session-card class="bg-skating-card border border-slate-700 rounded-2xl p-5 shadow-xl transition-all">
      <a data-analysis-link href="${escapeAttribute(sessionHref)}" class="block hover:text-white">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h3 class="text-lg font-black text-white">${escapeHtml(session.title)}</h3>
            <p class="mt-1 text-sm text-slate-400">${formatDate(session.startedAt)} · ${formatCategory(session.category)}</p>
          </div>
          <span class="self-start rounded-full border border-skating-pro/40 bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-200">${formatStatus(session.status)}</span>
        </div>
        <p class="mt-3 text-sm text-slate-400 leading-relaxed">${escapeHtml(session.summary || "No summary yet.")}</p>
        <div class="mt-4 flex flex-wrap gap-2">${focusAreas}</div>
      </a>
      <div class="mt-5 flex flex-col gap-3 border-t border-slate-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <a data-analysis-link href="${escapeAttribute(sessionHref)}" class="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-bold text-slate-200 hover:border-skating-pro transition-all">
          <i class="fa-solid fa-arrow-right"></i>Open
        </a>
        <button type="button" data-delete-session-id="${escapeAttribute(session.id)}" class="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-200 hover:bg-red-500/20 transition-all">
          <i class="fa-solid fa-trash"></i>Delete
        </button>
        <p data-session-delete-status class="text-sm text-slate-400 sm:ml-auto"></p>
      </div>
    </article>
  `;
}

function renderSessionDetail(session: AnalysisSession): string {
  return `
    <div class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="rounded-2xl bg-slate-900 border border-slate-700 p-4">
          <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Date</p>
          <p class="mt-2 text-lg font-black text-white">${formatDate(session.startedAt)}</p>
        </div>
        <div class="rounded-2xl bg-slate-900 border border-slate-700 p-4">
          <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Type</p>
          <p class="mt-2 text-lg font-black text-white">${formatCategory(session.category)}</p>
        </div>
        <div class="rounded-2xl bg-slate-900 border border-slate-700 p-4">
          <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Status</p>
          <p class="mt-2 text-lg font-black text-white">${formatStatus(session.status)}</p>
        </div>
      </div>
      <form data-session-form data-mode="edit" class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        ${renderSessionFormFields()}
        <div class="lg:col-span-2 flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
          <button type="submit" class="inline-flex items-center justify-center gap-2 bg-skating-pro hover:bg-purple-600 text-white font-bold rounded-xl px-5 py-3 transition-all">
            <i class="fa-solid fa-floppy-disk"></i>Save Changes
          </button>
          <button type="button" data-delete-session-id="${escapeAttribute(session.id)}" class="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-3 font-bold text-red-200 hover:bg-red-500/20 transition-all">
            <i class="fa-solid fa-trash"></i>Delete Session
          </button>
          <p data-session-form-status class="text-sm text-slate-400"></p>
          <p data-session-delete-status class="text-sm text-slate-400"></p>
        </div>
      </form>
    </div>
  `;
}

function populateForm(form: HTMLFormElement, session: AnalysisSession): void {
  setNamedField(form, "title", session.title);
  setNamedField(form, "date", toDateInputValue(session.startedAt));
  setNamedField(form, "type", session.category);
  setNamedField(form, "status", session.status);
  setNamedField(form, "focusAreas", session.tags?.join(", ") ?? "");
  setNamedField(form, "summary", session.summary ?? "");
}

function setNamedField(form: HTMLFormElement, name: string, value: string): void {
  const field = form.elements.namedItem(name);

  if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) {
    field.value = value;
  }
}

function setDefaultDate(form: HTMLFormElement): void {
  setNamedField(form, "date", new Date().toISOString().slice(0, 10));
}

function setFormDisabled(form: HTMLFormElement, disabled: boolean): void {
  form.querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("button,input,select,textarea")
    .forEach((field) => {
      field.disabled = disabled;
    });
}

function setFormStatus(form: HTMLFormElement, message: string, tone: "neutral" | "success" | "error"): void {
  const status = form.querySelector<HTMLElement>("[data-session-form-status]");

  if (!status) {
    return;
  }

  const toneClasses = {
    neutral: "text-slate-400",
    success: "text-skating-success",
    error: "text-red-400",
  } as const;

  status.className = `text-sm font-bold ${toneClasses[tone]}`;
  status.textContent = message;
}

function findDeleteStatus(button: HTMLButtonElement): HTMLElement | null {
  const card = button.closest("[data-session-card]");
  const form = button.closest("form");
  return (card ?? form)?.querySelector<HTMLElement>("[data-session-delete-status]") ?? null;
}

function setDeleteStatus(status: HTMLElement | null, message: string, tone: "neutral" | "error"): void {
  if (!status) {
    return;
  }

  const toneClasses = {
    neutral: "text-slate-400",
    error: "text-red-400",
  } as const;

  status.className = `text-sm font-bold ${toneClasses[tone]}`;
  status.textContent = message;
}

function renderEmptyState(title: string, description: string): string {
  return `
    <div class="bg-skating-card/50 border border-dashed border-slate-700 rounded-2xl p-10 text-center">
      <div class="mx-auto w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 text-xl">
        <i class="fa-solid fa-folder-open"></i>
      </div>
      <h2 class="mt-4 text-lg font-bold text-slate-200">${escapeHtml(title)}</h2>
      <p class="mt-2 text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">${escapeHtml(description)}</p>
    </div>
  `;
}

function renderErrorState(title: string, description: string): string {
  return `
    <div class="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
      <h2 class="text-lg font-black text-red-200">${escapeHtml(title)}</h2>
      <p class="mt-2 text-sm text-red-100/80 leading-relaxed">${escapeHtml(description)}</p>
    </div>
  `;
}

function coerceCategory(value: string): AnalysisCategory {
  return SESSION_CATEGORIES.has(value as AnalysisCategory) ? value as AnalysisCategory : "composite";
}

function coerceStatus(value: string): AnalysisSessionStatus {
  return SESSION_STATUSES.has(value as AnalysisSessionStatus) ? value as AnalysisSessionStatus : "draft";
}

function getTimestampMs(value: AnalysisTimestamp): number {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Date.parse(value) || 0;
  }

  return value.toDate().getTime();
}

function toDateInputValue(value: AnalysisTimestamp): string {
  const date = new Date(getTimestampMs(value));

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
}

function formatDate(value: AnalysisTimestamp): string {
  const date = new Date(getTimestampMs(value));

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatCategory(category: AnalysisCategory): string {
  const labels = {
    biomechanics: "Biomechanics",
    pace: "Pace",
    equipment: "Equipment",
    composite: "Composite",
  } as const;

  return labels[category];
}

function formatStatus(status: AnalysisSessionStatus): string {
  const labels = {
    draft: "Draft",
    processing: "Processing",
    ready: "Ready",
    reviewed: "Reviewed",
    archived: "Archived",
  } as const;

  return labels[status];
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected Analysis Session error.";
}
