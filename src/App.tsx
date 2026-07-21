/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Trash2,
  Edit2,
  Shuffle,
  Trophy,
  Users,
  User,
  RotateCcw,
  AlertCircle,
  Save,
  X,
  HelpCircle,
  Undo2,
  UserMinus,
  Search,
  Database,
  SlidersHorizontal,
  MoreVertical,
  Check,
  ArrowLeftRight,
  Power,
  GripVertical,
  Lock,
  Unlock,
  Cloud,
  CloudOff,
  Copy,
  ExternalLink,
  History,
  Calendar,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./lib/firebase";
import { Player, Gender, reassignHierarchyValues, mixTeams, PresencePlayer, PresenceList } from "./types";

// Design Palette configurations for Claro and Escuro themes
const themeStyles = {
  claro: {
    bg: "bg-slate-50 text-slate-800",
    headerBg: "bg-white border-slate-100",
    headerTitle: "text-slate-900",
    headerSub: "text-slate-500",
    cardBg: "bg-white border-slate-100 shadow-xs",
    cardTitle: "text-slate-900",
    cardSub: "text-slate-500",
    inputBg: "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-400",
    tabActive: "bg-white text-slate-900 shadow-xs border border-slate-200/20",
    tabInactive: "text-slate-500 hover:text-slate-700",
    tabContainer: "bg-slate-100 border-slate-200/40",
    textMuted: "text-slate-500",
    textBold: "text-slate-900",
    border: "border-slate-100",
    divider: "border-slate-100",
    accentBg: "bg-indigo-600 text-white",
    accentHover: "hover:bg-indigo-500",
    accentText: "text-indigo-600",
    teamABg: "bg-indigo-500",
    teamAActions: "bg-indigo-600 text-white/90 border-indigo-400/30",
    teamBBg: "bg-teal-500",
    teamBActions: "bg-teal-600 text-white/90 border-teal-400/30",
    reserveBg: "bg-amber-500",
    reserveText: "text-amber-700",
    playerCard: "bg-white border-slate-100",
    playerCardHover: "hover:border-indigo-200 hover:bg-indigo-50/20",
    dropdownBg: "bg-white border-slate-200 shadow-xl text-slate-700",
    dropdownItemHover: "hover:bg-slate-50 text-slate-700 hover:text-slate-900",
    rulesBg: "bg-slate-900 text-slate-100",
    rulesTitle: "text-white",
    rulesText: "text-slate-300",
    rulesStrong: "text-white",
  },
  escuro: {
    bg: "bg-slate-950 text-slate-100",
    headerBg: "bg-slate-900 border-slate-850",
    headerTitle: "text-white",
    headerSub: "text-slate-400",
    cardBg: "bg-slate-900 border-slate-800 shadow-md",
    cardTitle: "text-white",
    cardSub: "text-slate-400",
    inputBg: "bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:bg-slate-750 focus:border-violet-500",
    tabActive: "bg-slate-800 text-white shadow-xs border border-slate-700/20",
    tabInactive: "text-slate-400 hover:text-slate-200",
    tabContainer: "bg-slate-900 border-slate-800",
    textMuted: "text-slate-400",
    textBold: "text-white",
    border: "border-slate-800",
    divider: "border-slate-800",
    accentBg: "bg-violet-600 text-white",
    accentHover: "hover:bg-violet-500",
    accentText: "text-violet-400",
    teamABg: "bg-violet-600",
    teamAActions: "bg-violet-750 text-white/90 border-violet-500/30",
    teamBBg: "bg-emerald-600",
    teamBActions: "bg-emerald-750 text-white/90 border-emerald-500/30",
    reserveBg: "bg-amber-600",
    reserveText: "text-amber-400",
    playerCard: "bg-slate-900 border-slate-800",
    playerCardHover: "hover:border-violet-500/50 hover:bg-violet-950/20",
    dropdownBg: "bg-slate-900 border-slate-800 shadow-xl text-slate-200",
    dropdownItemHover: "hover:bg-slate-800 text-slate-100 hover:text-white",
    rulesBg: "bg-slate-900 border border-slate-800 text-slate-100",
    rulesTitle: "text-white",
    rulesText: "text-slate-300",
    rulesStrong: "text-white",
  },
};

// Helper function to recursively remove undefined values from Firestore payloads
function sanitizeFirestoreData<T>(obj: T): T {
  if (obj === undefined) {
    return null as any;
  }
  if (obj === null) {
    return null as any;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeFirestoreData) as any;
  }
  if (typeof obj === "object") {
    const newObj: any = {};
    for (const key of Object.keys(obj as any)) {
      const val = (obj as any)[key];
      if (val !== undefined) {
        newObj[key] = sanitizeFirestoreData(val);
      }
    }
    return newObj;
  }
  return obj;
}

