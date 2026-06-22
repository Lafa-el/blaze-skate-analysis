import { renderPageShell, renderSessionTabs, type PageRenderContext } from "./pageShell";

export function AnalysisSessionDetailPage(context: PageRenderContext): string {
  const sessionId = context.sessionId ?? "unknown";

  return renderPageShell({
    eyebrow: "Session",
    title: "Session Overview",
    description: `Session ID: ${sessionId}. Edit the core session metadata before adding lab data.`,
    actions: [{ label: "All Sessions", href: "/analysis/sessions", icon: "fa-list", tone: "neutral" }],
    content: `
      ${renderSessionTabs(sessionId, "overview")}
      <div data-session-findings-summary data-session-id="${sessionId}" class="bg-skating-card border border-slate-700 rounded-2xl p-5 shadow-xl">
        <div class="flex items-center gap-3 text-sm text-slate-400">
          <i class="fa-solid fa-spinner"></i>
          <span>Loading biomechanics summary...</span>
        </div>
      </div>
      <div data-session-pace-summary data-session-id="${sessionId}" class="bg-skating-card border border-slate-700 rounded-2xl p-5 shadow-xl">
        <div class="flex items-center gap-3 text-sm text-slate-400">
          <i class="fa-solid fa-spinner"></i>
          <span>Loading pace summary...</span>
        </div>
      </div>
      <div data-session-equipment-summary data-session-id="${sessionId}" class="bg-skating-card border border-slate-700 rounded-2xl p-5 shadow-xl">
        <div class="flex items-center gap-3 text-sm text-slate-400">
          <i class="fa-solid fa-spinner"></i>
          <span>Loading equipment summary...</span>
        </div>
      </div>
      <div data-session-report-summary data-session-id="${sessionId}" class="bg-skating-card border border-slate-700 rounded-2xl p-5 shadow-xl">
        <div class="flex items-center gap-3 text-sm text-slate-400">
          <i class="fa-solid fa-spinner"></i>
          <span>Loading report summary...</span>
        </div>
      </div>
      <div data-session-detail data-session-id="${sessionId}" class="bg-skating-card border border-slate-700 rounded-2xl p-6 shadow-xl">
        <div data-session-detail-state class="text-sm text-slate-400">Loading session...</div>
      </div>
    `,
  });
}
