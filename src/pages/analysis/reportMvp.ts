import { getAnalysisUserContext, type AnalysisUserContext } from "../../firebase/auth";
import {
  createAnalysisReport,
  getAnalysisReportBySession,
  getAnalysisSession,
  getEquipmentSnapshotBySession,
  listFindingsBySession,
  listPaceSessionsBySession,
  updateAnalysisReport,
  type CreateAnalysisReportInput,
  type UpdateAnalysisReportInput,
} from "../../services/analysisFirestoreService";
import type { AnalysisReport, AnalysisReportStatus, BiomechanicsFinding, EquipmentSnapshot, PaceSession } from "../../types/analysis";
import {
  generateAnalysisReportDraft,
  renderAnalysisReportMarkdown,
  type EditableReportFields,
  type GeneratedReportDraft,
  type ReportSourceData,
} from "../../utils/analysisReportGenerator";
import type { PageRenderContext } from "./pageShell";

interface ReportPageState {
  readonly context: AnalysisUserContext;
  readonly source: ReportSourceData;
  readonly generatedDraft: GeneratedReportDraft;
  readonly savedReport: AnalysisReport | null;
}

const reportStates = new WeakMap<HTMLElement, ReportPageState>();

export function initializeReportMvp(root: HTMLElement, context: PageRenderContext): void {
  const reportContainer = root.querySelector<HTMLElement>("[data-analysis-report-mvp]");

  if (reportContainer && context.sessionId) {
    bindReportForm(root, context.sessionId);
    void loadReportPage(root, context.sessionId);
  }

  const summaryContainer = root.querySelector<HTMLElement>("[data-session-report-summary]");

  if (summaryContainer && context.sessionId) {
    void loadReportSummary(summaryContainer, context.sessionId);
  }
}

function bindReportForm(root: HTMLElement, sessionId: string): void {
  const form = root.querySelector<HTMLFormElement>("form[data-analysis-report-form]");

  if (!form) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await saveReport(root, sessionId, "draft");
  });

  root.querySelector<HTMLButtonElement>("[data-generate-report-draft]")?.addEventListener("click", () => {
    const state = reportStates.get(root);

    if (!state) {
      setFormStatus(form, "Report source data is still loading.", "error");
      return;
    }

    populateReportForm(root, state.generatedDraft, null);
    setFormStatus(form, "Draft regenerated from current lab data.", "success");
  });

  root.querySelector<HTMLButtonElement>("[data-finalize-report]")?.addEventListener("click", async () => {
    await saveReport(root, sessionId, "reviewed");
  });

  root.querySelector<HTMLButtonElement>("[data-copy-report-markdown]")?.addEventListener("click", async () => {
    const markdown = root.querySelector<HTMLTextAreaElement>("[data-report-markdown]")?.value ?? "";

    if (!markdown) {
      return;
    }

    try {
      await navigator.clipboard.writeText(markdown);
      setFormStatus(form, "Markdown copied.", "success");
    } catch {
      const exportField = root.querySelector<HTMLTextAreaElement>("[data-report-markdown]");
      exportField?.select();
      document.execCommand("copy");
      setFormStatus(form, "Markdown selected and copied if clipboard fallback is available.", "neutral");
    }
  });

  form.addEventListener("input", () => {
    refreshMarkdownExport(root);
  });
}

