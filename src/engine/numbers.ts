import Decimal, { type DecimalSource } from "break_infinity.js";

export type { Decimal, DecimalSource };
export const D = (x: DecimalSource): Decimal => new Decimal(x);
export const ZERO: Decimal = new Decimal(0);

// Paliers d'échelle (notation longue française : milliard 10^9, billion 10^12, trilliard 10^21).
const E4 = new Decimal("1e4");
const E6 = new Decimal("1e6");
const E9 = new Decimal("1e9");
const E12 = new Decimal("1e12");
const E15 = new Decimal("1e15");
const E18 = new Decimal("1e18");
const E21 = new Decimal("1e21");
const E25 = new Decimal("1e25"); // 10 000 trilliards : au-delà, on passe en notation 10eX

function comma(s: string): string {
  return s.replace(".", ",");
}

/** Groupe les milliers avec une espace (1 250). */
function groupInt(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** Mantisse à 2 décimales, virgule française, plus le mot (au pluriel à partir de 2). */
function named(value: Decimal, scale: Decimal, word: string): string {
  const m = value.div(scale).toNumber();
  return `${comma(m.toFixed(2))} ${word}${m >= 2 ? "s" : ""}`;
}

/** Forme abrégée pour value >= 1e4, sans symbole monétaire. */
function bigScale(value: Decimal): string {
  if (value.gte(E25)) return comma(value.toExponential(2).replace("e+", "e"));
  if (value.gte(E21)) return named(value, E21, "trilliard");
  if (value.gte(E18)) return named(value, E18, "trillion");
  if (value.gte(E15)) return named(value, E15, "billiard");
  if (value.gte(E12)) return named(value, E12, "billion");
  if (value.gte(E9)) return named(value, E9, "milliard");
  if (value.gte(E6)) return `${comma(value.div(E6).toNumber().toFixed(2))}M`;
  // 1e4 .. 1e6 : milliers, 1 décimale, « ,0 » supprimé
  let k = value.div(1000).toNumber().toFixed(1);
  if (k.endsWith(".0")) k = k.slice(0, -2);
  return `${comma(k)}k`;
}

/** Formate un compteur (followers, etc.) : entier groupé en dessous de 10 000, sinon échelle abrégée. */
export function fmtNumber(value: Decimal): string {
  if (value.lt(E4)) return groupInt(value.toNumber());
  return bigScale(value);
}

export function fmtMoney(value: Decimal): string {
  if (value.lt(1)) return `${Math.round(value.mul(100).toNumber())} c`;
  if (value.lt(10)) return `${comma(value.toNumber().toFixed(2))} €`;
  // Au-delà de 10 €, on n'affiche plus les centimes (ils défileraient sans cesse).
  if (value.lt(E4)) return `${groupInt(value.toNumber())} €`;
  return `${bigScale(value)} €`;
}
