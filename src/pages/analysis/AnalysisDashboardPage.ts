import { renderPageShell, type PageRenderContext } from "./pageShell";

export function AnalysisDashboardPage(_context: PageRenderContext): string {
  return renderPageShell({
    eyebrow: "Analysis V1",
    title: "Analysis Dashboard",
    description: "Central workspace for the full Analysis V1 workflow: Session, Biomechanics, Pace, Equipment, and Report.",
    actions: [
      { label: "New Session", href: "/analysis/sessions/new", icon: "fa-plus" },
      { label: "All Sessions", href: "/analysis/sessions", icon: "fa-list", tone: "neutral" },
    ],
    content: `
      <section data-analysis-dashboard class="space-y-5">
        <div data-dashboard-quick-actions class="bg-skating-card border border-slate-700 rounded-2xl p-5 shadow-xl">
          <div class="flex items-center gap-3 text-sm text-slate-400">
            <i class="fa-solid fa-spinner"></i>
            <span>Loading dashboard actions...</span>
          </div>
        </div>

        <div data-dashboard-metrics class="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
          ${renderLoadingMetric("Sessions")}
          ${renderLoadingMetric("Open Findings")}
          ${renderLoadingMetric("Latest Pace")}
          ${renderLoadingMetric("Equipment")}
          ${renderLoadingMetric("Report")}
        </div>

        <div data-dashboard-latest-workflow class="bg-skating-card border border-slate-700 rounded-2xl p-5 shadow-xl">
          <div class="flex items-center gap-3 text-sm text-slate-400">
            <i class="fa-solid fa-spinner"></i>
            <span>Loading latest workflow summary...</span>
          </div>
        </div>

        <div data-dashboard-recent-list class="bg-skating-card border border-slate-700 rounded-2xl p-5 shadow-xl">
          <div class="flex items-center gap-3 text-sm text-slate-400">
            <i class="fa-solid fa-spinner"></i>
            <span>Loading recent sessions...</span>
          </div>
        </div>
      </section>
    `,
  });
}

function renderLoadingMetric(label: string): string {
  return `
    <div class="bg-skating-card border border-slate-700 rounded-2xl p-5 shadow-xl">
      <p class="text-xs font-bold uppercase tracking-wider text-slate-400">${label}</p>
      <p class="mt-3 text-3xl font-black text-white">...</p>
      <p class="mt-2 text-xs text-slate-500">Loading</p>
    </div>
  `;
}
