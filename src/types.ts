/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Gender {
  MALE = "Masculino",
  FEMALE = "Feminino",
}

export interface Player {
  id: string;
  name: string;
  gender: Gender;
  hierarchyValue: number;
}

/**
 * Reassigns the hierarchy numbers based on current order inside each team and reserves.
 * Team A gets 1, 3, 5, 7, 9, 11
 * Team B gets 2, 4, 6, 8, 10, 12
 * Reserves get 13, 14, 15...
 */
export function reassignHierarchyValues(
  teamA: Player[],
  teamB: Player[],
  reserves: Player[]
): { teamA: Player[]; teamB: Player[]; reserves: Player[] } {
  const newTeamA = teamA.map((p, index) => ({
    ...p,
    hierarchyValue: 1 + index * 2,
  }));

  const newTeamB = teamB.map((p, index) => ({
    ...p,
    hierarchyValue: 2 + index * 2,
  }));

  const newReserves = reserves.map((p, index) => ({
    ...p,
    hierarchyValue: 13 + index,
  }));

  return { teamA: newTeamA, teamB: newTeamB, reserves: newReserves };
}

/**
 * Mixes the active 12 players (6 in Team A, 6 in Team B) under the following constraints:
 * 1. Exactly 3 players from Team A swap with 3 players from Team B (3-and-3 swap).
 * 2. Gender balance is preserved: both teams have equal number of men and women. If total number of men is odd, Team A gets 1 more man.
 * 3. Resulting teams are sorted ascending by their original hierarchical values.
 */
export function mixTeams(
  teamA: Player[],
  teamB: Player[]
): { teamA: Player[]; teamB: Player[] } | null {
  if (teamA.length !== 6 || teamB.length !== 6) return null;

  const totalPlayers = [...teamA, ...teamB];
  const men = totalPlayers.filter((p) => p.gender === Gender.MALE);
  const women = totalPlayers.filter((p) => p.gender === Gender.FEMALE);
  const M = men.length;

  // Required men in Team A
  const requiredMenInA = M % 2 === 0 ? M / 2 : Math.floor(M / 2) + 1;
  const requiredWomenInA = 6 - requiredMenInA;

  // Generate all combinations of choosing 3 from teamA and 3 from teamB
  const validSelections: { selectedA: Player[]; selectedB: Player[] }[] = [];

  // Helper to get combinations of size k from array
  function getCombinations<T>(arr: T[], k: number): T[][] {
    const result: T[][] = [];
    function helper(start: number, combo: T[]) {
      if (combo.length === k) {
        result.push([...combo]);
        return;
      }
      for (let i = start; i < arr.length; i++) {
        combo.push(arr[i]);
        helper(i + 1, combo);
        combo.pop();
      }
    }
    helper(0, []);
    return result;
  }

  const combosA = getCombinations(teamA, 3);
  const combosB = getCombinations(teamB, 3);

  for (const choiceA of combosA) {
    for (const choiceB of combosB) {
      const proposedA = [...choiceA, ...choiceB];
      const proposedMenCount = proposedA.filter(
        (p) => p.gender === Gender.MALE
      ).length;

      if (proposedMenCount === requiredMenInA) {
        const remainingA = teamA.filter((p) => !choiceA.includes(p));
        const remainingB = teamB.filter((p) => !choiceB.includes(p));
        const proposedB = [...remainingA, ...remainingB];

        validSelections.push({
          selectedA: proposedA,
          selectedB: proposedB,
        });
      }
    }
  }

  if (validSelections.length === 0) {
    // Fallback: If no combination of 3-and-3 swaps can satisfy gender balance
    // (extremely rare, but possible if genders are highly skewed and 3-and-3 is too rigid),
    // let's do a general split that satisfies gender balance.
    const shuffledMen = [...men].sort(() => Math.random() - 0.5);
    const shuffledWomen = [...women].sort(() => Math.random() - 0.5);

    const newA_men = shuffledMen.slice(0, requiredMenInA);
    const newB_men = shuffledMen.slice(requiredMenInA);

    const newA_women = shuffledWomen.slice(0, requiredWomenInA);
    const newB_women = shuffledWomen.slice(requiredWomenInA);

    const newA = [...newA_men, ...newA_women].sort(
      (a, b) => a.hierarchyValue - b.hierarchyValue
    );
    const newB = [...newB_men, ...newB_women].sort(
      (a, b) => a.hierarchyValue - b.hierarchyValue
    );

    return { teamA: newA, teamB: newB };
  }

  // Pick a random valid selection
  const choice =
    validSelections[Math.floor(Math.random() * validSelections.length)];

  // Sort by hierarchyValue to respect original order (no hierarchy values reset here)
  const sortedA = choice.selectedA.sort(
    (a, b) => a.hierarchyValue - b.hierarchyValue
  );
  const sortedB = choice.selectedB.sort(
    (a, b) => a.hierarchyValue - b.hierarchyValue
  );

  return { teamA: sortedA, teamB: sortedB };
}
