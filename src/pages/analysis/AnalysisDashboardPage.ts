import { renderEmptyState, renderMetricCards, renderPageShell, type PageRenderContext } from "./pageShell";

export function AnalysisDashboardPage(_context: PageRenderContext): string {
  return renderPageShell({
    eyebrow: "Analysis V1",
    title: "Analysis Dashboard",
    description: "Central workspace for video-backed skating analysis sessions. Firestore integration will connect here in the next implementation pass.",
    actions: [
      { label: "New Session", href: "/sessions/new", icon: "fa-plus" },
      { label: "All Sessions", href: "/sessions", icon: "fa-list", tone: "neutral" },
    ],
    content: `
      ${renderMetricCards([
        { label: "Sessions", value: "0", hint: "No Analysis V1 sessions loaded yet.", icon: "fa-layer-group" },
        { label: "Videos", value: "0", hint: "Video library wiring is pending.", icon: "fa-video" },
        { label: "Reports", value: "0", hint: "Reports will be generated from reviewed sessions.", icon: "fa-file-lines" },
      ])}
      ${renderEmptyState("No analysis activity yet", "Create a session skeleton first, then connect biomechanics, pace, equipment, and report workflows when CRUD UI is implemented.", "fa-chart-simple")}
    `,
  });
}
