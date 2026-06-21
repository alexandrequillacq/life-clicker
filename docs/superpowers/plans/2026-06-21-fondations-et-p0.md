# Fondations moteur + tranche P0 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mettre en place le projet Svelte 5 + le moteur de jeu pur (testé) et livrer la phase P0 jouable dans le navigateur : un bouton « Laver une assiette », un compteur d'argent qui apparaît, un premier revenu automatique, sauvegarde + reprise hors-ligne, réglage de tempo, et une UI monochrome d'Acte I.

**Architecture:** Moteur en TypeScript pur (`src/engine/`, aucun import Svelte, 100 % testable) séparé d'une couche UI Svelte mince (`src/ui/`) qui s'abonne à l'état et l'affiche. Une boucle `requestAnimationFrame` appelle `tick(state, dt)` chaque frame et déclenche une sauvegarde throttlée. Les gros nombres passent par `break_infinity.js`.

**Tech Stack:** Svelte 5 (runes), Vite, TypeScript (strict), Vitest, `break_infinity.js`.

## Global Constraints

- **Plateforme :** web, 100 % client, aucune dépendance réseau à l'exécution.
- **Séparation stricte :** `src/engine/**` n'importe JAMAIS de Svelte ni de `src/ui/**`. L'UI dépend du moteur, jamais l'inverse.
- **Déterminisme :** les fonctions du moteur ne lisent PAS l'horloge (`Date.now`) ni l'aléatoire en interne — `now`/`dt` sont passés en paramètre. Testabilité.
- **Gros nombres :** toute valeur monétaire ou de production est un `Decimal` (break_infinity), jamais un `number` natif. L'énergie/sens (tranches futures) restent des `number` bornés.
- **Langue :** tous les libellés visibles par le joueur sont en français.
- **TypeScript strict :** `strict: true` dans `tsconfig`.
- **Commits fréquents :** un commit par tâche minimum.

---

### Task 1: Scaffold du projet & outillage

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `svelte.config.js`, `index.html`, `src/main.ts`, `src/ui/App.svelte`, `src/vite-env.d.ts`

**Interfaces:**
- Consumes: rien.
- Produces: un projet qui démarre (`npm run dev`), build (`npm run build`) et teste (`npm run test`). `src/ui/App.svelte` exporte un composant Svelte 5 par défaut.

- [ ] **Step 1: Créer `package.json`**

```json
{
  "name": "life-clicker",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "check": "svelte-check --tsconfig ./tsconfig.json"
  },
  "devDependencies": {
    "@sveltejs/vite-plugin-svelte": "^5.0.0",
    "svelte": "^5.0.0",
    "svelte-check": "^4.0.0",
    "typescript": "^5.6.0",
    "vite": "^6.0.0",
    "vitest": "^2.1.0"
  },
  "dependencies": {
    "break_infinity.js": "^2.0.0"
  }
}
```

- [ ] **Step 2: Créer les configs**

`vite.config.ts` :
```ts
/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  base: "/life-clicker/",
  plugins: [svelte()],
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
```

`svelte.config.js` :
```js
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
export default { preprocess: vitePreprocess() };
```

