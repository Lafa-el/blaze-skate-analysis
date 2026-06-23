import { optionLabel, t } from "./i18n";
import { renderPageShell, type PageRenderContext } from "./pageShell";

export function NewAnalysisSessionPage(_context: PageRenderContext): string {
  return renderPageShell({
    eyebrow: t("newSession.eyebrow"),
    title: t("newSession.title"),
    description: t("newSession.description"),
    actions: [{ label: t("common.backToSessions"), href: "/analysis/sessions", icon: "fa-arrow-left", tone: "neutral" }],
    content: `
      <div class="bg-skating-card border border-slate-700 rounded-2xl p-6 shadow-xl">
        <form data-session-form data-mode="create" class="grid grid-cols-1 lg:grid-cols-2 gap-5">
          ${renderSessionFormFields()}
          <div class="lg:col-span-2 flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
            <button type="submit" class="inline-flex items-center justify-center gap-2 bg-skating-pro hover:bg-purple-600 text-white font-bold rounded-xl px-5 py-3 transition-all">
              <i class="fa-solid fa-floppy-disk"></i>${t("common.createSession")}
            </button>
            <p data-session-form-status class="text-sm text-slate-400"></p>
          </div>
        </form>
      </div>
    `,
  });
}

export function renderSessionFormFields(): string {
  return `
    <label class="space-y-2">
      <span class="text-xs font-bold uppercase tracking-wider text-slate-400">${t("common.title")}</span>
      <input name="title" required maxlength="120" class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:outline-none focus:border-skating-pro" placeholder="${t("newSession.titlePlaceholder")}">
    </label>
    <label class="space-y-2">
      <span class="text-xs font-bold uppercase tracking-wider text-slate-400">${t("common.date")}</span>
      <input name="date" type="date" required class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:outline-none focus:border-skating-pro">
    </label>
    <label class="space-y-2">
      <span class="text-xs font-bold uppercase tracking-wider text-slate-400">${t("common.type")}</span>
      <select name="type" class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:outline-none focus:border-skating-pro">
        <option value="biomechanics">${optionLabel("biomechanics")}</option>
        <option value="pace">${optionLabel("pace")}</option>
        <option value="equipment">${optionLabel("equipment")}</option>
        <option value="composite">${optionLabel("composite")}</option>
      </select>
    </label>
    <label class="space-y-2">
      <span class="text-xs font-bold uppercase tracking-wider text-slate-400">${t("common.status")}</span>
      <select name="status" class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:outline-none focus:border-skating-pro">
        <option value="draft">${optionLabel("draft")}</option>
        <option value="processing">${optionLabel("processing")}</option>
        <option value="ready">${optionLabel("ready")}</option>
        <option value="reviewed">${optionLabel("reviewed")}</option>
        <option value="archived">${optionLabel("archived")}</option>
      </select>
    </label>
    <label class="lg:col-span-2 space-y-2">
      <span class="text-xs font-bold uppercase tracking-wider text-slate-400">${t("common.focusAreas")}</span>
      <input name="focusAreas" maxlength="240" class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:outline-none focus:border-skating-pro" placeholder="${t("newSession.focusPlaceholder")}">
    </label>
    <label class="lg:col-span-2 space-y-2">
      <span class="text-xs font-bold uppercase tracking-wider text-slate-400">${t("common.summary")}</span>
      <textarea name="summary" rows="5" maxlength="1200" class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:outline-none focus:border-skating-pro" placeholder="${t("newSession.summaryPlaceholder")}"></textarea>
    </label>
  `;
}
