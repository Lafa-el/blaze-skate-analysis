import {
  AnalysisDashboardPage,
  AnalysisReportPage,
  AnalysisSessionDetailPage,
  AnalysisSessionsPage,
  AnalysisSettingsPage,
  BiomechanicsLabPage,
  EquipmentLabPage,
  NewAnalysisSessionPage,
  PaceLabPage,
  VideoDetailPage,
  VideoLibraryPage,
  type PageRenderContext,
} from "../pages/analysis";

type AnalysisPage = (context: PageRenderContext) => string;

interface RouteMatch {
  readonly page: AnalysisPage;
  readonly context: PageRenderContext;
}

const SESSION_DETAIL_PATTERN = /^\/sessions\/([^/]+)$/;
const SESSION_CHILD_PATTERN = /^\/sessions\/([^/]+)\/(biomechanics|pace|equipment|report)$/;
const VIDEO_DETAIL_PATTERN = /^\/videos\/([^/]+)$/;

export function mountAnalysisRouter(): void {
  const root = document.getElementById("analysis-v1-root");

  if (!root) {
    return;
  }

  const render = () => {
    const match = matchRoute(window.location.pathname);
    root.innerHTML = renderAnalysisApp(match);
    document.body.dataset.analysisRoute = "active";
  };

  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[data-analysis-link]") : null;

    if (!target || target.origin !== window.location.origin) {
      return;
    }

    event.preventDefault();
    window.history.pushState(null, "", target.pathname);
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  window.addEventListener("popstate", render);
  render();
}

function matchRoute(path: string): RouteMatch {
  if (path === "/") {
    return { page: AnalysisDashboardPage, context: { path } };
  }

  if (path === "/sessions") {
    return { page: AnalysisSessionsPage, context: { path } };
  }

  if (path === "/sessions/new") {
    return { page: NewAnalysisSessionPage, context: { path } };
  }

  const sessionChildMatch = path.match(SESSION_CHILD_PATTERN);
  if (sessionChildMatch) {
    const sessionId = requireRouteParam(sessionChildMatch[1], "sessionId");
    const tab = requireRouteParam(sessionChildMatch[2], "sessionTab");
    const pageByTab = {
      biomechanics: BiomechanicsLabPage,
      pace: PaceLabPage,
      equipment: EquipmentLabPage,
      report: AnalysisReportPage,
    } as const;

    return {
      page: pageByTab[tab as keyof typeof pageByTab],
      context: { path, sessionId },
    };
  }

  const sessionDetailMatch = path.match(SESSION_DETAIL_PATTERN);
  if (sessionDetailMatch) {
    const sessionId = requireRouteParam(sessionDetailMatch[1], "sessionId");

    return {
      page: AnalysisSessionDetailPage,
      context: { path, sessionId },
    };
  }

  if (path === "/videos") {
    return { page: VideoLibraryPage, context: { path } };
  }

  const videoDetailMatch = path.match(VIDEO_DETAIL_PATTERN);
  if (videoDetailMatch) {
    const videoId = requireRouteParam(videoDetailMatch[1], "videoId");

    return {
      page: VideoDetailPage,
      context: { path, videoId },
    };
  }

  if (path === "/settings") {
    return { page: AnalysisSettingsPage, context: { path } };
  }

  return { page: AnalysisDashboardPage, context: { path } };
}

function requireRouteParam(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing route param: ${name}`);
  }

  return decodeURIComponent(value);
}

function renderAnalysisApp(match: RouteMatch): string {
  const navigation = [
    { label: "Dashboard", href: "/", icon: "fa-gauge-high" },
    { label: "Sessions", href: "/sessions", icon: "fa-layer-group" },
    { label: "Videos", href: "/videos", icon: "fa-video" },
    { label: "Settings", href: "/settings", icon: "fa-gear" },
  ];

  return `
    <div class="w-full max-w-[1400px] space-y-6">
      <header class="bg-skating-card border border-slate-700 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <a data-analysis-link href="/" class="flex items-center gap-3 group">
            <div class="w-11 h-11 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-skating-pro group-hover:border-skating-pro transition-colors">
              <i class="fa-solid fa-fire-flame-curved"></i>
            </div>
            <div>
              <p class="text-xs font-black uppercase tracking-[0.22em] text-skating-neon">Blaze Skate</p>
              <p class="text-xl font-black text-white leading-tight">Analysis V1</p>
            </div>
          </a>
          <nav class="flex flex-wrap gap-2" aria-label="Analysis main navigation">
            ${navigation
              .map((item) => {
                const isActive = item.href === "/" ? match.context.path === "/" : match.context.path.startsWith(item.href);
                const classes = isActive
                  ? "bg-skating-pro text-white border-skating-pro"
                  : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border-slate-700";

                return `
                  <a data-analysis-link href="${item.href}" class="inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-bold transition-all ${classes}">
                    <i class="fa-solid ${item.icon}"></i>${item.label}
                  </a>
                `;
              })
              .join("")}
          </nav>
        </div>
      </header>
      <main>${match.page(match.context)}</main>
    </div>
  `;
}
