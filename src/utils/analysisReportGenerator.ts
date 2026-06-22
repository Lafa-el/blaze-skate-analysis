import type {
  AnalysisCategory,
  AnalysisReport,
  AnalysisSession,
  AnalysisTimestamp,
  BiomechanicsFinding,
  EquipmentSnapshot,
  PaceSession,
} from "../types/analysis";
import { calculatePaceMetrics } from "./paceMetrics";

export interface ReportSourceData {
  readonly session: AnalysisSession;
  readonly findings: readonly BiomechanicsFinding[];
  readonly paceSessions: readonly PaceSession[];
  readonly equipmentSnapshot: EquipmentSnapshot | null;
}

export interface GeneratedReportDraft {
  readonly title: string;
  readonly summary: string;
  readonly categories: readonly AnalysisCategory[];
  readonly findingIds: readonly string[];
  readonly videoIds: readonly string[];
  readonly paceSessionId?: string;
  readonly equipmentSnapshotId?: string;
  readonly keyRecommendations: readonly string[];
}

export interface EditableReportFields {
  readonly title: string;
  readonly summary: string;
  readonly keyRecommendations: readonly string[];
}

export function generateAnalysisReportDraft(source: ReportSourceData): GeneratedReportDraft {
  const categories = getCategories(source);
  const highestSeverityFinding = getHighestSeverityFinding(source.findings);
  const bestPaceSession = getBestPaceSession(source.paceSessions);
  const equipmentLabel = getEquipmentLabel(source.equipmentSnapshot);
  const sessionTitle = source.session.title.trim();
  const recommendationSet = new Set<string>();

  source.findings.forEach((finding) => {
    finding.recommendations.forEach((recommendation) => recommendationSet.add(recommendation));
  });

  source.equipmentSnapshot?.recommendations?.forEach((recommendation) => recommendationSet.add(recommendation));

  if (source.findings.length === 0) {
    recommendationSet.add("Add biomechanics findings to improve report specificity.");
  }

  if (source.paceSessions.length === 0) {
    recommendationSet.add("Add pace splits to include pace consistency and fade analysis.");
  }

  if (!source.equipmentSnapshot) {
    recommendationSet.add("Add an equipment snapshot for setup-aware recommendations.");
  }

  const summaryParts = [
    `${source.findings.length} biomechanics finding${source.findings.length === 1 ? "" : "s"}`,
    `${source.paceSessions.length} pace session${source.paceSessions.length === 1 ? "" : "s"}`,
    source.equipmentSnapshot ? `equipment: ${equipmentLabel}` : "no equipment snapshot",
  ];

  const focus = highestSeverityFinding
    ? `Primary focus: ${highestSeverityFinding.title} (${highestSeverityFinding.severity}).`
    : "Biomechanics summary: no findings recorded yet.";

  const pace = bestPaceSession
    ? `Best pace total: ${formatSeconds(bestPaceSession.metrics.totalTimeSeconds)} over ${bestPaceSession.metrics.distanceType}.`
    : "Pace summary: no lap data recorded.";

  const equipment = source.equipmentSnapshot
    ? `Equipment summary: ${equipmentLabel}.`
    : "Equipment summary: no equipment snapshot recorded.";

  return {
    title: sessionTitle ? `${sessionTitle} Analysis Report` : "Untitled Analysis Report",
    summary: `${focus} ${pace} ${equipment} Current data includes ${summaryParts.join(", ")}.`,
    categories,
    findingIds: source.findings.map((finding) => finding.id),
    videoIds: source.session.videoIds,
    ...(bestPaceSession ? { paceSessionId: bestPaceSession.id } : {}),
    ...(source.equipmentSnapshot ? { equipmentSnapshotId: source.equipmentSnapshot.id } : {}),
    keyRecommendations: Array.from(recommendationSet).slice(0, 8),
  };
}

