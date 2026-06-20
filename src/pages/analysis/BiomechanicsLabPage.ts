import { renderEmptyState, renderPageShell, renderSessionTabs, type PageRenderContext } from "./pageShell";

export function BiomechanicsLabPage(context: PageRenderContext): string {
  const sessionId = context.sessionId ?? "unknown";

  return renderPageShell({
    eyebrow: "Biomechanics",
    title: "Biomechanics Lab",
    description: `Session ID: ${sessionId}. Findings will connect to biomechanicsFindings after the CRUD screens are implemented.`,
    content: `
      ${renderSessionTabs(sessionId, "biomechanics")}
      ${renderEmptyState("No biomechanics findings yet", "The lab route is live. Finding capture, frame review, and update flows are intentionally deferred.", "fa-microscope")}
    `,
  });
}
