import { describe, it, expect } from "vitest";
import { D, ZERO, fmtMoney } from "../src/engine/numbers";

describe("numbers", () => {
  it("D crée un Decimal additionnable", () => {
    expect(D(0.05).add(D(0.05)).toNumber()).toBeCloseTo(0.1);
  });
  it("ZERO vaut 0", () => {
    expect(ZERO.toNumber()).toBe(0);
  });
  it("fmtMoney affiche les centimes sous 1 €", () => {
    expect(fmtMoney(D(0.05))).toBe("5 c");
  });
  it("fmtMoney affiche 2 décimales entre 1 et 10 €", () => {
    expect(fmtMoney(D(5.5))).toBe("5.50 €");
  });
  it("fmtMoney n'affiche plus les centimes au-delà de 10 €", () => {
    expect(fmtMoney(D(12.3))).toBe("12 €");
  });
  it("fmtMoney passe en exponentiel pour les grands nombres", () => {
    expect(fmtMoney(D(1.23e8))).toBe("1.23e8 €");
  });
});
