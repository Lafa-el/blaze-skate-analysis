import { renderEmptyState, renderPageShell, renderSessionTabs, type PageRenderContext } from "./pageShell";

export function AnalysisReportPage(context: PageRenderContext): string {
  const sessionId = context.sessionId ?? "unknown";

  return renderPageShell({
    eyebrow: "Report",
    title: "Analysis Report",
    description: `Session ID: ${sessionId}. Report generation and review states are intentionally placeholders in Task 3.`,
    content: `
      ${renderSessionTabs(sessionId, "report")}
      ${renderEmptyState("No report generated yet", "The report route can render safely before AnalysisReport data exists.", "fa-file-lines")}
    `,
  });
}
