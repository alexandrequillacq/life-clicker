# Stack technique & architecture — Spec d'implémentation (v1)

- **Date :** 2026-06-21
- **Statut :** validé par l'utilisateur, prêt pour le plan d'implémentation
- **Compagnon du :** [GDD v1](2026-06-21-idlegame-design.md) — ce doc est le *comment technique* ; le GDD est le *quoi de design* ; la [base de connaissance](../../../knowledge/README.md) est le *pourquoi*.

---

## 1. Décisions actées

| Sujet | Décision | Pourquoi |
|---|---|---|
| **Plateforme** | Web, 100 % client (pas de backend, pas de comptes) | Imposé par le GDD §12-13. UI qui évolue via DOM/CSS, facile à itérer/partager. |
| **Framework** | **Svelte 5 + Vite + TypeScript** | Réactivité fine (runes) idéale pour 30+ valeurs qui montent à chaque tick ; très peu de boilerplate (itération solo) ; styles *scoped* + variables CSS parfaits pour l'UI qui évolue par acte ; bundle minuscule. |
| **Gros nombres** | `break_infinity.js` (`Decimal`) | Les compteurs cosmiques de P8 dépassent `Number.MAX_SAFE_INTEGER` (~9e15). `break_infinity.js` est le standard idle, plus rapide que `decimal.js`. |
| **Tests** | **Vitest** | Le moteur est de la logique pure → TDD ; sert aussi de **harnais d'équilibrage**. |
| **Persistance** | `localStorage`, JSON versionné | Sauvegarde locale (GDD §11). |
| **Déploiement** | GitHub Actions → **GitHub Pages** (statique) | Repo déjà créé ; build Vite statique. |

**Principe directeur** : **séparer le moteur de jeu (TypeScript pur) de l'affichage (Svelte)**. Le moteur détient l'état autoritaire et toute la logique ; l'UI s'y abonne et affiche. Le framework devient quasi interchangeable, et le moteur reste testable au cordeau — c'est ce qui permet de playtester/équilibrer chaque tranche sereinement.

## 2. Arborescence

```
life-clicker/
├─ src/
│  ├─ engine/                 # TypeScript PUR — aucun import Svelte → 100% testable
│  │  ├─ state.ts             # type GameState + état initial (createInitialState)
│  │  ├─ loop.ts              # tick(state, dt) : fait avancer le monde (pur, déterministe)
│  │  ├─ economy.ts           # costOf(), production(), multiplicateurs de palier
│  │  ├─ life.ts              # énergie / sens / famille + pénalité d'automatisation
│  │  ├─ unlocks.ts           # conditions de déblocage (flags pilotant la révélation UI)
│  │  ├─ events.ts            # file d'events diégétiques + bonus aléatoires
│  │  ├─ prestige.ts          # réincarnation / karma (formule sous-linéaire)
│  │  ├─ save.ts              # sérialisation versionnée + migrate()
│  │  ├─ offline.ts           # progrès hors-ligne plafonné (calcul fermé)
│  │  ├─ numbers.ts           # wrapper break_infinity + formatage (€, notation sci.)
│  │  └─ content/             # DONNÉES (data-driven) — pas de logique
│  │     ├─ phases.ts         # P0..P8 : métier, verbe, conditions de sortie
│  │     ├─ upgrades.ts       # upgrades couche 1 (contenu familier)
│  │     ├─ generators.ts     # générateurs auto (collègue, employés…)
│  │     ├─ skills.ts         # arbre de compétences + paliers
│  │     └─ events.ts         # textes diégétiques par phase
│  ├─ ui/                     # Svelte — couche mince
│  │  ├─ store.ts             # pont moteur ↔ Svelte (push de l'état à chaque tick)
│  │  ├─ App.svelte
│  │  ├─ theme/               # tokens CSS par acte + transitions
│  │  ├─ panels/              # Skills, Life, Family, Employees, Market, Audience…
│  │  └─ components/          # Button, Counter, EventLog, Panel…
│  └─ main.ts                 # démarre la boucle RAF, charge la save, monte l'app
├─ tests/                     # Vitest (surtout moteur) + sim d'équilibrage
├─ .github/workflows/deploy.yml
├─ index.html
├─ vite.config.ts
├─ tsconfig.json
└─ package.json
```

## 3. Le moteur (`engine/`)

