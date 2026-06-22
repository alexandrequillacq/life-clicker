import { describe, it, expect } from "vitest";
import { createInitialState } from "../src/engine/state";
import { buyHome, canBuyHome } from "../src/engine/actions";
import { HOMES, currentHome, nextHome } from "../src/engine/content/homes";

describe("logement (décor de fond)", () => {
  it("démarre au sous-sol", () => {
    const s = createInitialState(0);
    expect(currentHome(s.homeLevel).label).toBe("Sous-sol");
  });

  it("acheter le logement suivant débite et monte d'un niveau", () => {
    const s = createInitialState(0);
    const next = nextHome(s.homeLevel)!;
    s.money = next.cost.add(10);
    expect(canBuyHome(s)).toBe(true);
    buyHome(s);
    expect(s.homeLevel).toBe(1);
    expect(s.money.toNumber()).toBeCloseTo(10);
    expect(currentHome(s.homeLevel).label).toBe("Premier logement");
  });

  it("ne s'achète pas sans les fonds", () => {
    const s = createInitialState(0);
    s.money = nextHome(0)!.cost.sub(1);
    expect(canBuyHome(s)).toBe(false);
    expect(buyHome(s)).toBe(false);
    expect(s.homeLevel).toBe(0);
  });

  it("la villa est le dernier niveau", () => {
    const s = createInitialState(0);
    s.homeLevel = HOMES.length - 1;
    expect(nextHome(s.homeLevel)).toBeNull();
    expect(canBuyHome(s)).toBe(false);
  });

  it("chaque logement a un décor de fond non vide", () => {
    for (const h of HOMES) expect(h.bg.length).toBeGreaterThan(0);
  });
});
