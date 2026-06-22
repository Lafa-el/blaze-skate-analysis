import { escapeAttribute, escapeHtml } from "./html";
import { renderPageShell, renderSessionTabs, type PageRenderContext } from "./pageShell";

export function EquipmentLabPage(context: PageRenderContext): string {
  const sessionId = context.sessionId ?? "unknown";
  const escapedSessionId = escapeAttribute(sessionId);

  return renderPageShell({
    eyebrow: "Equipment",
    title: "Equipment Lab",
    description: `Session ID: ${sessionId}. Record the current boot, blade, sharpening, ice, and athlete feedback snapshot.`,
    content: `
      ${renderSessionTabs(sessionId, "equipment")}
      <section data-equipment-lab data-session-id="${escapedSessionId}" class="space-y-5">
        <div data-equipment-session-header class="bg-skating-card border border-slate-700 rounded-2xl p-5 shadow-xl">
          <div class="flex items-center gap-3 text-sm text-slate-400">
            <i class="fa-solid fa-spinner"></i>
            <span>Loading session...</span>
          </div>
        </div>

        <form data-equipment-snapshot-form class="bg-skating-card border border-slate-700 rounded-2xl p-5 shadow-xl space-y-6">
          <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.18em] text-skating-neon">Current Equipment Snapshot</p>
              <h2 class="mt-2 text-2xl font-black text-white">Structured Setup Record</h2>
              <p class="mt-2 text-sm text-slate-400 max-w-3xl">V1 writes structured boot, blade, sharpening, ice, and athlete feedback fields while keeping legacy summary fields populated for compatibility.</p>
            </div>
            <label class="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-bold text-slate-300">
              <input name="isCurrent" type="checkbox" checked class="accent-skating-pro">
              Current setup
            </label>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            ${renderTextInput("setupName", "Setup name", "Race setup, practice setup, test setup")}
            ${renderSelect("category", "Category", ["boot", "blade", "rocker", "bend", "alignment", "fit"])}
            ${renderSelect("status", "Status", ["draft", "active", "superseded", "archived"])}
          </div>

          <div class="rounded-2xl border border-slate-700 bg-slate-950/60 p-4 space-y-4">
            <h3 class="text-lg font-black text-white">Boot</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              ${renderTextInput("bootBrand", "Brand", "Brand")}
              ${renderTextInput("bootModel", "Model", "Model")}
              ${renderTextInput("bootSize", "Size", "EU 40 / US 7")}
            </div>
            ${renderTextarea("bootNotes", "Boot notes", "Fit, pressure points, heel lock, lace setup.", 3)}
          </div>

          <div class="rounded-2xl border border-slate-700 bg-slate-950/60 p-4 space-y-4">
            <h3 class="text-lg font-black text-white">Blade</h3>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              ${renderTextInput("bladeBrand", "Brand", "Brand")}
              ${renderTextInput("bladeModel", "Model", "Model")}
              ${renderNumberInput("bladeLengthMm", "Length mm", "420", "0.1")}
              ${renderTextInput("bladeCup", "Cup", "16 cup")}
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${renderTextInput("bladeRocker", "Rocker", "8m / 12m combo")}
              ${renderTextInput("bladeBend", "Bend", "Front bend adjusted")}
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${renderNumberInput("leftOffsetMm", "Left offset mm", "0", "0.1")}
              ${renderNumberInput("rightOffsetMm", "Right offset mm", "0", "0.1")}
            </div>
            ${renderTextarea("bladeNotes", "Blade notes", "Alignment, rocker test, bend context.", 3)}
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div class="rounded-2xl border border-slate-700 bg-slate-950/60 p-4 space-y-4">
              <h3 class="text-lg font-black text-white">Sharpening</h3>
              ${renderSelect("sharpeningStatus", "Status", ["unknown", "fresh", "good", "dull", "uneven"])}
              ${renderDateInput("sharpenedAt", "Sharpened date")}
              ${renderTextarea("sharpeningNotes", "Sharpening notes", "Hollow, radius, burr, edge consistency.", 3)}
            </div>

            <div class="rounded-2xl border border-slate-700 bg-slate-950/60 p-4 space-y-4">
              <h3 class="text-lg font-black text-white">Ice Condition</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${renderTextInput("iceRink", "Rink", "Rink name")}
                ${renderTextInput("iceSurface", "Surface", "Olympic / NHL / short track")}
              </div>
              ${renderSelect("iceCondition", "Condition", ["unknown", "hard", "soft", "cut-up", "wet", "frosty"])}
              ${renderTextarea("iceNotes", "Ice notes", "Temperature feel, grooves, wet patches, traffic.", 3)}
            </div>
          </div>

          <div class="rounded-2xl border border-slate-700 bg-slate-950/60 p-4 space-y-4">
            <h3 class="text-lg font-black text-white">Athlete Feedback</h3>
            <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
              ${renderConditionSelect("fatigue", "Fatigue")}
              ${renderConditionSelect("slipping", "Slipping")}
              ${renderConditionSelect("stability", "Stability")}
              ${renderConditionSelect("edgeGrip", "Edge grip")}
              ${renderConditionSelect("confidence", "Confidence")}
            </div>
            ${renderTextarea("feedbackComments", "Feedback comments", "Free-form athlete comments.", 3)}
          </div>

          ${renderTextarea("recommendations", "Recommendations", "One per line: sharpen, check alignment, test rocker, monitor fit.", 4)}

          <div class="flex flex-col sm:flex-row sm:items-center gap-3">
            <button type="submit" class="inline-flex items-center justify-center gap-2 bg-skating-pro hover:bg-purple-600 text-white font-bold rounded-xl px-5 py-3 transition-all">
              <i class="fa-solid fa-floppy-disk"></i>Save Equipment Snapshot
            </button>
            <p data-equipment-form-status class="text-sm text-slate-400"></p>
          </div>
        </form>

        <div data-equipment-snapshot-state class="bg-skating-card border border-slate-700 rounded-2xl p-5 shadow-xl">
          <div class="flex items-center gap-3 text-sm text-slate-400">
            <i class="fa-solid fa-spinner"></i>
            <span>Loading equipment snapshot...</span>
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
        ${values.map((value) => `<option value="${escapeAttribute(value)}">${escapeHtml(formatOption(value))}</option>`).join("")}
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
