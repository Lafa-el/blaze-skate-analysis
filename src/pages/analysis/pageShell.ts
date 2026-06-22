export interface PageAction {
  readonly label: string;
  readonly href: string;
  readonly icon: string;
  readonly tone?: "primary" | "neutral";
}

export interface PageRenderContext {
  readonly path: string;
  readonly sessionId?: string;
  readonly videoId?: string;
}

export interface PageDefinition {
  readonly title: string;
  readonly eyebrow: string;
  readonly description: string;
  readonly actions?: readonly PageAction[];
  readonly content: string;
}

const primaryActionClasses =
  "bg-skating-pro hover:bg-purple-600 text-white border-skating-pro shadow-[0_0_18px_rgba(139,92,246,0.22)]";
const neutralActionClasses = "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700";

export function renderPageShell(definition: PageDefinition): string {
  const actions = definition.actions?.map(renderAction).join("") ?? "";

  return `
    <section class="space-y-6 fade-in-up">
      <div class="bg-skating-card border border-slate-700 rounded-2xl p-6 shadow-xl">
        <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.24em] text-skating-neon">${definition.eyebrow}</p>
            <h1 class="mt-2 text-3xl sm:text-4xl font-black text-white">${definition.title}</h1>
            <p class="mt-3 text-sm sm:text-base text-slate-400 max-w-3xl leading-relaxed">${definition.description}</p>
          </div>
          ${actions ? `<div class="flex flex-wrap gap-2">${actions}</div>` : ""}
        </div>
      </div>
      ${definition.content}
    </section>
  `;
}

export function renderEmptyState(title: string, description: string, icon = "fa-box-open"): string {
  return `
    <div class="bg-skating-card/50 border border-dashed border-slate-700 rounded-2xl p-10 text-center">
      <div class="mx-auto w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 text-xl">
        <i class="fa-solid ${icon}"></i>
      </div>
      <h2 class="mt-4 text-lg font-bold text-slate-200">${title}</h2>
      <p class="mt-2 text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">${description}</p>
    </div>
  `;
}

export function renderMetricCards(cards: readonly { label: string; value: string; hint: string; icon: string }[]): string {
  return `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      ${cards
        .map(
          (card) => `
            <div class="bg-skating-card border border-slate-700 rounded-2xl p-5 shadow-xl">
              <div class="flex items-center justify-between gap-3">
                <p class="text-xs font-bold uppercase tracking-wider text-slate-400">${card.label}</p>
                <i class="fa-solid ${card.icon} text-skating-pro"></i>
              </div>
              <p class="mt-3 text-3xl font-black text-white">${card.value}</p>
              <p class="mt-2 text-xs text-slate-500">${card.hint}</p>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

export function renderSessionTabs(sessionId: string, active: "overview" | "biomechanics" | "pace" | "equipment" | "report"): string {
  const tabs = [
    { id: "overview", label: "Session Overview", href: `/analysis/sessions/${sessionId}`, icon: "fa-chart-line" },
    { id: "biomechanics", label: "Biomechanics", href: `/analysis/sessions/${sessionId}/biomechanics`, icon: "fa-microscope" },
    { id: "pace", label: "Pace", href: `/analysis/sessions/${sessionId}/pace`, icon: "fa-stopwatch" },
    { id: "equipment", label: "Equipment", href: `/analysis/sessions/${sessionId}/equipment`, icon: "fa-screwdriver-wrench" },
    { id: "report", label: "Report", href: `/analysis/sessions/${sessionId}/report`, icon: "fa-file-lines" },
  ] as const;

  return `
    <nav class="bg-skating-card border border-slate-700 rounded-2xl p-2 overflow-x-auto no-scrollbar" aria-label="Session navigation">
      <div class="flex min-w-max gap-1">
        ${tabs
          .map((tab) => {
            const isActive = tab.id === active;
            const classes = isActive
              ? "bg-skating-pro text-white border-skating-pro"
              : "text-slate-400 hover:text-slate-100 hover:bg-slate-800 border-transparent";

            return `
              <a data-analysis-link href="${tab.href}" class="px-3.5 py-2 rounded-xl border text-sm font-bold transition-all flex items-center gap-2 ${classes}">
                <i class="fa-solid ${tab.icon}"></i>${tab.label}
              </a>
            `;
          })
          .join("")}
      </div>
    </nav>
  `;
}

function renderAction(action: PageAction): string {
  const classes = action.tone === "neutral" ? neutralActionClasses : primaryActionClasses;

  return `
    <a data-analysis-link href="${action.href}" class="inline-flex items-center gap-2 border rounded-xl px-4 py-2 text-sm font-bold transition-all ${classes}">
      <i class="fa-solid ${action.icon}"></i>${action.label}
    </a>
  `;
}
