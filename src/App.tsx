/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Trash2,
  Edit2,
  Shuffle,
  Trophy,
  Users,
  User,
  Sparkles,
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
  Lock,
  Unlock,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  GripVertical,
} from "lucide-react";
import { Player, Gender, reassignHierarchyValues, mixTeams } from "./types";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db, saveStateToFirestore } from "./firebase";

// Design Palette configurations for Claro, Escuro, and Pastel themes
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
  pastel: {
    bg: "bg-[#FCFAF2] text-[#4E3F30]",
    headerBg: "bg-[#F3EBE0] border-[#E8DEC9]",
    headerTitle: "text-[#3D2F20]",
    headerSub: "text-[#80705E]",
    cardBg: "bg-[#FCFAF5] border-[#E8DFCF] shadow-xs",
    cardTitle: "text-[#3D2F20]",
    cardSub: "text-[#80705E]",
    inputBg: "bg-white border-[#DCD0C0] text-[#3D2F20] placeholder-[#B5A898] focus:border-[#C0A890]",
    tabActive: "bg-white text-[#3D2F20] shadow-xs border border-[#E8DEC9]",
    tabInactive: "text-[#80705E] hover:text-[#3D2F20]",
    tabContainer: "bg-[#F3EBE0] border-[#E8DEC9]",
    textMuted: "text-[#80705E]",
    textBold: "text-[#3D2F20]",
    border: "border-[#E8DFCF]",
    divider: "border-[#E8DFCF]",
    accentBg: "bg-[#8A6F53] text-[#FDFCFB]",
    accentHover: "hover:bg-[#785E44]",
    accentText: "text-[#8A6F53]",
    teamABg: "bg-[#8E7E70]",
    teamAActions: "bg-[#796A5C] text-[#FDFCFB] border-[#9E8E80]/30",
    teamBBg: "bg-[#A3B19B]",
    teamBActions: "bg-[#8A9981] text-[#FDFCFB] border-[#B8C7B0]/30",
    reserveBg: "bg-[#D8B690]",
    reserveText: "text-[#78542F]",
    playerCard: "bg-white border-[#E8DFCF]",
    playerCardHover: "hover:border-[#C8BFAF] hover:bg-[#F9F6F0]",
    dropdownBg: "bg-[#FCFAF5] border-[#DCD0C0] shadow-md text-[#3D2F20]",
    dropdownItemHover: "hover:bg-[#F3EBE0] text-[#3D2F20] hover:text-[#281E15]",
    rulesBg: "bg-[#FAF5ED] border border-[#E8DEC9] text-[#4E3F30]",
    rulesTitle: "text-[#3D2F20]",
    rulesText: "text-[#5C4C3E]",
    rulesStrong: "text-[#281E15]",
  },
};

