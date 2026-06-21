// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { mount, unmount, flushSync } from "svelte";
import App from "../../src/ui/App.svelte";
import { game } from "../../src/ui/store.svelte";
import { tick } from "../../src/engine/loop";

describe("App P0 (DOM)", () => {
  it("monte, cache le compteur, puis l'affiche et l'incrémente après clic + tick", () => {
    const target = document.createElement("div");
    document.body.appendChild(target);
    const component = mount(App, { target });
    flushSync();

    // Au départ : un bouton d'action, pas de compteur (révélation progressive).
    const action = target.querySelector("button.action") as HTMLButtonElement;
    expect(action).not.toBeNull();
    expect(action.textContent).toContain("Laver une assiette");
    expect(target.querySelector(".counter")).toBeNull();

    // Clic : ajoute 0,05 € ; un tick déclenche updateFlags qui révèle le compteur.
    action.click();
    tick(game.state, 0.016);
    flushSync();

    const counter = target.querySelector(".counter");
    expect(counter).not.toBeNull();
    expect(counter!.textContent).toContain("5 c");

    unmount(component);
  });
});
