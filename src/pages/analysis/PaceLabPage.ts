import { escapeAttribute } from "./html";
import { optionLabel, t } from "./i18n";
import { renderEmptyState, renderPageShell, renderSessionTabs, type PageRenderContext } from "./pageShell";

export function PaceLabPage(context: PageRenderContext): string {
  const sessionId = context.sessionId ?? "unknown";
  const escapedSessionId = escapeAttribute(sessionId);

  return renderPageShell({
    eyebrow: t("pace.eyebrow"),
    title: t("pace.title"),
    description: t("pace.description", { sessionId }),
    content: `
      ${renderSessionTabs(sessionId, "pace")}
      <div data-pace-lab data-session-id="${escapedSessionId}" class="space-y-6">
        <section data-pace-session-header class="bg-skating-card border border-slate-700 rounded-2xl p-5 shadow-xl">
          <div class="flex items-center gap-3 text-sm text-slate-400">
            <i class="fa-solid fa-spinner"></i>
            <span>${t("pace.loadingSession")}</span>
          </div>
        </section>
        <div class="grid grid-cols-1 xl:grid-cols-[minmax(320px,420px)_1fr] gap-6 items-start">
          <section class="bg-skating-card border border-slate-700 rounded-2xl p-6 shadow-xl">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-xs font-black uppercase tracking-[0.18em] text-skating-neon">${t("pace.manualSplits")}</p>
                <h2 class="mt-2 text-xl font-black text-white">${t("pace.addPaceSession")}</h2>
              </div>
              <i class="fa-solid fa-stopwatch text-skating-pro"></i>
            </div>
            <form data-pace-session-form data-mode="create" data-session-id="${escapedSessionId}" class="mt-5 space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-slate-400" for="pace-distance-type">${t("pace.distance")}</label>
                  <select id="pace-distance-type" name="distanceType" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro">
                    <option value="500m">500m</option>
                    <option value="777m">777m</option>
                    <option value="1000m">1000m</option>
                    <option value="1500m">1500m</option>
                    <option value="3000m">3000m</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-slate-400" for="pace-status">${t("common.status")}</label>
                  <select id="pace-status" name="status" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro">
                    <option value="draft">${optionLabel("draft")}</option>
                    <option value="completed">${optionLabel("completed")}</option>
                    <option value="reviewed">${optionLabel("reviewed")}</option>
                    <option value="archived">${optionLabel("archived")}</option>
                  </select>
                </div>
              </div>
              <div>
                <div class="flex items-center justify-between gap-3">
                  <label class="block text-xs font-bold uppercase tracking-wider text-slate-400">${t("pace.lapTimes")}</label>
                  <button type="button" data-add-pace-lap class="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-200 hover:border-skating-pro transition-all">
                    <i class="fa-solid fa-plus"></i>${t("pace.addLap")}
                  </button>
                </div>
                <div data-pace-lap-list class="mt-2 space-y-2">
                  <div data-pace-lap-row class="flex items-center gap-2">
                    <input name="lapTimesSeconds" type="number" min="0.01" step="0.01" required placeholder="${t("pace.lapPlaceholder")}" class="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro">
                    <button type="button" data-remove-pace-lap class="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-400 hover:text-red-200 hover:border-red-500/40 transition-all" aria-label="${t("pace.removeLap")}">
                      <i class="fa-solid fa-minus"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-400" for="pace-notes">${t("common.notes")}</label>
                <textarea id="pace-notes" name="notes" rows="4" placeholder="${t("pace.notesPlaceholder")}" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro"></textarea>
              </div>
              <div class="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                <button type="submit" class="inline-flex items-center justify-center gap-2 bg-skating-pro hover:bg-purple-600 text-white font-bold rounded-xl px-5 py-3 transition-all">
                  <i class="fa-solid fa-plus"></i>${t("pace.addPaceSession")}
                </button>
                <p data-pace-form-status class="text-sm text-slate-400"></p>
              </div>
            </form>
          </section>
          <section data-pace-session-list data-session-id="${escapedSessionId}" class="space-y-4">
            ${renderEmptyState(t("pace.loadingTitle"), t("pace.loadingDescription"), "fa-spinner")}
          </section>
        </div>
      </div>
    `,
  });
}