async function loadReportPage(root: HTMLElement, sessionId: string): Promise<void> {
  const header = root.querySelector<HTMLElement>("[data-report-session-header]");
  const sourceSummary = root.querySelector<HTMLElement>("[data-report-source-summary]");
  const form = root.querySelector<HTMLFormElement>("form[data-analysis-report-form]");

  if (!sourceSummary || !form) {
    return;
  }

  sourceSummary.innerHTML = renderLoadingState("Loading report source data...");
  setFormDisabled(form, true);

  try {
    const context = await getAnalysisUserContext();
    const session = await getAnalysisSession(context, sessionId);

    if (!session) {
      if (header) {
        header.innerHTML = renderErrorState("Session not found", "The requested Analysis V1 session does not exist.");
      }

      sourceSummary.innerHTML = renderEmptyState("No report source available", "Create or open a valid Analysis Session before generating a report.");
      return;
    }

    const [findings, paceSessions, equipmentSnapshot, savedReport] = await Promise.all([
      listFindingsBySession(context, sessionId),
      listPaceSessionsBySession(context, sessionId),
      getEquipmentSnapshotBySession(context, sessionId),
      getAnalysisReportBySession(context, sessionId),
    ]);

    const source: ReportSourceData = {
      session,
      findings: sortFindings(findings),
      paceSessions: sortPaceSessions(paceSessions),
      equipmentSnapshot,
    };
    const generatedDraft = generateAnalysisReportDraft(source);

    reportStates.set(root, {
      context,
      source,
      generatedDraft,
      savedReport,
    });

    if (header) {
      header.innerHTML = renderReportHeader(session.title, sessionId);
    }

    sourceSummary.innerHTML = renderSourceSummary(source, savedReport);
    populateReportForm(root, savedReport ?? generatedDraft, savedReport);
    setFormDisabled(form, false);
  } catch (error) {
    if (header) {
      header.innerHTML = renderErrorState("Unable to load report", getErrorMessage(error));
    }

    sourceSummary.innerHTML = renderErrorState("Unable to load report source data", getErrorMessage(error));
    setFormDisabled(form, false);
  }
}

async function loadReportSummary(container: HTMLElement, sessionId: string): Promise<void> {
  try {
    const context = await getAnalysisUserContext();
    const report = await getAnalysisReportBySession(context, sessionId);
    container.innerHTML = renderReportSummary(report, sessionId);
  } catch (error) {
    container.innerHTML = renderErrorState("Unable to load report summary", getErrorMessage(error));
  }
}

async function saveReport(root: HTMLElement, sessionId: string, status: AnalysisReportStatus): Promise<void> {
  const state = reportStates.get(root);
  const form = root.querySelector<HTMLFormElement>("form[data-analysis-report-form]");

  if (!state || !form) {
    return;
  }

  const fields = readReportForm(form);
  const payload = buildReportPayload(state, fields, status);

  try {
    setFormDisabled(form, true);
    setFormStatus(form, status === "reviewed" ? "Marking report final..." : "Saving draft report...", "neutral");

    if (state.savedReport) {
      await updateAnalysisReport(state.context, state.savedReport.id, payload);
    } else {
      await createAnalysisReport(state.context, {
        ...payload,
        ownerUserId: state.context.ownerUserId,
        athleteId: state.context.athleteId,
        sourceApp: "blaze-skate-analysis",
        schemaVersion: "skatingx-analysis-v1",
        sessionId,
        sourceType: "computed-summary",
      });
    }

    setFormStatus(form, status === "reviewed" ? "Report marked final." : "Draft report saved.", "success");
    await loadReportPage(root, sessionId);
  } catch (error) {
    setFormStatus(form, getErrorMessage(error), "error");
    setFormDisabled(form, false);
  }
}

function buildReportPayload(
  state: ReportPageState,
  fields: EditableReportFields,
  status: AnalysisReportStatus,
): UpdateAnalysisReportInput & Omit<CreateAnalysisReportInput, "ownerUserId" | "athleteId" | "sourceApp" | "schemaVersion" | "sessionId" | "sourceType"> {
  return {
    title: fields.title,
    summary: fields.summary,
    status,
    categories: state.generatedDraft.categories,
    findingIds: state.generatedDraft.findingIds,
    videoIds: state.generatedDraft.videoIds,
    keyRecommendations: fields.keyRecommendations,
    generatedAt: state.savedReport?.generatedAt ?? new Date(),
    ...(state.generatedDraft.paceSessionId ? { paceSessionId: state.generatedDraft.paceSessionId } : {}),
    ...(state.generatedDraft.equipmentSnapshotId ? { equipmentSnapshotId: state.generatedDraft.equipmentSnapshotId } : {}),
    ...(status === "reviewed" ? { reviewedAt: new Date(), reviewerUserId: state.context.ownerUserId } : {}),
  };
}