export default function App() {
  // Online Synchronization state and refs
  const [roomCode, setRoomCode] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRoom = params.get("sala");
    if (urlRoom) {
      localStorage.setItem("rodizio_roomCode", urlRoom);
      return urlRoom;
    }
    return localStorage.getItem("rodizio_roomCode") || "padrao";
  });
  const [syncStatus, setSyncStatus] = useState<"connecting" | "synced" | "error" | "syncing">("connecting");
  const [showRoomModal, setShowRoomModal] = useState<boolean>(false);
  const [tempRoomCode, setTempRoomCode] = useState<string>("");

  const isApplyingSnapshotRef = useRef(false);
  const lastServerDataRef = useRef<string>("");
  const hasLoadedFromServerRef = useRef(false);

  // State for Teams and Reserves
  const [teamA, setTeamA] = useState<Player[]>([]);
  const [teamB, setTeamB] = useState<Player[]>([]);
  const [reserves, setReserves] = useState<Player[]>([]);

  // Lock/Unlock manual position system (by default all closed / empty list of unlocked IDs)
  const [unlockedPlayerIds, setUnlockedPlayerIds] = useState<string[]>([]);

  // Consecutive Wins Tracking State
  const [consecutiveWinsCount, setConsecutiveWinsCount] = useState<number>(0);
  const [consecutiveWinsTeam, setConsecutiveWinsTeam] = useState<"A" | "B" | null>(null);
  const [consecutiveWinsPlayers, setConsecutiveWinsPlayers] = useState<string[]>([]);

  // Dismissal states to avoid repeating alerts until changes happen
  const [dismissedGenderImbalanceKey, setDismissedGenderImbalanceKey] = useState<string>("");
  const [dismissedWinsCount, setDismissedWinsCount] = useState<number>(0);

  // State for tracking the winner of the last match (defaults to "A")
  const [winnerTeam, setWinnerTeam] = useState<"A" | "B">("A");

  // Track the currently dragged player ID
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // State for Persistent Database (Aba de Cadastro/Roster)
  const [registeredPlayers, setRegisteredPlayers] = useState<Player[]>([]);

  // State for Undo History
  const [history, setHistory] = useState<{ teamA: Player[]; teamB: Player[]; reserves: Player[]; currentDayPresence: PresencePlayer[] }[]>([]);

  // Tab navigation inside panel: 'cadastro' or 'acoes' (Controle & Partida is default as requested!)
  const [activeTab, setActiveTab] = useState<"cadastro" | "acoes">("acoes");

  // Visual Theme option state ('claro' | 'escuro')
  const [theme, setTheme] = useState<"claro" | "escuro">("claro");
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  // Players per team configuration state (dynamic N from 2 to 11)
  const [playersPerTeam, setPlayersPerTeam] = useState<number>(6);
  const [isPlayersModalOpen, setIsPlayersModalOpen] = useState(false);

  // Swapping mode state
  const [swappingPlayerId, setSwappingPlayerId] = useState<string | null>(null);

  // End Activities dual confirmation modals
  const [showEndActivitiesConfirm, setShowEndActivitiesConfirm] = useState(false);
  const [showEndActivitiesConfirm2, setShowEndActivitiesConfirm2] = useState(false);

  // Search query for registered players
  const [searchQuery, setSearchQuery] = useState("");

  // State for Registration Form
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerGender, setNewPlayerGender] = useState<Gender>(Gender.MALE);
  const [newPlayerIsGuest, setNewPlayerIsGuest] = useState<boolean>(false);

  // Presence History Modal state
  const [isPresenceHistoryOpen, setIsPresenceHistoryOpen] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [presenceFilter, setPresenceFilter] = useState<"all" | "present" | "absent">("all");
  const [guestFilter, setGuestFilter] = useState<"all" | "guests" | "regulars">("all");

  // Presence System States
  const [currentDayPresence, setCurrentDayPresence] = useState<PresencePlayer[]>([]);
  const [presenceHistory, setPresenceHistory] = useState<PresenceList[]>([]);
  const [frequencyPeriod, setFrequencyPeriod] = useState<number>(7);
  const [selectedPlayerPresenceDetails, setSelectedPlayerPresenceDetails] = useState<{ player: Player; dates: { dateString: string; timestamp: number }[] } | null>(null);
  const [presenceListToDelete, setPresenceListToDelete] = useState<PresenceList | null>(null);
  const [historyModalTab, setHistoryModalTab] = useState<"frequencia" | "arquivos">("frequencia");
  const [expandedDates, setExpandedDates] = useState<string[]>([]);

  // State for Editing Player
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // Notifications / Toast
  const [notification, setNotification] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Custom confirmation modal
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Load from LocalStorage on mount
  useEffect(() => {
    const savedA = localStorage.getItem("rodizio_teamA");
    const savedB = localStorage.getItem("rodizio_teamB");
    const savedReserves = localStorage.getItem("rodizio_reserves");
    const savedRegistered = localStorage.getItem("rodizio_registered");
    const savedTheme = localStorage.getItem("rodizio_theme");
    const savedWinnerTeam = localStorage.getItem("rodizio_winnerTeam");
    const savedWinsCount = localStorage.getItem("rodizio_consecutiveWinsCount");
    const savedWinsTeam = localStorage.getItem("rodizio_consecutiveWinsTeam");
    const savedWinsPlayers = localStorage.getItem("rodizio_consecutiveWinsPlayers");
    const savedDismissedWins = localStorage.getItem("rodizio_dismissedWinsCount");
    const savedPlayersPerTeam = localStorage.getItem("rodizio_playersPerTeam");
    const savedCurrentDayPresence = localStorage.getItem("rodizio_currentDayPresence");
    const savedPresenceHistory = localStorage.getItem("rodizio_presenceHistory");
    const savedFrequencyPeriod = localStorage.getItem("rodizio_frequencyPeriod");

    if (savedA) setTeamA(JSON.parse(savedA));
    if (savedB) setTeamB(JSON.parse(savedB));
    if (savedReserves) setReserves(JSON.parse(savedReserves));
    if (savedRegistered) setRegisteredPlayers(JSON.parse(savedRegistered));
    if (savedTheme === "claro" || savedTheme === "escuro") {
      setTheme(savedTheme);
    }
    if (savedWinnerTeam === "A" || savedWinnerTeam === "B") {
      setWinnerTeam(savedWinnerTeam);
    }
    if (savedWinsCount) setConsecutiveWinsCount(parseInt(savedWinsCount, 10));
    if (savedWinsTeam === "A" || savedWinsTeam === "B") setConsecutiveWinsTeam(savedWinsTeam);
    if (savedWinsPlayers) setConsecutiveWinsPlayers(JSON.parse(savedWinsPlayers));
    if (savedDismissedWins) setDismissedWinsCount(parseInt(savedDismissedWins, 10));
    if (savedPlayersPerTeam) setPlayersPerTeam(parseInt(savedPlayersPerTeam, 10));
    if (savedCurrentDayPresence) setCurrentDayPresence(JSON.parse(savedCurrentDayPresence));
    if (savedPresenceHistory) setPresenceHistory(JSON.parse(savedPresenceHistory));
    if (savedFrequencyPeriod) setFrequencyPeriod(parseInt(savedFrequencyPeriod, 10));
  }, []);

  // Save active rosters and winner to LocalStorage whenever they change
  useEffect(() => {
    localStorage.setItem("rodizio_teamA", JSON.stringify(teamA));
    localStorage.setItem("rodizio_teamB", JSON.stringify(teamB));
    localStorage.setItem("rodizio_reserves", JSON.stringify(reserves));
    localStorage.setItem("rodizio_winnerTeam", winnerTeam);
  }, [teamA, teamB, reserves, winnerTeam]);

  // Save presence system states to LocalStorage
  useEffect(() => {
    localStorage.setItem("rodizio_currentDayPresence", JSON.stringify(currentDayPresence));
  }, [currentDayPresence]);

  useEffect(() => {
    localStorage.setItem("rodizio_presenceHistory", JSON.stringify(presenceHistory));
  }, [presenceHistory]);

  useEffect(() => {
    localStorage.setItem("rodizio_frequencyPeriod", frequencyPeriod.toString());
  }, [frequencyPeriod]);

  // Save registered database to LocalStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("rodizio_registered", JSON.stringify(registeredPlayers));
  }, [registeredPlayers]);

  // Save theme selection to LocalStorage
  useEffect(() => {
    localStorage.setItem("rodizio_theme", theme);
  }, [theme]);

  // Save playersPerTeam to LocalStorage
  useEffect(() => {
    localStorage.setItem("rodizio_playersPerTeam", playersPerTeam.toString());
  }, [playersPerTeam]);

  // Save consecutive wins stats to LocalStorage
  useEffect(() => {
    localStorage.setItem("rodizio_consecutiveWinsCount", consecutiveWinsCount.toString());
    localStorage.setItem("rodizio_consecutiveWinsTeam", consecutiveWinsTeam || "");
    localStorage.setItem("rodizio_consecutiveWinsPlayers", JSON.stringify(consecutiveWinsPlayers));
    localStorage.setItem("rodizio_dismissedWinsCount", dismissedWinsCount.toString());
  }, [consecutiveWinsCount, consecutiveWinsTeam, consecutiveWinsPlayers, dismissedWinsCount]);

  // Synchronize roomCode to localStorage and browser URL
  useEffect(() => {
    localStorage.setItem("rodizio_roomCode", roomCode);
    const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + "?sala=" + encodeURIComponent(roomCode);
    window.history.replaceState({ path: newUrl }, "", newUrl);
  }, [roomCode]);

  // Load and subscribe to Firestore room state
  useEffect(() => {
    setSyncStatus("connecting");
    hasLoadedFromServerRef.current = false; // Reset loaded flag when room changes!
    const docRef = doc(db, "rooms", roomCode);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Deep compare or serialize check to avoid resetting state if it's identical
        const incomingSerialized = JSON.stringify({
          teamA: data.teamA || [],
          teamB: data.teamB || [],
          reserves: data.reserves || [],
          registeredPlayers: data.registeredPlayers || [],
          winnerTeam: data.winnerTeam || "A",
          consecutiveWinsCount: data.consecutiveWinsCount || 0,
          consecutiveWinsTeam: data.consecutiveWinsTeam || null,
          consecutiveWinsPlayers: data.consecutiveWinsPlayers || [],
          dismissedWinsCount: data.dismissedWinsCount || 0,
          dismissedGenderImbalanceKey: data.dismissedGenderImbalanceKey || "",
          theme: data.theme || "claro",
          unlockedPlayerIds: data.unlockedPlayerIds || [],
          playersPerTeam: data.playersPerTeam || 6,
          currentDayPresence: data.currentDayPresence || [],
          presenceHistory: data.presenceHistory || [],
          frequencyPeriod: data.frequencyPeriod || 7,
        });

        if (incomingSerialized !== lastServerDataRef.current) {
          isApplyingSnapshotRef.current = true;
          
          if (data.teamA !== undefined) setTeamA(data.teamA);
          if (data.teamB !== undefined) setTeamB(data.teamB);
          if (data.reserves !== undefined) setReserves(data.reserves);
          if (data.registeredPlayers !== undefined) setRegisteredPlayers(data.registeredPlayers);
          if (data.winnerTeam !== undefined) setWinnerTeam(data.winnerTeam);
          if (data.consecutiveWinsCount !== undefined) setConsecutiveWinsCount(data.consecutiveWinsCount);
          if (data.consecutiveWinsTeam !== undefined) setConsecutiveWinsTeam(data.consecutiveWinsTeam);
          if (data.consecutiveWinsPlayers !== undefined) setConsecutiveWinsPlayers(data.consecutiveWinsPlayers);
          if (data.dismissedWinsCount !== undefined) setDismissedWinsCount(data.dismissedWinsCount);
          if (data.dismissedGenderImbalanceKey !== undefined) setDismissedGenderImbalanceKey(data.dismissedGenderImbalanceKey);
          if (data.theme !== undefined) setTheme(data.theme);
          if (data.unlockedPlayerIds !== undefined) setUnlockedPlayerIds(data.unlockedPlayerIds);
          if (data.playersPerTeam !== undefined) setPlayersPerTeam(data.playersPerTeam);
          if (data.currentDayPresence !== undefined) setCurrentDayPresence(data.currentDayPresence);
          if (data.presenceHistory !== undefined) setPresenceHistory(data.presenceHistory);
          if (data.frequencyPeriod !== undefined) setFrequencyPeriod(data.frequencyPeriod);
          
          lastServerDataRef.current = incomingSerialized;
          
          setTimeout(() => {
            isApplyingSnapshotRef.current = false;
          }, 50);
        }
        hasLoadedFromServerRef.current = true; // Mark initial load as completed successfully
        setSyncStatus("synced");
      } else {
        // If room document doesn't exist yet, we initialize it with our current local state!
        const localState = {
          teamA,
          teamB,
          reserves,
          registeredPlayers,
          winnerTeam,
          consecutiveWinsCount,
          consecutiveWinsTeam,
          consecutiveWinsPlayers,
          dismissedWinsCount,
          dismissedGenderImbalanceKey,
          theme,
          unlockedPlayerIds,
          playersPerTeam,
          currentDayPresence,
          presenceHistory,
          frequencyPeriod,
        };
        const serialized = JSON.stringify(localState);
        lastServerDataRef.current = serialized;
        
        setDoc(docRef, {
          ...sanitizeFirestoreData(localState),
          updatedAt: serverTimestamp()
        })
          .then(() => {
            hasLoadedFromServerRef.current = true; // Mark initial load as completed successfully
            setSyncStatus("synced");
          })
          .catch((err) => {
            console.error("Erro ao inicializar sala no Firestore:", err);
            setSyncStatus("error");
          });
      }
    }, (error) => {
      console.error("Erro no listener do Firestore:", error);
      setSyncStatus("error");
    });

    return () => unsubscribe();
  }, [roomCode]);

  // Synchronize local state updates back to Firestore
  useEffect(() => {
    if (!hasLoadedFromServerRef.current) return; // CRITICAL: Skip writing until the first server load is finished!
    if (isApplyingSnapshotRef.current) return;

    const localState = {
      teamA,
      teamB,
      reserves,
      registeredPlayers,
      winnerTeam,
      consecutiveWinsCount,
      consecutiveWinsTeam,
      consecutiveWinsPlayers,
      dismissedWinsCount,
      dismissedGenderImbalanceKey,
      theme,
      unlockedPlayerIds,
      playersPerTeam,
      currentDayPresence,
      presenceHistory,
      frequencyPeriod,
    };

    const serialized = JSON.stringify(localState);
    if (serialized === lastServerDataRef.current) return;

    setSyncStatus("syncing");
    const docRef = doc(db, "rooms", roomCode);
    
    const timeoutId = setTimeout(() => {
      setDoc(docRef, {
        ...sanitizeFirestoreData(localState),
        updatedAt: serverTimestamp()
      }, { merge: true })
        .then(() => {
          lastServerDataRef.current = serialized;
          setSyncStatus("synced");
        })
        .catch((err) => {
          console.error("Erro ao salvar no Firestore:", err);
          setSyncStatus("error");
        });
    }, 400); // Small debounce to handle continuous dragging operations smoothly

    return () => clearTimeout(timeoutId);
  }, [
    teamA,
    teamB,
    reserves,
    registeredPlayers,
    winnerTeam,
    consecutiveWinsCount,
    consecutiveWinsTeam,
    consecutiveWinsPlayers,
    dismissedWinsCount,
    dismissedGenderImbalanceKey,
    theme,
    unlockedPlayerIds,
    playersPerTeam,
    currentDayPresence,
    presenceHistory,
    frequencyPeriod,
    roomCode
  ]);

  // Auto-clear notification after delay
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Helper to trigger custom toast
  const triggerToast = (text: string, type: "success" | "error" | "info") => {
    setNotification({ text, type });
  };

  // Push current rosters to history stack for Undo
  const pushToHistory = (currA = teamA, currB = teamB, currRes = reserves, currPres = currentDayPresence) => {
    const stateCopy = {
      teamA: JSON.parse(JSON.stringify(currA)),
      teamB: JSON.parse(JSON.stringify(currB)),
      reserves: JSON.parse(JSON.stringify(currRes)),
      currentDayPresence: JSON.parse(JSON.stringify(currPres)),
    };
    setHistory((prev) => [...prev.slice(-29), stateCopy]); // Limit history to 30 elements
  };

  // Revert last game/action
  const handleUndo = () => {
    if (history.length === 0) {
      triggerToast("Nenhum comando recente para desfazer!", "info");
      return;
    }

    const previousState = history[history.length - 1];
    const newHistory = history.slice(0, -1);

    // Sync any name/gender edits from the master registeredPlayers database
    const syncWithRegistered = (p: Player) => {
      const reg = registeredPlayers.find((rp) => rp.id === p.id);
      if (reg) {
        return { ...p, name: reg.name, gender: reg.gender };
      }
      return p;
    };

    setTeamA(previousState.teamA.map(syncWithRegistered));
    setTeamB(previousState.teamB.map(syncWithRegistered));
    setReserves(previousState.reserves.map(syncWithRegistered));
    if (previousState.currentDayPresence) {
      setCurrentDayPresence(previousState.currentDayPresence);
    }
    setHistory(newHistory);

    triggerToast("Ação anterior desfeita com sucesso!", "success");
  };

  // Swap two active players' positions while maintaining the slot hierarchy order
  const handleSwapPlayers = (id1: string, id2: string) => {
    pushToHistory();

    let updatedA = [...teamA];
    let updatedB = [...teamB];
    let updatedReserves = [...reserves];

    let p1Loc: { arrayName: "A" | "B" | "Res"; index: number } | null = null;
    let p2Loc: { arrayName: "A" | "B" | "Res"; index: number } | null = null;

    const findAndGet = (id: string) => {
      let idx = updatedA.findIndex((p) => p.id === id);
      if (idx !== -1) return { arrayName: "A" as const, index: idx };
      idx = updatedB.findIndex((p) => p.id === id);
      if (idx !== -1) return { arrayName: "B" as const, index: idx };
      idx = updatedReserves.findIndex((p) => p.id === id);
      if (idx !== -1) return { arrayName: "Res" as const, index: idx };
      return null;
    };

    p1Loc = findAndGet(id1);
    p2Loc = findAndGet(id2);

    if (!p1Loc || !p2Loc) {
      triggerToast("Erro ao tentar trocar: um dos jogadores não foi encontrado.", "error");
      return;
    }

    const getArray = (loc: "A" | "B" | "Res") => {
      if (loc === "A") return updatedA;
      if (loc === "B") return updatedB;
      return updatedReserves;
    };

    const arr1 = getArray(p1Loc.arrayName);
    const arr2 = getArray(p2Loc.arrayName);

    const p1 = arr1[p1Loc.index];
    const p2 = arr2[p2Loc.index];

    // Swap elements in arrays, maintaining their original individual hierarchyValue properties
    arr1[p1Loc.index] = p2;
    arr2[p2Loc.index] = p1;

    // Sort arrays to respect the hierarchical order after swapping
    updatedA.sort((a, b) => a.hierarchyValue - b.hierarchyValue);
    updatedB.sort((a, b) => a.hierarchyValue - b.hierarchyValue);
    updatedReserves.sort((a, b) => a.hierarchyValue - b.hierarchyValue);

    // Reset consecutive wins count upon manual swapping
    setConsecutiveWinsCount(0);
    setConsecutiveWinsTeam(null);
    setConsecutiveWinsPlayers([]);
    setDismissedWinsCount(0);

    setTeamA(updatedA);
    setTeamB(updatedB);
    setReserves(updatedReserves);

    setSwappingPlayerId(null);
    triggerToast(`Troca efetuada entre "${p1.name}" e "${p2.name}"!`, "success");
  };

  // Reset only the active play lists (Teams A, B, and reserves) with dual confirmation
  const handleEndActivities = () => {
    if (currentDayPresence.length > 0) {
      const today = new Date();
      const dateString = today.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });

      const existingIndex = presenceHistory.findIndex(list => list.dateString === dateString);
      let updatedHistory = [...presenceHistory];

      if (existingIndex !== -1) {
        const existingList = presenceHistory[existingIndex];
        const mergedPlayers = [...existingList.players];
        currentDayPresence.forEach(p => {
          if (!mergedPlayers.some(mp => mp.id === p.id)) {
            mergedPlayers.push(p);
          }
        });
        updatedHistory[existingIndex] = {
          ...existingList,
          players: mergedPlayers
        };
      } else {
        const newList: PresenceList = {
          id: `presence-${Date.now()}`,
          dateString,
          timestamp: today.getTime(),
          players: currentDayPresence
        };
        updatedHistory = [newList, ...updatedHistory];
      }

      // Limit history to 25 lists
      if (updatedHistory.length > 25) {
        updatedHistory = updatedHistory.slice(0, 25);
      }

      setPresenceHistory(updatedHistory);
    }

    setTeamA([]);
    setTeamB([]);
    setReserves([]);
    setHistory([]);
    setCurrentDayPresence([]);
    setSwappingPlayerId(null);
    setShowEndActivitiesConfirm(false);
    setShowEndActivitiesConfirm2(false);
    triggerToast("Atividades encerradas. Os times e reservas foram limpos, e a presença foi arquivada.", "info");
  };

  const handleDeletePresenceList = (dateString: string) => {
    const updated = presenceHistory.filter((list) => list.dateString !== dateString);
    setPresenceHistory(updated);
    setPresenceListToDelete(null);
    triggerToast(`Lista de presença de ${dateString} foi excluída.`, "success");
  };

  const toggleDateExpanded = (dateStr: string) => {
    setExpandedDates(prev =>
      prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
    );
  };

  // Get score of a player based on selected period
  const getPlayerScore = (playerId: string) => {
    const now = Date.now();
    const limitMs = frequencyPeriod * 24 * 60 * 60 * 1000;

    const validLists = presenceHistory.filter((list) => {
      const listTime = list.timestamp || Date.now();
      return (now - listTime) <= limitMs;
    });

    let count = 0;
    validLists.forEach((list) => {
      if (list.players.some((p) => p.id === playerId)) {
        count++;
      }
    });

    return count;
  };

  const getScoreStyles = (player: Player) => {
    if (player.isGuest) {
      return "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-450 border border-slate-200/20";
    }
    const score = getPlayerScore(player.id);
    if (score === 0) {
      return "bg-rose-50 text-rose-600 dark:bg-rose-950/25 dark:text-rose-450 border border-rose-200/30";
    }
    if (score < 3) {
      return "bg-orange-50 text-orange-650 dark:bg-orange-950/25 dark:text-orange-400 border border-orange-200/30";
    }
    if (score === 3) {
      return "bg-amber-50 text-amber-600 dark:bg-amber-950/25 dark:text-amber-450 border border-amber-200/30";
    }
    return "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/25 dark:text-emerald-400 border border-emerald-200/30";
  };

  const handleShowPlayerPresenceDetails = (player: Player) => {
    const dates = presenceHistory
      .filter((list) => list.players.some((p) => p.id === player.id))
      .map((list) => ({
        dateString: list.dateString,
        timestamp: list.timestamp || Date.now(),
      }))
      .sort((a, b) => b.timestamp - a.timestamp); // Sort newest first
    setSelectedPlayerPresenceDetails({ player, dates });
  };

  // Add new player to registered roster (Database only) - alphabetical
  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) {
      triggerToast("Por favor, digite o nome do jogador.", "error");
      return;
    }

    const trimmedName = newPlayerName.trim();
    const alreadyRegistered = registeredPlayers.some(
      (p) => p.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (alreadyRegistered) {
      triggerToast(`"${trimmedName}" já está cadastrado na lista.`, "error");
      return;
    }

    const newPlayer: Player = {
      id: `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: trimmedName,
      gender: newPlayerGender,
      hierarchyValue: 0,
      isGuest: newPlayerIsGuest,
    };

    const updatedRegistered = [...registeredPlayers, newPlayer].sort((a, b) =>
      a.name.localeCompare(b.name, "pt", { sensitivity: "base" })
    );

    setRegisteredPlayers(updatedRegistered);
    setNewPlayerName("");
    setNewPlayerIsGuest(false);
    triggerToast(`"${newPlayer.name}" cadastrado com sucesso na lista de cadastro!`, "success");
  };

  // Add registered player to play
  const handleAddToActive = (player: Player) => {
    const isInPlay =
      teamA.some((p) => p.id === player.id) ||
      teamB.some((p) => p.id === player.id) ||
      reserves.some((p) => p.id === player.id);

    if (isInPlay) {
      triggerToast(`"${player.name}" já está escalado na partida atual.`, "error");
      return;
    }

    // Save history before modifying rosters
    pushToHistory();

    let updatedA = [...teamA];
    let updatedB = [...teamB];
    let updatedReserves = [...reserves];

    // Distribute according to space and alternating rules
    if (updatedA.length + updatedB.length < 2 * playersPerTeam) {
      if (updatedA.length < playersPerTeam && updatedB.length < playersPerTeam) {
        if (updatedA.length <= updatedB.length) {
          updatedA.push({ ...player });
          triggerToast(`"${player.name}" escalado no Time A.`, "success");
        } else {
          updatedB.push({ ...player });
          triggerToast(`"${player.name}" escalado no Time B.`, "success");
        }
      } else if (updatedA.length < playersPerTeam) {
        updatedA.push({ ...player });
        triggerToast(`"${player.name}" escalado no Time A.`, "success");
      } else {
        updatedB.push({ ...player });
        triggerToast(`"${player.name}" escalado no Time B.`, "success");
      }
    } else {
      updatedReserves.push({ ...player });
      triggerToast(`"${player.name}" adicionado à fila de reserva.`, "success");
    }

    // Recalculate and reassign hierarchy values
    const updated = reassignHierarchyValues(updatedA, updatedB, updatedReserves, winnerTeam, playersPerTeam);
    setTeamA(updated.teamA);
    setTeamB(updated.teamB);
    setReserves(updated.reserves);
  };

  // Remove player from active play but KEEP in database
  const handleRemoveFromActive = (id: string, name: string) => {
    pushToHistory();

    const isInA = teamA.some((p) => p.id === id);
    const isInB = teamB.some((p) => p.id === id);

    let updatedA = [...teamA];
    let updatedB = [...teamB];
    let updatedReserves = [...reserves];

    if (isInA) {
      updatedA = updatedA.filter((p) => p.id !== id);
      if (updatedReserves.length > 0) {
        const substitute = updatedReserves[0];
        updatedReserves = updatedReserves.slice(1);
        updatedA = [substitute, ...updatedA];
        triggerToast(`"${name}" removido do Time A. "${substitute.name}" da reserva entrou no time.`, "success");
      } else {
        triggerToast(`"${name}" removido do Time A.`, "success");
      }
    } else if (isInB) {
      updatedB = updatedB.filter((p) => p.id !== id);
      if (updatedReserves.length > 0) {
        const substitute = updatedReserves[0];
        updatedReserves = updatedReserves.slice(1);
        updatedB = [substitute, ...updatedB];
        triggerToast(`"${name}" removido do Time B. "${substitute.name}" da reserva entrou no time.`, "success");
      } else {
        triggerToast(`"${name}" removido do Time B.`, "success");
      }
    } else {
      updatedReserves = updatedReserves.filter((p) => p.id !== id);
      triggerToast(`"${name}" removido da fila de reservas.`, "success");
    }

    // Reset consecutive wins count upon manual removal of player
    setConsecutiveWinsCount(0);
    setConsecutiveWinsTeam(null);
    setConsecutiveWinsPlayers([]);
    setDismissedWinsCount(0);

    const updated = reassignHierarchyValues(updatedA, updatedB, updatedReserves, winnerTeam, playersPerTeam);
    setTeamA(updated.teamA);
    setTeamB(updated.teamB);
    setReserves(updated.reserves);
  };

  // Permanently delete player from registered database and active play
  const handleDefinitiveDelete = (id: string, name: string) => {
    const isInPlay =
      teamA.some((p) => p.id === id) ||
      teamB.some((p) => p.id === id) ||
      reserves.some((p) => p.id === id);

    if (isInPlay) {
      pushToHistory();
    }

    setRegisteredPlayers((prev) => prev.filter((p) => p.id !== id));

    let updatedA = teamA.filter((p) => p.id !== id);
    let updatedB = teamB.filter((p) => p.id !== id);
    let updatedReserves = reserves.filter((p) => p.id !== id);

    // Promote substitute if playing team member was deleted
    if (teamA.some((p) => p.id === id)) {
      if (updatedReserves.length > 0) {
        const substitute = updatedReserves[0];
        updatedReserves = updatedReserves.slice(1);
        updatedA = [substitute, ...updatedA];
      }
    } else if (teamB.some((p) => p.id === id)) {
      if (updatedReserves.length > 0) {
        const substitute = updatedReserves[0];
        updatedReserves = updatedReserves.slice(1);
        updatedB = [substitute, ...updatedB];
      }
    }

    const updated = reassignHierarchyValues(updatedA, updatedB, updatedReserves, winnerTeam, playersPerTeam);

    // Reset consecutive wins count upon player deletion
    setConsecutiveWinsCount(0);
    setConsecutiveWinsTeam(null);
    setConsecutiveWinsPlayers([]);
    setDismissedWinsCount(0);

    setTeamA(updated.teamA);
    setTeamB(updated.teamB);
    setReserves(updated.reserves);

    triggerToast(`Cadastro de "${name}" excluído definitivamente!`, "success");
  };

  // Save changes to edited player (Master list and active lists)
  const handleSaveEditedPlayer = () => {
    if (!editingPlayer) return;
    if (!editingPlayer.name.trim()) {
      triggerToast("O nome do jogador não pode ficar em branco.", "error");
      return;
    }

    const nameTrimmed = editingPlayer.name.trim();

    // Update master registered list
    setRegisteredPlayers((prev) =>
      prev.map((p) => (p.id === editingPlayer.id ? { ...p, name: nameTrimmed, gender: editingPlayer.gender, isGuest: editingPlayer.isGuest } : p))
    );

    // Update active lists while preserving hierarchy value
    setTeamA((prev) => prev.map((p) => (p.id === editingPlayer.id ? { ...p, name: nameTrimmed, gender: editingPlayer.gender, isGuest: editingPlayer.isGuest } : p)));
    setTeamB((prev) => prev.map((p) => (p.id === editingPlayer.id ? { ...p, name: nameTrimmed, gender: editingPlayer.gender, isGuest: editingPlayer.isGuest } : p)));
    setReserves((prev) => prev.map((p) => (p.id === editingPlayer.id ? { ...p, name: nameTrimmed, gender: editingPlayer.gender, isGuest: editingPlayer.isGuest } : p)));

    setEditingPlayer(null);
    triggerToast("Cadastro do jogador atualizado com sucesso!", "success");
  };

  // Toggle lock/unlock manual reordering state for a player
  const handleToggleLock = (id: string) => {
    setUnlockedPlayerIds((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  // Handle game finished and rotation
  const handleGameWinner = (winner: "A" | "B") => {
    if (teamA.length < playersPerTeam || teamB.length < playersPerTeam) {
      triggerToast(
        `A partida só pode terminar se ambos os times estiverem completos com ${playersPerTeam} jogadores.`,
        "error"
      );
      return;
    }

    // Save history before modifying rosters
    pushToHistory();

    // Register presence for the day of players who played this match
    const playersInMatch: PresencePlayer[] = [...teamA, ...teamB].map(p => ({
      id: p.id,
      name: p.name,
      gender: p.gender,
      isGuest: p.isGuest
    }));
    setCurrentDayPresence(prev => {
      const merged = [...prev];
      playersInMatch.forEach(p => {
        if (!merged.some(m => m.id === p.id)) {
          merged.push(p);
        }
      });
      return merged;
    });

    const losingTeam = winner === "A" ? teamB : teamA;
    const winningTeam = winner === "A" ? teamA : teamB;

    // Manage consecutive wins:
    // Check if the winner team has won previously and with the exact same players
    const currentWinningPlayerIds = winningTeam.map(p => p.id).sort();
    const previousStreakPlayerIds = [...consecutiveWinsPlayers].sort();
    const isSameRoster = 
      consecutiveWinsTeam === winner &&
      currentWinningPlayerIds.length === previousStreakPlayerIds.length &&
      currentWinningPlayerIds.every((id, idx) => id === previousStreakPlayerIds[idx]);

    if (isSameRoster) {
      setConsecutiveWinsCount(prev => prev + 1);
    } else {
      setConsecutiveWinsCount(1);
      setConsecutiveWinsTeam(winner);
      setConsecutiveWinsPlayers(winningTeam.map(p => p.id));
      setDismissedWinsCount(0);
    }

    // Reset unlocked padlocks when rotation/winner is decided
    setUnlockedPlayerIds([]);

    let newLosingTeam: Player[] = [];
    let newReserves: Player[] = [];

    const R = reserves.length;

    if (R >= playersPerTeam) {
      // playersPerTeam first reserves enter the losing team
      const promoted = reserves.slice(0, playersPerTeam);
      const remainingReserves = reserves.slice(playersPerTeam);
      newLosingTeam = promoted;
      // All losers go to the end of the reserves list in registration order
      newReserves = [...remainingReserves, ...losingTeam];
    } else {
      // Less than playersPerTeam reserves: they enter at the top, last R losers are displaced
      const promoted = reserves; // all of them (size R)
      const keptCount = playersPerTeam - R;
      const keptFromL = losingTeam.slice(0, keptCount);
      const displacedFromL = losingTeam.slice(keptCount);

      newLosingTeam = [...promoted, ...keptFromL];
      newReserves = displacedFromL;
    }

    // Set updated teams based on who won
    const finalA = winner === "A" ? winningTeam : newLosingTeam;
    const finalB = winner === "B" ? winningTeam : newLosingTeam;

    // Reset hierarchy values and set new winner
    const updated = reassignHierarchyValues(finalA, finalB, newReserves, winner, playersPerTeam);
    setWinnerTeam(winner);

    setTeamA(updated.teamA);
    setTeamB(updated.teamB);
    setReserves(updated.reserves);

    triggerToast(
      `Fim de jogo! Time ${winner} venceu. O time perdedor foi deslocado para a reserva.`,
      "success"
    );
  };

  // Handle drag reordering events
  const handleDragStart = (id: string) => {
    pushToHistory();
    setActiveDragId(id);
  };

  const handleDragEnd = () => {
    setActiveDragId(null);
  };

  const handleDragMove = (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;

    let listType: "A" | "B" | "Res" | null = null;
    let listData: Player[] = [];

    if (teamA.some((p) => p.id === draggedId)) {
      listType = "A";
      listData = [...teamA];
    } else if (teamB.some((p) => p.id === draggedId)) {
      listType = "B";
      listData = [...teamB];
    } else if (reserves.some((p) => p.id === draggedId)) {
      listType = "Res";
      listData = [...reserves];
    }

    if (!listType) return;

    // Check if target is in the same list
    const isTargetInSameList =
      (listType === "A" && teamA.some((p) => p.id === targetId)) ||
      (listType === "B" && teamB.some((p) => p.id === targetId)) ||
      (listType === "Res" && reserves.some((p) => p.id === targetId));

    if (!isTargetInSameList) return;

    const draggedIdx = listData.findIndex((p) => p.id === draggedId);
    const targetIdx = listData.findIndex((p) => p.id === targetId);

    if (draggedIdx === -1 || targetIdx === -1) return;

    // Move item
    const [movedPlayer] = listData.splice(draggedIdx, 1);
    listData.splice(targetIdx, 0, movedPlayer);

    // Update the corresponding state and reassign hierarchy values
    if (listType === "A") {
      const updated = reassignHierarchyValues(listData, teamB, reserves, winnerTeam, playersPerTeam);
      setTeamA(updated.teamA);
      setTeamB(updated.teamB);
      setReserves(updated.reserves);
    } else if (listType === "B") {
      const updated = reassignHierarchyValues(teamA, listData, reserves, winnerTeam, playersPerTeam);
      setTeamA(updated.teamA);
      setTeamB(updated.teamB);
      setReserves(updated.reserves);
    } else {
      const updated = reassignHierarchyValues(teamA, teamB, listData, winnerTeam, playersPerTeam);
      setTeamA(updated.teamA);
      setTeamB(updated.teamB);
      setReserves(updated.reserves);
    }
  };

  // Trigger Team Mixing (Embaralhar com equilíbrio)
  const handleMix = () => {
    if (teamA.length !== playersPerTeam || teamB.length !== playersPerTeam) {
      triggerToast(
        `Para misturar, ambos os times precisam estar completos com exatamente ${playersPerTeam} jogadores cada.`,
        "error"
      );
      return;
    }

    const mixed = mixTeams(teamA, teamB, playersPerTeam);
    if (mixed) {
      // Save history before modifying rosters
      pushToHistory();

      // Reset unlocked locks when mixed
      setUnlockedPlayerIds([]);

      // Reset consecutive win streak when mixed
      setConsecutiveWinsCount(0);
      setConsecutiveWinsTeam(null);
      setConsecutiveWinsPlayers([]);
      setDismissedWinsCount(0);

      setTeamA(mixed.teamA);
      setTeamB(mixed.teamB);
      triggerToast(
        "Times reorganizados aleatoriamente respeitando equilíbrio de gênero e ordem hierárquica!",
        "success"
      );
    } else {
      triggerToast("Erro ao tentar misturar os times.", "error");
    }
  };



  // Reset entire state
  const handleClearAll = () => {
    setTeamA([]);
    setTeamB([]);
    setReserves([]);
    setRegisteredPlayers([]);
    setHistory([]);
    setShowClearConfirm(false);
    triggerToast("Todo o cadastro de jogadores e times foi limpo.", "info");
  };

  // Helper to distribute players according to the playersPerTeam rule
  const distributePlayers = (n: number, playersList: Player[]) => {
    const updatedA: Player[] = [];
    const updatedB: Player[] = [];
    const updatedReserves: Player[] = [];

    playersList.forEach((player, idx) => {
      const pos = idx + 1;
      if (pos <= 2 * n) {
        if (pos % 2 !== 0) {
          updatedA.push(player);
        } else {
          updatedB.push(player);
        }
      } else {
        updatedReserves.push(player);
      }
    });

    return {
      teamA: updatedA,
      teamB: updatedB,
      reserves: updatedReserves,
    };
  };

  // Handler for when the user selects a new amount of players per team
  const handleSelectPlayersPerTeam = (count: number) => {
    setPlayersPerTeam(count);
    
    // Save history before modifying rosters
    pushToHistory();

    // Redistribute registered players initially according to the requested rule
    const distributed = distributePlayers(count, registeredPlayers);
    
    // Assign dynamic hierarchy values using our updated reassignHierarchyValues helper
    const updatedRosters = reassignHierarchyValues(distributed.teamA, distributed.teamB, distributed.reserves, "A", count);
    
    setTeamA(updatedRosters.teamA);
    setTeamB(updatedRosters.teamB);
    setReserves(updatedRosters.reserves);

    // Reset consecutive wins count upon changing team size
    setConsecutiveWinsCount(0);
    setConsecutiveWinsTeam(null);
    setConsecutiveWinsPlayers([]);
    setDismissedWinsCount(0);

    triggerToast(`Modo de jogo de ${count} vs ${count} ativado! Equipes reorganizadas de forma padrão.`, "success");
  };

  // Calculate stats based on persistent registered base and active roles
  const totalPlayers = registeredPlayers.length;
  const totalInGame = teamA.length + teamB.length + reserves.length;
  const countMen = registeredPlayers.filter((p) => p.gender === Gender.MALE).length;
  const countWomen = registeredPlayers.filter((p) => p.gender === Gender.FEMALE).length;

  const countTeamAMen = teamA.filter((p) => p.gender === Gender.MALE).length;
  const countTeamAWomen = teamA.filter((p) => p.gender === Gender.FEMALE).length;
  const countTeamBMen = teamB.filter((p) => p.gender === Gender.MALE).length;
  const countTeamBWomen = teamB.filter((p) => p.gender === Gender.FEMALE).length;

  const showGenderImbalanceWarning = teamA.length === playersPerTeam && teamB.length === playersPerTeam && (
    Math.abs(countTeamAWomen - countTeamBWomen) >= 2 || Math.abs(countTeamAMen - countTeamBMen) >= 2
  );

  const currentRosterKey = [...teamA, ...teamB].map((p) => p.id).sort().join(",");
  const isGenderImbalanceActive = showGenderImbalanceWarning && dismissedGenderImbalanceKey !== currentRosterKey;
  const isWinsStreakActive = consecutiveWinsCount === 3 && dismissedWinsCount !== 3;
  const styles = themeStyles[theme];

  return (
    <div className={`min-h-screen pb-16 transition-all duration-300 ${styles.bg}`}>
      {/* Header */}
      <header className={`border-b py-5 px-4 sticky top-0 z-30 shadow-xs transition-colors duration-200 ${styles.headerBg}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative">
          <div className="flex items-center gap-3">
            <div className={`${theme === "escuro" ? "bg-violet-600" : "bg-indigo-600"} text-white p-2.5 rounded-xl shadow-md`}>
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className={`font-display font-bold text-2xl tracking-tight transition-colors duration-200 ${styles.headerTitle}`}>
                Organizador e Rodízio de Times
              </h1>
              <p className={`text-xs font-medium transition-colors duration-200 ${styles.headerSub}`}>
                Gestão esportiva com balanceamento de gênero e rotação inteligente
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap md:flex-nowrap justify-end">
            {/* Online Sync Indicator & Room Button */}
            <button
              id="btn-sync-online"
              onClick={() => {
                setTempRoomCode(roomCode);
                setShowRoomModal(true);
              }}
              className={`relative flex h-9 w-9 items-center justify-center rounded-full border shadow-xs transition-all duration-200 hover:scale-[1.08] active:scale-[0.92] cursor-pointer ${
                syncStatus === "synced"
                  ? "bg-emerald-500 border-emerald-600 dark:border-emerald-700 text-white"
                  : syncStatus === "syncing" || syncStatus === "connecting"
                  ? "bg-amber-500 border-amber-600 dark:border-amber-700 text-white animate-pulse"
                  : "bg-rose-500 border-rose-600 dark:border-rose-700 text-white"
              }`}
              title="Sincronização Online (Clique para gerenciar sala)"
            >
              {syncStatus === "synced" ? (
                <span className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-25 pointer-events-none"></span>
              ) : syncStatus === "syncing" || syncStatus === "connecting" ? (
                <span className="absolute inset-0 rounded-full border-2 border-amber-400 animate-ping opacity-25 pointer-events-none"></span>
              ) : (
                <span className="absolute inset-0 rounded-full border-2 border-rose-400 animate-ping opacity-15 pointer-events-none"></span>
              )}
              <span className="h-3 w-3 rounded-full bg-white shadow-xs"></span>
            </button>
            {/* Quick Stats Banner */}
            <div className={`flex flex-wrap items-center gap-4 text-xs font-semibold p-2.5 rounded-xl border transition-colors duration-200 ${
              theme === "escuro" 
                ? "bg-slate-900 border-slate-800 text-slate-300" 
                : "bg-slate-50 border-slate-100 text-slate-600"
            }`}>
              <div className="flex items-center gap-1">
                <span className="opacity-60">Total:</span>
                <span className={styles.textBold}>{totalPlayers}</span>
              </div>
              <div className="w-1 h-3 opacity-20 bg-current rounded-full"></div>
              <div className="flex items-center gap-1.5 text-indigo-500 dark:text-violet-400">
                <User className="w-3.5 h-3.5" />
                <span>{countMen} M</span>
              </div>
              <div className="w-1 h-3 opacity-20 bg-current rounded-full"></div>
              <div className="flex items-center gap-1.5 text-rose-500">
                <User className="w-3.5 h-3.5" />
                <span>{countWomen} F</span>
              </div>
            </div>

            {/* Three Dot Menu Trigger */}
            <div className="relative">
              <button
                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                  theme === "escuro" 
                    ? "bg-slate-900 border-slate-850 hover:bg-slate-800 text-slate-300" 
                    : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                }`}
                title="Configurações de Visual"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {isThemeMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsThemeMenuOpen(false)} />
                  <div className={`absolute right-0 mt-2 w-52 rounded-xl border p-2 shadow-xl z-50 transition-all ${styles.dropdownBg}`}>
                    <p className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 mb-1 ${styles.textMuted}`}>
                      Escolher Tema
                    </p>
                    <button
                      onClick={() => {
                        setTheme("claro");
                        setIsThemeMenuOpen(false);
                        triggerToast("Visual Claro ativado!", "success");
                      }}
                      className={`w-full text-left text-xs font-semibold py-2 px-2.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${styles.dropdownItemHover} ${
                        theme === "claro" ? "bg-slate-100 dark:bg-slate-800 font-bold" : ""
                      }`}
                    >
                      <span>Claro</span>
                      {theme === "claro" && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </button>
                    <button
                      onClick={() => {
                        setTheme("escuro");
                        setIsThemeMenuOpen(false);
                        triggerToast("Visual Escuro ativado!", "success");
                      }}
                      className={`w-full text-left text-xs font-semibold py-2 px-2.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${styles.dropdownItemHover} ${
                        theme === "escuro" ? "bg-slate-800 font-bold" : ""
                      }`}
                    >
                      <span>Escuro</span>
                      {theme === "escuro" && <Check className="w-3.5 h-3.5 text-violet-400" />}
                    </button>

                    <div className="border-t border-slate-100 dark:border-slate-800 my-1.5" />

                    <p className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 mb-1 ${styles.textMuted}`}>
                      Configurações
                    </p>
                    <button
                      onClick={() => {
                        setIsPlayersModalOpen(true);
                        setIsThemeMenuOpen(false);
                      }}
                      className={`w-full text-left text-xs font-semibold py-2 px-2.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${styles.dropdownItemHover}`}
                    >
                      <span className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-indigo-500" />
                        <span>jogadores por time</span>
                      </span>
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-md font-bold">
                        {playersPerTeam}
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>

        </div>
      </header>

      {/* Tab Navigation (Full width / Centered) */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className={`p-1.5 rounded-2xl flex gap-1.5 border max-w-md transition-all duration-200 ${styles.tabContainer}`}>
          <button
            onClick={() => {
              setActiveTab("acoes");
              setSwappingPlayerId(null);
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "acoes"
                ? styles.tabActive
                : styles.tabInactive
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Controle & Partida
          </button>
          <button
            onClick={() => {
              setActiveTab("cadastro");
              setSwappingPlayerId(null);
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "cadastro"
                ? styles.tabActive
                : styles.tabInactive
            }`}
          >
            <Database className="w-4 h-4" />
            Cadastro ({registeredPlayers.length})
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 mt-6">
        {activeTab === "acoes" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left side actions */}
            <div className="lg:col-span-4 space-y-6">
              {/* Swapping player active banner */}
              {swappingPlayerId && (
                <div className={`p-4 rounded-2xl border flex flex-col gap-2.5 transition-all ${
                  theme === "escuro" 
                    ? "bg-violet-950/20 border-violet-800 text-violet-200" 
                    : "bg-indigo-50 border-indigo-100 text-indigo-800"
                }`}>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <ArrowLeftRight className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
                    <span>Trocando jogador: <strong className="underline">{registeredPlayers.find(p => p.id === swappingPlayerId)?.name}</strong></span>
                  </div>
                  <p className="text-[10px] opacity-80 leading-relaxed">
                    Clique no botão de troca de qualquer outro jogador (em qualquer time ou na reserva) para realizar a permuta de posições.
                  </p>
                  <button
                    onClick={() => setSwappingPlayerId(null)}
                    className="text-[10px] bg-slate-200/60 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 font-bold py-1.5 px-3 rounded-lg mt-1 transition-all self-start cursor-pointer"
                  >
                    Cancelar Troca
                  </button>
                </div>
              )}

              {/* Match actions panel */}
              <div className={`rounded-2xl border p-6 transition-all duration-200 ${styles.cardBg} ${styles.border} space-y-5`}>
                <div>
                  <h3 className={`font-display font-semibold text-sm ${styles.cardTitle} flex items-center gap-2`}>
                    <Shuffle className="w-4 h-4 text-indigo-500" />
                    Ações de Rodízio
                  </h3>
                  <p className={`text-[11px] ${styles.textMuted}`}>Reorganize e gerencie os estados das partidas</p>
                </div>

                <div className="space-y-3">
                  {teamA.length === playersPerTeam && teamB.length === playersPerTeam ? (
                    <button
                      onClick={handleMix}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 font-bold text-xs py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group cursor-pointer"
                    >
                      <Shuffle className="w-4 h-4 text-indigo-500 group-hover:rotate-180 transition-transform duration-300" />
                      Misturar e Balancear Times
                    </button>
                  ) : (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-[11px] text-amber-600 dark:text-amber-400 space-y-1">
                      <div className="flex gap-2 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                        <span>Mistura Indisponível</span>
                      </div>
                      <p>Ambos os times precisam estar completos com exatamente {playersPerTeam} jogadores para misturar.</p>
                    </div>
                  )}

                  {/* UNDO BUTTON */}
                  <button
                    onClick={handleUndo}
                    disabled={history.length === 0}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                      history.length > 0
                        ? theme === "escuro"
                          ? "bg-slate-800 hover:bg-slate-700 text-white border-slate-700 shadow-xs"
                          : "bg-white hover:bg-slate-50 text-indigo-600 border-indigo-200 shadow-xs"
                        : "bg-slate-100/50 text-slate-300 dark:bg-slate-900/50 dark:text-slate-700 border-slate-200/20 dark:border-slate-800/20"
                    }`}
                  >
                    <Undo2 className="w-4 h-4" />
                    Desfazer Última Ação {history.length > 0 && `(${history.length})`}
                  </button>

                  {/* ENCERRAR ATIVIDADES BUTTON */}
                  <button
                    onClick={() => {
                      if (teamA.length > 0 || teamB.length > 0 || reserves.length > 0) {
                        setShowEndActivitiesConfirm(true);
                      } else {
                        triggerToast("Os times e reservas já estão vazios.", "info");
                      }
                    }}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Power className="w-4 h-4" />
                    Encerrar Atividades
                  </button>
                </div>

              </div>
            </div>

            {/* Right side teams & reserves */}
            <div className="lg:col-span-8 space-y-6">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Time A Panel */}
                <div className={`rounded-2xl border shadow-xs overflow-hidden flex flex-col justify-between ${styles.cardBg} ${theme === "escuro" ? "border-violet-900/40" : "border-indigo-100/80"}`}>
                  <div>
                    <div className={`${styles.teamABg} text-white p-4 flex items-center justify-between`}>
                      <h2 className="font-display font-bold text-lg tracking-tight flex items-center gap-2">
                        Time A
                      </h2>
                      {/* Team gender counts */}
                      <div className={`${styles.teamAActions} px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2.5 border`}>
                        <span className="flex items-center gap-1">
                          M: {countTeamAMen}
                        </span>
                        <span className="w-1 h-3 bg-white/20 rounded-full"></span>
                        <span className="flex items-center gap-1">
                          F: {countTeamAWomen}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-2.5 min-h-[380px]">
                      <AnimatePresence initial={false}>
                        {teamA.length > 0 ? (
                          teamA.map((player, index) => (
                            <PlayerCard
                              key={player.id}
                              player={player}
                              slotIndex={index}
                              onDelete={() => handleRemoveFromActive(player.id, player.name)}
                              onEdit={() => setEditingPlayer(player)}
                              accentColor="indigo"
                              theme={theme}
                              isSwappingSelected={swappingPlayerId === player.id}
                              isSwappingModeActive={!!swappingPlayerId}
                              onSwap={() => {
                                if (swappingPlayerId) {
                                  if (swappingPlayerId === player.id) {
                                    setSwappingPlayerId(null);
                                  } else {
                                    handleSwapPlayers(swappingPlayerId, player.id);
                                  }
                                } else {
                                  setSwappingPlayerId(player.id);
                                }
                              }}
                              listType="A"
                              activeDragId={activeDragId}
                              setActiveDragId={setActiveDragId}
                              onDragMove={handleDragMove}
                              onDragStart={handleDragStart}
                              onDragEnd={handleDragEnd}
                              isUnlocked={unlockedPlayerIds.includes(player.id)}
                              onToggleLock={() => handleToggleLock(player.id)}
                            />
                          ))
                        ) : (
                          <EmptySlot teamName="A" slotsCount={playersPerTeam} />
                        )}
                        {teamA.length > 0 && teamA.length < playersPerTeam && (
                          <EmptyPlaceholderCount count={playersPerTeam - teamA.length} label="vaga(s) restante(s)" />
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Victory selection for Time A */}
                  <div className={`p-4 border-t ${theme === "escuro" ? "border-slate-800 bg-slate-900/20" : "border-slate-100 bg-slate-50/50"}`}>
                    <button
                      onClick={() => handleGameWinner("A")}
                      className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer ${
                        teamA.length === playersPerTeam && teamB.length === playersPerTeam
                          ? "bg-indigo-600 hover:bg-indigo-500 text-white active:scale-98 shadow-md"
                          : "bg-slate-100 text-slate-400 dark:bg-slate-900 dark:text-slate-600 border border-slate-200/50 dark:border-slate-800/50 cursor-not-allowed font-medium text-xs py-3"
                      }`}
                    >
                      <Trophy className="w-4 h-4" />
                      Time A Venceu
                    </button>
                  </div>
                </div>

                {/* Time B Panel */}
                <div className={`rounded-2xl border shadow-xs overflow-hidden flex flex-col justify-between ${styles.cardBg} ${theme === "escuro" ? "border-emerald-900/40" : "border-teal-100/80"}`}>
                  <div>
                    <div className={`${styles.teamBBg} text-white p-4 flex items-center justify-between`}>
                      <h2 className="font-display font-bold text-lg tracking-tight flex items-center gap-2">
                        Time B
                      </h2>
                      {/* Team gender counts */}
                      <div className={`${styles.teamBActions} px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2.5 border`}>
                        <span className="flex items-center gap-1">
                          M: {countTeamBMen}
                        </span>
                        <span className="w-1 h-3 bg-white/20 rounded-full"></span>
                        <span className="flex items-center gap-1">
                          F: {countTeamBWomen}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-2.5 min-h-[380px]">
                      <AnimatePresence initial={false}>
                        {teamB.length > 0 ? (
                          teamB.map((player, index) => (
                            <PlayerCard
                              key={player.id}
                              player={player}
                              slotIndex={index}
                              onDelete={() => handleRemoveFromActive(player.id, player.name)}
                              onEdit={() => setEditingPlayer(player)}
                              accentColor="teal"
                              theme={theme}
                              isSwappingSelected={swappingPlayerId === player.id}
                              isSwappingModeActive={!!swappingPlayerId}
                              onSwap={() => {
                                if (swappingPlayerId) {
                                  if (swappingPlayerId === player.id) {
                                    setSwappingPlayerId(null);
                                  } else {
                                    handleSwapPlayers(swappingPlayerId, player.id);
                                  }
                                } else {
                                  setSwappingPlayerId(player.id);
                                }
                              }}
                              listType="B"
                              activeDragId={activeDragId}
                              setActiveDragId={setActiveDragId}
                              onDragMove={handleDragMove}
                              onDragStart={handleDragStart}
                              onDragEnd={handleDragEnd}
                              isUnlocked={unlockedPlayerIds.includes(player.id)}
                              onToggleLock={() => handleToggleLock(player.id)}
                            />
                          ))
                        ) : (
                          <EmptySlot teamName="B" slotsCount={playersPerTeam} />
                        )}
                        {teamB.length > 0 && teamB.length < playersPerTeam && (
                          <EmptyPlaceholderCount count={playersPerTeam - teamB.length} label="vaga(s) restante(s)" />
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Victory selection for Time B */}
                  <div className={`p-4 border-t ${theme === "escuro" ? "border-slate-800 bg-slate-900/20" : "border-slate-100 bg-slate-50/50"}`}>
                    <button
                      onClick={() => handleGameWinner("B")}
                      className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer ${
                        teamA.length === playersPerTeam && teamB.length === playersPerTeam
                          ? "bg-teal-600 hover:bg-teal-500 text-white active:scale-98 shadow-md"
                          : "bg-slate-100 text-slate-400 dark:bg-slate-900 dark:text-slate-600 border border-slate-200/50 dark:border-slate-800/50 cursor-not-allowed font-medium text-xs py-3"
                      }`}
                    >
                      <Trophy className="w-4 h-4" />
                      Time B Venceu
                    </button>
                  </div>
                </div>

              </div>

              {/* Section: Cadastro Reserva */}
              <div className={`rounded-2xl border p-6 shadow-xs ${styles.cardBg} ${styles.border}`}>
                <div className="flex items-center justify-between border-b pb-4 mb-4 border-slate-100 dark:border-slate-800">
                  <div>
                    <h2 className="font-display font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-amber-500" />
                      Cadastro Reserva / Fila de Espera
                    </h2>
                    <p className={`text-xs ${styles.textMuted}`}>Ordenados por chegada - Sequência a partir de #13</p>
                  </div>
                  <span className={`${styles.reserveBg} ${theme === "escuro" ? "text-white" : "text-amber-900"} text-xs font-extrabold px-3 py-1 rounded-full font-mono shadow-xs border border-white/10`}>
                    {reserves.length} na fila
                  </span>
                </div>

                <div className="min-h-[120px]">
                  {reserves.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <AnimatePresence initial={false}>
                        {reserves.map((player, index) => (
                          <PlayerCard
                            key={player.id}
                            player={player}
                            slotIndex={index}
                            onDelete={() => handleRemoveFromActive(player.id, player.name)}
                            onEdit={() => setEditingPlayer(player)}
                            accentColor="amber"
                            theme={theme}
                            isReserve
                            listType="Res"
                            activeDragId={activeDragId}
                            setActiveDragId={setActiveDragId}
                            onDragMove={handleDragMove}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            isSwappingSelected={swappingPlayerId === player.id}
                            isSwappingModeActive={!!swappingPlayerId}
                            onSwap={() => {
                              if (swappingPlayerId) {
                                if (swappingPlayerId === player.id) {
                                  setSwappingPlayerId(null);
                                } else {
                                  handleSwapPlayers(swappingPlayerId, player.id);
                                }
                              } else {
                                setSwappingPlayerId(player.id);
                              }
                            }}
                            isUnlocked={unlockedPlayerIds.includes(player.id)}
                            onToggleLock={() => handleToggleLock(player.id)}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400 border border-dashed border-slate-200/60 rounded-xl">
                      <Users className="w-8 h-8 text-slate-300 mb-1.5" />
                      <p className="text-xs font-semibold">Sem jogadores na reserva.</p>
                      <p className="text-[10px] text-slate-400 max-w-xs mt-0.5">
                        Jogadores adicionados além dos {2 * playersPerTeam} titulares entram automaticamente nesta fila de espera.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Cadastro Tab view */
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left column: Add form */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Section: Cadastrar Jogador */}
                <div className={`rounded-2xl border p-6 transition-all duration-200 ${styles.cardBg} ${styles.border}`}>
                  <h3 className={`font-display font-semibold text-sm ${styles.cardTitle} mb-4 flex items-center gap-2`}>
                    <Plus className="w-4 h-4 text-indigo-600" />
                    Novo Jogador
                  </h3>
                  
                  <form onSubmit={handleAddPlayer} className="space-y-4">
                    <div>
                      <label htmlFor="playerName" className={`block text-[10px] font-bold uppercase tracking-wider ${styles.textMuted} mb-1.5`}>
                        Nome do Jogador
                      </label>
                      <input
                        id="playerName"
                        type="text"
                        placeholder="Ex: Carlos Silva"
                        className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${styles.inputBg}`}
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                      />
                    </div>

                    <div>
                      <span className={`block text-[10px] font-bold uppercase tracking-wider ${styles.textMuted} mb-1.5`}>
                        Sexo / Gênero
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            newPlayerGender === Gender.MALE
                              ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs dark:bg-indigo-950/40 dark:border-indigo-850 dark:text-indigo-300"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-850"
                          }`}
                          onClick={() => setNewPlayerGender(Gender.MALE)}
                        >
                          <User className="w-3.5 h-3.5 text-indigo-500" />
                          Masculino
                        </button>
                        <button
                          type="button"
                          className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            newPlayerGender === Gender.FEMALE
                              ? "bg-rose-50 border-rose-200 text-rose-700 shadow-xs dark:bg-rose-950/40 dark:border-rose-850 dark:text-rose-300"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-850"
                          }`}
                          onClick={() => setNewPlayerGender(Gender.FEMALE)}
                        >
                          <User className="w-3.5 h-3.5 text-rose-500" />
                          Feminino
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className={`block text-[10px] font-bold uppercase tracking-wider ${styles.textMuted} mb-1.5`}>
                        Convidado?
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            newPlayerIsGuest === true
                              ? "bg-amber-50 border-amber-205 text-amber-800 shadow-xs dark:bg-amber-950/40 dark:border-amber-850 dark:text-amber-300 font-bold"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-850"
                          }`}
                          onClick={() => setNewPlayerIsGuest(true)}
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            newPlayerIsGuest === false
                              ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs dark:bg-indigo-950/40 dark:border-indigo-850 dark:text-indigo-300 font-bold"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-850"
                          }`}
                          onClick={() => setNewPlayerIsGuest(false)}
                        >
                          Não
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 font-bold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Cadastrar Jogador
                    </button>
                  </form>
                </div>

              </div>

              {/* Right column: Master Registered alphabetical list */}
              <div className="lg:col-span-8 space-y-6">
                
                <div className={`rounded-2xl border p-6 shadow-xs space-y-4 ${styles.cardBg} ${styles.border}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-500" />
                      <h3 className={`font-display font-semibold text-sm ${styles.cardTitle}`}>
                        Jogadores Cadastrados
                      </h3>
                      <span className={`text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded-md font-bold`}>
                        {registeredPlayers.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Período Score:</span>
                      <select
                        value={frequencyPeriod}
                        onChange={(e) => setFrequencyPeriod(parseInt(e.target.value, 10))}
                        className={`text-xs px-2.5 py-1.5 border rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-transparent text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-850 cursor-pointer`}
                      >
                        <option value={3} className="bg-white dark:bg-slate-900">3 dias</option>
                        <option value={7} className="bg-white dark:bg-slate-900">7 dias</option>
                        <option value={15} className="bg-white dark:bg-slate-900">15 dias</option>
                        <option value={30} className="bg-white dark:bg-slate-900">30 dias</option>
                        <option value={45} className="bg-white dark:bg-slate-900">45 dias</option>
                      </select>
                    </div>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nome..."
                      className={`w-full pl-9 pr-3.5 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${styles.inputBg}`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Master list */}
                  <div className="space-y-2.5">
                    {registeredPlayers.length > 0 ? (
                      (() => {
                        const filtered = registeredPlayers.filter((p) =>
                          p.name.toLowerCase().includes(searchQuery.toLowerCase())
                        );

                        if (filtered.length === 0) {
                          return (
                            <p className={`text-center text-xs ${styles.textMuted} py-6`}>
                              Nenhum jogador encontrado para "{searchQuery}".
                            </p>
                          );
                        }

                        return filtered.map((player) => {
                          const isInA = teamA.some((p) => p.id === player.id);
                          const isInB = teamB.some((p) => p.id === player.id);
                          const isInRes = reserves.some((p) => p.id === player.id);
                          const isEscalado = isInA || isInB || isInRes;

                          return (
                            <div
                              key={player.id}
                              className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                                isEscalado
                                  ? "bg-indigo-50/20 border-indigo-100/50 dark:bg-violet-950/10 dark:border-violet-900/30"
                                  : "bg-slate-50/50 border-slate-100 hover:bg-slate-50 hover:border-slate-200 dark:bg-slate-900/40 dark:border-slate-850 dark:hover:bg-slate-900"
                              }`}
                            >
                              <div className="min-w-0 flex items-center gap-2">
                                <span
                                  className={`p-1.5 rounded-lg shrink-0 ${
                                    player.gender === Gender.MALE
                                      ? "bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400"
                                      : "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                                  }`}
                                >
                                  <User className="w-3.5 h-3.5" />
                                </span>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className={`text-xs font-bold truncate leading-snug ${styles.textBold}`}>
                                      {player.name}
                                    </p>
                                    {player.isGuest && (
                                      <span className="text-[9px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-bold px-1.5 py-0.5 rounded-md border border-slate-200/40 dark:border-slate-700/40">
                                        Convidado
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleShowPlayerPresenceDetails(player)}
                                      className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold cursor-pointer hover:opacity-80 transition-all ${getScoreStyles(player)} flex items-center gap-1`}
                                      title="Clique para ver os dias de presença"
                                    >
                                      <span>Score: {player.isGuest ? "—" : getPlayerScore(player.id)}</span>
                                    </button>
                                  </div>
                                  {isEscalado && (
                                    <span className="text-[9px] font-semibold text-indigo-600 dark:text-violet-400 flex items-center gap-1 mt-0.5 animate-pulse">
                                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-violet-500"></span>
                                      {isInA ? "No Time A" : isInB ? "No Time B" : "Na Reserva"}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0 ml-1">
                                {/* Add to play button */}
                                <button
                                  type="button"
                                  onClick={() => handleAddToActive(player)}
                                  disabled={isEscalado}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    isEscalado
                                      ? "text-slate-300 bg-slate-100 dark:text-slate-700 dark:bg-slate-800/40 cursor-not-allowed"
                                      : "text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-violet-400 dark:bg-violet-950/40 dark:hover:bg-violet-950/80"
                                  }`}
                                >
                                  <Plus className="w-3.5 h-3.5 font-bold" />
                                </button>
                                {/* Edit button */}
                                <button
                                  type="button"
                                  onClick={() => setEditingPlayer(player)}
                                  className={`p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer`}
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                {/* Permanent delete button */}
                                <button
                                  type="button"
                                  onClick={() => handleDefinitiveDelete(player.id, player.name)}
                                  className={`p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        });
                      })()
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <User className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                        <p className="text-xs font-semibold">Nenhum jogador cadastrado.</p>
                        <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto mt-1 leading-relaxed">
                          Cadastre acima os jogadores que participam dos seus encontros e rodízios.
                        </p>
                      </div>
                    )}
                  </div>

                </div>

              </div>
            </div>

            {/* Bottom Section: Rules & Dangerous Actions below all registered players */}
            <div className="space-y-6">
              {/* Rules Help Card inside Cadastro tab */}
              <div className={`rounded-2xl p-6 shadow-md space-y-3.5 ${styles.rulesBg}`}>
                <h3 className={`font-display font-semibold text-sm flex items-center gap-2 ${styles.rulesTitle}`}>
                  <HelpCircle className="w-5 h-5 text-indigo-400" />
                  Regras de Funcionamento e Rodízio de Jogadores
                </h3>
                <ul className={`text-xs space-y-2.5 list-disc pl-4 font-normal ${styles.rulesText}`}>
                  <li>
                    <strong className={styles.rulesStrong}>Hierarquia Dinâmica:</strong> O time vencedor da partida anterior sempre recebe as numerações ímpares (1, 3, 5...), garantindo prioridade hierárquica na fila. O time perdedor ou rearranjado com a entrada dos reservas recebe as numerações pares (2, 4, 6...).
                  </li>
                  <li>
                    <strong className={styles.rulesStrong}>Entrada Alternada:</strong> Ao escalar novos jogadores, eles preenchem os times ativos alternadamente: o 1º vai para o Time A, o 2º para o Time B, o 3º para o Time A, e assim por diante até completar {2 * playersPerTeam} titulares. O {2 * playersPerTeam + 1}º em diante entra na fila de reserva por ordem de chegada.
                  </li>
                  <li>
                    <strong className={styles.rulesStrong}>Reordenação Manual:</strong> Toque e segure no nome de um jogador (celular) ou arraste (desktop) para movê-lo para cima ou para baixo dentro do próprio time ou da reserva. A lista se renumera automaticamente respeitando a regra de rodízio e vitórias.
                  </li>
                  <li>
                    <strong className={styles.rulesStrong}>Cadastro Reserva:</strong> Jogadores excedentes recebem numerações sequenciais a partir de {2 * playersPerTeam + 1}.
                  </li>
                  <li>
                    <strong className={styles.rulesStrong}>Rotação de Perdedor:</strong> Os {playersPerTeam} perdedores vão para o fim da fila de reserva. Se a reserva tiver menos de {playersPerTeam} jogadores, os disponíveis entram no topo do time perdedor, empurrando os últimos do time para o fim da reserva.
                  </li>
                  <li>
                    <strong className={styles.rulesStrong}>Exclusão Inteligente:</strong> Se um jogador ativo for excluído, o 1° da reserva sobe imediatamente e entra no topo daquele time.
                  </li>
                  <li>
                    <strong className={styles.rulesStrong}>Mistura Balanceada:</strong> Troca {Math.floor(playersPerTeam / 2)} jogadores aleatórios de cada time, garantindo quantidade igual de gêneros em cada time (se o total de homens for ímpar, Time A fica com 1 homem a mais). Os jogadores são listados respeitando sua numeração original.
                  </li>
                </ul>
              </div>

              {/* Histórico de Presença button at the bottom */}
              <div className={`rounded-2xl border p-5 transition-all duration-200 ${styles.cardBg} ${styles.border} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
                <div className="space-y-0.5">
                  <p className={`text-[11px] font-bold uppercase tracking-wider ${theme === "escuro" ? "text-violet-400" : "text-indigo-650"}`}>Histórico & Frequência</p>
                  <p className={`text-[10px] ${styles.textMuted}`}>Visualize o painel completo de presença e convidados do dia</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPresenceHistoryOpen(true)}
                  className="text-xs bg-indigo-600 hover:bg-indigo-550 text-white font-bold flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl transition-all cursor-pointer shadow-sm dark:bg-violet-600 dark:hover:bg-violet-500 border border-transparent"
                >
                  <History className="w-3.5 h-3.5" />
                  Histórico de Presença
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* EDIT PLAYER MODAL DIALOG */}
      <AnimatePresence>
        {editingPlayer && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`rounded-2xl shadow-xl max-w-md w-full p-6 border transition-all duration-200 ${styles.cardBg} ${styles.border}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-display font-semibold text-lg flex items-center gap-2 ${styles.textBold}`}>
                  <Edit2 className="w-5 h-5 text-indigo-650" />
                  Editar Cadastro do Jogador
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingPlayer(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="editPlayerName" className={`block text-xs font-bold uppercase tracking-wider ${styles.textMuted} mb-1.5`}>
                    Nome Completo / Apelido
                  </label>
                  <input
                    id="editPlayerName"
                    type="text"
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${styles.inputBg}`}
                    value={editingPlayer.name}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                  />
                </div>

                <div>
                  <span className={`block text-xs font-bold uppercase tracking-wider ${styles.textMuted} mb-1.5`}>
                    Sexo / Gênero
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className={`py-2 px-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        editingPlayer.gender === Gender.MALE
                          ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs dark:bg-indigo-950/40 dark:border-indigo-850 dark:text-indigo-300"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-450"
                      }`}
                      onClick={() => setEditingPlayer({ ...editingPlayer, gender: Gender.MALE })}
                    >
                      <User className="w-4 h-4 text-indigo-500" />
                      Masculino
                    </button>
                    <button
                      type="button"
                      className={`py-2 px-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        editingPlayer.gender === Gender.FEMALE
                          ? "bg-rose-50 border-rose-200 text-rose-700 shadow-xs dark:bg-rose-950/40 dark:border-rose-850 dark:text-rose-300"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-450"
                      }`}
                      onClick={() => setEditingPlayer({ ...editingPlayer, gender: Gender.FEMALE })}
                    >
                      <User className="w-4 h-4 text-rose-500" />
                      Feminino
                    </button>
                  </div>
                </div>

                <div>
                  <span className={`block text-xs font-bold uppercase tracking-wider ${styles.textMuted} mb-1.5`}>
                    Convidado?
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className={`py-2 px-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        editingPlayer.isGuest === true
                          ? "bg-amber-50 border-amber-205 text-amber-800 shadow-xs dark:bg-amber-950/40 dark:border-amber-850 dark:text-amber-300 font-bold"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-450"
                      }`}
                      onClick={() => setEditingPlayer({ ...editingPlayer, isGuest: true })}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      className={`py-2 px-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        editingPlayer.isGuest !== true
                          ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs dark:bg-indigo-950/40 dark:border-indigo-850 dark:text-indigo-300 font-bold"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-450"
                      }`}
                      onClick={() => setEditingPlayer({ ...editingPlayer, isGuest: false })}
                    >
                      Não
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5 mt-6 justify-end">
                <button
                  type="button"
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                  onClick={() => setEditingPlayer(null)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-550 shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  onClick={handleSaveEditedPlayer}
                >
                  <Save className="w-4 h-4" />
                  Salvar Alterações
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PLAYER PRESENCE DETAILS MODAL */}
      <AnimatePresence>
        {selectedPlayerPresenceDetails && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`rounded-2xl shadow-xl max-w-md w-full p-6 border transition-all duration-200 ${styles.cardBg} ${styles.border}`}
            >
              <div className="flex items-center justify-between mb-4 border-b pb-3 border-slate-100 dark:border-slate-800">
                <div className="min-w-0">
                  <h3 className={`font-display font-semibold text-base truncate ${styles.textBold}`}>
                    Histórico de Presença
                  </h3>
                  <p className={`text-xs ${styles.textMuted} truncate mt-0.5`}>
                    {selectedPlayerPresenceDetails.player.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPlayerPresenceDetails(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Meta Summary stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-xl border text-center ${theme === "escuro" ? "bg-slate-900/50 border-slate-800" : "bg-slate-50/50 border-slate-100"}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${styles.textMuted}`}>Score ({frequencyPeriod}d)</p>
                    <p className={`text-2xl font-black mt-1 ${
                      selectedPlayerPresenceDetails.player.isGuest
                        ? "text-slate-500"
                        : getPlayerScore(selectedPlayerPresenceDetails.player.id) >= 4
                        ? "text-emerald-600 dark:text-emerald-400"
                        : getPlayerScore(selectedPlayerPresenceDetails.player.id) === 3
                        ? "text-amber-500"
                        : getPlayerScore(selectedPlayerPresenceDetails.player.id) === 0
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-orange-500"
                    }`}>
                      {selectedPlayerPresenceDetails.player.isGuest ? "—" : getPlayerScore(selectedPlayerPresenceDetails.player.id)}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl border text-center ${theme === "escuro" ? "bg-slate-900/50 border-slate-800" : "bg-slate-50/50 border-slate-100"}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${styles.textMuted}`}>Tipo de Membro</p>
                    <p className={`text-xs font-bold mt-2.5 ${selectedPlayerPresenceDetails.player.isGuest ? "text-amber-600 dark:text-amber-400" : "text-indigo-600 dark:text-violet-400"}`}>
                      {selectedPlayerPresenceDetails.player.isGuest ? "Convidado" : "Regular"}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className={`text-[10px] font-bold uppercase tracking-wider ${styles.textMuted} mb-2`}>
                    Datas de Presença Registradas ({selectedPlayerPresenceDetails.dates.length})
                  </h4>
                  <div className="max-h-52 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                    {selectedPlayerPresenceDetails.dates.length > 0 ? (
                      selectedPlayerPresenceDetails.dates.map((d, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                            theme === "escuro" ? "bg-slate-900/30 border-slate-850" : "bg-slate-50/30 border-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                            <span className={`font-semibold ${styles.textBold}`}>{d.dateString}</span>
                          </div>
                          <span className={`text-[10px] font-mono ${styles.textMuted}`}>
                            {new Date(d.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 border border-dashed rounded-xl border-slate-200 dark:border-slate-800 text-slate-400">
                        <AlertCircle className="w-5 h-5 text-slate-300 mx-auto mb-1" />
                        <p className="text-[11px] font-semibold">Nenhuma presença recente encontrada.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 text-right">
                <button
                  type="button"
                  className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                  onClick={() => setSelectedPlayerPresenceDetails(null)}
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PRESENCE HISTORY MODAL DIALOG */}
      <AnimatePresence>
        {isPresenceHistoryOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`rounded-2xl shadow-xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col border transition-all duration-200 ${styles.cardBg} ${styles.border}`}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-50 dark:bg-violet-950/40 text-indigo-600 dark:text-violet-400 rounded-xl">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`font-display font-semibold text-base ${styles.textBold}`}>
                      Histórico de Presença & Cadastro
                    </h3>
                    <p className={`text-[10px] font-medium ${styles.textMuted}`}>
                      Frequência atual dos jogadores e gestão de convidados
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPresenceHistoryOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Segmented Tab Bar */}
              <div className="flex border-b border-slate-100 dark:border-slate-850 px-6 shrink-0 bg-slate-50/50 dark:bg-slate-900/20">
                <button
                  type="button"
                  onClick={() => setHistoryModalTab("frequencia")}
                  className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                    historyModalTab === "frequencia"
                      ? "border-indigo-600 text-indigo-600 dark:border-violet-400 dark:text-violet-400 font-extrabold"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Frequência & Scores
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryModalTab("arquivos")}
                  className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                    historyModalTab === "arquivos"
                      ? "border-indigo-600 text-indigo-600 dark:border-violet-400 dark:text-violet-400 font-extrabold"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Listas de Presença ({presenceHistory.length})
                </button>
              </div>

              {/* Scrollable Modal Content */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                {historyModalTab === "frequencia" ? (
                  <>
                    {/* Stats row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className={`p-3.5 border rounded-xl ${styles.cardBg} ${styles.border} shadow-2xs`}>
                        <p className={`text-[9px] font-bold uppercase tracking-wider ${styles.textMuted}`}>Cadastrados</p>
                        <p className={`text-xl font-display font-extrabold mt-0.5 ${styles.textBold}`}>{registeredPlayers.length}</p>
                        <div className="flex gap-2 text-[9px] font-medium mt-1 text-slate-400">
                          <span>{registeredPlayers.filter(p => !p.isGuest).length} Regulares</span>
                          <span>•</span>
                          <span>{registeredPlayers.filter(p => p.isGuest).length} Convidados</span>
                        </div>
                      </div>
                      <div className="p-3.5 border rounded-xl bg-indigo-50/10 dark:bg-violet-950/10 border-indigo-100/30 dark:border-violet-900/20 shadow-2xs">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-500 dark:text-violet-400">Presentes Hoje</p>
                        <p className="text-xl font-display font-extrabold mt-0.5 text-indigo-600 dark:text-violet-400">
                          {teamA.length + teamB.length + reserves.length}
                        </p>
                        <div className="flex gap-1 text-[9px] font-medium mt-1 text-slate-400">
                          <span>{teamA.length + teamB.length} Em Jogo</span>
                          <span>•</span>
                          <span>{reserves.length} Reserva</span>
                        </div>
                      </div>
                      <div className="p-3.5 border rounded-xl bg-amber-50/10 dark:bg-amber-950/10 border-amber-100/30 dark:border-amber-900/20 shadow-2xs">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Convidados</p>
                        <p className="text-xl font-display font-extrabold mt-0.5 text-amber-600 dark:text-amber-400">
                          {registeredPlayers.filter(p => p.isGuest).length}
                        </p>
                        <p className="text-[9px] text-slate-400 mt-1">
                          {registeredPlayers.filter(p => p.isGuest && (teamA.some(x => x.id === p.id) || teamB.some(x => x.id === p.id) || reserves.some(x => x.id === p.id))).length} presentes
                        </p>
                      </div>
                      <div className={`p-3.5 border rounded-xl ${styles.cardBg} ${styles.border} shadow-2xs`}>
                        <p className={`text-[9px] font-bold uppercase tracking-wider ${styles.textMuted}`}>Ausentes</p>
                        <p className={`text-xl font-display font-extrabold mt-0.5 ${styles.textBold}`}>
                          {registeredPlayers.length - (teamA.length + teamB.length + reserves.length)}
                        </p>
                        <p className="text-[9px] text-slate-400 mt-1">Não escalados na partida</p>
                      </div>
                    </div>

                    {/* Filters control bar */}
                    <div className={`p-4 border rounded-xl ${styles.cardBg} ${styles.border} space-y-3.5`}>
                      {/* Search Input */}
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Buscar jogador no histórico..."
                          className={`w-full pl-9 pr-3.5 py-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${styles.inputBg}`}
                          value={historySearchQuery}
                          onChange={(e) => setHistorySearchQuery(e.target.value)}
                        />
                      </div>

                      {/* Filter Selectors */}
                      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                        <div>
                          <span className={`block text-[10px] font-bold uppercase tracking-wider ${styles.textMuted} mb-1.5`}>
                            Filtro de Presença
                          </span>
                          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px] font-semibold">
                            <button
                              type="button"
                              onClick={() => setPresenceFilter("all")}
                              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                                presenceFilter === "all"
                                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-350"
                              }`}
                            >
                              Todos ({registeredPlayers.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => setPresenceFilter("present")}
                              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                                presenceFilter === "present"
                                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-355"
                              }`}
                            >
                              Presentes ({teamA.length + teamB.length + reserves.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => setPresenceFilter("absent")}
                              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                                presenceFilter === "absent"
                                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-355"
                              }`}
                            >
                              Ausentes ({registeredPlayers.length - (teamA.length + teamB.length + reserves.length)})
                            </button>
                          </div>
                        </div>

                        <div>
                          <span className={`block text-[10px] font-bold uppercase tracking-wider ${styles.textMuted} mb-1.5`}>
                            Tipo de Cadastro
                          </span>
                          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px] font-semibold">
                            <button
                              type="button"
                              onClick={() => setGuestFilter("all")}
                              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                                guestFilter === "all"
                                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-350"
                              }`}
                            >
                              Todos
                            </button>
                            <button
                              type="button"
                              onClick={() => setGuestFilter("guests")}
                              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                                guestFilter === "guests"
                                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-350"
                              }`}
                            >
                              Convidados ({registeredPlayers.filter(p => p.isGuest).length})
                            </button>
                            <button
                              type="button"
                              onClick={() => setGuestFilter("regulars")}
                              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                                guestFilter === "regulars"
                                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-350"
                              }`}
                            >
                              Regulares ({registeredPlayers.filter(p => !p.isGuest).length})
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Table/List View */}
                    <div className="border border-slate-100 dark:border-slate-850 rounded-xl overflow-hidden shadow-2xs">
                      <div className="max-h-[350px] overflow-y-auto">
                        {(() => {
                          const filtered = registeredPlayers.filter((player) => {
                            const matchesSearch = player.name.toLowerCase().includes(historySearchQuery.toLowerCase());
                            const isInActivePlay =
                              teamA.some(p => p.id === player.id) ||
                              teamB.some(p => p.id === player.id) ||
                              reserves.some(p => p.id === player.id);
                            const matchesPresence =
                              presenceFilter === "all" ? true :
                              presenceFilter === "present" ? isInActivePlay :
                              !isInActivePlay;
                            const matchesGuest =
                              guestFilter === "all" ? true :
                              guestFilter === "guests" ? player.isGuest === true :
                              player.isGuest !== true;
                            return matchesSearch && matchesPresence && matchesGuest;
                          });

                          if (filtered.length === 0) {
                            return (
                              <div className="text-center py-12 bg-white dark:bg-slate-900">
                                <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-xs font-semibold text-slate-400">Nenhum jogador encontrado.</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">Tente alterar os filtros de busca acima.</p>
                              </div>
                            );
                          }

                          return (
                            <table className="w-full text-left border-collapse bg-white dark:bg-slate-900">
                              <thead>
                                <tr className="bg-slate-50/80 dark:bg-slate-800/40 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-100 dark:border-slate-800">
                                  <th className="px-5 py-3">Jogador</th>
                                  <th className="px-4 py-3 text-center">Cadastro</th>
                                  <th className="px-4 py-3 text-center">Status de Presença</th>
                                  <th className="px-5 py-3 text-right">Ações</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                                {filtered.map((player) => {
                                  const isInA = teamA.some(p => p.id === player.id);
                                  const isInB = teamB.some(p => p.id === player.id);
                                  const isInRes = reserves.some(p => p.id === player.id);
                                  const isPresent = isInA || isInB || isInRes;

                                  return (
                                    <tr key={player.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20 transition-all">
                                      {/* Info */}
                                      <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <span className={`p-1.5 rounded-lg shrink-0 ${
                                            player.gender === Gender.MALE
                                              ? "bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400"
                                              : "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                                          }`}>
                                            <User className="w-3.5 h-3.5" />
                                          </span>
                                          <span className={`font-semibold truncate ${styles.textBold}`}>
                                            {player.name}
                                          </span>
                                        </div>
                                      </td>

                                      {/* Guest Type */}
                                      <td className="px-4 py-3.5 text-center">
                                        {player.isGuest ? (
                                          <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200/50 dark:bg-amber-955/30 dark:text-amber-400 font-extrabold px-2 py-0.5 rounded-full">
                                            Convidado
                                          </span>
                                        ) : (
                                          <span className="text-[9px] bg-slate-50 text-slate-500 border border-slate-200/45 dark:bg-slate-800 dark:text-slate-400 font-bold px-2 py-0.5 rounded-full">
                                            Membro Regular
                                          </span>
                                        )}
                                      </td>

                                      {/* Status badge */}
                                      <td className="px-4 py-3.5 text-center">
                                        {isInA ? (
                                          <span className="inline-flex items-center gap-1.5 text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-200/50 dark:bg-violet-950/30 dark:text-violet-400 font-extrabold px-2 py-0.5 rounded-full">
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-violet-500 animate-pulse"></span>
                                            No Time A
                                          </span>
                                        ) : isInB ? (
                                          <span className="inline-flex items-center gap-1.5 text-[9px] bg-teal-50 text-teal-700 border border-teal-200/50 dark:bg-emerald-950/30 dark:text-emerald-400 font-extrabold px-2 py-0.5 rounded-full">
                                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 dark:bg-emerald-500 animate-pulse"></span>
                                            No Time B
                                          </span>
                                        ) : isInRes ? (
                                          <span className="inline-flex items-center gap-1.5 text-[9px] bg-amber-50 text-amber-700 border border-amber-200/50 dark:bg-amber-950/30 dark:text-amber-400 font-extrabold px-2 py-0.5 rounded-full">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                            Na Reserva
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1.5 text-[9px] bg-slate-50 text-slate-400 border border-slate-200/40 dark:bg-slate-800 dark:text-slate-500 font-bold px-2 py-0.5 rounded-full">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-650"></span>
                                            Ausente
                                          </span>
                                        )}
                                      </td>

                                      {/* Quick Actions */}
                                      <td className="px-5 py-3.5 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                          {isPresent ? (
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveFromActive(player.id, player.name)}
                                              title="Marcar como Ausente (Remover do jogo)"
                                              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 p-1.5 rounded-lg transition-colors cursor-pointer"
                                            >
                                              <UserMinus className="w-3.5 h-3.5" />
                                            </button>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={() => handleAddToActive(player)}
                                              title="Marcar como Presente (Adicionar ao jogo)"
                                              className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-violet-400 dark:bg-violet-950/30 dark:hover:bg-violet-950/60 p-1.5 rounded-lg transition-colors cursor-pointer"
                                            >
                                              <Plus className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingPlayer(player);
                                            }}
                                            title="Editar cadastro do jogador"
                                            className="text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors cursor-pointer"
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          );
                        })()}
                      </div>
                    </div>
                  </>
                ) : (
                  /* TAB: ARCHIVED LISTS OF PRESENCE */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className={`text-xs font-semibold ${styles.textMuted}`}>
                        Mostrando {presenceHistory.length} encontros encerrados (arquivados)
                      </p>
                    </div>

                    <div className="max-h-[380px] overflow-y-auto space-y-3 pr-1">
                      {presenceHistory.length > 0 ? (
                        [...presenceHistory]
                          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
                          .map((list) => {
                            const isExpanded = expandedDates.includes(list.dateString);
                            return (
                              <div
                                key={list.dateString}
                                className={`border rounded-xl overflow-hidden transition-all duration-205 ${
                                  isExpanded
                                    ? "border-indigo-200 dark:border-indigo-900/50 shadow-xs"
                                    : "border-slate-100 hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-750"
                                } ${styles.cardBg}`}
                              >
                                {/* List Header item */}
                                <div className="p-4 flex items-center justify-between gap-4 flex-wrap">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 dark:bg-violet-950/40 text-indigo-600 dark:text-violet-400 rounded-lg">
                                      <Calendar className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <h4 className={`text-sm font-bold ${styles.textBold}`}>{list.dateString}</h4>
                                      <p className={`text-[10px] ${styles.textMuted}`}>
                                        Encontro encerrado às {new Date(list.timestamp || Date.now()).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 ml-auto sm:ml-0">
                                    <span className="text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2.5 py-1 rounded-full">
                                      {list.players.length} Presentes
                                    </span>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-1.5">
                                      {/* Expand/Collapse */}
                                      <button
                                        type="button"
                                        onClick={() => toggleDateExpanded(list.dateString)}
                                        className="p-1.5 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg transition-colors cursor-pointer"
                                        title={isExpanded ? "Ocultar jogadores" : "Ver jogadores presentes"}
                                      >
                                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                      </button>

                                      {/* Delete List */}
                                      <button
                                        type="button"
                                        onClick={() => setPresenceListToDelete(list)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                                        title="Excluir lista de presença"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Expanded list of player names */}
                                {isExpanded && (
                                  <div className="px-5 pb-5 pt-1.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/10">
                                    <p className={`text-[10px] font-bold uppercase tracking-wider ${styles.textMuted} mb-2.5`}>
                                      Jogadores presentes neste dia:
                                    </p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                      {list.players.map((p) => (
                                        <div
                                          key={p.id}
                                          className={`px-3 py-2 rounded-lg border text-xs flex items-center justify-between ${
                                            theme === "escuro" ? "bg-slate-900/40 border-slate-850" : "bg-white border-slate-155"
                                          }`}
                                        >
                                          <span className={`font-semibold truncate ${styles.textBold}`}>{p.name}</span>
                                          {p.isGuest && (
                                            <span className="text-[8px] bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 font-extrabold px-1 rounded-sm shrink-0">
                                              C
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                      ) : (
                        <div className="text-center py-16 border border-dashed rounded-2xl border-slate-200 dark:border-slate-800 text-slate-400">
                          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs font-bold">Nenhuma lista de presença arquivada.</p>
                          <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto">
                            Ao encerrar as atividades de uma sessão (clicando no botão "Encerrar Atividades"), a lista de presentes será salva aqui.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setIsPresenceHistoryOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  Fechar Painel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CLEAR ALL CONFIRMATION DIALOG */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`rounded-2xl shadow-xl max-w-md w-full p-6 border transition-all duration-200 ${styles.cardBg} ${styles.border}`}
            >
              <div className="flex items-center gap-3 text-rose-600 mb-3">
                <div className="p-2 bg-rose-50 dark:bg-rose-950/20 rounded-xl">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className={`font-display font-bold text-lg ${styles.textBold}`}>
                  Limpar todos os registros?
                </h3>
              </div>
              <p className={`text-xs leading-relaxed ${styles.textMuted}`}>
                Esta ação apagará permanentemente todos os jogadores cadastrados, esvaziando o Time A, o Time B e a fila de reserva. Esta ação não poderá ser desfeita.
              </p>
              <div className="flex gap-2.5 mt-6 justify-end">
                <button
                  type="button"
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                  onClick={() => setShowClearConfirm(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md transition-all cursor-pointer"
                  onClick={handleClearAll}
                >
                  Sim, Limpar Tudo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* JOGADORES POR TIME CONFIGURATION DIALOG */}
      <AnimatePresence>
        {isPlayersModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`rounded-2xl shadow-xl max-w-sm w-full p-6 border transition-all duration-200 ${styles.cardBg} ${styles.border}`}
            >
              <div className="flex items-center gap-3 text-indigo-600 dark:text-violet-400 mb-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className={`font-display font-bold text-lg ${styles.textBold}`}>
                  Jogadores por time
                </h3>
              </div>
              <p className={`text-xs leading-relaxed mb-4 ${styles.textMuted}`}>
                Altere o número de jogadores por equipe (mínimo 2 e máximo 11). Por padrão, o aplicativo organiza partidas de 6 jogadores.
              </p>

              {/* Grid of options from 2 to 11 */}
              <div className="max-h-60 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                {Array.from({ length: 10 }, (_, i) => i + 2).map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleSelectPlayersPerTeam(num)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      playersPerTeam === num
                        ? "border-indigo-500 bg-indigo-500/5 dark:bg-violet-500/5 text-indigo-600 dark:text-violet-400 font-bold"
                        : `${styles.border} ${styles.dropdownItemHover} ${styles.textBold}`
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                        playersPerTeam === num
                          ? "border-indigo-500 text-indigo-500 dark:border-violet-400 dark:text-violet-400"
                          : "border-slate-300 dark:border-slate-600"
                      }`}>
                        {playersPerTeam === num && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-violet-400" />
                        )}
                      </span>
                      <span>{num} Jogadores {num === 6 && <span className="text-[10px] opacity-60 font-normal">(Padrão)</span>}</span>
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex gap-2.5 mt-6 justify-end">
                <button
                  type="button"
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer w-full"
                  onClick={() => setIsPlayersModalOpen(false)}
                >
                  Confirmar e Organizar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* END ACTIVITIES FIRST CONFIRMATION DIALOG */}
      <AnimatePresence>
        {showEndActivitiesConfirm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`rounded-2xl shadow-xl max-w-md w-full p-6 border transition-all duration-200 ${styles.cardBg} ${styles.border}`}
            >
              <div className="flex items-center gap-3 text-rose-500 mb-3">
                <div className="p-2 bg-rose-50 dark:bg-rose-950/20 rounded-xl">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className={`font-display font-bold text-lg ${styles.textBold}`}>
                  Encerrar atividades do rodízio?
                </h3>
              </div>
              <p className={`text-xs leading-relaxed ${styles.textMuted}`}>
                Aviso: Isso limpará apenas a lista de presença e esvaziará todos os times ativos e a fila de reserva. Todo o trabalho de rodízio atual será resetado e terá de ser feito novamente!
              </p>
              <div className="flex gap-2.5 mt-6 justify-end">
                <button
                  type="button"
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                  onClick={() => setShowEndActivitiesConfirm(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-750 shadow-md transition-all cursor-pointer"
                  onClick={() => {
                    setShowEndActivitiesConfirm(false);
                    setShowEndActivitiesConfirm2(true);
                  }}
                >
                  Avançar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* END ACTIVITIES SECOND CONFIRMATION DIALOG */}
      <AnimatePresence>
        {showEndActivitiesConfirm2 && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`rounded-2xl shadow-xl max-w-md w-full p-6 border transition-all duration-200 ${styles.cardBg} ${styles.border}`}
            >
              <div className="flex items-center gap-3 text-amber-500 mb-3">
                <div className="p-2 bg-amber-500/10 rounded-xl">
                  <AlertCircle className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className={`font-display font-bold text-lg ${styles.textBold}`}>
                  ⚠️ Tem certeza absoluta?
                </h3>
              </div>
              <p className={`text-xs leading-relaxed ${styles.textMuted}`}>
                Esta é a segunda confirmação. Todos os jogadores nos times A, B e reservas serão desescalados e voltarão a ficar disponíveis na lista de cadastro de jogadores.
              </p>
              <div className="flex gap-2.5 mt-6 justify-end">
                <button
                  type="button"
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                  onClick={() => {
                    setShowEndActivitiesConfirm2(false);
                    setShowEndActivitiesConfirm(true);
                  }}
                >
                  Voltar
                </button>
                <button
                  type="button"
                  className="px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md transition-all cursor-pointer"
                  onClick={handleEndActivities}
                >
                  Confirmar e Zerar Partida
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WARNING POPUP DIALOGS (Gender Imbalance & Wins Streak) */}
      <AnimatePresence>
        {(isGenderImbalanceActive || isWinsStreakActive) && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className={`rounded-3xl shadow-2xl max-w-lg w-full p-6 border transition-all duration-200 relative overflow-hidden ${styles.cardBg} ${styles.border}`}
            >
              {/* Top ambient color accent background */}
              <div className={`absolute top-0 left-0 right-0 h-2 ${
                isGenderImbalanceActive 
                  ? "bg-amber-500" 
                  : "bg-violet-600"
              }`} />

              {isGenderImbalanceActive ? (
                /* Gender Imbalance Alert Content */
                <div>
                  <div className="flex items-center gap-3.5 mb-4 text-amber-500">
                    <div className="p-2.5 bg-amber-500/10 rounded-2xl">
                      <AlertCircle className="w-7 h-7 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold tracking-wider uppercase opacity-60">
                        Equilíbrio de Gênero
                      </span>
                      <h3 className={`font-display font-black text-xl leading-none mt-0.5 ${styles.textBold}`}>
                        Desequilíbrio de Times
                      </h3>
                    </div>
                  </div>

                  <p className={`text-sm leading-relaxed mb-6 ${styles.textMuted}`}>
                    O <strong>Time A</strong> possui <span className="font-bold">{countTeamAWomen} mulheres</span> e <span className="font-bold">{countTeamAMen} homens</span>, enquanto o <strong>Time B</strong> possui <span className="font-bold">{countTeamBWomen} mulheres</span> e <span className="font-bold">{countTeamBMen} homens</span>.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <button
                      type="button"
                      className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        theme === "escuro"
                          ? "border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-850"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                      onClick={() => setDismissedGenderImbalanceKey(currentRosterKey)}
                    >
                      Manter Times Como Estão
                    </button>
                    <button
                      type="button"
                      className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        theme === "escuro"
                          ? "bg-violet-600 hover:bg-violet-750"
                          : "bg-indigo-600 hover:bg-indigo-750"
                      }`}
                      onClick={() => {
                        handleMix();
                        setDismissedGenderImbalanceKey(currentRosterKey);
                      }}
                    >
                      <Shuffle className="w-4 h-4" />
                      Misturar e Balancear Times
                    </button>
                  </div>
                </div>
              ) : (
                /* Wins Streak Alert Content */
                <div>
                  <div className="flex items-center gap-3.5 mb-4 text-violet-500">
                    <div className="p-2.5 bg-violet-500/10 rounded-2xl">
                      <Trophy className="w-7 h-7 animate-bounce" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold tracking-wider uppercase opacity-60">
                        Domínio da Arena
                      </span>
                      <h3 className={`font-display font-black text-xl leading-none mt-0.5 ${styles.textBold}`}>
                        Sequência Imparável!
                      </h3>
                    </div>
                  </div>

                  <p className={`text-sm leading-relaxed mb-6 ${styles.textMuted}`}>
                    O <strong>Time {consecutiveWinsTeam}</strong> venceu 3 partidas seguidas!
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <button
                      type="button"
                      className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        theme === "escuro"
                          ? "border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-850"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                      onClick={() => setDismissedWinsCount(consecutiveWinsCount)}
                    >
                      Manter Sequência e Jogar
                    </button>
                    <button
                      type="button"
                      className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        theme === "escuro"
                          ? "bg-violet-600 hover:bg-violet-750"
                          : "bg-indigo-600 hover:bg-indigo-750"
                      }`}
                      onClick={() => {
                        handleMix();
                        setDismissedWinsCount(consecutiveWinsCount);
                      }}
                    >
                      <Shuffle className="w-4 h-4" />
                      Misturar e Balancear Times
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* ONLINE ROOM MANAGEMENT MODAL */}
        {showRoomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setShowRoomModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
              className={`relative w-full max-w-md rounded-3xl p-6 shadow-2xl border z-50 overflow-hidden ${styles.cardBg}`}
            >
              <button
                type="button"
                onClick={() => setShowRoomModal(false)}
                className={`absolute top-4 right-4 p-2 rounded-xl border transition-colors cursor-pointer ${
                  theme === "escuro"
                    ? "bg-slate-900 border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                    : "bg-white border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700"
                }`}
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3.5 mb-5 text-indigo-500 dark:text-violet-400">
                <div className="p-2.5 bg-indigo-500/10 dark:bg-violet-500/10 rounded-2xl">
                  <Cloud className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase opacity-60">
                    Sincronização Online
                  </span>
                  <h3 className={`font-display font-black text-xl leading-none mt-0.5 ${styles.textBold}`}>
                    Conectar em Tempo Real
                  </h3>
                </div>
              </div>

              <p className={`text-xs leading-relaxed mb-5 ${styles.textMuted}`}>
                Sua lista de jogadores e escalações são salvas automaticamente online. Digite um código de sala para compartilhar com outros dispositivos, ou crie um novo código para jogar em particular com seus amigos!
              </p>

              {/* Current Room Code and Share info */}
              <div className={`p-4 rounded-2xl mb-5 flex flex-col gap-2.5 ${
                theme === "escuro" 
                  ? "bg-slate-900/60 border border-slate-800" 
                  : "bg-slate-50 border border-slate-100"
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Sala Ativa:
                  </span>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                    syncStatus === "synced" ? "text-emerald-500" : syncStatus === "syncing" ? "text-amber-500" : "text-rose-500"
                  }`}>
                    {syncStatus === "synced" ? (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Sincronizado
                      </>
                    ) : syncStatus === "syncing" ? (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping"></span>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                        Erro / Off-line
                      </>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                  <span className={`font-mono font-extrabold text-sm tracking-wider select-all ${styles.textBold}`}>
                    {roomCode}
                  </span>
                  <button
                    onClick={() => {
                      const shareUrl = window.location.origin + window.location.pathname + "?sala=" + encodeURIComponent(roomCode);
                      navigator.clipboard.writeText(shareUrl)
                        .then(() => {
                          triggerToast("Link de compartilhamento copiado!", "success");
                        })
                        .catch(() => {
                          triggerToast("Erro ao copiar link.", "error");
                        });
                    }}
                    className={`p-1.5 rounded-lg border flex items-center gap-1 text-[10px] font-bold cursor-pointer transition-colors ${
                      theme === "escuro"
                        ? "bg-slate-900 border-slate-850 hover:bg-slate-800 text-slate-300"
                        : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                    title="Copiar link de compartilhamento"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Link</span>
                  </button>
                </div>
              </div>

              {/* Change Room Code Form */}
              <div className="space-y-3.5">
                <div>
                  <label className={`block text-[10px] font-extrabold uppercase tracking-wider mb-1.5 ${styles.textBold}`}>
                    Entrar em Outra Sala
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: futebol-quarta"
                      value={tempRoomCode}
                      onChange={(e) => setTempRoomCode(e.target.value.trim().toLowerCase().replace(/[^a-z0-9-_]/g, ""))}
                      maxLength={20}
                      className={`flex-1 py-2 px-3.5 rounded-xl text-xs font-semibold border focus:outline-hidden transition-all ${
                        theme === "escuro"
                          ? "bg-slate-950 border-slate-800 text-slate-200 focus:border-violet-500"
                          : "bg-white border-slate-250 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const randomCode = Math.random().toString(36).substring(2, 8).toLowerCase();
                        setTempRoomCode(randomCode);
                      }}
                      className={`px-3 py-2 rounded-xl border text-[11px] font-extrabold transition-colors cursor-pointer ${
                        theme === "escuro"
                          ? "bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-300"
                          : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                      }`}
                      title="Gerar código de sala aleatório"
                    >
                      Aleatório
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowRoomModal(false)}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      theme === "escuro"
                        ? "border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-850"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={!tempRoomCode || tempRoomCode === roomCode}
                    onClick={() => {
                      if (tempRoomCode) {
                        setRoomCode(tempRoomCode);
                        setShowRoomModal(false);
                        triggerToast(`Conectando à sala: ${tempRoomCode}`, "info");
                      }
                    }}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none ${
                      theme === "escuro"
                        ? "bg-violet-600 hover:bg-violet-750"
                        : "bg-indigo-600 hover:bg-indigo-750"
                    }`}
                  >
                    Entrar na Sala
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE PRESENCE LIST CONFIRMATION DIALOG */}
      <AnimatePresence>
        {presenceListToDelete && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[60] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`rounded-2xl shadow-xl max-w-md w-full p-6 border transition-all duration-200 ${styles.cardBg} ${styles.border}`}
            >
              <div className="flex items-center gap-3 text-rose-600 mb-3">
                <div className="p-2 bg-rose-50 dark:bg-rose-950/20 rounded-xl">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className={`font-display font-bold text-lg ${styles.textBold}`}>
                  Excluir Lista de Presença?
                </h3>
              </div>
              <p className={`text-xs leading-relaxed ${styles.textMuted}`}>
                Você está prestes a excluir permanentemente a lista de presença do dia{" "}
                <strong className="text-rose-600 font-bold">{presenceListToDelete.dateString}</strong>. Isso removerá esta data do histórico e recalculará o score de presença de todos os jogadores. Esta ação não poderá ser desfeita.
              </p>
              <div className="flex gap-2.5 mt-6 justify-end">
                <button
                  type="button"
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                  onClick={() => setPresenceListToDelete(null)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md transition-all cursor-pointer"
                  onClick={() => handleDeletePresenceList(presenceListToDelete.dateString)}
                >
                  Confirmar Exclusão
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TOAST NOTIFICATION CONTAINER */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none max-w-sm w-full">
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className={`p-4 rounded-xl shadow-lg border text-xs font-semibold flex items-start gap-3 pointer-events-auto bg-white ${
                notification.type === "success"
                  ? "border-emerald-100 text-emerald-800 bg-emerald-50/90 dark:bg-slate-900 dark:border-emerald-900 dark:text-emerald-300"
                  : notification.type === "error"
                  ? "border-rose-100 text-rose-800 bg-rose-50/90 dark:bg-slate-900 dark:border-rose-900 dark:text-rose-300"
                  : "border-sky-100 text-sky-800 bg-sky-50/90 dark:bg-slate-900 dark:border-sky-900 dark:text-sky-300"
              }`}
            >
              <div
                className={`p-1 rounded-lg shrink-0 ${
                  notification.type === "success"
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                    : notification.type === "error"
                    ? "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400"
                    : "bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400"
                }`}
              >
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="flex-1 pt-0.5">{notification.text}</div>
              <button
                onClick={() => setNotification(null)}
                className="text-slate-450 hover:text-slate-650 cursor-pointer pt-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Sub-Component: Individual Player Card
interface PlayerCardProps {
  key?: string;
  player: Player;
  slotIndex: number;
  onDelete: () => void;
  onEdit: () => void;
  accentColor: "indigo" | "teal" | "amber";
  isReserve?: boolean;
  onSwap?: () => void;
  isSwappingSelected?: boolean;
  isSwappingModeActive?: boolean;
  theme?: "claro" | "escuro";

  // Drag props
  listType: "A" | "B" | "Res";
  activeDragId: string | null;
  setActiveDragId: (id: string | null) => void;
  onDragMove: (draggedId: string, targetId: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;

  // Lock props
  isUnlocked: boolean;
  onToggleLock: () => void;
}

function PlayerCard({
  player,
  slotIndex,
  onDelete,
  onEdit,
  accentColor,
  isReserve = false,
  onSwap,
  isSwappingSelected = false,
  isSwappingModeActive = false,
  theme = "claro",
  listType,
  activeDragId,
  setActiveDragId,
  onDragMove,
  onDragStart,
  onDragEnd,
  isUnlocked,
  onToggleLock,
}: PlayerCardProps) {
  const isMale = player.gender === Gender.MALE;
  const touchTimeoutRef = React.useRef<any>(null);

  React.useEffect(() => {
    return () => {
      if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isUnlocked) return; // Disallow manual reordering if locked
    const target = e.target as HTMLElement;
    if (target.closest("button")) return;

    if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
    
    // Inicia instantaneamente para o cartão inteiro para maior fluidez
    onDragStart(player.id);
  };

  const handleTouchEnd = () => {
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }
    if (activeDragId === player.id) {
      onDragEnd();
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (activeDragId !== player.id) return;

    if (e.cancelable) {
      e.preventDefault();
    }

    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!element) return;
    const card = element.closest("[data-player-id]");
    if (card) {
      const targetId = card.getAttribute("data-player-id");
      const targetList = card.getAttribute("data-list-type");
      if (targetId && targetId !== player.id && targetList === listType) {
        onDragMove(player.id, targetId);
      }
    }
  };

  const cardStyles = {
    claro: {
      bg: isSwappingSelected 
        ? "bg-indigo-50 border-indigo-400 ring-2 ring-indigo-400/20"
        : "bg-white border-slate-100",
      text: "text-slate-900",
      textSub: "text-slate-500",
      buttonHover: "hover:bg-slate-50",
      badgeMale: "bg-sky-50 text-sky-700 border border-sky-100/50",
      badgeFemale: "bg-rose-50 text-rose-700 border border-rose-100/50",
      badgeHierarchy: isReserve 
        ? "bg-slate-100 text-slate-500" 
        : accentColor === "indigo" 
        ? "bg-indigo-50 text-indigo-700" 
        : "bg-teal-50 text-teal-700",
    },
    escuro: {
      bg: isSwappingSelected
        ? "bg-violet-950/60 border-violet-500 ring-2 ring-violet-500/30"
        : "bg-slate-900 border-slate-800/80",
      text: "text-white",
      textSub: "text-slate-400",
      buttonHover: "hover:bg-slate-800",
      badgeMale: "bg-sky-950/50 text-sky-300 border border-sky-900/50",
      badgeFemale: "bg-rose-950/50 text-rose-300 border border-rose-900/50",
      badgeHierarchy: isReserve 
        ? "bg-slate-800 text-slate-400" 
        : accentColor === "indigo" 
        ? "bg-violet-900/40 text-violet-300 border border-violet-800/50" 
        : "bg-emerald-900/40 text-emerald-300 border border-emerald-800/50",
    },
  };

  const curCard = cardStyles[theme || "claro"];

  return (
    <motion.div
      layoutId={player.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      className={`border rounded-xl p-3 flex items-center justify-between shadow-xs transition-all duration-200 ${curCard.bg} ${
        player.id === activeDragId
          ? "scale-[1.02] border-amber-400 dark:border-amber-500 shadow-md ring-2 ring-amber-450/20 bg-slate-50 dark:bg-slate-850 pointer-events-none touch-none"
          : "hover:border-slate-300/80 dark:hover:border-slate-700"
      }`}
      draggable={isUnlocked}
      data-player-id={player.id}
      data-list-type={listType}
      onDragStart={(e) => {
        if (!isUnlocked) {
          e.preventDefault();
          return;
        }
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", player.id);
        onDragStart(player.id);
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        e.preventDefault();
        if (activeDragId && activeDragId !== player.id) {
          onDragMove(activeDragId, player.id);
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Drag vertical grip handle */}
        <div 
          className={`drag-grip shrink-0 select-none touch-none ${
            !isUnlocked 
              ? "text-slate-200 dark:text-slate-800 opacity-45 cursor-not-allowed pointer-events-none" 
              : player.id === activeDragId 
              ? "text-amber-500 dark:text-amber-400 animate-pulse cursor-grab active:cursor-grabbing" 
              : "text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 cursor-grab active:cursor-grabbing"
          }`}
          title={isUnlocked ? "Toque e segure para reordenar" : "Cadeado trancado: clique no cadeado ao lado do nome para liberar a movimentação"}
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Hierarchy Number Badge */}
        <span
          className={`font-mono text-xs font-bold px-2 py-1 rounded-lg shrink-0 min-w-[28px] text-center ${curCard.badgeHierarchy}`}
          title={`Valor Hierárquico #${player.hierarchyValue}`}
        >
          #{player.hierarchyValue}
        </span>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className={`font-semibold text-sm truncate leading-snug ${curCard.text}`}>
              {player.name}
            </p>
            <button
              type="button"
              onClick={onToggleLock}
              title={isUnlocked ? "Trancar posição" : "Destrancar posição para reordenar manual"}
              className={`p-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                isUnlocked
                  ? "text-amber-500 hover:text-amber-600 bg-amber-500/10"
                  : "text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {isUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                isMale ? curCard.badgeMale : curCard.badgeFemale
              }`}
            >
              <User className="w-3 h-3" />
              {player.gender}
            </span>
            {player.isGuest && (
              <span className="inline-flex items-center text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-955 dark:text-amber-300 font-bold px-1.5 py-0.5 rounded-md">
                Convidado
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 ml-2">
        {onSwap && (
          <button
            type="button"
            onClick={onSwap}
            title={isSwappingSelected ? "Cancelar troca" : "Trocar jogador"}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              isSwappingSelected
                ? "text-amber-500 bg-amber-500/10"
                : isSwappingModeActive
                ? "text-indigo-500 bg-indigo-500/10 animate-pulse"
                : `text-slate-400 hover:text-indigo-500 ${curCard.buttonHover}`
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={onEdit}
          title="Editar Nome/Gênero"
          className={`text-slate-400 hover:text-indigo-500 p-1.5 rounded-lg transition-colors cursor-pointer ${curCard.buttonHover}`}
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          title={isReserve ? "Remover da reserva" : "Remover e colocar reserva no topo"}
          className={`text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors cursor-pointer ${curCard.buttonHover}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

// Sub-Component: Unfilled slots when team has 0 players
function EmptySlot({ teamName, slotsCount }: { teamName: string; slotsCount: number }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 border border-dashed border-slate-200/80 rounded-xl h-full min-h-[340px]">
      <Users className="w-10 h-10 text-slate-300 mb-2" />
      <p className="text-xs font-semibold">Time {teamName} sem jogadores</p>
      <p className="text-[10px] text-slate-400 max-w-[180px] mt-1 mx-auto leading-relaxed">
        Cadastre jogadores ao lado para preencher as {slotsCount} vagas do time.
      </p>
    </div>
  );
}

// Sub-Component: Placeholder counts for incomplete teams
function EmptyPlaceholderCount({ count, label }: { count: number; label: string }) {
  return (
    <div className="border border-dashed border-slate-100 rounded-xl p-3.5 flex items-center justify-center text-[11px] font-bold text-slate-400 bg-slate-50/40">
      {count} {label}
    </div>
  );
}
