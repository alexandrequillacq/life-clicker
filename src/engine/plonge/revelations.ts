import type { GameState } from "../state";
import { NOVELTY_GAP, REVEALS, REVEAL_BY_ID, type RevealDef } from "../content/plonge";
import { callOngoing, markAction } from "./commun";
import { dayIndex } from "./restaurant";

// Ce qui est révélé : une information à la fois. Tout est décrit par la table REVEALS du contenu ;
// ce module ne fait que la lire. Une nouveauté du jeu, une fois révélée, est notée (avec son heure)
// dans `revealed` ; une offre ou un geste se lit en direct dans l'état, et n'est noté que pour
// repousser la nouveauté suivante.

/** Ce qui se passe pendant le tick en cours (les moments qui ne durent qu'un instant). */
export interface TickMoments {
  sundayStart?: boolean; // le jour vient de passer à dimanche (Maman appelle à midi)
  greasyDue?: boolean; // une fournée en cycle court vient de ressortir grasse
}

/** Maman sonne à ce tick : c'est dimanche midi, et elle a le droit d'appeler (premier appel, premier en service). */
export function callStartsNow(s: GameState, m: TickMoments): boolean {
  const p = s.plonge;
  if (!m.sundayStart || p.callWeek === Math.floor(dayIndex(s) / 7) || !isRevealed(s, "maman")) return false;
  return !inService(s) || p.serviceCall || isRevealed(s, "service");
}
function inService(s: GameState): boolean {
  return s.plonge.sundayOpen && !s.manualRetired;
}

/** Les conditions nommées de la table (`when`). */
const CONDITIONS: Record<string, (s: GameState, m: TickMoments) => boolean> = {
  dimanche_midi: (_s, m) => !!m.sundayStart,
  en_service: (s) => inService(s),
  fournee_grasse: (_s, m) => !!m.greasyDue,
  pile_vide_ou_deborde: (s) => s.plonge.pile < 1 || s.plonge.overflow > 0,
  pas_d_appel: (s, m) => !callOngoing(s) && !callStartsNow(s, m),
  demande_acceptee: (s) => s.plonge.asksDone > 0,
  dimanche_ouvert: (s) => s.plonge.sundayOpen,
};
export const CONDITION_NAMES = Object.keys(CONDITIONS);

/** Heure de calendrier d'un événement (achat, geste, nouveauté du jeu), undefined s'il n'a pas eu lieu. */
export function eventAt(s: GameState, key: string): number | undefined {
  return s.plonge.boughtAt[key] ?? s.plonge.revealed[key];
}

/** La ligne de la table est-elle prête (sans compter la file) ? */
function ready(s: GameState, r: RevealDef, m: TickMoments = {}): boolean {
  const p = s.plonge;
  if (r.at !== undefined && p.day < r.at) return false;
  if (r.earned !== undefined && p.earned < r.earned - 1e-9) return false; // 20 × 0,05 ne fait pas toujours 1 en virgule flottante
  if (r.after) {
    const ok = Object.entries(r.after).some(([k, delay]) => {
      const at = eventAt(s, k);
      return at !== undefined && p.day - at >= delay;
    });
    if (!ok) return false;
  }
  if (r.needs && !r.needs.every((k) => eventAt(s, k) !== undefined)) return false;
  return !r.when || r.when.every((c) => CONDITIONS[c](s, m));
}

/** Cette nouveauté est-elle à l'écran ? (Une clé hors de la table est un événement daté.) */
export function isRevealed(s: GameState, key: string): boolean {
  const r = REVEAL_BY_ID[key];
  if (!r || r.kind === "jeu") return s.plonge.revealed[key] !== undefined;
  return ready(s, r);
}

function noveltyFree(s: GameState): boolean {
  return s.plonge.day >= s.plonge.lastNovelty + NOVELTY_GAP;
}
function note(s: GameState, id: string): void {
  s.plonge.revealed[id] = s.plonge.day;
  s.plonge.lastNovelty = s.plonge.day;
}

/** Les gestes du joueur qui changent l'écran repoussent la nouveauté suivante, dès l'action. */
function settleGestures(s: GameState): void {
  for (const r of REVEALS) if (r.kind === "geste" && s.plonge.revealed[r.id] === undefined && ready(s, r)) note(s, r.id);
}
/** Une action du joueur : il n'est plus inactif, et ce qu'elle fait paraître compte comme nouveauté. */
export function acted(s: GameState): void {
  markAction(s);
  settleGestures(s);
}

/** La file des nouveautés que le jeu révèle de lui-même, dans l'ordre de la table, une à la fois. */
export function revealQueue(s: GameState, m: TickMoments): void {
  for (const r of REVEALS) {
    if (r.kind !== "jeu" || s.plonge.revealed[r.id] !== undefined) continue;
    if (noveltyFree(s) && ready(s, r, m)) note(s, r.id);
  }
}

/** La montre donne le jour et le coup de feu. */
export function dayVisible(s: GameState): boolean {
  return isRevealed(s, "jour");
}
/** Les couverts se révèlent avec la première demande acceptée (ou le dimanche ouvert). */
export function coversVisible(s: GameState): boolean {
  return isRevealed(s, "couverts") || isRevealed(s, "jours_ouverts");
}
/** La colonne « Ta vie » naît avec le premier appel de Maman (ou le temps libre). */
export function lifeVisible(s: GameState): boolean {
  const p = s.plonge;
  return s.souvenirs.length > 0 || p.callRing > 0 || p.callTalk > 0 || s.manualRetired;
}
