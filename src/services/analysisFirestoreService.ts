import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type CollectionReference,
  type DocumentData,
  type Firestore,
  type QueryConstraint,
} from "firebase/firestore";
import { getAnalysisAppId } from "../firebase/firebaseConfig";
import { getBlazeFirestore } from "../firebase/firestore";
import type {
  AnalysisReport,
  AnalysisSession,
  AnalysisVideo,
  BiomechanicsFinding,
  EquipmentSnapshot,
  PaceSession,
} from "../types/analysis";

export const ANALYSIS_COLLECTIONS = {
  analysisSessions: "analysisSessions",
  analysisVideos: "analysisVideos",
  biomechanicsFindings: "biomechanicsFindings",
  paceSessions: "paceSessions",
  equipmentSnapshots: "equipmentSnapshots",
  analysisReports: "analysisReports",
} as const;

export interface AnalysisFirestoreContext {
  readonly ownerUserId: string;
  readonly appId?: string;
  readonly db?: Firestore;
}

export type CreateAnalysisSessionInput = Omit<AnalysisSession, "id" | "createdAt" | "updatedAt">;
export type UpdateAnalysisSessionInput = Partial<
  Omit<AnalysisSession, "id" | "ownerUserId" | "createdAt" | "updatedAt">
>;

export type CreateAnalysisVideoInput = Omit<AnalysisVideo, "id" | "createdAt" | "updatedAt">;
export type UpdateAnalysisVideoInput = Partial<
  Omit<AnalysisVideo, "id" | "ownerUserId" | "sessionId" | "createdAt" | "updatedAt">
>;

export type CreateBiomechanicsFindingInput = Omit<BiomechanicsFinding, "id" | "createdAt" | "updatedAt">;
export type UpdateBiomechanicsFindingInput = Partial<
  Omit<BiomechanicsFinding, "id" | "ownerUserId" | "sessionId" | "createdAt" | "updatedAt">
>;

export type CreatePaceSessionInput = Omit<PaceSession, "id" | "createdAt" | "updatedAt">;
export type UpdatePaceSessionInput = Partial<
  Omit<PaceSession, "id" | "ownerUserId" | "sessionId" | "createdAt" | "updatedAt">
>;

export type CreateEquipmentSnapshotInput = Omit<EquipmentSnapshot, "id" | "createdAt" | "updatedAt">;
export type UpdateEquipmentSnapshotInput = Partial<
  Omit<EquipmentSnapshot, "id" | "ownerUserId" | "sessionId" | "createdAt" | "updatedAt">
>;

export type CreateAnalysisReportInput = Omit<AnalysisReport, "id" | "createdAt" | "updatedAt" | "generatedAt"> &
  Partial<Pick<AnalysisReport, "generatedAt">>;
export type UpdateAnalysisReportInput = Partial<
  Omit<AnalysisReport, "id" | "ownerUserId" | "sessionId" | "createdAt" | "updatedAt">
>;

function getContextDb(context: AnalysisFirestoreContext): Firestore {
  return context.db ?? getBlazeFirestore();
}

function getUserCollection(
  context: AnalysisFirestoreContext,
  collectionName: keyof typeof ANALYSIS_COLLECTIONS,
): CollectionReference<DocumentData> {
  return collection(
    getContextDb(context),
    "artifacts",
    context.appId ?? getAnalysisAppId(),
    "users",
    context.ownerUserId,
    ANALYSIS_COLLECTIONS[collectionName],
  );
}

function stripUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined)) as Partial<T>;
}

