import { getAnalysisUserContext, type AnalysisUserContext } from "../../firebase/auth";
import {
  getAnalysisReportBySession,
  getEquipmentSnapshotBySession,
  listAnalysisSessionsByAthlete,
  listFindingsBySession,
  listPaceSessionsBySession,
} from "../../services/analysisFirestoreService";
import type {
  AnalysisReport,
  AnalysisSession,
  AnalysisTimestamp,
  BiomechanicsFinding,
  EquipmentSnapshot,
  PaceSession,
} from "../../types/analysis";
import { calculatePaceMetrics } from "../../utils/paceMetrics";
import { escapeAttribute, escapeHtml } from "./html";
import type { PageRenderContext } from "./pageShell";

const DASHBOARD_SESSION_LIMIT = 10;

interface DashboardData {
  readonly sessions: readonly AnalysisSession[];
  readonly scopedSessions: readonly AnalysisSession[];
  readonly latestSession?: AnalysisSession;
  readonly openFindings: readonly BiomechanicsFinding[];
  readonly latestPaceSession?: PaceSession;
  readonly latestEquipmentSnapshot: EquipmentSnapshot | null;
  readonly latestReport: AnalysisReport | null;
}

export function initializeDashboardMvp(root: HTMLElement, _context: PageRenderContext): void {
  if (!root.querySelector("[data-analysis-dashboard]")) {
    return;
  }

  void loadDashboard(root);
}

async function loadDashboard(root: HTMLElement): Promise<void> {
  const quickActions = root.querySelector<HTMLElement>("[data-dashboard-quick-actions]");
  const metrics = root.querySelector<HTMLElement>("[data-dashboard-metrics]");
  const workflow = root.querySelector<HTMLElement>("[data-dashboard-latest-workflow]");
  const recentList = root.querySelector<HTMLElement>("[data-dashboard-recent-list]");

  try {
    const context = await getAnalysisUserContext();
    const data = await loadDashboardData(context);

    if (quickActions) {
      quickActions.innerHTML = renderQuickActions(data.latestSession);
    }

    if (metrics) {
      metrics.innerHTML = renderDashboardMetrics(data);
    }

    if (workflow) {
      workflow.innerHTML = renderLatestWorkflow(data);
    }

    if (recentList) {
      recentList.innerHTML = renderRecentSessions(data.sessions.slice(0, 5));
    }
  } catch (error) {
    const message = getErrorMessage(error);

    if (quickActions) {
      quickActions.innerHTML = renderErrorState("Unable to load dashboard actions", message);
    }

    if (metrics) {
      metrics.innerHTML = renderErrorState("Unable to load dashboard metrics", message);
    }

    if (workflow) {
      workflow.innerHTML = renderErrorState("Unable to load workflow summary", message);
    }

    if (recentList) {
      recentList.innerHTML = renderErrorState("Unable to load recent sessions", message);
    }
  }
}

async function loadDashboardData(context: AnalysisUserContext): Promise<DashboardData> {
  const sessions = await listAnalysisSessionsByAthlete(context, context.athleteId);
  const sortedSessions = [...sessions]
    .filter((session) => session.status !== "archived")
    .sort((first, second) => getTimestampMs(second.startedAt) - getTimestampMs(first.startedAt));
  const scopedSessions = sortedSessions.slice(0, DASHBOARD_SESSION_LIMIT);
  const latestSession = sortedSessions[0];
  const findingsBySession = await Promise.all(scopedSessions.map((session) => listFindingsBySession(context, session.id)));
  const openFindings = findingsBySession.flat().filter((finding) => finding.status === "open");

  if (!latestSession) {
    return {
      sessions: sortedSessions,
      scopedSessions,
      openFindings,
      latestEquipmentSnapshot: null,
      latestReport: null,
    };
  }

  const [paceSessions, equipmentSnapshot, report] = await Promise.all([
    listPaceSessionsBySession(context, latestSession.id),
    getEquipmentSnapshotBySession(context, latestSession.id),
    getAnalysisReportBySession(context, latestSession.id),
  ]);
  const latestPaceSession = [...paceSessions].sort((first, second) => first.metrics.totalTimeSeconds - second.metrics.totalTimeSeconds)[0];

  return {
    sessions: sortedSessions,
    scopedSessions,
    latestSession,
    openFindings,
    ...(latestPaceSession ? { latestPaceSession } : {}),
    latestEquipmentSnapshot: equipmentSnapshot,
    latestReport: report,
  };
}

