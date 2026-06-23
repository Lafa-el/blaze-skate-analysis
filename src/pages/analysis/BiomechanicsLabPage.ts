import { escapeAttribute } from "./html";
import { optionLabel, t } from "./i18n";
import { renderEmptyState, renderPageShell, renderSessionTabs, type PageRenderContext } from "./pageShell";

export function BiomechanicsLabPage(context: PageRenderContext): string {
  const sessionId = context.sessionId ?? "unknown";
  const escapedSessionId = escapeAttribute(sessionId);

  return renderPageShell({
    eyebrow: t("biomechanics.eyebrow"),
    title: t("biomechanics.title"),
    description: t("biomechanics.description", { sessionId }),
    content: `
      ${renderSessionTabs(sessionId, "biomechanics")}
      <div class="grid grid-cols-1 xl:grid-cols-[minmax(320px,420px)_1fr] gap-6 items-start">
        <section class="bg-skating-card border border-slate-700 rounded-2xl p-6 shadow-xl">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.18em] text-skating-neon">${t("biomechanics.manualFinding")}</p>
              <h2 class="mt-2 text-xl font-black text-white">${t("biomechanics.addFinding")}</h2>
            </div>
            <i class="fa-solid fa-microscope text-skating-pro"></i>
          </div>
          <form data-biomechanics-finding-form data-mode="create" data-session-id="${escapedSessionId}" class="mt-5 space-y-4">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-400" for="finding-title">${t("biomechanics.issue")}</label>
              <input id="finding-title" name="title" type="text" required placeholder="${t("biomechanics.issuePlaceholder")}" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro">
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-400" for="finding-issue-type">${t("common.category")}</label>
                <select id="finding-issue-type" name="issueType" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro">
                  <option value="posture">${optionLabel("posture")}</option>
                  <option value="edge-control">${optionLabel("edge-control")}</option>
                  <option value="knee-flexion">${optionLabel("knee-flexion")}</option>
                  <option value="pelvis-height">${optionLabel("pelvis-height")}</option>
                  <option value="ankle-recovery">${optionLabel("ankle-recovery")}</option>
                  <option value="support-leg">${optionLabel("support-leg")}</option>
                  <option value="timing">${optionLabel("timing")}</option>
                  <option value="symmetry">${optionLabel("symmetry")}</option>
                  <option value="stability">${optionLabel("stability")}</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-400" for="finding-side">${t("biomechanics.side")}</label>
                <select id="finding-side" name="side" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro">
                  <option value="both">${optionLabel("both")}</option>
                  <option value="left">${optionLabel("left")}</option>
                  <option value="right">${optionLabel("right")}</option>
                  <option value="unknown">${optionLabel("unknown")}</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-400" for="finding-severity">${t("biomechanics.severity")}</label>
                <select id="finding-severity" name="severity" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro">
                  <option value="info">${optionLabel("info")}</option>
                  <option value="low">${optionLabel("low")}</option>
                  <option value="medium">${optionLabel("medium")}</option>
                  <option value="high">${optionLabel("high")}</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-400" for="finding-status">${t("common.status")}</label>
                <select id="finding-status" name="status" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro">
                  <option value="open">${optionLabel("open")}</option>
                  <option value="acknowledged">${optionLabel("acknowledged")}</option>
                  <option value="improving">${optionLabel("improving")}</option>
                  <option value="resolved">${optionLabel("resolved")}</option>
                  <option value="dismissed">${optionLabel("dismissed")}</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-400" for="finding-confidence">${t("biomechanics.confidence")}</label>
                <input id="finding-confidence" name="confidenceScore" type="number" min="0" max="1" step="0.01" placeholder="0.85" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro">
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-400" for="finding-trend-key">${t("biomechanics.trendKey")}</label>
                <input id="finding-trend-key" name="trendKey" type="text" placeholder="corner-entry:knee-flexion" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro">
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-400" for="finding-time-start">${t("biomechanics.startTime")}</label>
                <input id="finding-time-start" name="timeRangeStartSeconds" type="number" min="0" step="0.01" placeholder="12.5 seconds" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro">
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-400" for="finding-time-end">${t("biomechanics.endTime")}</label>
                <input id="finding-time-end" name="timeRangeEndSeconds" type="number" min="0" step="0.01" placeholder="${optionLabel("unknown")}" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro">
              </div>
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-400" for="finding-video-id">${t("biomechanics.videoId")}</label>
              <input id="finding-video-id" name="videoId" type="text" placeholder="${optionLabel("unknown")}" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro">
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-400" for="finding-observation">${t("biomechanics.observation")}</label>
              <textarea id="finding-observation" name="observation" rows="4" required placeholder="${t("biomechanics.observationPlaceholder")}" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro"></textarea>
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-400" for="finding-impact">${t("biomechanics.impact")}</label>
              <textarea id="finding-impact" name="impact" rows="3" placeholder="${t("biomechanics.impactPlaceholder")}" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro"></textarea>
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-400" for="finding-recommendations">${t("common.recommendations")}</label>
              <textarea id="finding-recommendations" name="recommendations" rows="4" placeholder="${t("biomechanics.recommendationsPlaceholder")}" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro"></textarea>
            </div>
            <div class="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
              <button type="submit" class="inline-flex items-center justify-center gap-2 bg-skating-pro hover:bg-purple-600 text-white font-bold rounded-xl px-5 py-3 transition-all">
                <i class="fa-solid fa-plus"></i>${t("biomechanics.addFinding")}
              </button>
              <p data-biomechanics-form-status class="text-sm text-slate-400"></p>
            </div>
          </form>
        </section>
        <section data-biomechanics-findings data-session-id="${escapedSessionId}" class="space-y-4">
          ${renderEmptyState(t("biomechanics.loadingTitle"), t("biomechanics.loadingDescription"), "fa-spinner")}
        </section>
      </div>
    `,
  });
}
