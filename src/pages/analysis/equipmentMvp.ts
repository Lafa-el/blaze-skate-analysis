import { getAnalysisUserContext, type AnalysisUserContext } from "../../firebase/auth";
import {
  clearEquipmentSnapshotField,
  createEquipmentSnapshot,
  getAnalysisSession,
  getEquipmentSnapshotBySession,
  updateEquipmentSnapshot,
  type CreateEquipmentSnapshotInput,
  type UpdateEquipmentSnapshotInput,
} from "../../services/analysisFirestoreService";
import type {
  EquipmentAthleteFeedback,
  EquipmentBladeDetails,
  EquipmentBootDetails,
  EquipmentCategory,
  EquipmentConditionLevel,
  EquipmentIceDetails,
  EquipmentSharpeningDetails,
  EquipmentSnapshot,
  EquipmentSnapshotStatus,
  IceCondition,
  SharpeningStatus,
} from "../../types/analysis";
import { escapeHtml } from "./html";
import { optionLabel, t } from "./i18n";
import type { PageRenderContext } from "./pageShell";

const EQUIPMENT_CATEGORIES = ["boot", "blade", "rocker", "bend", "alignment", "fit"] as const satisfies readonly EquipmentCategory[];
const EQUIPMENT_STATUSES = ["draft", "active", "superseded", "archived"] as const satisfies readonly EquipmentSnapshotStatus[];
const CONDITION_LEVELS = ["none", "low", "medium", "high", "unknown"] as const satisfies readonly EquipmentConditionLevel[];
const SHARPENING_STATUSES = ["fresh", "good", "dull", "uneven", "unknown"] as const satisfies readonly SharpeningStatus[];
const ICE_CONDITIONS = ["hard", "soft", "cut-up", "wet", "frosty", "unknown"] as const satisfies readonly IceCondition[];
const CLEAR = clearEquipmentSnapshotField;

interface EquipmentFormValues {
  readonly category: EquipmentCategory;
  readonly status: EquipmentSnapshotStatus;
  readonly setupName?: string;
  readonly isCurrent: boolean;
  readonly boot?: EquipmentBootDetails;
  readonly blade?: EquipmentBladeDetails;
  readonly sharpening?: EquipmentSharpeningDetails;
  readonly ice?: EquipmentIceDetails;
  readonly athleteFeedback?: EquipmentAthleteFeedback;
  readonly leftOffsetMm?: number;
  readonly rightOffsetMm?: number;
  readonly recommendations: readonly string[];
}

export function initializeEquipmentMvp(root: HTMLElement, context: PageRenderContext): void {
  const equipmentLab = root.querySelector<HTMLElement>("[data-equipment-lab]");

  if (equipmentLab && context.sessionId) {
    bindEquipmentForm(root, context.sessionId);
    void loadEquipmentLab(root, context.sessionId);
  }

  const summaryContainer = root.querySelector<HTMLElement>("[data-session-equipment-summary]");

  if (summaryContainer && context.sessionId) {
    void loadEquipmentSummary(summaryContainer, context.sessionId);
  }
}

function bindEquipmentForm(root: HTMLElement, sessionId: string): void {
  const form = root.querySelector<HTMLFormElement>("form[data-equipment-snapshot-form]");

  if (!form) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const context = await getAnalysisUserContext();
      const snapshotId = form.dataset.equipmentSnapshotId;
      setFormDisabled(form, true);
      setFormStatus(form, t("equipment.savingSnapshot"), "neutral");

      if (snapshotId) {
        await updateEquipmentSnapshot(context, snapshotId, buildUpdatePayload(form));
      } else {
        await createEquipmentSnapshot(context, buildCreatePayload(form, context, sessionId));
      }

      setFormStatus(form, t("equipment.snapshotSaved"), "success");
      setFormDisabled(form, false);
      await loadEquipmentLab(root, sessionId);
    } catch (error) {
      setFormStatus(form, getErrorMessage(error), "error");
      setFormDisabled(form, false);
    }
  });
}

