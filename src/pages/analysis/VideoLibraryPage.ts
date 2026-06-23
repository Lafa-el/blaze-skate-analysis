import { t } from "./i18n";
import { renderEmptyState, renderPageShell, type PageRenderContext } from "./pageShell";

export function VideoLibraryPage(_context: PageRenderContext): string {
  return renderPageShell({
    eyebrow: t("videos.eyebrow"),
    title: t("videos.title"),
    description: t("videos.description"),
    content: renderEmptyState(t("videos.emptyTitle"), t("videos.emptyDescription"), "fa-video"),
  });
}
