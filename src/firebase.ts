/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { Player } from "./types";

// Configuration loaded from firebase-applet-config.json
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
  alternatingOrder: boolean;
  swapOrderMode: "A" | "B";
  consecutiveWinsTeam: "A" | "B" | null;
  consecutiveWinsCount: number;
  lastWarnedRostersHash: string;
}

// Keep track of the last synchronized string representation to prevent write loops
let lastSyncedStateString = "";

/**
 * Checks if the given state is identical to the last synchronized state.
 */
export function isStateIdentical(state: Partial<GlobalState>): boolean {
  return JSON.stringify(state) === lastSyncedStateString;
}

/**
 * Manually update the last synchronized state string.
 * Call this when an incoming update is received from Firestore.
 */
export function updateLastSyncedState(state: Partial<GlobalState>) {
  lastSyncedStateString = JSON.stringify(state);
}

/**
 * Saves state to Firestore with a check for redundant operations to avoid infinite loops.
 */
export async function saveStateToFirestore(state: Partial<GlobalState>) {
  try {
    const currentStr = JSON.stringify(state);
    if (currentStr === lastSyncedStateString) {
      return; // Skip redundant updates
    }
    
    // Save state
    const docRef = doc(db, "appState", "global");
    await setDoc(docRef, state, { merge: true });
    
    // Update local cache of synced string
    lastSyncedStateString = currentStr;
  } catch (error) {
    console.error("Erro ao salvar dados no Firebase:", error);
  }
}
