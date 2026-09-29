import type { GameState } from "../state";
import {
  PROPOSALS,
  PROPOSAL_BY_ID,
  PETIT,
  DUVAL,
  DUVAL_FIRST_BUG,
  KEEP_UP_SECS,
  PROPOSAL_LATE,
  BEHIND_LINES,
  BEHIND_BUGS,
  type ProposalDef,
} from "../content/freelance";
import { addOrder, addSite, pendingLines } from "./carnet";
import { isRevealed, acted } from "./revelations";

// La demande : ce que tu proposes à tes clients (gratuit), et les commandes qui arrivent chaque lundi.
// Tu proposes quand tu suis ; un outil se propose quand tu ne suis plus (voir outils.ts).

/** La proposition n° i est-elle prête à paraître (pour la file des nouveautés) ? */
export function proposalReady(s: GameState, i: number): boolean {
  const f = s.freelance;
  const p = PROPOSALS[i];
  if (f.proposals[p.id] !== undefined) return false;
  const previousDone = i === 0 ? f.company !== null : f.proposals[PROPOSALS[i - 1].id] !== undefined;
  if (!previousDone) return false;
  return f.keptUp >= KEEP_UP_SECS || f.day - f.lastNovelty >= PROPOSAL_LATE;
}

export function proposalVisible(s: GameState, id: string): boolean {
  return isRevealed(s, `prop_${id}`) && s.freelance.proposals[id] === undefined;
}
export function visibleProposals(s: GameState): ProposalDef[] {
  return PROPOSALS.filter((p) => proposalVisible(s, p.id));
}

export function acceptProposal(s: GameState, id: string): boolean {
  if (!proposalVisible(s, id)) return false;
  const f = s.freelance;
  const p = PROPOSAL_BY_ID[id];
  f.proposals[id] = f.day;
  if (p.weekly) f.weekly.push(...p.weekly);
  if (p.oneShot) addOrder(s, p.oneShot, PETIT.name);
  if (p.maintDuval) {
    f.maintDuval = true;
    // [contrat Duval]
    addSite(s, DUVAL.name, "vitrine", f.day + DUVAL_FIRST_BUG);
  }
  if (p.maintAll) f.maintAll = true;
  if (p.evening) f.evening = true;
  if (id === "profil") f.quote = "entretien";
  acted(s);
  return true;
}

/** Chaque lundi, les commandes de la semaine arrivent au bout du carnet. */
export function weeklyArrivals(s: GameState): void {
  for (const kind of s.freelance.weekly) addOrder(s, kind);
}

/** Tu suis (carnet vide) ou tu ne suis plus (trop de lignes ou de bugs en attente), en secondes d'affilée. */
export function trackPace(s: GameState, t: number): void {
  const f = s.freelance;
  const empty = f.orders.length === 0 && f.bugs.length === 0;
  f.keptUp = empty ? f.keptUp + t : 0;
  const late = pendingLines(s) > BEHIND_LINES || f.bugs.length >= BEHIND_BUGS;
  f.behind = late ? f.behind + t : 0;
}
