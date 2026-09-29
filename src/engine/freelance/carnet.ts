import type { GameState, FlOrder, FlBug } from "../state";
import {
  KINDS,
  CLIENTS,
  DUVAL,
  PETIT,
  CLICK_ENERGY,
  TIRED_BELOW,
  TIRED_SHARE,
  BUG_CLICKS,
  type Kind,
  type ClientDef,
} from "../content/freelance";
import { handsFree } from "./commun";
import { earn } from "./finances";
import { acted } from "./revelations";

// Le carnet : les commandes à construire, les bugs à corriger (toujours en tête), le clic et l'IA.
// Un clic écrit des lignes (moitié moins fatigué) ; l'IA écrit seule, sur les commandes seulement,
// et ne se fatigue jamais : c'est une machine.

export const ALL_CLIENTS: ClientDef[] = [DUVAL, PETIT, ...CLIENTS.vitrine, ...CLIENTS.appli, ...CLIENTS.boutique];
export function clientOf(name: string): ClientDef {
  return ALL_CLIENTS.find((c) => c.name === name) ?? { name, chez: name, payer: name };
}

/** Lignes d'une nouvelle commande : le thème pro allège vitrines et boutiques, le test désactivé allège tout. */
export function orderLines(s: GameState, kind: Kind): number {
  const f = s.freelance;
  const theme = kind === "appli" ? 1 : f.themeMult;
  return Math.round(KINDS[kind].lines * theme * f.compMult);
}
/** Une commande arrive au bout du carnet ; sans client nommé, le suivant de la liste. */
export function addOrder(s: GameState, kind: Kind, client?: string): FlOrder {
  const f = s.freelance;
  let name = client;
  if (!name) {
    const pool = CLIENTS[kind];
    name = pool[f.clientIndex[kind] % pool.length].name;
    f.clientIndex[kind] += 1;
  }
  const o: FlOrder = { id: f.nextId++, kind, client: name, lines: orderLines(s, kind), done: 0, red: "none" };
  f.orders.push(o);
  return o;
}

export type Task = { type: "bug"; bug: FlBug } | { type: "order"; order: FlOrder } | null;
/** Ce que ton prochain clic fait : le premier bug, sinon la première commande qui n'est pas bloquée. */
export function currentTask(s: GameState): Task {
  const f = s.freelance;
  if (f.bugs.length > 0) return { type: "bug", bug: f.bugs[0] };
  const order = f.orders.find((o) => o.red !== "failing");
  return order ? { type: "order", order } : null;
}

export const isTired = (s: GameState): boolean => s.energy < TIRED_BELOW;
export const clickShare = (s: GameState): number => (isTired(s) ? TIRED_SHARE : 1);
export const clickLines = (s: GameState): number => s.freelance.lpc * clickShare(s);

export function canWork(s: GameState): boolean {
  return s.job === "freelance" && handsFree(s) && currentTask(s) !== null;
}

/** Écrire du code, ou corriger le bug en tête. L'énergie ralentit sans bloquer. */
export function workClick(s: GameState): boolean {
  if (!canWork(s)) return false;
  const task = currentTask(s)!;
  const share = clickShare(s);
  s.totalClicks += 1;
  s.energy = Math.max(0, s.energy - CLICK_ENERGY);
  if (task.type === "bug") {
    task.bug.clicks += share;
    if (task.bug.clicks >= BUG_CLICKS - 1e-9) fixBug(s, task.bug);
  } else {
    task.order.done = Math.min(task.order.lines, task.order.done + s.freelance.lpc * share);
  }
  deliverReady(s);
  acted(s);
  return true;
}

/** Un bug corrigé : son site repaiera lundi ; un test rouge corrigé débloque sa commande. */
export function fixBug(s: GameState, bug: FlBug): void {
  const f = s.freelance;
  f.bugs = f.bugs.filter((b) => b.id !== bug.id);
  if (bug.site !== null) {
    const site = f.sites.find((x) => x.id === bug.site);
    if (site) site.bugOpen = false;
  }
  if (bug.order !== null) {
    const order = f.orders.find((o) => o.id === bug.order);
    if (order) order.red = "passed";
  }
}

/** L'IA écrit seule, sur la première commande qui n'est pas bloquée (jamais sur un bug). */
export function aiWrite(s: GameState, t: number): void {
  const f = s.freelance;
  if (f.aiRate <= 0) return;
  const o = f.orders.find((x) => x.red !== "failing");
  if (!o) return;
  o.done = Math.min(o.lines, o.done + f.aiRate * t);
  deliverReady(s);
}

/** Les commandes finies partent, dans l'ordre du carnet. */
export function deliverReady(s: GameState): void {
  const f = s.freelance;
  while (f.orders.length > 0) {
    const o = f.orders[0];
    if (o.done < o.lines - 1e-9 || o.red === "failing") return;
    // [tests rouges]
    f.orders.shift();
    deliver(s, o);
  }
}

function deliver(s: GameState, o: FlOrder): void {
  const f = s.freelance;
  f.delivered += 1;
  if (f.firstDeliveryAt < 0) f.firstDeliveryAt = f.day;
  // Pour facturer Mme Duval, il faut une micro-entreprise (voir entreprise.ts).
  if (o.client === DUVAL.name && f.company === null) {
    f.pendingInvoice = true;
    return;
  }
  earn(s, KINDS[o.kind].price, "livraisons");
  // [après une livraison]
}

export function pendingLines(s: GameState): number {
  return s.freelance.orders.reduce((n, o) => n + Math.max(0, o.lines - o.done), 0);
}
/** € à la livraison de toutes les commandes du carnet. */
export function waitingValue(s: GameState): number {
  return s.freelance.orders.reduce((n, o) => n + KINDS[o.kind].price, 0);
}