export function renderAnalysisReportMarkdown(
  source: ReportSourceData,
  report: EditableReportFields | AnalysisReport,
): string {
  const bestPaceSession = getBestPaceSession(source.paceSessions);
  const equipment = source.equipmentSnapshot;
  const sessionTitle = source.session.title.trim() || "Untitled Analysis Session";

  return [
    `# ${report.title.trim() || "Untitled Analysis Report"}`,
    "",
    "## Session Overview",
    `- Session: ${sessionTitle}`,
    `- Status: ${source.session.status}`,
    `- Started: ${formatTimestamp(source.session.startedAt)}`,
    source.session.summary ? `- Session notes: ${source.session.summary}` : "- Session notes: Not recorded",
    "",
    "## Key Findings",
    report.summary,
    "",
    "## Biomechanics Summary",
    renderBiomechanicsMarkdown(source.findings),
    "",
    "## Pace Summary",
    renderPaceMarkdown(bestPaceSession),
    "",
    "## Equipment Summary",
    renderEquipmentMarkdown(equipment),
    "",
    "## Recommendations",
    renderRecommendationsMarkdown(report.keyRecommendations),
  ].join("\n");
}

function getCategories(source: ReportSourceData): readonly AnalysisCategory[] {
  const categories = new Set<AnalysisCategory>();

  if (source.findings.length > 0) {
    categories.add("biomechanics");
  }

  if (source.paceSessions.length > 0) {
    categories.add("pace");
  }

  if (source.equipmentSnapshot) {
    categories.add("equipment");
  }

  if (categories.size > 1) {
    categories.add("composite");
  }

  return Array.from(categories);
}

function getHighestSeverityFinding(findings: readonly BiomechanicsFinding[]): BiomechanicsFinding | undefined {
  return [...findings].sort((first, second) => severityRank(second.severity) - severityRank(first.severity))[0];
}

function getBestPaceSession(paceSessions: readonly PaceSession[]): PaceSession | undefined {
  return [...paceSessions].sort((first, second) => first.metrics.totalTimeSeconds - second.metrics.totalTimeSeconds)[0];
}

function renderBiomechanicsMarkdown(findings: readonly BiomechanicsFinding[]): string {
  if (findings.length === 0) {
    return "- No biomechanics findings recorded.";
  }

  return findings
    .map((finding) => {
      const observation = finding.observation ?? finding.description;
      const impact = finding.impact ?? "Impact not recorded.";
      const recommendations = finding.recommendations.length > 0
        ? finding.recommendations.map((recommendation) => `  - ${recommendation}`).join("\n")
        : "  - No recommendation recorded.";

      return [
        `- ${finding.title}`,
        `  - Issue: ${finding.issueType}`,
        `  - Severity: ${finding.severity}`,
        `  - Status: ${finding.status}`,
        finding.trendKey ? `  - Trend key: ${finding.trendKey}` : undefined,
        `  - Observation: ${observation}`,
        `  - Impact: ${impact}`,
        "  - Recommendations:",
        recommendations,
      ].filter(Boolean).join("\n");
    })
    .join("\n");
}

function renderPaceMarkdown(paceSession: PaceSession | undefined): string {
  if (!paceSession) {
    return "- No pace sessions recorded.";
  }

  const calculated = calculatePaceMetrics(paceSession.metrics.distanceType, paceSession.metrics.splitTimesSeconds);

  return [
    `- Distance: ${paceSession.metrics.distanceType}`,
    `- Total time: ${formatSeconds(calculated.totalTimeSeconds)}`,
    `- Average lap: ${formatSeconds(calculated.averageLapTimeSeconds)}`,
    `- Fastest lap: ${formatSeconds(calculated.fastestLapSeconds)}`,
    `- Slowest lap: ${formatSeconds(calculated.slowestLapSeconds)}`,
    `- Lap range: ${formatSeconds(calculated.lapTimeRangeSeconds)}`,
    `- Lap standard deviation: ${formatSeconds(calculated.lapTimeStdDevSeconds)}`,
    `- Fade index: ${formatPercent(calculated.fadeIndexPercent)}`,
  ].join("\n");
}

