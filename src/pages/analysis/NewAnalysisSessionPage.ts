import { renderEmptyState, renderPageShell, type PageRenderContext } from "./pageShell";

export function NewAnalysisSessionPage(_context: PageRenderContext): string {
  return renderPageShell({
    eyebrow: "Create",
    title: "New Analysis Session",
    description: "Prepare the shell for a new Analysis V1 session. Full create forms are intentionally out of scope for Task 3.",
    actions: [{ label: "Back to Sessions", href: "/sessions", icon: "fa-arrow-left", tone: "neutral" }],
    content: renderEmptyState("Create form not implemented yet", "Task 3 only establishes routing and page structure. Session creation will be wired in a later task.", "fa-pen-to-square"),
  });
}
