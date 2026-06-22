import { getAnalysisUserContext, type AnalysisUserContext } from "../../firebase/auth";
import {
  createPaceSession,
  deletePaceSession,
  getAnalysisSession,
  listPaceSessionsBySession,
  updatePaceSession,
  type CreatePaceSessionInput,
  type UpdatePaceSessionInput,
} from "../../services/analysisFirestoreService";
import type { PaceDistanceType, PaceSession, PaceSessionStatus } from "../../types/analysis";
import { calculatePaceMetrics, type CalculatedPaceMetrics } from "../../utils/paceMetrics";
import { escapeHtml } from "./html";
import type { PageRenderContext } from "./pageShell";

const DISTANCE_TYPES = ["500m", "777m", "1000m", "1500m", "3000m"] as const satisfies readonly PaceDistanceType[];
const PACE_STATUSES = ["draft", "completed", "reviewed", "archived"] as const satisfies readonly PaceSessionStatus[];

export function initializePaceMvp(root: HTMLElement, context: PageRenderContext): void {
  const paceLab = root.querySelector<HTMLElement>("[data-pace-lab]");

  if (paceLab && context.sessionId) {
    bindCreatePaceForm(root, context.sessionId);
    void loadPaceLab(root, context.sessionId);
  }

  const summaryContainer = root.querySelector<HTMLElement>("[data-session-pace-summary]");

  if (summaryContainer && context.sessionId) {
    void loadPaceSummary(summaryContainer, context.sessionId);
  }
}

function bindCreatePaceForm(root: HTMLElement, sessionId: string): void {
  const form = root.querySelector<HTMLFormElement>('form[data-pace-session-form][data-mode="create"]');

  if (!form) {
    return;
  }

  bindLapControls(form);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const context = await getAnalysisUserContext();
      const payload = buildCreatePayload(form, context, sessionId);
      setFormDisabled(form, true);
      setFormStatus(form, "Saving pace session...", "neutral");
      await createPaceSession(context, payload);
      resetCreateForm(form);
      setFormStatus(form, "Pace session saved.", "success");
      setFormDisabled(form, false);
      await loadPaceLab(root, sessionId);
    } catch (error) {
      setFormStatus(form, getErrorMessage(error), "error");
      setFormDisabled(form, false);
    }
  });
}

async function loadPaceLab(root: HTMLElement, sessionId: string): Promise<void> {
  const header = root.querySelector<HTMLElement>("[data-pace-session-header]");
  const container = root.querySelector<HTMLElement>("[data-pace-session-list]");

  if (!container) {
    return;
  }

  container.innerHTML = renderLoadingState("Loading pace sessions...");

  try {
    const context = await getAnalysisUserContext();
    const analysisSession = await getAnalysisSession(context, sessionId);

    if (!analysisSession) {
      if (header) {
        header.innerHTML = renderErrorState("Session not found", "The requested Analysis V1 session does not exist.");
      }

      container.innerHTML = renderEmptyState("No pace sessions available", "Create or open a valid Analysis Session before adding pace data.");
      return;
    }

    if (header) {
      header.innerHTML = renderPaceHeader(analysisSession.title, sessionId);
    }

    const paceSessions = await loadPaceSessions(context, sessionId);
    container.innerHTML = renderPaceSessions(paceSessions);
    bindPaceSessionActions(container, context, sessionId, root);
  } catch (error) {
    if (header) {
      header.innerHTML = renderErrorState("Unable to load session", getErrorMessage(error));
    }

    container.innerHTML = renderErrorState("Unable to load pace sessions", getErrorMessage(error));
  }
}

async function loadPaceSummary(container: HTMLElement, sessionId: string): Promise<void> {
  try {
    const context = await getAnalysisUserContext();
    const paceSessions = await loadPaceSessions(context, sessionId);
    container.innerHTML = renderPaceSummary(paceSessions, sessionId);
  } catch (error) {
    container.innerHTML = renderErrorState("Unable to load pace summary", getErrorMessage(error));
  }
}

