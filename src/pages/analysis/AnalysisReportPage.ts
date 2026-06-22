import { escapeAttribute } from "./html";
import { renderPageShell, renderSessionTabs, type PageRenderContext } from "./pageShell";

export function AnalysisReportPage(context: PageRenderContext): string {
  const sessionId = context.sessionId ?? "unknown";
  const escapedSessionId = escapeAttribute(sessionId);

  return renderPageShell({
    eyebrow: "Report",
    title: "Analysis Report",
    description: `Session ID: ${sessionId}. Generate, edit, save, finalize, and export a deterministic Analysis V1 report.`,
    content: `
      ${renderSessionTabs(sessionId, "report")}
      <section data-analysis-report-mvp data-session-id="${escapedSessionId}" class="space-y-5">
        <div data-report-session-header class="bg-skating-card border border-slate-700 rounded-2xl p-5 shadow-xl">
          <div class="flex items-center gap-3 text-sm text-slate-400">
            <i class="fa-solid fa-spinner"></i>
            <span>Loading session and lab data...</span>
          </div>
        </div>

        <div data-report-source-summary class="bg-skating-card border border-slate-700 rounded-2xl p-5 shadow-xl">
          <div class="flex items-center gap-3 text-sm text-slate-400">
            <i class="fa-solid fa-spinner"></i>
            <span>Loading report source data...</span>
          </div>
        </div>

        <form data-analysis-report-form class="bg-skating-card border border-slate-700 rounded-2xl p-5 shadow-xl space-y-5">
          <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.18em] text-skating-neon">Draft Report</p>
              <h2 class="mt-2 text-2xl font-black text-white">Manual Review Fields</h2>
              <p class="mt-2 text-sm text-slate-400 max-w-3xl">The generated report is deterministic. You can edit the title, summary, and recommendations before saving or marking final.</p>
            </div>
            <div data-report-status-badge class="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-bold text-slate-300">Draft preview</div>
          </div>

          <label class="block">
            <span class="block text-xs font-bold uppercase tracking-wider text-slate-400">Title</span>
            <input name="title" type="text" required class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro">
          </label>

          <label class="block">
            <span class="block text-xs font-bold uppercase tracking-wider text-slate-400">Summary</span>
            <textarea name="summary" rows="5" required class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro"></textarea>
          </label>

          <label class="block">
            <span class="block text-xs font-bold uppercase tracking-wider text-slate-400">Key Recommendations</span>
            <textarea name="keyRecommendations" rows="7" placeholder="One recommendation per line" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro"></textarea>
          </label>

          <div class="flex flex-col lg:flex-row lg:items-center gap-3">
            <button type="button" data-generate-report-draft class="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-bold text-slate-200 hover:border-skating-pro transition-all">
              <i class="fa-solid fa-wand-magic-sparkles"></i>Generate Draft
            </button>
            <button type="submit" data-save-report-draft class="inline-flex items-center justify-center gap-2 bg-skating-pro hover:bg-purple-600 text-white font-bold rounded-xl px-5 py-3 transition-all">
              <i class="fa-solid fa-floppy-disk"></i>Save Draft
            </button>
            <button type="button" data-finalize-report class="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-3 text-sm font-bold text-emerald-200 hover:bg-emerald-500/20 transition-all">
              <i class="fa-solid fa-circle-check"></i>Mark Final
            </button>
            <p data-report-form-status class="text-sm text-slate-400"></p>
          </div>
        </form>

        <div class="bg-skating-card border border-slate-700 rounded-2xl p-5 shadow-xl space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.18em] text-skating-neon">Markdown Export</p>
              <h2 class="mt-2 text-2xl font-black text-white">Report Text</h2>
            </div>
            <button type="button" data-copy-report-markdown class="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-bold text-slate-200 hover:border-skating-pro transition-all">
              <i class="fa-solid fa-copy"></i>Copy Markdown
            </button>
          </div>
          <textarea data-report-markdown rows="18" readonly class="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 font-mono text-xs text-slate-200 outline-none"></textarea>
        </div>
      </section>
    `,
  });
}
