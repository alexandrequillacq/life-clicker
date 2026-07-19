import { D, ZERO, type Decimal } from "./numbers";
import { ENERGY_MAX, INCIDENT_MALUS, type GameState, type Job } from "./state";
import { AI_BASE_INCOME, GPU_MULT_PER_UNIT, EMPRISE_GPU_BOOST, GENERATORS, GENERATORS_BY_ID } from "./content/generators";
import { sponsoringIncomePerSec } from "./content/audience";
import { KEYNOTE_BOOST } from "./content/keynote";
import { CONTROLS, RESISTANCE_FACTOR_DIV } from "./content/control";
import { EMPRISE_PER_PROBE } from "./content/cosmos";

// Métiers de fin de partie où plus aucune action du joueur ne consomme d'énergie
// (le meeting politique est la dernière) : « le pouvoir absolu ne fatigue pas ».
const NO_ENERGY_JOBS: Job[] = ["president", "monde", "empereur"];

/** L'énergie est-elle encore pertinente ? Vraie jusqu'à la politique incluse, fausse dès la présidence. */
export function energyRelevant(state: GameState): boolean {
  return !NO_ENERGY_JOBS.includes(state.job);
}

/** Effectif humain courant (juniors + seniors) : présence d'une équipe qui peut subir des incidents. */
export function humanTeamSize(state: GameState): number {
  let n = 0;
  for (const g of GENERATORS) {
    if (g.team) n += state.generators[g.id] ?? 0;
  }
  return n;
}

export function costOf(base: Decimal, growth: number, owned: number, count = 1): Decimal {
  const g = D(growth);
  const first = base.mul(g.pow(owned));
  if (count <= 1) return first;
  const factor = g.pow(count).sub(1).div(g.sub(1));
  return first.mul(factor);
}

/** Fraction 0..1 qui module le travail MANUEL. Vaut 1 tant que l'énergie n'est pas en jeu. */
export function energyFactor(state: GameState): number {
  if (!state.flags.energyVisible) return 1;
  return Math.max(0, state.energy) / ENERGY_MAX;
}

/** Assiettes/s lavées à la main en continu (plonge uniquement), modulé par l'énergie. */
export function handDishesPerSec(state: GameState): number {
  if (state.job !== "plongeur" || state.manualRetired || !state.handWashing) return 0;
  return state.handRate * energyFactor(state);
}

/** Assiettes/s produites par les machines de plonge. */
export function machineDishesPerSec(state: GameState): Decimal {
  let total = ZERO;
  for (const id in state.generators) {
    const def = GENERATORS_BY_ID[id];
    if (!def || def.kind !== "plonge") continue;
    total = total.add(def.output.mul(state.generators[id]));
  }
  return total;
}

/** Débit total de plonge en assiettes/s (machines + main). */
export function dishesPerSec(state: GameState): Decimal {
  return machineDishesPerSec(state).add(handDishesPerSec(state));
}

export function dishesPerMinute(state: GameState): Decimal {
  return dishesPerSec(state).mul(60);
}

/**
 * €/s des générateurs dev (automatisation, indépendant de l'énergie).
 * Les juniors : brut érodé par les GPU (l'IA reprend leur travail) moins un salaire fixe.
 * Le net peut devenir négatif quand l'IA est forte → on est poussé à remplacer l'équipe.
 */
export function devIncomePerSec(state: GameState): Decimal {
  const gpus = state.generators["gpu"] ?? 0;
  const incidentActive = state.incident !== null;
  let total = ZERO;
  for (const id in state.generators) {
    const def = GENERATORS_BY_ID[id];
    if (!def || def.kind !== "dev") continue;
    // Érosion par GPU (l'IA reprend le travail), atténuée par la décision « Former l'équipe à l'IA ».
    let grossPerUnit = def.redundancyPerGpu
      ? def.output.sub(def.redundancyPerGpu * state.gpuErosionMult * gpus).max(0)
      : def.output;
    // Multiplicateur de brut d'équipe issu des décisions CTO (cloud, revue de code, dette…).
    grossPerUnit = grossPerUnit.mul(state.teamOutputMult);
    // Incident en cours : le brut est divisé par 2 (les salaires restent pleins).
    if (incidentActive) grossPerUnit = grossPerUnit.mul(INCIDENT_MALUS);
    const netPerUnit = def.salaryPerSec ? grossPerUnit.sub(def.salaryPerSec) : grossPerUnit;
    total = total.add(netPerUnit.mul(state.generators[id]));
  }
  return total;
}

