import { describe, it, expect } from "vitest";
import { CHAPTERS, startAtChapter } from "../src/engine/chapitres";

describe("démarrer à un chapitre (test)", () => {
  it("propose le plongeur et le freelance", () => {
    expect(CHAPTERS.map((c) => c.n)).toEqual([1, 2]);
  });
  it("le chapitre 1 est une partie neuve", () => {
    const s = startAtChapter(1, 0);
    expect(s.job).toBe("plongeur");
    expect(s.totalClicks).toBe(0);
  });
  it("le chapitre 2 commence au premier lundi, avec la commande de Mme Duval et 0 €", () => {
    const s = startAtChapter(2, 0);
    expect(s.job).toBe("freelance");
    expect(s.freelance.day).toBe(0);
    expect(s.freelance.orders[0].client).toBe("Boulangerie Duval");
    expect(s.money.toNumber()).toBe(0);
    expect(s.flags.moneyVisible).toBe(true);
  });
});
