import { describe, it, expect } from "vitest";
import { D } from "../src/engine/numbers";
import { costOf } from "../src/engine/economy";

describe("costOf", () => {
  it("vaut le prix de base quand rien n'est possédé", () => {
    expect(costOf(D(10), 1.15, 0).toNumber()).toBeCloseTo(10);
  });
  it("croît de ×1,15 par unité possédée", () => {
    expect(costOf(D(10), 1.15, 1).toNumber()).toBeCloseTo(11.5);
  });
  it("somme correctement un achat groupé (série géométrique)", () => {
    // 10 + 11.5 = 21.5 pour 2 unités à partir de 0
    expect(costOf(D(10), 1.15, 0, 2).toNumber()).toBeCloseTo(21.5);
  });
});
