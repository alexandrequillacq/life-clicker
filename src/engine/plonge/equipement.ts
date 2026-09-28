import { D, type Decimal } from "../numbers";
import type { GameState } from "../state";
import {
  CYCLE_COURT_MULT,
  LOAD_SECS,
  GREASY_EVERY,
  RELAUNCH_SECS,
  EQUIPMENT_BY_ID,
  CONCESSION_BY_ID,
  TEXTES,
  type EquipmentDef,
} from "../content/plonge";
import { fmtEuros, fmtRate, onThePhone } from "./commun";
import { openDayArrivalRate, openDaysShare } from "./restaurant";
import { acted, isRevealed } from "./revelations";

// L'équipement (objets uniques), les machines qui prennent le relais du clic et ne se fatiguent pas,
// et les concessions (gratuites : on lave un peu moins bien pour gagner un peu plus).

// --- Capacités ---

function has(s: GameState, concession: string): boolean {
  return !!s.plonge.concessions[concession];
}
function cycleMult(s: GameState): number {
  return has(s, "cycle_court") ? CYCLE_COURT_MULT : 1;
}
/** Le vieux lave-vaisselle seul (assiettes/s), réglages et cycle court compris. */
export function oldMachineRate(s: GameState): number {
  return s.plonge.oldRate * s.plonge.oldMult * s.plonge.machineMult * cycleMult(s);
}
/** Les lave-vaisselle pro (assiettes/s), réglages compris (le cycle court ne les concerne pas). */
export function proMachineRate(s: GameState): number {
  return s.plonge.proRate * s.plonge.machineMult;
}
/** Débit nominal de toutes les machines (assiettes/s). */
export function machineRate(s: GameState): number {
  return oldMachineRate(s) + proMachineRate(s);
}
/** Ce que les machines sortent en ce moment : le vieux ne sort rien quand il relave une fournée grasse. */
export function machineOutput(s: GameState): number {
  return (s.plonge.relaunchLeft > 0 ? 0 : oldMachineRate(s)) + proMachineRate(s);
}
/** Une fournée du vieux sur GREASY_EVERY ressort grasse en cycle court (le pro, lui, lave bien). */
export function greasyLoads(s: GameState): boolean {
  return has(s, "cycle_court") && s.plonge.proRate === 0;
}
/** Le débit moyen du vieux, relavages compris. */
function oldAverage(s: GameState, relaunch: boolean): number {
  const busy = LOAD_SECS * GREASY_EVERY;
  return relaunch && greasyLoads(s) ? (oldMachineRate(s) * busy) / (busy + RELAUNCH_SECS) : oldMachineRate(s);
}
/** Une « brassée » : ce que lave un clic, ou une seconde de machines une fois les gants posés. */
export function loadUnit(s: GameState): number {
  return Math.max(1, s.manualRetired ? machineRate(s) : s.dishesPerClick);
}

// --- Revenu automatique ---