`tsconfig.json` :
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "types": ["svelte", "vite/client"]
  },
  "include": ["src/**/*.ts", "src/**/*.svelte", "tests/**/*.ts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

`tsconfig.node.json` :
```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "types": ["node"]
  },
  "include": ["vite.config.ts"]
}
```

`src/vite-env.d.ts` :
```ts
/// <reference types="svelte" />
/// <reference types="vite/client" />
```

- [ ] **Step 3: Créer `index.html`, `src/main.ts`, `src/ui/App.svelte` (placeholder)**

`index.html` :
```html
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Life Clicker</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

`src/main.ts` :
```ts
import { mount } from "svelte";
import App from "./ui/App.svelte";

const app = mount(App, { target: document.getElementById("app")! });
export default app;
```

`src/ui/App.svelte` :
```svelte
<script lang="ts">
  // placeholder — remplacé en Task 10
</script>

<main>Life Clicker — bientôt.</main>
```

- [ ] **Step 4: Installer et vérifier**

Run :
```bash
npm install
npm run build
```
Expected : `npm install` réussit ; `npm run build` produit `dist/` sans erreur.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + Svelte 5 + TS + Vitest"
```

---

### Task 2: `numbers.ts` — wrapper Decimal + formatage

**Files:**
- Create: `src/engine/numbers.ts`
- Test: `tests/numbers.test.ts`

**Interfaces:**
- Consumes: `break_infinity.js`.
- Produces:
  - `type Decimal` (ré-export du type de break_infinity).
  - `D(x: Decimal.Value): Decimal` — factory.
  - `ZERO: Decimal`.
  - `fmtMoney(value: Decimal): string` — `< 1 €` → centimes (« 5 c ») ; `< 1e6` → « 12.34 € » ; sinon notation exponentielle (« 1.23e8 € »).

- [ ] **Step 1: Test qui échoue**

`tests/numbers.test.ts` :
```ts
import { describe, it, expect } from "vitest";
import { D, ZERO, fmtMoney } from "../src/engine/numbers";

describe("numbers", () => {
  it("D crée un Decimal additionnable", () => {
    expect(D(0.05).add(D(0.05)).toNumber()).toBeCloseTo(0.1);
  });
  it("ZERO vaut 0", () => {
    expect(ZERO.toNumber()).toBe(0);
  });
  it("fmtMoney affiche les centimes sous 1 €", () => {
    expect(fmtMoney(D(0.05))).toBe("5 c");
  });
  it("fmtMoney affiche les euros à 2 décimales", () => {
    expect(fmtMoney(D(12.3))).toBe("12.30 €");
  });
  it("fmtMoney passe en exponentiel pour les grands nombres", () => {
    expect(fmtMoney(D(1.23e8))).toBe("1.23e8 €");
  });
});
```

- [ ] **Step 2: Vérifier l'échec**

Run : `npm run test`
Expected : FAIL (`numbers.ts` introuvable).

- [ ] **Step 3: Implémenter**

`src/engine/numbers.ts` :
```ts
import Decimal from "break_infinity.js";

export type { Decimal };
export const D = (x: Decimal.Value): Decimal => new Decimal(x);
export const ZERO: Decimal = new Decimal(0);

export function fmtMoney(value: Decimal): string {
  if (value.lt(1)) {
    return `${value.mul(100).toFixed(0)} c`;
  }
  if (value.lt(1e6)) {
    return `${value.toFixed(2)} €`;
  }
  return `${value.toExponential(2)} €`;
}
```

- [ ] **Step 4: Vérifier le succès**

Run : `npm run test`
Expected : PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/engine/numbers.ts tests/numbers.test.ts
git commit -m "feat(engine): wrapper Decimal + formatage monétaire"
```

---

### Task 3: `economy.ts` — courbe de coût

**Files:**
- Create: `src/engine/economy.ts`
- Test: `tests/economy.test.ts`

**Interfaces:**
- Consumes: `D`, `Decimal`, `ZERO` de `numbers.ts`.
- Produces: `costOf(base: Decimal, growth: number, owned: number, count?: number): Decimal` — coût d'achat de `count` unités à partir de `owned` déjà possédées, croissance géométrique de ratio `growth`. (`production(state)` est ajoutée en Task 6 une fois `GameState` connu.)

- [ ] **Step 1: Test qui échoue**

`tests/economy.test.ts` :
```ts
import { describe, it, expect } from "vitest";
import { D } from "../src/engine/numbers";
import { costOf } from "../src/engine/economy";

describe("costOf", () => {
  it("vaut le prix de base quand rien n'est possédé", () => {
    expect(costOf(D(10), 1.15, 0).toNumber()).toBeCloseTo(10);
  });
  it("croît de ×1,15 par unité possédée", () => {
    expect(costOf(D(10), 1.15, 1).toNumber()).toBeCloseTo(11.5);
  });
  it("somme correctement un achat groupé (série géométrique)", () => {
    // 10 + 11.5 = 21.5 pour 2 unités à partir de 0
    expect(costOf(D(10), 1.15, 0, 2).toNumber()).toBeCloseTo(21.5);
  });
});
```

- [ ] **Step 2: Vérifier l'échec**

Run : `npm run test economy`
Expected : FAIL (`economy.ts` introuvable).

- [ ] **Step 3: Implémenter**

`src/engine/economy.ts` :
```ts
import { D, type Decimal } from "./numbers";

export function costOf(base: Decimal, growth: number, owned: number, count = 1): Decimal {
  const g = D(growth);
  const first = base.mul(g.pow(owned));
  if (count <= 1) return first;
  const factor = g.pow(count).sub(1).div(g.sub(1));
  return first.mul(factor);
}
```

- [ ] **Step 4: Vérifier le succès**

Run : `npm run test economy`
Expected : PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/engine/economy.ts tests/economy.test.ts
git commit -m "feat(engine): courbe de coût géométrique costOf"
```

---

### Task 4: `state.ts` — GameState + état initial

**Files:**
- Create: `src/engine/state.ts`
- Test: `tests/state.test.ts`

**Interfaces:**
- Consumes: `D`, `Decimal`, `ZERO` de `numbers.ts`.
- Produces:
  - `const SAVE_VERSION = 1`.
  - `interface GameState { version: number; money: Decimal; perClick: Decimal; generators: Record<string, number>; flags: Record<string, boolean>; tempo: number; startedAt: number; lastSeen: number; totalClicks: number; }`.
  - `createInitialState(now: number): GameState`.

- [ ] **Step 1: Test qui échoue**

`tests/state.test.ts` :
```ts
import { describe, it, expect } from "vitest";
import { createInitialState, SAVE_VERSION } from "../src/engine/state";

describe("createInitialState", () => {
  it("démarre à 0 € avec 0.05 €/clic", () => {
    const s = createInitialState(1000);
    expect(s.money.toNumber()).toBe(0);
    expect(s.perClick.toNumber()).toBeCloseTo(0.05);
  });
  it("initialise les méta-champs", () => {
    const s = createInitialState(1000);
    expect(s.version).toBe(SAVE_VERSION);
    expect(s.tempo).toBe(1);
    expect(s.startedAt).toBe(1000);
    expect(s.lastSeen).toBe(1000);
    expect(s.totalClicks).toBe(0);
    expect(s.generators).toEqual({});
    expect(s.flags).toEqual({});
  });
});
```

- [ ] **Step 2: Vérifier l'échec**

Run : `npm run test state`
Expected : FAIL (`state.ts` introuvable).

- [ ] **Step 3: Implémenter**

`src/engine/state.ts` :
```ts
import { D, type Decimal, ZERO } from "./numbers";

export const SAVE_VERSION = 1;

export interface GameState {
  version: number;
  money: Decimal;
  perClick: Decimal;
  generators: Record<string, number>;
  flags: Record<string, boolean>;
  tempo: number;
  startedAt: number;
  lastSeen: number;
  totalClicks: number;
}

export function createInitialState(now: number): GameState {
  return {
    version: SAVE_VERSION,
    money: ZERO,
    perClick: D(0.05),
    generators: {},
    flags: {},
    tempo: 1,
    startedAt: now,
    lastSeen: now,
    totalClicks: 0,
  };
}
```

- [ ] **Step 4: Vérifier le succès**

Run : `npm run test state`
Expected : PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/engine/state.ts tests/state.test.ts
git commit -m "feat(engine): GameState + createInitialState"
```

---

### Task 5: Contenu P0 + actions joueur

**Files:**
- Create: `src/engine/content/generators.ts`, `src/engine/actions.ts`
- Test: `tests/actions.test.ts`

**Interfaces:**
- Consumes: `GameState` (Task 4), `costOf` (Task 3), `D`/`Decimal` (Task 2).
- Produces:
  - `interface GeneratorDef { id: string; label: string; baseCost: Decimal; growth: number; baseOutput: Decimal; unlockAtMoney: Decimal; }`.
  - `GENERATORS: GeneratorDef[]` (contient `collegue`).
  - `GENERATORS_BY_ID: Record<string, GeneratorDef>`.
  - `clickWork(state): void` — ajoute `state.perClick` à `state.money`, incrémente `totalClicks`.
  - `generatorCost(state, id): Decimal`.
  - `canBuyGenerator(state, id): boolean`.
  - `buyGenerator(state, id): boolean` — débite et incrémente si abordable, renvoie le succès.

- [ ] **Step 1: Test qui échoue**

`tests/actions.test.ts` :
```ts
import { describe, it, expect } from "vitest";
import { createInitialState } from "../src/engine/state";
import { clickWork, buyGenerator, generatorCost, canBuyGenerator } from "../src/engine/actions";

describe("actions P0", () => {
  it("clickWork ajoute le revenu par clic", () => {
    const s = createInitialState(0);
    clickWork(s);
    expect(s.money.toNumber()).toBeCloseTo(0.05);
    expect(s.totalClicks).toBe(1);
  });
  it("buyGenerator échoue si l'argent manque", () => {
    const s = createInitialState(0);
    expect(buyGenerator(s, "collegue")).toBe(false);
    expect(s.generators["collegue"]).toBeUndefined();
  });
  it("buyGenerator débite et incrémente quand abordable", () => {
    const s = createInitialState(0);
    s.money = generatorCost(s, "collegue");
    expect(canBuyGenerator(s, "collegue")).toBe(true);
    expect(buyGenerator(s, "collegue")).toBe(true);
    expect(s.generators["collegue"]).toBe(1);
    expect(s.money.toNumber()).toBeCloseTo(0);
  });
});
```

- [ ] **Step 2: Vérifier l'échec**

Run : `npm run test actions`
Expected : FAIL (`actions.ts` introuvable).

- [ ] **Step 3: Implémenter le contenu**

`src/engine/content/generators.ts` :
```ts
import { D, type Decimal } from "../numbers";

export interface GeneratorDef {
  id: string;
  label: string;
  baseCost: Decimal;
  growth: number;
  baseOutput: Decimal; // €/s par unité
  unlockAtMoney: Decimal; // seuil de révélation
}

export const GENERATORS: GeneratorDef[] = [
  {
    id: "collegue",
    label: "Un collègue couvre un créneau",
    baseCost: D(1),
    growth: 1.15,
    baseOutput: D(0.1),
    unlockAtMoney: D(0.5),
  },
];

export const GENERATORS_BY_ID: Record<string, GeneratorDef> =
  Object.fromEntries(GENERATORS.map((g) => [g.id, g]));
```

- [ ] **Step 4: Implémenter les actions**

`src/engine/actions.ts` :
```ts
import { type Decimal } from "./numbers";
import type { GameState } from "./state";
import { costOf } from "./economy";
import { GENERATORS_BY_ID } from "./content/generators";

export function clickWork(state: GameState): void {
  state.money = state.money.add(state.perClick);
  state.totalClicks += 1;
}

export function generatorCost(state: GameState, id: string): Decimal {
  const def = GENERATORS_BY_ID[id];
  const owned = state.generators[id] ?? 0;
  return costOf(def.baseCost, def.growth, owned);
}

export function canBuyGenerator(state: GameState, id: string): boolean {
  return state.money.gte(generatorCost(state, id));
}

export function buyGenerator(state: GameState, id: string): boolean {
  const cost = generatorCost(state, id);
  if (state.money.lt(cost)) return false;
  state.money = state.money.sub(cost);
  state.generators[id] = (state.generators[id] ?? 0) + 1;
  return true;
}
```

- [ ] **Step 5: Vérifier le succès**

Run : `npm run test actions`
Expected : PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/engine/content/generators.ts src/engine/actions.ts tests/actions.test.ts
git commit -m "feat(engine): contenu P0 (collègue) + actions clic/achat"
```

---

### Task 6: `loop.ts` — tick + production + flags de déblocage

**Files:**
- Create: `src/engine/loop.ts`
- Modify: `src/engine/economy.ts` (ajout de `production`)
- Test: `tests/loop.test.ts`

**Interfaces:**
- Consumes: `GameState`, `GENERATORS`/`GENERATORS_BY_ID`, `ZERO`/`Decimal`.
- Produces:
  - `production(state: GameState): Decimal` (dans `economy.ts`) — somme des `baseOutput × count`, en €/s.
  - `updateFlags(state: GameState): void` — pose `flags.moneyVisible` (dès le 1er clic ou 1er €) et `flags.gen_<id>_unlocked` (quand `money ≥ unlockAtMoney`).
  - `tick(state: GameState, dt: number): void` — applique `dt × tempo`, ajoute `production × dt`, puis `updateFlags`.

- [ ] **Step 1: Test qui échoue**

`tests/loop.test.ts` :
```ts
import { describe, it, expect } from "vitest";
import { createInitialState } from "../src/engine/state";
import { tick, updateFlags } from "../src/engine/loop";
import { production } from "../src/engine/economy";
import { D } from "../src/engine/numbers";

describe("loop", () => {
  it("production = 0 sans générateur", () => {
    const s = createInitialState(0);
    expect(production(s).toNumber()).toBe(0);
  });
  it("tick accumule la production sur dt", () => {
    const s = createInitialState(0);
    s.generators["collegue"] = 2; // 2 × 0.1 = 0.2 €/s
    tick(s, 10); // 10 s
    expect(s.money.toNumber()).toBeCloseTo(2);
  });
  it("le tempo accélère le temps", () => {
    const s = createInitialState(0);
    s.generators["collegue"] = 1; // 0.1 €/s
    s.tempo = 2;
    tick(s, 10); // 10 s × 2 = 20 s → 2 €
    expect(s.money.toNumber()).toBeCloseTo(2);
  });
  it("updateFlags révèle le compteur après un clic", () => {
    const s = createInitialState(0);
    s.totalClicks = 1;
    updateFlags(s);
    expect(s.flags.moneyVisible).toBe(true);
  });
  it("updateFlags débloque le générateur au seuil", () => {
    const s = createInitialState(0);
    s.money = D(0.5);
    updateFlags(s);
    expect(s.flags["gen_collegue_unlocked"]).toBe(true);
  });
});
```

- [ ] **Step 2: Vérifier l'échec**

Run : `npm run test loop`
Expected : FAIL (`loop.ts` introuvable / `production` non exportée).

- [ ] **Step 3: Ajouter `production` à `economy.ts`**

Remplacer **tout** le contenu de `src/engine/economy.ts` par (les `import` doivent rester en haut du fichier — on fusionne, on n'ajoute pas d'`import` en bas) :
```ts
import { D, ZERO, type Decimal } from "./numbers";
import type { GameState } from "./state";
import { GENERATORS_BY_ID } from "./content/generators";

export function costOf(base: Decimal, growth: number, owned: number, count = 1): Decimal {
  const g = D(growth);
  const first = base.mul(g.pow(owned));
  if (count <= 1) return first;
  const factor = g.pow(count).sub(1).div(g.sub(1));
  return first.mul(factor);
}

export function production(state: GameState): Decimal {
  let total = ZERO;
  for (const id in state.generators) {
    const def = GENERATORS_BY_ID[id];
    if (!def) continue;
    total = total.add(def.baseOutput.mul(state.generators[id]));
  }
  return total;
}
```

- [ ] **Step 4: Implémenter `loop.ts`**

`src/engine/loop.ts` :
```ts
import type { GameState } from "./state";
import { production } from "./economy";
import { GENERATORS } from "./content/generators";

export function updateFlags(state: GameState): void {
  if (!state.flags.moneyVisible && (state.totalClicks > 0 || state.money.gt(0))) {
    state.flags.moneyVisible = true;
  }
  for (const g of GENERATORS) {
    const flag = `gen_${g.id}_unlocked`;
    if (!state.flags[flag] && state.money.gte(g.unlockAtMoney)) {
      state.flags[flag] = true;
    }
  }
}

export function tick(state: GameState, dt: number): void {
  const scaled = dt * state.tempo;
  state.money = state.money.add(production(state).mul(scaled));
  updateFlags(state);
}
```

- [ ] **Step 5: Vérifier le succès**

Run : `npm run test`
Expected : PASS (tous les fichiers).

- [ ] **Step 6: Commit**

```bash
git add src/engine/loop.ts src/engine/economy.ts tests/loop.test.ts
git commit -m "feat(engine): tick, production et flags de déblocage"
```

---

### Task 7: `save.ts` — sérialisation versionnée + migrate

**Files:**
- Create: `src/engine/save.ts`
- Test: `tests/save.test.ts`

**Interfaces:**
- Consumes: `GameState`, `SAVE_VERSION`, `createInitialState`, `D`.
- Produces:
  - `serialize(state: GameState): string` (Decimal → string).
  - `deserialize(json: string): GameState` (string → Decimal, applique `migrate`).
  - `migrate(raw: any): any` (no-op v1, point d'extension).
  - `save(state: GameState): void` / `load(now: number): GameState` (localStorage ; corrompu → backup + état neuf ; version future → état neuf).

- [ ] **Step 1: Test qui échoue**

`tests/save.test.ts` :
```ts
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
```

- [ ] **Step 2: Vérifier l'échec**

Run : `npm run test save`
Expected : FAIL (`save.ts` introuvable). *(jsdom est fourni par Vitest ; si l'environnement manque, ajouter `jsdom` en devDependency.)*

- [ ] **Step 3: Implémenter**

`src/engine/save.ts` :
```ts
import { D, type Decimal } from "./numbers";
import { type GameState, SAVE_VERSION, createInitialState } from "./state";

const KEY = "life-clicker-save";
const BACKUP_KEY = "life-clicker-save-backup";

export function serialize(state: GameState): string {
  return JSON.stringify({
    ...state,
    money: state.money.toString(),
    perClick: state.perClick.toString(),
  });
}

export function migrate(raw: any): any {
  const s = raw;
  // v1 : aucune migration. Point d'extension : if (s.version < 2) { ...; s.version = 2; }
  return s;
}

export function deserialize(json: string): GameState {
  const migrated = migrate(JSON.parse(json));
  return {
    ...migrated,
    money: D(migrated.money) as Decimal,
    perClick: D(migrated.perClick) as Decimal,
  };
}

export function save(state: GameState): void {
  try {
    localStorage.setItem(KEY, serialize(state));
  } catch (e) {
    console.error("Échec de sauvegarde", e);
  }
}

export function load(now: number): GameState {
  const json = localStorage.getItem(KEY);
  if (!json) return createInitialState(now);
  try {
    const state = deserialize(json);
    if (state.version > SAVE_VERSION) {
      console.warn("Save d'une version plus récente — démarrage à neuf");
      return createInitialState(now);
    }
    return state;
  } catch (e) {
    console.error("Save corrompue — backup et démarrage à neuf", e);
    localStorage.setItem(BACKUP_KEY, json);
    return createInitialState(now);
  }
}
```

- [ ] **Step 4: Vérifier le succès**

Run : `npm run test save`
Expected : PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/engine/save.ts tests/save.test.ts
git commit -m "feat(engine): sauvegarde localStorage versionnée + migrate"
```

---

### Task 8: `offline.ts` — progrès hors-ligne plafonné

**Files:**
- Create: `src/engine/offline.ts`
- Test: `tests/offline.test.ts`

**Interfaces:**
- Consumes: `GameState`, `production`, `Decimal`.
- Produces:
  - `const OFFLINE_CAP_SECONDS = 14400` (4 h).
  - `applyOffline(state, now): { seconds: number; earned: Decimal }` — crédite la production sur `min(elapsed, cap) × tempo` (calcul fermé), met à jour `lastSeen`.

- [ ] **Step 1: Test qui échoue**

`tests/offline.test.ts` :
```ts
import { describe, it, expect } from "vitest";
import { createInitialState } from "../src/engine/state";
import { applyOffline, OFFLINE_CAP_SECONDS } from "../src/engine/offline";

describe("applyOffline", () => {
  it("crédite la production sur le temps écoulé", () => {
    const s = createInitialState(0);
    s.generators["collegue"] = 1; // 0.1 €/s
    const r = applyOffline(s, 10_000); // 10 s
    expect(r.seconds).toBeCloseTo(10);
    expect(r.earned.toNumber()).toBeCloseTo(1);
    expect(s.money.toNumber()).toBeCloseTo(1);
    expect(s.lastSeen).toBe(10_000);
  });
  it("plafonne le temps hors-ligne", () => {
    const s = createInitialState(0);
    s.generators["collegue"] = 1;
    const r = applyOffline(s, (OFFLINE_CAP_SECONDS + 1000) * 1000);
    expect(r.seconds).toBeCloseTo(OFFLINE_CAP_SECONDS);
  });
  it("ne crédite rien sans générateur", () => {
    const s = createInitialState(0);
    const r = applyOffline(s, 10_000);
    expect(r.earned.toNumber()).toBe(0);
  });
});
```

- [ ] **Step 2: Vérifier l'échec**

Run : `npm run test offline`
Expected : FAIL (`offline.ts` introuvable).

- [ ] **Step 3: Implémenter**

`src/engine/offline.ts` :
```ts
import type { GameState } from "./state";
import { production } from "./economy";
import { type Decimal } from "./numbers";

export const OFFLINE_CAP_SECONDS = 4 * 3600;

export function applyOffline(state: GameState, now: number): { seconds: number; earned: Decimal } {
  const elapsed = Math.max(0, (now - state.lastSeen) / 1000);
  const seconds = Math.min(elapsed, OFFLINE_CAP_SECONDS) * state.tempo;
  const earned = production(state).mul(seconds);
  state.money = state.money.add(earned);
  state.lastSeen = now;
  return { seconds, earned };
}
```

- [ ] **Step 4: Vérifier le succès**

Run : `npm run test offline`
Expected : PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/engine/offline.ts tests/offline.test.ts
git commit -m "feat(engine): progrès hors-ligne plafonné"
```

---

### Task 9: `store.svelte.ts` + boucle RAF dans `main.ts`

**Files:**
- Create: `src/ui/store.svelte.ts`
- Modify: `src/main.ts`

**Interfaces:**
- Consumes: `load`, `save`, `applyOffline`, `tick`, `GameState`.
- Produces: `game` — objet `$state` `{ state: GameState; offlineEarned: Decimal | null }`. `main.ts` lance la boucle RAF (clamp du `dt`), met à jour `lastSeen`, sauvegarde toutes les ~10 s, et sur `beforeunload`/`visibilitychange`.

- [ ] **Step 1: Implémenter le store**

`src/ui/store.svelte.ts` :
```ts
import { load } from "../engine/save";
import { applyOffline } from "../engine/offline";
import type { GameState } from "../engine/state";
import type { Decimal } from "../engine/numbers";

const bootNow = Date.now();
const initial = load(bootNow);
const report = applyOffline(initial, bootNow);

export const game = $state<{ state: GameState; offlineEarned: Decimal | null }>({
  state: initial,
  offlineEarned: report.seconds > 1 && report.earned.gt(0) ? report.earned : null,
});
```

- [ ] **Step 2: Implémenter la boucle dans `main.ts`**

`src/main.ts` :
```ts
import { mount } from "svelte";
import App from "./ui/App.svelte";
import { game } from "./ui/store.svelte";
import { tick } from "./engine/loop";
import { save } from "./engine/save";

const app = mount(App, { target: document.getElementById("app")! });

let last = performance.now();
let sinceSave = 0;

function frame(t: number): void {
  const dt = Math.min((t - last) / 1000, 60); // clamp les gros écarts (onglet en arrière-plan)
  last = t;
  tick(game.state, dt);
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
```

- [ ] **Step 3: Vérifier le build**

Run : `npm run build`
Expected : build OK, aucune erreur de type.

- [ ] **Step 4: Commit**

```bash
git add src/ui/store.svelte.ts src/main.ts
git commit -m "feat(ui): store réactif + boucle RAF avec sauvegarde"
```

---

### Task 10: `App.svelte` — UI P0 jouable + thème Acte I

**Files:**
- Modify: `src/ui/App.svelte`

**Interfaces:**
- Consumes: `game` (store), `clickWork`/`buyGenerator`/`generatorCost`/`canBuyGenerator`, `GENERATORS`, `fmtMoney`.
- Produces: l'écran P0 : bouton « Laver une assiette », compteur révélé après le 1er clic, bouton d'achat du générateur révélé au seuil, bandeau de retour hors-ligne. Thème monochrome via `data-act="1"` + variables CSS.

- [ ] **Step 1: Implémenter le composant**

`src/ui/App.svelte` :
```svelte
<script lang="ts">
  import { game } from "./store.svelte";
  import {
    clickWork,
    buyGenerator,
    generatorCost,
    canBuyGenerator,
  } from "../engine/actions";
  import { GENERATORS } from "../engine/content/generators";
  import { fmtMoney } from "../engine/numbers";

  const s = $derived(game.state);
</script>

<main data-act="1">
  <h1>Plongeur</h1>

  {#if game.offlineEarned}
    <p class="offline">Pendant ton absence, tu as gagné {fmtMoney(game.offlineEarned)}.</p>
  {/if}

  {#if s.flags.moneyVisible}
    <div class="counter">{fmtMoney(s.money)}</div>
  {/if}

  <button class="action" onclick={() => clickWork(s)}>Laver une assiette</button>

  {#each GENERATORS as g (g.id)}
    {#if s.flags[`gen_${g.id}_unlocked`]}
      <button
        class="buy"
        disabled={!canBuyGenerator(s, g.id)}
        onclick={() => buyGenerator(s, g.id)}
      >
        {g.label} — {fmtMoney(generatorCost(s, g.id))}
        {#if s.generators[g.id]}<span class="owned">×{s.generators[g.id]}</span>{/if}
      </button>
    {/if}
  {/each}
</main>

<style>
  :global(body) {
    margin: 0;
  }
  main[data-act="1"] {
    --bg: #0a0a0a;
    --fg: #d6d6d6;
    --line: #333;
    background: var(--bg);
    color: var(--fg);
    font-family: "Courier New", monospace;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.25rem;
    padding: 2rem;
  }
  h1 {
    font-weight: normal;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    font-size: 1rem;
    opacity: 0.6;
    margin: 0;
  }
  .counter {
    font-size: 2.5rem;
    font-variant-numeric: tabular-nums;
  }
  .offline {
    opacity: 0.7;
    font-style: italic;
  }
  button {
    background: transparent;
    color: var(--fg);
    border: 1px solid var(--line);
    padding: 0.6rem 1.2rem;
    font-family: inherit;
    font-size: 1rem;
    cursor: pointer;
    transition: border-color 0.15s;
  }
  button:hover:not(:disabled) {
    border-color: var(--fg);
  }
  button:disabled {
    opacity: 0.35;
    cursor: default;
  }
  .action {
    font-size: 1.1rem;
  }
  .owned {
    opacity: 0.6;
    margin-left: 0.5rem;
  }
</style>
```

- [ ] **Step 2: Lancer le dev server et vérifier manuellement**

Run : `npm run dev`
Vérifier dans le navigateur :
- Écran noir & blanc, titre « PLONGEUR », un bouton « Laver une assiette ».
- Au 1er clic : le compteur apparaît, monte de 5 c par clic.
- À 0,50 € : le bouton « Un collègue couvre un créneau — 1.00 € » apparaît (désactivé tant qu'on n'a pas 1 €).
- Après achat : l'argent monte tout seul (revenu auto).
- Recharger la page : la progression est conservée.

- [ ] **Step 3: Vérifier build + tests**

Run : `npm run build && npm run test`
Expected : build OK ; tous les tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/ui/App.svelte
git commit -m "feat(ui): écran P0 jouable + thème monochrome Acte I"
```

---

### Task 11: Déploiement GitHub Pages

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: `npm run build` → `dist/`. `vite.config.ts` a déjà `base: "/life-clicker/"` (Task 1).
- Produces: un workflow qui build et publie `dist/` sur GitHub Pages à chaque push sur `main`.

- [ ] **Step 1: Créer le workflow**

`.github/workflows/deploy.yml` :
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: déploiement GitHub Pages"
```

- [ ] **Step 3: Note manuelle (utilisateur)**

Dans les *Settings → Pages* du repo GitHub, régler **Source = GitHub Actions**. Le `npm ci` exige un `package-lock.json` commité (généré par le `npm install` de la Task 1) — vérifier qu'il est bien versionné.

---

## Notes de suivi (hors périmètre de ce plan)

- **P1** (compétences + Vie/Énergie/Sens) et **P2** (vrai job + automatisation du clic + début Famille) feront chacun leur propre plan, en réutilisant ce socle (état data-driven, `tick`, save/migrate, theming par tokens).
- Le **harnais de simulation d'équilibrage** (fast-forward N heures) sera ajouté quand il y aura assez de contenu pour qu'il soit utile (probablement fin P2).
