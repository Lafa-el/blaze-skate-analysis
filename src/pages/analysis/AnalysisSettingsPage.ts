import { t } from "./i18n";
import { renderEmptyState, renderPageShell, type PageRenderContext } from "./pageShell";

export function AnalysisSettingsPage(_context: PageRenderContext): string {
  return renderPageShell({
    eyebrow: t("settings.eyebrow"),
    title: t("settings.title"),
    description: t("settings.description"),
    content: renderEmptyState(t("settings.emptyTitle"), t("settings.emptyDescription"), "fa-gear"),
  });
}