async function loadEquipmentLab(root: HTMLElement, sessionId: string): Promise<void> {
  const header = root.querySelector<HTMLElement>("[data-equipment-session-header]");
  const state = root.querySelector<HTMLElement>("[data-equipment-snapshot-state]");
  const form = root.querySelector<HTMLFormElement>("form[data-equipment-snapshot-form]");

  if (!state || !form) {
    return;
  }

  state.innerHTML = renderLoadingState(t("equipment.loadingSnapshot"));

  try {
    const context = await getAnalysisUserContext();
    const analysisSession = await getAnalysisSession(context, sessionId);

    if (!analysisSession) {
      if (header) {
        header.innerHTML = renderErrorState(t("equipment.sessionNotFoundTitle"), t("equipment.sessionNotFoundDescription"));
      }

      state.innerHTML = renderEmptyState(t("equipment.noSnapshotAvailable"), t("equipment.validSessionRequired"));
      setFormDisabled(form, true);
      return;
    }

    if (header) {
      header.innerHTML = renderEquipmentHeader(analysisSession.title, sessionId);
    }

    const snapshot = await getEquipmentSnapshotBySession(context, sessionId);
    populateForm(form, snapshot);
    state.innerHTML = renderSnapshotState(snapshot);
  } catch (error) {
    if (header) {
      header.innerHTML = renderErrorState(t("equipment.unableLoadSession"), getErrorMessage(error));
    }

    state.innerHTML = renderErrorState(t("equipment.unableLoadSnapshot"), getErrorMessage(error));
  }
}

async function loadEquipmentSummary(container: HTMLElement, sessionId: string): Promise<void> {
  try {
    const context = await getAnalysisUserContext();
    const snapshot = await getEquipmentSnapshotBySession(context, sessionId);
    container.innerHTML = renderEquipmentSummary(snapshot, sessionId);
  } catch (error) {
    container.innerHTML = renderErrorState(t("equipment.unableLoadSummary"), getErrorMessage(error));
  }
}

function buildCreatePayload(
  form: HTMLFormElement,
  context: AnalysisUserContext,
  sessionId: string,
): CreateEquipmentSnapshotInput {
  const values = readEquipmentForm(form);
  const legacy = buildLegacyFields(values);

  return stripUndefined({
    ownerUserId: context.ownerUserId,
    athleteId: context.athleteId,
    sourceApp: "blaze-skate-analysis",
    schemaVersion: "skatingx-analysis-v1",
    sessionId,
    sourceType: "manual-entry",
    ...values,
    ...legacy,
  }) as CreateEquipmentSnapshotInput;
}

function buildUpdatePayload(form: HTMLFormElement): UpdateEquipmentSnapshotInput {
  const values = readEquipmentForm(form);
  const legacy = buildLegacyFields(values);
  const payload: Record<string, unknown> = {
    category: values.category,
    status: values.status,
    isCurrent: values.isCurrent,
    recommendations: values.recommendations,
    setupName: values.setupName ?? CLEAR(),
    boot: values.boot ?? CLEAR(),
    blade: values.blade ?? CLEAR(),
    sharpening: values.sharpening ?? CLEAR(),
    ice: values.ice ?? CLEAR(),
    athleteFeedback: values.athleteFeedback ?? CLEAR(),
    leftOffsetMm: values.leftOffsetMm ?? CLEAR(),
    rightOffsetMm: values.rightOffsetMm ?? CLEAR(),
    bootModel: legacy.bootModel ?? CLEAR(),
    bladeModel: legacy.bladeModel ?? CLEAR(),
    bladeLengthMm: legacy.bladeLengthMm ?? CLEAR(),
    rockerProfile: legacy.rockerProfile ?? CLEAR(),
    bendNotes: legacy.bendNotes ?? CLEAR(),
    symptoms: legacy.symptoms,
  };

  return payload as UpdateEquipmentSnapshotInput;
}

