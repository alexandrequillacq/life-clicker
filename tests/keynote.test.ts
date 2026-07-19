import { describe, it, expect } from "vitest";
import { D } from "../src/engine/numbers";
import { createInitialState } from "../src/engine/state";
import { tick } from "../src/engine/loop";
import {
  giveKeynote,
  canGiveKeynote,
  buyUpgrade,
  buyGenerator,
  canPromote,
  promote,
} from "../src/engine/actions";
import { bizIncomePerSec } from "../src/engine/economy";
import { generatorCost } from "../src/engine/actions";
import {
  KEYNOTE_PERIOD,
  KEYNOTE_BOOST,
  KEYNOTE_BOOST_SECS,
  KEYNOTE_FOLLOWERS,
  KEYNOTE_ENERGY_COST,
  PRESS_FOLLOWERS_RAISE,
  PRESS_FOLLOWERS_ACQUISITION,
} from "../src/engine/content/keynote";

/** Fondateur ayant bouclé une levée d'amorçage, énergie pleine. */
function founderWithRaise() {
  const s = createInitialState(0);
  s.job = "entrepreneur";
  s.flags.energyVisible = true;
  s.energy = 100;
  s.upgrades["leve_amorcage"] = true; // au moins une levée bouclée
  s.keynoteTimer = 0;
  return s;
}

describe("keynotes (fondateur)", () => {
  it("indisponible hors métier fondateur", () => {
    const s = founderWithRaise();
    s.job = "cto";
    expect(canGiveKeynote(s)).toBe(false);
    expect(giveKeynote(s)).toBe(false);
  });

  it("indisponible sans levée bouclée", () => {
    const s = founderWithRaise();
    s.upgrades = {};
    expect(canGiveKeynote(s)).toBe(false);
    expect(giveKeynote(s)).toBe(false);
  });

  it("indisponible tant que le timer n'est pas écoulé", () => {
    const s = founderWithRaise();
    s.keynoteTimer = 10;
    expect(canGiveKeynote(s)).toBe(false);
    expect(giveKeynote(s)).toBe(false);
  });

  it("indisponible si énergie insuffisante", () => {
    const s = founderWithRaise();
    s.energy = KEYNOTE_ENERGY_COST - 1;
    expect(canGiveKeynote(s)).toBe(false);
    expect(giveKeynote(s)).toBe(false);
  });

  it("donner une keynote : +5000 followers, boost armé, énergie −6, timer relancé", () => {
    const s = founderWithRaise();
    const before = s.followers.toNumber();
    expect(giveKeynote(s)).toBe(true);
    expect(s.followers.toNumber()).toBeCloseTo(before + KEYNOTE_FOLLOWERS);
    expect(s.keynoteBoostLeft).toBeCloseTo(KEYNOTE_BOOST_SECS);
    expect(s.energy).toBeCloseTo(100 - KEYNOTE_ENERGY_COST);
    expect(s.keynoteTimer).toBeCloseTo(KEYNOTE_PERIOD);
    // la keynote met à jour le pic historique de followers
    expect(s.maxFollowers.toNumber()).toBeCloseTo(before + KEYNOTE_FOLLOWERS);
  });

  it("le timer et le boost décomptent dans la boucle", () => {
    const s = founderWithRaise();
    giveKeynote(s);
    tick(s, 5);
    expect(s.keynoteTimer).toBeCloseTo(KEYNOTE_PERIOD - 5);
    expect(s.keynoteBoostLeft).toBeCloseTo(KEYNOTE_BOOST_SECS - 5);
    tick(s, KEYNOTE_BOOST_SECS); // épuise le boost
    expect(s.keynoteBoostLeft).toBe(0);
  });

  it("pendant le boost, le revenu des PRODUITS est ×1,5 ; les acquisitions ne le sont PAS", () => {
    const s = founderWithRaise();
    s.generators["produit_ia"] = 1;
    s.generators["acquisition"] = 1;
    const baseline = bizIncomePerSec(s).toNumber();
    // isole la part produit vs acquisition
    const onlyProduct = createInitialState(0);
    onlyProduct.job = "entrepreneur";
    onlyProduct.generators["produit_ia"] = 1;
    const productPart = bizIncomePerSec(onlyProduct).toNumber();
    const acquisitionPart = baseline - productPart;

    s.keynoteBoostLeft = KEYNOTE_BOOST_SECS; // boost actif
    const boosted = bizIncomePerSec(s).toNumber();
    // seul le produit est boosté de +50 %
    expect(boosted).toBeCloseTo(productPart * (1 + KEYNOTE_BOOST) + acquisitionPart);
  });

  it("hors boost, aucun multiplicateur keynote", () => {
    const s = founderWithRaise();
    s.generators["produit_ia"] = 2;
    s.keynoteBoostLeft = 0;
    const noBoost = bizIncomePerSec(s).toNumber();
    s.keynoteBoostLeft = 5;
    const withBoost = bizIncomePerSec(s).toNumber();
    expect(withBoost).toBeGreaterThan(noBoost);
  });
});

describe("presse (pont fondateur → célébrité)", () => {
  it("boucler une levée donne +10 000 followers de presse", () => {
    const s = createInitialState(0);
    s.job = "entrepreneur";
    s.money = D(80000);
    const before = s.followers.toNumber();
    buyUpgrade(s, "leve_amorcage");
    expect(s.followers.toNumber()).toBeCloseTo(before + PRESS_FOLLOWERS_RAISE);
    expect(s.maxFollowers.toNumber()).toBeGreaterThanOrEqual(PRESS_FOLLOWERS_RAISE);
  });

  it("racheter une boîte donne +3 000 followers de presse", () => {
    const s = createInitialState(0);
    s.job = "entrepreneur";
    s.money = generatorCost(s, "acquisition");
    const before = s.followers.toNumber();
    buyGenerator(s, "acquisition");
    expect(s.followers.toNumber()).toBeCloseTo(before + PRESS_FOLLOWERS_ACQUISITION);
  });
});

describe("gate fondateur → célébrité (8 M€ ET une levée)", () => {
  it("exige le capital ET au moins une levée bouclée", () => {
    const s = createInitialState(0);
    s.job = "entrepreneur";
    s.money = D(8_000_000);
    expect(canPromote(s)).toBe(false); // pas de levée
    s.upgrades["leve_amorcage"] = true;
    expect(canPromote(s)).toBe(true);
    s.money = D(7_999_999);
    expect(canPromote(s)).toBe(false); // capital insuffisant
    s.money = D(8_000_000);
    expect(promote(s)).toBe(true);
    expect(s.job).toBe("celebrite");
  });
});