export default function App() {
  // State for Teams and Reserves
  const [teamA, setTeamA] = useState<Player[]>(() => {
    const saved = localStorage.getItem("rodizio_teamA");
    return saved ? JSON.parse(saved) : [];
  });
  const [teamB, setTeamB] = useState<Player[]>(() => {
    const saved = localStorage.getItem("rodizio_teamB");
    return saved ? JSON.parse(saved) : [];
  });
  const [reserves, setReserves] = useState<Player[]>(() => {
    const saved = localStorage.getItem("rodizio_reserves");
    return saved ? JSON.parse(saved) : [];
  });

  // State for Persistent Database (Aba de Cadastro/Roster)
  const [registeredPlayers, setRegisteredPlayers] = useState<Player[]>(() => {
    const saved = localStorage.getItem("rodizio_registered");
    return saved ? JSON.parse(saved) : [];
  });

  // State for Undo History
  const [history, setHistory] = useState<{ teamA: Player[]; teamB: Player[]; reserves: Player[] }[]>([]);

  // Tab navigation inside panel: 'cadastro' or 'acoes' (Controle & Partida is default as requested!)
  const [activeTab, setActiveTab] = useState<"cadastro" | "acoes">("acoes");

  // Visual Theme option state ('claro' | 'escuro' | 'pastel')
  const [theme, setTheme] = useState<"claro" | "escuro" | "pastel">((() => {
    const saved = localStorage.getItem("rodizio_theme");
    return (saved === "claro" || saved === "escuro" || saved === "pastel") ? saved : "claro";
  })());
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  // State for Alternating Order
  const [alternatingOrder, setAlternatingOrder] = useState<boolean>(() => {
    const saved = localStorage.getItem("rodizio_alternatingOrder");
    return saved === "true";
  });

  // State for Swap Order Mode (A or B)
  const [swapOrderMode, setSwapOrderMode] = useState<"A" | "B">((() => {
    const saved = localStorage.getItem("rodizio_swapOrderMode");
    return (saved === "A" || saved === "B") ? saved : "B";
  })());

  // States for win streaks
  const [consecutiveWinsTeam, setConsecutiveWinsTeam] = useState<"A" | "B" | null>(() => {
    const saved = localStorage.getItem("rodizio_consecutiveWinsTeam");
    return (saved === "A" || saved === "B") ? saved : null;
  });
  const [consecutiveWinsCount, setConsecutiveWinsCount] = useState<number>(() => {
    const saved = localStorage.getItem("rodizio_consecutiveWinsCount");
    return saved ? parseInt(saved, 10) : 0;
  });

  // States to control warning modals
  const [showConsecutiveWinsModal, setShowConsecutiveWinsModal] = useState(false);
  const [showGenderImbalanceModal, setShowGenderImbalanceModal] = useState(false);
  const [imbalanceModalData, setImbalanceModalData] = useState<{ teamName: string; otherTeamName: string; diff: number; moreGender: string } | null>(null);

  // Hash-based exclusion for gender warning to prevent duplicate alerts
  const [lastWarnedRostersHash, setLastWarnedRostersHash] = useState<string>(() => {
    return localStorage.getItem("rodizio_lastWarnedRostersHash") || "";
  });

  // Helper to reset win streak on manual alterations
  const resetWinStreak = () => {
    setConsecutiveWinsTeam(null);
    setConsecutiveWinsCount(0);
  };

  // Swapping mode state
  const [swappingPlayerId, setSwappingPlayerId] = useState<string | null>(null);

  // Manual reorder lock state (holds list of unlocked player IDs)
  const [unlockedPlayerIds, setUnlockedPlayerIds] = useState<string[]>([]);

  // Dragged player state for fluid live reordering
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
  const [draggedGroup, setDraggedGroup] = useState<"A" | "B" | "reserves" | null>(null);

  const togglePlayerUnlock = (id: string) => {
    setUnlockedPlayerIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((pId) => pId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // End Activities dual confirmation modals
  const [showEndActivitiesConfirm, setShowEndActivitiesConfirm] = useState(false);

  // Search query for registered players
  const [searchQuery, setSearchQuery] = useState("");

  // State for Registration Form
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerGender, setNewPlayerGender] = useState<Gender>(Gender.MALE);

  // State for Editing Player
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // Notifications / Toast
  const [notification, setNotification] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Custom confirmation modal
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Synchronization control refs to prevent infinite database update loops
  const hasLoadedFromFirebaseRef = React.useRef(false);
  const incomingUpdateRef = React.useRef(false);

  // Real-time synchronization with Firebase Firestore
  useEffect(() => {
    const docRef = doc(db, "appState", "global");
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        incomingUpdateRef.current = true;

        if (data.teamA !== undefined) setTeamA(data.teamA);
        if (data.teamB !== undefined) setTeamB(data.teamB);
        if (data.reserves !== undefined) setReserves(data.reserves);
        if (data.registeredPlayers !== undefined) setRegisteredPlayers(data.registeredPlayers);
        if (data.theme !== undefined && (data.theme === "claro" || data.theme === "escuro" || data.theme === "pastel")) {
          setTheme(data.theme);
        }
        if (data.history !== undefined) setHistory(data.history);
        if (data.alternatingOrder !== undefined) setAlternatingOrder(data.alternatingOrder);
        if (data.swapOrderMode !== undefined && (data.swapOrderMode === "A" || data.swapOrderMode === "B")) {
          setSwapOrderMode(data.swapOrderMode);
        }
        if (data.consecutiveWinsTeam !== undefined) setConsecutiveWinsTeam(data.consecutiveWinsTeam);
        if (data.consecutiveWinsCount !== undefined) setConsecutiveWinsCount(data.consecutiveWinsCount);
        if (data.lastWarnedRostersHash !== undefined) setLastWarnedRostersHash(data.lastWarnedRostersHash);

        hasLoadedFromFirebaseRef.current = true;
        setTimeout(() => {
          incomingUpdateRef.current = false;
        }, 0);
      } else {
        // Document does not exist in Cloud Firestore yet, let's write current local state
        hasLoadedFromFirebaseRef.current = true;
        const initialDoc = {
          teamA,
          teamB,
          reserves,
          registeredPlayers,
          theme,
          history,
          alternatingOrder,
          swapOrderMode,
          consecutiveWinsTeam,
          consecutiveWinsCount,
          lastWarnedRostersHash
        };
        setDoc(docRef, initialDoc).catch((err) => console.error("Erro ao inicializar Firebase:", err));
      }
    }, (error) => {
      console.error("Erro ao sincronizar com o Firebase:", error);
    });

    return () => unsubscribe();
  }, []);

  // Upload changes to Firebase Firestore when state changes locally
  useEffect(() => {
    if (!hasLoadedFromFirebaseRef.current) return;
    if (incomingUpdateRef.current) return;

    saveStateToFirestore({
      teamA,
      teamB,
      reserves,
      registeredPlayers,
      theme,
      history,
      alternatingOrder,
      swapOrderMode,
      consecutiveWinsTeam,
      consecutiveWinsCount,
      lastWarnedRostersHash
    });
  }, [
    teamA,
    teamB,
    reserves,
    registeredPlayers,
    theme,
    history,
    alternatingOrder,
    swapOrderMode,
    consecutiveWinsTeam,
    consecutiveWinsCount,
    lastWarnedRostersHash
  ]);

  // Save active rosters to LocalStorage whenever they change
  useEffect(() => {
    localStorage.setItem("rodizio_teamA", JSON.stringify(teamA));
    localStorage.setItem("rodizio_teamB", JSON.stringify(teamB));
    localStorage.setItem("rodizio_reserves", JSON.stringify(reserves));
  }, [teamA, teamB, reserves]);

  // Save registered database to LocalStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("rodizio_registered", JSON.stringify(registeredPlayers));
  }, [registeredPlayers]);

  // Save theme selection to LocalStorage
  useEffect(() => {
    localStorage.setItem("rodizio_theme", theme);
  }, [theme]);

  // Save alternatingOrder selection to LocalStorage
  useEffect(() => {
    localStorage.setItem("rodizio_alternatingOrder", String(alternatingOrder));
  }, [alternatingOrder]);

  // Save swapOrderMode selection to LocalStorage
  useEffect(() => {
    localStorage.setItem("rodizio_swapOrderMode", swapOrderMode);
  }, [swapOrderMode]);

  // Save consecutive win streaks to LocalStorage
  useEffect(() => {
    localStorage.setItem("rodizio_consecutiveWinsTeam", consecutiveWinsTeam || "");
    localStorage.setItem("rodizio_consecutiveWinsCount", String(consecutiveWinsCount));
  }, [consecutiveWinsTeam, consecutiveWinsCount]);

  // Save lastWarnedRostersHash to LocalStorage
  useEffect(() => {
    localStorage.setItem("rodizio_lastWarnedRostersHash", lastWarnedRostersHash);
  }, [lastWarnedRostersHash]);

  // Automated gender balance checking effect (only for complete 6-player teams)
  useEffect(() => {
    if (teamA.length !== 6 || teamB.length !== 6) return;

    const menA = teamA.filter((p) => p.gender === Gender.MALE).length;
    const menB = teamB.filter((p) => p.gender === Gender.MALE).length;
    const diff = Math.abs(menA - menB);

    const currentHash = teamA.map((p) => p.id).sort().join(",") + "|" + teamB.map((p) => p.id).sort().join(",");

    if (diff >= 2) {
      if (currentHash !== lastWarnedRostersHash) {
        const teamName = menA > menB ? "Time A" : "Time B";
        const otherTeamName = menA > menB ? "Time B" : "Time A";
        setImbalanceModalData({
          teamName,
          otherTeamName,
          diff,
          moreGender: "homens"
        });
        setShowGenderImbalanceModal(true);
      }
    }
  }, [teamA, teamB, lastWarnedRostersHash]);

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
  const pushToHistory = (currA = teamA, currB = teamB, currRes = reserves) => {
    const stateCopy = {
      teamA: JSON.parse(JSON.stringify(currA)),
      teamB: JSON.parse(JSON.stringify(currB)),
      reserves: JSON.parse(JSON.stringify(currRes)),
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
    setHistory(newHistory);
    resetWinStreak();

    triggerToast("Ação anterior desfeita com sucesso!", "success");
  };

  // Swap two active players' positions while maintaining the slot hierarchy order
  const handleSwapPlayers = (id1: string, id2: string) => {
    pushToHistory();
    resetWinStreak();

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

    // Swap elements in arrays
    arr1[p1Loc.index] = p2;
    arr2[p2Loc.index] = p1;

    // Sort arrays by their hierarchyValue so they auto-reorganize correctly
    updatedA.sort((a, b) => a.hierarchyValue - b.hierarchyValue);
    updatedB.sort((a, b) => a.hierarchyValue - b.hierarchyValue);
    updatedReserves.sort((a, b) => a.hierarchyValue - b.hierarchyValue);

    setTeamA(updatedA);
    setTeamB(updatedB);
    setReserves(updatedReserves);

    setSwappingPlayerId(null);
    setUnlockedPlayerIds([]);
    triggerToast(`Troca efetuada entre "${p1.name}" e "${p2.name}"!`, "success");
  };

  // Manual reordering of players
  const handleManualMovePlayer = (
    groupId: "A" | "B" | "reserves",
    action: "top" | "up" | "down" | "bottom" | "drag",
    playerId: string,
    targetPlayerId?: string
  ) => {
    pushToHistory();
    resetWinStreak();

    let listToModify: Player[] = [];
    if (groupId === "A") listToModify = [...teamA];
    else if (groupId === "B") listToModify = [...teamB];
    else listToModify = [...reserves];

    const originalIndex = listToModify.findIndex((p) => p.id === playerId);
    if (originalIndex === -1) return;

    const [playerToMove] = listToModify.splice(originalIndex, 1);

    if (action === "top") {
      listToModify.unshift(playerToMove);
    } else if (action === "bottom") {
      listToModify.push(playerToMove);
    } else if (action === "up") {
      const newIndex = Math.max(0, originalIndex - 1);
      listToModify.splice(newIndex, 0, playerToMove);
    } else if (action === "down") {
      const newIndex = Math.min(listToModify.length, originalIndex + 1);
      listToModify.splice(newIndex, 0, playerToMove);
    } else if (action === "drag" && targetPlayerId) {
      const targetIndex = listToModify.findIndex((p) => p.id === targetPlayerId);
      if (targetIndex !== -1) {
        listToModify.splice(targetIndex, 0, playerToMove);
      } else {
        listToModify.splice(originalIndex, 0, playerToMove);
      }
    }

    // Now reassign hierarchy values for everything using types.ts helper
    let updatedA = groupId === "A" ? listToModify : [...teamA];
    let updatedB = groupId === "B" ? listToModify : [...teamB];
    let updatedReserves = groupId === "reserves" ? listToModify : [...reserves];

    const reassigned = reassignHierarchyValues(updatedA, updatedB, updatedReserves, swapOrderMode, consecutiveWinsTeam);

    setTeamA(reassigned.teamA);
    setTeamB(reassigned.teamB);
    setReserves(reassigned.reserves);

    triggerToast(`Posição de "${playerToMove.name}" ajustada manualmente!`, "success");
  };

  // Drag and drop handlers with fluid live reordering (Photoshop-like)
  const handleDragStart = (e: React.DragEvent, id: string, group: "A" | "B" | "reserves") => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.setData("group", group);
    setDraggedPlayerId(id);
    setDraggedGroup(group);

    // Push state to history once on drag start and reset win streak
    pushToHistory();
    resetWinStreak();
  };

  const handleDragOverCard = (e: React.DragEvent, targetId: string, group: "A" | "B" | "reserves") => {
    e.preventDefault();
    if (!draggedPlayerId || draggedGroup !== group || draggedPlayerId === targetId) {
      return;
    }

    // Live fluid reordering: shift players as soon as we drag over them
    let listToModify: Player[] = [];
    if (group === "A") listToModify = [...teamA];
    else if (group === "B") listToModify = [...teamB];
    else listToModify = [...reserves];

    const originalIndex = listToModify.findIndex((p) => p.id === draggedPlayerId);
    const targetIndex = listToModify.findIndex((p) => p.id === targetId);

    if (originalIndex === -1 || targetIndex === -1) return;

    const [playerToMove] = listToModify.splice(originalIndex, 1);
    listToModify.splice(targetIndex, 0, playerToMove);

    let updatedA = group === "A" ? listToModify : [...teamA];
    let updatedB = group === "B" ? listToModify : [...teamB];
    let updatedReserves = group === "reserves" ? listToModify : [...reserves];

    const reassigned = reassignHierarchyValues(updatedA, updatedB, updatedReserves, swapOrderMode, consecutiveWinsTeam);

    setTeamA(reassigned.teamA);
    setTeamB(reassigned.teamB);
    setReserves(reassigned.reserves);
  };

  const handleDragOver = (e: React.DragEvent, group: "A" | "B" | "reserves") => {
    e.preventDefault();
  };

  const handleDragEnd = () => {
    setDraggedPlayerId(null);
    setDraggedGroup(null);
  };

  const handleDropPlayer = (e: React.DragEvent, targetId: string, targetGroup: "A" | "B" | "reserves") => {
    e.preventDefault();
    setDraggedPlayerId(null);
    setDraggedGroup(null);
  };

  // Reset only the active play lists (Teams A, B, and reserves) with confirmation
  const handleEndActivities = () => {
    setTeamA([]);
    setTeamB([]);
    setReserves([]);
    setHistory([]);
    resetWinStreak();
    setSwappingPlayerId(null);
    setShowEndActivitiesConfirm(false);
    triggerToast("Atividades encerradas. Os times e reservas foram limpos.", "info");
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
    };

    const updatedRegistered = [...registeredPlayers, newPlayer].sort((a, b) =>
      a.name.localeCompare(b.name, "pt", { sensitivity: "base" })
    );

    setRegisteredPlayers(updatedRegistered);
    setNewPlayerName("");
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
    resetWinStreak();

    let updatedA = [...teamA];
    let updatedB = [...teamB];
    let updatedReserves = [...reserves];

    if (alternatingOrder) {
      // 12 first players are distributed alternatingly between A and B
      if (updatedA.length + updatedB.length < 12) {
        if (updatedA.length <= updatedB.length) {
          updatedA.push({ ...player });
          triggerToast(`"${player.name}" escalado no Time A (Alternado).`, "success");
        } else {
          updatedB.push({ ...player });
          triggerToast(`"${player.name}" escalado no Time B (Alternado).`, "success");
        }
      } else {
        updatedReserves.push({ ...player });
        triggerToast(`"${player.name}" adicionado à fila de reserva.`, "success");
      }
    } else {
      // Distribute according to space (Fill A, then B, then Reserves)
      if (updatedA.length < 6) {
        updatedA.push({ ...player });
        triggerToast(`"${player.name}" escalado no Time A.`, "success");
      } else if (updatedB.length < 6) {
        updatedB.push({ ...player });
        triggerToast(`"${player.name}" escalado no Time B.`, "success");
      } else {
        updatedReserves.push({ ...player });
        triggerToast(`"${player.name}" adicionado à fila de reserva.`, "success");
      }
    }

    // Recalculate and reassign hierarchy values
    const updated = reassignHierarchyValues(updatedA, updatedB, updatedReserves, swapOrderMode, consecutiveWinsTeam);
    setTeamA(updated.teamA);
    setTeamB(updated.teamB);
    setReserves(updated.reserves);
  };

  // Remove player from active play but KEEP in database
  const handleRemoveFromActive = (id: string, name: string) => {
    pushToHistory();
    resetWinStreak();

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

    const updated = reassignHierarchyValues(updatedA, updatedB, updatedReserves, swapOrderMode, consecutiveWinsTeam);
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
      resetWinStreak();
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

    const updated = reassignHierarchyValues(updatedA, updatedB, updatedReserves, swapOrderMode, consecutiveWinsTeam);
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
      prev.map((p) => (p.id === editingPlayer.id ? { ...p, name: nameTrimmed, gender: editingPlayer.gender } : p))
    );

    // Update active lists while preserving hierarchy value
    setTeamA((prev) => prev.map((p) => (p.id === editingPlayer.id ? { ...p, name: nameTrimmed, gender: editingPlayer.gender } : p)));
    setTeamB((prev) => prev.map((p) => (p.id === editingPlayer.id ? { ...p, name: nameTrimmed, gender: editingPlayer.gender } : p)));
    setReserves((prev) => prev.map((p) => (p.id === editingPlayer.id ? { ...p, name: nameTrimmed, gender: editingPlayer.gender } : p)));

    setEditingPlayer(null);
    triggerToast("Cadastro do jogador atualizado com sucesso!", "success");
  };

  // Handle game finished and rotation
  const handleGameWinner = (winner: "A" | "B") => {
    if (teamA.length < 6 || teamB.length < 6) {
      triggerToast(
        "A partida só pode terminar se ambos os times estiverem completos com 6 jogadores.",
        "error"
      );
      return;
    }

    // Save history before modifying rosters
    pushToHistory();

    const losingTeam = winner === "A" ? teamB : teamA;
    const winningTeam = winner === "A" ? teamA : teamB;

    let newLosingTeam: Player[] = [];
    let newReserves: Player[] = [];

    const R = reserves.length;

    if (R >= 6) {
      // 6 first reserves enter the losing team
      const promoted = reserves.slice(0, 6);
      const remainingReserves = reserves.slice(6);
      newLosingTeam = promoted;
      // All 6 losers go to the end of the reserves list in registration order
      newReserves = [...remainingReserves, ...losingTeam];
    } else {
      // Less than 6 reserves: they enter at the top, last R losers are displaced
      const promoted = reserves; // all of them (size R)
      const keptCount = 6 - R;
      const keptFromL = losingTeam.slice(0, keptCount);
      const displacedFromL = losingTeam.slice(keptCount);

      newLosingTeam = [...promoted, ...keptFromL];
      newReserves = displacedFromL;
    }

    // Set updated teams based on who won
    const finalA = winner === "A" ? winningTeam : newLosingTeam;
    const finalB = winner === "B" ? winningTeam : newLosingTeam;

    // Reset hierarchy values
    const updated = reassignHierarchyValues(finalA, finalB, newReserves, swapOrderMode, winner);

    setTeamA(updated.teamA);
    setTeamB(updated.teamB);
    setReserves(updated.reserves);

    // Track consecutive wins
    let nextWinsCount = 1;
    let nextWinsTeam = winner;
    if (consecutiveWinsTeam === winner) {
      nextWinsCount = consecutiveWinsCount + 1;
    }
    setConsecutiveWinsTeam(nextWinsTeam);
    setConsecutiveWinsCount(nextWinsCount);

    if (nextWinsCount >= 3) {
      setShowConsecutiveWinsModal(true);
    }

    triggerToast(
      `Fim de jogo! Time ${winner} venceu. O time perdedor foi deslocado para a reserva.`,
      "success"
    );
  };

  // Trigger Team Mixing (Embaralhar com equilíbrio)
  const handleMix = () => {
    if (teamA.length !== 6 || teamB.length !== 6) {
      triggerToast(
        "Para misturar, ambos os times precisam estar completos com exatamente 6 jogadores cada.",
        "error"
      );
      return;
    }

    const mixed = mixTeams(teamA, teamB);
    if (mixed) {
      // Save history before modifying rosters
      pushToHistory();
      resetWinStreak();

      setTeamA(mixed.teamA);
      setTeamB(mixed.teamB);
      setUnlockedPlayerIds([]);
      triggerToast(
        "Times reorganizados aleatoriamente respeitando equilíbrio de gênero e ordem hierárquica!",
        "success"
      );
    } else {
      triggerToast("Erro ao tentar misturar os times.", "error");
    }
  };

  // Seed 14 typical players into registered database
  const handleSeedDemoPlayers = () => {
    const testPlayers = [
      { name: "Carlos Silva", gender: Gender.MALE },
      { name: "Ana Souza", gender: Gender.FEMALE },
      { name: "Bruno Oliveira", gender: Gender.MALE },
      { name: "Beatriz Lima", gender: Gender.FEMALE },
      { name: "Daniel Costa", gender: Gender.MALE },
      { name: "Camila Rocha", gender: Gender.FEMALE },
      { name: "Eduardo Santos", gender: Gender.MALE },
      { name: "Debora Alves", gender: Gender.FEMALE },
      { name: "Felipe Pereira", gender: Gender.MALE },
      { name: "Elaine Martins", gender: Gender.FEMALE },
      { name: "Gustavo Ferreira", gender: Gender.MALE },
      { name: "Fernanda Dias", gender: Gender.FEMALE },
      { name: "Hugo Rezende", gender: Gender.MALE },
      { name: "Gisele Nunes", gender: Gender.FEMALE },
    ];

    const seeded: Player[] = testPlayers.map((tp, i) => ({
      id: `seed-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: tp.name,
      gender: tp.gender,
      hierarchyValue: 0,
    }));

    // Merge without duplicates and sort alphabetically
    const updatedRegistered = [...registeredPlayers];
    seeded.forEach((sp) => {
      if (!updatedRegistered.some((p) => p.name.toLowerCase() === sp.name.toLowerCase())) {
        updatedRegistered.push(sp);
      }
    });

    updatedRegistered.sort((a, b) =>
      a.name.localeCompare(b.name, "pt", { sensitivity: "base" })
    );

    setRegisteredPlayers(updatedRegistered);
    triggerToast("Lista de cadastro preenchida com 14 jogadores de teste!", "success");
  };

  // Reset entire state
  const handleClearAll = () => {
    setTeamA([]);
    setTeamB([]);
    setReserves([]);
    setRegisteredPlayers([]);
    setHistory([]);
    resetWinStreak();
    setShowClearConfirm(false);
    triggerToast("Todo o cadastro de jogadores e times foi limpo.", "info");
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
  const styles = themeStyles[theme];

  return (
    <div className={`min-h-screen pb-16 transition-all duration-300 ${styles.bg}`}>
      {/* Header */}
      <header className={`border-b py-5 px-4 sticky top-0 z-30 shadow-xs transition-colors duration-200 ${styles.headerBg}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative">
          <div className="flex items-center gap-3">
            <div className={`${theme === "escuro" ? "bg-violet-600" : theme === "pastel" ? "bg-[#8A6F53]" : "bg-indigo-600"} text-white p-2.5 rounded-xl shadow-md`}>
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

          <div className="flex items-center gap-3">
            {/* Quick Stats Banner */}
            <div className={`flex flex-wrap items-center gap-4 text-xs font-semibold p-2.5 rounded-xl border transition-colors duration-200 ${
              theme === "escuro" 
                ? "bg-slate-900 border-slate-800 text-slate-300" 
                : theme === "pastel" 
                ? "bg-[#FAF5ED] border-[#DCD0C0] text-[#4E3F30]" 
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
                    : theme === "pastel" 
                    ? "bg-[#FCFAF5] border-[#DCD0C0] hover:bg-[#F3EBE0] text-[#3D2F20]" 
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
                        triggerToast("Claro ativado!", "success");
                      }}
                      className={`w-full text-left text-xs font-semibold py-2 px-2.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${styles.dropdownItemHover} ${
                        theme === "claro" ? "bg-slate-100 dark:bg-slate-800 font-bold" : ""
                      }`}
                    >
                      <span>☀️ Claro</span>
                      {theme === "claro" && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </button>
                    <button
                      onClick={() => {
                        setTheme("escuro");
                        setIsThemeMenuOpen(false);
                        triggerToast("Escuro ativado!", "success");
                      }}
                      className={`w-full text-left text-xs font-semibold py-2 px-2.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${styles.dropdownItemHover} ${
                        theme === "escuro" ? "bg-slate-800 font-bold" : ""
                      }`}
                    >
                      <span>🌙 escuro</span>
                      {theme === "escuro" && <Check className="w-3.5 h-3.5 text-violet-400" />}
                    </button>
                    <button
                      onClick={() => {
                        setTheme("pastel");
                        setIsThemeMenuOpen(false);
                        triggerToast("Pastel ativado!", "success");
                      }}
                      className={`w-full text-left text-xs font-semibold py-2 px-2.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${styles.dropdownItemHover} ${
                        theme === "pastel" ? "bg-[#FAF5ED] font-bold" : ""
                      }`}
                    >
                      <span>🎨 pastel</span>
                      {theme === "pastel" && <Check className="w-3.5 h-3.5 text-[#8A6F53]" />}
                    </button>

                    <div className="border-t my-2 border-slate-100 dark:border-slate-800" />
                    
                    <p className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 mb-1 ${styles.textMuted}`}>
                      Configurações
                    </p>
                    
                    <div className="px-2.5 py-1.5 flex flex-col items-center gap-1.5 select-none text-center">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Ordem de Entrada</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold transition-colors ${!alternatingOrder ? "text-indigo-600 dark:text-violet-400 font-extrabold" : "text-slate-400"}`}>A</span>
                        <button
                          onClick={() => {
                            const nextVal = !alternatingOrder;
                            setAlternatingOrder(nextVal);
                            triggerToast(nextVal ? "Modo de entrada alternada (B) ativado!" : "Modo de entrada sequencial (A) ativado!", "info");
                          }}
                          className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer shrink-0 ${
                            alternatingOrder 
                              ? (theme === "escuro" ? "bg-violet-600" : theme === "pastel" ? "bg-[#8A6F53]" : "bg-indigo-600") 
                              : "bg-slate-300 dark:bg-slate-700"
                          }`}
                          title="Modo de Entrada: A (Sequencial) ou B (Alternada)"
                        >
                          <div
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                              alternatingOrder ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                        <span className={`text-xs font-bold transition-colors ${alternatingOrder ? "text-indigo-600 dark:text-violet-400 font-extrabold" : "text-slate-400"}`}>B</span>
                      </div>
                    </div>

                    <div className="border-t my-2 border-slate-100 dark:border-slate-800" />

                    <div className="px-2.5 py-1.5 flex flex-col items-center gap-1.5 select-none text-center">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Ordem de Troca</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold transition-colors ${swapOrderMode === "A" ? "text-indigo-600 dark:text-violet-400 font-extrabold" : "text-slate-400"}`}>A</span>
                        <button
                          onClick={() => {
                            const nextMode = swapOrderMode === "A" ? "B" : "A";
                            setSwapOrderMode(nextMode);
                            const updated = reassignHierarchyValues(teamA, teamB, reserves, nextMode, consecutiveWinsTeam);
                            setTeamA(updated.teamA);
                            setTeamB(updated.teamB);
                            setReserves(updated.reserves);
                            triggerToast(`Ordem de Troca alterada para o Modo ${nextMode}!`, "info");
                          }}
                          className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer shrink-0 ${
                            swapOrderMode === "B" 
                              ? (theme === "escuro" ? "bg-violet-600" : theme === "pastel" ? "bg-[#8A6F53]" : "bg-indigo-600") 
                              : "bg-slate-300 dark:bg-slate-700"
                          }`}
                          title="Modo de Hierarquia: A (Novo sistema 1-6/7-12) ou B (Antigo impares/pares)"
                        >
                          <div
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                              swapOrderMode === "B" ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                        <span className={`text-xs font-bold transition-colors ${swapOrderMode === "B" ? "text-indigo-600 dark:text-violet-400 font-extrabold" : "text-slate-400"}`}>B</span>
                      </div>
                    </div>
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
                    : theme === "pastel" 
                    ? "bg-[#FAF5ED] border-[#DCD0C0] text-[#3D2F20]" 
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
                  {teamA.length === 6 && teamB.length === 6 ? (
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
                      <p>Ambos os times precisam estar completos com exatamente 6 jogadores para misturar.</p>
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
                          : theme === "pastel"
                          ? "bg-[#FAF5ED] hover:bg-[#F3EBE0] text-[#8A6F53] border-[#DCD0C0] shadow-xs"
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
            <div className="lg:col-span-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Time A Panel */}
                <div className={`rounded-2xl border shadow-xs overflow-hidden flex flex-col justify-between ${styles.cardBg} ${theme === "escuro" ? "border-violet-900/40" : theme === "pastel" ? "border-[#E8DFCF]" : "border-indigo-100/80"}`}>
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
                              isUnlocked={unlockedPlayerIds.includes(player.id)}
                              onToggleUnlock={() => togglePlayerUnlock(player.id)}
                              onMoveToTop={() => handleManualMovePlayer("A", "top", player.id)}
                              onMoveUp={() => handleManualMovePlayer("A", "up", player.id)}
                              onMoveDown={() => handleManualMovePlayer("A", "down", player.id)}
                              onMoveToBottom={() => handleManualMovePlayer("A", "bottom", player.id)}
                              isLast={index === teamA.length - 1}
                              onDragStart={(e) => handleDragStart(e, player.id, "A")}
                              onDragOver={(e) => handleDragOverCard(e, player.id, "A")}
                              onDrop={(e) => handleDropPlayer(e, player.id, "A")}
                              onDragEnd={handleDragEnd}
                              isDragging={draggedPlayerId === player.id}
                            />
                          ))
                        ) : (
                          <EmptySlot teamName="A" slotsCount={6} />
                        )}
                        {teamA.length > 0 && teamA.length < 6 && (
                          <EmptyPlaceholderCount count={6 - teamA.length} label="vaga(s) restante(s)" />
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Victory selection for Time A */}
                  <div className={`p-4 border-t ${theme === "escuro" ? "border-slate-800 bg-slate-900/20" : theme === "pastel" ? "border-[#E8DFCF] bg-[#FAF5ED]/30" : "border-slate-100 bg-slate-50/50"}`}>
                    <button
                      onClick={() => handleGameWinner("A")}
                      className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer ${
                        teamA.length === 6 && teamB.length === 6
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
                <div className={`rounded-2xl border shadow-xs overflow-hidden flex flex-col justify-between ${styles.cardBg} ${theme === "escuro" ? "border-emerald-900/40" : theme === "pastel" ? "border-[#E8DFCF]" : "border-teal-100/80"}`}>
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
                              isUnlocked={unlockedPlayerIds.includes(player.id)}
                              onToggleUnlock={() => togglePlayerUnlock(player.id)}
                              onMoveToTop={() => handleManualMovePlayer("B", "top", player.id)}
                              onMoveUp={() => handleManualMovePlayer("B", "up", player.id)}
                              onMoveDown={() => handleManualMovePlayer("B", "down", player.id)}
                              onMoveToBottom={() => handleManualMovePlayer("B", "bottom", player.id)}
                              isLast={index === teamB.length - 1}
                              onDragStart={(e) => handleDragStart(e, player.id, "B")}
                              onDragOver={(e) => handleDragOverCard(e, player.id, "B")}
                              onDrop={(e) => handleDropPlayer(e, player.id, "B")}
                              onDragEnd={handleDragEnd}
                              isDragging={draggedPlayerId === player.id}
                            />
                          ))
                        ) : (
                          <EmptySlot teamName="B" slotsCount={6} />
                        )}
                        {teamB.length > 0 && teamB.length < 6 && (
                          <EmptyPlaceholderCount count={6 - teamB.length} label="vaga(s) restante(s)" />
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Victory selection for Time B */}
                  <div className={`p-4 border-t ${theme === "escuro" ? "border-slate-800 bg-slate-900/20" : theme === "pastel" ? "border-[#E8DFCF] bg-[#FAF5ED]/30" : "border-slate-100 bg-slate-50/50"}`}>
                    <button
                      onClick={() => handleGameWinner("B")}
                      className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer ${
                        teamA.length === 6 && teamB.length === 6
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
                  <span className={`${styles.reserveBg} ${theme === "escuro" ? "text-white" : theme === "pastel" ? "text-[#3D2F20]" : "text-amber-900"} text-xs font-extrabold px-3 py-1 rounded-full font-mono shadow-xs border border-white/10`}>
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
                            onToggleUnlock={() => togglePlayerUnlock(player.id)}
                            onMoveToTop={() => handleManualMovePlayer("reserves", "top", player.id)}
                            onMoveUp={() => handleManualMovePlayer("reserves", "up", player.id)}
                            onMoveDown={() => handleManualMovePlayer("reserves", "down", player.id)}
                            onMoveToBottom={() => handleManualMovePlayer("reserves", "bottom", player.id)}
                            isLast={index === reserves.length - 1}
                            onDragStart={(e) => handleDragStart(e, player.id, "reserves")}
                            onDragOver={(e) => handleDragOverCard(e, player.id, "reserves")}
                            onDrop={(e) => handleDropPlayer(e, player.id, "reserves")}
                            onDragEnd={handleDragEnd}
                            isDragging={draggedPlayerId === player.id}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400 border border-dashed border-slate-200/60 rounded-xl">
                      <Users className="w-8 h-8 text-slate-300 mb-1.5" />
                      <p className="text-xs font-semibold">Sem jogadores na reserva.</p>
                      <p className="text-[10px] text-slate-400 max-w-xs mt-0.5">
                        Jogadores adicionados além dos 12 titulares entram automaticamente nesta fila de espera.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Cadastro Tab view */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left column: Add form & rules */}
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
                <div className="flex items-center justify-between pb-1">
                  <h3 className={`font-display font-semibold text-sm ${styles.cardTitle} flex items-center gap-2`}>
                    <Users className="w-4 h-4 text-emerald-500" />
                    Jogadores Cadastrados
                  </h3>
                  <span className={`text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded-md font-bold uppercase`}>
                    A-Z ({registeredPlayers.length})
                  </span>
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
                <div className="max-h-[500px] overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
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
                                <p className={`text-xs font-bold truncate leading-snug ${styles.textBold}`}>
                                  {player.name}
                                </p>
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

              {/* Rules Help Card inside Cadastro tab */}
              <div className={`rounded-2xl p-6 shadow-md space-y-3.5 ${styles.rulesBg}`}>
                <h3 className={`font-display font-semibold text-sm flex items-center gap-2 ${styles.rulesTitle}`}>
                  <HelpCircle className="w-5 h-5 text-indigo-400" />
                  Regras de Funcionamento e Rodízio de Jogadores
                </h3>
                <ul className={`text-xs space-y-2.5 list-disc pl-4 font-normal ${styles.rulesText}`}>
                  <li>
                    <strong className={styles.rulesStrong}>Hierarquia Fixa:</strong> O Time A recebe valores ímpares (1, 3, 5, 7, 9, 11). O Time B recebe valores pares (2, 4, 6, 8, 10, 12).
                  </li>
                  <li>
                    <strong className={styles.rulesStrong}>Cadastro Reserva:</strong> Jogadores excedentes recebem numerações sequenciais a partir de 13.
                  </li>
                  <li>
                    <strong className={styles.rulesStrong}>Rotação de Perdedor:</strong> Os 6 perdedores vão para o fim da fila de reserva. Se a reserva tiver menos de 6 jogadores, os disponíveis entram no topo do time perdedor, empurrando os últimos do time para o fim da reserva.
                  </li>
                  <li>
                    <strong className={styles.rulesStrong}>Exclusão Inteligente:</strong> Se um jogador ativo for excluído, o 1° da reserva sobe imediatamente e entra no topo daquele time.
                  </li>
                  <li>
                    <strong className={styles.rulesStrong}>Mistura Balanceada:</strong> Troca 3 jogadores aleatórios de cada time, garantindo quantidade igual de gêneros em cada time (se ímpar, Time A fica com 1 homem a mais). Os jogadores são listados respeitando sua numeração original.
                  </li>
                </ul>
              </div>

              {/* Limpar Tudo dangerous action at the bottom of left column, under the rules */}
              {registeredPlayers.length > 0 && (
                <div className={`rounded-2xl border p-5 transition-all duration-200 ${styles.cardBg} ${styles.border} flex items-center justify-between`}>
                  <div className="space-y-0.5">
                    <p className={`text-[11px] font-bold uppercase tracking-wider text-rose-500`}>Ação Perigosa</p>
                    <p className={`text-[10px] ${styles.textMuted}`}>Zerar totalmente o banco de dados</p>
                  </div>
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold flex items-center gap-1.5 py-2 px-3 rounded-xl transition-all cursor-pointer dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-950/40 border border-rose-500/10"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Limpar Tudo
                  </button>
                </div>
              )}

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

      {/* END ACTIVITIES CONFIRMATION DIALOG */}
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
                Aviso: Isso limpará todos os times ativos e a fila de reserva. Todos os jogadores ativos voltarão a ficar disponíveis na lista de cadastro de jogadores. Todo o trabalho de rodízio atual será resetado.
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

      {/* CONSECUTIVE WINS WARNING DIALOG */}
      <AnimatePresence>
        {showConsecutiveWinsModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`rounded-2xl shadow-xl max-w-md w-full p-6 border transition-all duration-200 ${styles.cardBg} ${styles.border}`}
            >
              <div className="flex items-center gap-3 text-indigo-500 mb-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl">
                  <Trophy className="w-6 h-6 text-yellow-500 animate-bounce" />
                </div>
                <h3 className={`font-display font-bold text-lg ${styles.textBold}`}>
                  Sequência de Vitórias!
                </h3>
              </div>
              <p className={`text-xs leading-relaxed ${styles.textMuted}`}>
                O time <strong className="text-amber-500 font-extrabold">{consecutiveWinsTeam === "A" ? "Time A" : "Time B"}</strong> ganhou 3 partidas seguidas! Deseja embaralhar os jogadores a fim de re-balancear os times?
              </p>
              <div className="flex gap-2.5 mt-6 justify-end">
                <button
                  type="button"
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                  onClick={() => {
                    setShowConsecutiveWinsModal(false);
                    resetWinStreak();
                  }}
                >
                  Não, Manter
                </button>
                <button
                  type="button"
                  className={`px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all cursor-pointer flex items-center gap-1.5`}
                  onClick={() => {
                    setShowConsecutiveWinsModal(false);
                    resetWinStreak();
                    handleMix();
                  }}
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  Sim, Embaralhar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GENDER IMBALANCE WARNING DIALOG */}
      <AnimatePresence>
        {showGenderImbalanceModal && imbalanceModalData && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`rounded-2xl shadow-xl max-w-md w-full p-6 border transition-all duration-200 ${styles.cardBg} ${styles.border}`}
            >
              <div className="flex items-center gap-3 text-indigo-500 mb-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-indigo-500" />
                </div>
                <h3 className={`font-display font-bold text-lg ${styles.textBold}`}>
                  Desequilíbrio de Gênero!
                </h3>
              </div>
              <p className={`text-xs leading-relaxed ${styles.textMuted}`}>
                Atenção! O <strong className={styles.textBold}>{imbalanceModalData.teamName}</strong> tem <span className="font-bold text-indigo-500">{imbalanceModalData.diff}</span> {imbalanceModalData.moreGender} a mais que o <strong className={styles.textBold}>{imbalanceModalData.otherTeamName}</strong>. Deseja misturar os times para equilibrar?
              </p>
              <div className="flex gap-2.5 mt-6 justify-end">
                <button
                  type="button"
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                  onClick={() => {
                    const currentHash = teamA.map((p) => p.id).sort().join(",") + "|" + teamB.map((p) => p.id).sort().join(",");
                    setLastWarnedRostersHash(currentHash);
                    setShowGenderImbalanceModal(false);
                  }}
                >
                  Não, Manter
                </button>
                <button
                  type="button"
                  className={`px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all cursor-pointer flex items-center gap-1.5`}
                  onClick={() => {
                    const currentHash = teamA.map((p) => p.id).sort().join(",") + "|" + teamB.map((p) => p.id).sort().join(",");
                    setLastWarnedRostersHash(currentHash);
                    setShowGenderImbalanceModal(false);
                    handleMix();
                  }}
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  Sim, Misturar
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
  theme?: "claro" | "escuro" | "pastel";
  isUnlocked?: boolean;
  onToggleUnlock?: () => void;
  onMoveToTop?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onMoveToBottom?: () => void;
  isLast?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
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
  isUnlocked = false,
  onToggleUnlock,
  onMoveToTop,
  onMoveUp,
  onMoveDown,
  onMoveToBottom,
  isLast = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging = false,
}: PlayerCardProps) {
  const isMale = player.gender === Gender.MALE;
  const [isDragOver, setIsDragOver] = useState(false);

  const cardStyles = {
    claro: {
      bg: isSwappingSelected 
        ? "bg-indigo-50 border-indigo-400 ring-2 ring-indigo-400/20"
        : isDragOver
        ? "bg-amber-50/40 border-amber-400 ring-2 ring-amber-400/30 scale-[1.01]"
        : isUnlocked
        ? "bg-amber-50/10 border-amber-200 hover:border-amber-400/60 transition-colors"
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
        : isDragOver
        ? "bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30 scale-[1.01]"
        : isUnlocked
        ? "bg-amber-950/10 border-amber-900/40 hover:border-amber-700/60 transition-colors"
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
    pastel: {
      bg: isSwappingSelected
        ? "bg-[#FAF1E6] border-[#8A6F53] ring-2 ring-[#8A6F53]/20"
        : isDragOver
        ? "bg-[#FAF1E6] border-amber-500 ring-2 ring-amber-500/20 scale-[1.01]"
        : isUnlocked
        ? "bg-[#FAF5ED] border-amber-300/60 hover:border-amber-500/60 transition-colors"
        : "bg-white border-[#E8DFCF]",
      text: "text-[#3D2F20]",
      textSub: "text-[#80705E]",
      buttonHover: "hover:bg-[#F3EBE0]",
      badgeMale: "bg-[#EBF3F5] text-[#4E7680] border border-[#D6E5E8]",
      badgeFemale: "bg-[#FAF0F2] text-[#8C5362] border border-[#F2D1DA]",
      badgeHierarchy: isReserve 
        ? "bg-[#FAF5ED] text-[#80705E]" 
        : accentColor === "indigo" 
        ? "bg-[#F3EBE0] text-[#5C4C3E] border border-[#E8DEC9]" 
        : "bg-[#E9EDE6] text-[#5A6953] border border-[#D5DDD0]",
    },
  };

  const curCard = cardStyles[theme];

  return (
    <motion.div
      layout
      layoutId={player.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      draggable={isUnlocked}
      onDragStart={isUnlocked ? onDragStart : undefined}
      onDragEnd={onDragEnd}
      onDragEnter={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => {
        setIsDragOver(false);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (onDragOver) onDragOver(e);
      }}
      onDrop={(e) => {
        setIsDragOver(false);
        if (onDrop) onDrop(e);
      }}
      className={`border rounded-xl p-3 flex items-center justify-between shadow-xs transition-all duration-200 ${
        isUnlocked ? "cursor-grab active:cursor-grabbing border-amber-300/80 dark:border-amber-700/80" : ""
      } ${isDragging ? "opacity-30 border-dashed border-amber-500 bg-amber-500/5 scale-[0.98]" : curCard.bg}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Grip Handle for Reordering */}
        {isUnlocked && (
          <div className="text-amber-500/60 hover:text-amber-500 shrink-0 select-none animate-pulse">
            <GripVertical className="w-4 h-4" />
          </div>
        )}

        {/* Hierarchy Number Badge */}
        <span
          className={`font-mono text-xs font-bold px-2 py-1 rounded-lg shrink-0 min-w-[28px] text-center ${curCard.badgeHierarchy}`}
          title={`Valor Hierárquico #${player.hierarchyValue}`}
        >
          #{player.hierarchyValue}
        </span>

        <div className="min-w-0">
          <p className={`font-semibold text-sm truncate leading-snug ${curCard.text}`}>
            {player.name}
          </p>
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md mt-0.5 ${
              isMale ? curCard.badgeMale : curCard.badgeFemale
            }`}
          >
            <User className="w-3 h-3" />
            {player.gender}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 ml-2">
        {/* Lock/Unlock Toggle Button */}
        <button
          type="button"
          onClick={onToggleUnlock}
          title={isUnlocked ? "Bloquear posição do jogador (Cadeado Desbloqueado)" : "Desbloquear posição para ordenação (Cadeado Bloqueado)"}
          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
            isUnlocked
              ? "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20"
              : `text-slate-400 hover:text-amber-500 ${curCard.buttonHover}`
          }`}
        >
          {isUnlocked ? (
            <Unlock className="w-3.5 h-3.5" />
          ) : (
            <Lock className="w-3.5 h-3.5" />
          )}
        </button>

        {isUnlocked ? (
          <>
            <button
              type="button"
              onClick={onMoveToTop}
              disabled={slotIndex === 0}
              title="Ir para o Início (Topo)"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                slotIndex === 0
                  ? "text-slate-200 dark:text-slate-800/40 cursor-not-allowed"
                  : "text-amber-500 hover:bg-amber-500/10 dark:hover:bg-amber-500/10"
              }`}
            >
              <ChevronsUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onMoveUp}
              disabled={slotIndex === 0}
              title="Subir Posição"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                slotIndex === 0
                  ? "text-slate-200 dark:text-slate-800/40 cursor-not-allowed"
                  : "text-amber-500 hover:bg-amber-500/10 dark:hover:bg-amber-500/10"
              }`}
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={isLast}
              title="Descer Posição"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isLast
                  ? "text-slate-200 dark:text-slate-800/40 cursor-not-allowed"
                  : "text-amber-500 hover:bg-amber-500/10 dark:hover:bg-amber-500/10"
              }`}
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onMoveToBottom}
              disabled={isLast}
              title="Ir para o Fim (Fundo)"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isLast
                  ? "text-slate-200 dark:text-slate-800/40 cursor-not-allowed"
                  : "text-amber-500 hover:bg-amber-500/10 dark:hover:bg-amber-500/10"
              }`}
            >
              <ChevronsDown className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <>
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
          </>
        )}
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