function readEquipmentForm(form: HTMLFormElement): EquipmentFormValues {
  const formData = new FormData(form);
  const category = coerceCategory(String(formData.get("category") ?? "blade"));
  const status = coerceStatus(String(formData.get("status") ?? "draft"));
  const setupName = readOptionalText(formData.get("setupName"));
  const isCurrent = formData.get("isCurrent") === "on";
  const recommendations = splitLines(String(formData.get("recommendations") ?? ""));
  const boot = readBootDetails(formData);
  const blade = readBladeDetails(formData);
  const sharpening = readSharpeningDetails(formData);
  const ice = readIceDetails(formData);
  const athleteFeedback = readAthleteFeedback(formData);
  const leftOffsetMm = readOptionalNumber(formData.get("leftOffsetMm"));
  const rightOffsetMm = readOptionalNumber(formData.get("rightOffsetMm"));

  if (
    !setupName
    && !boot
    && !blade
    && !sharpening
    && !ice
    && !athleteFeedback
    && recommendations.length === 0
    && leftOffsetMm === undefined
    && rightOffsetMm === undefined
  ) {
    throw new Error(t("equipment.detailRequired"));
  }

  return stripUndefined({
    category,
    status,
    isCurrent,
    recommendations,
    ...(setupName ? { setupName } : {}),
    ...(boot ? { boot } : {}),
    ...(blade ? { blade } : {}),
    ...(sharpening ? { sharpening } : {}),
    ...(ice ? { ice } : {}),
    ...(athleteFeedback ? { athleteFeedback } : {}),
    ...(leftOffsetMm !== undefined ? { leftOffsetMm } : {}),
    ...(rightOffsetMm !== undefined ? { rightOffsetMm } : {}),
  }) as EquipmentFormValues;
}

function readBootDetails(formData: FormData): EquipmentBootDetails | undefined {
  const brand = readOptionalText(formData.get("bootBrand"));
  const model = readOptionalText(formData.get("bootModel"));
  const size = readOptionalText(formData.get("bootSize"));
  const notes = readOptionalText(formData.get("bootNotes"));

  return compactObject<EquipmentBootDetails>({
    ...(brand ? { brand } : {}),
    ...(model ? { model } : {}),
    ...(size ? { size } : {}),
    ...(notes ? { notes } : {}),
  });
}

function readBladeDetails(formData: FormData): EquipmentBladeDetails | undefined {
  const brand = readOptionalText(formData.get("bladeBrand"));
  const model = readOptionalText(formData.get("bladeModel"));
  const lengthMm = readOptionalNumber(formData.get("bladeLengthMm"));
  const cup = readOptionalText(formData.get("bladeCup"));
  const rocker = readOptionalText(formData.get("bladeRocker"));
  const bend = readOptionalText(formData.get("bladeBend"));
  const notes = readOptionalText(formData.get("bladeNotes"));

  return compactObject<EquipmentBladeDetails>({
    ...(brand ? { brand } : {}),
    ...(model ? { model } : {}),
    ...(lengthMm !== undefined ? { lengthMm } : {}),
    ...(cup ? { cup } : {}),
    ...(rocker ? { rocker } : {}),
    ...(bend ? { bend } : {}),
    ...(notes ? { notes } : {}),
  });
}

function readSharpeningDetails(formData: FormData): EquipmentSharpeningDetails | undefined {
  const status = coerceSharpeningStatus(String(formData.get("sharpeningStatus") ?? "unknown"));
  const sharpenedAt = readOptionalText(formData.get("sharpenedAt"));
  const notes = readOptionalText(formData.get("sharpeningNotes"));

  return compactObject<EquipmentSharpeningDetails>({
    ...(status === "unknown" ? {} : { status }),
    ...(sharpenedAt ? { sharpenedAt } : {}),
    ...(notes ? { notes } : {}),
  });
}

function readIceDetails(formData: FormData): EquipmentIceDetails | undefined {
  const condition = coerceIceCondition(String(formData.get("iceCondition") ?? "unknown"));
  const rink = readOptionalText(formData.get("iceRink"));
  const surface = readOptionalText(formData.get("iceSurface"));
  const notes = readOptionalText(formData.get("iceNotes"));

  return compactObject<EquipmentIceDetails>({
    ...(rink ? { rink } : {}),
    ...(surface ? { surface } : {}),
    ...(condition === "unknown" ? {} : { condition }),
    ...(notes ? { notes } : {}),
  });
}

