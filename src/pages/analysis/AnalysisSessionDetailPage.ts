import { renderEmptyState, renderPageShell, renderSessionTabs, type PageRenderContext } from "./pageShell";

export function AnalysisSessionDetailPage(context: PageRenderContext): string {
  const sessionId = context.sessionId ?? "unknown";

  return renderPageShell({
    eyebrow: "Session",
    title: "Session Overview",
    description: `Session ID: ${sessionId}. Overview data will load from Analysis V1 Firestore services later.`,
    actions: [{ label: "All Sessions", href: "/sessions", icon: "fa-list", tone: "neutral" }],
    content: `
      ${renderSessionTabs(sessionId, "overview")}
      ${renderEmptyState("Session overview is ready for data", "This page will summarize linked videos, biomechanics findings, pace metrics, equipment snapshots, and report status.", "fa-chart-line")}
    `,
  });
}
