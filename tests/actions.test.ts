import { describe, it, expect } from "vitest";
import { D } from "../src/engine/numbers";
import { createInitialState, ENERGY_MAX } from "../src/engine/state";
import {
  clickWork,
  buyGenerator,
  generatorCost,
  buyUpgrade,
  canBuyUpgrade,
  upgradeAvailable,
  poseGants,
  rest,
} from "../src/engine/actions";
import { UPGRADES_BY_ID } from "../src/engine/content/upgrades";

describe("clic", () => {
  it("lave dishesPerClick assiettes", () => {
    const s = createInitialState(0);
    clickWork(s);
    expect(s.money.toNumber()).toBeCloseTo(0.05);
    expect(s.totalClicks).toBe(1);
  });
  it("ne rapporte rien une fois les gants posés", () => {
    const s = createInitialState(0);
    poseGants(s);
    clickWork(s);
    expect(s.money.toNumber()).toBe(0);
  });
  it("garde sa pleine valeur même fatigué et ne coûte pas d'énergie (effort ponctuel)", () => {
    const s = createInitialState(0);
    s.flags.energyVisible = true;
    s.energy = 50;
    clickWork(s);
    expect(s.money.toNumber()).toBeCloseTo(0.05); // pleine valeur
    expect(s.energy).toBe(50); // inchangée
  });
});

describe("upgrades", () => {
  it("Gants fixe dishesPerClick à 2 et débite", () => {
    const s = createInitialState(0);
    s.money = UPGRADES_BY_ID["gants"].cost;
    expect(canBuyUpgrade(s, "gants")).toBe(true);
    expect(buyUpgrade(s, "gants")).toBe(true);
    expect(s.dishesPerClick).toBe(2);
    expect(s.upgrades["gants"]).toBe(true);
    expect(s.money.toNumber()).toBeCloseTo(0);
  });
  it("ne s'achète pas deux fois", () => {
    const s = createInitialState(0);
    s.money = UPGRADES_BY_ID["gants"].cost;
    buyUpgrade(s, "gants");
    expect(buyUpgrade(s, "gants")).toBe(false);
  });
  it("« Prendre le coup de main » débloque le continu à la main", () => {
    const s = createInitialState(0);
    s.upgrades["gants"] = true;
    s.upgrades["eponge"] = true;
    s.money = UPGRADES_BY_ID["coup_de_main"].cost;
    buyUpgrade(s, "coup_de_main");
    expect(s.handWashing).toBe(true);
    expect(s.handRate).toBe(UPGRADES_BY_ID["coup_de_main"].setHandRate);
  });
  it("upgradeAvailable respecte le prérequis", () => {
    const s = createInitialState(0);
    s.money = D(1000);
    const eponge = UPGRADES_BY_ID["eponge"];
    expect(upgradeAvailable(s, eponge)).toBe(false); // gants pas acheté
    s.upgrades["gants"] = true;
    expect(upgradeAvailable(s, eponge)).toBe(true);
  });
});

describe("machines & vie", () => {
  it("achat de lave-vaisselle", () => {
    const s = createInitialState(0);
    s.money = generatorCost(s, "lave_vaisselle");
    expect(buyGenerator(s, "lave_vaisselle")).toBe(true);
    expect(s.generators["lave_vaisselle"]).toBe(1);
  });
  it("poser les gants stoppe tout le manuel", () => {
    const s = createInitialState(0);
    s.handWashing = true;
    poseGants(s);
    expect(s.manualRetired).toBe(true);
    expect(s.handWashing).toBe(false);
  });
  it("se reposer regagne de l'énergie (plafonné)", () => {
    const s = createInitialState(0);
    s.energy = 80;
    rest(s);
    expect(s.energy).toBe(ENERGY_MAX); // 80 + 30 plafonné à 100
  });
});
