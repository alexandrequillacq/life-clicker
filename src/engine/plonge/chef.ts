import type { GameState } from "../state";
import { PLATES_PER_COVER, ASK_GAP_DAYS, ASK_EMPTY_SECS, LIVRET_RATE, ASKS, SUNDAY_OFFER, type AskDef } from "../content/plonge";
import { fmtEuros, markAction, onThePhone, isRevealed } from "./commun";
import { dayIndex } from "./restaurant";
import { novelty } from "./revelations";

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
  if (askedToday(s)) return ["Tu as déjà proposé aujourd'hui. Le chef répondra demain."];
  const n = Math.max(1, s.dishesPerClick);
  return [
    `Le chef dit oui si tu suis : moins de ${n} assiette${n > 1 ? "s" : ""} sale${n > 1 ? "s" : ""} pendant ${ASK_EMPTY_SECS} s dans la journée`,
    `Aujourd'hui : ${Math.min(ASK_EMPTY_SECS, Math.floor(s.plonge.emptyToday))} s sur ${ASK_EMPTY_SECS}`,
  ];
}
export function askEffects(s: GameState, def: AskDef): string[] {
  const out: string[] = [];
  if (def.covers) out.push(`Couverts par jour : ${s.plonge.covers} → ${s.plonge.covers + def.covers}`);
  if (def.covers && s.plonge.asksDone === 0) out.push(`1 couvert = ${PLATES_PER_COVER} assiettes sales`);
  if (def.sunday) out.push("Jours ouverts par semaine : 6 → 7");
  if (def.note) out.push(def.note);
  return out;
}
function applyAsk(s: GameState, def: AskDef): void {
  if (def.covers) s.plonge.covers += def.covers;
  if (def.sunday) s.plonge.sundayOpen = true;
  if (def.chef) s.plonge.chef = def.chef;
  markAction(s);
}
export function askChef(s: GameState): boolean {
  if (!canAskChef(s)) return false;
  applyAsk(s, currentAsk(s)!);
  if (s.plonge.asksDone === 0) novelty(s); // les couverts s'affichent
  s.plonge.asksDone += 1;
  s.plonge.lastAskDay = dayIndex(s);
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
  novelty(s);
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
    `Chaque lundi : +${Math.round(LIVRET_RATE * 100)} % de ton argent`,
    `Aujourd'hui, ce serait +${fmtEuros(s.money.toNumber() * LIVRET_RATE)}`,
  ];
}
export function openLivret(s: GameState): boolean {
  if (!canOpenLivret(s) || onThePhone(s)) return false;
  s.plonge.livret = true;
  s.plonge.chef = "banque";
  markAction(s);
  return true;
}
export function livretLine(s: GameState): string {
  return s.plonge.lastInterest > 0
    ? `Livret A : +${fmtEuros(s.plonge.lastInterest)} lundi dernier`
    : `Livret A : ${Math.round(LIVRET_RATE * 100)} % chaque lundi`;
}
