import { escapeAttribute, escapeHtml } from "./html";
import { optionLabel, t } from "./i18n";
import { renderPageShell, renderSessionTabs, type PageRenderContext } from "./pageShell";

export function EquipmentLabPage(context: PageRenderContext): string {
  const sessionId = context.sessionId ?? "unknown";
  const escapedSessionId = escapeAttribute(sessionId);

  return renderPageShell({
    eyebrow: t("equipment.eyebrow"),
    title: t("equipment.title"),
    description: t("equipment.description", { sessionId }),
    content: `
      ${renderSessionTabs(sessionId, "equipment")}
      <section data-equipment-lab data-session-id="${escapedSessionId}" class="space-y-5">
        <div data-equipment-session-header class="bg-skating-card border border-slate-700 rounded-2xl p-5 shadow-xl">
          <div class="flex items-center gap-3 text-sm text-slate-400">
            <i class="fa-solid fa-spinner"></i>
            <span>${t("equipment.loadingSession")}</span>
          </div>
        </div>

        <form data-equipment-snapshot-form class="bg-skating-card border border-slate-700 rounded-2xl p-5 shadow-xl space-y-6">
          <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.18em] text-skating-neon">${t("equipment.currentSnapshot")}</p>
              <h2 class="mt-2 text-2xl font-black text-white">${t("equipment.structuredRecord")}</h2>
              <p class="mt-2 text-sm text-slate-400 max-w-3xl">${t("equipment.structuredDescription")}</p>
            </div>
            <label class="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-bold text-slate-300">
              <input name="isCurrent" type="checkbox" checked class="accent-skating-pro">
              ${t("equipment.currentSetup")}
            </label>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            ${renderTextInput("setupName", t("equipment.setupName"), t("equipment.setupPlaceholder"))}
            ${renderSelect("category", t("common.category"), ["boot", "blade", "rocker", "bend", "alignment", "fit"])}
            ${renderSelect("status", t("common.status"), ["draft", "active", "superseded", "archived"])}
          </div>

          <div class="rounded-2xl border border-slate-700 bg-slate-950/60 p-4 space-y-4">
            <h3 class="text-lg font-black text-white">${t("equipment.boot")}</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              ${renderTextInput("bootBrand", t("equipment.brand"), t("equipment.brand"))}
              ${renderTextInput("bootModel", t("equipment.model"), t("equipment.model"))}
              ${renderTextInput("bootSize", t("equipment.size"), "EU 40 / US 7")}
            </div>
            ${renderTextarea("bootNotes", t("equipment.bootNotes"), t("equipment.bootNotesPlaceholder"), 3)}
          </div>

          <div class="rounded-2xl border border-slate-700 bg-slate-950/60 p-4 space-y-4">
            <h3 class="text-lg font-black text-white">${t("equipment.blade")}</h3>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              ${renderTextInput("bladeBrand", t("equipment.brand"), t("equipment.brand"))}
              ${renderTextInput("bladeModel", t("equipment.model"), t("equipment.model"))}
              ${renderNumberInput("bladeLengthMm", t("equipment.lengthMm"), "420", "0.1")}
              ${renderTextInput("bladeCup", t("equipment.cup"), "16 cup")}
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${renderTextInput("bladeRocker", t("equipment.rocker"), "8m / 12m combo")}
              ${renderTextInput("bladeBend", t("equipment.bend"), "Front bend adjusted")}
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${renderNumberInput("leftOffsetMm", t("equipment.leftOffset"), "0", "0.1")}
              ${renderNumberInput("rightOffsetMm", t("equipment.rightOffset"), "0", "0.1")}
            </div>
            ${renderTextarea("bladeNotes", t("equipment.bladeNotes"), t("equipment.bladeNotesPlaceholder"), 3)}
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div class="rounded-2xl border border-slate-700 bg-slate-950/60 p-4 space-y-4">
              <h3 class="text-lg font-black text-white">${t("equipment.sharpening")}</h3>
              ${renderSelect("sharpeningStatus", t("common.status"), ["unknown", "fresh", "good", "dull", "uneven"])}
              ${renderDateInput("sharpenedAt", t("equipment.sharpenedDate"))}
              ${renderTextarea("sharpeningNotes", t("equipment.sharpeningNotes"), t("equipment.sharpeningNotesPlaceholder"), 3)}
            </div>

            <div class="rounded-2xl border border-slate-700 bg-slate-950/60 p-4 space-y-4">
              <h3 class="text-lg font-black text-white">${t("equipment.iceCondition")}</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${renderTextInput("iceRink", t("equipment.rink"), t("equipment.rink"))}
                ${renderTextInput("iceSurface", t("equipment.surface"), "Olympic / NHL / short track")}
              </div>
              ${renderSelect("iceCondition", t("equipment.condition"), ["unknown", "hard", "soft", "cut-up", "wet", "frosty"])}
              ${renderTextarea("iceNotes", t("equipment.iceNotes"), t("equipment.iceNotesPlaceholder"), 3)}
            </div>
          </div>

          <div class="rounded-2xl border border-slate-700 bg-slate-950/60 p-4 space-y-4">
            <h3 class="text-lg font-black text-white">${t("equipment.athleteFeedback")}</h3>
            <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
              ${renderConditionSelect("fatigue", t("equipment.fatigue"))}
              ${renderConditionSelect("slipping", t("equipment.slipping"))}
              ${renderConditionSelect("stability", t("equipment.stability"))}
              ${renderConditionSelect("edgeGrip", t("equipment.edgeGrip"))}
              ${renderConditionSelect("confidence", t("equipment.confidence"))}
            </div>
            ${renderTextarea("feedbackComments", t("equipment.feedbackComments"), t("equipment.feedbackPlaceholder"), 3)}
          </div>

          ${renderTextarea("recommendations", t("common.recommendations"), t("equipment.recommendationsPlaceholder"), 4)}

          <div class="flex flex-col sm:flex-row sm:items-center gap-3">
            <button type="submit" class="inline-flex items-center justify-center gap-2 bg-skating-pro hover:bg-purple-600 text-white font-bold rounded-xl px-5 py-3 transition-all">
              <i class="fa-solid fa-floppy-disk"></i>${t("equipment.saveSnapshot")}
            </button>
            <p data-equipment-form-status class="text-sm text-slate-400"></p>
          </div>
        </form>

        <div data-equipment-snapshot-state class="bg-skating-card border border-slate-700 rounded-2xl p-5 shadow-xl">
          <div class="flex items-center gap-3 text-sm text-slate-400">
            <i class="fa-solid fa-spinner"></i>
            <span>${t("equipment.loadingSnapshot")}</span>
          </div>
        </div>
      </section>
    `,
  });
}