/** Ce que rapportent des machines de ce débit, sans toi : limité par ce que le restaurant salit. */
function autoIncomeFor(s: GameState, rate: number): number {
  return Math.min(rate, openDayArrivalRate(s)) * openDaysShare(s) * s.valuePerDish.toNumber() * 60;
}
/** L'argent qui tombe tout seul, en € / min (hors clic). */
export function autoIncomePerMin(s: GameState): number {
  return autoIncomeFor(s, machineOutput(s));
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

// --- Le clic ---

function clickMult(s: GameState): number {
  let m = 1;
  for (const [id, on] of Object.entries(s.plonge.concessions)) if (on) m *= CONCESSION_BY_ID[id]?.clickMult ?? 1;
  return m;
}
function clickFor(s: GameState, base: number): number {
  return Math.round(base * clickMult(s));
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
  const p = s.plonge;
  s.money = s.money.sub(def.cost);
  p.equipment[id] = true;
  p.boughtAt[id] = p.day;
  if (def.dishesPerClick !== undefined) {
    p.clickBase = def.dishesPerClick;
    s.dishesPerClick = clickFor(s, p.clickBase);
  }
  if (def.oldRate !== undefined) p.oldRate = def.oldRate;
  if (def.oldMult !== undefined) p.oldMult *= def.oldMult;
  if (def.proRate !== undefined) {
    p.proRate += def.proRate;
    p.relaunchLeft = 0; // le lave-vaisselle pro ne sort pas d'assiettes grasses
  }
  if (def.proMult !== undefined) p.proRate *= def.proMult; // les pro déjà installés ; un neuf n'a pas été détartré
  if (def.machineMult !== undefined) p.machineMult *= def.machineMult;
  if (def.chef) p.chef = def.chef;
  acted(s);
  return true;
}
/** Sous-titres chiffrés : la statistique qui change avec cet achat (règle dure : toujours affichée). */
export function equipmentEffects(s: GameState, def: EquipmentDef): string[] {
  const p = s.plonge;
  const out: string[] = [];
  if (def.dishesPerClick !== undefined) out.push(TEXTES.perClick(s.dishesPerClick, clickFor(s, def.dishesPerClick)));
  if (def.watch) out.push(...TEXTES.watch);
  const now = machineRate(s);
  if (def.oldRate !== undefined) {
    const after = def.oldRate * p.oldMult * p.machineMult * cycleMult(s);
    out.push(TEXTES.oldMachine(fmtRate(0), fmtRate(after)));
    out.push(TEXTES.repairIncome(fmtEuros(autoIncomeFor(s, after))));
  }
  if (def.oldMult !== undefined) {
    const old = oldMachineRate(s);
    out.push(TEXTES.oldMachine(fmtRate(old), fmtRate(old * def.oldMult)));
    out.push(...incomeEffects(s, now, now + old * (def.oldMult - 1)));
  }
  if (def.proRate !== undefined) {
    const after = now + def.proRate * p.machineMult;
    out.push(TEXTES.bothMachines(fmtRate(now), fmtRate(after)));
    out.push(...incomeEffects(s, now, after, true));
    if (greasyLoads(s)) out.push(TEXTES.proNoGreasy);
  }
  if (def.proMult !== undefined) {
    const pro = proMachineRate(s);
    out.push(TEXTES.proMachines(fmtRate(pro), fmtRate(pro * def.proMult)));
    out.push(...incomeEffects(s, now, now + pro * (def.proMult - 1)));
  }
  if (def.machineMult !== undefined) {
    out.push(TEXTES.bothMachines(fmtRate(now), fmtRate(now * def.machineMult)));
    out.push(...incomeEffects(s, now, now * def.machineMult));
  }
  if (def.note) out.push(def.note);
  return out;
}

// --- Les concessions ---

export function concessionVisible(s: GameState, id: string): boolean {
  const def = CONCESSION_BY_ID[id];
  if (!def || s.job !== "plongeur" || has(s, id) || !isRevealed(s, id)) return false;
  if (def.clickMult !== undefined && s.manualRetired) return false; // les gants posés, le clic ne compte plus
  if (def.noRelaunch && !greasyLoads(s)) return false; // plus d'assiettes grasses (ou pas encore de cycle court)
  return true;
}
export function concessionEffects(s: GameState, id: string): string[] {
  const def = CONCESSION_BY_ID[id];
  const out: string[] = [];
  if (def.clickMult !== undefined) out.push(TEXTES.perClick(s.dishesPerClick, Math.round(s.plonge.clickBase * clickMult(s) * def.clickMult)));
  if (def.cycleCourt) {
    const now = machineRate(s);
    const old = oldMachineRate(s);
    out.push(TEXTES.oldMachine(fmtRate(old), fmtRate(old * CYCLE_COURT_MULT)));
    out.push(...incomeEffects(s, now, now + old * (CYCLE_COURT_MULT - 1)));
  }
  if (def.noRelaunch) {
    const a = oldAverage(s, true);
    const b = oldAverage(s, false);
    const pro = proMachineRate(s);
    out.push(TEXTES.noRelaunch(fmtRate(a), fmtRate(b)));
    out.push(...incomeEffects(s, a + pro, b + pro));
  }
  out.push(def.note);
  return out;
}
export function takeConcession(s: GameState, id: string): boolean {
  if (!concessionVisible(s, id) || onThePhone(s)) return false;
  const p = s.plonge;
  p.concessions[id] = true;
  p.boughtAt[id] = p.day;
  s.dishesPerClick = clickFor(s, p.clickBase);
  if (CONCESSION_BY_ID[id].noRelaunch) p.relaunchLeft = 0;
  acted(s);
  return true;
}
