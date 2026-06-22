import { getAnalysisUserContext, type AnalysisUserContext } from "../../firebase/auth";
import {
  createBiomechanicsFinding,
  deleteBiomechanicsFinding,
  listFindingsBySession,
  updateBiomechanicsFinding,
  type CreateBiomechanicsFindingInput,
  type UpdateBiomechanicsFindingInput,
} from "../../services/analysisFirestoreService";
import type {
  AnalysisTimeRange,
  BiomechanicsFinding,
  BiomechanicsFindingStatus,
  BiomechanicsIssueType,
  BiomechanicsSeverity,
  SkatingSide,
} from "../../types/analysis";
import type { PageRenderContext } from "./pageShell";

const ISSUE_TYPES = [
  "posture",
  "edge-control",
  "knee-flexion",
  "pelvis-height",
  "ankle-recovery",
  "support-leg",
  "timing",
  "symmetry",
  "stability",
] as const satisfies readonly BiomechanicsIssueType[];

const FINDING_STATUSES = ["open", "acknowledged", "improving", "resolved", "dismissed"] as const satisfies readonly BiomechanicsFindingStatus[];
const SEVERITIES = ["info", "low", "medium", "high"] as const satisfies readonly BiomechanicsSeverity[];
const SIDES = ["left", "right", "both", "unknown"] as const satisfies readonly SkatingSide[];

export function initializeBiomechanicsMvp(root: HTMLElement, context: PageRenderContext): void {
  const labContainer = root.querySelector<HTMLElement>("[data-biomechanics-findings]");

  if (labContainer && context.sessionId) {
    bindCreateFindingForm(root, context.sessionId);
    void loadBiomechanicsFindings(root, context.sessionId);
  }

  const summaryContainer = root.querySelector<HTMLElement>("[data-session-findings-summary]");

  if (summaryContainer && context.sessionId) {
    void loadFindingsSummary(summaryContainer, context.sessionId);
  }
}

function bindCreateFindingForm(root: HTMLElement, sessionId: string): void {
  const form = root.querySelector<HTMLFormElement>('form[data-biomechanics-finding-form][data-mode="create"]');

  if (!form) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const context = await getAnalysisUserContext();
      const payload = buildCreatePayload(form, context, sessionId);
      setFormDisabled(form, true);
      setFormStatus(form, "Saving finding...", "neutral");
      await createBiomechanicsFinding(context, payload);
      form.reset();
      setNamedField(form, "issueType", "posture");
      setNamedField(form, "side", "both");
      setNamedField(form, "severity", "info");
      setNamedField(form, "status", "open");
      setFormStatus(form, "Finding saved.", "success");
      setFormDisabled(form, false);
      await loadBiomechanicsFindings(root, sessionId);
    } catch (error) {
      setFormStatus(form, getErrorMessage(error), "error");
      setFormDisabled(form, false);
    }
  });
}

async function loadBiomechanicsFindings(root: HTMLElement, sessionId: string): Promise<void> {
  const container = root.querySelector<HTMLElement>("[data-biomechanics-findings]");

  if (!container) {
    return;
  }

  container.innerHTML = renderLoadingState("Loading biomechanics findings...");

  try {
    const context = await getAnalysisUserContext();
    const findings = await loadFindings(context, sessionId);
    container.innerHTML = renderFindings(findings);
    bindFindingActions(container, context, sessionId, root);
  } catch (error) {
    container.innerHTML = renderErrorState("Unable to load biomechanics findings", getErrorMessage(error));
  }
}

async function loadFindingsSummary(container: HTMLElement, sessionId: string): Promise<void> {
  try {
    const context = await getAnalysisUserContext();
    const findings = await loadFindings(context, sessionId);
    container.innerHTML = renderFindingsSummary(findings, sessionId);
  } catch (error) {
    container.innerHTML = renderErrorState("Unable to load findings summary", getErrorMessage(error));
  }
}

async function loadFindings(context: AnalysisUserContext, sessionId: string): Promise<BiomechanicsFinding[]> {
  const findings = await listFindingsBySession(context, sessionId);
  return [...findings].sort((first, second) => severityRank(second.severity) - severityRank(first.severity));
}

