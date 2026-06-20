import { renderEmptyState, renderPageShell, type PageRenderContext } from "./pageShell";

export function VideoDetailPage(context: PageRenderContext): string {
  const videoId = context.videoId ?? "unknown";

  return renderPageShell({
    eyebrow: "Video",
    title: "Video Detail",
    description: `Video ID: ${videoId}. This detail route is ready for AnalysisVideo data loading.`,
    actions: [{ label: "Video Library", href: "/videos", icon: "fa-video", tone: "neutral" }],
    content: renderEmptyState("Video details are not loaded yet", "Playback metadata and linked sessions will be added after the route skeleton is accepted.", "fa-circle-play"),
  });
}
