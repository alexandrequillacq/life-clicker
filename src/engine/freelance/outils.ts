import type { GameState } from "../state";
import { TOOLS, TOOL_BY_ID, FORMATION_BUG_RATE, BEHIND_SECS, TOOL_LATE, type ToolDef } from "../content/freelance";
import { spend } from "./finances";
import { isRevealed, acted } from "./revelations";

// Les outils : automatiser ton travail est sain et célébré. Un à la fois, quand tu ne suis plus.

/** Ce qu'il faut à l'outil : une chambre à toi (l'écran), 3 bugs en 7 jours (la formation). */
function needMet(s: GameState, t: ToolDef): boolean {
  const f = s.freelance;
  if (t.needs === "chambre") return f.home >= 1;
  if (t.needs === "bugs") return f.bugArrivals.length >= 3;
  return true;
}
/** Tu as laissé passer, depuis au moins TOOL_LATE, ce qui aurait rempli ce besoin (la chambre, l'entretien de chaque site). */
function needDeclined(s: GameState, t: ToolDef): boolean {
  const f = s.freelance;
  const declined = (reveal: string, taken: boolean): boolean => !taken && isRevealed(s, reveal) && f.day - f.revealed[reveal] >= TOOL_LATE;
  if (t.needs === "chambre") return declined("home_chambre", f.home >= 1);
  if (t.needs === "bugs") return declined("prop_entretien_tous", f.proposals.entretien_tous !== undefined);
  return false;
}

/** L'outil n° i est-il prêt à se proposer (pour la file des nouveautés) ? Dans l'ordre, un à la fois ; un outil
 *  dont tu as refusé le besoin est sauté (il se proposera quand le besoin sera rempli). */
export function toolReady(s: GameState, i: number): boolean {
  const f = s.freelance;
  const t = TOOLS[i];
  if (f.tools[t.id] !== undefined || f.delivered < 1 || !needMet(s, t)) return false;
  if (TOOLS.some((d) => f.tools[d.id] === undefined && isRevealed(s, `tool_${d.id}`))) return false; // un à la fois
  for (const d of TOOLS.slice(0, i)) if (f.tools[d.id] === undefined && (needMet(s, d) || !needDeclined(s, d))) return false;
  const bought = Object.values(f.tools);
  const since = bought.length > 0 ? Math.max(...bought) : f.firstDeliveryAt;
  return f.behind >= BEHIND_SECS || f.day - since >= TOOL_LATE;
}

export function toolOffered(s: GameState): ToolDef | undefined {
  const f = s.freelance;
  return TOOLS.find((t) => f.tools[t.id] === undefined && isRevealed(s, `tool_${t.id}`));
}
/** Ce qu'il faut en poche : le prix, plus la première semaine d'abonnement. */
export const toolPrice = (t: ToolDef): number => t.cost + t.sub;

export function canBuyTool(s: GameState, id: string): boolean {
  const t = TOOL_BY_ID[id];
  return s.job === "freelance" && !!t && toolOffered(s)?.id === id && s.money.gte(toolPrice(t));
}

export function buyTool(s: GameState, id: string): boolean {
  if (!canBuyTool(s, id)) return false;
  const f = s.freelance;
  const t = TOOL_BY_ID[id];
  spend(s, t.cost, "achats");
  spend(s, t.sub, "abonnements");
  f.tools[id] = f.day;
  if (t.lpc) f.lpc = t.lpc;
  if (t.aiRate) f.aiRate = t.aiRate;
  if (t.theme) f.themeMult = t.theme;
  if (t.formation) {
    f.bugRate = FORMATION_BUG_RATE;
    f.tests = true;
  }
  if (t.replaces) delete f.subs[t.replaces];
  if (t.sub) f.subs[id] = t.sub;
  if (t.weekly) f.weekly.push(...t.weekly);
  acted(s);
  return true;
}

/** Ce que tu possèdes (l'abonnement remplacé n'y est plus). */
export function ownedTools(s: GameState): ToolDef[] {
  const f = s.freelance;
  const replaced = new Set(TOOLS.filter((t) => f.tools[t.id] !== undefined && t.replaces).map((t) => t.replaces));
  return TOOLS.filter((t) => f.tools[t.id] !== undefined && !replaced.has(t.id));
}