function bindFindingActions(container: HTMLElement, context: AnalysisUserContext, sessionId: string, root: HTMLElement): void {
  container.querySelectorAll<HTMLFormElement>('form[data-biomechanics-finding-form][data-mode="edit"]')
    .forEach((form) => {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const findingId = form.dataset.findingId;

        if (!findingId) {
          setFormStatus(form, "Missing finding id.", "error");
          return;
        }

        try {
          const payload = buildUpdatePayload(form);
          setFormDisabled(form, true);
          setFormStatus(form, "Saving finding...", "neutral");
          await updateBiomechanicsFinding(context, findingId, payload);
          setFormStatus(form, "Finding saved.", "success");
          setFormDisabled(form, false);
          await loadBiomechanicsFindings(root, sessionId);
        } catch (error) {
          setFormStatus(form, getErrorMessage(error), "error");
          setFormDisabled(form, false);
        }
      });
    });

  container.querySelectorAll<HTMLButtonElement>("[data-delete-finding-id]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        const findingId = button.dataset.deleteFindingId;

        if (!findingId) {
          return;
        }

        if (!window.confirm("Delete this biomechanics finding?")) {
          return;
        }

        button.disabled = true;

        try {
          await deleteBiomechanicsFinding(context, findingId);
          await loadBiomechanicsFindings(root, sessionId);
        } catch (error) {
          button.disabled = false;
          container.insertAdjacentHTML("afterbegin", renderErrorState("Unable to delete finding", getErrorMessage(error)));
        }
      });
    });
}

function buildCreatePayload(
  form: HTMLFormElement,
  context: AnalysisUserContext,
  sessionId: string,
): CreateBiomechanicsFindingInput {
  return {
    ...readFindingForm(form),
    ownerUserId: context.ownerUserId,
    athleteId: context.athleteId,
    sourceApp: "blaze-skate-analysis",
    schemaVersion: "skatingx-analysis-v1",
    sessionId,
    sourceType: "manual-entry",
  };
}

function buildUpdatePayload(form: HTMLFormElement): UpdateBiomechanicsFindingInput {
  return readFindingForm(form);
}

function readFindingForm(form: HTMLFormElement): Omit<
  CreateBiomechanicsFindingInput,
  "ownerUserId" | "athleteId" | "sourceApp" | "schemaVersion" | "sessionId" | "sourceType"
> {
  const formData = new FormData(form);
  const title = String(formData.get("title") ?? "").trim();
  const issueType = coerceIssueType(String(formData.get("issueType") ?? "posture"));
  const status = coerceStatus(String(formData.get("status") ?? "open"));
  const severity = coerceSeverity(String(formData.get("severity") ?? "info"));
  const side = coerceSide(String(formData.get("side") ?? "both"));
  const videoId = String(formData.get("videoId") ?? "").trim();
  const trendKey = String(formData.get("trendKey") ?? "").trim();
  const observation = String(formData.get("observation") ?? "").trim();
  const impact = String(formData.get("impact") ?? "").trim();
  const recommendations = splitLines(String(formData.get("recommendations") ?? ""));
  const timeRange = readOptionalTimeRange(formData);
  const confidenceScore = readOptionalNumber(formData.get("confidenceScore"));

  if (!title) {
    throw new Error("Issue title is required.");
  }

  if (!observation) {
    throw new Error("Observation is required.");
  }

  if (confidenceScore !== undefined && (confidenceScore < 0 || confidenceScore > 1)) {
    throw new Error("Confidence must be between 0 and 1.");
  }

  return {
    title,
    issueType,
    status,
    severity,
    side,
    description: buildDescription(observation, impact),
    observation,
    impact,
    recommendations,
    ...(videoId ? { videoId } : {}),
    ...(timeRange ? { timeRange, frameTimeSeconds: timeRange.startSeconds } : {}),
    ...(confidenceScore !== undefined ? { confidenceScore } : {}),
    ...(trendKey ? { trendKey } : {}),
  };
}

function renderFindings(findings: readonly BiomechanicsFinding[]): string {
  if (findings.length === 0) {
    return renderEmptyState(
      "No biomechanics findings yet",
      "Add the first manual finding for this session. MediaPipe and automatic pose analysis are intentionally out of scope for this MVP.",
    );
  }

  const groupedFindings = ISSUE_TYPES
    .map((issueType) => ({
      issueType,
      findings: findings.filter((finding) => finding.issueType === issueType),
    }))
    .filter((group) => group.findings.length > 0);

  return `
    <div class="space-y-5">
      <div class="bg-skating-card border border-slate-700 rounded-2xl p-5 shadow-xl">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Findings</p>
            <h2 class="mt-1 text-2xl font-black text-white">${findings.length} biomechanics finding${findings.length === 1 ? "" : "s"}</h2>
          </div>
          <div class="flex flex-wrap gap-2">${renderSeverityCounts(findings)}</div>
        </div>
      </div>
      ${groupedFindings.map(renderFindingGroup).join("")}
    </div>
  `;
}

