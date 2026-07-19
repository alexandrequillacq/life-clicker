import { D, type Decimal } from "../numbers";
import type { GameState } from "../state";

// Célébrité : l'audience est de la vanité (revenu propre dérisoire), pas un multiplicateur.
export const FOLLOWERS_PER_POST = 500; // base d'un clic « Publier un post » (modulé par l'énergie)
export const POST_FOLLOWERS_SHARE = 0.002; // + 0,2 % des followers : l'audience amplifie chaque post
export const REV_PER_FOLLOWER = 0.00002; // €/s par follower (sponsoring additif, < 1 % du revenu)
export const FOLLOWER_PACK_SIZE = 10000;
export const FOLLOWER_PACK_BASE_COST = 5000; // mauvais ROI volontaire : adoration manufacturée creuse
export const FOLLOWER_PACK_GROWTH = 1.8;
export const POLITIQUE_FOLLOWERS = D(50_000_000); // pic historique de followers requis pour la politique

// Tendances déterministes : fenêtre périodique où chaque post porte ×8 (bannière pulsante côté UI).
export const TREND_PERIOD = 50; // durée d'un cycle de tendance (secondes)
export const TREND_WINDOW = 10; // fenêtre ouverte au début de chaque cycle
export const TREND_MULT = 8; // multiplicateur des posts pendant la fenêtre

// Bad buzz : polémique périodique qui draine les followers courants jusqu'à réponse ou extinction.
// Période 100 s et décalage +15 s : les fenêtres [15,35] mod 50 ne chevauchent JAMAIS
// les tendances [0,10) mod 50 (garanti par test sur plusieurs cycles).
export const BADBUZZ_PERIOD = 100; // secondes entre deux polémiques (multiple de TREND_PERIOD)
export const BADBUZZ_OFFSET = 15; // la première polémique démarre à cette position dans le cycle
export const BADBUZZ_DRAIN = 0.015; // −1,5 %/s des followers courants (compound)
export const BADBUZZ_DURATION = 20; // durée d'une polémique sans réponse (auto-extinction)
export const BADBUZZ_ENERGY_COST = 8; // énergie dépensée pour « Répondre à la polémique »
export const BADBUZZ_MIN_FOLLOWERS = 200_000; // aucune polémique avant ce seuil de followers

// Sens : révélé en P5, calculé à partir de choix DURABLES tracés (pas d'un seul bit).
export const SENS_BASE = 50;
export const SENS_PER_LIFE = 8; // par geste de vie réel, plafonné
export const SENS_LIFE_CAP = 5;
export const SENS_PER_AUTOMATION = 12; // chaque automatisation de la vie creuse le sens
export const SENS_NEGLECT_PENALTY = 20; // si la vie n'a pas été entretenue depuis longtemps
export const NEGLECT_SECONDS = 600; // 10 min de temps de jeu sans geste de vie
export const SENS_DRIFT_PER_SEC = 1 / 60; // dérive lente (~1 point/min) si on néglige la vie
export const SENS_PER_REST = 4; // un geste de vie regagne du sens (une fois révélé)

function clamp(min: number, max: number, v: number): number {
  return Math.max(min, Math.min(max, v));
}

/** Sens initial à la révélation : agrégat honnête des choix de vie enregistrés. */
export function computeInitialSens(s: GameState): number {
  const lived = SENS_PER_LIFE * Math.min(s.vieVecueTicks, SENS_LIFE_CAP);
  const automated = SENS_PER_AUTOMATION * s.vieAutomatiseeCount;
  const neglect = s.secsSinceLife > NEGLECT_SECONDS ? SENS_NEGLECT_PENALTY : 0;
  return clamp(0, 100, SENS_BASE + lived - automated - neglect);
}

/** Revenu de sponsoring : additif, dérisoire face à la boîte (l'adoration ne paie pas vraiment). */
export function sponsoringIncomePerSec(state: GameState): Decimal {
  return state.followers.mul(REV_PER_FOLLOWER);
}

/** Fenêtre de tendance ouverte : posts ×8. Pure et déterministe (position dans le cycle). */
export function trendActive(state: GameState): boolean {
  return state.job === "celebrite" && state.trendTimer < TREND_WINDOW;
}
