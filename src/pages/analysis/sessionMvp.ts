import { getAnalysisUserContext, type AnalysisUserContext } from "../../firebase/auth";
import {
  createAnalysisSession,
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
import type { PageRenderContext } from "./pageShell";
import { renderSessionFormFields } from "./NewAnalysisSessionPage";

type Navigate = (path: string) => void;

const SESSION_CATEGORIES = new Set<AnalysisCategory>(["biomechanics", "pace", "equipment", "composite"]);
const SESSION_STATUSES = new Set<AnalysisSessionStatus>(["draft", "processing", "ready", "reviewed", "archived"]);

export function initializeAnalysisSessionMvp(root: HTMLElement, context: PageRenderContext, navigate: Navigate): void {
  bindCreateForm(root, navigate);

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
  const focusAreas = session.tags?.length ? session.tags.map((tag) => `<span class="rounded-full bg-slate-900 border border-slate-700 px-2.5 py-1 text-xs text-slate-300">${escapeHtml(tag)}</span>`).join("") : `<span class="text-xs text-slate-500">No focus areas</span>`;

  return `
    <a data-analysis-link href="/analysis/sessions/${encodeURIComponent(session.id)}" class="block bg-skating-card border border-slate-700 hover:border-skating-pro rounded-2xl p-5 shadow-xl transition-all">
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
          <p data-session-form-status class="text-sm text-slate-400"></p>
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

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
