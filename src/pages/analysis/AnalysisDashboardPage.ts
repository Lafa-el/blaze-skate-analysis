import { escapeHtml } from "./html";
import { t } from "./i18n";
import { renderPageShell, type PageRenderContext } from "./pageShell";

export function AnalysisDashboardPage(_context: PageRenderContext): string {
  return renderPageShell({
    eyebrow: t("dashboard.eyebrow"),
    title: t("dashboard.title"),
    description: t("dashboard.description"),
    actions: [
      { label: t("common.newSession"), href: "/analysis/sessions/new", icon: "fa-plus" },
      { label: t("common.allSessions"), href: "/analysis/sessions", icon: "fa-list", tone: "neutral" },
    ],
    content: `
      <section data-analysis-dashboard class="space-y-5">
        <div data-dashboard-quick-actions class="bg-skating-card border border-slate-700 rounded-2xl p-5 shadow-xl">
          <div class="flex items-center gap-3 text-sm text-slate-400">
            <i class="fa-solid fa-spinner"></i>
            <span>${t("dashboard.loadingActions")}</span>
          </div>
        </div>

        <div data-dashboard-metrics class="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
          ${renderLoadingMetric(t("dashboard.sessionsMetric"))}
          ${renderLoadingMetric(t("dashboard.openFindingsMetric"))}
          ${renderLoadingMetric(t("dashboard.latestPaceMetric"))}
          ${renderLoadingMetric(t("dashboard.equipmentMetric"))}
          ${renderLoadingMetric(t("dashboard.reportMetric"))}
        </div>

        <div data-dashboard-latest-workflow class="bg-skating-card border border-slate-700 rounded-2xl p-5 shadow-xl">
          <div class="flex items-center gap-3 text-sm text-slate-400">
            <i class="fa-solid fa-spinner"></i>
            <span>${t("dashboard.loadingWorkflow")}</span>
          </div>
        </div>

        <div data-dashboard-recent-list class="bg-skating-card border border-slate-700 rounded-2xl p-5 shadow-xl">
          <div class="flex items-center gap-3 text-sm text-slate-400">
            <i class="fa-solid fa-spinner"></i>
            <span>${t("dashboard.loadingRecent")}</span>
          </div>
        </div>
      </section>
    `,
  });
}

function renderLoadingMetric(label: string): string {
  return `
    <div class="bg-skating-card border border-slate-700 rounded-2xl p-5 shadow-xl">
      <p class="text-xs font-bold uppercase tracking-wider text-slate-400">${escapeHtml(label)}</p>
      <p class="mt-3 text-3xl font-black text-white">...</p>
      <p class="mt-2 text-xs text-slate-500">${t("common.loading")}</p>
    </div>
  `;
}