function renderEquipmentMarkdown(equipment: EquipmentSnapshot | null): string {
  if (!equipment) {
    return "- No equipment snapshot recorded.";
  }

  return [
    `- Setup: ${equipment.setupName ?? getEquipmentLabel(equipment)}`,
    `- Boot: ${formatBoot(equipment)}`,
    `- Blade: ${formatBlade(equipment)}`,
    `- Sharpening: ${formatSharpening(equipment)}`,
    `- Ice: ${formatIce(equipment)}`,
    `- Athlete feedback: ${formatAthleteFeedback(equipment)}`,
  ].join("\n");
}

function renderRecommendationsMarkdown(recommendations: readonly string[]): string {
  if (recommendations.length === 0) {
    return "- No recommendations recorded.";
  }

  return recommendations.map((recommendation) => `- ${recommendation}`).join("\n");
}

function getEquipmentLabel(equipment: EquipmentSnapshot | null): string {
  if (!equipment) {
    return "Not recorded";
  }

  const boot = formatBoot(equipment);
  const blade = formatBlade(equipment);
  return [boot, blade].filter((value) => value !== "Not recorded").join(" / ") || "Equipment setup";
}

function formatBoot(equipment: EquipmentSnapshot): string {
  return [equipment.boot?.brand, equipment.boot?.model, equipment.boot?.size].filter(Boolean).join(" / ")
    || equipment.bootModel
    || "Not recorded";
}

function formatBlade(equipment: EquipmentSnapshot): string {
  const blade = [
    equipment.blade?.brand,
    equipment.blade?.model,
    equipment.blade?.lengthMm === undefined ? undefined : `${equipment.blade.lengthMm}mm`,
    equipment.blade?.cup,
    equipment.blade?.rocker,
  ].filter(Boolean).join(" / ");

  return blade
    || [equipment.bladeModel, equipment.bladeLengthMm === undefined ? undefined : `${equipment.bladeLengthMm}mm`, equipment.rockerProfile]
      .filter(Boolean)
      .join(" / ")
    || "Not recorded";
}

function formatSharpening(equipment: EquipmentSnapshot): string {
  return [equipment.sharpening?.status, formatTimestamp(equipment.sharpening?.sharpenedAt), equipment.sharpening?.notes]
    .filter(Boolean)
    .join(" / ")
    || equipment.bendNotes
    || "Not recorded";
}

function formatIce(equipment: EquipmentSnapshot): string {
  return [equipment.ice?.rink, equipment.ice?.surface, equipment.ice?.condition, equipment.ice?.notes]
    .filter(Boolean)
    .join(" / ")
    || "Not recorded";
}

function formatAthleteFeedback(equipment: EquipmentSnapshot): string {
  const feedback = [
    equipment.athleteFeedback?.fatigue ? `fatigue ${equipment.athleteFeedback.fatigue}` : undefined,
    equipment.athleteFeedback?.slipping ? `slipping ${equipment.athleteFeedback.slipping}` : undefined,
    equipment.athleteFeedback?.stability ? `stability ${equipment.athleteFeedback.stability}` : undefined,
    equipment.athleteFeedback?.edgeGrip ? `edge grip ${equipment.athleteFeedback.edgeGrip}` : undefined,
    equipment.athleteFeedback?.confidence ? `confidence ${equipment.athleteFeedback.confidence}` : undefined,
    equipment.athleteFeedback?.comments,
  ].filter(Boolean).join(" / ");

  return feedback || equipment.symptoms?.join(" / ") || "Not recorded";
}

function severityRank(severity: BiomechanicsFinding["severity"]): number {
  const ranks = {
    info: 0,
    low: 1,
    medium: 2,
    high: 3,
  } as const;

  return ranks[severity];
}

function formatSeconds(value: number): string {
  return `${Math.round(value * 100) / 100}s`;
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100) / 100}%`;
}

function formatTimestamp(value: AnalysisTimestamp | undefined): string {
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
