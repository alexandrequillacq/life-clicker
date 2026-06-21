import { describe, it, expect } from "vitest";
import { D } from "../src/engine/numbers";
import { createInitialState, ENERGY_MAX } from "../src/engine/state";
import {
  clickWork,
  work,
  buyGenerator,
  generatorCost,
  buyUpgrade,
  canBuyUpgrade,
  upgradeAvailable,
  poseGants,
  rest,
  study,
  canStudy,
  becomeDeveloper,
  canBecomeDeveloper,
  promote,
  canPromote,
} from "../src/engine/actions";
import { UPGRADES_BY_ID } from "../src/engine/content/upgrades";
import { STUDIES } from "../src/engine/content/studies";
import { JOBS } from "../src/engine/content/career";

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

describe("études & carrière", () => {
  it("lire un livre monte le niveau et débite", () => {
    const s = createInitialState(0);
    s.money = STUDIES[0].cost;
    expect(canStudy(s)).toBe(true);
    expect(study(s)).toBe(true);
    expect(s.studyLevel).toBe(1);
    expect(s.money.toNumber()).toBeCloseTo(0);
  });
  it("le coût des livres augmente d'un thème à l'autre", () => {
    const s = createInitialState(0);
    s.money = D(100000);
    study(s); // livre 0
    expect(STUDIES[1].cost.toNumber()).toBeGreaterThan(STUDIES[0].cost.toNumber());
  });
  it("on devient développeur seulement après avoir tout lu (et la plonge s'arrête)", () => {
    const s = createInitialState(0);
    expect(canBecomeDeveloper(s)).toBe(false);
    s.studyLevel = STUDIES.length;
    expect(canBecomeDeveloper(s)).toBe(true);
    expect(becomeDeveloper(s)).toBe(true);
    expect(s.job).toBe("developpeur");
    expect(s.flags.energyVisible).toBe(true);
  });
  it("travailler en dev rapporte et coûte de l'énergie", () => {
    const s = createInitialState(0);
    s.job = "developpeur";
    s.flags.energyVisible = true;
    s.energy = 100;
    work(s);
    expect(s.money.toNumber()).toBeCloseTo(JOBS["developpeur"].clickValue.toNumber());
    expect(s.energy).toBe(100 - JOBS["developpeur"].clickEnergyCost);
  });
  it("un upgrade dev multiplie la valeur du clic", () => {
    const s = createInitialState(0);
    s.job = "developpeur";
    s.money = UPGRADES_BY_ID["ide"].cost;
    buyUpgrade(s, "ide");
    expect(s.devClickMult).toBe(UPGRADES_BY_ID["ide"].mulClickValue);
  });
  it("le pont IA pose les flags aiUnlocked puis aiResolving", () => {
    const s = createInitialState(0);
    s.job = "cto";
    s.money = UPGRADES_BY_ID["orchestrer_ia"].cost;
    buyUpgrade(s, "orchestrer_ia");
    expect(s.flags.aiUnlocked).toBe(true);
    s.money = UPGRADES_BY_ID["laisser_ia"].cost;
    buyUpgrade(s, "laisser_ia");
    expect(s.flags.aiResolving).toBe(true);
  });
  it("on ne promeut qu'au capital requis", () => {
    const s = createInitialState(0);
    s.job = "developpeur";
    expect(canPromote(s)).toBe(false);
    s.money = D(1000);
    expect(canPromote(s)).toBe(true);
    expect(promote(s)).toBe(true);
    expect(s.job).toBe("lead_dev");
  });
});

describe("entrepreneur (boîte d'IA)", () => {
  it("promu entrepreneur, l'Acte II se déclenche", () => {
    const s = createInitialState(0);
    s.job = "cto";
    s.money = D(30000);
    promote(s);
    expect(s.job).toBe("entrepreneur");
    expect(s.flags.act2).toBe(true);
  });
  it("une levée injecte du capital (cash one-shot)", () => {
    const s = createInitialState(0);
    s.job = "entrepreneur";
    s.money = D(80000);
    buyUpgrade(s, "leve_amorcage");
    expect(s.money.toNumber()).toBeCloseTo(80000 + 150000);
    expect(s.upgrades["leve_amorcage"]).toBe(true);
  });
  it("racheter une boîte ajoute des GPU au parc", () => {
    const s = createInitialState(0);
    s.job = "entrepreneur";
    s.generators["gpu"] = 3;
    s.money = generatorCost(s, "acquisition");
    buyGenerator(s, "acquisition");
    expect(s.generators["acquisition"]).toBe(1);
    expect(s.generators["gpu"]).toBe(5); // +2
  });
  it("le data center monte le boost GPU des produits", () => {
    const s = createInitialState(0);
    s.job = "entrepreneur";
    s.money = D(1500000);
    buyUpgrade(s, "data_center");
    expect(s.gpuProductBoost).toBeCloseTo(0.15);
  });
  it("engager une nounou pose le flag d'automatisation de la vie", () => {
    const s = createInitialState(0);
    s.job = "entrepreneur";
    s.money = D(120000);
    buyUpgrade(s, "nounou");
    expect(s.flags.vieAutomatisee).toBe(true);
  });
});
