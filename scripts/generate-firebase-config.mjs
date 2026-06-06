import dotenv from "dotenv";
import { writeFileSync } from "node:fs";

dotenv.config({ path: ".env.local" });

const required = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID"
];

const missing = required.filter((name) => !process.env[name]);

if (missing.length > 0) {
  console.warn(`Firebase config is incomplete. Missing: ${missing.join(", ")}`);
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.VITE_FIREBASE_APP_ID || ""
};

writeFileSync(
  "firebase-config.js",
  `window.__BLAZE_FIREBASE_CONFIG__ = ${JSON.stringify(firebaseConfig, null, 2)};\n`
);

console.log("Generated firebase-config.js");