function renderTextInput(name: string, label: string, placeholder: string): string {
  return `
    <label class="block">
      <span class="block text-xs font-bold uppercase tracking-wider text-slate-400">${escapeHtml(label)}</span>
      <input name="${escapeAttribute(name)}" type="text" placeholder="${escapeAttribute(placeholder)}" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro">
    </label>
  `;
}

function renderNumberInput(name: string, label: string, placeholder: string, step: string): string {
  return `
    <label class="block">
      <span class="block text-xs font-bold uppercase tracking-wider text-slate-400">${escapeHtml(label)}</span>
      <input name="${escapeAttribute(name)}" type="number" step="${escapeAttribute(step)}" placeholder="${escapeAttribute(placeholder)}" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro">
    </label>
  `;
}

function renderDateInput(name: string, label: string): string {
  return `
    <label class="block">
      <span class="block text-xs font-bold uppercase tracking-wider text-slate-400">${escapeHtml(label)}</span>
      <input name="${escapeAttribute(name)}" type="date" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro">
    </label>
  `;
}

function renderSelect(name: string, label: string, values: readonly string[]): string {
  return `
    <label class="block">
      <span class="block text-xs font-bold uppercase tracking-wider text-slate-400">${escapeHtml(label)}</span>
      <select name="${escapeAttribute(name)}" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro">
        ${values.map((value) => `<option value="${escapeAttribute(value)}">${escapeHtml(optionLabel(value))}</option>`).join("")}
      </select>
    </label>
  `;
}

function renderConditionSelect(name: string, label: string): string {
  return renderSelect(name, label, ["unknown", "none", "low", "medium", "high"]);
}

function renderTextarea(name: string, label: string, placeholder: string, rows: number): string {
  return `
    <label class="block">
      <span class="block text-xs font-bold uppercase tracking-wider text-slate-400">${escapeHtml(label)}</span>
      <textarea name="${escapeAttribute(name)}" rows="${escapeAttribute(rows)}" placeholder="${escapeAttribute(placeholder)}" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro"></textarea>
    </label>
  `;
}

function formatOption(value: string): string {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
