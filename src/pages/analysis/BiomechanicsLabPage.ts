import { renderEmptyState, renderPageShell, renderSessionTabs, type PageRenderContext } from "./pageShell";

export function BiomechanicsLabPage(context: PageRenderContext): string {
  const sessionId = context.sessionId ?? "unknown";

  return renderPageShell({
    eyebrow: "Biomechanics",
    title: "Biomechanics Lab",
    description: `Session ID: ${sessionId}. Capture manual biomechanics findings for this Analysis V1 session.`,
    content: `
      ${renderSessionTabs(sessionId, "biomechanics")}
      <div class="grid grid-cols-1 xl:grid-cols-[minmax(320px,420px)_1fr] gap-6 items-start">
        <section class="bg-skating-card border border-slate-700 rounded-2xl p-6 shadow-xl">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.18em] text-skating-neon">Manual Finding</p>
              <h2 class="mt-2 text-xl font-black text-white">Add Finding</h2>
            </div>
            <i class="fa-solid fa-microscope text-skating-pro"></i>
          </div>
          <form data-biomechanics-finding-form data-mode="create" data-session-id="${sessionId}" class="mt-5 space-y-4">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-400" for="finding-title">Issue</label>
              <input id="finding-title" name="title" type="text" required placeholder="e.g. Late knee bend in corner entry" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro">
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-400" for="finding-issue-type">Category</label>
                <select id="finding-issue-type" name="issueType" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro">
                  <option value="posture">Posture</option>
                  <option value="edge-control">Edge Control</option>
                  <option value="knee-flexion">Knee Flexion</option>
                  <option value="pelvis-height">Pelvis Height</option>
                  <option value="ankle-recovery">Ankle Recovery</option>
                  <option value="support-leg">Support Leg</option>
                  <option value="timing">Timing</option>
                  <option value="symmetry">Symmetry</option>
                  <option value="stability">Stability</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-400" for="finding-side">Side</label>
                <select id="finding-side" name="side" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro">
                  <option value="both">Both</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-400" for="finding-severity">Severity</label>
                <select id="finding-severity" name="severity" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro">
                  <option value="info">Info</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-400" for="finding-status">Status</label>
                <select id="finding-status" name="status" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro">
                  <option value="open">Open</option>
                  <option value="acknowledged">Acknowledged</option>
                  <option value="improving">Improving</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-400" for="finding-confidence">Confidence</label>
                <input id="finding-confidence" name="confidenceScore" type="number" min="0" max="1" step="0.01" placeholder="0.85" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro">
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-400" for="finding-trend-key">Trend Key</label>
                <input id="finding-trend-key" name="trendKey" type="text" placeholder="corner-entry:knee-flexion" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro">
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-400" for="finding-time-start">Start Time</label>
                <input id="finding-time-start" name="timeRangeStartSeconds" type="number" min="0" step="0.01" placeholder="12.5 seconds" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro">
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-400" for="finding-time-end">End Time</label>
                <input id="finding-time-end" name="timeRangeEndSeconds" type="number" min="0" step="0.01" placeholder="Optional" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro">
              </div>
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-400" for="finding-video-id">Video ID</label>
              <input id="finding-video-id" name="videoId" type="text" placeholder="Optional" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro">
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-400" for="finding-observation">Observation</label>
              <textarea id="finding-observation" name="observation" rows="4" required placeholder="What did you see?" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro"></textarea>
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-400" for="finding-impact">Impact</label>
              <textarea id="finding-impact" name="impact" rows="3" placeholder="Why does it matter?" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro"></textarea>
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-400" for="finding-recommendations">Recommendations</label>
              <textarea id="finding-recommendations" name="recommendations" rows="4" placeholder="One recommendation per line" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro"></textarea>
            </div>
            <div class="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
              <button type="submit" class="inline-flex items-center justify-center gap-2 bg-skating-pro hover:bg-purple-600 text-white font-bold rounded-xl px-5 py-3 transition-all">
                <i class="fa-solid fa-plus"></i>Add Finding
              </button>
              <p data-biomechanics-form-status class="text-sm text-slate-400"></p>
            </div>
          </form>
        </section>
        <section data-biomechanics-findings data-session-id="${sessionId}" class="space-y-4">
          ${renderEmptyState("Loading biomechanics findings", "Fetching manual findings for this session.", "fa-spinner")}
        </section>
      </div>
    `,
  });
}
