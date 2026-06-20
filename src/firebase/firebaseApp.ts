import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirebaseConfig } from "./firebaseConfig";

export function getBlazeFirebaseApp(): FirebaseApp {
  return getApps()[0] ?? initializeApp(getFirebaseConfig());
}
