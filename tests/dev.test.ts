import { describe, it, expect } from "vitest";
import { D } from "../src/engine/numbers";
import { createInitialState } from "../src/engine/state";
import { devIncomePerSec, aiIncomePerSec, incomePerSec } from "../src/engine/economy";
import { fireTeam, canFireTeam, work } from "../src/engine/actions";
import { tick } from "../src/engine/loop";
import { GENERATORS_BY_ID, JUNIOR_SETTLEMENT, SENIOR_SETTLEMENT, generatorAvailable } from "../src/engine/content/generators";
import { UPGRADES_BY_ID } from "../src/engine/content/upgrades";
import { JOBS } from "../src/engine/content/career";

const J = GENERATORS_BY_ID["junior"];
const SALARY = J.salaryPerSec!.toNumber();
const REDUN = J.redundancyPerGpu!;
const GROSS = J.output.toNumber();

// Net d'un junior : son travail est rongé par l'IA (redondance par GPU), salaire fixe.
function expectedNet(count: number, gpus: number): number {
  const grossEff = Math.max(0, GROSS - REDUN * gpus);
  return (grossEff - SALARY) * count;
}

describe("rework dev : juniors + IA", () => {
  it("« Écrire des tests » et « Pipeline CI/CD » sont supprimés", () => {
    expect(GENERATORS_BY_ID["tests"]).toBeUndefined();
    expect(GENERATORS_BY_ID["ci"]).toBeUndefined();
  });

  it("un junior aide quand l'IA est faible (0 GPU)", () => {
    const s = createInitialState(0);
    s.job = "cto";
    s.generators["junior"] = 1;
    expect(devIncomePerSec(s).toNumber()).toBeCloseTo(expectedNet(1, 0));
    expect(devIncomePerSec(s).toNumber()).toBeGreaterThan(0);
  });

  it("le rendement net d'un junior baisse avec les GPU et finit par devenir négatif", () => {
    const s = createInitialState(0);
    s.job = "cto";
    s.generators["junior"] = 1;
    s.generators["gpu"] = 8;
    const net = devIncomePerSec(s).toNumber();
    expect(net).toBeCloseTo(expectedNet(1, 8));
    expect(net).toBeLessThan(0);
  });

  it("le rendement d'un junior n'est pas modulé par l'énergie (revenu passif)", () => {
    const s = createInitialState(0);
    s.job = "cto";
    s.generators["junior"] = 2;
    s.flags.energyVisible = true;
    s.energy = 0;
    expect(devIncomePerSec(s).toNumber()).toBeCloseTo(expectedNet(2, 0));
  });

  it("les GPU multiplient le débit de l'IA", () => {
    const s = createInitialState(0);
    s.flags.aiResolving = true;
    const base = aiIncomePerSec(s).toNumber();
    s.generators["gpu"] = 4;
    expect(aiIncomePerSec(s).toNumber()).toBeGreaterThan(base);
  });

  it("« Remplacer l'équipe par l'IA » : indisponible sans IA, disponible une fois l'IA lancée", () => {
    const s = createInitialState(0);
    s.job = "cto";
    s.generators["junior"] = 3;
    expect(canFireTeam(s)).toBe(false);
    s.flags.aiResolving = true;
    expect(canFireTeam(s)).toBe(true);
  });

  it("remplacer l'équipe verse une prime, vire les juniors, et est irréversible", () => {
    const s = createInitialState(0);
    s.job = "cto";
    s.flags.aiResolving = true;
    s.generators["junior"] = 4;
    const before = s.money.toNumber();
    fireTeam(s);
    expect(s.money.toNumber()).toBeCloseTo(before + JUNIOR_SETTLEMENT * 4);
    expect(s.generators["junior"]).toBe(0);
    expect(s.flags.equipeRemplacee).toBe(true);
    expect(canFireTeam(s)).toBe(false);
  });

  it("garder une grosse équipe sous IA forte reste rentable globalement (pas de soft-lock), et virer améliore le revenu/s", () => {
    const s = createInitialState(0);
    s.job = "cto";
    s.flags.aiResolving = true;
    s.generators["gpu"] = 8;
    s.generators["junior"] = 5;
    expect(incomePerSec(s).toNumber()).toBeGreaterThan(0);
    const m0 = s.money.toNumber();
    tick(s, 1);
    expect(s.money.toNumber()).toBeGreaterThan(m0);
    const incomeWith = incomePerSec(s).toNumber();
    fireTeam(s);
    expect(incomePerSec(s).toNumber()).toBeGreaterThan(incomeWith);
  });

  it("la monnaie ne devient jamais négative même si le revenu net est négatif", () => {
    const s = createInitialState(0);
    s.job = "cto";
    s.generators["junior"] = 5;
    s.generators["gpu"] = 20; // redondance extrême : juniors en pure perte
    s.money = D(1);
    tick(s, 100);
    expect(s.money.toNumber()).toBeGreaterThanOrEqual(0);
  });

  it("le livre qui débloque l'IA est « How to setup Claude Code » et débloque l'IA", () => {
    const book = UPGRADES_BY_ID["orchestrer_ia"];
    expect(book.label).toContain("How to setup Claude Code");
    expect(book.unlocksAi).toBe(true);
  });
});

