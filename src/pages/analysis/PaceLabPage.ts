import { renderEmptyState, renderPageShell, renderSessionTabs, type PageRenderContext } from "./pageShell";

export function PaceLabPage(context: PageRenderContext): string {
  const sessionId = context.sessionId ?? "unknown";

  return renderPageShell({
    eyebrow: "Pace",
    title: "Pace Lab",
    description: `Session ID: ${sessionId}. Add manual lap splits and calculate pace metrics for this Analysis V1 session.`,
    content: `
      ${renderSessionTabs(sessionId, "pace")}
      <div data-pace-lab data-session-id="${sessionId}" class="space-y-6">
        <section data-pace-session-header class="bg-skating-card border border-slate-700 rounded-2xl p-5 shadow-xl">
          <div class="flex items-center gap-3 text-sm text-slate-400">
            <i class="fa-solid fa-spinner"></i>
            <span>Loading analysis session...</span>
          </div>
        </section>
        <div class="grid grid-cols-1 xl:grid-cols-[minmax(320px,420px)_1fr] gap-6 items-start">
          <section class="bg-skating-card border border-slate-700 rounded-2xl p-6 shadow-xl">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-xs font-black uppercase tracking-[0.18em] text-skating-neon">Manual Splits</p>
                <h2 class="mt-2 text-xl font-black text-white">Add Pace Session</h2>
              </div>
              <i class="fa-solid fa-stopwatch text-skating-pro"></i>
            </div>
            <form data-pace-session-form data-mode="create" data-session-id="${sessionId}" class="mt-5 space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-slate-400" for="pace-distance-type">Distance</label>
                  <select id="pace-distance-type" name="distanceType" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro">
                    <option value="500m">500m</option>
                    <option value="777m">777m</option>
                    <option value="1000m">1000m</option>
                    <option value="1500m">1500m</option>
                    <option value="3000m">3000m</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-slate-400" for="pace-status">Status</label>
                  <select id="pace-status" name="status" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro">
                    <option value="draft">Draft</option>
                    <option value="completed">Completed</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              <div>
                <div class="flex items-center justify-between gap-3">
                  <label class="block text-xs font-bold uppercase tracking-wider text-slate-400">Lap Times</label>
                  <button type="button" data-add-pace-lap class="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-200 hover:border-skating-pro transition-all">
                    <i class="fa-solid fa-plus"></i>Add Lap
                  </button>
                </div>
                <div data-pace-lap-list class="mt-2 space-y-2">
                  <div data-pace-lap-row class="flex items-center gap-2">
                    <input name="lapTimesSeconds" type="number" min="0.01" step="0.01" required placeholder="Lap 1 seconds" class="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro">
                    <button type="button" data-remove-pace-lap class="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-400 hover:text-red-200 hover:border-red-500/40 transition-all" aria-label="Remove lap">
                      <i class="fa-solid fa-minus"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-400" for="pace-notes">Notes</label>
                <textarea id="pace-notes" name="notes" rows="4" placeholder="Optional notes about pacing, conditions, or race phase." class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro"></textarea>
              </div>
              <div class="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                <button type="submit" class="inline-flex items-center justify-center gap-2 bg-skating-pro hover:bg-purple-600 text-white font-bold rounded-xl px-5 py-3 transition-all">
                  <i class="fa-solid fa-plus"></i>Add Pace Session
                </button>
                <p data-pace-form-status class="text-sm text-slate-400"></p>
              </div>
            </form>
          </section>
          <section data-pace-session-list data-session-id="${sessionId}" class="space-y-4">
            ${renderEmptyState("Loading pace sessions", "Fetching manual pace sessions for this analysis session.", "fa-spinner")}
          </section>
        </div>
      </div>
    `,
  });
}