function populateReportForm(root: HTMLElement, report: AnalysisReport | GeneratedReportDraft, savedReport: AnalysisReport | null): void {
  const form = root.querySelector<HTMLFormElement>("form[data-analysis-report-form]");

  if (!form) {
    return;
  }

  form.dataset.reportId = savedReport?.id ?? "";
  setNamedField(form, "title", report.title);
  setNamedField(form, "summary", report.summary);
  setNamedField(form, "keyRecommendations", report.keyRecommendations.join("\n"));
  setStatusBadge(root, savedReport?.status ?? "draft");
  refreshMarkdownExport(root);
}

function refreshMarkdownExport(root: HTMLElement): void {
  const state = reportStates.get(root);
  const form = root.querySelector<HTMLFormElement>("form[data-analysis-report-form]");
  const exportField = root.querySelector<HTMLTextAreaElement>("[data-report-markdown]");

  if (!state || !form || !exportField) {
    return;
  }

  exportField.value = renderAnalysisReportMarkdown(state.source, readReportForm(form));
}

function readReportForm(form: HTMLFormElement): EditableReportFields {
  const title = getNamedFieldValue(form, "title").trim();
  const summary = getNamedFieldValue(form, "summary").trim();
  const keyRecommendations = splitLines(getNamedFieldValue(form, "keyRecommendations"));

  if (!title) {
    throw new Error("Report title is required.");
  }

  if (!summary) {
    throw new Error("Report summary is required.");
  }

  return {
    title,
    summary,
    keyRecommendations,
  };
}

function renderReportHeader(title: string, sessionId: string): string {
  return `
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <p class="text-xs font-black uppercase tracking-[0.18em] text-skating-neon">Current Session</p>
        <h2 class="mt-2 text-xl font-black text-white">${escapeHtml(title)}</h2>
        <p class="mt-2 text-sm text-slate-400">Report data is scoped to session ${escapeHtml(sessionId)}.</p>
      </div>
      <a data-analysis-link href="/analysis/sessions/${encodeURIComponent(sessionId)}" class="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-bold text-slate-200 hover:border-skating-pro transition-all">
        <i class="fa-solid fa-chart-line"></i>Session Overview
      </a>
    </div>
  `;
}

function renderSourceSummary(source: ReportSourceData, savedReport: AnalysisReport | null): string {
  const reportStatus = savedReport ? formatReportStatus(savedReport.status) : "Unsaved generated draft";

  return `
    <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
      ${renderMetricTile("Biomechanics", `${source.findings.length}`, "findings")}
      ${renderMetricTile("Pace", `${source.paceSessions.length}`, "sessions")}
      ${renderMetricTile("Equipment", source.equipmentSnapshot ? "1" : "0", "snapshot")}
      ${renderMetricTile("Report", reportStatus, "status")}
    </div>
  `;
}

