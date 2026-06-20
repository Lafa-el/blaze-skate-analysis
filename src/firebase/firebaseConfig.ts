import type { FirebaseOptions } from "firebase/app";

declare global {
  interface Window {
    __BLAZE_FIREBASE_CONFIG__?: FirebaseOptions;
  }

  const __firebase_config: string | undefined;
  const __app_id: string | undefined;
}

export const DEFAULT_ANALYSIS_APP_ID = "blaze-skate-academy";

export function getFirebaseConfig(): FirebaseOptions {
  const embeddedConfig =
    typeof __firebase_config !== "undefined" ? JSON.parse(__firebase_config) as FirebaseOptions : undefined;

  const config = embeddedConfig ?? window.__BLAZE_FIREBASE_CONFIG__;

  if (!config?.apiKey || !config.projectId) {
    throw new Error("Firebase config is missing. Run the config generator before using Firestore services.");
  }

  return config;
}

export function getAnalysisAppId(): string {
  return typeof __app_id !== "undefined" && __app_id ? __app_id : DEFAULT_ANALYSIS_APP_ID;
}