/** €/s de l'IA : un socle de base, multiplié par le nombre de GPU. 0 tant que l'IA n'est pas activée. */
export function aiIncomePerSec(state: GameState): Decimal {
  if (!state.flags.aiResolving) return ZERO;
  const gpus = state.generators["gpu"] ?? 0;
  // aiRateMult : décision « Garder l'IA pour l'infra » booste le débit de l'IA.
  return D(AI_BASE_INCOME).mul(1 + GPU_MULT_PER_UNIT * gpus).mul(state.aiRateMult);
}

/** €/s de la boîte (entrepreneur) : produits (scalés par l'armée de GPU) + acquisitions. */
export function bizIncomePerSec(state: GameState): Decimal {
  let total = ZERO;
  const gpus = state.generators["gpu"] ?? 0;
  const gpuFactor = 1 + state.gpuProductBoost * gpus;
  // Keynote : pendant le boost, une keynote VEND des produits (scalesWithGpu = produit_ia) → ×1,5.
  // Les acquisitions ne sont PAS boostées : une keynote ne fait pas produire davantage une filiale rachetée.
  const keynoteBoosted = state.keynoteBoostLeft > 0;
  for (const id in state.generators) {
    const def = GENERATORS_BY_ID[id];
    if (!def || def.kind !== "biz") continue;
    let unit = def.scalesWithGpu ? def.output.mul(gpuFactor) : def.output;
    if (keynoteBoosted && def.scalesWithGpu) unit = unit.mul(1 + KEYNOTE_BOOST);
    total = total.add(unit.mul(state.generators[id]));
  }
  return total;
}

/** €/s produits par les cibles de contrôle possédées (institutions, continents) : persistent après promotion. */
export function controlIncomePerSec(state: GameState): Decimal {
  let total = ZERO;
  for (const c of CONTROLS) {
    if (state.controls[c.id]) total = total.add(c.moneyPerSec);
  }
  return total;
}

/**
 * Emprise/s (Acte III), compteur de sortie et jamais une monnaie. Somme trois sources :
 *  1. les générateurs de pouvoir (propagande, influence, moissonneuse) ET les cibles de contrôle
 *     possédées, le tout MULTIPLIÉ par l'armée de GPU (la même IA qui a fait la fortune contrôle le monde) ;
 *  2. les sondes von Neumann (empereur) : probes × 1, hors boost GPU (elles se répliquent seules) ;
 * puis TOUT est multiplié par le facteur de Résistance (1 − resistance/150), plancher 1/3 > 0
 * (la Résistance ne bloque jamais). Les grants d'actes ne passent pas par ici (rituel, pas moteur).
 */
export function emprisePerSec(state: GameState): Decimal {
  let apparatus = ZERO;
  for (const id in state.generators) {
    const def = GENERATORS_BY_ID[id];
    if (!def || def.kind !== "emprise") continue;
    apparatus = apparatus.add(def.output.mul(state.generators[id]));
  }
  for (const c of CONTROLS) {
    if (state.controls[c.id]) apparatus = apparatus.add(c.emprisePerSec);
  }
  const gpus = state.generators["gpu"] ?? 0;
  const boosted = apparatus.mul(1 + EMPRISE_GPU_BOOST * gpus);
  const probeEmprise = state.probes.mul(EMPRISE_PER_PROBE);
  const resistanceFactor = 1 - state.resistance / RESISTANCE_FACTOR_DIV;
  return boosted.add(probeEmprise).mul(resistanceFactor);
}

/** Followers/s produits par les campagnes d'image (audience passive). */
export function audienceFollowersPerSec(state: GameState): Decimal {
  let total = ZERO;
  for (const id in state.generators) {
    const def = GENERATORS_BY_ID[id];
    if (!def || def.kind !== "audience") continue;
    total = total.add(def.output.mul(state.generators[id]));
  }
  return total;
}

/** Revenu passif (hors clic et hors lavage à la main) : plonge si encore plongeur + dev + IA + boîte + sponsoring. */
export function passiveIncomePerSec(state: GameState): Decimal {
  let total = devIncomePerSec(state)
    .add(aiIncomePerSec(state))
    .add(bizIncomePerSec(state))
    .add(sponsoringIncomePerSec(state))
    .add(controlIncomePerSec(state));
  if (state.job === "plongeur") {
    total = total.add(machineDishesPerSec(state).mul(state.valuePerDish));
  }
  return total;
}

/** Revenu/s en jeu : passif + lavage continu à la main (plonge). */
export function incomePerSec(state: GameState): Decimal {
  let total = passiveIncomePerSec(state);
  if (state.job === "plongeur") {
    total = total.add(D(handDishesPerSec(state)).mul(state.valuePerDish));
  }
  return total;
}