function renderQuickActions(latestSession: AnalysisSession | undefined): string {
  return `
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <p class="text-xs font-black uppercase tracking-[0.18em] text-skating-neon">Next Actions</p>
        <h2 class="mt-2 text-xl font-black text-white">Start or continue an Analysis V1 workflow</h2>
        <p class="mt-2 text-sm text-slate-400">Use one session as the anchor, then move through Biomechanics, Pace, Equipment, and Report.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <a data-analysis-link href="/analysis/sessions/new" class="inline-flex items-center justify-center gap-2 bg-skating-pro hover:bg-purple-600 text-white font-bold rounded-xl px-4 py-2 transition-all">
          <i class="fa-solid fa-plus"></i>New Session
        </a>
        <a data-analysis-link href="/analysis/sessions" class="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-bold text-slate-200 hover:border-skating-pro transition-all">
          <i class="fa-solid fa-list"></i>View Sessions
        </a>
        ${latestSession ? `
          <a data-analysis-link href="/analysis/sessions/${encodeURIComponent(latestSession.id)}" class="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-200 hover:bg-emerald-500/20 transition-all">
            <i class="fa-solid fa-arrow-up-right-from-square"></i>Open Latest Session
          </a>
        ` : ""}
      </div>
    </div>
  `;
}

function renderDashboardMetrics(data: DashboardData): string {
  const paceLabel = data.latestPaceSession
    ? formatSeconds(calculatePaceMetrics(data.latestPaceSession.metrics.distanceType, data.latestPaceSession.metrics.splitTimesSeconds).totalTimeSeconds)
    : "None";
  const equipmentLabel = data.latestEquipmentSnapshot ? "Recorded" : "Missing";
  const reportLabel = data.latestReport ? formatReportStatus(data.latestReport.status) : "Missing";

  return [
    renderMetric("Active Sessions", String(data.sessions.length), "Archived sessions are hidden", "fa-layer-group"),
    renderMetric(
      "Recent Open Findings",
      String(data.openFindings.length),
      `Open biomechanics findings in latest ${data.scopedSessions.length} session${data.scopedSessions.length === 1 ? "" : "s"}`,
      "fa-microscope",
    ),
    renderMetric("Latest Pace", paceLabel, data.latestPaceSession ? data.latestPaceSession.metrics.distanceType : "No pace data", "fa-stopwatch"),
    renderMetric("Equipment", equipmentLabel, data.latestEquipmentSnapshot ? getEquipmentLabel(data.latestEquipmentSnapshot) : "No snapshot", "fa-screwdriver-wrench"),
    renderMetric("Report", reportLabel, data.latestReport ? "Latest session report" : "No saved report", "fa-file-lines"),
  ].join("");
}

function renderLatestWorkflow(data: DashboardData): string {
  if (!data.latestSession) {
    return renderEmptyState(
      "No active Analysis V1 workflow yet",
      "Create a session to unlock the Biomechanics, Pace, Equipment, and Report workflow. Archived sessions are hidden from this dashboard.",
      "fa-route",
    );
  }

  const sessionId = encodeURIComponent(data.latestSession.id);

  return `
    <div class="space-y-4">
      <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.18em] text-skating-neon">Latest Session</p>
          <h2 class="mt-2 text-2xl font-black text-white">${escapeHtml(data.latestSession.title)}</h2>
          <p class="mt-2 text-sm text-slate-400">${formatDate(data.latestSession.startedAt)} · ${formatSessionStatus(data.latestSession.status)} · ${escapeHtml(data.latestSession.summary || "No session summary yet.")}</p>
        </div>
        <a data-analysis-link href="/analysis/sessions/${sessionId}" class="inline-flex items-center justify-center gap-2 rounded-xl border border-skating-pro bg-purple-500/10 px-4 py-2 text-sm font-bold text-purple-200 hover:bg-purple-500/20 transition-all">
          <i class="fa-solid fa-chart-line"></i>Session Overview
        </a>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        ${renderWorkflowStep("Biomechanics", `${data.openFindings.length} recent open`, `/analysis/sessions/${sessionId}/biomechanics`, "fa-microscope")}
        ${renderWorkflowStep("Pace", data.latestPaceSession ? formatSeconds(data.latestPaceSession.metrics.totalTimeSeconds) : "No data", `/analysis/sessions/${sessionId}/pace`, "fa-stopwatch")}
        ${renderWorkflowStep("Equipment", data.latestEquipmentSnapshot ? getEquipmentLabel(data.latestEquipmentSnapshot) : "No snapshot", `/analysis/sessions/${sessionId}/equipment`, "fa-screwdriver-wrench")}
        ${renderWorkflowStep("Report", data.latestReport ? formatReportStatus(data.latestReport.status) : "No report", `/analysis/sessions/${sessionId}/report`, "fa-file-lines")}
      </div>
    </div>
  `;
}

