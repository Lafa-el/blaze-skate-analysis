import { renderEmptyState, renderPageShell, type PageRenderContext } from "./pageShell";

export function AnalysisSessionsPage(_context: PageRenderContext): string {
  return renderPageShell({
    eyebrow: "Sessions",
    title: "Analysis Sessions",
    description: "Browse and review Analysis V1 sessions. This skeleton is ready for listAnalysisSessionsByAthlete integration.",
    actions: [{ label: "New Session", href: "/sessions/new", icon: "fa-plus" }],
    content: renderEmptyState("No sessions to display", "Session listing is intentionally empty until Firestore-backed loading is connected.", "fa-folder-open"),
  });
}
