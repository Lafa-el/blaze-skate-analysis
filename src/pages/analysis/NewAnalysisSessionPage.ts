import { renderPageShell, type PageRenderContext } from "./pageShell";

export function NewAnalysisSessionPage(_context: PageRenderContext): string {
  return renderPageShell({
    eyebrow: "Create",
    title: "New Analysis Session",
    description: "Create a saved Analysis V1 session. Lab data, videos, and reports are added later.",
    actions: [{ label: "Back to Sessions", href: "/analysis/sessions", icon: "fa-arrow-left", tone: "neutral" }],
    content: `
      <div class="bg-skating-card border border-slate-700 rounded-2xl p-6 shadow-xl">
        <form data-session-form data-mode="create" class="grid grid-cols-1 lg:grid-cols-2 gap-5">
          ${renderSessionFormFields()}
          <div class="lg:col-span-2 flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
            <button type="submit" class="inline-flex items-center justify-center gap-2 bg-skating-pro hover:bg-purple-600 text-white font-bold rounded-xl px-5 py-3 transition-all">
              <i class="fa-solid fa-floppy-disk"></i>Create Session
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
      <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Title</span>
      <input name="title" required maxlength="120" class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:outline-none focus:border-skating-pro" placeholder="e.g. Saturday 500m start review">
    </label>
    <label class="space-y-2">
      <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Date</span>
      <input name="date" type="date" required class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:outline-none focus:border-skating-pro">
    </label>
    <label class="space-y-2">
      <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Type</span>
      <select name="type" class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:outline-none focus:border-skating-pro">
        <option value="biomechanics">Biomechanics</option>
        <option value="pace">Pace</option>
        <option value="equipment">Equipment</option>
        <option value="composite">Composite</option>
      </select>
    </label>
    <label class="space-y-2">
      <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Status</span>
      <select name="status" class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:outline-none focus:border-skating-pro">
        <option value="draft">Draft</option>
        <option value="processing">Processing</option>
        <option value="ready">Ready</option>
        <option value="reviewed">Reviewed</option>
        <option value="archived">Archived</option>
      </select>
    </label>
    <label class="lg:col-span-2 space-y-2">
      <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Focus Areas</span>
      <input name="focusAreas" maxlength="240" class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:outline-none focus:border-skating-pro" placeholder="Comma separated: lean, start, corner entry">
    </label>
    <label class="lg:col-span-2 space-y-2">
      <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Summary</span>
      <textarea name="summary" rows="5" maxlength="1200" class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:outline-none focus:border-skating-pro" placeholder="Short coach/athlete notes for this session"></textarea>
    </label>
  `;
}
