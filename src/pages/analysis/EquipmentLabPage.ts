import { renderEmptyState, renderPageShell, renderSessionTabs, type PageRenderContext } from "./pageShell";

export function EquipmentLabPage(context: PageRenderContext): string {
  const sessionId = context.sessionId ?? "unknown";

  return renderPageShell({
    eyebrow: "Equipment",
    title: "Equipment Lab",
    description: `Session ID: ${sessionId}. Equipment snapshots will be read by session once the UI is wired.`,
    content: `
      ${renderSessionTabs(sessionId, "equipment")}
      ${renderEmptyState("No equipment snapshot yet", "This route is reserved for boot, blade, rocker, bend, and fit snapshots.", "fa-screwdriver-wrench")}
    `,
  });
}