function readAthleteFeedback(formData: FormData): EquipmentAthleteFeedback | undefined {
  const fatigue = readConditionLevel(formData.get("fatigue"));
  const slipping = readConditionLevel(formData.get("slipping"));
  const stability = readConditionLevel(formData.get("stability"));
  const edgeGrip = readConditionLevel(formData.get("edgeGrip"));
  const confidence = readConditionLevel(formData.get("confidence"));
  const comments = readOptionalText(formData.get("feedbackComments"));

  return compactObject<EquipmentAthleteFeedback>({
    ...(fatigue ? { fatigue } : {}),
    ...(slipping ? { slipping } : {}),
    ...(stability ? { stability } : {}),
    ...(edgeGrip ? { edgeGrip } : {}),
    ...(confidence ? { confidence } : {}),
    ...(comments ? { comments } : {}),
  });
}

function buildLegacyFields(values: EquipmentFormValues): Partial<Pick<
  CreateEquipmentSnapshotInput,
  "bootModel" | "bladeModel" | "bladeLengthMm" | "rockerProfile" | "bendNotes" | "symptoms"
>> {
  return stripUndefined({
    bootModel: formatBootDetails(values.boot),
    bladeModel: formatBladeModel(values.blade),
    bladeLengthMm: values.blade?.lengthMm,
    rockerProfile: values.blade?.rocker,
    bendNotes: formatStructuredNotes(values),
    symptoms: formatFeedbackSymptoms(values.athleteFeedback),
  }) as Partial<Pick<
    CreateEquipmentSnapshotInput,
    "bootModel" | "bladeModel" | "bladeLengthMm" | "rockerProfile" | "bendNotes" | "symptoms"
  >>;
}

function populateForm(form: HTMLFormElement, snapshot: EquipmentSnapshot | null): void {
  if (!snapshot) {
    delete form.dataset.equipmentSnapshotId;
    form.reset();
    setNamedField(form, "category", "blade");
    setNamedField(form, "status", "active");
    setCheckboxField(form, "isCurrent", true);
    setNamedField(form, "sharpeningStatus", "unknown");
    setNamedField(form, "iceCondition", "unknown");
    ["fatigue", "slipping", "stability", "edgeGrip", "confidence"].forEach((name) => setNamedField(form, name, "unknown"));
    return;
  }

  form.dataset.equipmentSnapshotId = snapshot.id;
  setNamedField(form, "category", snapshot.category);
  setNamedField(form, "status", snapshot.status);
  setNamedField(form, "setupName", snapshot.setupName ?? "");
  setCheckboxField(form, "isCurrent", snapshot.isCurrent ?? true);
  setNamedField(form, "bootBrand", snapshot.boot?.brand ?? "");
  setNamedField(form, "bootModel", snapshot.boot?.model ?? snapshot.bootModel ?? "");
  setNamedField(form, "bootSize", snapshot.boot?.size ?? "");
  setNamedField(form, "bootNotes", snapshot.boot?.notes ?? "");
  setNamedField(form, "bladeBrand", snapshot.blade?.brand ?? "");
  setNamedField(form, "bladeModel", snapshot.blade?.model ?? snapshot.bladeModel ?? "");
  setNamedField(form, "bladeLengthMm", formatOptionalNumber(snapshot.blade?.lengthMm ?? snapshot.bladeLengthMm));
  setNamedField(form, "bladeCup", snapshot.blade?.cup ?? "");
  setNamedField(form, "bladeRocker", snapshot.blade?.rocker ?? snapshot.rockerProfile ?? "");
  setNamedField(form, "bladeBend", snapshot.blade?.bend ?? "");
  setNamedField(form, "leftOffsetMm", formatOptionalNumber(snapshot.leftOffsetMm));
  setNamedField(form, "rightOffsetMm", formatOptionalNumber(snapshot.rightOffsetMm));
  setNamedField(form, "bladeNotes", snapshot.blade?.notes ?? snapshot.bendNotes ?? "");
  setNamedField(form, "sharpeningStatus", snapshot.sharpening?.status ?? "unknown");
  setNamedField(form, "sharpenedAt", formatDateInput(snapshot.sharpening?.sharpenedAt));
  setNamedField(form, "sharpeningNotes", snapshot.sharpening?.notes ?? "");
  setNamedField(form, "iceRink", snapshot.ice?.rink ?? "");
  setNamedField(form, "iceSurface", snapshot.ice?.surface ?? "");
  setNamedField(form, "iceCondition", snapshot.ice?.condition ?? "unknown");
  setNamedField(form, "iceNotes", snapshot.ice?.notes ?? "");
  setNamedField(form, "fatigue", snapshot.athleteFeedback?.fatigue ?? "unknown");
  setNamedField(form, "slipping", snapshot.athleteFeedback?.slipping ?? "unknown");
  setNamedField(form, "stability", snapshot.athleteFeedback?.stability ?? "unknown");
  setNamedField(form, "edgeGrip", snapshot.athleteFeedback?.edgeGrip ?? "unknown");
  setNamedField(form, "confidence", snapshot.athleteFeedback?.confidence ?? "unknown");
  setNamedField(form, "feedbackComments", snapshot.athleteFeedback?.comments ?? (snapshot.symptoms ?? []).join("\n"));
  setNamedField(form, "recommendations", (snapshot.recommendations ?? []).join("\n"));
}

