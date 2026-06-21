// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { createInitialState } from "../src/engine/state";
import { serialize, deserialize, save, load } from "../src/engine/save";

describe("save", () => {
  beforeEach(() => localStorage.clear());

  it("round-trip préserve money et valuePerDish en Decimal", () => {
    const s = createInitialState(0);
    s.money = s.money.add(123.45);
    s.generators["lave_vaisselle"] = 3;
    s.upgrades["gants"] = true;
    const back = deserialize(serialize(s));
    expect(back.money.toNumber()).toBeCloseTo(123.45);
    expect(back.valuePerDish.toNumber()).toBeCloseTo(0.05);
    expect(back.generators["lave_vaisselle"]).toBe(3);
    expect(back.upgrades["gants"]).toBe(true);
    expect(typeof back.money.add).toBe("function");
  });

  it("load renvoie un état neuf sans save", () => {
    const s = load(42);
    expect(s.money.toNumber()).toBe(0);
    expect(s.startedAt).toBe(42);
  });

  it("save puis load restitue l'argent", () => {
    const s = createInitialState(0);
    s.money = s.money.add(50);
    save(s);
    expect(load(0).money.toNumber()).toBeCloseTo(50);
  });

  it("save d'une autre version → archive + état neuf", () => {
    localStorage.setItem("life-clicker-save", JSON.stringify({ version: 1, money: "999" }));
    const s = load(7);
    expect(s.money.toNumber()).toBe(0);
    expect(localStorage.getItem("life-clicker-save-backup")).toContain("999");
  });

  it("save corrompue → archive + état neuf", () => {
    localStorage.setItem("life-clicker-save", "{pas du json");
    const s = load(7);
    expect(s.money.toNumber()).toBe(0);
    expect(localStorage.getItem("life-clicker-save-backup")).toBe("{pas du json");
  });
});
