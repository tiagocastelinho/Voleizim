/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot, getDoc } from "firebase/firestore";
import { Player } from "./types";

const firebaseConfig = {
  apiKey: "AIzaSyBSQ_qm8myuTbdxT_whGoPwvBJ4UKNTjZ0",
  authDomain: "phonic-climber-698sv.firebaseapp.com",
  projectId: "phonic-climber-698sv",
  storageBucket: "phonic-climber-698sv.firebasestorage.app",
  messagingSenderId: "294435874795",
  appId: "1:294435874795:web:4187d2819009d47e041bae"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-organizadorerodz-e66c87ef-dcb5-4fdb-b87b-73b4f5e082c6");

export interface GlobalState {
  teamA: Player[];
  teamB: Player[];
  reserves: Player[];
  registeredPlayers: Player[];
  theme: "claro" | "escuro" | "pastel";
  history: { teamA: Player[]; teamB: Player[]; reserves: Player[] }[];
}

export async function saveStateToFirestore(state: Partial<GlobalState>) {
  try {
    const docRef = doc(db, "appState", "global");
    await setDoc(docRef, state, { merge: true });
  } catch (error) {
    console.error("Erro ao salvar dados no Firebase:", error);
  }
}
