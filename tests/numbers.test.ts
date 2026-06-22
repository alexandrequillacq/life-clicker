import { describe, it, expect } from "vitest";
import { D, ZERO, fmtMoney, fmtNumber } from "../src/engine/numbers";

describe("numbers", () => {
  it("D crée un Decimal additionnable", () => {
    expect(D(0.05).add(D(0.05)).toNumber()).toBeCloseTo(0.1);
  });
  it("ZERO vaut 0", () => {
    expect(ZERO.toNumber()).toBe(0);
  });
});

describe("fmtMoney : petits montants", () => {
  it("centimes sous 1 €", () => {
    expect(fmtMoney(D(0.05))).toBe("5 c");
  });
  it("2 décimales (virgule) entre 1 et 10 €", () => {
    expect(fmtMoney(D(5.5))).toBe("5,50 €");
  });
  it("entier groupé entre 10 € et 10 000 €", () => {
    expect(fmtMoney(D(12.3))).toBe("12 €");
    expect(fmtMoney(D(1250))).toBe("1 250 €");
    expect(fmtMoney(D(9999))).toBe("9 999 €");
  });
});

describe("fmtMoney : échelles abrégées", () => {
  it("passe en « k » à partir de 10 000 €", () => {
    expect(fmtMoney(D(10000))).toBe("10k €");
    expect(fmtMoney(D(12500))).toBe("12,5k €");
    expect(fmtMoney(D(250000))).toBe("250k €");
  });
  it("passe en « M » à 1 000 000 € (2 décimales)", () => {
    expect(fmtMoney(D(1_000_000))).toBe("1,00M €");
    expect(fmtMoney(D(1.23e8))).toBe("123,00M €");
  });
  it("passe en « milliard » à 1e9, accord du pluriel", () => {
    expect(fmtMoney(D(1e9))).toBe("1,00 milliard €");
    expect(fmtMoney(D(2.5e9))).toBe("2,50 milliards €");
  });
  it("monte jusqu'au trilliard via la notation longue française", () => {
    expect(fmtMoney(D("1e12"))).toBe("1,00 billion €");
    expect(fmtMoney(D("1e15"))).toBe("1,00 billiard €");
    expect(fmtMoney(D("1e18"))).toBe("1,00 trillion €");
    expect(fmtMoney(D("1e21"))).toBe("1,00 trilliard €");
    expect(fmtMoney(D("5e21"))).toBe("5,00 trilliards €");
  });
  it("garde le trilliard jusqu'à 10 000 trilliards, puis passe en 10eX", () => {
    expect(fmtMoney(D("1e24"))).toBe("1000,00 trilliards €"); // 1000 trilliards
    expect(fmtMoney(D("1e25"))).toBe("1,00e25 €"); // au-delà de 10 000 trilliards
  });
});

describe("fmtNumber : compteurs (followers)", () => {
  it("entier groupé sous 10 000", () => {
    expect(fmtNumber(D(500))).toBe("500");
    expect(fmtNumber(D(9999))).toBe("9 999");
  });
  it("même échelle abrégée au-delà", () => {
    expect(fmtNumber(D(12000))).toBe("12k");
    expect(fmtNumber(D(50_000_000))).toBe("50,00M");
  });
});