async function loadPaceSessions(context: AnalysisUserContext, sessionId: string): Promise<PaceSession[]> {
  const paceSessions = await listPaceSessionsBySession(context, sessionId);
  return [...paceSessions].sort((first, second) => getTotalTime(first) - getTotalTime(second));
}

function bindPaceSessionActions(container: HTMLElement, context: AnalysisUserContext, sessionId: string, root: HTMLElement): void {
  container.querySelectorAll<HTMLFormElement>('form[data-pace-session-form][data-mode="edit"]')
    .forEach((form) => {
      bindLapControls(form);

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const paceSessionId = form.dataset.paceSessionId;

        if (!paceSessionId) {
          setFormStatus(form, "Missing pace session id.", "error");
          return;
        }

        try {
          const payload = buildUpdatePayload(form);
          setFormDisabled(form, true);
          setFormStatus(form, "Saving pace session...", "neutral");
          await updatePaceSession(context, paceSessionId, payload);
          setFormStatus(form, "Pace session saved.", "success");
          setFormDisabled(form, false);
          await loadPaceLab(root, sessionId);
        } catch (error) {
          setFormStatus(form, getErrorMessage(error), "error");
          setFormDisabled(form, false);
        }
      });
    });

  container.querySelectorAll<HTMLButtonElement>("[data-delete-pace-session-id]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        const paceSessionId = button.dataset.deletePaceSessionId;

        if (!paceSessionId) {
          return;
        }

        if (!window.confirm("Delete this pace session?")) {
          return;
        }

        button.disabled = true;

        try {
          await deletePaceSession(context, paceSessionId);
          await loadPaceLab(root, sessionId);
        } catch (error) {
          button.disabled = false;
          container.insertAdjacentHTML("afterbegin", renderErrorState("Unable to delete pace session", getErrorMessage(error)));
        }
      });
    });
}

function bindLapControls(form: HTMLFormElement): void {
  form.querySelectorAll<HTMLButtonElement>("[data-add-pace-lap]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        addLapRow(form);
      });
    });

  form.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>("[data-remove-pace-lap]") : null;

    if (!button) {
      return;
    }

    const rows = form.querySelectorAll<HTMLElement>("[data-pace-lap-row]");

    if (rows.length <= 1) {
      const input = button.closest<HTMLElement>("[data-pace-lap-row]")?.querySelector<HTMLInputElement>('input[name="lapTimesSeconds"]');

      if (input) {
        input.value = "";
      }

      return;
    }

    button.closest<HTMLElement>("[data-pace-lap-row]")?.remove();
    updateLapPlaceholders(form);
  });
}

function buildCreatePayload(
  form: HTMLFormElement,
  context: AnalysisUserContext,
  sessionId: string,
): CreatePaceSessionInput {
  const values = readPaceForm(form);

  return {
    ownerUserId: context.ownerUserId,
    athleteId: context.athleteId,
    sourceApp: "blaze-skate-analysis",
    schemaVersion: "skatingx-analysis-v1",
    sessionId,
    status: values.status,
    sourceType: "manual-entry",
    metrics: values.metrics,
    notes: values.notes,
  };
}

function buildUpdatePayload(form: HTMLFormElement): UpdatePaceSessionInput {
  const values = readPaceForm(form);

  return {
    status: values.status,
    metrics: values.metrics,
    notes: values.notes,
  };
}

function readPaceForm(form: HTMLFormElement): {
  readonly status: PaceSessionStatus;
  readonly metrics: CreatePaceSessionInput["metrics"];
  readonly notes: string;
} {
  const formData = new FormData(form);
  const distanceType = coerceDistanceType(String(formData.get("distanceType") ?? "500m"));
  const status = coerceStatus(String(formData.get("status") ?? "draft"));
  const notes = String(formData.get("notes") ?? "").trim();
  const lapTimesSeconds = formData
    .getAll("lapTimesSeconds")
    .map((value) => String(value).trim())
    .filter(Boolean)
    .map((value) => {
      const parsed = Number(value);

      if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error("Lap times must be positive numbers.");
      }

      return parsed;
    });

  return {
    status,
    metrics: calculatePaceMetrics(distanceType, lapTimesSeconds).paceMetrics,
    notes,
  };
}

