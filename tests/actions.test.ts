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
  study,
  canStudy,
  bookCost,
  becomeOffice,
  canBecomeOffice,
  processFile,
} from "../src/engine/actions";
import { UPGRADES_BY_ID } from "../src/engine/content/upgrades";
import { STUDY_THRESHOLD, OFFICE_VALUE_PER_CLICK } from "../src/engine/content/studies";

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
    expect(s.energy).toBe(ENERGY_MAX); // 80 + 40 plafonné à 100
  });
});

describe("études & bureau", () => {
  it("lire un livre monte le niveau et débite", () => {
    const s = createInitialState(0);
    s.money = bookCost(s);
    expect(canStudy(s)).toBe(true);
    expect(study(s)).toBe(true);
    expect(s.studyLevel).toBe(1);
    expect(s.money.toNumber()).toBeCloseTo(0);
  });
  it("le coût des livres augmente avec le niveau", () => {
    const s = createInitialState(0);
    const c0 = bookCost(s).toNumber();
    s.money = D(1000);
    study(s);
    expect(bookCost(s).toNumber()).toBeGreaterThan(c0);
  });
  it("on ne peut postuler qu'au seuil d'études", () => {
    const s = createInitialState(0);
    expect(canBecomeOffice(s)).toBe(false);
    s.studyLevel = STUDY_THRESHOLD;
    expect(canBecomeOffice(s)).toBe(true);
    expect(becomeOffice(s)).toBe(true);
    expect(s.job).toBe("bureau");
  });
  it("traiter un dossier ne rapporte qu'en bureau", () => {
    const s = createInitialState(0);
    processFile(s); // encore plongeur → rien
    expect(s.money.toNumber()).toBe(0);
    s.job = "bureau";
    processFile(s);
    expect(s.money.toNumber()).toBeCloseTo(OFFICE_VALUE_PER_CLICK.toNumber());
  });
});
