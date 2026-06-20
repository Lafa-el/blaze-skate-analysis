import { renderEmptyState, renderPageShell, type PageRenderContext } from "./pageShell";

export function AnalysisSettingsPage(_context: PageRenderContext): string {
  return renderPageShell({
    eyebrow: "Settings",
    title: "Analysis Settings",
    description: "Configuration surface for Analysis V1. Platform integration and advanced preferences are out of scope for Task 3.",
    content: renderEmptyState("No settings available yet", "This placeholder keeps the route stable while future preferences are designed.", "fa-gear"),
  });
}
