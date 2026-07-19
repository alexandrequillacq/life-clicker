import { describe, it, expect } from "vitest";
import { D } from "../src/engine/numbers";
import { createInitialState } from "../src/engine/state";
import { buyControl, canBuyControl, controlCost, promote } from "../src/engine/actions";
import { controlIncomePerSec, emprisePerSec } from "../src/engine/economy";
import { tick } from "../src/engine/loop";
import { RESISTANCE_FACTOR_DIV } from "../src/engine/content/control";
import { GENERATORS_BY_ID } from "../src/engine/content/generators";

describe("Damiers de contrôle (institutions président, continents monde)", () => {
  it("une cible se prend une seule fois, débite son coût € et se pose définitivement", () => {
    const s = createInitialState(0);
    s.job = "president";
    s.money = D(5e6);
    expect(canBuyControl(s, "medias")).toBe(true);
    expect(controlCost("medias").toNumber()).toBe(2e6);
    expect(buyControl(s, "medias")).toBe(true);
    expect(s.controls["medias"]).toBe(true);
    expect(s.money.toNumber()).toBeCloseTo(3e6);
    // One-shot : jamais rachetée.
    expect(canBuyControl(s, "medias")).toBe(false);
    expect(buyControl(s, "medias")).toBe(false);
  });

  it("une cible possédée ajoute ses €/s au revenu passif et son Emprise/s", () => {
    const s = createInitialState(0);
    s.job = "president";
    s.controls["medias"] = true; // +100 k €/s, +1 000 Emprise/s
    expect(controlIncomePerSec(s).toNumber()).toBeCloseTo(1e5);
    expect(emprisePerSec(s).toNumber()).toBeCloseTo(1e3);
  });

  it("les cibles restent acquises et productives après promotion (un empereur garde ses continents)", () => {
    const s = createInitialState(0);
    s.job = "president";
    s.controls["medias"] = true;
    s.controls["parlement"] = true;
    const beforeMoney = controlIncomePerSec(s).toNumber();
    const beforeEmprise = emprisePerSec(s).toNumber();
    // Promotion vers le monde sur l'Emprise.
    s.emprise = D(1e7);
    expect(promote(s)).toBe(true);
    expect(s.job).toBe("monde");
    expect(controlIncomePerSec(s).toNumber()).toBeCloseTo(beforeMoney);
    expect(emprisePerSec(s).toNumber()).toBeCloseTo(beforeEmprise);
  });

  it("l'Emprise des cibles est amplifiée par l'armée de GPU (comme les générateurs)", () => {
    const s = createInitialState(0);
    s.job = "president";
    s.controls["banque"] = true; // 6 000 Emprise/s
    expect(emprisePerSec(s).toNumber()).toBeCloseTo(6e3);
    s.generators["gpu"] = 10; // ×(1 + 0,15 × 10) = ×2,5
    expect(emprisePerSec(s).toNumber()).toBeCloseTo(6e3 * 2.5);
  });
});

describe("Résistance : le contrôle appelle la contestation", () => {
  it("monte de +1/s en président dès 2 institutions contrôlées, pas avant", () => {
    const s = createInitialState(0);
    s.job = "president";
    s.controls["parlement"] = true; // 1 institution, non répressive
    tick(s, 10);
    expect(s.resistance).toBeCloseTo(0); // < 2 institutions : pas de montée
    s.controls["banque"] = true; // 2 institutions
    tick(s, 10);
    expect(s.resistance).toBeCloseTo(10); // +1/s × 10 s
  });

  it("chaque cible de répression possédée retranche 2/s à la jauge", () => {
    const s = createInitialState(0);
    s.job = "president";
    s.controls["parlement"] = true;
    s.controls["banque"] = true; // 2 institutions → +1/s
    s.controls["medias"] = true; // répression → −2/s
    s.resistance = 50;
    tick(s, 10);
    // pente nette (1 − 2) = −1/s × 10 s
    expect(s.resistance).toBeCloseTo(40);
  });

  it("borne la jauge dans [0, 100]", () => {
    const s = createInitialState(0);
    s.job = "president";
    s.controls["parlement"] = true;
    s.controls["banque"] = true;
    s.resistance = 99;
    tick(s, 100);
    expect(s.resistance).toBe(100);
    s.controls["medias"] = true; // répression domine
    tick(s, 1000);
    expect(s.resistance).toBe(0);
  });

  it("draine l'Emprise/s par (1 − resistance/150), plancher > 0 même à 100 (ne bloque jamais)", () => {
    const s = createInitialState(0);
    s.job = "president";
    s.controls["banque"] = true; // 6 000 Emprise/s brut
    s.resistance = 100;
    const factor = 1 - 100 / RESISTANCE_FACTOR_DIV; // 1/3
    expect(factor).toBeGreaterThan(0);
    expect(emprisePerSec(s).toNumber()).toBeCloseTo(6e3 * factor);
  });

  it("la promotion vers le monde remet la Résistance à 0, avec une pente +1,5/s", () => {
    const s = createInitialState(0);
    s.job = "president";
    s.resistance = 80;
    s.emprise = D(1e7);
    promote(s);
    expect(s.job).toBe("monde");
    expect(s.resistance).toBe(0);
    s.controls["europe"] = true; // ≥ 1 continent → +1,5/s
    tick(s, 10);
    expect(s.resistance).toBeCloseTo(15);
  });

  it("en empereur la Résistance est figée à 0 (plus personne pour résister)", () => {
    const s = createInitialState(0);
    s.job = "empereur";
    s.resistance = 60;
    tick(s, 5);
    expect(s.resistance).toBe(0);
  });
});

describe("Anciens générateurs d'Emprise supprimés", () => {
  it("les générateurs remplacés par les damiers et les sondes n'existent plus", () => {
    for (const id of ["surveillance_ia", "capture_medias", "drones", "surveillance_totale", "sondes"]) {
      expect(GENERATORS_BY_ID[id]).toBeUndefined();
    }
  });

  it("propagande et influence restent, moissonneuse est renommée en verbe d'achat", () => {
    expect(GENERATORS_BY_ID["propagande"]).toBeDefined();
    expect(GENERATORS_BY_ID["influence"]).toBeDefined();
    expect(GENERATORS_BY_ID["moissonneuse"].label).toBe("Construire une moissonneuse stellaire");
  });
});
