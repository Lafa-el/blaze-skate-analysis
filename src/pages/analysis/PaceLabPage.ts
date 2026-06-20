import { renderEmptyState, renderPageShell, renderSessionTabs, type PageRenderContext } from "./pageShell";

export function PaceLabPage(context: PageRenderContext): string {
  const sessionId = context.sessionId ?? "unknown";

  return renderPageShell({
    eyebrow: "Pace",
    title: "Pace Lab",
    description: `Session ID: ${sessionId}. Pace metrics will later use paceSessions service helpers.`,
    content: `
      ${renderSessionTabs(sessionId, "pace")}
      ${renderEmptyState("No pace sessions yet", "Split entry and pace analysis UI are not part of this routing skeleton.", "fa-stopwatch")}
    `,
  });
}
