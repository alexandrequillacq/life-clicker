import { D, type Decimal } from "../numbers";
import type { GameState } from "../state";
import { CYCLE_COURT_MULT, RELAUNCH_SECS, EQUIPMENT_BY_ID, TEXTES, type EquipmentDef } from "../content/plonge";
import { fmtEuros, fmtRate, markAction, onThePhone } from "./commun";
import { openDayArrivalRate, openDaysShare } from "./restaurant";
import { acted, isRevealed } from "./revelations";

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
  return TEXTES.autoIncome(s.plonge.proRate > 0, fmtEuros(autoIncomePerMin(s)));
}
function incomeEffects(s: GameState, now: number, after: number, plural = s.plonge.proRate > 0): string[] {
  const a = autoIncomeFor(s, now);
  const b = autoIncomeFor(s, after);
  const out = b - a >= 0.005 ? [TEXTES.incomeChange(plural, fmtEuros(a), fmtEuros(b))] : []; // jamais « A → A »
  if (after >= openDayArrivalRate(s)) out.push(TEXTES.incomeCapped);
  return out;
}
/** Revenu hors-ligne au plongeur : les machines seules, limitées par ce que le restaurant salit. */
export function plongeOfflineIncomePerSec(s: GameState): Decimal {
  return D(autoIncomePerMin(s) / 60);
}

// --- Équipement ---

export function equipmentVisible(s: GameState, def: EquipmentDef): boolean {
  return s.job === "plongeur" && !s.plonge.equipment[def.id] && isRevealed(s, def.id);
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
  acted(s);
  return true;
}
/** Sous-titres chiffrés : la statistique qui change avec cet achat (règle dure : toujours affichée). */
export function equipmentEffects(s: GameState, def: EquipmentDef): string[] {
  const out: string[] = [];
  if (def.dishesPerClick !== undefined) out.push(TEXTES.perClick(s.dishesPerClick, def.dishesPerClick));
  if (def.watch) out.push(...TEXTES.watch);
  const cc = s.plonge.cycleCourt ? CYCLE_COURT_MULT : 1;
  if (def.oldRate !== undefined) {
    const after = def.oldRate * cc;
    out.push(TEXTES.oldMachine(fmtRate(0), fmtRate(after)));
    out.push(TEXTES.repairIncome(fmtEuros(autoIncomeFor(s, after))));
  }
  if (def.oldMult !== undefined) {
    const now = oldMachineRate(s) * cc;
    const after = now * def.oldMult;
    out.push(TEXTES.oldMachine(fmtRate(now), fmtRate(after)));
    out.push(...incomeEffects(s, machineRate(s), machineRate(s) - now + after));
  }
  if (def.proRate !== undefined) {
    const now = machineRate(s);
    const after = now + def.proRate * cc;
    out.push(TEXTES.bothMachines(fmtRate(now), fmtRate(after)));
    out.push(...incomeEffects(s, now, after, true));
    if (s.plonge.cycleCourt) out.push(TEXTES.proNoGreasy);
  }
  if (def.note) out.push(def.note);
  return out;
}

// --- Le compromis : le cycle court ---

export function cycleCourtAvailable(s: GameState): boolean {
  return s.job === "plongeur" && !s.plonge.cycleCourt && isRevealed(s, "cycle_court");
}
export function cycleCourtEffects(s: GameState): string[] {
  const now = machineRate(s);
  const after = now * CYCLE_COURT_MULT;
  return [
    TEXTES.bothMachines(fmtRate(now), fmtRate(after)),
    ...incomeEffects(s, now, after),
    TEXTES.cycleCourtGreasy,
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
