import type { GameState, FlOrder, FlBug, FlSite } from "../state";
import {
  KINDS,
  CLIENTS,
  DUVAL,
  PETIT,
  CLICK_ENERGY,
  TIRED_BELOW,
  TIRED_SHARE,
  BUG_CLICKS,
  BUG_TEXTS,
  RED_EVERY,
  TEXTES,
  FL_WEEK_SECS,
  FIRST_BUG_MIN,
  FIRST_BUG_STEP,
  FIRST_BUG_SPREAD,
  EVENING_BUGS,
  type Kind,
  type ClientDef,
} from "../content/freelance";
import { handsFree, weekNumber } from "./commun";
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
    // Avec les tests, une livraison sur trois bute sur un test rouge (tant qu'on ne l'a pas désactivé).
    if (f.tests && o.red === "none" && f.compromis !== "taken") {
      f.reds += 1;
      if (f.reds % RED_EVERY === 0) {
        o.red = "failing";
        f.bugs.splice(f.bugs.length > 0 ? 1 : 0, 0, { id: f.nextId++, site: null, order: o.id, clicks: 0, text: TEXTES.redText });
        if (f.compromis === "none") f.compromis = "offered";
        return;
      }
      o.red = "passed";
    }
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
  if (f.maintAll) addSite(s, o.client, o.kind, f.day + FIRST_BUG_MIN + ((f.sites.length * FIRST_BUG_STEP) % FIRST_BUG_SPREAD));
  if (o.client === PETIT.name) f.quote = "petit";
}

export function pendingLines(s: GameState): number {
  return s.freelance.orders.reduce((n, o) => n + Math.max(0, o.lines - o.done), 0);
}
/** € à la livraison de toutes les commandes du carnet. */
export function waitingValue(s: GameState): number {
  return s.freelance.orders.reduce((n, o) => n + KINDS[o.kind].price, 0);
}

// --- L'entretien : chaque site sous contrat paie le lundi et envoie des bugs ---

export function addSite(s: GameState, client: string, kind: Kind, nextBug: number): FlSite {
  const f = s.freelance;
  const site: FlSite = { id: f.nextId++, client, kind, fee: KINDS[kind].fee, nextBug, bugOpen: false, bugs: 0, sinceWeek: weekNumber(s) };
  f.sites.push(site);
  return site;
}

/** Un bug arrive au bout de la file des bugs (toujours avant les commandes). Les textes tournent par site. */
export function openBug(s: GameState, site: FlSite): void {
  const f = s.freelance;
  const texts = BUG_TEXTS[site.kind];
  site.bugOpen = true;
  const text = texts[(f.sites.indexOf(site) + site.bugs) % texts.length];
  f.bugs.push({ id: f.nextId++, site: site.id, order: null, clicks: 0, text });
  site.bugs += 1;
  f.bugArrivals.push(f.day);
}

const bugPeriod = (s: GameState): number => FL_WEEK_SECS / s.freelance.bugRate;

/** Les sites envoient leurs bugs à leur heure ; on oublie ceux arrivés il y a plus de 7 jours. */
export function tickBugs(s: GameState): void {
  const f = s.freelance;
  for (const site of f.sites) {
    if (f.day < site.nextBug) continue;
    site.nextBug = f.day + bugPeriod(s);
    if (!site.bugOpen) openBug(s, site);
  }
  f.bugArrivals = f.bugArrivals.filter((t) => t > f.day - FL_WEEK_SECS);
}

/** « Répondre aux clients le soir » : le vendredi, deux sites sans bug en reçoivent un. */
export function eveningBugs(s: GameState): void {
  const f = s.freelance;
  const free = f.sites.filter((x) => !x.bugOpen).sort((a, b) => a.nextBug - b.nextBug).slice(0, EVENING_BUGS);
  for (const site of free) {
    openBug(s, site);
    site.nextBug = f.day + bugPeriod(s);
  }
}

export const bugsLast7Days = (s: GameState): number => s.freelance.bugArrivals.length;
/** € d'entretien si tout est corrigé lundi. */
export const maintenancePossible = (s: GameState): number => s.freelance.sites.reduce((n, x) => n + x.fee, 0);
/** € d'entretien que les bugs encore ouverts feraient perdre lundi. */
export const maintenanceAtStake = (s: GameState): number =>
  s.freelance.sites.reduce((n, x) => n + (x.bugOpen ? x.fee : 0), 0);
