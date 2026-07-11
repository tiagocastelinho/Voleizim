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
} from "lucide-react";
import { Player, Gender, reassignHierarchyValues, mixTeams } from "./types";

export default function App() {
  // State for Teams and Reserves
  const [teamA, setTeamA] = useState<Player[]>([]);
  const [teamB, setTeamB] = useState<Player[]>([]);
  const [reserves, setReserves] = useState<Player[]>([]);

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

  // Load from LocalStorage on mount
  useEffect(() => {
    const savedA = localStorage.getItem("rodizio_teamA");
    const savedB = localStorage.getItem("rodizio_teamB");
    const savedReserves = localStorage.getItem("rodizio_reserves");

    if (savedA) setTeamA(JSON.parse(savedA));
    if (savedB) setTeamB(JSON.parse(savedB));
    if (savedReserves) setReserves(JSON.parse(savedReserves));
  }, []);

  // Save to LocalStorage whenever rosters change
  useEffect(() => {
    localStorage.setItem("rodizio_teamA", JSON.stringify(teamA));
    localStorage.setItem("rodizio_teamB", JSON.stringify(teamB));
    localStorage.setItem("rodizio_reserves", JSON.stringify(reserves));
  }, [teamA, teamB, reserves]);

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

  // Add new player to state
  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) {
      triggerToast("Por favor, digite o nome do jogador.", "error");
      return;
    }

    const newPlayer: Player = {
      id: `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newPlayerName.trim(),
      gender: newPlayerGender,
      hierarchyValue: 0, // Assigned below
    };

    let updatedA = [...teamA];
    let updatedB = [...teamB];
    let updatedReserves = [...reserves];

    // Distribute according to space
    if (updatedA.length < 6) {
      updatedA.push(newPlayer);
    } else if (updatedB.length < 6) {
      updatedB.push(newPlayer);
    } else {
      updatedReserves.push(newPlayer);
    }

    // Recalculate and reassign hierarchy values
    const updated = reassignHierarchyValues(updatedA, updatedB, updatedReserves);
    setTeamA(updated.teamA);
    setTeamB(updated.teamB);
    setReserves(updated.reserves);

    setNewPlayerName("");
    triggerToast(`Jogador "${newPlayer.name}" cadastrado com sucesso!`, "success");
  };

  // Delete a player
  const handleDeletePlayer = (id: string, name: string) => {
    const isInA = teamA.some((p) => p.id === id);
    const isInB = teamB.some((p) => p.id === id);

    let updatedA = [...teamA];
    let updatedB = [...teamB];
    let updatedReserves = [...reserves];

    if (isInA) {
      // Remove from team A
      updatedA = updatedA.filter((p) => p.id !== id);
      // Promote first reserve to topo of team A
      if (updatedReserves.length > 0) {
        const substitute = updatedReserves[0];
        updatedReserves = updatedReserves.slice(1);
        updatedA = [substitute, ...updatedA];
        triggerToast(
          `"${name}" foi removido do Time A e "${substitute.name}" da reserva entrou no topo.`,
          "success"
        );
      } else {
        triggerToast(`"${name}" foi removido do Time A.`, "success");
      }
    } else if (isInB) {
      // Remove from team B
      updatedB = updatedB.filter((p) => p.id !== id);
      // Promote first reserve to topo of team B
      if (updatedReserves.length > 0) {
        const substitute = updatedReserves[0];
        updatedReserves = updatedReserves.slice(1);
        updatedB = [substitute, ...updatedB];
        triggerToast(
          `"${name}" foi removido do Time B e "${substitute.name}" da reserva entrou no topo.`,
          "success"
        );
      } else {
        triggerToast(`"${name}" foi removido do Time B.`, "success");
      }
    } else {
      // Remove from reserves
      updatedReserves = updatedReserves.filter((p) => p.id !== id);
      triggerToast(`"${name}" foi removido da reserva.`, "success");
    }

    // Reassign all hierarchy numbers after any substitution/change
    const updated = reassignHierarchyValues(updatedA, updatedB, updatedReserves);
    setTeamA(updated.teamA);
    setTeamB(updated.teamB);
    setReserves(updated.reserves);
  };

  // Save changes to edited player
  const handleSaveEditedPlayer = () => {
    if (!editingPlayer) return;
    if (!editingPlayer.name.trim()) {
      triggerToast("O nome do jogador não pode ficar em branco.", "error");
      return;
    }

    // Map updated player back into whichever list they exist in
    const updatedA = teamA.map((p) => (p.id === editingPlayer.id ? editingPlayer : p));
    const updatedB = teamB.map((p) => (p.id === editingPlayer.id ? editingPlayer : p));
    const updatedReserves = reserves.map((p) =>
      p.id === editingPlayer.id ? editingPlayer : p
    );

    setTeamA(updatedA);
    setTeamB(updatedB);
    setReserves(updatedReserves);
    setEditingPlayer(null);
    triggerToast("Dados do jogador atualizados com sucesso!", "success");
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
    const updated = reassignHierarchyValues(finalA, finalB, newReserves);

    setTeamA(updated.teamA);
    setTeamB(updated.teamB);
    setReserves(updated.reserves);

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

  // Seed 14 typical players
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

    let tempA: Player[] = [];
    let tempB: Player[] = [];
    let tempReserves: Player[] = [];

    testPlayers.forEach((tp, i) => {
      const newPlayer: Player = {
        id: `seed-${i}-${Date.now()}`,
        name: tp.name,
        gender: tp.gender,
        hierarchyValue: 0,
      };
      if (tempA.length < 6) {
        tempA.push(newPlayer);
      } else if (tempB.length < 6) {
        tempB.push(newPlayer);
      } else {
        tempReserves.push(newPlayer);
      }
    });

    const updated = reassignHierarchyValues(tempA, tempB, tempReserves);
    setTeamA(updated.teamA);
    setTeamB(updated.teamB);
    setReserves(updated.reserves);
    triggerToast("Roster de teste preenchido com 14 jogadores!", "success");
  };

  // Reset entire state
  const handleClearAll = () => {
    setTeamA([]);
    setTeamB([]);
    setReserves([]);
    setShowClearConfirm(false);
    triggerToast("Todo o cadastro de jogadores foi limpo.", "info");
  };

  // Calculate stats
  const totalPlayers = teamA.length + teamB.length + reserves.length;
  const countMen =
    [...teamA, ...teamB, ...reserves].filter((p) => p.gender === Gender.MALE).length;
  const countWomen =
    [...teamA, ...teamB, ...reserves].filter((p) => p.gender === Gender.FEMALE).length;

  const countTeamAMen = teamA.filter((p) => p.gender === Gender.MALE).length;
  const countTeamAWomen = teamA.filter((p) => p.gender === Gender.FEMALE).length;
  const countTeamBMen = teamB.filter((p) => p.gender === Gender.MALE).length;
  const countTeamBWomen = teamB.filter((p) => p.gender === Gender.FEMALE).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased pb-16">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 py-6 px-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-md shadow-indigo-100">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl text-slate-900 tracking-tight">
                Organizador e Rodízio de Times
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Gestão esportiva com balanceamento de gênero e rotação inteligente
              </p>
            </div>
          </div>

          {/* Quick Stats Banner */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1">
              <span className="text-slate-400">Total:</span>
              <span className="text-slate-900">{totalPlayers}</span>
            </div>
            <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
            <div className="flex items-center gap-1.5 text-indigo-600">
              <User className="w-3.5 h-3.5" />
              <span>{countMen} Homens</span>
            </div>
            <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
            <div className="flex items-center gap-1.5 text-rose-600">
              <User className="w-3.5 h-3.5" />
              <span>{countWomen} Mulheres</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Register and Control Center */}
        <section className="lg:col-span-4 space-y-6">
          
          {/* Section: Cadastrar Jogador */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
            <h2 className="font-display font-semibold text-lg text-slate-900 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" />
              Cadastrar Jogador
            </h2>
            
            <form onSubmit={handleAddPlayer} className="space-y-4">
              <div>
                <label htmlFor="playerName" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Nome do Jogador
                </label>
                <input
                  id="playerName"
                  type="text"
                  placeholder="Ex: João Silva"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                />
              </div>

              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Sexo / Gênero
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={`py-2 px-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                      newPlayerGender === Gender.MALE
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                    onClick={() => setNewPlayerGender(Gender.MALE)}
                  >
                    <User className="w-4 h-4 text-indigo-500" />
                    Masculino
                  </button>
                  <button
                    type="button"
                    className={`py-2 px-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                      newPlayerGender === Gender.FEMALE
                        ? "bg-rose-50 border-rose-200 text-rose-700 shadow-xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                    onClick={() => setNewPlayerGender(Gender.FEMALE)}
                  >
                    <User className="w-4 h-4 text-rose-500" />
                    Feminino
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Adicionar aos Times
              </button>
            </form>

            {/* Quick Demo Loader */}
            {totalPlayers === 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSeedDemoPlayers}
                  className="w-full border border-dashed border-indigo-200 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  Preencher com 14 Jogadores de Teste
                </button>
              </div>
            )}
          </div>

          {/* Section: Centro de Controle da Partida */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-5">
            <div>
              <h2 className="font-display font-semibold text-lg text-slate-900 mb-1 flex items-center gap-2">
                <Shuffle className="w-5 h-5 text-indigo-600" />
                Mistura de Times
              </h2>
              <p className="text-xs text-slate-500">Reorganize e equilibre as equipes baseadas no gênero</p>
            </div>

            {teamA.length === 6 && teamB.length === 6 ? (
              <button
                onClick={handleMix}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <Shuffle className="w-4 h-4 text-indigo-400 group-hover:rotate-180 transition-transform duration-300" />
                Misturar e Balancear Times
              </button>
            ) : (
              <div className="bg-amber-50/80 border border-amber-100 rounded-xl p-4 text-xs text-amber-800 space-y-2">
                <div className="flex gap-2 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Mistura Indisponível</span>
                </div>
                <p>
                  Ambos os times precisam estar completos com exatamente 6 jogadores cada para serem misturados.
                </p>
              </div>
            )}

            {/* Clear button */}
            {totalPlayers > 0 && (
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs text-slate-400 font-medium">Resetar todos os dados:</span>
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Limpar Tudo
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Right Side: Teams Display Grid */}
        <section className="lg:col-span-8 space-y-8">
          
          {/* Main Grid for Teams */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Time A Panel */}
            <div className="bg-white rounded-2xl border border-indigo-100/80 shadow-xs overflow-hidden flex flex-col justify-between">
              <div>
                <div className="bg-indigo-500 text-white p-4 flex items-center justify-between">
                  <h2 className="font-display font-bold text-lg tracking-tight flex items-center gap-2">
                    Time A
                  </h2>
                  {/* Team gender counts */}
                  <div className="bg-indigo-600 text-white/90 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2.5 border border-indigo-400/30">
                    <span className="flex items-center gap-1">
                      M: {countTeamAMen}
                    </span>
                    <span className="w-1 h-3 bg-indigo-500 rounded-full"></span>
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
                          onDelete={() => handleDeletePlayer(player.id, player.name)}
                          onEdit={() => setEditingPlayer(player)}
                          accentColor="indigo"
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
              <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <button
                  onClick={() => handleGameWinner("A")}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer ${
                    teamA.length === 6 && teamB.length === 6
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white active:scale-98"
                      : "bg-slate-100 text-slate-400 border border-slate-200/50"
                  }`}
                >
                  <Trophy className="w-4 h-4" />
                  Time A Venceu
                </button>
              </div>
            </div>

            {/* Time B Panel */}
            <div className="bg-white rounded-2xl border border-teal-100/80 shadow-xs overflow-hidden flex flex-col justify-between">
              <div>
                <div className="bg-teal-500 text-white p-4 flex items-center justify-between">
                  <h2 className="font-display font-bold text-lg tracking-tight flex items-center gap-2">
                    Time B
                  </h2>
                  {/* Team gender counts */}
                  <div className="bg-teal-600 text-white/90 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2.5 border border-teal-400/30">
                    <span className="flex items-center gap-1">
                      M: {countTeamBMen}
                    </span>
                    <span className="w-1 h-3 bg-teal-500 rounded-full"></span>
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
                          onDelete={() => handleDeletePlayer(player.id, player.name)}
                          onEdit={() => setEditingPlayer(player)}
                          accentColor="teal"
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
              <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <button
                  onClick={() => handleGameWinner("B")}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer ${
                    teamA.length === 6 && teamB.length === 6
                      ? "bg-teal-600 hover:bg-teal-500 text-white active:scale-98"
                      : "bg-slate-100 text-slate-400 border border-slate-200/50"
                  }`}
                >
                  <Trophy className="w-4 h-4" />
                  Time B Venceu
                </button>
              </div>
            </div>

          </div>

          {/* Section: Cadastro Reserva */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 className="font-display font-semibold text-lg text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-500" />
                  Cadastro Reserva / Fila de Espera
                </h2>
                <p className="text-xs text-slate-500">Ordenados por chegada - Sequência a partir de #13</p>
              </div>
              <span className="bg-amber-50 text-amber-700 border border-amber-100 text-xs font-extrabold px-3 py-1 rounded-full font-mono">
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
                        onDelete={() => handleDeletePlayer(player.id, player.name)}
                        onEdit={() => setEditingPlayer(player)}
                        accentColor="amber"
                        isReserve
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400 border border-dashed border-slate-100 rounded-xl">
                  <Users className="w-8 h-8 text-slate-300 mb-1.5" />
                  <p className="text-xs font-semibold">Sem jogadores na reserva.</p>
                  <p className="text-[10px] text-slate-400 max-w-xs mt-0.5">
                    Jogadores adicionados além dos 12 titulares entram automaticamente nesta fila de espera.
                  </p>
                </div>
              )}
            </div>
          </div>

        </section>
      </main>

      {/* Rules Section as a bottom container (Help Card) */}
      <footer className="max-w-7xl mx-auto px-4 mt-8">
        <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 shadow-lg space-y-3.5">
          <h3 className="font-display font-semibold text-base text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-400" />
            Regras de Funcionamento e Rodízio de Jogadores
          </h3>
          <ul className="text-xs text-slate-300 space-y-2.5 list-disc pl-4 font-normal">
            <li>
              <strong className="text-white">Hierarquia Fixa:</strong> O Time A recebe valores ímpares (1, 3, 5, 7, 9, 11). O Time B recebe valores pares (2, 4, 6, 8, 10, 12).
            </li>
            <li>
              <strong className="text-white">Cadastro Reserva:</strong> Jogadores excedentes recebem numerações sequenciais a partir de 13.
            </li>
            <li>
              <strong className="text-white">Rotação de Perdedor:</strong> Os 6 perdedores vão para o fim da fila de reserva. Se a reserva tiver menos de 6 jogadores, os disponíveis entram no topo do time perdedor, empurrando os últimos do time para o fim da reserva.
            </li>
            <li>
              <strong className="text-white">Exclusão Inteligente:</strong> Se um jogador ativo for excluído, o 1° da reserva sobe imediatamente e entra no topo daquele time.
            </li>
            <li>
              <strong className="text-white">Mistura Balanceada:</strong> Troca 3 jogadores aleatórios de cada time, garantindo quantidade igual de gêneros em cada time (se ímpar, Time A fica com 1 homem a mais). Os jogadores são listados respeitando sua numeração original.
            </li>
          </ul>
        </div>
      </footer>

      {/* EDIT PLAYER MODAL DIALOG */}
      <AnimatePresence>
        {editingPlayer && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-100"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-lg text-slate-900 flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-indigo-600" />
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
                  <label htmlFor="editPlayerName" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Nome Completo / Apelido
                  </label>
                  <input
                    id="editPlayerName"
                    type="text"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    value={editingPlayer.name}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                  />
                </div>

                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Sexo / Gênero
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className={`py-2 px-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                        editingPlayer.gender === Gender.MALE
                          ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                      onClick={() => setEditingPlayer({ ...editingPlayer, gender: Gender.MALE })}
                    >
                      <User className="w-4 h-4 text-indigo-500" />
                      Masculino
                    </button>
                    <button
                      type="button"
                      className={`py-2 px-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                        editingPlayer.gender === Gender.FEMALE
                          ? "bg-rose-50 border-rose-200 text-rose-700 shadow-xs"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
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
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                  onClick={() => setEditingPlayer(null)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-all cursor-pointer flex items-center gap-1.5"
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
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-100"
            >
              <div className="flex items-center gap-3 text-rose-600 mb-3">
                <div className="p-2 bg-rose-50 rounded-xl">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-lg text-slate-900">
                  Limpar todos os registros?
                </h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Esta ação apagará permanentemente todos os jogadores cadastrados, esvaziando o Time A, o Time B e a fila de reserva. Esta ação não poderá ser desfeita.
              </p>
              <div className="flex gap-2.5 mt-6 justify-end">
                <button
                  type="button"
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
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
                  ? "border-emerald-100 text-emerald-800"
                  : notification.type === "error"
                  ? "border-rose-100 text-rose-800"
                  : "border-sky-100 text-sky-800"
              }`}
            >
              <div
                className={`p-1 rounded-lg shrink-0 ${
                  notification.type === "success"
                    ? "bg-emerald-50 text-emerald-600"
                    : notification.type === "error"
                    ? "bg-rose-50 text-rose-600"
                    : "bg-sky-50 text-sky-600"
                }`}
              >
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="flex-1 pt-0.5">{notification.text}</div>
              <button
                onClick={() => setNotification(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer pt-0.5"
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
}

function PlayerCard({
  player,
  slotIndex,
  onDelete,
  onEdit,
  accentColor,
  isReserve = false,
}: PlayerCardProps) {
  const isMale = player.gender === Gender.MALE;

  const bgHoverClass =
    accentColor === "indigo"
      ? "hover:border-indigo-200 hover:bg-indigo-50/20"
      : accentColor === "teal"
      ? "hover:border-teal-200 hover:bg-teal-50/20"
      : "hover:border-amber-200 hover:bg-amber-50/20";

  return (
    <motion.div
      layoutId={player.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      className={`bg-white border border-slate-100 rounded-xl p-3 flex items-center justify-between shadow-xs transition-colors ${bgHoverClass}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Hierarchy Number Badge */}
        <span
          className={`font-mono text-xs font-bold px-2 py-1 rounded-lg shrink-0 min-w-[28px] text-center ${
            isReserve
              ? "bg-slate-100 text-slate-500"
              : accentColor === "indigo"
              ? "bg-indigo-50 text-indigo-700"
              : "bg-teal-50 text-teal-700"
          }`}
          title={`Valor Hierárquico #${player.hierarchyValue}`}
        >
          #{player.hierarchyValue}
        </span>

        <div className="min-w-0">
          <p className="font-semibold text-slate-900 text-sm truncate leading-snug">
            {player.name}
          </p>
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md mt-0.5 ${
              isMale
                ? "bg-sky-50 text-sky-700 border border-sky-100/50"
                : "bg-rose-50 text-rose-700 border border-rose-100/50"
            }`}
          >
            <User className="w-3 h-3" />
            {player.gender}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 ml-2">
        <button
          type="button"
          onClick={onEdit}
          title="Editar Nome/Gênero"
          className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          title={isReserve ? "Remover da reserva" : "Remover e colocar reserva no topo"}
          className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
