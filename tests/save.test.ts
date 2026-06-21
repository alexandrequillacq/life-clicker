// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { createInitialState } from "../src/engine/state";
import { serialize, deserialize, save, load } from "../src/engine/save";

describe("save", () => {
  beforeEach(() => localStorage.clear());

  it("round-trip préserve money en Decimal", () => {
    const s = createInitialState(0);
    s.money = s.money.add(123.45);
    s.generators["collegue"] = 3;
    const back = deserialize(serialize(s));
    expect(back.money.toNumber()).toBeCloseTo(123.45);
    expect(back.generators["collegue"]).toBe(3);
    expect(typeof back.money.add).toBe("function"); // c'est bien un Decimal
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

  it("save corrompue → backup + état neuf", () => {
    localStorage.setItem("life-clicker-save", "{pas du json");
    const s = load(7);
    expect(s.money.toNumber()).toBe(0);
    expect(localStorage.getItem("life-clicker-save-backup")).toBe("{pas du json");
  });
});