function renderEquipmentHeader(title: string, sessionId: string): string {
  return `
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <p class="text-xs font-black uppercase tracking-[0.18em] text-skating-neon">${t("equipment.currentSession")}</p>
        <h2 class="mt-2 text-xl font-black text-white">${escapeHtml(title)}</h2>
        <p class="mt-2 text-sm text-slate-400">${t("equipment.scopedToSession", { sessionId })}</p>
      </div>
      <a data-analysis-link href="/analysis/sessions/${encodeURIComponent(sessionId)}" class="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-bold text-slate-200 hover:border-skating-pro transition-all">
        <i class="fa-solid fa-chart-line"></i>${t("equipment.sessionOverview")}
      </a>
    </div>
  `;
}

function renderSnapshotState(snapshot: EquipmentSnapshot | null): string {
  if (!snapshot) {
    return renderEmptyState(t("equipment.emptyTitle"), t("equipment.emptyDescription"));
  }

  const bootLabel = formatBootDetails(snapshot.boot) ?? snapshot.bootModel;
  const bladeLabel = formatBladeModel(snapshot.blade) ?? snapshot.bladeModel;
  const bladeLength = snapshot.blade?.lengthMm ?? snapshot.bladeLengthMm;
  const rocker = snapshot.blade?.rocker ?? snapshot.rockerProfile;

  return `
    <div class="space-y-4">
      <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">${t("equipment.savedSnapshot")}</p>
          <h2 class="mt-2 text-2xl font-black text-white">${escapeHtml(snapshot.setupName || `${formatCategory(snapshot.category)} ${t("equipment.setup")}`)}</h2>
          <p class="mt-2 text-sm text-slate-400">${t("equipment.compatibilityNote")}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <span class="rounded-full border border-skating-pro/40 bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-200">${escapeHtml(formatStatus(snapshot.status))}</span>
          ${snapshot.isCurrent === false ? "" : `<span class="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-200">${t("equipment.current")}</span>`}
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        ${renderDetailTile(t("equipment.boot"), bootLabel)}
        ${renderDetailTile(t("equipment.blade"), bladeLabel)}
        ${renderDetailTile(t("equipment.bladeLength"), bladeLength === undefined ? undefined : `${bladeLength} mm`)}
        ${renderDetailTile(t("equipment.rocker"), rocker)}
        ${renderDetailTile(t("equipment.leftOffset"), snapshot.leftOffsetMm === undefined ? undefined : `${snapshot.leftOffsetMm} mm`)}
        ${renderDetailTile(t("equipment.rightOffset"), snapshot.rightOffsetMm === undefined ? undefined : `${snapshot.rightOffsetMm} mm`)}
      </div>
      ${renderStructuredBlock(t("equipment.bootDetails"), renderKeyValues([
        [t("equipment.brand"), snapshot.boot?.brand],
        [t("equipment.model"), snapshot.boot?.model],
        [t("equipment.size"), snapshot.boot?.size],
        [t("common.notes"), snapshot.boot?.notes],
      ]))}
      ${renderStructuredBlock(t("equipment.bladeDetails"), renderKeyValues([
        [t("equipment.brand"), snapshot.blade?.brand],
        [t("equipment.model"), snapshot.blade?.model],
        [t("equipment.cup"), snapshot.blade?.cup],
        [t("equipment.bend"), snapshot.blade?.bend],
        [t("common.notes"), snapshot.blade?.notes],
      ]))}
      ${renderStructuredBlock(t("equipment.sharpening"), renderKeyValues([
        [t("common.status"), snapshot.sharpening?.status ? optionLabel(snapshot.sharpening.status) : undefined],
        [t("equipment.sharpened"), formatDateInput(snapshot.sharpening?.sharpenedAt)],
        [t("common.notes"), snapshot.sharpening?.notes],
      ], snapshot.bendNotes))}
      ${renderStructuredBlock(t("equipment.iceCondition"), renderKeyValues([
        [t("equipment.rink"), snapshot.ice?.rink],
        [t("equipment.surface"), snapshot.ice?.surface],
        [t("equipment.condition"), snapshot.ice?.condition ? optionLabel(snapshot.ice.condition) : undefined],
        [t("common.notes"), snapshot.ice?.notes],
      ]))}
      ${renderStructuredBlock(t("equipment.athleteFeedback"), renderKeyValues([
        [t("equipment.fatigue"), snapshot.athleteFeedback?.fatigue ? optionLabel(snapshot.athleteFeedback.fatigue) : undefined],
        [t("equipment.slipping"), snapshot.athleteFeedback?.slipping ? optionLabel(snapshot.athleteFeedback.slipping) : undefined],
        [t("equipment.stability"), snapshot.athleteFeedback?.stability ? optionLabel(snapshot.athleteFeedback.stability) : undefined],
        [t("equipment.edgeGrip"), snapshot.athleteFeedback?.edgeGrip ? optionLabel(snapshot.athleteFeedback.edgeGrip) : undefined],
        [t("equipment.confidence"), snapshot.athleteFeedback?.confidence ? optionLabel(snapshot.athleteFeedback.confidence) : undefined],
        [t("equipment.comments"), snapshot.athleteFeedback?.comments],
      ], (snapshot.symptoms ?? []).join("\n")))}
      ${renderListBlock(t("common.recommendations"), snapshot.recommendations)}
    </div>
  `;
}

