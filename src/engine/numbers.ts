import Decimal, { type DecimalSource } from "break_infinity.js";

export type { Decimal, DecimalSource };
export const D = (x: DecimalSource): Decimal => new Decimal(x);
export const ZERO: Decimal = new Decimal(0);

/** Formate un compteur (followers, etc.) : entier en dessous d'un million, sinon notation scientifique. */
export function fmtNumber(value: Decimal): string {
  if (value.lt(1e6)) return value.toFixed(0);
  return value.toExponential(2).replace("e+", "e");
}

export function fmtMoney(value: Decimal): string {
  if (value.lt(1)) {
    return `${value.mul(100).toFixed(0)} c`;
  }
  if (value.lt(10)) {
    return `${value.toFixed(2)} €`;
  }
  // Au-delà de 10 €, on n'affiche plus les centimes (ils défileraient sans cesse).
  if (value.lt(1e6)) {
    return `${value.toFixed(0)} €`;
  }
  return `${value.toExponential(2).replace("e+", "e")} €`;
}
