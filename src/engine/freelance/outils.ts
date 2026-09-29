import type { GameState } from "../state";
import { TOOLS, TOOL_BY_ID, FORMATION_BUG_RATE, BEHIND_SECS, TOOL_LATE, type ToolDef } from "../content/freelance";
import { spend } from "./finances";
import { isRevealed, acted } from "./revelations";

// Les outils : automatiser ton travail est sain et célébré. Un à la fois, quand tu ne suis plus.

/** L'outil n° i est-il prêt à se proposer (pour la file des nouveautés) ? */
export function toolReady(s: GameState, i: number): boolean {
  const f = s.freelance;
  const t = TOOLS[i];
  if (f.tools[t.id] !== undefined || f.delivered < 1) return false;
  if (i > 0 && f.tools[TOOLS[i - 1].id] === undefined) return false;
  if (t.needs === "chambre" && f.home < 1) return false;
  if (t.needs === "bugs" && f.bugArrivals.length < 3) return false;
  const since = i > 0 ? f.tools[TOOLS[i - 1].id] : f.firstDeliveryAt;
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
