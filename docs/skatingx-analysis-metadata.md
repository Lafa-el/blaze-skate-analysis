# SkatingX Analysis Metadata Layer

## Current Architecture

Blaze Skate Analysis is still a static single-page app. The app entry point is `index.html`, with inline HTML, CSS, browser JavaScript, MediaPipe video analysis, pacing tools, equipment records, and Firebase CDN ESM setup in the same file.

This sprint does not add React, Vite, TypeScript, a router, or new build tooling. The current `npm run build` command only generates `firebase-config.js` from `VITE_FIREBASE_*` environment variables.

## Current Firestore Paths

The current Firestore paths are unchanged:

```text
artifacts/{appId}/users/{user.uid}/profile/lindsay
artifacts/{appId}/users/{user.uid}/completedTasks/{taskId}
artifacts/{appId}/users/{user.uid}/equipmentRecords/{autoId}
```

The `profile/lindsay` document ID remains in place for compatibility. Task IDs also remain unchanged.

## Current localStorage Fallback

Equipment history still falls back to:

```text
localStorage.blaze-equipment-history-v1
```

Old local records without SkatingX metadata remain readable and render through the existing history UI. New local fallback records receive SkatingX metadata and `localOnly: true`.

## Metadata Fields

New writes include SkatingX ownership metadata:

```text
ownerUserId
athleteId
sourceApp
schemaVersion
createdAt
updatedAt
```

The current Sprint 1 ownership rule is intentionally conservative:

```text
ownerUserId = Firebase user.uid
athleteId = Firebase user.uid
sourceApp = blaze-skate-analysis
```

Schema versions:

```text
profile/lindsay: skatingx-athlete-v1
completedTasks: skatingx-training-task-v1
equipmentRecords: skatingx-equipment-v1
future analysis summaries: skatingx-analysis-v1
```

Firestore writes prefer `serverTimestamp()` for write-time fields where the Firebase module already has access to it. Existing display fields, Lindsay-specific fields, equipment fields, and points behavior are preserved.

## Video Privacy Boundary

Video files remain local browser-only.

Uploaded videos are handled with temporary `URL.createObjectURL(file)` playback handles. Those object URLs are not durable references, are not persisted, and should not be treated as SkatingX Core media IDs.

This sprint does not upload video bytes to Firestore, Firebase Storage, or any SkatingX Core storage layer.

## What This Sprint Does Not Do

This sprint does not:

- Convert the app to React, Vite, or TypeScript.
- Redesign the UI.
- Rename existing Firestore paths.
- Migrate old Firestore or localStorage data.
- Remove localStorage fallback.
- Create multi-athlete selection.
- Upload or persist video files.
- Create Core analysis-session documents.

## Future Migration Path

Recommended next steps:

1. Move `profile/lindsay` to a Core-compatible athlete document such as `athletes/{uid}` or a dedicated Core athlete ID after the platform ownership model is finalized.
2. Map `equipmentRecords` into Core equipment records while preserving old Analysis records as source data.
3. Persist analysis summaries, not raw videos, into Core analysis sessions using `skatingx-analysis-v1`.
4. Add explicit coach/parent/athlete ownership rules before supporting shared access.
5. Extract Firebase and localStorage writes from `index.html` into a data service before any larger architecture migration.
