import { t } from "./i18n";
import { renderEmptyState, renderPageShell, type PageRenderContext } from "./pageShell";

export function AnalysisSessionsPage(_context: PageRenderContext): string {
  return renderPageShell({
    eyebrow: t("sessions.eyebrow"),
    title: t("sessions.title"),
    description: t("sessions.description"),
    actions: [{ label: t("common.newSession"), href: "/analysis/sessions/new", icon: "fa-plus" }],
    content: `
      <div class="bg-skating-card border border-slate-700 rounded-2xl p-5 shadow-xl">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.18em] text-skating-neon">${t("sessions.workflow")}</p>
            <h2 class="mt-2 text-xl font-black text-white">${t("sessions.workflowTitle")}</h2>
            <p class="mt-2 text-sm text-slate-400">${t("sessions.workflowDescription")}</p>
          </div>
          <a data-analysis-link href="/analysis" class="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-bold text-slate-200 hover:border-skating-pro transition-all">
            <i class="fa-solid fa-gauge-high"></i>${t("common.dashboard")}
          </a>
        </div>
      </div>
      <div data-session-list>
        ${renderEmptyState(t("sessions.loadingTitle"), t("sessions.loadingDescription"), "fa-circle-notch fa-spin")}
      </div>
    `,
  });
}
