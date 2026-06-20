import { renderEmptyState, renderPageShell, type PageRenderContext } from "./pageShell";

export function VideoLibraryPage(_context: PageRenderContext): string {
  return renderPageShell({
    eyebrow: "Videos",
    title: "Video Library",
    description: "Review Analysis V1 video records. Actual video listing is deferred until video service integration.",
    content: renderEmptyState("No videos in the library", "Video records will appear here after AnalysisVideo create/list flows are connected.", "fa-video"),
  });
}