function renderFindingGroup(group: { readonly issueType: BiomechanicsIssueType; readonly findings: readonly BiomechanicsFinding[] }): string {
  return `
    <section class="bg-skating-card border border-slate-700 rounded-2xl p-5 shadow-xl">
      <div class="flex items-center justify-between gap-3">
        <h3 class="text-lg font-black text-white">${formatIssueType(group.issueType)}</h3>
        <span class="rounded-full bg-slate-900 border border-slate-700 px-3 py-1 text-xs font-bold text-slate-300">${group.findings.length}</span>
      </div>
      <div class="mt-4 space-y-4">
        ${group.findings.map(renderFindingCard).join("")}
      </div>
    </section>
  `;
}

function renderFindingCard(finding: BiomechanicsFinding): string {
  const sections = getFindingSections(finding);
  const confidence = typeof finding.confidenceScore === "number" ? `${Math.round(finding.confidenceScore * 100)}%` : "Not set";
  const videoTime = formatTimeRange(finding.timeRange, finding.frameTimeSeconds);
  const videoId = finding.videoId ?? "";

  return `
    <article class="rounded-2xl bg-slate-900 border border-slate-700 p-4">
      <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        <div>
          <h4 class="text-lg font-black text-white">${escapeHtml(finding.title)}</h4>
          <p class="mt-1 text-sm text-slate-400">${formatIssueType(finding.issueType)} · ${formatSide(finding.side)} side</p>
        </div>
        <div class="flex flex-wrap gap-2">
          ${renderSeverityBadge(finding.severity)}
          ${renderStatusBadge(finding.status)}
        </div>
      </div>
      <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div class="rounded-xl border border-slate-700 bg-slate-950 p-3">
          <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Confidence</p>
          <p class="mt-1 text-sm font-bold text-slate-200">${escapeHtml(confidence)}</p>
        </div>
        <div class="rounded-xl border border-slate-700 bg-slate-950 p-3">
          <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Video Time</p>
          <p class="mt-1 text-sm font-bold text-slate-200">${escapeHtml(videoTime)}</p>
        </div>
        <div class="rounded-xl border border-slate-700 bg-slate-950 p-3">
          <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Trend Key</p>
          <p class="mt-1 text-sm font-bold text-slate-200">${escapeHtml(finding.trendKey || "Not set")}</p>
        </div>
      </div>
      <p class="mt-3 text-xs text-slate-500">Video ID: ${escapeHtml(videoId || "Not linked")}</p>
      <div class="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Observation</p>
          <p class="mt-2 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">${escapeHtml(sections.observation)}</p>
        </div>
        <div>
          <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Impact</p>
          <p class="mt-2 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">${escapeHtml(sections.impact || "No impact note yet.")}</p>
        </div>
      </div>
      <div class="mt-4">
        <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Recommendations</p>
        ${renderRecommendations(finding.recommendations)}
      </div>
      <details class="mt-5 rounded-xl border border-slate-700 bg-slate-950 p-4">
        <summary class="cursor-pointer text-sm font-bold text-skating-neon">Edit finding</summary>
        ${renderEditForm(finding, sections)}
      </details>
      <div class="mt-4 flex justify-end">
        <button type="button" data-delete-finding-id="${escapeHtml(finding.id)}" class="inline-flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-200 hover:bg-red-500/20 transition-all">
          <i class="fa-solid fa-trash"></i>Delete
        </button>
      </div>
    </article>
  `;
}

