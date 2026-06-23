import { escapeAttribute } from "./html";
import { t } from "./i18n";
import { renderPageShell, renderSessionTabs, type PageRenderContext } from "./pageShell";

export function AnalysisSessionDetailPage(context: PageRenderContext): string {
  const sessionId = context.sessionId ?? "unknown";
  const escapedSessionId = escapeAttribute(sessionId);

  return renderPageShell({
    eyebrow: t("sessionDetail.eyebrow"),
    title: t("sessionDetail.title"),
    description: t("sessionDetail.description", { sessionId }),
    actions: [{ label: t("common.allSessions"), href: "/analysis/sessions", icon: "fa-list", tone: "neutral" }],
    content: `
      ${renderSessionTabs(sessionId, "overview")}
      <div data-session-findings-summary data-session-id="${escapedSessionId}" class="bg-skating-card border border-slate-700 rounded-2xl p-5 shadow-xl">
        <div class="flex items-center gap-3 text-sm text-slate-400">
          <i class="fa-solid fa-spinner"></i>
          <span>${t("sessionDetail.loadingBiomechanics")}</span>
        </div>
      </div>
      <div data-session-pace-summary data-session-id="${escapedSessionId}" class="bg-skating-card border border-slate-700 rounded-2xl p-5 shadow-xl">
        <div class="flex items-center gap-3 text-sm text-slate-400">
          <i class="fa-solid fa-spinner"></i>
          <span>${t("sessionDetail.loadingPace")}</span>
        </div>
      </div>
      <div data-session-equipment-summary data-session-id="${escapedSessionId}" class="bg-skating-card border border-slate-700 rounded-2xl p-5 shadow-xl">
        <div class="flex items-center gap-3 text-sm text-slate-400">
          <i class="fa-solid fa-spinner"></i>
          <span>${t("sessionDetail.loadingEquipment")}</span>
        </div>
      </div>
      <div data-session-report-summary data-session-id="${escapedSessionId}" class="bg-skating-card border border-slate-700 rounded-2xl p-5 shadow-xl">
        <div class="flex items-center gap-3 text-sm text-slate-400">
          <i class="fa-solid fa-spinner"></i>
          <span>${t("sessionDetail.loadingReport")}</span>
        </div>
      </div>
      <div data-session-detail data-session-id="${escapedSessionId}" class="bg-skating-card border border-slate-700 rounded-2xl p-6 shadow-xl">
        <div data-session-detail-state class="text-sm text-slate-400">${t("sessionDetail.loadingSession")}</div>
      </div>
    `,
  });
}
