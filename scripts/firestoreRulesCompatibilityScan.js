import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import dotenv from "dotenv";
import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

dotenv.config({ path: ".env.local" });

const DEFAULT_ARTIFACT_APP_ID = "blaze-skate-academy";
const ANALYSIS_COLLECTIONS = [
  "analysisSessions",
  "analysisVideos",
  "biomechanicsFindings",
  "paceSessions",
  "equipmentSnapshots",
  "analysisReports",
];

function printCredentialInstructions() {
  console.error(`
Missing Firebase Admin credentials.

This scan is read-only, but it requires admin credentials so it can inspect:
artifacts/${DEFAULT_ARTIFACT_APP_ID}/users/*/{analysisCollection}/*

Set one of these environment variables before running:

  GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json

or:

  FIREBASE_SERVICE_ACCOUNT_PATH=/absolute/path/to/service-account.json

Do not commit service account JSON files. Keep them outside the repo or in an ignored local path.
`);
}

function getCredential() {
  const explicitServiceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const googleApplicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (explicitServiceAccountPath) {
    const serviceAccountJson = JSON.parse(readFileSync(resolve(explicitServiceAccountPath), "utf8"));
    return cert(serviceAccountJson);
  }

  if (googleApplicationCredentials) {
    return applicationDefault();
  }

  printCredentialInstructions();
  process.exitCode = 1;
  return undefined;
}

function getProjectId() {
  return process.env.FIREBASE_PROJECT_ID
    || process.env.GCLOUD_PROJECT
    || process.env.GOOGLE_CLOUD_PROJECT
    || process.env.VITE_FIREBASE_PROJECT_ID
    || undefined;
}

function getArtifactAppId() {
  return process.env.ANALYSIS_ARTIFACT_APP_ID || DEFAULT_ARTIFACT_APP_ID;
}

function getPathInfo(path, expectedCollection, artifactAppId) {
  const segments = path.split("/");

  if (
    segments.length !== 6
    || segments[0] !== "artifacts"
    || segments[1] !== artifactAppId
    || segments[2] !== "users"
    || segments[4] !== expectedCollection
  ) {
    return undefined;
  }

  return {
    userId: segments[3],
    collectionName: segments[4],
    documentId: segments[5],
  };
}

function analyzeDocument(documentSnapshot, collectionName, artifactAppId) {
  const path = documentSnapshot.ref.path;
  const pathInfo = getPathInfo(path, collectionName, artifactAppId);

  if (!pathInfo) {
    return undefined;
  }

  const data = documentSnapshot.data();
  const missingFields = [];
  const issues = [];

  for (const fieldName of ["ownerUserId", "athleteId", "createdAt"]) {
    if (!(fieldName in data)) {
      missingFields.push(fieldName);
      issues.push(`missing ${fieldName}`);
    }
  }

  if (data.ownerUserId !== undefined && data.ownerUserId !== pathInfo.userId) {
    issues.push("ownerUserId != userId");
  }

  if (data.athleteId !== undefined && data.athleteId !== pathInfo.userId) {
    issues.push("athleteId != userId");
  }

  if (data.ownerUserId !== undefined && data.athleteId !== undefined && data.ownerUserId !== data.athleteId) {
    issues.push("ownerUserId != athleteId");
  }

  return {
    path,
    userId: pathInfo.userId,
    collectionName,
    compatible: issues.length === 0,
    missingFields,
    issues,
  };
}

function createEmptyMissingFieldCounts() {
  return {
    ownerUserId: 0,
    athleteId: 0,
    createdAt: 0,
  };
}

async function scanCollection(db, collectionName, artifactAppId) {
  const snapshot = await db.collectionGroup(collectionName).get();
  const documents = snapshot.docs
    .map((documentSnapshot) => analyzeDocument(documentSnapshot, collectionName, artifactAppId))
    .filter(Boolean);
  const incompatibleDocuments = documents.filter((document) => !document.compatible);
  const missingFieldsByType = createEmptyMissingFieldCounts();

  for (const document of incompatibleDocuments) {
    for (const fieldName of document.missingFields) {
      missingFieldsByType[fieldName] += 1;
    }
  }

  return {
    collectionName,
    scanned: documents.length,
    compatible: documents.length - incompatibleDocuments.length,
    incompatible: incompatibleDocuments.length,
    missingFieldsByType,
    incompatibleDocPaths: incompatibleDocuments.map((document) => ({
      path: document.path,
      issues: document.issues,
    })),
  };
}

async function main() {
  const credential = getCredential();

  if (!credential) {
    return;
  }

  const artifactAppId = getArtifactAppId();
  const projectId = getProjectId();

  initializeApp({
    credential,
    ...(projectId ? { projectId } : {}),
  });

  const db = getFirestore();
  const collectionResults = [];

  for (const collectionName of ANALYSIS_COLLECTIONS) {
    collectionResults.push(await scanCollection(db, collectionName, artifactAppId));
  }

  const totals = collectionResults.reduce(
    (summary, result) => ({
      scanned: summary.scanned + result.scanned,
      compatible: summary.compatible + result.compatible,
      incompatible: summary.incompatible + result.incompatible,
    }),
    { scanned: 0, compatible: 0, incompatible: 0 },
  );

  const missingFieldsByType = createEmptyMissingFieldCounts();

  for (const result of collectionResults) {
    for (const [fieldName, count] of Object.entries(result.missingFieldsByType)) {
      missingFieldsByType[fieldName] += count;
    }
  }

  const report = {
    mode: "read-only",
    firebaseProjectId: projectId ?? "(from service account)",
    artifactAppId,
    scannedRoot: `artifacts/${artifactAppId}/users/*`,
    collections: ANALYSIS_COLLECTIONS,
    totals,
    missingFieldsByType,
    collectionResults,
  };

  console.log(JSON.stringify(report, null, 2));

  if (totals.incompatible > 0) {
    process.exitCode = 2;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