function renderEditForm(finding: BiomechanicsFinding, sections: { readonly observation: string; readonly impact: string }): string {
  return `
    <form data-biomechanics-finding-form data-mode="edit" data-finding-id="${escapeHtml(finding.id)}" class="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
      ${renderTextInput("title", "Issue", finding.title, true)}
      ${renderTextInput("videoId", "Video ID", finding.videoId ?? "", false)}
      ${renderSelect("issueType", "Category", ISSUE_TYPES, finding.issueType, formatIssueType)}
      ${renderSelect("side", "Side", SIDES, finding.side, formatSide)}
      ${renderSelect("severity", "Severity", SEVERITIES, finding.severity, formatSeverity)}
      ${renderSelect("status", "Status", FINDING_STATUSES, finding.status, formatStatus)}
      ${renderNumberInput("confidenceScore", "Confidence", finding.confidenceScore)}
      ${renderTextInput("trendKey", "Trend Key", finding.trendKey ?? "", false)}
      ${renderNumberInput("timeRangeStartSeconds", "Start Time", getTimeRangeStart(finding), false)}
      ${renderNumberInput("timeRangeEndSeconds", "End Time", finding.timeRange?.endSeconds, false)}
      <div class="lg:col-span-2">
        <label class="block text-xs font-bold uppercase tracking-wider text-slate-400">Observation</label>
        <textarea name="observation" rows="4" required class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro">${escapeHtml(sections.observation)}</textarea>
      </div>
      <div class="lg:col-span-2">
        <label class="block text-xs font-bold uppercase tracking-wider text-slate-400">Impact</label>
        <textarea name="impact" rows="3" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro">${escapeHtml(sections.impact)}</textarea>
      </div>
      <div class="lg:col-span-2">
        <label class="block text-xs font-bold uppercase tracking-wider text-slate-400">Recommendations</label>
        <textarea name="recommendations" rows="4" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro">${escapeHtml(finding.recommendations.join("\n"))}</textarea>
      </div>
      <div class="lg:col-span-2 flex flex-col sm:flex-row sm:items-center gap-3">
        <button type="submit" class="inline-flex items-center justify-center gap-2 bg-skating-pro hover:bg-purple-600 text-white font-bold rounded-xl px-5 py-3 transition-all">
          <i class="fa-solid fa-floppy-disk"></i>Save Finding
        </button>
        <p data-biomechanics-form-status class="text-sm text-slate-400"></p>
      </div>
    </form>
  `;
}

function renderFindingsSummary(findings: readonly BiomechanicsFinding[], sessionId: string): string {
  const openCount = findings.filter((finding) => finding.status !== "resolved" && finding.status !== "dismissed").length;
  const highCount = findings.filter((finding) => finding.severity === "high").length;

  return `
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <p class="text-xs font-black uppercase tracking-[0.18em] text-skating-neon">Biomechanics Summary</p>
        <h2 class="mt-2 text-xl font-black text-white">${findings.length} finding${findings.length === 1 ? "" : "s"} linked to this session</h2>
        <p class="mt-2 text-sm text-slate-400">${openCount} active · ${highCount} high severity</p>
      </div>
      <a data-analysis-link href="/analysis/sessions/${encodeURIComponent(sessionId)}/biomechanics" class="inline-flex items-center justify-center gap-2 rounded-xl border border-skating-pro bg-purple-500/10 px-4 py-2 text-sm font-bold text-purple-200 hover:bg-purple-500/20 transition-all">
        <i class="fa-solid fa-microscope"></i>Open Biomechanics Lab
      </a>
    </div>
  `;
}

function renderTextInput(name: string, label: string, value: string, required: boolean): string {
  return `
    <div>
      <label class="block text-xs font-bold uppercase tracking-wider text-slate-400">${escapeHtml(label)}</label>
      <input name="${escapeHtml(name)}" type="text" value="${escapeHtml(value)}" ${required ? "required" : ""} class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro">
    </div>
  `;
}

function renderNumberInput(name: "confidenceScore" | "timeRangeStartSeconds" | "timeRangeEndSeconds", label: string, value: number | undefined, showMax = true): string {
  const bounds = showMax && name === "confidenceScore" ? 'min="0" max="1" step="0.01"' : 'min="0" step="0.01"';

  return `
    <div>
      <label class="block text-xs font-bold uppercase tracking-wider text-slate-400">${escapeHtml(label)}</label>
      <input name="${name}" type="number" ${bounds} value="${value ?? ""}" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro">
    </div>
  `;
}

