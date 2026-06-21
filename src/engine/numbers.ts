import Decimal from "break_infinity.js";

export type { Decimal };
export const D = (x: Decimal.Value): Decimal => new Decimal(x);
export const ZERO: Decimal = new Decimal(0);

export function fmtMoney(value: Decimal): string {
  if (value.lt(1)) {
    return `${value.mul(100).toFixed(0)} c`;
  }
  if (value.lt(1e6)) {
    return `${value.toFixed(2)} €`;
  }
  return `${value.toExponential(2).replace("e+", "e")} €`;
}
