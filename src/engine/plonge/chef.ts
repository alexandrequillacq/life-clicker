import type { GameState } from "../state";
import { PLATES_PER_COVER, ASK_GAP_DAYS, ASK_EMPTY_SECS, LIVRET_RATE, ASKS, SUNDAY_OFFER, DAY_NAMES, TEXTES, type AskDef } from "../content/plonge";
import { fmtEuros, onThePhone } from "./commun";
import { dayIndex } from "./restaurant";
import { acted, isRevealed } from "./revelations";

// Le chef : les demandes (le joueur réclame lui-même plus de travail, au même tarif), le dimanche,
// et la banque (le livret A, l'argent qui travaille pour toi).

// --- Les demandes au chef ---

export function currentAsk(s: GameState): AskDef | null {
  return ASKS[s.plonge.asksDone] ?? null;
}
/** « Le chef » paraît un moment après la réparation du vieux lave-vaisselle. */
export function chefVisible(s: GameState): boolean {
  return s.job === "plongeur" && isRevealed(s, "chef");
}
function askedToday(s: GameState): boolean {
  return dayIndex(s) - s.plonge.lastAskDay < ASK_GAP_DAYS;
}
/**
 * Le chef veut bien grandir si tu suis : moins d'une brassée d'assiettes sales (ce que lave un clic)
 * pendant ASK_EMPTY_SECS dans la journée. Au plus une demande par jour.
 */
export function canAskChef(s: GameState): boolean {
  const p = s.plonge;
  return (
    chefVisible(s) &&
    currentAsk(s) !== null &&
    p.emptyToday >= ASK_EMPTY_SECS &&
    !askedToday(s) &&
    !onThePhone(s)
  );
}
/** Ce que le chef attend pour dire oui, et où tu en es aujourd'hui (le bouton grisé donne la cible). */
export function askStatus(s: GameState): string[] {
  if (askedToday(s)) return [TEXTES.askedToday];
  return [
    TEXTES.askTarget(Math.max(1, s.dishesPerClick), ASK_EMPTY_SECS),
    TEXTES.askProgress(Math.min(ASK_EMPTY_SECS, Math.floor(s.plonge.emptyToday)), ASK_EMPTY_SECS),
  ];
}
export function askEffects(s: GameState, def: AskDef): string[] {
  const out: string[] = [];
  if (def.covers) out.push(TEXTES.askCovers(s.plonge.covers, s.plonge.covers + def.covers));
  if (def.covers && s.plonge.asksDone === 0) out.push(TEXTES.coverPlates(PLATES_PER_COVER));
  if (def.sunday) out.push(TEXTES.openDays(DAY_NAMES.length - 1, DAY_NAMES.length));
  if (def.note) out.push(def.note);
  return out;
}
function applyAsk(s: GameState, def: AskDef): void {
  if (def.covers) s.plonge.covers += def.covers;
  if (def.sunday) s.plonge.sundayOpen = true;
  if (def.chef) s.plonge.chef = def.chef;
}
export function askChef(s: GameState): boolean {
  if (!canAskChef(s)) return false;
  applyAsk(s, currentAsk(s)!);
  s.plonge.asksDone += 1;
  s.plonge.lastAskDay = dayIndex(s);
  acted(s);
  return true;
}
/** Ouvrir le dimanche : une proposition unique, un moment après le panier, une fois que Maman a appelé. */
export function canOfferSunday(s: GameState): boolean {
  const p = s.plonge;
  return s.job === "plongeur" && !p.sundayOpen && isRevealed(s, "dimanche");
}
export function offerSunday(s: GameState): boolean {
  if (!canOfferSunday(s) || onThePhone(s)) return false;
  applyAsk(s, SUNDAY_OFFER);
  acted(s);
  return true;
}

// --- Le livret A : l'argent qui travaille pour toi ---

/** Le livret A se propose un moment après le détartrage, une fois que Maman a appelé en plein service. */
export function canOpenLivret(s: GameState): boolean {
  const p = s.plonge;
  return s.job === "plongeur" && !p.livret && isRevealed(s, "livret");
}
export function livretEffects(s: GameState): string[] {
  return [
    TEXTES.livretEach(Math.round(LIVRET_RATE * 100)),
    TEXTES.livretToday(fmtEuros(s.money.toNumber() * LIVRET_RATE)),
  ];
}
export function openLivret(s: GameState): boolean {
  if (!canOpenLivret(s) || onThePhone(s)) return false;
  s.plonge.livret = true;
  s.plonge.chef = "banque";
  acted(s);
  return true;
}
export function livretLine(s: GameState): string {
  return s.plonge.lastInterest > 0
    ? TEXTES.livretLast(fmtEuros(s.plonge.lastInterest))
    : TEXTES.livretRate(Math.round(LIVRET_RATE * 100));
}