function renderPaceHeader(title: string, sessionId: string): string {
  return `
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <p class="text-xs font-black uppercase tracking-[0.18em] text-skating-neon">Current Session</p>
        <h2 class="mt-2 text-xl font-black text-white">${escapeHtml(title)}</h2>
        <p class="mt-2 text-sm text-slate-400">Pace data is scoped to session ${escapeHtml(sessionId)}.</p>
      </div>
      <a data-analysis-link href="/analysis/sessions/${encodeURIComponent(sessionId)}" class="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-bold text-slate-200 hover:border-skating-pro transition-all">
        <i class="fa-solid fa-chart-line"></i>Session Overview
      </a>
    </div>
  `;
}

function renderPaceSessions(paceSessions: readonly PaceSession[]): string {
  if (paceSessions.length === 0) {
    return renderEmptyState("No pace sessions yet", "Add manual lap splits to calculate total time, lap range, standard deviation, and fade index.");
  }

  return `
    <div class="space-y-5">
      <div class="bg-skating-card border border-slate-700 rounded-2xl p-5 shadow-xl">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Pace Sessions</p>
            <h2 class="mt-1 text-2xl font-black text-white">${paceSessions.length} pace session${paceSessions.length === 1 ? "" : "s"}</h2>
          </div>
          <p class="text-sm text-slate-400">Sorted by total time</p>
        </div>
      </div>
      ${paceSessions.map(renderPaceSessionCard).join("")}
    </div>
  `;
}

function renderPaceSessionCard(paceSession: PaceSession): string {
  const calculated = calculatePaceMetrics(paceSession.metrics.distanceType, paceSession.metrics.splitTimesSeconds);

  return `
    <article class="bg-skating-card border border-slate-700 rounded-2xl p-5 shadow-xl">
      <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        <div>
          <h3 class="text-lg font-black text-white">${formatDistanceType(paceSession.metrics.distanceType)} Pace Session</h3>
          <p class="mt-1 text-sm text-slate-400">${paceSession.metrics.splitTimesSeconds.length} lap${paceSession.metrics.splitTimesSeconds.length === 1 ? "" : "s"} · ${escapeHtml(paceSession.notes || "No notes")}</p>
        </div>
        <span class="self-start rounded-full border border-skating-pro/40 bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-200">${formatStatus(paceSession.status)}</span>
      </div>
      ${renderMetricGrid(calculated)}
      ${renderLapList(paceSession.metrics.splitTimesSeconds)}
      <details class="mt-5 rounded-xl border border-slate-700 bg-slate-950 p-4">
        <summary class="cursor-pointer text-sm font-bold text-skating-neon">Edit pace session</summary>
        ${renderEditForm(paceSession)}
      </details>
      <div class="mt-4 flex justify-end">
        <button type="button" data-delete-pace-session-id="${escapeHtml(paceSession.id)}" class="inline-flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-200 hover:bg-red-500/20 transition-all">
          <i class="fa-solid fa-trash"></i>Delete
        </button>
      </div>
    </article>
  `;
}

function renderEditForm(paceSession: PaceSession): string {
  return `
    <form data-pace-session-form data-mode="edit" data-pace-session-id="${escapeHtml(paceSession.id)}" class="mt-4 space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        ${renderSelect("distanceType", "Distance", DISTANCE_TYPES, paceSession.metrics.distanceType, formatDistanceType)}
        ${renderSelect("status", "Status", PACE_STATUSES, paceSession.status, formatStatus)}
      </div>
      <div>
        <div class="flex items-center justify-between gap-3">
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-400">Lap Times</label>
          <button type="button" data-add-pace-lap class="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-200 hover:border-skating-pro transition-all">
            <i class="fa-solid fa-plus"></i>Add Lap
          </button>
        </div>
        <div data-pace-lap-list class="mt-2 space-y-2">
          ${paceSession.metrics.splitTimesSeconds.map((lapTime, index) => renderLapRow(index + 1, lapTime)).join("")}
        </div>
      </div>
      <div>
        <label class="block text-xs font-bold uppercase tracking-wider text-slate-400">Notes</label>
        <textarea name="notes" rows="3" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro">${escapeHtml(paceSession.notes ?? "")}</textarea>
      </div>
      <div class="flex flex-col sm:flex-row sm:items-center gap-3">
        <button type="submit" class="inline-flex items-center justify-center gap-2 bg-skating-pro hover:bg-purple-600 text-white font-bold rounded-xl px-5 py-3 transition-all">
          <i class="fa-solid fa-floppy-disk"></i>Save Pace Session
        </button>
        <p data-pace-form-status class="text-sm text-slate-400"></p>
      </div>
    </form>
  `;
}

