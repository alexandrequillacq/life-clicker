// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { mount, unmount, flushSync } from "svelte";
import App from "../../src/ui/App.svelte";
import { game } from "../../src/ui/store.svelte";
import { startAtChapter } from "../../src/engine/chapitres";

function mountApp(): { target: HTMLElement; component: ReturnType<typeof mount> } {
  const target = document.createElement("div");
  document.body.appendChild(target);
  const component = mount(App, { target });
  flushSync();
  return { target, component };
}

describe("chapitre 2 (DOM)", () => {
  it("à l'arrivée : la page blanche du plongeur, sans menu, le logement en une ligne", () => {
    game.state = startAtChapter(2, Date.now());
    const { target, component } = mountApp();
    const root = target.querySelector(".fl") as HTMLElement;
    expect(root).not.toBeNull();
    expect(root.classList.contains("couleur")).toBe(false);
    expect(target.querySelector(".side")).toBeNull();
    expect(target.textContent).toContain("Mon neveu devait le faire, mais il est parti à Lyon.");
    expect(target.textContent).toContain("Logement : le canapé convertible de Sam.");
    expect(target.textContent).not.toContain("Tableau de bord");
    unmount(component);
  });

  it("le clic écrit du code ; le site prêt, la carte de la micro-entreprise paraît", () => {
    game.state = startAtChapter(2, Date.now());
    const o = game.state.freelance.orders[0];
    const { target, component } = mountApp();
    const work = target.querySelector("button.work") as HTMLButtonElement;
    expect(work.textContent).toBe("Écrire du code : 5 lignes");
    work.click();
    flushSync();
    expect(o.done).toBe(5);
    o.done = o.lines - 1;
    work.click();
    flushSync();
    const card = target.querySelector(".invoice") as HTMLElement;
    expect(card).not.toBeNull();
    expect(card.textContent).toContain("Créer ta micro-entreprise");
    expect(card.querySelectorAll("input[type=radio]")).toHaveLength(5);
    unmount(component);
  });

  it("le nom de l'entreprise s'affiche en texte, jamais en HTML", () => {
    game.state = startAtChapter(2, Date.now());
    const o = game.state.freelance.orders[0];
    o.done = o.lines - 1;
    const { target, component } = mountApp();
    (target.querySelector("button.work") as HTMLButtonElement).click();
    flushSync();
    const input = target.querySelector(".invoice input[type=text]") as HTMLInputElement;
    input.value = "<img src=x>"; // 11 caractères : sous la limite de 24, rien n'est coupé
    input.dispatchEvent(new Event("input", { bubbles: true }));
    (target.querySelectorAll(".invoice input[type=radio]")[2] as HTMLInputElement).click();
    (target.querySelector(".invoice button") as HTMLButtonElement).click();
    flushSync();
    expect(game.state.freelance.company).toEqual({ name: "<img src=x>", logo: 2 });
    expect(target.querySelector("img")).toBeNull();
    expect(target.textContent).toContain("Première facture de <img src=x> : 600 €, Mme Duval.");
    expect((target.querySelector(".money") as HTMLElement).textContent).toBe("Argent : 600 €");
    unmount(component);
  });

  it("le menu paraît d'un coup, avec la marque ; la tâche en cours reste sur chaque onglet", () => {
    game.state = startAtChapter(2, Date.now());
    const f = game.state.freelance;
    f.company = { name: "Pixel", logo: 4 };
    f.revealed.sans_toi = 0;
    f.revealed.menu = 0;
    const { target, component } = mountApp();
    const side = target.querySelector(".side") as HTMLElement;
    expect(side).not.toBeNull();
    expect(side.textContent).toContain("Pixel");
    const tabs = [...side.querySelectorAll("button")];
    expect(tabs.map((b) => b.textContent!.trim())).toEqual(["Tableau de bord", "Pro", "Perso", "Finances"]);
    tabs[2].click();
    flushSync();
    expect(target.querySelector("button.work")).not.toBeNull();
    expect(target.textContent).toContain("Énergie : ");
    tabs[3].click();
    flushSync();
    expect(target.textContent).toContain("Tes finances");
    expect(target.querySelector("button.work")).not.toBeNull();
    unmount(component);
  });

  it("la chambre colore la page", () => {
    game.state = startAtChapter(2, Date.now());
    game.state.freelance.revealed.couleur = 0;
    const { target, component } = mountApp();
    expect((target.querySelector(".fl") as HTMLElement).classList.contains("couleur")).toBe(true);
    unmount(component);
  });
});
