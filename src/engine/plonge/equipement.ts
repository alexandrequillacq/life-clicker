import { D, type Decimal } from "../numbers";
import type { GameState } from "../state";
import { CYCLE_COURT_MULT, RELAUNCH_SECS, EQUIPMENT_BY_ID, type EquipmentDef } from "../content/plonge";
import { fmtEuros, fmtRate, markAction, onThePhone, isRevealed } from "./commun";
import { openDayArrivalRate, openDaysShare } from "./restaurant";
import { novelty } from "./revelations";

// L'équipement (objets uniques) et les machines, qui prennent le relais du clic et ne se fatiguent pas.

// --- Capacités ---

export function oldMachineRate(s: GameState): number {
  return s.plonge.oldRate * s.plonge.oldMult;
}
/** Débit nominal des machines (assiettes/s), cycle court compris. */
export function machineRate(s: GameState): number {
  const base = oldMachineRate(s) + s.plonge.proRate;
  return s.plonge.cycleCourt ? base * CYCLE_COURT_MULT : base;
}
export function machineRunning(s: GameState): boolean {
  return !s.plonge.greasy && s.plonge.relaunchLeft <= 0;
}

// --- Revenu automatique ---

/** Ce que rapportent des machines de ce débit, sans toi : limité par ce que le restaurant salit. */
function autoIncomeFor(s: GameState, rate: number): number {
  return Math.min(rate, openDayArrivalRate(s)) * openDaysShare(s) * s.valuePerDish.toNumber() * 60;
}
/** L'argent qui tombe tout seul, en € / min (hors clic) ; 0 quand la machine est à l'arrêt. */
export function autoIncomePerMin(s: GameState): number {
  return machineRunning(s) ? autoIncomeFor(s, machineRate(s)) : 0;
}
/** Libellé du revenu automatique (au pluriel une fois le lave-vaisselle pro installé). */
export function autoIncomeLine(s: GameState): string {
  const who = s.plonge.proRate > 0 ? "Les lave-vaisselle te rapportent" : "Le lave-vaisselle te rapporte";
  return `${who} ${fmtEuros(autoIncomePerMin(s))} / min`;
}
function incomeEffects(s: GameState, now: number, after: number, plural = s.plonge.proRate > 0): string[] {
  const who = plural ? "Les lave-vaisselle te rapportent" : "Il te rapporte";
  const a = autoIncomeFor(s, now);
  const b = autoIncomeFor(s, after);
  const out = b - a >= 0.005 ? [`${who} : ${fmtEuros(a)} → ${fmtEuros(b)} / min`] : [];
  if (after >= openDayArrivalRate(s)) out.push("Pas plus : le restaurant ne salit pas plus d'assiettes.");
  return out;
}
/** Revenu hors-ligne au plongeur : les machines seules, limitées par ce que le restaurant salit. */
export function plongeOfflineIncomePerSec(s: GameState): Decimal {
  return D(autoIncomePerMin(s) / 60);
}

// --- Équipement ---