function renderPaceSummary(paceSessions: readonly PaceSession[], sessionId: string): string {
  const latest = paceSessions[0];

  if (!latest) {
    return `
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.18em] text-skating-neon">Pace Summary</p>
          <h2 class="mt-2 text-xl font-black text-white">0 pace sessions linked to this session</h2>
          <p class="mt-2 text-sm text-slate-400">Add lap splits in Pace Lab to calculate manual pace metrics.</p>
        </div>
        <a data-analysis-link href="/analysis/sessions/${encodeURIComponent(sessionId)}/pace" class="inline-flex items-center justify-center gap-2 rounded-xl border border-skating-pro bg-purple-500/10 px-4 py-2 text-sm font-bold text-purple-200 hover:bg-purple-500/20 transition-all">
          <i class="fa-solid fa-stopwatch"></i>Open Pace Lab
        </a>
      </div>
    `;
  }

  const calculated = calculatePaceMetrics(latest.metrics.distanceType, latest.metrics.splitTimesSeconds);

  return `
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <p class="text-xs font-black uppercase tracking-[0.18em] text-skating-neon">Pace Summary</p>
        <h2 class="mt-2 text-xl font-black text-white">${paceSessions.length} pace session${paceSessions.length === 1 ? "" : "s"} linked to this session</h2>
        <p class="mt-2 text-sm text-slate-400">Best total: ${formatSeconds(calculated.totalTimeSeconds)} · Avg lap: ${formatSeconds(calculated.averageLapTimeSeconds)} · Fade: ${formatPercent(calculated.fadeIndexPercent)}</p>
      </div>
      <a data-analysis-link href="/analysis/sessions/${encodeURIComponent(sessionId)}/pace" class="inline-flex items-center justify-center gap-2 rounded-xl border border-skating-pro bg-purple-500/10 px-4 py-2 text-sm font-bold text-purple-200 hover:bg-purple-500/20 transition-all">
        <i class="fa-solid fa-stopwatch"></i>Open Pace Lab
      </a>
    </div>
  `;
}

function renderMetricGrid(calculated: CalculatedPaceMetrics): string {
  const metrics = [
    { label: "Total Time", value: formatSeconds(calculated.totalTimeSeconds) },
    { label: "Average Lap", value: formatSeconds(calculated.averageLapTimeSeconds) },
    { label: "Fastest Lap", value: formatSeconds(calculated.fastestLapSeconds) },
    { label: "Slowest Lap", value: formatSeconds(calculated.slowestLapSeconds) },
    { label: "Lap Range", value: formatSeconds(calculated.lapTimeRangeSeconds) },
    { label: "Lap Std Dev", value: formatSeconds(calculated.lapTimeStdDevSeconds) },
    { label: "Fade Index", value: formatPercent(calculated.fadeIndexPercent) },
  ];

  return `
    <div class="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
      ${metrics.map((metric) => `
        <div class="rounded-xl border border-slate-700 bg-slate-950 p-3">
          <p class="text-xs font-bold uppercase tracking-wider text-slate-500">${metric.label}</p>
          <p class="mt-1 text-sm font-black text-slate-100">${metric.value}</p>
        </div>
      `).join("")}
    </div>
  `;
}

function renderLapList(lapTimesSeconds: readonly number[]): string {
  return `
    <div class="mt-4">
      <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Laps</p>
      <div class="mt-2 flex flex-wrap gap-2">
        ${lapTimesSeconds.map((lapTime, index) => `<span class="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-bold text-slate-300">Lap ${index + 1}: ${formatSeconds(lapTime)}</span>`).join("")}
      </div>
    </div>
  `;
}