function renderRecentSessions(sessions: readonly AnalysisSession[]): string {
  if (sessions.length === 0) {
    return renderEmptyState("No recent active sessions", "Create the first Analysis V1 session to populate this dashboard. Archived sessions are hidden.", "fa-layer-group");
  }

  return `
    <div class="space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.18em] text-skating-neon">Recent Sessions</p>
          <h2 class="mt-2 text-xl font-black text-white">Continue recent active analysis work</h2>
        </div>
        <a data-analysis-link href="/analysis/sessions" class="text-sm font-bold text-skating-neon hover:text-white transition-colors">View all sessions</a>
      </div>
      <div class="grid grid-cols-1 gap-3">
        ${sessions.map(renderRecentSessionCard).join("")}
      </div>
    </div>
  `;
}

function renderRecentSessionCard(session: AnalysisSession): string {
  return `
    <a data-analysis-link href="/analysis/sessions/${encodeURIComponent(session.id)}" class="block rounded-xl border border-slate-700 bg-slate-950 p-4 hover:border-skating-pro transition-all">
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div>
          <h3 class="text-base font-black text-white">${escapeHtml(session.title)}</h3>
          <p class="mt-1 text-sm text-slate-400">${formatDate(session.startedAt)} · ${formatSessionStatus(session.status)}</p>
        </div>
        <span class="self-start rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-bold text-slate-300">${escapeHtml(session.category)}</span>
      </div>
    </a>
  `;
}

function renderMetric(label: string, value: string, hint: string, icon: string): string {
  return `
    <div class="bg-skating-card border border-slate-700 rounded-2xl p-5 shadow-xl">
      <div class="flex items-center justify-between gap-3">
        <p class="text-xs font-bold uppercase tracking-wider text-slate-400">${escapeHtml(label)}</p>
        <i class="fa-solid ${escapeAttribute(icon)} text-skating-pro"></i>
      </div>
      <p class="mt-3 text-2xl font-black text-white truncate">${escapeHtml(value)}</p>
      <p class="mt-2 text-xs text-slate-500 truncate">${escapeHtml(hint)}</p>
    </div>
  `;
}

function renderWorkflowStep(label: string, value: string, href: string, icon: string): string {
  return `
    <a data-analysis-link href="${escapeAttribute(href)}" class="rounded-xl border border-slate-700 bg-slate-950 p-4 hover:border-skating-pro transition-all">
      <div class="flex items-center justify-between gap-3">
        <p class="text-xs font-bold uppercase tracking-wider text-slate-500">${escapeHtml(label)}</p>
        <i class="fa-solid ${escapeAttribute(icon)} text-skating-pro"></i>
      </div>
      <p class="mt-2 text-sm font-black text-slate-100 truncate">${escapeHtml(value)}</p>
    </a>
  `;
}

function renderEmptyState(title: string, description: string, icon: string): string {
  return `
    <div class="border border-dashed border-slate-700 rounded-2xl p-8 text-center">
      <div class="mx-auto w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 text-xl">
        <i class="fa-solid ${escapeAttribute(icon)}"></i>
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

function getEquipmentLabel(snapshot: EquipmentSnapshot): string {
  const label = snapshot.setupName
    ?? [snapshot.boot?.model ?? snapshot.bootModel, snapshot.blade?.model ?? snapshot.bladeModel].filter(Boolean).join(" / ");

  return label || "Equipment recorded";
}

function formatReportStatus(status: AnalysisReport["status"]): string {
  const labels = {
    draft: "Draft",
    generated: "Generated",
    reviewed: "Final",
    shared: "Shared",
    archived: "Archived",
  } as const;

  return labels[status];
}

function formatSessionStatus(status: AnalysisSession["status"]): string {
  const labels = {
    draft: "Draft",
    processing: "Processing",
    ready: "Ready",
    reviewed: "Reviewed",
    archived: "Archived",
  } as const;

  return labels[status];
}

function formatDate(value: AnalysisTimestamp): string {
  const date = toDate(value);
  return date ? date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Unknown date";
}

function getTimestampMs(value: AnalysisTimestamp): number {
  return toDate(value)?.getTime() ?? 0;
}

function toDate(value: AnalysisTimestamp): Date | null {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "number") {
    return new Date(value);
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return value.toDate();
}

function formatSeconds(value: number): string {
  return `${Math.round(value * 100) / 100}s`;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected Analysis Dashboard error.";
}
