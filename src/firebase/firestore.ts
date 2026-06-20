import { getFirestore, type Firestore } from "firebase/firestore";
import { getBlazeFirebaseApp } from "./firebaseApp";

export function getBlazeFirestore(): Firestore {
  return getFirestore(getBlazeFirebaseApp());
}
