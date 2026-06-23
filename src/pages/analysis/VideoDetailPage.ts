import { t } from "./i18n";
import { renderEmptyState, renderPageShell, type PageRenderContext } from "./pageShell";

export function VideoDetailPage(context: PageRenderContext): string {
  const videoId = context.videoId ?? "unknown";

  return renderPageShell({
    eyebrow: t("video.eyebrow"),
    title: t("video.title"),
    description: t("video.description", { videoId }),
    actions: [{ label: t("video.library"), href: "/analysis/videos", icon: "fa-video", tone: "neutral" }],
    content: renderEmptyState(t("video.emptyTitle"), t("video.emptyDescription"), "fa-circle-play"),
  });
}
