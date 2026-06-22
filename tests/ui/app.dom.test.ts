// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { mount, unmount, flushSync } from "svelte";
import App from "../../src/ui/App.svelte";
import { game } from "../../src/ui/store.svelte";
import { tick } from "../../src/engine/loop";
import { D } from "../../src/engine/numbers";

describe("App P0 (DOM)", () => {
  it("monte, cache le compteur, puis l'affiche et l'incrémente après clic + tick", () => {
    const target = document.createElement("div");
    document.body.appendChild(target);
    const component = mount(App, { target });
    flushSync();

    // Au départ : un bouton d'action, pas de compteur (révélation progressive).
    const action = target.querySelector("button.action") as HTMLButtonElement;
    expect(action).not.toBeNull();
    expect(action.textContent).toContain("Laver des assiettes");
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

  it("en développeur : décor de fond (logement) + écran réductible", () => {
    const target = document.createElement("div");
    document.body.appendChild(target);
    game.state.job = "developpeur";
    game.state.homeLevel = 0;
    const component = mount(App, { target });
    flushSync();

    // Le décor (logement) remplit le fond, l'interface est dans un « écran ».
    const stage = target.querySelector(".stage") as HTMLElement;
    expect(stage).not.toBeNull();
    expect(stage.style.backgroundImage).toContain("linear-gradient");
    expect(target.querySelector("main.screen")).not.toBeNull();

    // On peut réduire l'écran pour admirer le décor, puis le rouvrir.
    const toggle = target.querySelector(".screen-toggle") as HTMLButtonElement;
    expect(toggle).not.toBeNull();
    toggle.click();
    flushSync();
    expect(target.querySelector("main.screen")).toBeNull();
    toggle.click();
    flushSync();
    expect(target.querySelector("main.screen")).not.toBeNull();

    unmount(component);
  });

  it("épilogue : le choix moral mène à la réincarnation (retour au plongeur, karma préservé)", () => {
    const target = document.createElement("div");
    document.body.appendChild(target);
    game.state.job = "empereur";
    game.state.flags = { ...game.state.flags, act3: true, epilogue: true, sensRevealed: true };
    game.state.emprise = D(1e15);
    game.state.sens = 0;
    const component = mount(App, { target });
    flushSync();

    expect(target.querySelector(".epilogue")).not.toBeNull();
    const lacher = [...target.querySelectorAll(".epilogue button")].find((b) =>
      b.textContent?.includes("Tout lâcher"),
    ) as HTMLButtonElement;
    expect(lacher).toBeTruthy();
    lacher.click();
    flushSync();

    const revivre = [...target.querySelectorAll(".epilogue button")].find((b) =>
      b.textContent?.includes("Revivre"),
    ) as HTMLButtonElement;
    expect(revivre).toBeTruthy();
    revivre.click();
    flushSync();

    // Réincarné : retour au plongeur, karma préservé (Sens nul → 1 point).
    expect(target.querySelector("main.paper")).not.toBeNull();
    expect(game.state.job).toBe("plongeur");
    expect(game.state.karma).toBeGreaterThanOrEqual(1);

    unmount(component);
  });
});