async function createDocument<T extends { readonly id: string }>(
  context: AnalysisFirestoreContext,
  collectionName: keyof typeof ANALYSIS_COLLECTIONS,
  input: Omit<T, "id" | "createdAt" | "updatedAt">,
): Promise<T> {
  const documentRef = doc(getUserCollection(context, collectionName));

  await setDoc(documentRef, {
    ...input,
    id: documentRef.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { ...input, id: documentRef.id, createdAt: new Date(), updatedAt: new Date() } as unknown as T;
}

async function getDocument<T>(
  context: AnalysisFirestoreContext,
  collectionName: keyof typeof ANALYSIS_COLLECTIONS,
  id: string,
): Promise<T | null> {
  const snapshot = await getDoc(doc(getUserCollection(context, collectionName), id));
  return snapshot.exists() ? snapshot.data() as T : null;
}

async function listDocuments<T>(
  context: AnalysisFirestoreContext,
  collectionName: keyof typeof ANALYSIS_COLLECTIONS,
  constraints: readonly QueryConstraint[],
): Promise<T[]> {
  const snapshot = await getDocs(query(getUserCollection(context, collectionName), ...constraints));
  return snapshot.docs.map((documentSnapshot) => documentSnapshot.data() as T);
}

async function updateDocument(
  context: AnalysisFirestoreContext,
  collectionName: keyof typeof ANALYSIS_COLLECTIONS,
  id: string,
  input: Record<string, unknown>,
): Promise<void> {
  await updateDoc(doc(getUserCollection(context, collectionName), id), {
    ...stripUndefined(input),
    updatedAt: serverTimestamp(),
  });
}

async function deleteDocument(
  context: AnalysisFirestoreContext,
  collectionName: keyof typeof ANALYSIS_COLLECTIONS,
  id: string,
): Promise<void> {
  await deleteDoc(doc(getUserCollection(context, collectionName), id));
}

export function createAnalysisSession(
  context: AnalysisFirestoreContext,
  input: CreateAnalysisSessionInput,
): Promise<AnalysisSession> {
  return createDocument<AnalysisSession>(context, "analysisSessions", input);
}

export function getAnalysisSession(context: AnalysisFirestoreContext, sessionId: string): Promise<AnalysisSession | null> {
  return getDocument<AnalysisSession>(context, "analysisSessions", sessionId);
}

export function listAnalysisSessionsByAthlete(
  context: AnalysisFirestoreContext,
  athleteId: string,
): Promise<AnalysisSession[]> {
  return listDocuments<AnalysisSession>(context, "analysisSessions", [
    where("athleteId", "==", athleteId),
    orderBy("createdAt", "desc"),
  ]);
}

export function updateAnalysisSession(
  context: AnalysisFirestoreContext,
  sessionId: string,
  input: UpdateAnalysisSessionInput,
): Promise<void> {
  return updateDocument(context, "analysisSessions", sessionId, input as Record<string, unknown>);
}

export function deleteAnalysisSession(context: AnalysisFirestoreContext, sessionId: string): Promise<void> {
  return deleteDocument(context, "analysisSessions", sessionId);
}

export function createAnalysisVideo(
  context: AnalysisFirestoreContext,
  input: CreateAnalysisVideoInput,
): Promise<AnalysisVideo> {
  return createDocument<AnalysisVideo>(context, "analysisVideos", input);
}

export function getAnalysisVideo(context: AnalysisFirestoreContext, videoId: string): Promise<AnalysisVideo | null> {
  return getDocument<AnalysisVideo>(context, "analysisVideos", videoId);
}

export function listAnalysisVideosBySession(
  context: AnalysisFirestoreContext,
  sessionId: string,
): Promise<AnalysisVideo[]> {
  return listDocuments<AnalysisVideo>(context, "analysisVideos", [
    where("sessionId", "==", sessionId),
    orderBy("createdAt", "asc"),
  ]);
}

export function updateAnalysisVideo(
  context: AnalysisFirestoreContext,
  videoId: string,
  input: UpdateAnalysisVideoInput,
): Promise<void> {
  return updateDocument(context, "analysisVideos", videoId, input as Record<string, unknown>);
}

export function deleteAnalysisVideo(context: AnalysisFirestoreContext, videoId: string): Promise<void> {
  return deleteDocument(context, "analysisVideos", videoId);
}

export function createBiomechanicsFinding(
  context: AnalysisFirestoreContext,
  input: CreateBiomechanicsFindingInput,
): Promise<BiomechanicsFinding> {
  return createDocument<BiomechanicsFinding>(context, "biomechanicsFindings", input);
}

export function listFindingsBySession(
  context: AnalysisFirestoreContext,
  sessionId: string,
): Promise<BiomechanicsFinding[]> {
  return listDocuments<BiomechanicsFinding>(context, "biomechanicsFindings", [
    where("sessionId", "==", sessionId),
    orderBy("createdAt", "asc"),
  ]);
}

export function updateBiomechanicsFinding(
  context: AnalysisFirestoreContext,
  findingId: string,
  input: UpdateBiomechanicsFindingInput,
): Promise<void> {
  return updateDocument(context, "biomechanicsFindings", findingId, input as Record<string, unknown>);
}

export function deleteBiomechanicsFinding(context: AnalysisFirestoreContext, findingId: string): Promise<void> {
  return deleteDocument(context, "biomechanicsFindings", findingId);
}

export function createPaceSession(
  context: AnalysisFirestoreContext,
  input: CreatePaceSessionInput,
): Promise<PaceSession> {
  return createDocument<PaceSession>(context, "paceSessions", input);
}

export function listPaceSessionsBySession(context: AnalysisFirestoreContext, sessionId: string): Promise<PaceSession[]> {
  return listDocuments<PaceSession>(context, "paceSessions", [
    where("sessionId", "==", sessionId),
    orderBy("createdAt", "asc"),
  ]);
}

export function updatePaceSession(
  context: AnalysisFirestoreContext,
  paceSessionId: string,
  input: UpdatePaceSessionInput,
): Promise<void> {
  return updateDocument(context, "paceSessions", paceSessionId, input as Record<string, unknown>);
}

export function deletePaceSession(context: AnalysisFirestoreContext, paceSessionId: string): Promise<void> {
  return deleteDocument(context, "paceSessions", paceSessionId);
}

export function createEquipmentSnapshot(
  context: AnalysisFirestoreContext,
  input: CreateEquipmentSnapshotInput,
): Promise<EquipmentSnapshot> {
  return createDocument<EquipmentSnapshot>(context, "equipmentSnapshots", input);
}

export async function getEquipmentSnapshotBySession(
  context: AnalysisFirestoreContext,
  sessionId: string,
): Promise<EquipmentSnapshot | null> {
  const snapshots = await listDocuments<EquipmentSnapshot>(context, "equipmentSnapshots", [
    where("sessionId", "==", sessionId),
    orderBy("createdAt", "desc"),
    limit(1),
  ]);

  return snapshots[0] ?? null;
}

export function updateEquipmentSnapshot(
  context: AnalysisFirestoreContext,
  equipmentSnapshotId: string,
  input: UpdateEquipmentSnapshotInput,
): Promise<void> {
  return updateDocument(context, "equipmentSnapshots", equipmentSnapshotId, input as Record<string, unknown>);
}

export function createAnalysisReport(
  context: AnalysisFirestoreContext,
  input: CreateAnalysisReportInput,
): Promise<AnalysisReport> {
  return createDocument<AnalysisReport>(context, "analysisReports", {
    ...input,
    generatedAt: input.generatedAt ?? new Date(),
  });
}

export async function getAnalysisReportBySession(
  context: AnalysisFirestoreContext,
  sessionId: string,
): Promise<AnalysisReport | null> {
  const reports = await listDocuments<AnalysisReport>(context, "analysisReports", [
    where("sessionId", "==", sessionId),
    orderBy("createdAt", "desc"),
    limit(1),
  ]);

  return reports[0] ?? null;
}

export function updateAnalysisReport(
  context: AnalysisFirestoreContext,
  reportId: string,
  input: UpdateAnalysisReportInput,
): Promise<void> {
  return updateDocument(context, "analysisReports", reportId, input as Record<string, unknown>);
}
