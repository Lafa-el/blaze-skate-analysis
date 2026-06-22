import { renderEmptyState, renderPageShell, type PageRenderContext } from "./pageShell";

export function AnalysisSessionsPage(_context: PageRenderContext): string {
  return renderPageShell({
    eyebrow: "Sessions",
    title: "Active Analysis Sessions",
    description: "Browse and review active Analysis V1 sessions for the current athlete. Archived sessions are hidden from this workflow view.",
    actions: [{ label: "New Session", href: "/analysis/sessions/new", icon: "fa-plus" }],
    content: `
      <div class="bg-skating-card border border-slate-700 rounded-2xl p-5 shadow-xl">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.18em] text-skating-neon">Workflow</p>
            <h2 class="mt-2 text-xl font-black text-white">Create one session, then complete the labs</h2>
            <p class="mt-2 text-sm text-slate-400">Each active session links Biomechanics, Pace, Equipment, and Report pages under the same /analysis route. Archive preserves linked data without showing it here.</p>
          </div>
          <a data-analysis-link href="/analysis" class="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-bold text-slate-200 hover:border-skating-pro transition-all">
            <i class="fa-solid fa-gauge-high"></i>Dashboard
          </a>
        </div>
      </div>
      <div data-session-list>
        ${renderEmptyState("Loading sessions", "Checking Firestore for saved Analysis V1 sessions.", "fa-circle-notch fa-spin")}
      </div>
    `,
  });
}
