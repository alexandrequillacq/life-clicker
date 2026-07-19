import { describe, it, expect } from "vitest";
import { D } from "../src/engine/numbers";
import { createInitialState } from "../src/engine/state";
import { canLaunchFirstProbe, launchFirstProbe, fireActe } from "../src/engine/actions";
import { emprisePerSec, energyRelevant } from "../src/engine/economy";
import { tick } from "../src/engine/loop";
import { PROBE_COST, PROBE_GROWTH, cosmicMilestone } from "../src/engine/content/cosmos";
import { ACTES, ACTE_COUNTER_LABELS } from "../src/engine/content/power";

describe("Sondes von Neumann (empereur)", () => {
  it("la première sonde est un achat unique de 50 Md€", () => {
    const s = createInitialState(0);
    s.job = "empereur";
    s.money = PROBE_COST;
    expect(canLaunchFirstProbe(s)).toBe(true);
    expect(launchFirstProbe(s)).toBe(true);
    expect(s.probes.toNumber()).toBe(1);
    expect(s.money.toNumber()).toBeCloseTo(0);
    // Refuse une deuxième sonde manuelle : la croissance est désormais autonome.
    s.money = PROBE_COST;
    expect(canLaunchFirstProbe(s)).toBe(false);
    expect(launchFirstProbe(s)).toBe(false);
  });

  it("refuse hors empereur ou sans les fonds", () => {
    const monde = createInitialState(0);
    monde.job = "monde";
    monde.money = PROBE_COST;
    expect(canLaunchFirstProbe(monde)).toBe(false);

    const broke = createInitialState(0);
    broke.job = "empereur";
    broke.money = D(PROBE_COST.toNumber() - 1);
    expect(canLaunchFirstProbe(broke)).toBe(false);
  });

  it("les sondes croissent en composé et produisent 1 Emprise/s chacune (hors boost GPU)", () => {
    const s = createInitialState(0);
    s.job = "empereur";
    s.probes = D(1000);
    s.generators["gpu"] = 100; // ne doit PAS amplifier les sondes
    expect(emprisePerSec(s).toNumber()).toBeCloseTo(1000);
    tick(s, 1);
    // probes ×= (1 + 0,03 × 1)
    expect(s.probes.toNumber()).toBeCloseTo(1000 * (1 + PROBE_GROWTH));
  });

  it("cosmicMilestone renvoie la dernière ligne froide franchie", () => {
    expect(cosmicMilestone(D(0))).toBeNull();
    expect(cosmicMilestone(D(999))).toBeNull();
    expect(cosmicMilestone(D(1e3))).toBe("Le système solaire est couvert.");
    expect(cosmicMilestone(D(1e6))).toBe("La galaxie est quadrillée.");
    expect(cosmicMilestone(D(1e9))).toBe("L'amas local répond.");
    expect(cosmicMilestone(D(1e12))).toBe("Le vide intergalactique aussi.");
    expect(cosmicMilestone(D(1e20))).toBe("Le vide intergalactique aussi.");
  });
});

describe("Actes de pouvoir : renommage, grants écrasés, compteurs", () => {
  it("les libellés et grants correspondent au design", () => {
    expect(ACTES.politique!.label).toBe("Sceller une alliance");
    expect(ACTES.politique!.empriseGrant.toNumber()).toBe(1e4);
    expect(ACTES.president!.label).toBe("Faire passer une loi d'exception");
    expect(ACTES.president!.empriseGrant.toNumber()).toBe(2e5);
    expect(ACTES.monde!.label).toBe("Annexer une région");
    expect(ACTES.monde!.empriseGrant.toNumber()).toBe(1e8);
    expect(ACTES.empereur!.label).toBe("Coloniser un système stellaire");
    expect(ACTES.empereur!.empriseGrant.toNumber()).toBe(1e12);
  });

  it("les libellés de compteur existent pour chaque rang", () => {
    expect(ACTE_COUNTER_LABELS.politique).toBe("alliances");
    expect(ACTE_COUNTER_LABELS.president).toBe("lois");
    expect(ACTE_COUNTER_LABELS.monde).toBe("régions");
    expect(ACTE_COUNTER_LABELS.empereur).toBe("systèmes");
  });

  it("fireActe incrémente le compteur d'actes du métier courant", () => {
    const s = createInitialState(0);
    s.job = "politique";
    fireActe(s);
    expect(s.acteCounts["politique"]).toBe(1);
    tick(s, 100); // laisse le cooldown s'écouler
    fireActe(s);
    expect(s.acteCounts["politique"]).toBe(2);
  });
});

describe("Énergie masquée en fin de partie", () => {
  it("energyRelevant est vraie jusqu'à la politique, fausse dès la présidence", () => {
    const jobsWithEnergy = ["plongeur", "developpeur", "lead_dev", "cto", "entrepreneur", "celebrite", "politique"] as const;
    for (const job of jobsWithEnergy) {
      const s = createInitialState(0);
      s.job = job;
      expect(energyRelevant(s)).toBe(true);
    }
    for (const job of ["president", "monde", "empereur"] as const) {
      const s = createInitialState(0);
      s.job = job;
      expect(energyRelevant(s)).toBe(false);
    }
  });
});
