import { getAuth, onAuthStateChanged, signInAnonymously, type User } from "firebase/auth";
import { getAnalysisAppId } from "./firebaseConfig";
import { getBlazeFirebaseApp } from "./firebaseApp";
import type { AnalysisFirestoreContext } from "../services/analysisFirestoreService";

export interface AnalysisUserContext extends AnalysisFirestoreContext {
  readonly athleteId: string;
}

let userPromise: Promise<User> | undefined;

export async function getAnalysisUserContext(): Promise<AnalysisUserContext> {
  const user = await getOrCreateAnonymousUser();

  return {
    ownerUserId: user.uid,
    athleteId: user.uid,
    appId: getAnalysisAppId(),
  };
}

async function getOrCreateAnonymousUser(): Promise<User> {
  if (userPromise) {
    return userPromise;
  }

  const auth = getAuth(getBlazeFirebaseApp());

  userPromise = new Promise<User>((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          unsubscribe();
          resolve(user);
        }
      },
      (error) => {
        unsubscribe();
        reject(error);
      },
    );
  });

  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      userPromise = undefined;
      throw error;
    }
  }

  return userPromise;
}
