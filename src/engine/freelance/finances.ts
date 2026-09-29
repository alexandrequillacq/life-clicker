import type { GameState, FlLedger } from "../state";

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
