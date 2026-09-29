import { emptyLedger, type GameState, type FlLedger } from "../state";
import { HOMES, NORA_SALARY, LIVRET_RATE, FL_DAY_SECS } from "../content/freelance";
import { maintenancePossible } from "./carnet";
import { acted } from "./revelations";

// L'argent de la semaine : un seul compte courant, des entrées, des charges pro et perso, et des achats à part.

type Field = Exclude<keyof FlLedger, "entretienPossible" | "repasCount">;

export function earn(s: GameState, n: number, field: Field): void {
  if (n === 0) return;
  s.money = s.money.add(n);
  s.freelance.ledger[field] += n;
}
/** Une dépense passe même sans argent : le compte peut être négatif (on ne coupe ni le loyer ni l'IA). */
export function spend(s: GameState, n: number, field: Field): void {
  if (n === 0) return;
  s.money = s.money.sub(n);
  s.freelance.ledger[field] += n;
}

export const entrees = (l: FlLedger): number => l.livraisons + l.entretien + l.livret;
export const chargesPro = (l: FlLedger): number => l.abonnements + l.salaires;
export const chargesPerso = (l: FlLedger): number => l.loyer + l.repas + l.sorties;
/** Le net de la semaine : les achats uniques n'y sont pas (sinon il plonge à chaque outil). */
export const net = (l: FlLedger): number => entrees(l) - chargesPro(l) - chargesPerso(l);

export const subsTotal = (s: GameState): number => Object.values(s.freelance.subs).reduce((n, v) => n + v, 0);

/** Les intérêts du lundi : 1 % du plus petit solde de la semaine (déposer le dimanche ne rapporte rien). */
export function nextInterest(s: GameState): number {
  return Math.floor(s.freelance.livretLow * LIVRET_RATE * 100) / 100;
}

/** Le lundi matin : la semaine écoulée se clôt ; l'entretien, les charges pro, le loyer, puis le livret. */
export function mondayMorning(s: GameState): void {
  const f = s.freelance;
  const l = f.ledger;
  f.history.push({ entrees: entrees(l), net: net(l), livraisons: l.livraisons, entretien: l.entretien, charges: chargesPro(l) + chargesPerso(l) });
  f.lastWeek = f.ledger;
  f.ledger = emptyLedger();
  f.ledger.entretienPossible = maintenancePossible(s);
  earn(s, f.sites.reduce((n, x) => n + (x.bugOpen ? 0 : x.fee), 0), "entretien");
  spend(s, subsTotal(s), "abonnements");
  if (f.nora) spend(s, NORA_SALARY, "salaires");
  spend(s, HOMES[f.home].rent, "loyer");
  const interest = nextInterest(s);
  if (interest > 0) {
    f.livretBalance += interest;
    f.ledger.livret += interest; // les intérêts restent sur le livret, mais comptent dans les entrées
  }
  f.livretLow = f.livretBalance;
}

export const canDeposit = (s: GameState): boolean => s.job === "freelance" && s.money.gt(0);
export const canWithdraw = (s: GameState): boolean => s.job === "freelance" && s.freelance.livretBalance > 0;
/** Tout mettre sur le livret. Seul le plus petit solde de la semaine rapporte : un dépôt fait le lundi compte toute la semaine, un dépôt du dimanche ne rapporte rien. */
export function depositAll(s: GameState): boolean {
  if (!canDeposit(s)) return false;
  const f = s.freelance;
  const n = s.money.toNumber();
  s.money = s.money.sub(n);
  f.livretBalance += n;
  if (Math.floor(f.day / FL_DAY_SECS) % 7 === 0) f.livretLow = f.livretBalance;
  acted(s);
  return true;
}
export function withdrawAll(s: GameState): boolean {
  if (!canWithdraw(s)) return false;
  const f = s.freelance;
  s.money = s.money.add(f.livretBalance);
  f.livretBalance = 0;
  f.livretLow = 0;
  acted(s);
  return true;
}