function renderEquipmentSummary(snapshot: EquipmentSnapshot | null, sessionId: string): string {
  if (!snapshot) {
    return `
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.18em] text-skating-neon">${t("equipment.summary")}</p>
          <h2 class="mt-2 text-xl font-black text-white">${t("equipment.noLinkedSnapshot")}</h2>
          <p class="mt-2 text-sm text-slate-400">${t("equipment.addBeforeNotes")}</p>
        </div>
        <a data-analysis-link href="/analysis/sessions/${encodeURIComponent(sessionId)}/equipment" class="inline-flex items-center justify-center gap-2 rounded-xl border border-skating-pro bg-purple-500/10 px-4 py-2 text-sm font-bold text-purple-200 hover:bg-purple-500/20 transition-all">
          <i class="fa-solid fa-screwdriver-wrench"></i>${t("equipment.openLab")}
        </a>
      </div>
    `;
  }

  const bootLabel = formatBootDetails(snapshot.boot) ?? snapshot.bootModel ?? t("equipment.bootNotSet");
  const bladeLabel = formatBladeModel(snapshot.blade) ?? snapshot.bladeModel ?? t("equipment.bladeNotSet");
  const bladeLength = snapshot.blade?.lengthMm ?? snapshot.bladeLengthMm;

  return `
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <p class="text-xs font-black uppercase tracking-[0.18em] text-skating-neon">${t("equipment.summary")}</p>
        <h2 class="mt-2 text-xl font-black text-white">${escapeHtml(snapshot.setupName || `${bootLabel} · ${bladeLabel}`)}</h2>
        <p class="mt-2 text-sm text-slate-400">${t("common.status")}: ${escapeHtml(formatStatus(snapshot.status))} · ${t("common.category")}: ${escapeHtml(formatCategory(snapshot.category))}${bladeLength === undefined ? "" : ` · ${t("equipment.bladeLength")}: ${escapeHtml(String(bladeLength))} mm`}</p>
      </div>
      <a data-analysis-link href="/analysis/sessions/${encodeURIComponent(sessionId)}/equipment" class="inline-flex items-center justify-center gap-2 rounded-xl border border-skating-pro bg-purple-500/10 px-4 py-2 text-sm font-bold text-purple-200 hover:bg-purple-500/20 transition-all">
        <i class="fa-solid fa-screwdriver-wrench"></i>${t("equipment.openLab")}
      </a>
    </div>
  `;
}

