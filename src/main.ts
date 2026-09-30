import { mount } from "svelte";
import App from "./ui/App.svelte";
import { game } from "./ui/store.svelte";
import { advanceFrame } from "./engine/offline";
import { save } from "./engine/save";

const app = mount(App, { target: document.getElementById("app")! });

let last = performance.now();
let sinceSave = 0;

function frame(t: number): void {
  const gap = (t - last) / 1000;
  const dt = Math.min(gap, 60); // clamp les gros écarts (onglet en arrière-plan)
  last = t;
  advanceFrame(game.state, gap, Date.now()); // au chapitre 2, un grand écart passe par le hors-ligne
  game.state.lastSeen = Date.now();
  sinceSave += dt;
  if (sinceSave >= 10) {
    save(game.state);
    sinceSave = 0;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

window.addEventListener("beforeunload", () => save(game.state));
document.addEventListener("visibilitychange", () => {
  if (document.hidden) save(game.state);
});

export default app;
