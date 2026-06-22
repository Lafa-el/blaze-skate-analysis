import type { FirebaseOptions } from "firebase/app";

declare global {
  interface Window {
    __BLAZE_FIREBASE_CONFIG__?: FirebaseOptions;
    __firebase_config?: FirebaseOptions | string;
    __FIREBASE_CONFIG__?: FirebaseOptions | string;
  }

  const __firebase_config: string | undefined;
  const __app_id: string | undefined;
}

export const DEFAULT_ANALYSIS_APP_ID = "blaze-skate-academy";

type RuntimeFirebaseConfig = FirebaseOptions | string | null | undefined;

function readRuntimeFirebaseConfig(value: RuntimeFirebaseConfig): FirebaseOptions | undefined {
  if (!value) {
    return undefined;
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();
    return trimmedValue ? JSON.parse(trimmedValue) as FirebaseOptions : undefined;
  }

  return value;
}

export function getFirebaseConfig(): FirebaseOptions {
  const config =
    readRuntimeFirebaseConfig(window.__BLAZE_FIREBASE_CONFIG__) ??
    readRuntimeFirebaseConfig(window.__firebase_config) ??
    readRuntimeFirebaseConfig(typeof __firebase_config !== "undefined" ? __firebase_config : undefined) ??
    readRuntimeFirebaseConfig(window.__FIREBASE_CONFIG__);

  if (!config?.apiKey || !config.projectId) {
    throw new Error("Firebase config is missing. Run the config generator before using Firestore services.");
  }

  return config;
}

export function getAnalysisAppId(): string {
  return typeof __app_id !== "undefined" && __app_id ? __app_id : DEFAULT_ANALYSIS_APP_ID;
}