function renderSelect<T extends string>(
  name: string,
  label: string,
  values: readonly T[],
  selectedValue: T,
  format: (value: T) => string,
): string {
  return `
    <div>
      <label class="block text-xs font-bold uppercase tracking-wider text-slate-400">${escapeHtml(label)}</label>
      <select name="${escapeHtml(name)}" class="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-skating-pro">
        ${values.map((value) => `<option value="${escapeHtml(value)}" ${value === selectedValue ? "selected" : ""}>${escapeHtml(format(value))}</option>`).join("")}
      </select>
    </div>
  `;
}

function renderRecommendations(recommendations: readonly string[]): string {
  if (recommendations.length === 0) {
    return `<p class="mt-2 text-sm text-slate-500">No recommendations yet.</p>`;
  }

  return `
    <ul class="mt-2 space-y-1 text-sm text-slate-300">
      ${recommendations.map((recommendation) => `<li class="flex gap-2"><span class="text-skating-neon">-</span><span>${escapeHtml(recommendation)}</span></li>`).join("")}
    </ul>
  `;
}

function renderSeverityCounts(findings: readonly BiomechanicsFinding[]): string {
  return SEVERITIES
    .map((severity) => {
      const count = findings.filter((finding) => finding.severity === severity).length;
      return `<span class="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-bold text-slate-300">${formatSeverity(severity)}: ${count}</span>`;
    })
    .join("");
}

function renderSeverityBadge(severity: BiomechanicsSeverity): string {
  const classes = {
    info: "border-sky-500/40 bg-sky-500/10 text-sky-200",
    low: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
    medium: "border-amber-500/40 bg-amber-500/10 text-amber-200",
    high: "border-red-500/40 bg-red-500/10 text-red-200",
  } as const;

  return `<span class="rounded-full border px-3 py-1 text-xs font-bold ${classes[severity]}">${formatSeverity(severity)}</span>`;
}

function renderStatusBadge(status: BiomechanicsFindingStatus): string {
  return `<span class="rounded-full border border-slate-600 bg-slate-800 px-3 py-1 text-xs font-bold text-slate-200">${formatStatus(status)}</span>`;
}

function renderLoadingState(message: string): string {
  return `
    <div class="bg-skating-card border border-slate-700 rounded-2xl p-6 shadow-xl text-sm text-slate-400">
      <i class="fa-solid fa-spinner"></i>
      <span class="ml-2">${escapeHtml(message)}</span>
    </div>
  `;
}

function renderEmptyState(title: string, description: string): string {
  return `
    <div class="bg-skating-card/50 border border-dashed border-slate-700 rounded-2xl p-10 text-center">
      <div class="mx-auto w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 text-xl">
        <i class="fa-solid fa-microscope"></i>
      </div>
      <h2 class="mt-4 text-lg font-bold text-slate-200">${escapeHtml(title)}</h2>
      <p class="mt-2 text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">${escapeHtml(description)}</p>
    </div>
  `;
}

function renderErrorState(title: string, description: string): string {
  return `
    <div class="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
      <h2 class="text-lg font-black text-red-200">${escapeHtml(title)}</h2>
      <p class="mt-2 text-sm text-red-100/80 leading-relaxed">${escapeHtml(description)}</p>
    </div>
  `;
}

function setNamedField(form: HTMLFormElement, name: string, value: string): void {
  const field = form.elements.namedItem(name);

  if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) {
    field.value = value;
  }
}

function setFormDisabled(form: HTMLFormElement, disabled: boolean): void {
  form.querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("button,input,select,textarea")
    .forEach((field) => {
      field.disabled = disabled;
    });
}

function setFormStatus(form: HTMLFormElement, message: string, tone: "neutral" | "success" | "error"): void {
  const status = form.querySelector<HTMLElement>("[data-biomechanics-form-status]");

  if (!status) {
    return;
  }

  const toneClasses = {
    neutral: "text-slate-400",
    success: "text-skating-success",
    error: "text-red-400",
  } as const;

  status.className = `text-sm font-bold ${toneClasses[tone]}`;
  status.textContent = message;
}

function coerceIssueType(value: string): BiomechanicsIssueType {
  return ISSUE_TYPES.includes(value as BiomechanicsIssueType) ? value as BiomechanicsIssueType : "posture";
}

function coerceStatus(value: string): BiomechanicsFindingStatus {
  return FINDING_STATUSES.includes(value as BiomechanicsFindingStatus) ? value as BiomechanicsFindingStatus : "open";
}

function coerceSeverity(value: string): BiomechanicsSeverity {
  return SEVERITIES.includes(value as BiomechanicsSeverity) ? value as BiomechanicsSeverity : "info";
}