export function equipmentVisible(s: GameState, def: EquipmentDef): boolean {
  const p = s.plonge;
  if (s.job !== "plongeur" || p.equipment[def.id]) return false;
  if (def.revealAt !== undefined && p.day < def.revealAt) return false;
  if (def.reveal && !isRevealed(s, def.reveal)) return false;
  if (!def.requires) return true;
  if (!p.equipment[def.requires]) return false;
  return def.revealDelay === undefined || p.day >= (p.boughtAt[def.requires] ?? 0) + def.revealDelay;
}
export function canBuyEquipment(s: GameState, id: string): boolean {
  const def = EQUIPMENT_BY_ID[id];
  return !!def && equipmentVisible(s, def) && s.money.gte(def.cost) && !onThePhone(s);
}
export function buyEquipment(s: GameState, id: string): boolean {
  if (!canBuyEquipment(s, id)) return false;
  const def = EQUIPMENT_BY_ID[id];
  s.money = s.money.sub(def.cost);
  s.plonge.equipment[id] = true;
  s.plonge.boughtAt[id] = s.plonge.day;
  if (def.dishesPerClick !== undefined) s.dishesPerClick = def.dishesPerClick;
  if (def.oldRate !== undefined) s.plonge.oldRate = def.oldRate;
  if (def.oldMult !== undefined) s.plonge.oldMult *= def.oldMult;
  if (def.proRate !== undefined) {
    s.plonge.proRate = def.proRate;
    s.plonge.greasy = false; // le lave-vaisselle pro ne sort pas d'assiettes grasses
  }
  if (def.chef) s.plonge.chef = def.chef;
  if (def.novelty) novelty(s);
  markAction(s);
  return true;
}
/** Sous-titres chiffrés : la statistique qui change avec cet achat (règle dure : toujours affichée). */
export function equipmentEffects(s: GameState, def: EquipmentDef): string[] {
  const out: string[] = [];
  if (def.dishesPerClick !== undefined) out.push(`Par clic : ${s.dishesPerClick} → ${def.dishesPerClick} assiettes`);
  if (def.watch) out.push("Affiche le jour de la semaine", "Et le coup de feu de midi : la moitié des assiettes du jour");
  const cc = s.plonge.cycleCourt ? CYCLE_COURT_MULT : 1;
  if (def.oldRate !== undefined) {
    const after = def.oldRate * cc;
    out.push(`Vieux lave-vaisselle : 0 → ${fmtRate(after)} assiettes / s`);
    out.push(`Il te rapporte ${fmtEuros(autoIncomeFor(s, after))} / min, même sans toi.`);
  }
  if (def.oldMult !== undefined) {
    const now = oldMachineRate(s) * cc;
    const after = now * def.oldMult;
    out.push(`Vieux lave-vaisselle : ${fmtRate(now)} → ${fmtRate(after)} assiettes / s`);
    out.push(...incomeEffects(s, machineRate(s), machineRate(s) - now + after));
  }
  if (def.proRate !== undefined) {
    const now = machineRate(s);
    const after = now + def.proRate * cc;
    out.push(`Lave-vaisselle : ${fmtRate(now)} → ${fmtRate(after)} assiettes / s`);
    out.push(...incomeEffects(s, now, after, true));
    if (s.plonge.cycleCourt) out.push("Plus d'assiettes grasses : il lave bien, même en cycle court.");
  }
  if (def.note) out.push(def.note);
  return out;
}

// --- Le compromis : le cycle court ---

export function cycleCourtAvailable(s: GameState): boolean {
  return s.job === "plongeur" && !s.plonge.cycleCourt && !!s.plonge.equipment["joint"];
}
export function cycleCourtEffects(s: GameState): string[] {
  const now = machineRate(s);
  const after = now * CYCLE_COURT_MULT;
  return [
    `Lave-vaisselle : ${fmtRate(now)} → ${fmtRate(after)} assiettes / s`,
    ...incomeEffects(s, now, after),
    "Certaines assiettes ressortent grasses.",
  ];
}
export function setCycleCourt(s: GameState): boolean {
  if (!cycleCourtAvailable(s) || onThePhone(s)) return false;
  s.plonge.cycleCourt = true;
  markAction(s);
  return true;
}
/** Relancer un cycle : on relave, la machine ne sort rien pendant RELAUNCH_SECS. */
export function relaunchCycle(s: GameState): boolean {
  if (!s.plonge.greasy || onThePhone(s)) return false;
  s.plonge.greasy = false;
  s.plonge.relaunchLeft = RELAUNCH_SECS;
  markAction(s);
  return true;
}
/** Les ranger quand même : rien de perdu pour toi. Le client paiera au service suivant. */
export function shelveGreasy(s: GameState): boolean {
  if (!s.plonge.greasy || onThePhone(s)) return false;
  s.plonge.greasy = false;
  s.plonge.shelved += 1;
  s.plonge.complaint = true;
  markAction(s);
  return true;
}