function renderLapRow(lapNumber: number, value: number | string = ""): string {
  return `
    <div data-pace-lap-row class="flex items-center gap-2">
      <input name="lapTimesSeconds" type="number" min="0.01" step="0.01" required placeholder="Lap ${lapNumber} seconds" value="${escapeHtml(String(value))}" class="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro">
      <button type="button" data-remove-pace-lap class="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-400 hover:text-red-200 hover:border-red-500/40 transition-all" aria-label="Remove lap">
        <i class="fa-solid fa-minus"></i>
      </button>
    </div>
  `;
}

function renderSelect<T extends string>(
  name: string,
  label: string,
  values: readonly T[],
  selectedValue: T,
  format: (value: T) => string,
): string {
  return `
    <div>
      <label class="block text-xs font-bold uppercase tracking-wider text-slate-400">${escapeHtml(label)}</label>
      <select name="${escapeHtml(name)}" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro">
        ${values.map((value) => `<option value="${escapeHtml(value)}" ${value === selectedValue ? "selected" : ""}>${escapeHtml(format(value))}</option>`).join("")}
      </select>
    </div>
  `;
}

function addLapRow(form: HTMLFormElement): void {
  const list = form.querySelector<HTMLElement>("[data-pace-lap-list]");

  if (!list) {
    return;
  }

  list.insertAdjacentHTML("beforeend", renderLapRow(list.querySelectorAll("[data-pace-lap-row]").length + 1));
}

function updateLapPlaceholders(form: HTMLFormElement): void {
  form.querySelectorAll<HTMLInputElement>('input[name="lapTimesSeconds"]')
    .forEach((input, index) => {
      input.placeholder = `Lap ${index + 1} seconds`;
    });
}

function resetCreateForm(form: HTMLFormElement): void {
  form.reset();
  const list = form.querySelector<HTMLElement>("[data-pace-lap-list]");

  if (list) {
    list.innerHTML = renderLapRow(1);
  }
}

function renderLoadingState(message: string): string {
  return `
    <div class="bg-skating-card border border-slate-700 rounded-2xl p-6 shadow-xl text-sm text-slate-400">
      <i class="fa-solid fa-spinner"></i>
      <span class="ml-2">${escapeHtml(message)}</span>
    </div>
  `;
}

function renderEmptyState(title: string, description: string): string {
  return `
    <div class="bg-skating-card/50 border border-dashed border-slate-700 rounded-2xl p-10 text-center">
      <div class="mx-auto w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 text-xl">
        <i class="fa-solid fa-stopwatch"></i>
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

function setFormDisabled(form: HTMLFormElement, disabled: boolean): void {
  form.querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("button,input,select,textarea")
    .forEach((field) => {
      field.disabled = disabled;
    });
}

function setFormStatus(form: HTMLFormElement, message: string, tone: "neutral" | "success" | "error"): void {
  const status = form.querySelector<HTMLElement>("[data-pace-form-status]");

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

function coerceDistanceType(value: string): PaceDistanceType {
  return DISTANCE_TYPES.includes(value as PaceDistanceType) ? value as PaceDistanceType : "500m";
}

function coerceStatus(value: string): PaceSessionStatus {
  return PACE_STATUSES.includes(value as PaceSessionStatus) ? value as PaceSessionStatus : "draft";
}

function formatDistanceType(distanceType: PaceDistanceType): string {
  return distanceType;
}

function formatStatus(status: PaceSessionStatus): string {
  const labels = {
    draft: "Draft",
    completed: "Completed",
    reviewed: "Reviewed",
    archived: "Archived",
  } as const;

  return labels[status];
}

function getTotalTime(paceSession: PaceSession): number {
  return paceSession.metrics.totalTimeSeconds;
}

function formatSeconds(value: number): string {
  return `${Math.round(value * 100) / 100}s`;
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100) / 100}%`;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected Pace Lab error.";
}