function coerceSide(value: string): SkatingSide {
  return SIDES.includes(value as SkatingSide) ? value as SkatingSide : "both";
}

function buildDescription(observation: string, impact: string): string {
  return `Observation:\n${observation}\n\nImpact:\n${impact || "Not specified."}`;
}

function parseDescription(description: string): { readonly observation: string; readonly impact: string } {
  const marker = "\n\nImpact:\n";

  if (!description.startsWith("Observation:\n") || !description.includes(marker)) {
    return { observation: description, impact: "" };
  }

  const withoutObservationLabel = description.slice("Observation:\n".length);
  const markerIndex = withoutObservationLabel.indexOf(marker);

  if (markerIndex < 0) {
    return { observation: withoutObservationLabel, impact: "" };
  }

  return {
    observation: withoutObservationLabel.slice(0, markerIndex),
    impact: withoutObservationLabel.slice(markerIndex + marker.length),
  };
}

function getFindingSections(finding: BiomechanicsFinding): { readonly observation: string; readonly impact: string } {
  const parsedSections = parseDescription(finding.description);

  return {
    observation: finding.observation?.trim() || parsedSections.observation,
    impact: finding.impact?.trim() || parsedSections.impact,
  };
}

function readOptionalNumber(value: FormDataEntryValue | null): number | undefined {
  const rawValue = String(value ?? "").trim();

  if (!rawValue) {
    return undefined;
  }

  const parsed = Number(rawValue);

  if (!Number.isFinite(parsed)) {
    throw new Error("Numeric fields must contain valid numbers.");
  }

  return parsed;
}

function readOptionalTimeRange(formData: FormData): AnalysisTimeRange | undefined {
  const startSeconds = readOptionalNumber(formData.get("timeRangeStartSeconds"));
  const endSeconds = readOptionalNumber(formData.get("timeRangeEndSeconds"));

  if (startSeconds === undefined && endSeconds === undefined) {
    return undefined;
  }

  if (startSeconds === undefined) {
    throw new Error("Start time is required when end time is set.");
  }

  if (endSeconds !== undefined && endSeconds < startSeconds) {
    throw new Error("End time must be greater than or equal to start time.");
  }

  return {
    startSeconds,
    ...(endSeconds !== undefined ? { endSeconds } : {}),
  };
}

function getTimeRangeStart(finding: BiomechanicsFinding): number | undefined {
  return finding.timeRange?.startSeconds ?? finding.frameTimeSeconds;
}

function formatTimeRange(timeRange: AnalysisTimeRange | undefined, frameTimeSeconds: number | undefined): string {
  if (timeRange) {
    return typeof timeRange.endSeconds === "number"
      ? `${timeRange.startSeconds}s - ${timeRange.endSeconds}s`
      : `${timeRange.startSeconds}s`;
  }

  return typeof frameTimeSeconds === "number" ? `${frameTimeSeconds}s` : "Not set";
}

function splitLines(value: string): readonly string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function severityRank(severity: BiomechanicsSeverity): number {
  const ranks = {
    info: 0,
    low: 1,
    medium: 2,
    high: 3,
  } as const;

  return ranks[severity];
}

function formatIssueType(issueType: BiomechanicsIssueType): string {
  const labels = {
    posture: "Posture",
    "edge-control": "Edge Control",
    "knee-flexion": "Knee Flexion",
    "pelvis-height": "Pelvis Height",
    "ankle-recovery": "Ankle Recovery",
    "support-leg": "Support Leg",
    timing: "Timing",
    symmetry: "Symmetry",
    stability: "Stability",
  } as const;

  return labels[issueType];
}

function formatStatus(status: BiomechanicsFindingStatus): string {
  const labels = {
    open: "Open",
    acknowledged: "Acknowledged",
    improving: "Improving",
    resolved: "Resolved",
    dismissed: "Dismissed",
  } as const;

  return labels[status];
}

function formatSeverity(severity: BiomechanicsSeverity): string {
  const labels = {
    info: "Info",
    low: "Low",
    medium: "Medium",
    high: "High",
  } as const;

  return labels[severity];
}

function formatSide(side: SkatingSide): string {
  const labels = {
    left: "Left",
    right: "Right",
    both: "Both",
    unknown: "Unknown",
  } as const;

  return labels[side];
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected Biomechanics Lab error.";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