function renderReportSummary(report: AnalysisReport | null, sessionId: string): string {
  if (!report) {
    return `
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.18em] text-skating-neon">Report Summary</p>
          <h2 class="mt-2 text-xl font-black text-white">No saved report yet</h2>
          <p class="mt-2 text-sm text-slate-400">Generate a deterministic draft from session lab data.</p>
        </div>
        <a data-analysis-link href="/analysis/sessions/${encodeURIComponent(sessionId)}/report" class="inline-flex items-center justify-center gap-2 rounded-xl border border-skating-pro bg-purple-500/10 px-4 py-2 text-sm font-bold text-purple-200 hover:bg-purple-500/20 transition-all">
          <i class="fa-solid fa-file-lines"></i>Open Report
        </a>
      </div>
    `;
  }

  return `
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <p class="text-xs font-black uppercase tracking-[0.18em] text-skating-neon">Report Summary</p>
        <h2 class="mt-2 text-xl font-black text-white">${escapeHtml(report.title)}</h2>
        <p class="mt-2 text-sm text-slate-400">Status: ${escapeHtml(formatReportStatus(report.status))} · Recommendations: ${report.keyRecommendations.length}</p>
      </div>
      <a data-analysis-link href="/analysis/sessions/${encodeURIComponent(sessionId)}/report" class="inline-flex items-center justify-center gap-2 rounded-xl border border-skating-pro bg-purple-500/10 px-4 py-2 text-sm font-bold text-purple-200 hover:bg-purple-500/20 transition-all">
        <i class="fa-solid fa-file-lines"></i>Open Report
      </a>
    </div>
  `;
}

function renderMetricTile(label: string, value: string, hint: string): string {
  return `
    <div class="rounded-xl border border-slate-700 bg-slate-950 p-4">
      <p class="text-xs font-bold uppercase tracking-wider text-slate-500">${escapeHtml(label)}</p>
      <p class="mt-2 text-2xl font-black text-white">${escapeHtml(value)}</p>
      <p class="mt-1 text-xs text-slate-500">${escapeHtml(hint)}</p>
    </div>
  `;
}

function renderLoadingState(message: string): string {
  return `
    <div class="text-sm text-slate-400">
      <i class="fa-solid fa-spinner"></i>
      <span class="ml-2">${escapeHtml(message)}</span>
    </div>
  `;
}

function renderEmptyState(title: string, description: string): string {
  return `
    <div class="border border-dashed border-slate-700 rounded-2xl p-8 text-center">
      <div class="mx-auto w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 text-xl">
        <i class="fa-solid fa-file-lines"></i>
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

function setStatusBadge(root: HTMLElement, status: AnalysisReportStatus): void {
  const badge = root.querySelector<HTMLElement>("[data-report-status-badge]");

  if (!badge) {
    return;
  }

  const isFinal = status === "reviewed" || status === "shared";
  badge.className = isFinal
    ? "rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-200"
    : "rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-bold text-slate-300";
  badge.textContent = formatReportStatus(status);
}

function setNamedField(form: HTMLFormElement, name: string, value: string): void {
  const field = form.elements.namedItem(name);

  if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
    field.value = value;
  }
}

function getNamedFieldValue(form: HTMLFormElement, name: string): string {
  const field = form.elements.namedItem(name);

  if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
    return field.value;
  }

  return "";
}

function setFormDisabled(form: HTMLFormElement, disabled: boolean): void {
  form.querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLTextAreaElement>("button,input,textarea")
    .forEach((field) => {
      field.disabled = disabled;
    });
}

function setFormStatus(form: HTMLFormElement, message: string, tone: "neutral" | "success" | "error"): void {
  const status = form.querySelector<HTMLElement>("[data-report-form-status]");

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

function splitLines(value: string): readonly string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function sortFindings(findings: readonly BiomechanicsFinding[]): BiomechanicsFinding[] {
  return [...findings].sort((first, second) => severityRank(second.severity) - severityRank(first.severity));
}

function sortPaceSessions(paceSessions: readonly PaceSession[]): PaceSession[] {
  return [...paceSessions].sort((first, second) => first.metrics.totalTimeSeconds - second.metrics.totalTimeSeconds);
}

function severityRank(severity: BiomechanicsFinding["severity"]): number {
  const ranks = {
    info: 0,
    low: 1,
    medium: 2,
    high: 3,
  } as const;

  return ranks[severity];
}

function formatReportStatus(status: AnalysisReportStatus): string {
  const labels = {
    draft: "Draft",
    generated: "Generated",
    reviewed: "Final",
    shared: "Shared",
    archived: "Archived",
  } as const;

  return labels[status];
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected Analysis Report error.";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
