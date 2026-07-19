// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { mount, unmount, flushSync } from "svelte";
import App from "../../src/ui/App.svelte";
import { game } from "../../src/ui/store.svelte";
import { tick } from "../../src/engine/loop";
import { D } from "../../src/engine/numbers";
import { createInitialState } from "../../src/engine/state";

function mountApp(): { target: HTMLElement; component: ReturnType<typeof mount> } {
  const target = document.createElement("div");
  document.body.appendChild(target);
  const component = mount(App, { target });
  flushSync();
  return { target, component };
}

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

  it("développeur : la carte de mission apparaît avec label, progression et prime", () => {
    game.state = createInitialState(Date.now());
    game.state.job = "developpeur";
    game.state.bugsResolved = 12;
    game.state.mission = { tier: 0, progress: 3, timeLeft: 20 };
    const { target, component } = mountApp();

    const mission = target.querySelector(".mission");
    expect(mission).not.toBeNull();
    expect(mission!.textContent).toContain("Livrer un site vitrine");
    expect(mission!.textContent).toContain("3 / 10 bugs");
    // Barre de progression à 30 %.
    const fill = mission!.querySelector(".bar-fill") as HTMLElement;
    expect(fill.style.width).toBe("30%");
    // Tuile « Bugs résolus » présente.
    expect(target.textContent).toContain("Bugs résolus");

    unmount(component);
  });

  it("lead dev : la bannière d'incident apparaît et le bouton se désactive sans énergie", () => {
    game.state = createInitialState(Date.now());
    game.state.job = "lead_dev";
    game.state.incident = { timeLeft: 30 };
    game.state.energy = 0;
    const { target, component } = mountApp();

    const banner = target.querySelector(".incident-banner");
    expect(banner).not.toBeNull();
    expect(banner!.textContent).toContain("Incident en production");
    const btn = target.querySelector(".ib-btn") as HTMLButtonElement;
    expect(btn.disabled).toBe(true); // énergie 0 < 10

    // Énergie suffisante : le bouton s'active, et la résolution coupe l'incident.
    game.state.energy = 50;
    flushSync();
    expect(btn.disabled).toBe(false);
    btn.click();
    flushSync();
    expect(game.state.incident).toBeNull();
    expect(target.querySelector(".incident-banner")).toBeNull();

    unmount(component);
  });

  it("CTO : les cartes de décision rendent 2 options et decide() avance la file", () => {
    game.state = createInitialState(Date.now());
    game.state.job = "cto";
    game.state.pendingDecision = true;
    game.state.decisionIndex = 0;
    game.state.money = D(100000);
    const { target, component } = mountApp();

    const block = target.querySelector(".decision");
    expect(block).not.toBeNull();
    expect(block!.textContent).toContain("Trancher une décision technique");
    const opts = target.querySelectorAll(".decision-opt");
    expect(opts.length).toBe(2);

    (opts[0] as HTMLButtonElement).click();
    flushSync();
    expect(game.state.decisionIndex).toBe(1);
    expect(game.state.pendingDecision).toBe(false);
    expect(target.querySelector(".decision")).toBeNull();

    unmount(component);
  });

  it("célébrité : la bannière de tendance apparaît quand la fenêtre est ouverte", () => {
    game.state = createInitialState(Date.now());
    game.state.job = "celebrite";
    game.state.flags = { act2: true };
    game.state.trendTimer = 0; // dans la fenêtre ×8
    const { target, component } = mountApp();

    const trend = target.querySelector(".trend-banner");
    expect(trend).not.toBeNull();
    expect(trend!.textContent).toContain("Tendance");
    expect(trend!.textContent).toContain("×8");

    // Le composeur « Publier un post » remplace le clic générique.
    const compose = target.querySelector(".compose-btn") as HTMLButtonElement;
    expect(compose).not.toBeNull();
    expect(compose.textContent).toContain("Publier un post");

    unmount(component);
  });
});