function renderDetailTile(label: string, value: string | undefined): string {
  return `
    <div class="rounded-xl border border-slate-700 bg-slate-950 p-3">
      <p class="text-xs font-bold uppercase tracking-wider text-slate-500">${escapeHtml(label)}</p>
      <p class="mt-1 text-sm font-black text-slate-100">${escapeHtml(value || t("equipment.notRecorded"))}</p>
    </div>
  `;
}

function renderStructuredBlock(label: string, content: string): string {
  if (!content) {
    return "";
  }

  return `
    <div class="rounded-xl border border-slate-700 bg-slate-950 p-4">
      <p class="text-xs font-bold uppercase tracking-wider text-slate-500">${escapeHtml(label)}</p>
      <div class="mt-2 space-y-1 text-sm text-slate-300">${content}</div>
    </div>
  `;
}

function renderKeyValues(values: readonly (readonly [string, string | undefined])[], fallback?: string): string {
  const rows = values
    .filter(([, value]) => Boolean(value))
    .map(([label, value]) => `<p><span class="font-bold text-slate-200">${escapeHtml(label)}:</span> ${escapeHtml(value ?? "")}</p>`);

  if (rows.length > 0) {
    return rows.join("");
  }

  return fallback ? `<p class="whitespace-pre-line">${escapeHtml(fallback)}</p>` : "";
}

function renderListBlock(label: string, values: readonly string[] | undefined): string {
  if (!values || values.length === 0) {
    return "";
  }

  return `
    <div class="rounded-xl border border-slate-700 bg-slate-950 p-4">
      <p class="text-xs font-bold uppercase tracking-wider text-slate-500">${escapeHtml(label)}</p>
      <div class="mt-2 flex flex-wrap gap-2">
        ${values.map((value) => `<span class="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-bold text-slate-300">${escapeHtml(value)}</span>`).join("")}
      </div>
    </div>
  `;
}

function renderLoadingState(message: string): string {
  return `
    <div class="text-sm text-slate-400">
      <i class="fa-solid fa-spinner"></i>
      <span class="ml-2">${escapeHtml(message)}</span>
    </div>
  `;
}