describe("clic du développeur (IC) : l'énergie limite la cadence, pas le gain", () => {
  it("le gain par clic ne dépend pas du niveau d'énergie", () => {
    const full = createInitialState(0);
    full.job = "developpeur";
    full.flags.energyVisible = true;
    full.energy = 100;
    work(full);
    const low = createInitialState(0);
    low.job = "developpeur";
    low.flags.energyVisible = true;
    low.energy = 20;
    work(low);
    expect(low.money.toNumber()).toBeCloseTo(full.money.toNumber());
    expect(low.money.toNumber()).toBeGreaterThan(0);
  });

  it("épuisé (énergie sous le coût), le clic est bloqué", () => {
    const s = createInitialState(0);
    s.job = "developpeur";
    s.flags.energyVisible = true;
    s.energy = JOBS.developpeur.clickEnergyCost - 1;
    const before = s.money.toNumber();
    work(s);
    expect(s.money.toNumber()).toBe(before);
  });

  it("un manager (lead dev) ne gagne rien au clic", () => {
    const s = createInitialState(0);
    s.job = "lead_dev";
    s.energy = 100;
    const before = s.money.toNumber();
    work(s);
    expect(s.money.toNumber()).toBe(before);
  });
});

describe("équipe : juniors (manager+) et seniors (CTO+)", () => {
  it("on n'embauche pas de junior avant d'être manager", () => {
    const j = GENERATORS_BY_ID["junior"];
    expect(generatorAvailable(j, "developpeur")).toBe(false);
    expect(generatorAvailable(j, "lead_dev")).toBe(true);
  });

  it("le dev senior n'apparaît qu'à partir du CTO et frappe plus fort qu'un junior", () => {
    const sr = GENERATORS_BY_ID["senior"];
    expect(generatorAvailable(sr, "lead_dev")).toBe(false);
    expect(generatorAvailable(sr, "cto")).toBe(true);
    expect(sr.output.toNumber()).toBeGreaterThan(GENERATORS_BY_ID["junior"].output.toNumber());
  });

  it("remplacer l'équipe vire juniors ET seniors, avec leurs primes", () => {
    const s = createInitialState(0);
    s.job = "cto";
    s.flags.aiResolving = true;
    s.generators["junior"] = 3;
    s.generators["senior"] = 2;
    const before = s.money.toNumber();
    expect(canFireTeam(s)).toBe(true);
    fireTeam(s);
    expect(s.money.toNumber()).toBeCloseTo(before + JUNIOR_SETTLEMENT * 3 + SENIOR_SETTLEMENT * 2);
    expect(s.generators["junior"]).toBe(0);
    expect(s.generators["senior"]).toBe(0);
    expect(s.flags.equipeRemplacee).toBe(true);
  });

  it("« Assistant de code IA » (multiplicateur de clic devenu inutile) est supprimé", () => {
    expect(UPGRADES_BY_ID["copilot"]).toBeUndefined();
  });
});

describe("P0 enrichi", () => {
  it("une machine de plonge plus rapide existe", () => {
    const pro = GENERATORS_BY_ID["lave_vaisselle_pro"];
    expect(pro).toBeDefined();
    expect(pro.kind).toBe("plonge");
    expect(pro.output.toNumber()).toBeGreaterThan(GENERATORS_BY_ID["lave_vaisselle"].output.toNumber());
  });

  it("les gants pro se proposent pendant la plonge à la main, avant de poser les gants", () => {
    const gp = UPGRADES_BY_ID["gants_pro"];
    const lv = GENERATORS_BY_ID["lave_vaisselle"];
    // révélables bien avant d'avoir 2 lave-vaisselle (le déclencheur de « poser les gants »)
    expect(gp.unlockAtMoney.toNumber()).toBeLessThan(lv.baseCost.toNumber() * 2);
  });
});
