export type AnalysisTimestamp =
  | string
  | number
  | Date
  | {
      readonly seconds: number;
      readonly nanoseconds: number;
      toDate(): Date;
    };

export type AnalysisSchemaVersion = "skatingx-analysis-v1";

export type AnalysisSourceApp =
  | "blaze-skate-analysis"
  | "skatingx-platform"
  | "blaze-skate-training"
  | "blaze-skate-journal";

export type AnalysisSourceType =
  | "local-video"
  | "manual-entry"
  | "firestore-record"
  | "imported-record"
  | "computed-summary";

export type AnalysisCategory =
  | "biomechanics"
  | "pace"
  | "equipment"
  | "composite";

export type AnalysisSessionStatus =
  | "draft"
  | "processing"
  | "ready"
  | "reviewed"
  | "archived";

export type AnalysisVideoStatus =
  | "local-only"
  | "processing"
  | "analyzed"
  | "discarded";

export type BiomechanicsIssueType =
  | "posture"
  | "edge-control"
  | "knee-flexion"
  | "pelvis-height"
  | "ankle-recovery"
  | "support-leg"
  | "timing"
  | "symmetry"
  | "stability";

export type BiomechanicsFindingStatus =
  | "open"
  | "acknowledged"
  | "improving"
  | "resolved"
  | "dismissed";

export type BiomechanicsSeverity = "info" | "low" | "medium" | "high";

export type SkatingSide = "left" | "right" | "both" | "unknown";

export type PaceDistanceType = "500m" | "777m" | "1000m" | "1500m" | "3000m";

export type PaceSessionStatus = "draft" | "completed" | "reviewed" | "archived";

export type EquipmentCategory =
  | "boot"
  | "blade"
  | "rocker"
  | "bend"
  | "alignment"
  | "fit";

export type EquipmentSnapshotStatus =
  | "draft"
  | "active"
  | "superseded"
  | "archived";

export type AnalysisReportStatus =
  | "draft"
  | "generated"
  | "reviewed"
  | "shared"
  | "archived";

export interface AnalysisOwnership {
  readonly ownerUserId: string;
  readonly athleteId: string;
  readonly sourceApp: AnalysisSourceApp;
  readonly schemaVersion: AnalysisSchemaVersion;
}

export interface AnalysisAuditFields {
  readonly createdAt: AnalysisTimestamp;
  readonly updatedAt: AnalysisTimestamp;
  readonly createdByUserId?: string;
  readonly updatedByUserId?: string;
}

export interface AnalysisSession extends AnalysisOwnership, AnalysisAuditFields {
  readonly id: string;
  readonly title: string;
  readonly category: AnalysisCategory;
  readonly status: AnalysisSessionStatus;
  readonly sourceType: AnalysisSourceType;
  readonly startedAt: AnalysisTimestamp;
  readonly completedAt?: AnalysisTimestamp;
  readonly videoIds: readonly string[];
  readonly findingIds: readonly string[];
  readonly paceSessionId?: string;
  readonly equipmentSnapshotId?: string;
  readonly reportId?: string;
  readonly summary?: string;
  readonly tags?: readonly string[];
}

export interface AnalysisVideo extends AnalysisOwnership, AnalysisAuditFields {
  readonly id: string;
  readonly sessionId: string;
  readonly status: AnalysisVideoStatus;
  readonly sourceType: Extract<AnalysisSourceType, "local-video" | "imported-record">;
  readonly fileName: string;
  readonly mimeType: string;
  readonly durationSeconds?: number;
  readonly widthPixels?: number;
  readonly heightPixels?: number;
  readonly frameRate?: number;
  readonly localObjectUrl?: string;
  readonly storagePath?: string;
  readonly capturedAt?: AnalysisTimestamp;
  readonly notes?: string;
}

export interface BiomechanicsFinding extends AnalysisOwnership, AnalysisAuditFields {
  readonly id: string;
  readonly sessionId: string;
  readonly videoId?: string;
  readonly issueType: BiomechanicsIssueType;
  readonly status: BiomechanicsFindingStatus;
  readonly severity: BiomechanicsSeverity;
  readonly side: SkatingSide;
  readonly sourceType: AnalysisSourceType;
  readonly title: string;
  readonly description: string;
  readonly frameTimeSeconds?: number;
  readonly confidenceScore?: number;
  readonly measuredValues?: Readonly<Record<string, number | string | boolean>>;
  readonly recommendations: readonly string[];
}

export interface PaceMetrics {
  readonly distanceType: PaceDistanceType;
  readonly totalTimeSeconds: number;
  readonly splitTimesSeconds: readonly number[];
  readonly segmentTimesSeconds?: readonly number[];
  readonly averageSplitSeconds?: number;
  readonly earlyAverageSeconds?: number;
  readonly lateAverageSeconds?: number;
  readonly decayPercent?: number;
  readonly lactateDecayIndex?: number;
  readonly benchmarkDeltaSeconds?: number;
  readonly consistencyScore?: number;
}

export interface PaceSession extends AnalysisOwnership, AnalysisAuditFields {
  readonly id: string;
  readonly sessionId?: string;
  readonly status: PaceSessionStatus;
  readonly sourceType: Extract<AnalysisSourceType, "manual-entry" | "computed-summary" | "firestore-record">;
  readonly metrics: PaceMetrics;
  readonly notes?: string;
}

export interface EquipmentSnapshot extends AnalysisOwnership, AnalysisAuditFields {
  readonly id: string;
  readonly sessionId?: string;
  readonly status: EquipmentSnapshotStatus;
  readonly sourceType: Extract<AnalysisSourceType, "manual-entry" | "firestore-record" | "imported-record">;
  readonly category: EquipmentCategory;
  readonly bootModel?: string;
  readonly bladeModel?: string;
  readonly bladeLengthMm?: number;
  readonly rockerProfile?: string;
  readonly leftOffsetMm?: number;
  readonly rightOffsetMm?: number;
  readonly bendNotes?: string;
  readonly symptoms?: readonly string[];
  readonly recommendations?: readonly string[];
}

export interface AnalysisReport extends AnalysisOwnership, AnalysisAuditFields {
  readonly id: string;
  readonly sessionId: string;
  readonly status: AnalysisReportStatus;
  readonly sourceType: Extract<AnalysisSourceType, "computed-summary" | "firestore-record">;
  readonly title: string;
  readonly summary: string;
  readonly categories: readonly AnalysisCategory[];
  readonly findingIds: readonly string[];
  readonly videoIds: readonly string[];
  readonly paceSessionId?: string;
  readonly equipmentSnapshotId?: string;
  readonly keyRecommendations: readonly string[];
  readonly generatedAt: AnalysisTimestamp;
  readonly reviewedAt?: AnalysisTimestamp;
  readonly reviewerUserId?: string;
}