### 3.1 `GameState` (un seul objet sérialisable)
- **Ressources** : `money` et compteurs cosmiques en `Decimal` (break_infinity) ; `energy` et `sens` en nombres bornés 0–100.
- **Progression** : niveaux de compétences, générateurs possédés (par id → quantité), phase courante (`P0..P8`), `flags` de déblocage (bool par panneau/feature).
- **Vie** : état énergie/sens, état Famille (étape : aucun → rencontre → couple → enfants), activités automatisées (set d'ids).
- **Méta** : `tempo` (coefficient de vitesse), `karma` (prestige), timestamps (`lastSeen`, `startedAt`), `version`.

### 3.2 `tick(state, dt)` — pur & déterministe
À chaque pas : applique le coefficient `tempo` à `dt` ; accumule la production (`economy.production`) ; décroît l'énergie ; accumule/vide le **Sens** selon le ratio de vie *réellement vécue* vs automatisée ; ré-évalue les **conditions de déblocage** (`unlocks`) ; pousse les **events** déclenchés. Déterministe pour `(state, dt)` donnés ⇒ entièrement testable.

### 3.3 `economy.ts` — fonctions pures
- `costOf(item, n)` : coût du n-ième achat, courbe `× ~1,15`.
- `production(state)` : revenu/s agrégé, générateurs `× ~1,1`, multiplié par l'énergie.
- Multiplicateurs de **palier** (doublement) : compétences 5/10/25, employés 25/50/100.
- Règle encodée : **aucun pas de progrès < +20 %** (sinon il ne se *sent* pas).

### 3.4 Boucle (dans `main.ts`)
`requestAnimationFrame` → calcule le vrai `dt` (clampé pour les gros écarts/onglet en arrière-plan) → `tick` → save throttlée (~10 s). Logique basée sur `dt` ⇒ indépendante du framerate.

## 4. Sauvegarde & hors-ligne

- **`save.ts`** : une clé `localStorage`, JSON avec champ `version`. Auto-save ~10 s + sur `visibilitychange`/`beforeunload`. `Decimal` sérialisé en string.
- **Migrations** : `migrate(save)` fait monter les vieilles saves version par version. **Indispensable** : on construit par tranches, le schéma grossit, et on ne doit jamais casser une save existante.
- **`offline.ts`** : au chargement, `elapsed = now − lastSeen`, **plafonné** (ex. 2–4 h). Accumulation par **calcul fermé** (pas de simulation de millions de ticks). Affiche le récap « pendant ton absence… ».
- **Robustesse** : save corrompue → catch, **backup du blob fautif** (jamais d'effacement silencieux), repart propre. Save « du futur » → refus gracieux.

## 5. Couche UI (`ui/`)

- **`store.ts`** : le moteur détient l'état autoritaire ; la boucle pousse l'état dans un store Svelte (`$state`) à chaque tick. La réactivité fine ne re-render que les compteurs qui changent.
- **Révélation progressive** : chaque panneau est conditionné par un flag du moteur (`{#if flags.skillsUnlocked}`). Cold-open P0 = un seul bouton à l'écran. « Un seul élément à la fois » (GDD §6).
- **Texte diégétique** : composant `EventLog` + file d'events du moteur. Aucune cinématique.
- **Theming par acte** *(cœur visuel)* : attribut `data-act="1|2|3"` sur la racine + **variables CSS** (`--bg`, `--fg`, `--accent`, police, rayons, intensité d'animation). Les composants ne référencent **que des tokens**. Faire « embellir puis basculer » = changer le jeu de tokens, avec transitions CSS — **pas de réécriture d'écran**. 1ʳᵉ couleur (fin Acte I) = on introduit un token d'accent ; bascule Acte III = jeu de tokens froid/contrasté.

## 6. Tests & équilibrage (Vitest)

- **TDD moteur** : courbes de coût, production, paliers, décroissance énergie, accumulation/pénalité Sens, déblocages, round-trip save + migrations, calcul hors-ligne (plafond + accumulation).
- **Harnais d'équilibrage** : un script de simulation *fast-forward* N heures et assied des invariants (« Acte I atteint vers ~13 min », « jamais > X s sans déblocage en vue ») → détecte murs et ventres mous **avant** le playtest.
- **UI** : quelques tests de fumée seulement ; la valeur est dans le moteur.

## 7. Outillage & déploiement

- Vite + `vite-plugin-svelte`, **TypeScript strict**, Vitest, Prettier.
- GitHub Actions : build statique → publication GitHub Pages. `base` Vite configuré sur le nom du repo.

## 8. Ordre de réalisation (suit le GDD §13)

1. **Tranche verticale Acte I (P0–P2) + infra de base** : boucle, économie, save, hors-ligne, tempo, révélation progressive, 1ʳᵉ couleur. **= MVP jouable, testé et équilibré avant tout le reste.**
2. Acte II (P3–P5) : employés, marché/investissements, audience ; apogée visuelle ; tentations d'automatisation de la vie ; révélation du Sens (P5).
3. Acte III (P6–P8) + épilogue + réincarnation : influence/médias, conquête/carte, expansion cosmique ; bascule dystopique ; choix moral final.

**Playtest/équilibrage à chaque tranche.**

## 9. Hors-périmètre (YAGNI)

- ❌ Pas de backend, comptes, cloud, multijoueur, monétisation (GDD §12).
- ❌ Pas de SSR / framework méta (SvelteKit) : une SPA statique suffit.
- ❌ Pas de state-management externe (Redux-like) : le moteur + store Svelte suffisent.
- ❌ Pas d'app native, pas de PWA au départ (web responsive éventuellement plus tard).

---

## Liens
- GDD v1 : [`2026-06-21-idlegame-design.md`](2026-06-21-idlegame-design.md)
- Base de connaissance : [README](../../../knowledge/README.md)
- Journal des décisions : [journal](../../../knowledge/decisions/00-journal-decisions.md)
