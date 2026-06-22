import { describe, it, expect } from "vitest";
import { D } from "../src/engine/numbers";
import { createInitialState } from "../src/engine/state";
import { emprisePerSec } from "../src/engine/economy";
import { promote, canPromote, fireActe, canActe, ruleTheVoid, rest } from "../src/engine/actions";
import { tick } from "../src/engine/loop";
import { GENERATORS_BY_ID, generatorAvailable, EMPRISE_GPU_BOOST } from "../src/engine/content/generators";
import { ACTE_COOLDOWN, currentActe, EPILOGUE_EMPRISE, karmaGain } from "../src/engine/content/power";

describe("Acte III : emprise, pouvoir, épilogue", () => {
  it("l'emprise/s est multipliée par l'armée de GPU (le couplage qui rend le pouvoir creux)", () => {
    const s = createInitialState(0);
    s.job = "politique";
    s.generators["propagande"] = 1; // output 5
    expect(emprisePerSec(s).toNumber()).toBeCloseTo(5);
    s.generators["gpu"] = 10;
    expect(emprisePerSec(s).toNumber()).toBeCloseTo(5 * (1 + EMPRISE_GPU_BOOST * 10));
  });

  it("les générateurs de pouvoir sont jaugés par rang", () => {
    expect(generatorAvailable(GENERATORS_BY_ID["propagande"], "celebrite")).toBe(false);
    expect(generatorAvailable(GENERATORS_BY_ID["propagande"], "politique")).toBe(true);
    expect(generatorAvailable(GENERATORS_BY_ID["sondes"], "monde")).toBe(false);
    expect(generatorAvailable(GENERATORS_BY_ID["sondes"], "empereur")).toBe(true);
  });

  it("les promotions de l'Acte III se débloquent sur l'Emprise, pas l'argent", () => {
    const s = createInitialState(0);
    s.job = "politique";
    s.money = D(1e18);
    expect(canPromote(s)).toBe(false);
    s.emprise = D(5e4);
    expect(canPromote(s)).toBe(true);
    promote(s);
    expect(s.job).toBe("president");
  });

  it("passer en politique bascule en Acte III", () => {
    const s = createInitialState(0);
    s.job = "celebrite";
    s.followers = D(50_000_000);
    promote(s);
    expect(s.job).toBe("politique");
    expect(s.flags.act3).toBe(true);
  });

  it("un acte de pouvoir saute l'Emprise puis impose un délai (sans énergie)", () => {
    const s = createInitialState(0);
    s.job = "politique";
    expect(canActe(s)).toBe(true);
    const acte = currentActe("politique")!;
    fireActe(s);
    expect(s.emprise.toNumber()).toBeCloseTo(acte.empriseGrant.toNumber());
    expect(canActe(s)).toBe(false);
    expect(s.acteCooldown).toBeCloseTo(ACTE_COOLDOWN);
    tick(s, ACTE_COOLDOWN + 1);
    expect(canActe(s)).toBe(true);
  });

  it("l'épilogue s'ouvre pour l'empereur au seuil final", () => {
    const s = createInitialState(0);
    s.job = "empereur";
    s.emprise = EPILOGUE_EMPRISE;
    tick(s, 0.1);
    expect(s.flags.epilogue).toBe(true);
  });

  it("régner sur le vide pose le flag de fin", () => {
    const s = createInitialState(0);
    ruleTheVoid(s);
    expect(s.flags.ending).toBe(true);
  });
});

describe("réincarnation : le karma récompense la vie préservée", () => {
  it("karmaGain croît avec le Sens préservé", () => {
    expect(karmaGain(0)).toBe(1);
    expect(karmaGain(100)).toBeGreaterThan(karmaGain(0));
  });

  it("le karma traverse une nouvelle partie", () => {
    expect(createInitialState(0, 3).karma).toBe(3);
  });

  it("le karma rend chaque repos plus nourrissant en Sens", () => {
    const base = createInitialState(0, 0);
    base.flags.sensRevealed = true;
    base.sens = 30;
    rest(base);
    const karmic = createInitialState(0, 5);
    karmic.flags.sensRevealed = true;
    karmic.sens = 30;
    rest(karmic);
    expect(karmic.sens).toBeGreaterThan(base.sens);
  });
});