function renderEmptyState(title: string, description: string): string {
  return `
    <div class="border border-dashed border-slate-700 rounded-2xl p-8 text-center">
      <div class="mx-auto w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 text-xl">
        <i class="fa-solid fa-screwdriver-wrench"></i>
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

function compactObject<T extends object>(value: Partial<T>): T | undefined {
  const compacted = stripUndefined(value);
  return Object.keys(compacted).length > 0 ? compacted as T : undefined;
}

function stripUndefined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined)) as Partial<T>;
}

function formatBootDetails(boot: EquipmentBootDetails | undefined): string | undefined {
  if (!boot) {
    return undefined;
  }

  return [boot.brand, boot.model, boot.size].filter(Boolean).join(" / ") || boot.notes;
}

function formatBladeModel(blade: EquipmentBladeDetails | undefined): string | undefined {
  if (!blade) {
    return undefined;
  }

  return [blade.brand, blade.model, blade.cup].filter(Boolean).join(" / ") || blade.notes;
}

function formatStructuredNotes(values: EquipmentFormValues): string | undefined {
  const sections = [
    values.blade?.bend ? `Blade bend: ${values.blade.bend}` : undefined,
    values.blade?.notes ? `Blade notes: ${values.blade.notes}` : undefined,
    values.sharpening ? `Sharpening: ${formatSharpening(values.sharpening)}` : undefined,
    values.ice ? `Ice: ${formatIce(values.ice)}` : undefined,
  ].filter(Boolean);

  return sections.length > 0 ? sections.join("\n") : undefined;
}

function formatSharpening(sharpening: EquipmentSharpeningDetails): string {
  return [sharpening.status, sharpening.sharpenedAt, sharpening.notes].filter(Boolean).join(" / ");
}

function formatIce(ice: EquipmentIceDetails): string {
  return [ice.rink, ice.surface, ice.condition, ice.notes].filter(Boolean).join(" / ");
}

function formatFeedbackSymptoms(feedback: EquipmentAthleteFeedback | undefined): readonly string[] {
  if (!feedback) {
    return [];
  }

  return [
    feedback.fatigue && `Fatigue: ${feedback.fatigue}`,
    feedback.slipping && `Slipping: ${feedback.slipping}`,
    feedback.stability && `Stability: ${feedback.stability}`,
    feedback.edgeGrip && `Edge grip: ${feedback.edgeGrip}`,
    feedback.confidence && `Confidence: ${feedback.confidence}`,
    feedback.comments,
  ].filter(Boolean) as string[];
}

function setNamedField(form: HTMLFormElement, name: string, value: string): void {
  const field = form.elements.namedItem(name);

  if (
    field instanceof HTMLInputElement
    || field instanceof HTMLSelectElement
    || field instanceof HTMLTextAreaElement
  ) {
    field.value = value;
  }
}

function setCheckboxField(form: HTMLFormElement, name: string, checked: boolean): void {
  const field = form.elements.namedItem(name);

  if (field instanceof HTMLInputElement && field.type === "checkbox") {
    field.checked = checked;
  }
}

function setFormDisabled(form: HTMLFormElement, disabled: boolean): void {
  form.querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("button,input,select,textarea")
    .forEach((field) => {
      field.disabled = disabled;
    });
}

function setFormStatus(form: HTMLFormElement, message: string, tone: "neutral" | "success" | "error"): void {
  const status = form.querySelector<HTMLElement>("[data-equipment-form-status]");

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

function readOptionalText(value: FormDataEntryValue | null): string | undefined {
  const text = String(value ?? "").trim();
  return text || undefined;
}

function readOptionalNumber(value: FormDataEntryValue | null): number | undefined {
  const text = String(value ?? "").trim();

  if (!text) {
    return undefined;
  }

  const parsed = Number(text);

  if (!Number.isFinite(parsed)) {
    throw new Error(t("biomechanics.numericFields"));
  }

  return parsed;
}

function readConditionLevel(value: FormDataEntryValue | null): EquipmentConditionLevel | undefined {
  const level = coerceConditionLevel(String(value ?? "unknown"));
  return level === "unknown" ? undefined : level;
}

function splitLines(value: string): readonly string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function coerceCategory(value: string): EquipmentCategory {
  return EQUIPMENT_CATEGORIES.includes(value as EquipmentCategory) ? value as EquipmentCategory : "blade";
}

function coerceStatus(value: string): EquipmentSnapshotStatus {
  return EQUIPMENT_STATUSES.includes(value as EquipmentSnapshotStatus) ? value as EquipmentSnapshotStatus : "draft";
}

function coerceConditionLevel(value: string): EquipmentConditionLevel {
  return CONDITION_LEVELS.includes(value as EquipmentConditionLevel) ? value as EquipmentConditionLevel : "unknown";
}

function coerceSharpeningStatus(value: string): SharpeningStatus {
  return SHARPENING_STATUSES.includes(value as SharpeningStatus) ? value as SharpeningStatus : "unknown";
}

function coerceIceCondition(value: string): IceCondition {
  return ICE_CONDITIONS.includes(value as IceCondition) ? value as IceCondition : "unknown";
}

function formatCategory(category: EquipmentCategory): string {
  return optionLabel(category);
}

function formatStatus(status: EquipmentSnapshotStatus): string {
  return optionLabel(status);
}

function formatOptionalNumber(value: number | undefined): string {
  return value === undefined ? "" : String(value);
}

function formatDateInput(value: EquipmentSharpeningDetails["sharpenedAt"] | undefined): string {
  if (!value) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "number") {
    return new Date(value).toISOString().slice(0, 10);
  }

  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  return value.toDate().toISOString().slice(0, 10);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : t("equipment.unexpectedError");
}
