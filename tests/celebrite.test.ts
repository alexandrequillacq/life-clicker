import { describe, it, expect } from "vitest";
import { D } from "../src/engine/numbers";
import { createInitialState } from "../src/engine/state";
import { tick, updateFlags } from "../src/engine/loop";
import { work, buyFollowers, followerPackCost, rest, buyUpgrade, promote, canPromote } from "../src/engine/actions";
import { sponsoringIncomePerSec, computeInitialSens, NEGLECT_SECONDS } from "../src/engine/content/audience";
import { UPGRADES_BY_ID } from "../src/engine/content/upgrades";

describe("audience (célébrité)", () => {
  it("publier un post donne des followers, pas de l'argent", () => {
    const s = createInitialState(0);
    s.job = "celebrite";
    s.flags.energyVisible = true;
    s.energy = 100;
    const moneyBefore = s.money.toNumber();
    work(s);
    expect(s.followers.toNumber()).toBeGreaterThan(0);
    expect(s.money.toNumber()).toBe(moneyBefore);
  });
  it("le sponsoring est additif et dérisoire (pas un multiplicateur)", () => {
    const s = createInitialState(0);
    s.followers = D(10_000_000); // 10 M followers
    // 10M × 0,00002 = 200 €/s
    expect(sponsoringIncomePerSec(s).toNumber()).toBeCloseTo(200);
  });
  it("acheter des followers coûte de plus en plus cher", () => {
    const s = createInitialState(0);
    s.job = "celebrite";
    const c0 = followerPackCost(s).toNumber();
    s.money = D(1e12);
    buyFollowers(s);
    expect(followerPackCost(s).toNumber()).toBeGreaterThan(c0);
    expect(s.followers.toNumber()).toBeGreaterThan(0);
  });
  it("la promotion en politique se débloque sur les followers, pas l'argent", () => {
    const s = createInitialState(0);
    s.job = "celebrite";
    s.money = D(1e15); // beaucoup d'argent ne suffit pas
    expect(canPromote(s)).toBe(false);
    s.followers = D(50_000_000);
    expect(canPromote(s)).toBe(true);
    promote(s);
    expect(s.job).toBe("politique");
  });
});

describe("révélation du Sens", () => {
  it("la formule agrège vie vécue, automatisation et négligence", () => {
    const vecu = createInitialState(0);
    vecu.vieVecueTicks = 5;
    expect(computeInitialSens(vecu)).toBeCloseTo(90); // 50 + 8×5

    const automatise = createInitialState(0);
    automatise.vieAutomatiseeCount = 1;
    automatise.secsSinceLife = NEGLECT_SECONDS + 1;
    expect(computeInitialSens(automatise)).toBeCloseTo(18); // 50 − 12 − 20
  });
  it("se révèle en célébrité quand la vie est automatisée (cause concrète)", () => {
    const s = createInitialState(0);
    s.job = "celebrite";
    s.vieAutomatiseeCount = 1;
    updateFlags(s);
    expect(s.flags.sensRevealed).toBe(true);
    expect(s.sens).toBeGreaterThan(0);
  });
  it("se révèle aussi par négligence prolongée de la vie", () => {
    const s = createInitialState(0);
    s.job = "celebrite";
    s.secsSinceLife = NEGLECT_SECONDS + 1;
    updateFlags(s);
    expect(s.flags.sensRevealed).toBe(true);
  });
  it("se reposer compte comme un geste de vie et regagne du Sens une fois révélé", () => {
    const s = createInitialState(0);
    s.flags.sensRevealed = true;
    s.sens = 30;
    s.secsSinceLife = 100;
    rest(s);
    expect(s.vieVecueTicks).toBe(1);
    expect(s.secsSinceLife).toBe(0);
    expect(s.sens).toBeGreaterThan(30);
  });
  it("une nouvelle automatisation de la vie creuse le Sens (révélé)", () => {
    const s = createInitialState(0);
    s.job = "entrepreneur";
    s.flags.sensRevealed = true;
    s.sens = 50;
    s.money = UPGRADES_BY_ID["nounou"].cost;
    buyUpgrade(s, "nounou");
    expect(s.vieAutomatiseeCount).toBe(1);
    expect(s.sens).toBeLessThan(50);
  });
});

describe("followers passifs (campagnes)", () => {
  it("les campagnes produisent des followers dans le temps", () => {
    const s = createInitialState(0);
    s.job = "celebrite";
    s.generators["campagne"] = 1; // 2000 followers/s
    tick(s, 10);
    expect(s.followers.toNumber()).toBeCloseTo(20000);
  });
});
