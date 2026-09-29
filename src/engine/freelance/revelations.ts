import type { GameState } from "../state";
import { FL_NOVELTY_GAP, HOMES, PROPOSALS, TOOLS } from "../content/freelance";
import { proposalReady } from "./demande";
import { toolReady } from "./outils";
import { homeWorthIt } from "./logement";

// Une information à la fois. Chaque ligne de FL_REVEALS est une chose qui paraît à l'écran :
// - « jeu » : le jeu la révèle de lui-même, au moins FL_NOVELTY_GAP s après la nouveauté précédente, dans l'ordre
//   de la table (les offres en sont : une offre parue reste proposée jusqu'au clic) ;
// - « geste » : la conséquence immédiate d'une action du joueur (un déménagement qui colore la page) ; elle
//   n'attend pas, mais repousse la nouveauté suivante.

export interface FlReveal {
  id: string;
  kind: "jeu" | "geste";
  ready: (s: GameState) => boolean;
}

export const FL_REVEALS: FlReveal[] = [
  // [instants] ce qui ne dure qu'un moment (un dimanche), à placer avant le reste
  // [interface] les paliers de la page (v5)
  // [offres] ce que tu peux accepter ou acheter, une chose à la fois
  ...HOMES.slice(1).map((h, k): FlReveal => ({ id: `home_${h.id}`, kind: "jeu", ready: (s) => homeWorthIt(s, k + 1) })),
  ...PROPOSALS.map((p, i): FlReveal => ({ id: `prop_${p.id}`, kind: "jeu", ready: (s) => proposalReady(s, i) })),
  ...TOOLS.map((t, i): FlReveal => ({ id: `tool_${t.id}`, kind: "jeu", ready: (s) => toolReady(s, i) })),
  // [fin] la sortie, en dernier
];

/** Ce qui se passe au moment où une nouveauté paraît (par id). */
export const onReveal: Record<string, (s: GameState) => void> = {};

export function isRevealed(s: GameState, id: string): boolean {
  return s.freelance.revealed[id] !== undefined;
}
function note(s: GameState, id: string): void {
  s.freelance.revealed[id] = s.freelance.day;
  s.freelance.lastNovelty = s.freelance.day;
  onReveal[id]?.(s);
}
function gapFree(s: GameState): boolean {
  return s.freelance.day >= s.freelance.lastNovelty + FL_NOVELTY_GAP;
}
function settleGestures(s: GameState): void {
  for (const r of FL_REVEALS) if (r.kind === "geste" && !isRevealed(s, r.id) && r.ready(s)) note(s, r.id);
}
/** Une action du joueur : ce qu'elle fait paraître compte comme nouveauté, tout de suite. */
export function acted(s: GameState): void {
  settleGestures(s);
}
/** La file : les gestes prêts passent ; puis, si la place est libre, la première ligne « jeu » prête. */
export function revealQueue(s: GameState): void {
  settleGestures(s);
  if (!gapFree(s)) return;
  const next = FL_REVEALS.find((r) => r.kind === "jeu" && !isRevealed(s, r.id) && r.ready(s));
  if (next) note(s, next.id);
}
