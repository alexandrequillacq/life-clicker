# Chapitre 2 (développeur freelance) : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** remplacer l'ancien écran « Résoudre un bug » par le chapitre 2 validé : tu construis des sites (payés à la livraison), tu les entretiens (payés chaque lundi, mais ils envoient des bugs), ta vie se monitore doucement, et le chapitre se termine quand tu embauches Nora en alternance. L'interface part de la page du plongeur et s'enrichit par paliers jusqu'au tableau de bord en verre dépoli.

**Architecture :** un moteur pur et déterministe dans `src/engine/freelance/` (zéro import Svelte, zéro hasard), sur le modèle du plongeur : un sous-état `s.freelance`, une file de nouveautés (une information à la fois, 35 s d'écart), des blocs d'écran calculés par `vue.ts`. Tout le réglage (chiffres, textes, tables) vit dans `src/engine/content/freelance.ts`. L'interface `src/ui/Freelance.svelte` ne fait que mettre les blocs en page ; les paliers visuels (couleur, étiquettes, ombre, verre, menu) sont des classes CSS pilotées par le moteur.

**Tech Stack :** Svelte 5 (runes), Vite 6, TypeScript 5, vitest 2 (+ jsdom pour le test DOM), break_infinity.js (`s.money` est un `Decimal`).

**Spec :** `docs/superpowers/specs/2026-09-27-refonte-progression-cynisme-design.md`, section « Chapitre 2 détaillé : Freelance » (v1, v2, v3, v4, v5). Maquettes validées (hors dépôt, dans le scratchpad de la session de design) : `maquette-freelance-paliers.html` (écrans 0:30, 4:00, 7:30, 10:10) et `maquette-freelance-fin.html` (la fin). Les chiffres et libellés de ce plan en sont tirés.

## Global Constraints

- Tout le texte joueur est en français.
- Jamais de tiret long (—) ni court (–) comme séparateur dans le texte joueur. Le signe moins « − » (U+2212) devant un montant est permis. Les traits d'union orthographiques (« deux-pièces ») aussi.
- Chaque mécanique est cohérente avec sa métaphore réelle. L'énergie ne module QUE les actions actives du joueur (le clic) : jamais l'IA, jamais Nora.
- Monnaie unique : € (`s.money`). Le solde peut être négatif au chapitre 2 (le loyer se paie quand même).
- Chaque achat affiche TOUJOURS un sous-titre chiffré de ce qu'il change.
- Une information à la fois : au moins `FL_NOVELTY_GAP = 35` s entre deux nouveautés du jeu ; jamais plus de 2 à 3 min sans rien (vérifié par la sonde, tâche 16).
- Zéro RNG : tout est daté ou déterministe.
- Le moteur (`src/engine/**`) n'importe jamais Svelte. L'UI n'invente aucun libellé : tout vient de `vue.ts`/`content/freelance.ts`.
- Le nom d'entreprise est un texte libre du joueur : il s'affiche toujours en interpolation Svelte `{...}`, JAMAIS en `{@html}`.
- Lancer les tests : `node_modules/.bin/vitest run` (le wrapper `npm` plante sur un bug sandbox macOS `uv_cwd`). Un seul fichier : `node_modules/.bin/vitest run tests/freelance.test.ts`. Build : `node_modules/.bin/vite build`. Types : `node_modules/.bin/svelte-check --tsconfig ./tsconfig.json`.
- Git : ne jamais committer la suppression de `node_modules` (le statut montre ` D node_modules` dans ce worktree) : toujours `git add` des chemins précis, jamais `git add -A` ni `git commit -a`.
- Chaque message de commit finit par la ligne `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Carte des fichiers

| Fichier | Rôle |
|---|---|
| `src/engine/content/freelance.ts` | Créer. Tout le réglage : calendrier, tailles et prix des commandes, clients, bugs, propositions, outils, logements, énergie, textes. |
| `src/engine/state.ts` | Modifier. Job `"freelance"`, types `FlOrder`, `FlBug`, `FlSite`, `FlLedger`, `FreelanceState`, `createFreelanceState()`, champ `freelance` de `GameState`. |
| `src/engine/save.ts` | Modifier. Valeurs par défaut de `freelance` à la lecture. |
| `src/engine/loop.ts` | Modifier. `tickFreelance` au chapitre 2 ; pas de régénération générique ni de plancher à 0 € au chapitre 2. |
| `src/engine/offline.ts` | Modifier. Hors-ligne du chapitre 2 : 10 min au plus, simulées seconde par seconde, mains au repos. |
| `src/engine/content/career.ts`, `src/engine/content/audience.ts` | Modifier. Entrée `freelance` de `JOBS` ; les liens perdus comptent dans le Sens. |
| `src/engine/plonge/etudes.ts` | Modifier. `answerAnnonce` mène au freelance (plus de `firstColor` : la couleur vient de la chambre). |
| `src/engine/chapitres.ts` | Créer. `startAtChapter(n, now)` : un état neuf posé au début d'un chapitre (outil de test). |
| `src/engine/freelance/commun.ts` | Créer. Calendrier, formats, mains occupées, souvenirs. |
| `src/engine/freelance/finances.ts` | Créer. Entrées et charges de la semaine, lundi, livret. |
| `src/engine/freelance/carnet.ts` | Créer. Commandes, bugs, sites entretenus, clic, IA, livraisons, tests rouges. |
| `src/engine/freelance/entreprise.ts` | Créer. La micro-entreprise : nom, logo, première facture. |
| `src/engine/freelance/revelations.ts` | Créer. La file des nouveautés et ses conditions. |
| `src/engine/freelance/demande.ts` | Créer. Propositions aux clients, commandes de la semaine. |
| `src/engine/freelance/outils.ts` | Créer. Outils et abonnements. |
| `src/engine/freelance/logement.ts` | Créer. Logements, loyer, énergie maximale. |
| `src/engine/freelance/vie.ts` | Créer. Énergie, repas, repas livrés, amis, Maman, sorties. |
| `src/engine/freelance/compromis.ts` | Créer. « Désactiver le test qui échoue ». |
| `src/engine/freelance/sortie.ts` | Créer. Nora. |
| `src/engine/freelance/tick.ts` | Créer. Le temps qui passe. |
| `src/engine/freelance/vue.ts` | Créer. Les blocs d'écran. |
| `src/engine/freelance/index.ts` | Créer. Point d'entrée du module. |
| `src/ui/Freelance.svelte`, `src/ui/freelance/Logo.svelte`, `src/ui/freelance/DeuxPieces.svelte` | Créer. L'écran du chapitre 2, les 5 logos, l'image du deux-pièces. |
| `src/ui/App.svelte`, `src/ui/store.svelte.ts` | Modifier. Routage vers `Freelance`, sélecteur « Chapitre » de test. |
| `tests/freelance.test.ts` | Créer. Tests du moteur, une section `describe` par tâche. |
| `tests/chapitres.test.ts` | Créer. Tests de `startAtChapter`. |
| `tests/ui/freelance.dom.test.ts` | Créer. Test DOM du chapitre 2. |
| `tests/rythme/freelance.ts`, `tests/freelance-rythme.test.ts` | Créer. Joueur simulé et tests de rythme (R7). |
| `tests/plonge.test.ts`, `tests/ui/app.dom.test.ts` | Modifier. L'annonce mène à `"freelance"`. |

## Aide de test commune

Toutes les tâches de moteur ajoutent leurs tests à `tests/freelance.test.ts`. La tâche 2 crée ce fichier avec cet en-tête, que les tâches suivantes complètent (on ajoute les imports au fur et à mesure) :

```ts
import { describe, it, expect } from "vitest";
import { createInitialState, type GameState } from "../src/engine/state";
import { startFreelance } from "../src/engine/freelance";

/** Un état neuf au premier lundi du chapitre 2. */
function fresh(): GameState {
  const s = createInitialState(0);
  startFreelance(s);
  return s;
}
/** Fait passer `secs` secondes de calendrier par pas de `dt`. */
function run(s: GameState, secs: number, dt = 0.05): void {
  for (let t = 0; t < secs - 1e-9; t += dt) tickFreelance(s, Math.min(dt, secs - t));
}
```

(`tickFreelance` est importé depuis `../src/engine/freelance` dès la tâche 2.)

---
### Task 1: Le contenu et l'état du chapitre 2

**Files:**
- Create: `src/engine/content/freelance.ts`
- Modify: `src/engine/state.ts` (types, `createFreelanceState`, champ `freelance`, job `"freelance"`)
- Modify: `src/engine/save.ts` (défaut de `freelance`)
- Modify: `src/engine/content/career.ts` (entrée `freelance` de `JOBS`)
- Modify: `src/ui/App.svelte:84-95` (entrée `freelance` de `APP_TITLES`, sinon `svelte-check` échoue)
- Test: `tests/freelance.test.ts` (créé ici, section « état »)

**Interfaces:**
- Produces : `type Kind = "vitrine" | "appli" | "boutique"` ; tables `KINDS`, `DUVAL`, `PETIT`, `CLIENTS`, `BUG_TEXTS`, `PROPOSALS`, `PROPOSAL_BY_ID`, `TOOLS`, `TOOL_BY_ID`, `HOMES`, `OUTINGS`, `MAMAN_LINES`, `QUOTES`, `LOGO_LABELS`, `TEXTES` et toutes les constantes ci-dessous ; dans `state.ts` : `FlOrder`, `FlBug`, `FlSite`, `FlLedger`, `FlWeek`, `FreelanceState`, `emptyLedger(): FlLedger`, `createFreelanceState(): FreelanceState`, `GameState.freelance`.

- [ ] **Step 1 : écrire le contenu**

Créer `src/engine/content/freelance.ts` :

```ts
// Chapitre 2 : le développeur freelance. Tu construis des sites (payés à la livraison) et tu les entretiens
// (payés chaque lundi) ; chaque site entretenu envoie des bugs, qui passent en tête du carnet. Un bug encore
// ouvert le lundi, et ce client ne paie pas son entretien. La sortie : embaucher Nora pour corriger les bugs.
// Zéro RNG : tout est daté. Tout le réglage vit ici ; le moteur est dans engine/freelance/.
// Spec : docs/superpowers/specs/2026-09-27-refonte-progression-cynisme-design.md, « Chapitre 2 détaillé » (v1 à v5).
import { DAY_NAMES, LIVRET_RATE } from "./plonge";

export { DAY_NAMES, LIVRET_RATE };

// --- Calendrier (le même qu'au plongeur : le temps file) ---
export const FL_DAY_SECS = 15;
export const FL_WEEK_SECS = 7 * FL_DAY_SECS;
export const MONDAY = 0;
export const WEDNESDAY = 2;
export const THURSDAY = 3;
export const FRIDAY = 4;
export const SATURDAY = 5;
export const SUNDAY = 6;

// --- Les nouveautés : une information à la fois ---
export const FL_NOVELTY_GAP = 35; // au moins 35 s entre deux nouveautés que le jeu révèle de lui-même
export const KEEP_UP_SECS = 6; // carnet vide pendant 6 s : tu suis, une proposition aux clients paraît
export const BEHIND_SECS = 6; // en retard pendant 6 s : un outil se propose
export const BEHIND_LINES = 2500; // plus de 2 500 lignes en attente : tu ne suis plus
export const BEHIND_BUGS = 3; // ou 3 bugs en file
export const PROPOSAL_LATE = 120; // une proposition paraît au plus tard 120 s après la nouveauté précédente
export const TOOL_LATE = 60; // un outil se propose au plus tard 60 s après le précédent (v4 : le joueur rapide n'attend plus)

// --- Le travail ---
export const START_LPC = 5; // lignes par clic au départ
export const BUG_CLICKS = 10; // un bug se corrige en 10 clics, quel que soit l'outil
export const THEME_LINES = 0.7; // thème pro : vitrines et boutiques à 70 % de leurs lignes
export const FORMATION_BUG_RATE = 0.5; // formation aux tests : deux fois moins de bugs
export const RED_EVERY = 3; // avec les tests, une livraison sur trois bute sur un test rouge
export const COMPROMIS_LINES = 0.8; // test désactivé : les commandes suivantes ont 20 % de lignes en moins
export const DUVAL_FIRST_BUG = 40; // le premier bug de Mme Duval arrive 40 s après le contrat d'entretien
export const FIRST_BUG_MIN = 30; // le premier bug d'un site livré arrive entre 30 et 100 s après la livraison
export const FIRST_BUG_STEP = 23;
export const FIRST_BUG_SPREAD = 70;
export const EVENING_BUGS = 2; // « Répondre aux clients le soir » : deux bugs de plus chaque vendredi
export const EXIT_BUGS = 12; // la sortie se propose à 12 bugs arrivés en 7 jours (ou 12 en file)

// --- La vie ---
export const FL_ENERGY_REGEN = 0.3; // énergie / s, le repos
export const CLICK_ENERGY = 0.6; // chaque clic coûte un peu d'énergie
export const TIRED_BELOW = 40; // sous 40, un clic compte moitié moins (v4 : 25 ne mordait qu'au-delà de 4 clics / s)
export const TIRED_SHARE = 0.5;
export const MEALS_PER_DAY = 2;
export const MEALS_BEFORE_DELIVERY = 30; // les repas livrés se proposent après 30 repas faits à la main
export const MEAL_PRICE = 11; // un repas livré, payé à la commande (un par jour)
export const DINNER_ENERGY = 40;
export const FIRST_DINNER_DAY = 7; // les amis invitent à partir de la deuxième semaine
export const FRIENDS_MAX_MISSES = 3; // trois dîners manqués d'affilée : ils n'invitent plus
export const OUTING_ENERGY = 30;
export const HOME_RENT_FACTOR = 5; // un logement se propose quand les entrées d'une semaine couvrent 5 fois son loyer

// --- La sortie ---
export const NORA_SALARY = 600; // Nora en alternance, chaque lundi, en charges pro
export const NORA_BUGS_PER_DAY = 3; // du lundi au vendredi

// --- La micro-entreprise ---
export const COMPANY_NAME_MAX = 24;
export const COMPANY_DEFAULT_NAME = "Atelier web";
export const LOGO_COUNT = 5;
export const LOGO_LABELS = ["Chevrons", "Accolades", "Terminal", "Navigateur", "Initiale"];

export const AGE_FREELANCE = 24;
export const FL_OFFLINE_CAP = 600; // hors-ligne plafonné à 10 min, comme au plongeur

// --- Les commandes ---
export type Kind = "vitrine" | "appli" | "boutique";
export interface KindDef {
  lines: number;
  price: number; // € à la livraison (sur la taille nominale : réutiliser du code réduit le travail, pas le prix)
  fee: number; // € d'entretien chaque lundi
  label: string;
}
export const KINDS: Record<Kind, KindDef> = {
  vitrine: { lines: 1200, price: 600, fee: 50, label: "Site vitrine" },
  appli: { lines: 4000, price: 2400, fee: 160, label: "Appli" },
  boutique: { lines: 3000, price: 1900, fee: 130, label: "Boutique en ligne" },
};

export interface ClientDef {
  name: string; // « Boulangerie Duval »
  chez: string; // « la Boulangerie Duval » (« Bug chez la Boulangerie Duval »)
  payer: string; // qui paie : « Mme Duval »
}
const client = (name: string, chez: string, payer = name): ClientDef => ({ name, chez, payer });
export const DUVAL = client("Boulangerie Duval", "la Boulangerie Duval", "Mme Duval");
export const PETIT = client("Club de foot de M. Petit", "le Club de foot de M. Petit", "M. Petit");
/** Les clients suivants, pris dans l'ordre, par type de commande. */
export const CLIENTS: Record<Kind, ClientDef[]> = {
  vitrine: [
    client("Garage Leroy", "le Garage Leroy"),
    client("Pharmacie Morel", "la Pharmacie Morel"),
    client("Fleuriste Martin", "la Fleuriste Martin"),
    client("Cave Girard", "la Cave Girard"),
    client("Taxi Mercier", "le Taxi Mercier"),
    client("Épicerie Roux", "l'Épicerie Roux"),
    client("Salle de sport Lopez", "la Salle de sport Lopez"),
    client("Coiffure Nadia", "Coiffure Nadia"),
    client("Plombier Faure", "le Plombier Faure"),
    client("Librairie Colin", "la Librairie Colin"),
    client("Boucherie Lambert", "la Boucherie Lambert"),
    client("Pressing Dubois", "le Pressing Dubois"),
  ],
  appli: [
    client("Club de judo Masson", "le Club de judo Masson"),
    client("Auto-école Blanc", "l'Auto-école Blanc"),
    client("Crèche Les Lutins", "la Crèche Les Lutins"),
    client("Cabinet dentaire Roche", "le Cabinet dentaire Roche"),
    client("Traiteur Benali", "le Traiteur Benali"),
  ],
  boutique: [
    client("Épicerie bio Garnier", "l'Épicerie bio Garnier"),
    client("Chocolaterie Perrin", "la Chocolaterie Perrin"),
    client("Fromagerie Vidal", "la Fromagerie Vidal"),
    client("Opticien Arnaud", "l'Opticien Arnaud"),
    client("Vins Moreau", "Vins Moreau"),
    client("Bijouterie Klein", "la Bijouterie Klein"),
  ],
};

/** Ce qui casse, par type de site (pris dans l'ordre). */
export const BUG_TEXTS: Record<Kind, string[]> = {
  vitrine: [
    "Les horaires du dimanche ont disparu.",
    "Le plan d'accès montre la mauvaise rue.",
    "Le numéro de téléphone a disparu.",
    "Les photos ne chargent plus sur téléphone.",
  ],
  appli: [
    "L'inscription refuse les moins de 12 ans.",
    "Les notifications arrivent en double.",
    "La connexion se coupe toute seule.",
  ],
  boutique: [
    "Le paiement refuse les cartes.",
    "Le panier se vide tout seul.",
    "Les frais de port s'affichent deux fois.",
  ],
};

// --- Tes clients : ce que tu leur proposes (gratuit, une à la fois, quand tu suis) ---
export interface ProposalDef {
  id: string;
  cta: string;
  lines: string[];
  weekly?: Kind[]; // commandes qui arrivent en plus chaque lundi
  oneShot?: Kind; // une commande, tout de suite (de M. Petit)
  maintDuval?: boolean; // le site de Mme Duval devient un contrat d'entretien
  maintAll?: boolean; // chaque site livré ensuite devient un contrat d'entretien
  evening?: boolean; // des bugs arrivent aussi le vendredi soir
}
export const PROPOSALS: ProposalDef[] = [
  {
    id: "entretien_duval",
    cta: "Proposer un contrat d'entretien à Mme Duval",
    lines: ["50 € chaque lundi.", "Ses bugs arrivent dans ton carnet."],
    maintDuval: true,
  },
  { id: "cartes", cta: "Laisser tes cartes de visite à la boulangerie", lines: ["+1 site vitrine par semaine (600 € chacun)."], weekly: ["vitrine"] },
  { id: "profil", cta: "Créer ton profil sur un site de freelances", lines: ["+2 sites vitrines par semaine."], weekly: ["vitrine", "vitrine"] },
  {
    id: "entretien_tous",
    cta: "Proposer l'entretien à chaque livraison",
    lines: ["Chaque site livré paie son entretien chaque lundi.", "Chaque site entretenu envoie des bugs."],
    maintAll: true,
  },
  { id: "petit", cta: "Proposer une appli à M. Petit", lines: ["Une appli de 4 000 lignes, 2 400 € à la livraison."], oneShot: "appli" },
  {
    id: "soir",
    cta: "Répondre aux clients le soir",
    lines: ["+1 boutique en ligne par semaine (1 900 € chacune).", "Le vendredi soir, des bugs arrivent aussi."],
    weekly: ["boutique"],
    evening: true,
  },
  { id: "recommander", cta: "Demander à tes clients de te recommander", lines: ["+1 appli et +1 boutique par semaine."], weekly: ["appli", "boutique"] },
];
export const PROPOSAL_BY_ID: Record<string, ProposalDef> = Object.fromEntries(PROPOSALS.map((p) => [p.id, p]));

// --- Les outils : un à la fois, dans l'ordre, quand tu ne suis plus (ou au plus tard TOOL_LATE après le précédent) ---
export interface ToolDef {
  id: string;
  cta: string;
  name: string; // dans la liste de ce que tu possèdes
  cost: number; // achat unique
  sub: number; // abonnement, chaque lundi (payé d'avance pour la première semaine)
  lines: string[];
  owned: string; // la ligne une fois acheté
  lpc?: number;
  aiRate?: number; // lignes / s que l'IA écrit seule, sur les commandes seulement
  theme?: number;
  formation?: boolean;
  replaces?: string; // l'abonnement qu'il remplace
  weekly?: Kind[];
  needs?: "chambre" | "bugs"; // une chambre à toi (pas de deuxième écran sur le canapé de Sam), ou 3 bugs en 7 jours
}
export const TOOLS: ToolDef[] = [
  { id: "editeur", cta: "Acheter une licence d'éditeur", name: "Licence d'éditeur", cost: 250, sub: 0, lines: ["Par clic : 5 → 8 lignes."], owned: "5 → 8 lignes par clic", lpc: 8 },
  { id: "ecran", cta: "Acheter un deuxième écran", name: "Deuxième écran", cost: 400, sub: 0, lines: ["Par clic : 8 → 12 lignes."], owned: "8 → 12 lignes par clic", lpc: 12, needs: "chambre" },
  {
    id: "autocompletion",
    cta: "S'abonner à l'autocomplétion par IA",
    name: "Autocomplétion par IA",
    cost: 0,
    sub: 5,
    lines: ["Par clic : 12 → 20 lignes.", "5 € chaque lundi, en charges pro."],
    owned: "12 → 20 lignes par clic, 5 € chaque lundi",
    lpc: 20,
  },
  {
    id: "ia_pages",
    cta: "S'abonner à l'IA qui écrit les pages neuves",
    name: "L'IA écrit les pages neuves",
    cost: 0,
    sub: 25,
    lines: ["20 lignes / s, même sans toi, sur les commandes.", "Les bugs restent à toi.", "25 € chaque lundi, en charges pro."],
    owned: "20 lignes / s, même sans toi",
    aiRate: 20,
  },
  {
    id: "theme",
    cta: "Acheter un thème pro",
    name: "Thème pro",
    cost: 2000,
    sub: 0,
    lines: ["Sites vitrines et boutiques : 30 % de lignes en moins, même prix."],
    owned: "30 % de lignes en moins sur les vitrines et les boutiques",
    theme: THEME_LINES,
  },
  {
    id: "formation",
    cta: "Suivre une formation aux tests automatiques",
    name: "Tes tests automatiques",
    cost: 3000,
    sub: 0,
    lines: ["Deux fois moins de bugs."],
    owned: "Deux fois moins de bugs",
    formation: true,
    needs: "bugs",
  },
  {
    id: "ia_pro",
    cta: "Passer à l'abonnement pro de l'IA",
    name: "L'IA écrit les pages neuves",
    cost: 0,
    sub: 50,
    lines: ["L'IA : 20 → 60 lignes / s.", "50 € chaque lundi au lieu de 25 €."],
    owned: "60 lignes / s, même sans toi",
    aiRate: 60,
    replaces: "ia_pages",
  },
  {
    id: "ia_mail",
    cta: "S'abonner à l'IA de ta boîte mail",
    name: "L'IA de ta boîte mail",
    cost: 0,
    sub: 10,
    lines: ["Elle répond à tes clients le soir.", "+1 appli et +1 boutique par semaine.", "10 € chaque lundi, en charges pro."],
    owned: "Répond à tes clients le soir",
    weekly: ["appli", "boutique"],
  },
];
export const TOOL_BY_ID: Record<string, ToolDef> = Object.fromEntries(TOOLS.map((t) => [t.id, t]));

// --- Le logement : payé chaque lundi ; il agrandit l'énergie maximale et le repas ---
export interface HomeDef {
  id: string;
  cta: string;
  label: string; // « Logement : … »
  rent: number;
  energyMax: number;
  meal: number; // énergie d'un repas (fait ou livré)
  souvenir: string;
}
export const HOMES: HomeDef[] = [
  { id: "canape", cta: "", label: "le canapé convertible de Sam", rent: 0, energyMax: 100, meal: 10, souvenir: "" },
  { id: "chambre", cta: "Louer une chambre chez l'habitant", label: "une chambre chez l'habitant", rent: 110, energyMax: 120, meal: 10, souvenir: "Tu as posé ton sac dans ta chambre." },
  { id: "t1", cta: "Emménager dans un T1 de 25 m²", label: "un T1 de 25 m²", rent: 190, energyMax: 140, meal: 15, souvenir: "Sam t'a aidé à porter tes cartons." },
  { id: "deux_pieces", cta: "Emménager dans un deux-pièces avec un bureau", label: "un deux-pièces avec un bureau", rent: 380, energyMax: 170, meal: 15, souvenir: "Sam t'a aidé à porter tes cartons, encore." },
];

// --- Les sorties : un mercredi sur deux, en alternance ---
export const OUTINGS = [
  { cta: "Aller au cinéma", price: 12, souvenir: "Tu as vu un film au cinéma." },
  { cta: "Aller au restaurant du coin", price: 25, souvenir: "Tu as dîné au restaurant du coin." },
];

export const MAMAN_LINES = [
  "Maman t'a demandé si tu manges bien.",
  "Maman t'a raconté son jardin.",
  "Maman t'a demandé quand tu viens la voir.",
];

// --- Ce que disent les clients (la ligne du haut, comme le chef au plongeur) ---
export const QUOTES: Record<string, string> = {
  debut: "Mme Duval : « Mon neveu devait le faire, mais il est parti à Lyon. »",
  facture: "Mme Duval : « Une cliente m'a demandé qui avait fait mon site. »",
  entretien: "Pharmacie Morel : « Vous pouvez ajouter nos horaires de garde ? »",
  petit: "M. Petit : « Les parents adorent l'appli. Enfin, ceux qui arrivent à s'inscrire. »",
  gateaux: "Mme Duval : « J'ai perdu deux commandes de gâteaux ce week-end. Je ne sais pas pourquoi. »",
};

export const TEXTES = {
  // colonnes et en-tête
  colWork: "Travail",
  colLife: "Ta vie",
  moneyLabel: "Argent",
  money: (e: string) => `Argent : ${e}`,
  dayWeek: (day: string, week: number) => `${day}, semaine ${week}`,
  age: (n: number) => `${n} ans`,
  mondayLine: (parts: string[]) => `Chaque lundi : ${parts.join(", ")}`,
  mondayEntretien: (e: string) => `+${e} d'entretien`,
  mondayRent: (e: string) => `−${e} de loyer`,
  mondaySubs: (e: string, n: number) => (n > 1 ? `−${e} d'abonnements` : `−${e} d'abonnement`),
  mondayNora: (e: string) => `−${e} pour Nora`,
  // le carnet
  carnetTitle: "Carnet de commandes",
  orderTitle: (kind: string, chez: string) => `${kind} pour ${chez}`,
  orderProgress: (done: number, lines: number) => `${done} / ${lines} lignes`,
  orderPrice: (e: string) => `${e} à la livraison`,
  bugTitle: (chez: string) => `Bug chez ${chez}`,
  bugWhy: (payer: string) => `Tant que ce n'est pas corrigé, ${payer} ne paie pas son entretien du lundi.`,
  redTitle: (chez: string) => `Test rouge chez ${chez}`,
  redWhy: (e: string) => `Sa commande est prête, un test échoue : ${e} bloqués.`,
  redText: "Un test échoue.",
  clicks: (n: number) => `${n} clics sur ${BUG_CLICKS}`,
  writeCode: (n: number) => `Écrire du code : ${n} lignes`,
  fixBug: "Corriger le bug",
  fixRed: "Corriger le test",
  nothing: "Aucune commande pour l'instant",
  busy: { maman: "Au téléphone avec Maman", diner: "Au dîner", sortie: "Tu es sorti" } as Record<string, string>,
  tired: "Tu es fatigué : chaque clic compte moitié moins.",
  aiWithYou: "L'IA écrit avec toi.",
  ensuite: "Ensuite",
  tagOrder: "Commande",
  tagBug: "Bug",
  tagRed: "Test rouge",
  waiting: "en attente",
  orderDetail: (kind: string, done: number, lines: number) => `${kind}, ${done} lignes sur ${lines}`,
  orderWaiting: (kind: string) => `${kind}, en attente`,
  plusMoney: (e: string) => `+${e}`,
  lossMonday: (e: string) => `−${e} lundi`,
  blocked: (e: string) => `${e} bloqués`,
  more: (n: number) => `Et ${n} autres`,
  count: (orders: number, bugs: number) =>
    `${orders} commande${orders > 1 ? "s" : ""}, ${bugs === 0 ? "aucun bug ouvert" : `${bugs} bug${bugs > 1 ? "s" : ""}`}`,
  // la micro-entreprise
  invoiceTitle: "Créer ta micro-entreprise",
  invoiceLines: ["Gratuit. Il faut un nom pour facturer Mme Duval."],
  invoiceField: "Nom de ton entreprise",
  invoiceLogos: "Ton logo",
  invoiceCta: (e: string) => `Créer et facturer Mme Duval : ${e}`,
  firstInvoice: (name: string, e: string) => `Première facture de ${name} : ${e}, Mme Duval.`,
  // améliorations et clients
  upgradesTitle: "Améliorations",
  clientsTitle: "Tes clients",
  clientRow: (name: string, kind: string) => `${name}, ${kind.toLowerCase()}`,
  feeMonday: (e: string) => `${e} chaque lundi`,
  feeAtStake: (e: string) => `${e} en jeu lundi`,
  topClientsTitle: "Tes clients qui paient le plus",
  since: (week: number) => `depuis la semaine ${week}`,
  firstClient: "ta première cliente",
  free: "gratuit",
  sansToiTitle: "Ce qui travaille sans toi",
  eachMonday: (e: string) => `${e} chaque lundi`,
  // la vie
  logement: (label: string) => `Logement : ${label}.`,
  homeCaption: (label: string) => label.charAt(0).toUpperCase() + label.slice(1),
  homeLines: (rent: string, from: number, to: number) => [`${rent} chaque lundi.`, `Énergie maximale : ${from} → ${to}.`],
  homeSince: (rent: string, max: number) => `Loyer : ${rent} chaque lundi. Énergie maximale : ${max}`,
  energy: (e: number, max: number) => `Énergie : ${e} / ${max}`,
  rest: (n: number) => `Ton repos : +${n} énergie / min`,
  mealCta: "Se faire à manger",
  mealLines: (from: number, to: number) => [`Énergie : ${from} → ${to}.`, "Deux repas par jour."],
  mealDone: "Tu as déjà mangé deux fois aujourd'hui.",
  deliveryCta: "Se faire livrer les repas du midi",
  deliveryLines: (e: string, n: number) => [`${e} le repas, un par jour.`, `Énergie : +${n} chaque jour, sans y penser.`],
  dinnerTitle: "Sam, Inès et Léo dînent ensemble ce soir.",
  dinnerCta: "Y aller",
  dinnerLines: (n: number) => ["Tu y es jusqu'à samedi : tout s'arrête, sauf l'IA.", `Énergie : +${n}.`],
  dinnerEvening: "Les commandes du soir arrivent aussi.",
  mamanTitle: "Maman appelle.",
  mamanCta: "Décrocher",
  mamanLines: (max: number) => ["Tout s'arrête jusqu'à lundi, sauf l'IA.", `Énergie remplie : ${max}.`],
  mamanIACta: "Laisser l'IA répondre aux messages de Maman",
  mamanIALines: ["Gratuit. Tes dimanches redeviennent travaillés."],
  outingLines: (e: string, n: number) => [`${e}. Tu y es jusqu'à demain.`, `Énergie : +${n}.`],
  dIciLundiTitle: "D'ici lundi",
  dIciFriday: "Vendredi, 20 h",
  dIciSunday: "Dimanche, 12 h",
  dIciMonday: (n: number, e: string) => [`Lundi, l'entretien de ${n} site${n > 1 ? "s" : ""}`, `${e} si tout est corrigé`],
  ratioMaman: "Appels de Maman décrochés",
  ratioDinners: "Dîners avec tes amis",
  ratioOutings: "Cinéma et restaurant",
  ratioMeals: "Repas du midi livrés",
  ratioOf: (a: number, b: number) => `${a} sur ${b}`,
  times: (n: number) => `${n} fois`,
  mealPrice: (e: string) => `${e} le repas`,
  souvenirsTitle: "Souvenirs",
  souvenir: (day: string, text: string) => `${day} : ${text}`,
  // souvenirs
  dinnerWent: "Tu as dîné avec Sam, Inès et Léo.",
  dinnerMissed: "Tes amis ont dîné sans toi.",
  friendsGone: "Sam, Inès et Léo ne t'invitent plus le vendredi.",
  mamanMissed: "Maman a laissé un message vocal.",
  mamanByAI: "Le répondeur IA a répondu à Maman.",
  // finances
  weekTitle: "Cette semaine",
  lastWeekTitle: (n: number) => `La semaine dernière (semaine ${n})`,
  entrees: "Entrées",
  charges: "Charges",
  chargesPro: "Charges pro",
  chargesPerso: "Charges perso",
  achats: "Achats",
  net: "Net",
  livraisons: "Livraisons",
  entretien: "Entretien du lundi",
  entretienOf: (e: string) => `Entretien du lundi (${e} possibles)`,
  livret: "Livret A",
  abonnements: "Abonnements IA",
  salaires: "Nora",
  loyer: "Loyer",
  repas: (n: number) => `Repas livrés (${n})`,
  sorties: "Cinéma et restaurant",
  financesTitle: "Tes finances",
  account: "Compte courant",
  livretRule: "+1 % chaque lundi",
  deposit: "Tout mettre sur le livret",
  withdraw: "Tout reprendre",
  withdrawSub: "sur ton compte courant",
  earnTitle: "Ce que tu gagnes",
  earnDelta: (e: string, prev: number) => `net la semaine dernière, soit ${e} de plus que la semaine ${prev}`,
  earnDeltaDown: (e: string, prev: number) => `net la semaine dernière, soit ${e} de moins que la semaine ${prev}`,
  earnAchats: "Tes achats sont à part, dans Finances.",
  // la sortie
  exitTitle: (n: number) => `Ces 7 derniers jours : ${n} bugs arrivés.`,
  exitWhy: (n: number, e: string) => `Pendant que tu les corriges, ${n} commandes attendent (${e}).`,
  exitCta: (name: string) => `Embaucher Nora en alternance chez ${name}`,
  exitLines: (e: string) => [`${e} chaque lundi, en charges pro.`, "Elle corrige jusqu'à 15 bugs par semaine, du lundi au vendredi."],
  noraHired: "Nora corrige les bugs du lundi au vendredi.",
  endLine: "Ton studio : le chapitre suivant arrive bientôt.",
  // le compromis
  compromisCta: "Désactiver le test qui échoue",
  compromisLines: ["Gratuit. Plus aucun test ne bloque tes livraisons, et tes prochaines commandes ont 20 % de lignes en moins."],
  // le menu
  tabs: ["Tableau de bord", "Pro", "Perso", "Finances"],
};
```

- [ ] **Step 2 : écrire le test de l'état (il échoue)**

Créer `tests/freelance.test.ts` :

```ts
import { describe, it, expect } from "vitest";
import { createInitialState, createFreelanceState } from "../src/engine/state";
import { serialize, deserialize } from "../src/engine/save";
import { KINDS, START_LPC, DUVAL, TEXTES } from "../src/engine/content/freelance";

describe("chapitre 2 : l'état", () => {
  it("commence avec la commande de Mme Duval, 5 lignes par clic, sur le canapé de Sam", () => {
    const f = createFreelanceState();
    expect(f.orders).toHaveLength(1);
    expect(f.orders[0]).toMatchObject({ kind: "vitrine", client: DUVAL.name, lines: KINDS.vitrine.lines, done: 0, red: "none" });
    expect(f.lpc).toBe(START_LPC);
    expect(f.home).toBe(0);
    expect(f.company).toBeNull();
    expect(f.quote).toBe("debut");
  });

  it("survit à une sauvegarde, et une vieille sauvegarde reçoit un chapitre 2 neuf", () => {
    const s = createInitialState(0);
    s.freelance.lpc = 12;
    expect(deserialize(serialize(s)).freelance.lpc).toBe(12);
    const raw = JSON.parse(serialize(s));
    delete raw.freelance;
    expect(deserialize(JSON.stringify(raw)).freelance.orders).toHaveLength(1);
  });

  it("aucun texte du chapitre ne sépare par un tiret long ou court", () => {
    const all = JSON.stringify(TEXTES) + JSON.stringify(KINDS);
    expect(all).not.toMatch(/[—–]/);
  });
});
```

- [ ] **Step 3 : lancer le test**

Run: `node_modules/.bin/vitest run tests/freelance.test.ts`
Expected: FAIL (`createFreelanceState` n'existe pas).

- [ ] **Step 4 : écrire l'état**

Dans `src/engine/state.ts` :
1. ajouter `"freelance"` à l'union `Job`, juste après `"plongeur"` ;
2. importer `import { KINDS, START_LPC, DUVAL, type Kind } from "./content/freelance";` ;
3. ajouter, après `createPlongeState()` :

```ts
/** Chapitre 2 : une commande (un site à construire). */
export interface FlOrder {
  id: number;
  kind: Kind;
  client: string; // nom du client (voir ClientDef)
  lines: number; // lignes à écrire
  done: number; // lignes écrites
  red: "none" | "failing" | "passed"; // test rouge : pas encore vérifié, bloqué, passé
}
/** Un bug à corriger (10 clics). `site` : un site entretenu ; `order` : un test rouge sur une commande. */
export interface FlBug {
  id: number;
  site: number | null;
  order: number | null;
  clicks: number; // clics faits (un clic fatigué compte pour moitié)
  text: string;
}
/** Un site sous contrat d'entretien : il paie chaque lundi s'il n'a pas de bug ouvert, et envoie des bugs. */
export interface FlSite {
  id: number;
  client: string;
  kind: Kind;
  fee: number;
  nextBug: number; // heure de calendrier du prochain bug
  bugOpen: boolean;
  bugs: number; // bugs envoyés au total (fait tourner les textes)
  sinceWeek: number;
}
/** L'argent d'une semaine (du lundi au dimanche ; les paiements du lundi ouvrent la semaine). */
export interface FlLedger {
  livraisons: number;
  entretien: number;
  entretienPossible: number;
  livret: number;
  abonnements: number;
  salaires: number;
  loyer: number;
  repas: number;
  repasCount: number;
  sorties: number;
  achats: number; // achats uniques : hors du net
}
export interface FlWeek {
  entrees: number;
  net: number; // hors achats
  livraisons: number;
  entretien: number;
  charges: number; // pro et perso
}
export function emptyLedger(): FlLedger {
  return { livraisons: 0, entretien: 0, entretienPossible: 0, livret: 0, abonnements: 0, salaires: 0, loyer: 0, repas: 0, repasCount: 0, sorties: 0, achats: 0 };
}

export interface FreelanceState {
  day: number; // secondes de calendrier depuis le premier lundi du chapitre
  nextId: number;
  orders: FlOrder[];
  bugs: FlBug[]; // en tête du carnet, dans l'ordre
  sites: FlSite[];
  clientIndex: Record<Kind, number>; // prochain client de chaque liste
  delivered: number;
  firstDeliveryAt: number; // -1 tant que rien n'est livré
  pendingInvoice: boolean; // le site de Mme Duval est prêt, la facture attend la micro-entreprise
  company: { name: string; logo: number } | null;
  lpc: number;
  aiRate: number;
  themeMult: number;
  compMult: number;
  bugRate: number; // 1, puis 0,5 avec la formation
  tests: boolean;
  weekly: Kind[]; // commandes qui arrivent chaque lundi
  maintDuval: boolean;
  maintAll: boolean;
  evening: boolean;
  proposals: Record<string, number>; // propositions acceptées → heure
  tools: Record<string, number>; // outils achetés → heure
  subs: Record<string, number>; // abonnements → € chaque lundi
  home: number; // index dans HOMES
  bugArrivals: number[]; // heures d'arrivée des bugs des 7 derniers jours
  keptUp: number; // secondes d'affilée à carnet vide
  behind: number; // secondes d'affilée en retard
  revealed: Record<string, number>; // nouveautés parues → heure
  lastNovelty: number;
  busy: number; // secondes où tes mains sont prises
  busyWhy: "" | "maman" | "diner" | "sortie";
  mealsToday: number;
  mealsCooked: number;
  delivery: boolean;
  friends: boolean;
  friendsMissed: number;
  dinnerOpen: boolean;
  dinnerInvites: number;
  dinners: number;
  mamanRing: boolean;
  mamanIA: boolean;
  mamanRings: number;
  mamanCalls: number;
  outingOpen: boolean;
  outings: number;
  reds: number; // livraisons vérifiées par les tests
  compromis: "none" | "offered" | "taken";
  compromisQuoteDue: boolean;
  quote: string; // id dans QUOTES
  ledger: FlLedger;
  lastWeek: FlLedger | null;
  history: FlWeek[];
  livretBalance: number;
  livretLow: number;
  nora: boolean;
  noraAcc: number;
  liensPerdus: number; // liens perdus par négligence (les amis) : même effet sur le Sens qu'un lien délégué
}

export function createFreelanceState(): FreelanceState {
  return {
    day: 0,
    nextId: 2,
    orders: [{ id: 1, kind: "vitrine", client: DUVAL.name, lines: KINDS.vitrine.lines, done: 0, red: "none" }],
    bugs: [],
    sites: [],
    clientIndex: { vitrine: 0, appli: 0, boutique: 0 },
    delivered: 0,
    firstDeliveryAt: -1,
    pendingInvoice: false,
    company: null,
    lpc: START_LPC,
    aiRate: 0,
    themeMult: 1,
    compMult: 1,
    bugRate: 1,
    tests: false,
    weekly: [],
    maintDuval: false,
    maintAll: false,
    evening: false,
    proposals: {},
    tools: {},
    subs: {},
    home: 0,
    bugArrivals: [],
    keptUp: 0,
    behind: 0,
    revealed: {},
    lastNovelty: -1000,
    busy: 0,
    busyWhy: "",
    mealsToday: 0,
    mealsCooked: 0,
    delivery: false,
    friends: true,
    friendsMissed: 0,
    dinnerOpen: false,
    dinnerInvites: 0,
    dinners: 0,
    mamanRing: false,
    mamanIA: false,
    mamanRings: 0,
    mamanCalls: 0,
    outingOpen: false,
    outings: 0,
    reds: 0,
    compromis: "none",
    compromisQuoteDue: false,
    quote: "debut",
    ledger: emptyLedger(),
    lastWeek: null,
    history: [],
    livretBalance: 0,
    livretLow: 0,
    nora: false,
    noraAcc: 0,
    liensPerdus: 0,
  };
}
```

4. dans `interface GameState`, après `plonge: PlongeState;` : `freelance: FreelanceState; // chapitre 2 : les commandes, les bugs, les outils, la vie du freelance` ;
5. dans `createInitialState`, après `plonge: createPlongeState(),` : `freelance: createFreelanceState(),`.

Dans `src/engine/save.ts`, importer `createFreelanceState` depuis `./state` et ajouter dans `deserialize`, après la ligne `plonge: …` :

```ts
    freelance: { ...createFreelanceState(), ...(raw.freelance ?? {}) },
```

Dans `src/engine/content/career.ts`, ajouter après l'entrée `plongeur` :

```ts
  freelance: {
    label: "Développeur freelance",
    clickLabel: "Écrire du code",
    clickValue: D(0), // le chapitre 2 a son propre moteur (engine/freelance)
    clickEnergyCost: 0,
  },
```

Dans `src/ui/App.svelte`, ajouter `freelance: "Ton atelier",` après `plongeur: "Plonge",` dans `APP_TITLES`.

- [ ] **Step 5 : lancer les tests**

Run: `node_modules/.bin/vitest run tests/freelance.test.ts && node_modules/.bin/svelte-check --tsconfig ./tsconfig.json`
Expected: 3 tests PASS ; `svelte-check` sans erreur.

- [ ] **Step 6 : commit**

```bash
git add src/engine/content/freelance.ts src/engine/state.ts src/engine/save.ts src/engine/content/career.ts src/ui/App.svelte tests/freelance.test.ts
git commit -m "feat(freelance): contenu et état du chapitre 2

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 2: Le chapitre 2 branché (annonce, boucle, hors-ligne, file des nouveautés)

**Files:**
- Create: `src/engine/freelance/commun.ts`, `src/engine/freelance/finances.ts`, `src/engine/freelance/revelations.ts`, `src/engine/freelance/tick.ts`, `src/engine/freelance/index.ts`, `src/ui/Freelance.svelte` (provisoire, remplacé à la tâche 15)
- Modify: `src/engine/plonge/etudes.ts:104-111` (`answerAnnonce`)
- Modify: `src/engine/loop.ts:113-150` (`tick`)
- Modify: `src/engine/offline.ts`
- Modify: `src/ui/App.svelte:339-341` (routage)
- Modify: `tests/plonge.test.ts:705-718` (l'annonce mène au freelance)
- Test: `tests/freelance.test.ts` (sections « branché » et « file des nouveautés »)

**Interfaces:**
- Consumes : `createFreelanceState`, `FreelanceState` (tâche 1).
- Produces :
  - `commun.ts` : `fmtEur(n: number): string` (« 1 190 € », « −2 000 € »), `dayIndex(s)`, `weekday(s)` (0 = lundi), `weekNumber(s)` (1 = première semaine), `dayName(s)`, `secsLeftToday(s)`, `handsFree(s): boolean`, `remember(s, kind, text, missed)`.
  - `finances.ts` : `earn(s, n, field)`, `spend(s, n, field)`, `entrees(l)`, `chargesPro(l)`, `chargesPerso(l)`, `net(l)` (achats hors du net).
  - `revelations.ts` : `interface FlReveal { id; kind: "jeu" | "geste"; ready(s): boolean }`, `FL_REVEALS: FlReveal[]` (rempli par les tâches suivantes, sous les repères `// [instants]`, `// [interface]`, `// [offres]`, `// [fin]`), `isRevealed(s, id)`, `acted(s)`, `revealQueue(s)`, `onReveal: Record<string, (s) => void>`.
  - `tick.ts` : `tickFreelance(s, t)` et `onNewDay(s, wd)` avec les repères `// [nouveau jour]`, `// [lundi]`, `// [mercredi]`, `// [jeudi]`, `// [vendredi]`, `// [samedi]`, `// [dimanche]`, `// [chaque tick]`, `// [après le tick]`, où les tâches suivantes insèrent leur code.
  - `index.ts` : `startFreelance(s)`, et réexporte tous les modules.

- [ ] **Step 1 : écrire les tests (ils échouent)**

Remplacer l'en-tête de `tests/freelance.test.ts` par l'aide commune (voir « Aide de test commune ») en gardant les imports de la tâche 1, et ajouter :

```ts
import { tick } from "../src/engine/loop";
import { applyOffline } from "../src/engine/offline";
import { D } from "../src/engine/numbers";
import { tickFreelance, startFreelance, FL_REVEALS, isRevealed, revealQueue, acted, fmtEur, dayName, weekNumber } from "../src/engine/freelance";
import { FL_NOVELTY_GAP, FL_DAY_SECS, FL_OFFLINE_CAP } from "../src/engine/content/freelance";

describe("chapitre 2 : branché", () => {
  it("formate les euros à l'entier, avec des espaces et un vrai signe moins", () => {
    expect(fmtEur(1190)).toBe("1 190 €");
    expect(fmtEur(-2000)).toBe("−2 000 €");
    expect(fmtEur(49.6)).toBe("50 €");
  });

  it("le calendrier commence un lundi de la semaine 1", () => {
    const s = fresh();
    expect(dayName(s)).toBe("Lundi");
    expect(weekNumber(s)).toBe(1);
    run(s, FL_DAY_SECS * 7 + 1);
    expect(dayName(s)).toBe("Lundi");
    expect(weekNumber(s)).toBe(2);
  });

  it("au chapitre 2, l'argent peut passer sous zéro et l'énergie ne remonte pas de 3 / s", () => {
    const s = fresh();
    s.money = D(-100);
    s.energy = 50;
    tick(s, 1);
    expect(s.money.toNumber()).toBe(-100);
    expect(s.energy).toBeLessThan(52);
    expect(s.freelance.day).toBeCloseTo(1);
  });

  it("le hors-ligne est plafonné à 10 minutes de calendrier", () => {
    const s = fresh();
    s.lastSeen = Date.now() - 2 * 3600 * 1000;
    applyOffline(s, Date.now());
    expect(s.freelance.day).toBeLessThanOrEqual(FL_OFFLINE_CAP + 1e-6);
    expect(s.freelance.day).toBeGreaterThan(FL_OFFLINE_CAP - 1);
  });
});

describe("chapitre 2 : la file des nouveautés", () => {
  it("un jeu attend 35 s après la nouveauté précédente ; un geste passe aussitôt et repousse la suite", () => {
    const s = fresh();
    let a = false;
    let b = false;
    let g = false;
    FL_REVEALS.push({ id: "t_a", kind: "jeu", ready: () => a }, { id: "t_b", kind: "jeu", ready: () => b }, { id: "t_g", kind: "geste", ready: () => g });
    try {
      a = true;
      b = true;
      revealQueue(s);
      expect(isRevealed(s, "t_a")).toBe(true);
      expect(isRevealed(s, "t_b")).toBe(false);
      run(s, FL_NOVELTY_GAP - 1);
      expect(isRevealed(s, "t_b")).toBe(false);
      g = true;
      acted(s);
      expect(isRevealed(s, "t_g")).toBe(true);
      run(s, FL_NOVELTY_GAP - 1);
      expect(isRevealed(s, "t_b")).toBe(false); // le geste a repoussé la suite
      run(s, 2);
      expect(isRevealed(s, "t_b")).toBe(true);
    } finally {
      FL_REVEALS.splice(FL_REVEALS.findIndex((r) => r.id === "t_a"), 3);
    }
  });
});
```

Dans `tests/plonge.test.ts`, remplacer la dernière ligne du test « l'examen réussi fait paraître l'annonce de Mme Duval… » :

```ts
    expect(s.job).toBe("freelance");
    expect(s.freelance.orders[0].client).toBe("Boulangerie Duval");
    expect(s.flags.firstColor).toBeFalsy(); // la couleur vient maintenant de la chambre
```

et renommer le test en « l'examen réussi fait paraître l'annonce de Mme Duval, qui mène au freelance ».

- [ ] **Step 2 : lancer les tests**

Run: `node_modules/.bin/vitest run tests/freelance.test.ts tests/plonge.test.ts`
Expected: FAIL (`../src/engine/freelance` introuvable ; l'annonce mène encore à `"developpeur"`).

- [ ] **Step 3 : écrire le code**

`src/engine/freelance/commun.ts` :

```ts
import type { GameState } from "../state";
import { FL_DAY_SECS, DAY_NAMES } from "../content/freelance";

// Petits outils partagés par tout le chapitre 2 : les euros, le calendrier, les mains, les souvenirs.

/** « 1 190 € », « −2 000 € » : des euros entiers, jamais « 1,2 k€ ». */
export function fmtEur(n: number): string {
  const r = Math.round(n);
  const digits = Math.abs(r).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${r < 0 ? "−" : ""}${digits} €`;
}

export const dayIndex = (s: GameState): number => Math.floor(s.freelance.day / FL_DAY_SECS);
/** 0 = lundi, 6 = dimanche. */
export const weekday = (s: GameState): number => dayIndex(s) % 7;
export const weekNumber = (s: GameState): number => Math.floor(dayIndex(s) / 7) + 1;
export const dayName = (s: GameState): string => DAY_NAMES[weekday(s)];
export const secsLeftToday = (s: GameState): number => FL_DAY_SECS - (s.freelance.day - dayIndex(s) * FL_DAY_SECS);

/** Tes mains sont libres (ni au téléphone, ni au dîner, ni sorti). */
export const handsFree = (s: GameState): boolean => s.freelance.busy <= 0;

/** Un souvenir, daté du jour (ou d'un autre : un dîner manqué se note le samedi matin, daté du vendredi).
 *  Un lien vécu nourrit le Sens ; un moment manqué ou délégué est gris. */
export function remember(s: GameState, kind: "lien" | "contemplation", text: string, missed: boolean, day = dayName(s)): void {
  s.souvenirs.unshift({ day, kind, text, missed });
  if (!missed) {
    s.vieVecueTicks += 1;
    s.secsSinceLife = 0;
  }
}
```

`src/engine/freelance/finances.ts` :

```ts
import type { GameState, FlLedger } from "../state";

// L'argent de la semaine : un seul compte courant, des entrées, des charges pro et perso, et des achats à part.

type Field = Exclude<keyof FlLedger, "entretienPossible" | "repasCount">;

export function earn(s: GameState, n: number, field: Field): void {
  if (n === 0) return;
  s.money = s.money.add(n);
  s.freelance.ledger[field] += n;
}
/** Une dépense passe même sans argent : le compte peut être négatif (on ne coupe ni le loyer ni l'IA). */
export function spend(s: GameState, n: number, field: Field): void {
  if (n === 0) return;
  s.money = s.money.sub(n);
  s.freelance.ledger[field] += n;
}

export const entrees = (l: FlLedger): number => l.livraisons + l.entretien + l.livret;
export const chargesPro = (l: FlLedger): number => l.abonnements + l.salaires;
export const chargesPerso = (l: FlLedger): number => l.loyer + l.repas + l.sorties;
/** Le net de la semaine : les achats uniques n'y sont pas (sinon il plonge à chaque outil). */
export const net = (l: FlLedger): number => entrees(l) - chargesPro(l) - chargesPerso(l);
```

`src/engine/freelance/revelations.ts` :

```ts
import type { GameState } from "../state";
import { FL_NOVELTY_GAP } from "../content/freelance";

// Une information à la fois. Chaque ligne de FL_REVEALS est une chose qui paraît à l'écran :
// - « jeu » : le jeu la révèle de lui-même, au moins FL_NOVELTY_GAP s après la nouveauté précédente, dans l'ordre
//   de la table (les offres en sont : une offre parue reste proposée jusqu'au clic) ;
// - « geste » : la conséquence immédiate d'une action du joueur (un déménagement qui colore la page) ; elle
//   n'attend pas, mais repousse la nouveauté suivante.

export interface FlReveal {
  id: string;
  kind: "jeu" | "geste";
  ready: (s: GameState) => boolean;
}

export const FL_REVEALS: FlReveal[] = [
  // [instants] ce qui ne dure qu'un moment (un dimanche), à placer avant le reste
  // [interface] les paliers de la page (v5)
  // [offres] ce que tu peux accepter ou acheter, une chose à la fois
  // [fin] la sortie, en dernier
];

/** Ce qui se passe au moment où une nouveauté paraît (par id). */
export const onReveal: Record<string, (s: GameState) => void> = {};

export function isRevealed(s: GameState, id: string): boolean {
  return s.freelance.revealed[id] !== undefined;
}
function note(s: GameState, id: string): void {
  s.freelance.revealed[id] = s.freelance.day;
  s.freelance.lastNovelty = s.freelance.day;
  onReveal[id]?.(s);
}
function gapFree(s: GameState): boolean {
  return s.freelance.day >= s.freelance.lastNovelty + FL_NOVELTY_GAP;
}
function settleGestures(s: GameState): void {
  for (const r of FL_REVEALS) if (r.kind === "geste" && !isRevealed(s, r.id) && r.ready(s)) note(s, r.id);
}
/** Une action du joueur : ce qu'elle fait paraître compte comme nouveauté, tout de suite. */
export function acted(s: GameState): void {
  settleGestures(s);
}
/** La file : les gestes prêts passent ; puis, si la place est libre, la première ligne « jeu » prête. */
export function revealQueue(s: GameState): void {
  settleGestures(s);
  if (!gapFree(s)) return;
  const next = FL_REVEALS.find((r) => r.kind === "jeu" && !isRevealed(s, r.id) && r.ready(s));
  if (next) note(s, next.id);
}
```

`src/engine/freelance/tick.ts` :

```ts
import type { GameState } from "../state";
import { dayIndex } from "./commun";
import { revealQueue } from "./revelations";

// Le temps qui passe au chapitre 2. Les tâches du plan insèrent leur code sous les repères entre crochets.

/** Un nouveau jour commence (`wd` : 0 = lundi). */
export function onNewDay(s: GameState, wd: number): void {
  // [nouveau jour]
  if (wd === 0) {
    // [lundi]
  }
  if (wd === 2) {
    // [mercredi]
  }
  if (wd === 3) {
    // [jeudi]
  }
  if (wd === 4) {
    // [vendredi]
  }
  if (wd === 5) {
    // [samedi]
  }
  if (wd === 6) {
    // [dimanche]
  }
}

export function tickFreelance(s: GameState, t: number): void {
  const f = s.freelance;
  const before = dayIndex(s);
  f.day += t;
  const today = dayIndex(s);
  for (let d = before + 1; d <= today; d++) onNewDay(s, d % 7);
  if (f.busy > 0) {
    f.busy = Math.max(0, f.busy - t);
    if (f.busy === 0) f.busyWhy = "";
  }
  // [chaque tick]
  revealQueue(s);
  // [après le tick]
}
```

`src/engine/freelance/index.ts` :

```ts
// Moteur du chapitre 2 (développeur freelance). Pur et déterministe. Tu construis des sites et tu les
// entretiens ; les bugs des sites entretenus passent en tête du carnet ; automatiser ton travail (les outils,
// l'IA, Nora) est sain et célébré ; automatiser ta vie (les repas, Maman) commence doucement.
// Tout le réglage vit dans ../content/freelance.ts.
import type { GameState } from "../state";
import { createFreelanceState } from "../state";
import { HOMES } from "../content/freelance";

export * from "./commun";
export * from "./finances";
export * from "./revelations";
export * from "./tick";

/** Répondre à l'annonce de Mme Duval : le chapitre 2 commence un lundi, sur le canapé de Sam. */
export function startFreelance(s: GameState): void {
  s.job = "freelance";
  s.freelance = createFreelanceState();
  // Le livret du plongeur suit (même vie, même banque).
  s.freelance.livretBalance = s.plonge.livretBalance;
  s.freelance.livretLow = s.plonge.livretBalance;
  s.plonge.livretBalance = 0;
  s.flags.energyVisible = true;
  s.flags.moneyVisible = true;
  s.energy = Math.min(s.energy, HOMES[0].energyMax);
}
```

Dans `src/engine/plonge/etudes.ts`, importer `import { startFreelance } from "../freelance";` et remplacer le corps de `answerAnnonce` après la garde par :

```ts
  s.plonge.chef = "annonce";
  startFreelance(s); // la couleur n'arrive plus ici : c'est la chambre du chapitre 2 qui l'apporte (spec v5)
  return true;
```

(et mettre à jour son commentaire : « on quitte la plonge, on devient freelance »).

Dans `src/engine/loop.ts` :
1. importer `import { tickFreelance } from "./freelance";` ;
2. sous `if (state.job === "plongeur") tickPlonge(state, t);`, ajouter `if (state.job === "freelance") tickFreelance(state, t); // chapitre 2 : son propre moteur (le compte peut être négatif)` ;
3. remplacer `state.money = state.money.add(income.mul(t)).max(0);` par :

```ts
  if (state.job !== "freelance") state.money = state.money.add(income.mul(t)).max(0);
```

4. remplacer la condition de régénération d'énergie par `if (state.flags.energyVisible && state.job !== "plongeur" && state.job !== "freelance") {` et son commentaire par « (au plongeur et au freelance, l'énergie est gérée par leur moteur) ».

Dans `src/engine/offline.ts`, importer `tickFreelance` depuis `./freelance` et `FL_OFFLINE_CAP` depuis `./content/freelance`, puis au début de `applyOffline`, après le calcul de `elapsed` :

```ts
  // Au chapitre 2, le hors-ligne rejoue au plus 10 min de calendrier, seconde par seconde, mains au repos :
  // l'IA écrit, les lundis tombent, le loyer se paie ; tes mains, elles, ne font rien.
  if (state.job === "freelance") {
    const secs = Math.min(elapsed, FL_OFFLINE_CAP) * state.tempo;
    const before = state.money;
    for (let t = 0; t < secs - 1e-9; t += 1) tickFreelance(state, Math.min(1, secs - t));
    state.lastSeen = now;
    return { seconds: secs, earned: state.money.sub(before) };
  }
```

`src/ui/Freelance.svelte` (provisoire) :

```svelte
<script lang="ts">
  // Chapitre 2 : écran provisoire, remplacé à la tâche 15 du plan.
  import { game } from "./store.svelte";
  import { QUOTES } from "../engine/content/freelance";
  const s = $derived(game.state);
</script>

<main class="freelance">
  <p class="quote">{QUOTES[s.freelance.quote]}</p>
</main>
```

Dans `src/ui/App.svelte`, importer `import Freelance from "./Freelance.svelte";` et remplacer :

```svelte
{#if s.job === "plongeur"}
  <Plonge />
{:else}
```

par :

```svelte
{#if s.job === "plongeur"}
  <Plonge />
{:else if s.job === "freelance"}
  <Freelance />
{:else}
```

- [ ] **Step 4 : lancer les tests**

Run: `node_modules/.bin/vitest run`
Expected: toute la suite PASS (dont les nouveaux tests et `tests/plonge.test.ts`).

- [ ] **Step 5 : commit**

```bash
git add src/engine/freelance src/engine/plonge/etudes.ts src/engine/loop.ts src/engine/offline.ts src/ui/Freelance.svelte src/ui/App.svelte tests/freelance.test.ts tests/plonge.test.ts
git commit -m "feat(freelance): l'annonce de Mme Duval ouvre le chapitre 2

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Démarrer à un chapitre (outil de test, en haut à droite)

Demande d'Alexandre : « en haut à droite, un moyen de lancer la partie au début d'un chapitre précis pour faire les tests ». À côté des boutons de test « ×2 » et « reset ».

**Files:**
- Create: `src/engine/chapitres.ts`
- Modify: `src/ui/store.svelte.ts` (`startChapter`)
- Modify: `src/ui/App.svelte:333-337` (le bloc `.debug`)
- Test: `tests/chapitres.test.ts`, `tests/ui/app.dom.test.ts` (un test de plus)

**Interfaces:**
- Consumes : `startFreelance(s)` (tâche 2).
- Produces : `CHAPTERS: { n: number; label: string }[]`, `startAtChapter(n: number, now: number): GameState`, `startChapter(n: number): void` (store). Les chapitres suivants s'ajouteront à `CHAPTERS` et à `startAtChapter`.

- [ ] **Step 1 : écrire les tests (ils échouent)**

`tests/chapitres.test.ts` :

```ts
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
```

Dans `tests/ui/app.dom.test.ts`, ajouter à la fin du `describe` :

```ts
  it("le sélecteur de test lance la partie au début du chapitre 2", () => {
    game.state = createInitialState(Date.now());
    const { target, component } = mountApp();
    const select = target.querySelector("select.dbg") as HTMLSelectElement;
    expect(select).not.toBeNull();
    select.value = "2";
    select.dispatchEvent(new Event("change"));
    flushSync();
    expect(game.state.job).toBe("freelance");
    expect(target.querySelector("main.freelance")).not.toBeNull();
    unmount(component);
  });
```

- [ ] **Step 2 : lancer les tests**

Run: `node_modules/.bin/vitest run tests/chapitres.test.ts tests/ui/app.dom.test.ts`
Expected: FAIL (`../src/engine/chapitres` introuvable ; pas de `select.dbg`).

- [ ] **Step 3 : écrire le code**

`src/engine/chapitres.ts` :

```ts
import { createInitialState, type GameState } from "./state";
import { startFreelance } from "./freelance";

// Outil de test : lancer une partie neuve au début d'un chapitre précis (sélecteur en haut à droite).
// Chaque chapitre refait ce que le joueur aurait au moment d'y entrer, sans l'argent gagné avant.

export const CHAPTERS: { n: number; label: string }[] = [
  { n: 1, label: "1. Plongeur" },
  { n: 2, label: "2. Freelance" },
];

export function startAtChapter(n: number, now: number): GameState {
  const s = createInitialState(now);
  if (n >= 2) startFreelance(s);
  return s;
}
```

Dans `src/ui/store.svelte.ts`, importer `startAtChapter` depuis `../engine/chapitres` et ajouter :

```ts
// Bouton de test : efface la sauvegarde et repart au début d'un chapitre.
export function startChapter(n: number): void {
  clearSave();
  game.state = startAtChapter(n, Date.now());
}
```

Dans `src/ui/App.svelte`, importer `startChapter` avec `resetGame` depuis `./store.svelte`, importer `CHAPTERS` depuis `../engine/chapitres`, et ajouter dans `<div class="debug">`, avant le bouton « ×2 » :

```svelte
  <select
    class="dbg"
    aria-label="Démarrer au chapitre (test)"
    onchange={(e) => {
      const n = Number(e.currentTarget.value);
      e.currentTarget.value = "";
      if (n) startChapter(n);
    }}
  >
    <option value="">Chapitre</option>
    {#each CHAPTERS as c (c.n)}<option value={c.n}>{c.label}</option>{/each}
  </select>
```

- [ ] **Step 4 : lancer les tests**

Run: `node_modules/.bin/vitest run`
Expected: toute la suite PASS.

- [ ] **Step 5 : commit**

```bash
git add src/engine/chapitres.ts src/ui/store.svelte.ts src/ui/App.svelte tests/chapitres.test.ts tests/ui/app.dom.test.ts
git commit -m "feat(test): démarrer la partie au début d'un chapitre

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 4: Le carnet (commandes, clic, fatigue, IA, livraison)

**Files:**
- Create: `src/engine/freelance/carnet.ts`
- Modify: `src/engine/freelance/index.ts` (export), `src/engine/freelance/tick.ts` (repère `// [chaque tick]`)
- Test: `tests/freelance.test.ts` (section « le carnet »)

**Interfaces:**
- Consumes : `earn` (finances), `handsFree`, `acted`.
- Produces :
  - `ALL_CLIENTS`, `clientOf(name): ClientDef`
  - `orderLines(s, kind): number`, `addOrder(s, kind, client?): FlOrder`
  - `type Task = { type: "bug"; bug: FlBug } | { type: "order"; order: FlOrder } | null`, `currentTask(s): Task`
  - `isTired(s): boolean`, `clickShare(s): number`, `clickLines(s): number`
  - `canWork(s): boolean`, `workClick(s): boolean`
  - `fixBug(s, bug)`, `deliverReady(s)`, `aiWrite(s, t)`
  - `pendingLines(s): number`, `waitingValue(s): number` (€ des commandes en attente)

- [ ] **Step 1 : écrire les tests (ils échouent)**

```ts
import { currentTask, workClick, canWork, clickLines, aiWrite, addOrder, pendingLines, waitingValue } from "../src/engine/freelance";
import { KINDS, START_LPC, CLICK_ENERGY, TIRED_BELOW, BUG_CLICKS } from "../src/engine/content/freelance";

describe("chapitre 2 : le carnet", () => {
  it("un clic écrit 5 lignes sur la commande de Mme Duval et coûte un peu d'énergie", () => {
    const s = fresh();
    s.energy = 100;
    expect(workClick(s)).toBe(true);
    expect(s.freelance.orders[0].done).toBe(START_LPC);
    expect(s.energy).toBeCloseTo(100 - CLICK_ENERGY);
    expect(s.totalClicks).toBe(1);
  });

  it("fatigué, un clic écrit moitié moins, mais le bouton ne se grise jamais", () => {
    const s = fresh();
    s.energy = TIRED_BELOW - 1;
    expect(clickLines(s)).toBe(START_LPC / 2);
    s.energy = 0;
    expect(canWork(s)).toBe(true);
    expect(workClick(s)).toBe(true);
  });

  it("un bug passe en tête du carnet et se corrige en 10 clics", () => {
    const s = fresh();
    s.energy = 100;
    s.freelance.bugs.push({ id: 99, site: null, order: null, clicks: 0, text: "x" });
    expect(currentTask(s)?.type).toBe("bug");
    for (let i = 0; i < BUG_CLICKS; i++) workClick(s);
    expect(s.freelance.bugs).toHaveLength(0);
    expect(s.freelance.orders[0].done).toBe(0); // les clics sont allés au bug
  });

  it("Mme Duval livrée, sa facture attend la micro-entreprise : pas encore d'argent", () => {
    const s = fresh();
    s.freelance.orders[0].done = KINDS.vitrine.lines - START_LPC;
    workClick(s);
    expect(s.freelance.orders).toHaveLength(0);
    expect(s.freelance.pendingInvoice).toBe(true);
    expect(s.freelance.delivered).toBe(1);
    expect(s.money.toNumber()).toBe(0);
  });

  it("une autre commande livrée paie son prix ; les clients se suivent dans l'ordre", () => {
    const s = fresh();
    s.freelance.orders = [];
    const o = addOrder(s, "vitrine");
    expect(o.client).toBe("Garage Leroy");
    expect(addOrder(s, "vitrine").client).toBe("Pharmacie Morel");
    o.done = o.lines - 1;
    workClick(s);
    expect(s.money.toNumber()).toBe(KINDS.vitrine.price);
    expect(s.freelance.ledger.livraisons).toBe(KINDS.vitrine.price);
  });

  it("l'IA écrit seule sur la première commande, jamais sur un bug, et ne fatigue pas", () => {
    const s = fresh();
    s.energy = 50;
    s.freelance.aiRate = 20;
    s.freelance.bugs.push({ id: 99, site: null, order: null, clicks: 0, text: "x" });
    aiWrite(s, 2);
    expect(s.freelance.orders[0].done).toBe(40);
    expect(s.freelance.bugs[0].clicks).toBe(0);
    expect(s.energy).toBe(50);
  });

  it("compte les lignes et l'argent qui attendent", () => {
    const s = fresh();
    addOrder(s, "appli");
    expect(pendingLines(s)).toBe(KINDS.vitrine.lines + KINDS.appli.lines);
    expect(waitingValue(s)).toBe(KINDS.vitrine.price + KINDS.appli.price);
  });
});
```

- [ ] **Step 2 : lancer les tests**

Run: `node_modules/.bin/vitest run tests/freelance.test.ts`
Expected: FAIL (fonctions introuvables).

- [ ] **Step 3 : écrire le code**

`src/engine/freelance/carnet.ts` :

```ts
import type { GameState, FlOrder, FlBug } from "../state";
import {
  KINDS,
  CLIENTS,
  DUVAL,
  PETIT,
  CLICK_ENERGY,
  TIRED_BELOW,
  TIRED_SHARE,
  BUG_CLICKS,
  type Kind,
  type ClientDef,
} from "../content/freelance";
import { handsFree } from "./commun";
import { earn } from "./finances";
import { acted } from "./revelations";

// Le carnet : les commandes à construire, les bugs à corriger (toujours en tête), le clic et l'IA.
// Un clic écrit des lignes (moitié moins fatigué) ; l'IA écrit seule, sur les commandes seulement,
// et ne se fatigue jamais : c'est une machine.

export const ALL_CLIENTS: ClientDef[] = [DUVAL, PETIT, ...CLIENTS.vitrine, ...CLIENTS.appli, ...CLIENTS.boutique];
export function clientOf(name: string): ClientDef {
  return ALL_CLIENTS.find((c) => c.name === name) ?? { name, chez: name, payer: name };
}

/** Lignes d'une nouvelle commande : le thème pro allège vitrines et boutiques, le test désactivé allège tout. */
export function orderLines(s: GameState, kind: Kind): number {
  const f = s.freelance;
  const theme = kind === "appli" ? 1 : f.themeMult;
  return Math.round(KINDS[kind].lines * theme * f.compMult);
}
/** Une commande arrive au bout du carnet ; sans client nommé, le suivant de la liste. */
export function addOrder(s: GameState, kind: Kind, client?: string): FlOrder {
  const f = s.freelance;
  let name = client;
  if (!name) {
    const pool = CLIENTS[kind];
    name = pool[f.clientIndex[kind] % pool.length].name;
    f.clientIndex[kind] += 1;
  }
  const o: FlOrder = { id: f.nextId++, kind, client: name, lines: orderLines(s, kind), done: 0, red: "none" };
  f.orders.push(o);
  return o;
}

export type Task = { type: "bug"; bug: FlBug } | { type: "order"; order: FlOrder } | null;
/** Ce que ton prochain clic fait : le premier bug, sinon la première commande qui n'est pas bloquée. */
export function currentTask(s: GameState): Task {
  const f = s.freelance;
  if (f.bugs.length > 0) return { type: "bug", bug: f.bugs[0] };
  const order = f.orders.find((o) => o.red !== "failing");
  return order ? { type: "order", order } : null;
}

export const isTired = (s: GameState): boolean => s.energy < TIRED_BELOW;
export const clickShare = (s: GameState): number => (isTired(s) ? TIRED_SHARE : 1);
export const clickLines = (s: GameState): number => s.freelance.lpc * clickShare(s);

export function canWork(s: GameState): boolean {
  return s.job === "freelance" && handsFree(s) && currentTask(s) !== null;
}

/** Écrire du code, ou corriger le bug en tête. L'énergie ralentit sans bloquer. */
export function workClick(s: GameState): boolean {
  if (!canWork(s)) return false;
  const task = currentTask(s)!;
  const share = clickShare(s);
  s.totalClicks += 1;
  s.energy = Math.max(0, s.energy - CLICK_ENERGY);
  if (task.type === "bug") {
    task.bug.clicks += share;
    if (task.bug.clicks >= BUG_CLICKS - 1e-9) fixBug(s, task.bug);
  } else {
    task.order.done = Math.min(task.order.lines, task.order.done + s.freelance.lpc * share);
  }
  deliverReady(s);
  acted(s);
  return true;
}

/** Un bug corrigé : son site repaiera lundi ; un test rouge corrigé débloque sa commande. */
export function fixBug(s: GameState, bug: FlBug): void {
  const f = s.freelance;
  f.bugs = f.bugs.filter((b) => b.id !== bug.id);
  if (bug.site !== null) {
    const site = f.sites.find((x) => x.id === bug.site);
    if (site) site.bugOpen = false;
  }
  if (bug.order !== null) {
    const order = f.orders.find((o) => o.id === bug.order);
    if (order) order.red = "passed";
  }
}

/** L'IA écrit seule, sur la première commande qui n'est pas bloquée (jamais sur un bug). */
export function aiWrite(s: GameState, t: number): void {
  const f = s.freelance;
  if (f.aiRate <= 0) return;
  const o = f.orders.find((x) => x.red !== "failing");
  if (!o) return;
  o.done = Math.min(o.lines, o.done + f.aiRate * t);
  deliverReady(s);
}

/** Les commandes finies partent, dans l'ordre du carnet. */
export function deliverReady(s: GameState): void {
  const f = s.freelance;
  while (f.orders.length > 0) {
    const o = f.orders[0];
    if (o.done < o.lines - 1e-9 || o.red === "failing") return;
    // [tests rouges]
    f.orders.shift();
    deliver(s, o);
  }
}

function deliver(s: GameState, o: FlOrder): void {
  const f = s.freelance;
  f.delivered += 1;
  if (f.firstDeliveryAt < 0) f.firstDeliveryAt = f.day;
  // Pour facturer Mme Duval, il faut une micro-entreprise (voir entreprise.ts).
  if (o.client === DUVAL.name && f.company === null) {
    f.pendingInvoice = true;
    return;
  }
  earn(s, KINDS[o.kind].price, "livraisons");
  // [après une livraison]
}

export function pendingLines(s: GameState): number {
  return s.freelance.orders.reduce((n, o) => n + Math.max(0, o.lines - o.done), 0);
}
/** € à la livraison de toutes les commandes du carnet. */
export function waitingValue(s: GameState): number {
  return s.freelance.orders.reduce((n, o) => n + KINDS[o.kind].price, 0);
}
```

Dans `index.ts`, ajouter `export * from "./carnet";`.

Dans `tick.ts`, importer `aiWrite` depuis `./carnet` et insérer sous `// [chaque tick]` :

```ts
  aiWrite(s, t); // l'IA écrit, même quand tes mains sont prises
```

- [ ] **Step 4 : lancer les tests**

Run: `node_modules/.bin/vitest run tests/freelance.test.ts`
Expected: PASS.

- [ ] **Step 5 : commit**

```bash
git add src/engine/freelance tests/freelance.test.ts
git commit -m "feat(freelance): le carnet, le clic, la fatigue, l'IA et les livraisons

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: La micro-entreprise (nom et logo choisis par le joueur)

Décision d'Alexandre : le joueur nomme son entreprise et choisit parmi 5 logos minimalistes. Challengé (go) : cela arrive à la première livraison, parce qu'il faut un nom pour facturer Mme Duval. La carte de création REMPLACE la carte de livraison (pas de nouveauté de plus dans la file). Gratuit, comme la vraie micro-entreprise. Elle ne bloque que les 600 € de Mme Duval.

**Files:**
- Create: `src/engine/freelance/entreprise.ts`
- Modify: `src/engine/freelance/index.ts`
- Test: `tests/freelance.test.ts` (section « la micro-entreprise »)

**Interfaces:**
- Consumes : `earn`, `remember`, `acted`, `fmtEur`.
- Produces : `sanitizeCompanyName(raw: string): string`, `canCreateCompany(s)`, `createCompany(s, rawName: string, logo: number): boolean`, `companyName(s): string`, `companyInitial(name: string): string`.

- [ ] **Step 1 : écrire les tests (ils échouent)**

```ts
import { sanitizeCompanyName, createCompany, canCreateCompany, companyInitial } from "../src/engine/freelance";
import { COMPANY_DEFAULT_NAME, COMPANY_NAME_MAX, LOGO_COUNT } from "../src/engine/content/freelance";

describe("chapitre 2 : la micro-entreprise", () => {
  function delivered(): GameState {
    const s = fresh();
    s.freelance.orders[0].done = s.freelance.orders[0].lines - 1;
    workClick(s);
    return s;
  }

  it("nettoie le nom : bords, espaces doublés, caractères de contrôle, tirets longs, longueur", () => {
    expect(sanitizeCompanyName("  Pixel   & Co ")).toBe("Pixel & Co");
    expect(sanitizeCompanyName("A\u0007B")).toBe("AB");
    expect(sanitizeCompanyName("Web — Studio")).toBe("Web - Studio");
    expect(sanitizeCompanyName("x".repeat(40))).toHaveLength(COMPANY_NAME_MAX);
    expect(sanitizeCompanyName("   ")).toBe(COMPANY_DEFAULT_NAME);
  });

  it("ne se crée qu'une fois le site de Mme Duval prêt, et paie ses 600 €", () => {
    const s0 = fresh();
    expect(canCreateCompany(s0)).toBe(false);
    const s = delivered();
    expect(createCompany(s, "Pixel & Co", 2)).toBe(true);
    expect(s.freelance.company).toEqual({ name: "Pixel & Co", logo: 2 });
    expect(s.freelance.pendingInvoice).toBe(false);
    expect(s.money.toNumber()).toBe(600);
    expect(s.souvenirs[0].text).toBe("Première facture de Pixel & Co : 600 €, Mme Duval.");
    expect(s.freelance.quote).toBe("facture");
    expect(createCompany(s, "Autre", 0)).toBe(false);
  });

  it("borne le logo et garde le texte tel quel (jamais du HTML)", () => {
    const s = delivered();
    createCompany(s, "<img onerror=x>", 99);
    expect(s.freelance.company!.logo).toBe(LOGO_COUNT - 1);
    expect(s.freelance.company!.name).toBe("<img onerror=x>");
  });

  it("l'initiale du logo suit le nom, émojis compris", () => {
    expect(companyInitial("pixel")).toBe("P");
    expect(companyInitial("🍞 Pain")).toBe("🍞");
    expect(companyInitial("")).toBe("A");
  });
});
```

- [ ] **Step 2 : lancer les tests**

Run: `node_modules/.bin/vitest run tests/freelance.test.ts`
Expected: FAIL.

- [ ] **Step 3 : écrire le code**

`src/engine/freelance/entreprise.ts` :

```ts
import type { GameState } from "../state";
import { COMPANY_NAME_MAX, COMPANY_DEFAULT_NAME, LOGO_COUNT, KINDS, TEXTES } from "../content/freelance";
import { earn } from "./finances";
import { fmtEur, remember } from "./commun";
import { acted } from "./revelations";

// La micro-entreprise : pour facturer Mme Duval, il faut un nom. Le joueur le choisit, avec un logo.
// Le nom est un texte libre : l'interface l'affiche toujours en texte, jamais en HTML.

export function sanitizeCompanyName(raw: string): string {
  const cleaned = raw
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[—–]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  const cut = Array.from(cleaned).slice(0, COMPANY_NAME_MAX).join("").trim();
  return cut || COMPANY_DEFAULT_NAME;
}

export function canCreateCompany(s: GameState): boolean {
  return s.job === "freelance" && s.freelance.pendingInvoice && s.freelance.company === null;
}

/** Créer la micro-entreprise et facturer Mme Duval (gratuit, comme au guichet de l'URSSAF). */
export function createCompany(s: GameState, rawName: string, logo: number): boolean {
  if (!canCreateCompany(s)) return false;
  const f = s.freelance;
  const name = sanitizeCompanyName(rawName);
  f.company = { name, logo: Math.max(0, Math.min(LOGO_COUNT - 1, Math.floor(logo))) };
  f.pendingInvoice = false;
  const price = KINDS.vitrine.price;
  earn(s, price, "livraisons");
  f.quote = "facture";
  remember(s, "contemplation", TEXTES.firstInvoice(name, fmtEur(price)), false);
  acted(s);
  return true;
}

export function companyName(s: GameState): string {
  return s.freelance.company?.name ?? COMPANY_DEFAULT_NAME;
}
/** Le cinquième logo : l'initiale du nom (un émoji compte pour un caractère). */
export function companyInitial(name: string): string {
  const first = Array.from(name.trim())[0];
  return first ? first.toLocaleUpperCase("fr-FR") : "A";
}
```

Dans `index.ts`, ajouter `export * from "./entreprise";`.

- [ ] **Step 4 : lancer les tests**

Run: `node_modules/.bin/vitest run tests/freelance.test.ts`
Expected: PASS.

- [ ] **Step 5 : commit**

```bash
git add src/engine/freelance tests/freelance.test.ts
git commit -m "feat(freelance): la micro-entreprise, son nom et son logo

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 6: Les propositions aux clients et les commandes de la semaine

**Files:**
- Create: `src/engine/freelance/demande.ts`
- Modify: `src/engine/freelance/revelations.ts` (repère `// [offres]`), `tick.ts` (`// [chaque tick]`, `// [lundi]`), `index.ts`
- Test: `tests/freelance.test.ts` (section « la demande »)

**Interfaces:**
- Consumes : `addOrder`, `pendingLines`, `isRevealed`, `acted`.
- Produces : `proposalReady(s, i): boolean`, `proposalVisible(s, id): boolean`, `visibleProposals(s): ProposalDef[]`, `acceptProposal(s, id): boolean`, `weeklyArrivals(s)`, `trackPace(s, t)`.

Règle (spec v1, simulation v3) : une proposition, gratuite, paraît quand tu suis (carnet vide 6 s) ou au plus tard 120 s après la nouveauté précédente ; une seule à la fois, dans l'ordre de `PROPOSALS`, la suivante après l'acceptation de la précédente. La première attend la micro-entreprise. Les commandes « par semaine » arrivent chaque lundi.

- [ ] **Step 1 : écrire les tests (ils échouent)**

```ts
import { proposalVisible, acceptProposal, visibleProposals } from "../src/engine/freelance";
import { KEEP_UP_SECS, PROPOSAL_LATE, FL_WEEK_SECS, PETIT } from "../src/engine/content/freelance";

/** Mme Duval livrée et facturée. */
function invoiced(): GameState {
  const s = fresh();
  s.freelance.orders[0].done = s.freelance.orders[0].lines - 1;
  workClick(s);
  createCompany(s, "Pixel", 0);
  return s;
}

describe("chapitre 2 : la demande", () => {
  it("rien n'est proposé avant la facture ; ensuite, le contrat d'entretien dès que tu suis", () => {
    const s = fresh();
    run(s, 30);
    expect(visibleProposals(s)).toHaveLength(0);
    const t = invoiced();
    run(t, KEEP_UP_SECS + 1);
    expect(proposalVisible(t, "entretien_duval")).toBe(true);
    expect(proposalVisible(t, "cartes")).toBe(false); // une à la fois
    expect(acceptProposal(t, "entretien_duval")).toBe(true);
    expect(t.freelance.maintDuval).toBe(true);
    expect(proposalVisible(t, "entretien_duval")).toBe(false);
  });

  it("même si tu ne suis pas, la proposition suivante paraît au plus tard 120 s après la précédente", () => {
    const s = invoiced();
    run(s, KEEP_UP_SECS + 1);
    acceptProposal(s, "entretien_duval");
    s.freelance.orders.push({ id: 500, kind: "vitrine", client: "X", lines: 2000, done: 0, red: "none" }); // carnet jamais vide
    s.freelance.delivered = 0; // aucun outil ne se propose dans ce test : seule la proposition compte
    s.freelance.sites = []; // ni bug de Mme Duval
    s.freelance.home = 3; // ni logement (le deux-pièces est le dernier)
    run(s, PROPOSAL_LATE - 5);
    expect(proposalVisible(s, "cartes")).toBe(false);
    run(s, 10);
    expect(proposalVisible(s, "cartes")).toBe(true);
  });

  it("les cartes de visite font arriver un site vitrine chaque lundi", () => {
    const s = invoiced();
    run(s, KEEP_UP_SECS + 1);
    acceptProposal(s, "entretien_duval");
    run(s, 36 + KEEP_UP_SECS);
    expect(acceptProposal(s, "cartes")).toBe(true);
    const before = s.freelance.orders.length;
    run(s, FL_WEEK_SECS);
    expect(s.freelance.orders.length).toBe(before + 1);
    expect(s.freelance.orders.at(-1)!.kind).toBe("vitrine");
  });

  it("l'appli de M. Petit arrive tout de suite", () => {
    const s = invoiced();
    for (const id of ["entretien_duval", "cartes", "profil", "entretien_tous"]) s.freelance.proposals[id] = 0;
    s.freelance.lastNovelty = -1000;
    run(s, KEEP_UP_SECS + 1);
    expect(acceptProposal(s, "petit")).toBe(true);
    expect(s.freelance.orders.at(-1)).toMatchObject({ kind: "appli", client: PETIT.name });
  });
});
```

- [ ] **Step 2 : lancer les tests**

Run: `node_modules/.bin/vitest run tests/freelance.test.ts`
Expected: FAIL.

- [ ] **Step 3 : écrire le code**

`src/engine/freelance/demande.ts` :

```ts
import type { GameState } from "../state";
import {
  PROPOSALS,
  PROPOSAL_BY_ID,
  PETIT,
  KEEP_UP_SECS,
  PROPOSAL_LATE,
  BEHIND_LINES,
  BEHIND_BUGS,
  type ProposalDef,
} from "../content/freelance";
import { addOrder, pendingLines } from "./carnet";
import { isRevealed, acted } from "./revelations";

// La demande : ce que tu proposes à tes clients (gratuit), et les commandes qui arrivent chaque lundi.
// Tu proposes quand tu suis ; un outil se propose quand tu ne suis plus (voir outils.ts).

/** La proposition n° i est-elle prête à paraître (pour la file des nouveautés) ? */
export function proposalReady(s: GameState, i: number): boolean {
  const f = s.freelance;
  const p = PROPOSALS[i];
  if (f.proposals[p.id] !== undefined) return false;
  const previousDone = i === 0 ? f.company !== null : f.proposals[PROPOSALS[i - 1].id] !== undefined;
  if (!previousDone) return false;
  return f.keptUp >= KEEP_UP_SECS || f.day - f.lastNovelty >= PROPOSAL_LATE;
}

export function proposalVisible(s: GameState, id: string): boolean {
  return isRevealed(s, `prop_${id}`) && s.freelance.proposals[id] === undefined;
}
export function visibleProposals(s: GameState): ProposalDef[] {
  return PROPOSALS.filter((p) => proposalVisible(s, p.id));
}

export function acceptProposal(s: GameState, id: string): boolean {
  if (!proposalVisible(s, id)) return false;
  const f = s.freelance;
  const p = PROPOSAL_BY_ID[id];
  f.proposals[id] = f.day;
  if (p.weekly) f.weekly.push(...p.weekly);
  if (p.oneShot) addOrder(s, p.oneShot, PETIT.name);
  if (p.maintDuval) {
    f.maintDuval = true;
    // [contrat Duval]
  }
  if (p.maintAll) f.maintAll = true;
  if (p.evening) f.evening = true;
  if (id === "profil") f.quote = "entretien";
  acted(s);
  return true;
}

/** Chaque lundi, les commandes de la semaine arrivent au bout du carnet. */
export function weeklyArrivals(s: GameState): void {
  for (const kind of s.freelance.weekly) addOrder(s, kind);
}

/** Tu suis (carnet vide) ou tu ne suis plus (trop de lignes ou de bugs en attente), en secondes d'affilée. */
export function trackPace(s: GameState, t: number): void {
  const f = s.freelance;
  const empty = f.orders.length === 0 && f.bugs.length === 0;
  f.keptUp = empty ? f.keptUp + t : 0;
  const late = pendingLines(s) > BEHIND_LINES || f.bugs.length >= BEHIND_BUGS;
  f.behind = late ? f.behind + t : 0;
}
```

Dans `revelations.ts`, importer `PROPOSALS` depuis `../content/freelance` et `proposalReady` depuis `./demande`, puis ajouter sous `// [offres]` :

```ts
  ...PROPOSALS.map((p, i): FlReveal => ({ id: `prop_${p.id}`, kind: "jeu", ready: (s) => proposalReady(s, i) })),
```

(La dépendance circulaire `revelations` ↔ `demande` est sans risque : `proposalReady` n'est appelée qu'au tick, jamais au chargement.)

Dans `tick.ts`, importer `trackPace, weeklyArrivals` depuis `./demande` ; sous `// [chaque tick]`, après `aiWrite(s, t);` : `trackPace(s, t);` ; sous `// [lundi]` : `weeklyArrivals(s); // les commandes de la semaine`.

Dans `index.ts`, ajouter `export * from "./demande";`.

- [ ] **Step 4 : lancer les tests**

Run: `node_modules/.bin/vitest run tests/freelance.test.ts`
Expected: PASS.

- [ ] **Step 5 : commit**

```bash
git add src/engine/freelance tests/freelance.test.ts
git commit -m "feat(freelance): les propositions aux clients et les commandes de la semaine

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: L'entretien et les bugs

**Files:**
- Modify: `src/engine/freelance/carnet.ts` (sites, bugs), `demande.ts` (`// [contrat Duval]`), `tick.ts` (`// [chaque tick]`, `// [vendredi]`)
- Test: `tests/freelance.test.ts` (section « l'entretien »)

**Interfaces:**
- Produces : `addSite(s, client, kind, nextBug): FlSite`, `openBug(s, site)`, `tickBugs(s)`, `eveningBugs(s)`, `bugsLast7Days(s): number`, `maintenancePossible(s): number`, `maintenanceAtStake(s): number`.

Règle : un site entretenu envoie un bug par semaine (deux fois moins avec la formation) ; le premier de Mme Duval arrive 40 s après le contrat, celui d'un site livré entre 30 et 100 s après la livraison. Un site n'a qu'un bug ouvert à la fois. « Répondre aux clients le soir » ouvre deux bugs de plus chaque vendredi. Un bug ouvert le lundi : ce client ne paie pas (tâche 8).

- [ ] **Step 1 : écrire les tests (ils échouent)**

```ts
import { tickBugs, bugsLast7Days, maintenancePossible, maintenanceAtStake, eveningBugs, addSite } from "../src/engine/freelance";
import { DUVAL_FIRST_BUG, FL_WEEK_SECS, FORMATION_BUG_RATE, DUVAL } from "../src/engine/content/freelance";

describe("chapitre 2 : l'entretien", () => {
  it("le contrat de Mme Duval envoie son premier bug 40 s plus tard, puis un par semaine", () => {
    const s = invoiced();
    run(s, KEEP_UP_SECS + 1);
    acceptProposal(s, "entretien_duval");
    expect(s.freelance.sites).toHaveLength(1);
    run(s, DUVAL_FIRST_BUG + 0.1);
    expect(s.freelance.bugs).toHaveLength(1);
    expect(s.freelance.bugs[0].text).toBe("Les horaires du dimanche ont disparu.");
    expect(bugsLast7Days(s)).toBe(1);
  });

  it("un site n'a qu'un bug ouvert à la fois ; la formation espace les bugs", () => {
    const s = fresh();
    const site = addSite(s, DUVAL.name, "vitrine", 0);
    tickBugs(s);
    s.freelance.day += FL_WEEK_SECS;
    tickBugs(s);
    expect(s.freelance.bugs).toHaveLength(1);
    s.freelance.bugRate = FORMATION_BUG_RATE;
    s.freelance.bugs = [];
    site.bugOpen = false;
    site.nextBug = s.freelance.day;
    tickBugs(s);
    expect(site.nextBug - s.freelance.day).toBeCloseTo(FL_WEEK_SECS / FORMATION_BUG_RATE);
  });

  it("avec l'entretien à chaque livraison, chaque site livré devient un contrat", () => {
    const s = invoiced();
    s.freelance.maintAll = true;
    const o = addOrder(s, "boutique");
    o.done = o.lines - 1;
    workClick(s);
    expect(s.freelance.sites.map((x) => x.client)).toContain("Épicerie bio Garnier");
    expect(maintenancePossible(s)).toBe(130);
  });

  it("le vendredi soir, deux sites sans bug en reçoivent un ; l'argent en jeu suit les bugs ouverts", () => {
    const s = fresh();
    for (let i = 0; i < 3; i++) addSite(s, `Site ${i}`, "vitrine", 1e9);
    eveningBugs(s);
    expect(s.freelance.bugs).toHaveLength(2);
    expect(maintenanceAtStake(s)).toBe(100);
  });
});
```

- [ ] **Step 2 : lancer les tests**

Run: `node_modules/.bin/vitest run tests/freelance.test.ts`
Expected: FAIL.

- [ ] **Step 3 : écrire le code**

Dans `carnet.ts`, compléter l'import du contenu avec `BUG_TEXTS, FL_WEEK_SECS, FIRST_BUG_MIN, FIRST_BUG_STEP, FIRST_BUG_SPREAD, EVENING_BUGS`, l'import des types avec `FlSite`, importer `weekNumber` depuis `./commun`, et ajouter :

```ts
// --- L'entretien : chaque site sous contrat paie le lundi et envoie des bugs ---

export function addSite(s: GameState, client: string, kind: Kind, nextBug: number): FlSite {
  const f = s.freelance;
  const site: FlSite = { id: f.nextId++, client, kind, fee: KINDS[kind].fee, nextBug, bugOpen: false, bugs: 0, sinceWeek: weekNumber(s) };
  f.sites.push(site);
  return site;
}

/** Un bug arrive au bout de la file des bugs (toujours avant les commandes). Les textes tournent par site. */
export function openBug(s: GameState, site: FlSite): void {
  const f = s.freelance;
  const texts = BUG_TEXTS[site.kind];
  site.bugOpen = true;
  const text = texts[(f.sites.indexOf(site) + site.bugs) % texts.length];
  f.bugs.push({ id: f.nextId++, site: site.id, order: null, clicks: 0, text });
  site.bugs += 1;
  f.bugArrivals.push(f.day);
}

const bugPeriod = (s: GameState): number => FL_WEEK_SECS / s.freelance.bugRate;

/** Les sites envoient leurs bugs à leur heure ; on oublie ceux arrivés il y a plus de 7 jours. */
export function tickBugs(s: GameState): void {
  const f = s.freelance;
  for (const site of f.sites) {
    if (f.day < site.nextBug) continue;
    site.nextBug = f.day + bugPeriod(s);
    if (!site.bugOpen) openBug(s, site);
  }
  f.bugArrivals = f.bugArrivals.filter((t) => t > f.day - FL_WEEK_SECS);
}

/** « Répondre aux clients le soir » : le vendredi, deux sites sans bug en reçoivent un. */
export function eveningBugs(s: GameState): void {
  const f = s.freelance;
  const free = f.sites.filter((x) => !x.bugOpen).sort((a, b) => a.nextBug - b.nextBug).slice(0, EVENING_BUGS);
  for (const site of free) {
    openBug(s, site);
    site.nextBug = f.day + bugPeriod(s);
  }
}

export const bugsLast7Days = (s: GameState): number => s.freelance.bugArrivals.length;
/** € d'entretien si tout est corrigé lundi. */
export const maintenancePossible = (s: GameState): number => s.freelance.sites.reduce((n, x) => n + x.fee, 0);
/** € d'entretien que les bugs encore ouverts feraient perdre lundi. */
export const maintenanceAtStake = (s: GameState): number =>
  s.freelance.sites.reduce((n, x) => n + (x.bugOpen ? x.fee : 0), 0);
```

Dans `deliver`, sous `// [après une livraison]` :

```ts
  if (f.maintAll) addSite(s, o.client, o.kind, f.day + FIRST_BUG_MIN + ((f.sites.length * FIRST_BUG_STEP) % FIRST_BUG_SPREAD));
  if (o.client === PETIT.name) f.quote = "petit";
```

Dans `demande.ts`, importer `addSite` depuis `./carnet`, `DUVAL, DUVAL_FIRST_BUG` depuis le contenu, et remplacer `// [contrat Duval]` par :

```ts
    addSite(s, DUVAL.name, "vitrine", f.day + DUVAL_FIRST_BUG);
```

Dans `tick.ts`, importer `tickBugs, eveningBugs` depuis `./carnet` ; sous `// [chaque tick]`, avant `aiWrite(s, t);` : `tickBugs(s);` ; sous `// [vendredi]` : `if (s.freelance.evening) eveningBugs(s); // les commandes du soir amènent leurs bugs`.

- [ ] **Step 4 : lancer les tests**

Run: `node_modules/.bin/vitest run tests/freelance.test.ts`
Expected: PASS.

- [ ] **Step 5 : commit**

```bash
git add src/engine/freelance tests/freelance.test.ts
git commit -m "feat(freelance): les sites entretenus et leurs bugs

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Le lundi, les finances de la semaine et le livret

**Files:**
- Modify: `src/engine/freelance/finances.ts`, `tick.ts` (`// [lundi]` en tête du bloc, `// [chaque tick]`)
- Test: `tests/freelance.test.ts` (section « le lundi »)

**Interfaces:**
- Consumes : `maintenancePossible`, `HOMES` (le loyer du logement actuel : `HOMES[s.freelance.home].rent`).
- Produces : `mondayMorning(s)`, `subsTotal(s): number`, `canDeposit(s)`, `depositAll(s)`, `canWithdraw(s)`, `withdrawAll(s)`, `nextInterest(s): number`.

Règle (spec v3 et v5) : l'ordre du lundi est l'entretien, puis les charges pro (abonnements, Nora), puis le loyer, puis le livret. La semaine s'ouvre le lundi : ces paiements comptent dans la semaine qui commence. Le livret verse 1 % du plus petit solde de la semaine, sur le livret. Aucune charge n'est suspendue en négatif.

- [ ] **Step 1 : écrire les tests (ils échouent)**

```ts
import { mondayMorning, net, depositAll, withdrawAll, canDeposit } from "../src/engine/freelance";
import { NORA_SALARY, HOMES } from "../src/engine/content/freelance";

describe("chapitre 2 : le lundi", () => {
  it("paie l'entretien des sites sans bug, puis prélève abonnements, Nora et loyer, même en négatif", () => {
    const s = fresh();
    addSite(s, "A", "appli", 1e9);
    const b = addSite(s, "B", "vitrine", 1e9);
    b.bugOpen = true;
    s.freelance.subs = { autocompletion: 5, ia_pro: 50 };
    s.freelance.nora = true;
    s.freelance.home = 3;
    mondayMorning(s);
    const l = s.freelance.ledger;
    expect(l.entretien).toBe(160);
    expect(l.entretienPossible).toBe(210);
    expect(l.abonnements).toBe(55);
    expect(l.salaires).toBe(NORA_SALARY);
    expect(l.loyer).toBe(HOMES[3].rent);
    expect(s.money.toNumber()).toBe(160 - 55 - NORA_SALARY - HOMES[3].rent);
  });

  it("clôt la semaine : son net (hors achats) rejoint l'historique", () => {
    const s = fresh();
    s.freelance.ledger.livraisons = 600;
    s.freelance.ledger.repas = 22;
    s.freelance.ledger.achats = 250;
    mondayMorning(s);
    expect(s.freelance.history).toEqual([{ entrees: 600, net: 578, livraisons: 600, entretien: 0, charges: 22 }]);
    expect(s.freelance.lastWeek!.achats).toBe(250);
    expect(net(s.freelance.ledger)).toBe(0);
  });

  it("le livret verse 1 % de son plus petit solde de la semaine, compté dans les entrées", () => {
    const s = fresh();
    s.money = D(1000);
    expect(canDeposit(s)).toBe(true);
    depositAll(s);
    expect(s.freelance.livretBalance).toBe(1000);
    run(s, FL_WEEK_SECS + 0.1);
    expect(s.freelance.livretBalance).toBeCloseTo(1010);
    expect(s.freelance.ledger.livret).toBeCloseTo(10);
    withdrawAll(s);
    expect(s.money.toNumber()).toBeCloseTo(1010);
  });
});
```

- [ ] **Step 2 : lancer les tests**

Run: `node_modules/.bin/vitest run tests/freelance.test.ts`
Expected: FAIL.

- [ ] **Step 3 : écrire le code**

Dans `finances.ts`, importer `emptyLedger` depuis `../state`, `HOMES, NORA_SALARY, LIVRET_RATE` depuis `../content/freelance`, `maintenancePossible` depuis `./carnet`, `acted` depuis `./revelations`, et ajouter :

```ts
export const subsTotal = (s: GameState): number => Object.values(s.freelance.subs).reduce((n, v) => n + v, 0);

/** Les intérêts du lundi : 1 % du plus petit solde de la semaine (déposer le dimanche ne rapporte rien). */
export function nextInterest(s: GameState): number {
  return Math.floor(s.freelance.livretLow * LIVRET_RATE * 100) / 100;
}

/** Le lundi matin : la semaine écoulée se clôt ; l'entretien, les charges pro, le loyer, puis le livret. */
export function mondayMorning(s: GameState): void {
  const f = s.freelance;
  const l = f.ledger;
  f.history.push({ entrees: entrees(l), net: net(l), livraisons: l.livraisons, entretien: l.entretien, charges: chargesPro(l) + chargesPerso(l) });
  f.lastWeek = f.ledger;
  f.ledger = emptyLedger();
  f.ledger.entretienPossible = maintenancePossible(s);
  earn(s, f.sites.reduce((n, x) => n + (x.bugOpen ? 0 : x.fee), 0), "entretien");
  spend(s, subsTotal(s), "abonnements");
  if (f.nora) spend(s, NORA_SALARY, "salaires");
  spend(s, HOMES[f.home].rent, "loyer");
  const interest = nextInterest(s);
  if (interest > 0) {
    f.livretBalance += interest;
    f.ledger.livret += interest; // les intérêts restent sur le livret, mais comptent dans les entrées
  }
  f.livretLow = f.livretBalance;
}

export const canDeposit = (s: GameState): boolean => s.job === "freelance" && s.money.gt(0);
export const canWithdraw = (s: GameState): boolean => s.job === "freelance" && s.freelance.livretBalance > 0;
/** Tout mettre sur le livret. Seul le plus petit solde de la semaine rapporte : un dépôt fait le lundi compte toute la semaine, un dépôt du dimanche ne rapporte rien. */
export function depositAll(s: GameState): boolean {
  if (!canDeposit(s)) return false;
  const f = s.freelance;
  const n = s.money.toNumber();
  s.money = s.money.sub(n);
  f.livretBalance += n;
  if (Math.floor(f.day / FL_DAY_SECS) % 7 === 0) f.livretLow = f.livretBalance;
  acted(s);
  return true;
}
export function withdrawAll(s: GameState): boolean {
  if (!canWithdraw(s)) return false;
  const f = s.freelance;
  s.money = s.money.add(f.livretBalance);
  f.livretBalance = 0;
  f.livretLow = 0;
  acted(s);
  return true;
}
```

(`FL_DAY_SECS` s'importe du contenu avec les autres constantes. L'import de `../state` devient `import { emptyLedger, type GameState, type FlLedger } from "../state";`.)

Dans `tick.ts`, importer `mondayMorning` depuis `./finances` ; en TÊTE du bloc `// [lundi]` (avant `weeklyArrivals`) : `mondayMorning(s); // l'entretien, les charges pro, le loyer, le livret` ; sous `// [chaque tick]` (en dernier) : `s.freelance.livretLow = Math.min(s.freelance.livretLow, s.freelance.livretBalance);`.

Dans `onNewDay`, le lundi du jour 0 n'existe pas (la boucle commence au jour 1) : le premier `mondayMorning` a lieu au début de la semaine 2. C'est voulu.

- [ ] **Step 4 : lancer les tests**

Run: `node_modules/.bin/vitest run tests/freelance.test.ts`
Expected: PASS.

- [ ] **Step 5 : commit**

```bash
git add src/engine/freelance tests/freelance.test.ts
git commit -m "feat(freelance): le lundi, le net de la semaine et le livret

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 9: Les outils et les abonnements

**Files:**
- Create: `src/engine/freelance/outils.ts`
- Modify: `src/engine/freelance/revelations.ts` (`// [offres]`, après les propositions), `index.ts`
- Test: `tests/freelance.test.ts` (section « les outils »)

**Interfaces:**
- Consumes : `spend`, `isRevealed`, `acted`.
- Produces : `toolReady(s, i): boolean`, `toolOffered(s): ToolDef | undefined`, `toolPrice(t): number`, `canBuyTool(s, id): boolean`, `buyTool(s, id): boolean`, `ownedTools(s): ToolDef[]`.

Règle (spec v3, v4) : un outil à la fois, dans l'ordre de `TOOLS`, après la première livraison ; il se propose quand tu ne suis plus depuis 6 s, ou au plus tard 60 s après l'achat du précédent. Le deuxième écran attend une chambre à toi ; la formation attend 3 bugs en 7 jours. Un abonnement se paie d'avance pour sa première semaine, puis chaque lundi. L'abonnement pro de l'IA remplace celui des pages neuves.

- [ ] **Step 1 : écrire les tests (ils échouent)**

```ts
import { toolOffered, canBuyTool, buyTool, ownedTools } from "../src/engine/freelance";
import { TOOL_LATE, TOOLS } from "../src/engine/content/freelance";

describe("chapitre 2 : les outils", () => {
  it("la licence d'éditeur se propose au plus tard 60 s après la première livraison, même si tu suis", () => {
    const s = invoiced();
    run(s, TOOL_LATE - 5);
    expect(toolOffered(s)).toBeUndefined();
    run(s, 10);
    expect(toolOffered(s)?.id).toBe("editeur");
  });

  it("elle se propose plus tôt si tu ne suis plus depuis 6 s", () => {
    const s = invoiced();
    addOrder(s, "appli");
    s.freelance.orders[0].lines = 1e9;
    run(s, 7);
    expect(toolOffered(s)?.id).toBe("editeur");
  });

  it("acheter l'éditeur : 250 €, 8 lignes par clic ; puis l'écran attend une chambre", () => {
    const s = invoiced();
    run(s, TOOL_LATE + 1);
    s.money = D(100);
    expect(canBuyTool(s, "editeur")).toBe(false); // il faut 250 € en poche
    s.money = D(250);
    expect(buyTool(s, "editeur")).toBe(true);
    expect(s.freelance.lpc).toBe(8);
    expect(s.freelance.ledger.achats).toBe(250);
    run(s, TOOL_LATE + 40);
    expect(toolOffered(s)).toBeUndefined(); // pas de deuxième écran sur le canapé de Sam
    s.freelance.home = 1;
    run(s, 36);
    expect(toolOffered(s)?.id).toBe("ecran");
  });

  it("un abonnement se paie d'avance, puis chaque lundi ; l'abonnement pro remplace celui des pages neuves", () => {
    const s = invoiced();
    s.money = D(10000);
    for (const t of TOOLS.slice(0, 3)) s.freelance.tools[t.id] = 0; // éditeur, écran, autocomplétion
    s.freelance.subs = { autocompletion: 5 };
    s.freelance.revealed["tool_ia_pages"] = 0;
    expect(buyTool(s, "ia_pages")).toBe(true);
    expect(s.freelance.aiRate).toBe(20);
    expect(s.freelance.ledger.abonnements).toBe(25);
    expect(s.freelance.subs).toEqual({ autocompletion: 5, ia_pages: 25 });
    s.freelance.tools.theme = 0;
    s.freelance.tools.formation = 0;
    s.freelance.revealed["tool_ia_pro"] = 0;
    buyTool(s, "ia_pro");
    expect(s.freelance.subs).toEqual({ autocompletion: 5, ia_pro: 50 });
    expect(ownedTools(s).map((t) => t.id)).not.toContain("ia_pages");
  });

  it("la formation attend 3 bugs en 7 jours, puis divise les bugs par deux et active les tests", () => {
    const s = invoiced();
    s.money = D(10000);
    for (const t of TOOLS.slice(0, 5)) s.freelance.tools[t.id] = 0;
    s.freelance.lastNovelty = -1000;
    run(s, TOOL_LATE + 1);
    expect(toolOffered(s)).toBeUndefined();
    s.freelance.bugArrivals = [s.freelance.day, s.freelance.day, s.freelance.day];
    run(s, 0.1);
    expect(toolOffered(s)?.id).toBe("formation");
    buyTool(s, "formation");
    expect(s.freelance.bugRate).toBe(0.5);
    expect(s.freelance.tests).toBe(true);
  });
});
```

- [ ] **Step 2 : lancer les tests**

Run: `node_modules/.bin/vitest run tests/freelance.test.ts`
Expected: FAIL.

- [ ] **Step 3 : écrire le code**

`src/engine/freelance/outils.ts` :

```ts
import type { GameState } from "../state";
import { TOOLS, TOOL_BY_ID, FORMATION_BUG_RATE, BEHIND_SECS, TOOL_LATE, type ToolDef } from "../content/freelance";
import { spend } from "./finances";
import { isRevealed, acted } from "./revelations";

// Les outils : automatiser ton travail est sain et célébré. Un à la fois, quand tu ne suis plus.

/** L'outil n° i est-il prêt à se proposer (pour la file des nouveautés) ? */
export function toolReady(s: GameState, i: number): boolean {
  const f = s.freelance;
  const t = TOOLS[i];
  if (f.tools[t.id] !== undefined || f.delivered < 1) return false;
  if (i > 0 && f.tools[TOOLS[i - 1].id] === undefined) return false;
  if (t.needs === "chambre" && f.home < 1) return false;
  if (t.needs === "bugs" && f.bugArrivals.length < 3) return false;
  const since = i > 0 ? f.tools[TOOLS[i - 1].id] : f.firstDeliveryAt;
  return f.behind >= BEHIND_SECS || f.day - since >= TOOL_LATE;
}

export function toolOffered(s: GameState): ToolDef | undefined {
  const f = s.freelance;
  return TOOLS.find((t) => f.tools[t.id] === undefined && isRevealed(s, `tool_${t.id}`));
}
/** Ce qu'il faut en poche : le prix, plus la première semaine d'abonnement. */
export const toolPrice = (t: ToolDef): number => t.cost + t.sub;

export function canBuyTool(s: GameState, id: string): boolean {
  const t = TOOL_BY_ID[id];
  return s.job === "freelance" && !!t && toolOffered(s)?.id === id && s.money.gte(toolPrice(t));
}

export function buyTool(s: GameState, id: string): boolean {
  if (!canBuyTool(s, id)) return false;
  const f = s.freelance;
  const t = TOOL_BY_ID[id];
  spend(s, t.cost, "achats");
  spend(s, t.sub, "abonnements");
  f.tools[id] = f.day;
  if (t.lpc) f.lpc = t.lpc;
  if (t.aiRate) f.aiRate = t.aiRate;
  if (t.theme) f.themeMult = t.theme;
  if (t.formation) {
    f.bugRate = FORMATION_BUG_RATE;
    f.tests = true;
  }
  if (t.replaces) delete f.subs[t.replaces];
  if (t.sub) f.subs[id] = t.sub;
  if (t.weekly) f.weekly.push(...t.weekly);
  acted(s);
  return true;
}

/** Ce que tu possèdes (l'abonnement remplacé n'y est plus). */
export function ownedTools(s: GameState): ToolDef[] {
  const f = s.freelance;
  const replaced = new Set(TOOLS.filter((t) => f.tools[t.id] !== undefined && t.replaces).map((t) => t.replaces));
  return TOOLS.filter((t) => f.tools[t.id] !== undefined && !replaced.has(t.id));
}
```

Dans `revelations.ts`, importer `TOOLS` et `toolReady` (depuis `./outils`), et ajouter sous `// [offres]`, APRÈS la ligne des propositions :

```ts
  ...TOOLS.map((t, i): FlReveal => ({ id: `tool_${t.id}`, kind: "jeu", ready: (s) => toolReady(s, i) })),
```

Dans `index.ts` : `export * from "./outils";`.

- [ ] **Step 4 : lancer les tests**

Run: `node_modules/.bin/vitest run tests/freelance.test.ts`
Expected: PASS.

- [ ] **Step 5 : commit**

```bash
git add src/engine/freelance tests/freelance.test.ts
git commit -m "feat(freelance): les outils et les abonnements IA

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Le logement

**Files:**
- Create: `src/engine/freelance/logement.ts`
- Modify: `src/engine/freelance/revelations.ts` (`// [offres]`, EN TÊTE du repère, avant les propositions), `finances.ts` (le loyer via `currentHome`), `index.ts`
- Test: `tests/freelance.test.ts` (section « le logement »)

**Interfaces:**
- Produces : `currentHome(s): HomeDef`, `energyMax(s): number`, `nextHome(s): HomeDef | undefined`, `homeWorthIt(s, i): boolean`, `homeOffered(s): HomeDef | undefined`, `moveHome(s): boolean`.

Règle (spec v2, v4) : un meilleur logement se propose quand les entrées des deux dernières semaines closes couvrent en moyenne 5 fois son loyer. Il agrandit l'énergie maximale (100, 120, 140, 170) et le repas (10 puis 15 dès le T1). Déménager n'est pas automatiser sa vie : pas d'effet sur le Sens.

- [ ] **Step 1 : écrire les tests (ils échouent)**

```ts
import { homeOffered, moveHome, energyMax } from "../src/engine/freelance";
import { HOME_RENT_FACTOR } from "../src/engine/content/freelance";

describe("chapitre 2 : le logement", () => {
  it("la chambre se propose quand une semaine rapporte 5 fois son loyer", () => {
    const s = fresh();
    s.freelance.history = [{ entrees: HOME_RENT_FACTOR * HOMES[1].rent - 1, net: 0, livraisons: 0, entretien: 0, charges: 0 }];
    run(s, 1);
    expect(homeOffered(s)).toBeUndefined();
    s.freelance.history.push({ entrees: HOME_RENT_FACTOR * HOMES[1].rent + 10, net: 0, livraisons: 0, entretien: 0, charges: 0 });
    run(s, 1);
    expect(homeOffered(s)?.id).toBe("chambre");
  });

  it("déménager agrandit l'énergie maximale, laisse un souvenir, et le loyer tombe le lundi", () => {
    const s = fresh();
    s.freelance.revealed["home_chambre"] = 0;
    s.energy = 90;
    expect(moveHome(s)).toBe(true);
    expect(energyMax(s)).toBe(120);
    expect(s.energy).toBe(110);
    expect(s.souvenirs[0].text).toBe(HOMES[1].souvenir);
    mondayMorning(s);
    expect(s.freelance.ledger.loyer).toBe(110);
  });
});
```

- [ ] **Step 2 : lancer les tests**

Run: `node_modules/.bin/vitest run tests/freelance.test.ts`
Expected: FAIL.

- [ ] **Step 3 : écrire le code**

`src/engine/freelance/logement.ts` :

```ts
import type { GameState } from "../state";
import { HOMES, HOME_RENT_FACTOR, type HomeDef } from "../content/freelance";
import { remember } from "./commun";
import { isRevealed, acted } from "./revelations";

// Le logement : du canapé de Sam au deux-pièces avec un bureau. Payé chaque lundi, même en négatif.

export const currentHome = (s: GameState): HomeDef => HOMES[s.freelance.home];
export const energyMax = (s: GameState): number => currentHome(s).energyMax;
export const nextHome = (s: GameState): HomeDef | undefined => HOMES[s.freelance.home + 1];

/** Le logement n° i vaut-il la peine (pour la file) : c'est le suivant, et tes entrées couvrent 5 fois son loyer. */
export function homeWorthIt(s: GameState, i: number): boolean {
  const f = s.freelance;
  if (f.home !== i - 1) return false;
  const weeks = f.history.slice(-2);
  if (weeks.length === 0) return false;
  const avg = weeks.reduce((n, w) => n + w.entrees, 0) / weeks.length;
  return avg >= HOME_RENT_FACTOR * HOMES[i].rent;
}

export function homeOffered(s: GameState): HomeDef | undefined {
  const h = nextHome(s);
  return h && isRevealed(s, `home_${h.id}`) ? h : undefined;
}

export function moveHome(s: GameState): boolean {
  const h = homeOffered(s);
  if (!h || s.job !== "freelance") return false;
  const before = energyMax(s);
  s.freelance.home += 1;
  s.energy = Math.min(h.energyMax, s.energy + h.energyMax - before);
  remember(s, "lien", h.souvenir, false);
  acted(s);
  return true;
}
```

Dans `finances.ts`, remplacer `HOMES[f.home].rent` par `currentHome(s).rent` (importer `currentHome` depuis `./logement`, retirer `HOMES` de l'import s'il ne sert plus).

Dans `revelations.ts`, importer `HOMES` et `homeWorthIt` (depuis `./logement`), et ajouter EN TÊTE du repère `// [offres]` :

```ts
  ...HOMES.slice(1).map((h, k): FlReveal => ({ id: `home_${h.id}`, kind: "jeu", ready: (s) => homeWorthIt(s, k + 1) })),
```

Dans `index.ts` : `export * from "./logement";`.

- [ ] **Step 4 : lancer les tests**

Run: `node_modules/.bin/vitest run tests/freelance.test.ts`
Expected: PASS.

- [ ] **Step 5 : commit**

```bash
git add src/engine/freelance tests/freelance.test.ts
git commit -m "feat(freelance): le logement, son loyer et l'énergie maximale

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: La vie (repas, repas livrés, amis, Maman, sorties)

**Files:**
- Create: `src/engine/freelance/vie.ts`
- Modify: `tick.ts` (`// [nouveau jour]`, `// [lundi]`, `// [mercredi]`, `// [jeudi]`, `// [vendredi]`, `// [samedi]`, `// [dimanche]`, `// [chaque tick]`), `revelations.ts` (`// [instants]`, `// [offres]` après les outils), `index.ts`
- Modify: `src/engine/content/audience.ts:43-48` (les liens perdus comptent dans le Sens)
- Test: `tests/freelance.test.ts` (section « la vie »)

**Interfaces:**
- Consumes : `energyMax`, `currentHome`, `spend`, `remember`, `secsLeftToday`, `handsFree`, `dayIndex`, `weekNumber`.
- Produces : `tickEnergy(s, t)`, `lifeNewDay(s)`, `restPerMin(s)`, `canEat(s)`, `eat(s)`, `deliveryOffered(s)`, `acceptDelivery(s)`, `startDinner(s)`, `endDinner(s)`, `canGoToDinner(s)`, `goToDinner(s)`, `startSunday(s)`, `endSunday(s)`, `canAnswerMaman(s)`, `answerMaman(s)`, `mamanIAOffered(s)`, `acceptMamanIA(s)`, `startOuting(s)`, `endOuting(s)`, `currentOuting(s)`, `canGoOut(s)`, `goOut(s)`.

Règles (spec v1, v2) :
- L'énergie remonte de 0,3 / s jusqu'au maximum du logement. « Se faire à manger » : deux fois par jour, +10 (+15 dès le T1).
- Après 30 repas faits à la main, « Se faire livrer les repas du midi » : un repas par jour, 11 € payés à la commande, l'énergie monte seule. C'est une corvée déléguée : point neutre, pas d'effet sur le Sens.
- Le vendredi, à partir de la deuxième semaine, Sam, Inès et Léo t'invitent. Y aller occupe les mains jusqu'à samedi (+40). Trois dîners manqués d'affilée : ils n'invitent plus (un lien perdu, Sens −7 comme un lien délégué).
- Le dimanche, Maman appelle. Décrocher occupe les mains jusqu'à lundi et remplit l'énergie. Non décroché : un message vocal. Une fois l'IA de ta boîte mail prise, « Laisser l'IA répondre aux messages de Maman » (gratuit) : les dimanches redeviennent travaillés, le lien est délégué (Sens).
- Un mercredi sur deux (semaines paires), une sortie (cinéma, puis restaurant) : payée, jusqu'au lendemain, +30. La manquer ne coûte rien.

- [ ] **Step 1 : écrire les tests (ils échouent)**

```ts
import {
  tickEnergy, eat, canEat, deliveryOffered, acceptDelivery, restPerMin, goToDinner, canGoToDinner,
  answerMaman, canAnswerMaman, mamanIAOffered, acceptMamanIA, goOut, canGoOut, canWork as canWorkNow,
} from "../src/engine/freelance";
import { MEALS_BEFORE_DELIVERY, MEAL_PRICE, FL_DAY_SECS, FRIENDS_MAX_MISSES, DINNER_ENERGY, SUNDAY, FRIDAY } from "../src/engine/content/freelance";
import { computeInitialSens } from "../src/engine/content/audience";

/** Avance jusqu'au début du jour `wd` (0 = lundi) de la semaine `week` (1 = la première). */
function goTo(s: GameState, week: number, wd: number): void {
  run(s, ((week - 1) * 7 + wd) * FL_DAY_SECS + 0.05 - s.freelance.day, 0.25);
}

describe("chapitre 2 : la vie", () => {
  it("l'énergie remonte jusqu'au maximum du logement, pas au-delà", () => {
    const s = fresh();
    s.energy = 99.9;
    tickEnergy(s, 10);
    expect(s.energy).toBe(100);
  });

  it("deux repas par jour ; après 30 repas, les repas livrés se proposent", () => {
    const s = fresh();
    s.energy = 50;
    expect(eat(s)).toBe(true);
    expect(eat(s)).toBe(true);
    expect(canEat(s)).toBe(false);
    s.freelance.mealsCooked = MEALS_BEFORE_DELIVERY;
    run(s, 1);
    expect(deliveryOffered(s)).toBe(true);
  });

  it("un repas livré par jour : 11 €, l'énergie monte seule ; le repos se lit en énergie par minute", () => {
    const s = fresh();
    s.freelance.revealed["livraison"] = 0;
    acceptDelivery(s);
    s.energy = 10;
    run(s, FL_DAY_SECS);
    expect(s.freelance.ledger.repas).toBe(MEAL_PRICE);
    expect(s.money.toNumber()).toBe(-MEAL_PRICE);
    expect(restPerMin(s)).toBe(58); // 0,3 × 60 + 10 × 4 jours par minute
    s.freelance.home = 2;
    expect(restPerMin(s)).toBe(78);
  });

  it("le dîner du vendredi occupe les mains jusqu'à samedi et recharge", () => {
    const s = fresh();
    goTo(s, 2, FRIDAY);
    expect(canGoToDinner(s)).toBe(true);
    s.energy = 30;
    goToDinner(s);
    expect(s.energy).toBe(30 + DINNER_ENERGY);
    expect(canWorkNow(s)).toBe(false);
    goTo(s, 2, FRIDAY + 1);
    expect(canWorkNow(s)).toBe(true);
    expect(s.souvenirs[0].text).toBe("Tu as dîné avec Sam, Inès et Léo.");
  });

  it("trois dîners manqués d'affilée : les amis n'invitent plus, et le Sens le sent", () => {
    const s = fresh();
    const sensBefore = computeInitialSens(s);
    goTo(s, 2 + FRIENDS_MAX_MISSES, 0);
    expect(s.freelance.friends).toBe(false);
    expect(s.freelance.liensPerdus).toBe(1);
    expect(s.souvenirs.map((m) => m.text)).toContain("Sam, Inès et Léo ne t'invitent plus le vendredi.");
    expect(s.souvenirs.find((m) => m.text === "Tes amis ont dîné sans toi.")!.day).toBe("Vendredi");
    expect(computeInitialSens(s)).toBeLessThan(sensBefore);
  });

  it("Maman appelle le dimanche : décrocher remplit l'énergie et bloque jusqu'à lundi ; sinon, un message vocal", () => {
    const s = fresh();
    goTo(s, 1, SUNDAY);
    expect(canAnswerMaman(s)).toBe(true);
    s.energy = 20;
    answerMaman(s);
    expect(s.energy).toBe(100);
    expect(canWorkNow(s)).toBe(false);
    goTo(s, 2, SUNDAY);
    goTo(s, 3, 0);
    const vocal = s.souvenirs.find((m) => m.text === "Maman a laissé un message vocal.")!;
    expect(vocal.missed).toBe(true);
    expect(vocal.day).toBe("Dimanche");
  });

  it("avec l'IA de ta boîte mail, l'IA peut répondre à Maman : un lien délégué", () => {
    const s = fresh();
    s.freelance.subs.ia_mail = 10;
    goTo(s, 1, SUNDAY);
    run(s, 1);
    expect(mamanIAOffered(s)).toBe(true);
    acceptMamanIA(s);
    expect(s.vieAutomatiseeCount).toBe(1);
    goTo(s, 2, SUNDAY);
    expect(canAnswerMaman(s)).toBe(false);
    expect(s.souvenirs[0].text).toBe("Le répondeur IA a répondu à Maman.");
  });

  it("un mercredi sur deux, une sortie payée", () => {
    const s = fresh();
    goTo(s, 1, 2);
    expect(canGoOut(s)).toBe(false);
    goTo(s, 2, 2);
    expect(canGoOut(s)).toBe(true);
    goOut(s);
    expect(s.freelance.ledger.sorties).toBe(12);
    expect(s.freelance.outings).toBe(1);
  });
});
```

- [ ] **Step 2 : lancer les tests**

Run: `node_modules/.bin/vitest run tests/freelance.test.ts`
Expected: FAIL.

- [ ] **Step 3 : écrire le code**

`src/engine/freelance/vie.ts` :

```ts
import type { GameState } from "../state";
import {
  FL_ENERGY_REGEN,
  FL_DAY_SECS,
  MEALS_PER_DAY,
  MEAL_PRICE,
  DINNER_ENERGY,
  FIRST_DINNER_DAY,
  FRIENDS_MAX_MISSES,
  OUTING_ENERGY,
  OUTINGS,
  MAMAN_LINES,
  DAY_NAMES,
  FRIDAY,
  SUNDAY,
  TEXTES,
} from "../content/freelance";
import { handsFree, remember, secsLeftToday, dayIndex, weekNumber } from "./commun";
import { spend } from "./finances";
import { energyMax, currentHome } from "./logement";
import { isRevealed, acted } from "./revelations";

// La vie : l'énergie ne sert qu'à tes mains. Tu manges, tu dînes avec tes amis, Maman appelle le dimanche.
// Déléguer une corvée (les repas) est neutre ; déléguer un lien (Maman) ou le perdre (les amis) creuse le Sens.

export function tickEnergy(s: GameState, t: number): void {
  s.energy = Math.min(energyMax(s), s.energy + FL_ENERGY_REGEN * t);
}

/** Chaque matin : les repas du jour, et le repas livré s'il y en a un. */
export function lifeNewDay(s: GameState): void {
  const f = s.freelance;
  f.mealsToday = 0;
  if (f.delivery) {
    s.energy = Math.min(energyMax(s), s.energy + currentHome(s).meal);
    spend(s, MEAL_PRICE, "repas");
    f.ledger.repasCount += 1;
  }
}

/** « Ton repos : +N énergie / min », comme « Le lave-vaisselle te rapporte » au plongeur. */
export function restPerMin(s: GameState): number {
  const meals = s.freelance.delivery ? (currentHome(s).meal * 60) / FL_DAY_SECS : 0;
  return Math.round(FL_ENERGY_REGEN * 60 + meals);
}

// --- Les repas ---

export function canEat(s: GameState): boolean {
  return s.job === "freelance" && handsFree(s) && s.freelance.mealsToday < MEALS_PER_DAY && s.energy < energyMax(s);
}
export function eat(s: GameState): boolean {
  if (!canEat(s)) return false;
  s.energy = Math.min(energyMax(s), s.energy + currentHome(s).meal);
  s.freelance.mealsToday += 1;
  s.freelance.mealsCooked += 1;
  acted(s);
  return true;
}
export const deliveryOffered = (s: GameState): boolean => isRevealed(s, "livraison") && !s.freelance.delivery;
export function acceptDelivery(s: GameState): boolean {
  if (!deliveryOffered(s)) return false;
  s.freelance.delivery = true;
  acted(s);
  return true;
}

// --- Les amis, le vendredi ---

export function startDinner(s: GameState): void {
  const f = s.freelance;
  if (!f.friends || dayIndex(s) < FIRST_DINNER_DAY) return;
  f.dinnerOpen = true;
  f.dinnerInvites += 1;
}
/** Samedi matin : le dîner d'hier a eu lieu sans toi. */
export function endDinner(s: GameState): void {
  const f = s.freelance;
  if (!f.dinnerOpen) return;
  f.dinnerOpen = false;
  f.friendsMissed += 1;
  remember(s, "lien", TEXTES.dinnerMissed, true, DAY_NAMES[FRIDAY]);
  if (f.friendsMissed >= FRIENDS_MAX_MISSES) {
    f.friends = false;
    f.liensPerdus += 1;
    remember(s, "lien", TEXTES.friendsGone, true, DAY_NAMES[FRIDAY]);
  }
}
export const canGoToDinner = (s: GameState): boolean => s.freelance.dinnerOpen && handsFree(s);
export function goToDinner(s: GameState): boolean {
  if (!canGoToDinner(s)) return false;
  const f = s.freelance;
  f.dinnerOpen = false;
  f.busy = secsLeftToday(s);
  f.busyWhy = "diner";
  s.energy = Math.min(energyMax(s), s.energy + DINNER_ENERGY);
  f.dinners += 1;
  f.friendsMissed = 0;
  remember(s, "lien", TEXTES.dinnerWent, false);
  acted(s);
  return true;
}

// --- Maman, le dimanche ---

export function startSunday(s: GameState): void {
  const f = s.freelance;
  if (f.mamanIA) {
    remember(s, "lien", TEXTES.mamanByAI, true);
    return;
  }
  f.mamanRing = true;
  f.mamanRings += 1;
}
/** Lundi matin : un appel resté sans réponse laisse un message vocal (daté du dimanche). */
export function endSunday(s: GameState): void {
  const f = s.freelance;
  if (!f.mamanRing) return;
  f.mamanRing = false;
  remember(s, "lien", TEXTES.mamanMissed, true, DAY_NAMES[SUNDAY]);
}
export const canAnswerMaman = (s: GameState): boolean => s.freelance.mamanRing && handsFree(s);
export function answerMaman(s: GameState): boolean {
  if (!canAnswerMaman(s)) return false;
  const f = s.freelance;
  f.mamanRing = false;
  f.mamanCalls += 1;
  f.busy = secsLeftToday(s);
  f.busyWhy = "maman";
  s.energy = energyMax(s);
  remember(s, "lien", MAMAN_LINES[(f.mamanCalls - 1) % MAMAN_LINES.length], false);
  acted(s);
  return true;
}
export const mamanIAOffered = (s: GameState): boolean =>
  isRevealed(s, "maman_ia") && !s.freelance.mamanIA && s.freelance.mamanRing;
/** L'IA répond à Maman à ta place : gratuit, célébré, jamais commenté. Le lien est délégué. */
export function acceptMamanIA(s: GameState): boolean {
  if (!mamanIAOffered(s)) return false;
  const f = s.freelance;
  f.mamanIA = true;
  f.mamanRing = false;
  s.vieAutomatiseeCount += 1;
  remember(s, "lien", TEXTES.mamanByAI, true);
  acted(s);
  return true;
}

// --- Les sorties, un mercredi sur deux ---

export function startOuting(s: GameState): void {
  if (weekNumber(s) % 2 === 0) s.freelance.outingOpen = true;
}
export function endOuting(s: GameState): void {
  s.freelance.outingOpen = false;
}
export const currentOuting = (s: GameState): (typeof OUTINGS)[number] => OUTINGS[s.freelance.outings % OUTINGS.length];
export const canGoOut = (s: GameState): boolean => s.freelance.outingOpen && handsFree(s);
export function goOut(s: GameState): boolean {
  if (!canGoOut(s)) return false;
  const f = s.freelance;
  const o = currentOuting(s);
  spend(s, o.price, "sorties");
  f.outingOpen = false;
  f.busy = secsLeftToday(s);
  f.busyWhy = "sortie";
  s.energy = Math.min(energyMax(s), s.energy + OUTING_ENERGY);
  f.outings += 1;
  remember(s, "contemplation", o.souvenir, false);
  acted(s);
  return true;
}
```

Dans `tick.ts`, importer depuis `./vie` : `tickEnergy, lifeNewDay, startDinner, endDinner, startSunday, endSunday, startOuting, endOuting`. Insérer :
- sous `// [nouveau jour]` : `lifeNewDay(s);`
- sous `// [lundi]`, en toute première ligne (avant `mondayMorning`) : `endSunday(s); // l'appel d'hier, décroché ou non`
- sous `// [mercredi]` : `startOuting(s);`
- sous `// [jeudi]` : `endOuting(s);`
- sous `// [vendredi]` : `startDinner(s);`
- sous `// [samedi]` : `endDinner(s);`
- sous `// [dimanche]` : `startSunday(s);`
- sous `// [chaque tick]`, en tête : `tickEnergy(s, t);`

Dans `revelations.ts`, importer `MEALS_BEFORE_DELIVERY` et ajouter :
- sous `// [instants]` : `{ id: "maman_ia", kind: "jeu", ready: (s) => s.freelance.mamanRing && s.freelance.subs.ia_mail !== undefined },`
- sous `// [offres]`, après les outils : `{ id: "livraison", kind: "jeu", ready: (s) => !s.freelance.delivery && s.freelance.mealsCooked >= MEALS_BEFORE_DELIVERY },`

Dans `src/engine/content/audience.ts`, dans `computeInitialSens`, remplacer la ligne `const automated = …` par :

```ts
  // Un lien délégué (l'IA répond à Maman) ou perdu par négligence (les amis qui n'invitent plus) : même effet.
  const automated = SENS_PER_AUTOMATION * (s.vieAutomatiseeCount + (s.freelance?.liensPerdus ?? 0));
```

Dans `index.ts` : `export * from "./vie";`.

- [ ] **Step 4 : lancer les tests**

Run: `node_modules/.bin/vitest run`
Expected: toute la suite PASS.

- [ ] **Step 5 : commit**

```bash
git add src/engine/freelance src/engine/content/audience.ts tests/freelance.test.ts
git commit -m "feat(freelance): la vie, les repas, les amis du vendredi et Maman le dimanche

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Le compromis (le test qui échoue) et ce que disent les clients

**Files:**
- Create: `src/engine/freelance/compromis.ts`
- Modify: `carnet.ts` (`// [tests rouges]`), `tick.ts` (`// [lundi]`), `revelations.ts` (`// [interface]`), `index.ts`
- Test: `tests/freelance.test.ts` (section « le compromis »)

**Interfaces:**
- Produces : `compromisVisible(s): boolean`, `takeCompromis(s): boolean`.

Règle (spec v1, v3) : avec les tests, une livraison sur trois bute sur un test rouge. Il passe juste après la tâche en cours, avant les autres bugs, et se corrige en 10 clics : rien ne bloque. Au premier test rouge paraît « Désactiver le test qui échoue » : gratuit, irréversible ; plus aucun test rouge, et les commandes suivantes ont 20 % de lignes en moins. Le coût tombe sur les clients, jamais sur toi : le lundi suivant, la ligne du haut dit « Mme Duval : « J'ai perdu deux commandes de gâteaux ce week-end. Je ne sais pas pourquoi. » ».

- [ ] **Step 1 : écrire les tests (ils échouent)**

```ts
import { compromisVisible, takeCompromis } from "../src/engine/freelance";
import { RED_EVERY, COMPROMIS_LINES } from "../src/engine/content/freelance";

describe("chapitre 2 : le compromis", () => {
  function withTests(): GameState {
    const s = invoiced();
    s.freelance.tests = true;
    return s;
  }
  function finishFirst(s: GameState): void {
    s.freelance.orders[0].done = s.freelance.orders[0].lines - 1;
    workClick(s);
  }

  it("une livraison sur trois bute sur un test rouge, qui passe juste après la tâche en cours", () => {
    const s = withTests();
    addOrder(s, "vitrine");
    addOrder(s, "vitrine");
    finishFirst(s);
    finishFirst(s);
    expect(s.freelance.reds).toBe(RED_EVERY - 1); // deux livraisons vérifiées, passées
    addOrder(s, "vitrine");
    s.freelance.bugs.push({ id: 900, site: null, order: null, clicks: 0, text: "en cours" }, { id: 901, site: null, order: null, clicks: 0, text: "suivant" });
    s.freelance.orders[0].done = s.freelance.orders[0].lines;
    s.freelance.aiRate = 1;
    aiWrite(s, 0.001); // l'IA finit la commande (les bugs ne la regardent pas) : elle part en livraison
    expect(s.freelance.orders[0].red).toBe("failing");
    expect(s.freelance.bugs.map((b) => b.text)).toEqual(["en cours", "Un test échoue.", "suivant"]);
    expect(compromisVisible(s)).toBe(true);
  });

  it("désactiver le test : la commande part, plus de test rouge, 20 % de lignes en moins ensuite, et Mme Duval perd des commandes", () => {
    const s = withTests();
    s.freelance.reds = RED_EVERY - 1;
    addOrder(s, "vitrine");
    finishFirst(s);
    expect(s.freelance.orders[0].red).toBe("failing");
    const money = s.money.toNumber();
    expect(takeCompromis(s)).toBe(true);
    expect(s.freelance.orders).toHaveLength(0);
    expect(s.money.toNumber()).toBe(money + 600);
    expect(s.freelance.bugs).toHaveLength(0);
    expect(addOrder(s, "appli").lines).toBe(Math.round(4000 * COMPROMIS_LINES));
    expect(compromisVisible(s)).toBe(false);
    run(s, FL_WEEK_SECS);
    expect(s.freelance.quote).toBe("gateaux");
  });

  it("refusé, le test rouge se corrige en 10 clics et la commande part", () => {
    const s = withTests();
    s.freelance.reds = RED_EVERY - 1;
    addOrder(s, "vitrine");
    finishFirst(s);
    s.energy = 100;
    for (let i = 0; i < BUG_CLICKS; i++) workClick(s);
    expect(s.freelance.orders).toHaveLength(0);
    expect(compromisVisible(s)).toBe(true); // il reste proposé
  });
});
```

- [ ] **Step 2 : lancer les tests**

Run: `node_modules/.bin/vitest run tests/freelance.test.ts`
Expected: FAIL.

- [ ] **Step 3 : écrire le code**

Dans `carnet.ts`, importer `RED_EVERY` et `TEXTES` depuis le contenu et remplacer `// [tests rouges]` par :

```ts
    // Avec les tests, une livraison sur trois bute sur un test rouge (tant qu'on ne l'a pas désactivé).
    if (f.tests && o.red === "none" && f.compromis !== "taken") {
      f.reds += 1;
      if (f.reds % RED_EVERY === 0) {
        o.red = "failing";
        f.bugs.splice(f.bugs.length > 0 ? 1 : 0, 0, { id: f.nextId++, site: null, order: o.id, clicks: 0, text: TEXTES.redText });
        if (f.compromis === "none") f.compromis = "offered";
        return;
      }
      o.red = "passed";
    }
```

`src/engine/freelance/compromis.ts` :

```ts
import type { GameState } from "../state";
import { COMPROMIS_LINES } from "../content/freelance";
import { deliverReady } from "./carnet";
import { acted } from "./revelations";

// Le compromis du chapitre 2 : désactiver le test qui échoue. Gratuit, rentable, jamais obligatoire.
// Le coût tombe sur les clients de tes clients ; tu ne l'apprends que par la ligne du haut.

export const compromisVisible = (s: GameState): boolean => s.job === "freelance" && s.freelance.compromis === "offered";

export function takeCompromis(s: GameState): boolean {
  if (!compromisVisible(s)) return false;
  const f = s.freelance;
  f.compromis = "taken";
  f.compMult = COMPROMIS_LINES;
  f.bugs = f.bugs.filter((b) => b.order === null);
  for (const o of f.orders) if (o.red === "failing") o.red = "passed";
  f.compromisQuoteDue = true;
  deliverReady(s);
  acted(s);
  return true;
}
```

Dans `tick.ts`, sous `// [lundi]`, à la fin du bloc :

```ts
  if (s.freelance.compromisQuoteDue) {
    s.freelance.compromisQuoteDue = false;
    s.freelance.quote = "gateaux"; // un week-end de pages blanches chez Mme Duval
  }
```

Dans `revelations.ts`, sous `// [interface]` : `{ id: "compromis", kind: "geste", ready: (s) => s.freelance.compromis !== "none" },`.

Dans `index.ts` : `export * from "./compromis";`.

- [ ] **Step 4 : lancer les tests**

Run: `node_modules/.bin/vitest run tests/freelance.test.ts`
Expected: PASS.

- [ ] **Step 5 : commit**

```bash
git add src/engine/freelance tests/freelance.test.ts
git commit -m "feat(freelance): le test qui échoue, et ce qu'en dit Mme Duval

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: La sortie (embaucher Nora en alternance)

**Files:**
- Create: `src/engine/freelance/sortie.ts`
- Modify: `tick.ts` (`// [chaque tick]`), `revelations.ts` (`// [fin]`), `index.ts`
- Test: `tests/freelance.test.ts` (section « la sortie »)

**Interfaces:**
- Consumes : `bugsLast7Days`, `fixBug`, `weekday`.
- Produces : `exitReady(s): boolean`, `noraOffered(s): boolean`, `hireNora(s): boolean`, `tickNora(s, t)`.

Règle (spec v3, v4, v5) : « Embaucher Nora en alternance » se propose quand 12 bugs sont arrivés en 7 jours (ou 12 attendent), l'IA de ta boîte mail est prise, l'IA a déjà été proposée pour Maman, et le compromis a paru (v4 : ils doivent précéder Nora). 600 € chaque lundi en charges pro ; elle corrige 3 bugs par jour ouvré, jamais le week-end ; elle prend les bugs par la fin de la file (ta tâche en cours reste à toi). Elle ne se fatigue pas. Le texte parle des commandes qui s'empilent (v5).

- [ ] **Step 1 : écrire les tests (ils échouent)**

```ts
import { exitReady, noraOffered, hireNora } from "../src/engine/freelance";
import { EXIT_BUGS } from "../src/engine/content/freelance";

describe("chapitre 2 : la sortie", () => {
  function almostDone(): GameState {
    const s = invoiced();
    const f = s.freelance;
    f.bugArrivals = Array(EXIT_BUGS).fill(0);
    f.subs.ia_mail = 10;
    f.revealed.maman_ia = 0;
    f.compromis = "offered";
    f.lastNovelty = -1000;
    return s;
  }

  it("attend 12 bugs en 7 jours, l'IA de la boîte mail, l'IA pour Maman et le compromis", () => {
    const s = almostDone();
    expect(exitReady(s)).toBe(true);
    s.freelance.compromis = "none";
    expect(exitReady(s)).toBe(false);
    s.freelance.compromis = "taken";
    delete s.freelance.revealed.maman_ia;
    expect(exitReady(s)).toBe(false);
  });

  it("Nora se propose, se paie chaque lundi et corrige 3 bugs par jour ouvré, par la fin de la file", () => {
    const s = almostDone();
    s.freelance.bugArrivals = [];
    const total = EXIT_BUGS * 3; // assez pour qu'il en reste le week-end
    for (let i = 0; i < total; i++) s.freelance.bugs.push({ id: 1000 + i, site: null, order: null, clicks: 0, text: `b${i}` });
    run(s, 0.1);
    expect(noraOffered(s)).toBe(true);
    expect(hireNora(s)).toBe(true);
    run(s, FL_DAY_SECS); // le lundi
    const fixed = total - s.freelance.bugs.length;
    expect(fixed).toBeGreaterThanOrEqual(3);
    expect(fixed).toBeLessThanOrEqual(4);
    expect(s.freelance.bugs[0].text).toBe("b0"); // ta tâche en cours reste à toi
    goTo(s, 1, 5); // samedi
    const saturday = s.freelance.bugs.length;
    goTo(s, 1, 6); // dimanche : elle ne travaille pas le week-end
    expect(s.freelance.bugs.length).toBe(saturday);
    goTo(s, 2, 0);
    expect(s.freelance.ledger.salaires).toBe(600);
  });
});
```

- [ ] **Step 2 : lancer les tests**

Run: `node_modules/.bin/vitest run tests/freelance.test.ts`
Expected: FAIL.

- [ ] **Step 3 : écrire le code**

`src/engine/freelance/sortie.ts` :

```ts
import type { GameState } from "../state";
import { EXIT_BUGS, NORA_BUGS_PER_DAY, FL_DAY_SECS, FRIDAY } from "../content/freelance";
import { bugsLast7Days, fixBug } from "./carnet";
import { weekday } from "./commun";
import { isRevealed, acted } from "./revelations";

// La sortie du chapitre 2 : la première embauche. Nora corrige les bugs à ta place, du lundi au vendredi.

export function exitReady(s: GameState): boolean {
  const f = s.freelance;
  if (f.nora) return false;
  const bugs = Math.max(bugsLast7Days(s), f.bugs.length);
  return bugs >= EXIT_BUGS && f.subs.ia_mail !== undefined && isRevealed(s, "maman_ia") && f.compromis !== "none";
}

export const noraOffered = (s: GameState): boolean => s.job === "freelance" && isRevealed(s, "nora") && !s.freelance.nora;

/** Embaucher Nora : rien à payer tout de suite ; 600 € chaque lundi, même en négatif (elle ne part jamais). */
export function hireNora(s: GameState): boolean {
  if (!noraOffered(s)) return false;
  s.freelance.nora = true;
  acted(s);
  return true;
}

/** Nora corrige, du lundi au vendredi, trois bugs par jour ; elle prend la file par la fin. */
export function tickNora(s: GameState, t: number): void {
  const f = s.freelance;
  if (!f.nora || weekday(s) > FRIDAY) return;
  f.noraAcc += (t * NORA_BUGS_PER_DAY) / FL_DAY_SECS;
  while (f.noraAcc >= 1 && f.bugs.length > 0) {
    fixBug(s, f.bugs.length > 1 ? f.bugs[f.bugs.length - 1] : f.bugs[0]);
    f.noraAcc -= 1;
  }
  if (f.bugs.length === 0) f.noraAcc = Math.min(f.noraAcc, 1); // elle ne met pas de bugs de côté
}
```

Dans `tick.ts`, importer `tickNora` et, sous `// [chaque tick]` après `aiWrite(s, t);` : `tickNora(s, t);`.

Dans `revelations.ts`, importer `exitReady` depuis `./sortie` et ajouter sous `// [fin]` : `{ id: "nora", kind: "jeu", ready: (s) => exitReady(s) },`.

Dans `index.ts` : `export * from "./sortie";`.

- [ ] **Step 4 : lancer les tests**

Run: `node_modules/.bin/vitest run tests/freelance.test.ts`
Expected: PASS.

- [ ] **Step 5 : commit**

```bash
git add src/engine/freelance tests/freelance.test.ts
git commit -m "feat(freelance): la sortie, Nora en alternance

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 14: Les paliers d'interface et les blocs d'écran (vue.ts)

**Files:**
- Create: `src/engine/freelance/vue.ts`
- Modify: `src/engine/freelance/revelations.ts` (`// [interface]`), `src/engine/content/freelance.ts` (quelques textes de plus), `index.ts`
- Test: `tests/freelance.test.ts` (section « l'écran »)

**Interfaces:**
- Consumes : tout ce qui précède.
- Produces (chaque fonction rend `null` quand son bloc est caché) :
  - `interface Bouton { label: string; price?: string; lines: string[]; disabled: boolean; act: () => void }`
  - `vuePaliers(s): { couleur; etiquettes; ombre; verre; menu: boolean }`
  - `vueMenu(s): string[] | null`
  - `vueMarque(s): { name: string; logo: number; initial: string } | null`
  - `vueEntete(s): { quote: string; money: string; monday: string | null; when: string }`
  - `vueCarnet(s): VueCarnet` (tâche en cours, bouton, « Ensuite », carte de la micro-entreprise)
  - `vueAmeliorations(s)`, `vueClients(s)`, `vueTopClients(s)`, `vueSansToi(s)`, `vueVie(s)`, `vueRendezVous(s)`, `vueSemaine(s)`, `vueGagne(s)`, `vueFinances(s)`, `vueSortie(s)`, `vueFin(s)`, `vueSouvenirs(s, n)`

Les paliers (spec v5, décision d'Alexandre : l'hybride) : la chambre apporte la couleur (Ta vie et le fond), la licence d'éditeur colore les étiquettes du carnet, le T1 l'ombre portée et la typographie définitive, le deux-pièces le verre dépoli et l'image du logement. Le menu arrive une seule fois, avec ses quatre entrées, 35 s au moins après « Ce qui travaille sans toi ». Les sous-titres ne parlent jamais de ces changements : ils restent sur la statistique qui change.

- [ ] **Step 1 : ajouter les textes et les paliers**

Dans `TEXTES` (`content/freelance.ts`), ajouter :

```ts
  ageWhen: (age: number, when: string) => `${age} ans. ${when}`,
  outingTitle: "Ce soir, tu es libre.",
  aiState: (n: number) => `${n} lignes / s, même sans toi`,
  aiHint: "Les bugs restent à toi.",
  mailState: "Répond à tes clients le soir",
  mailHint: "+1 appli et +1 boutique par semaine.",
  testsState: "Deux fois moins de bugs",
  testsHint: "Une livraison sur trois bute sur un test rouge.",
  noraName: "Nora, en alternance",
  signed: (e: string, n: number) => (n >= 0 ? `+${e}` : e),
```

Dans `revelations.ts`, importer `currentHome, energyMax` depuis `./logement` et ajouter sous `// [interface]`, AVANT la ligne `compromis` déjà présente :

```ts
  { id: "repas", kind: "jeu", ready: (s) => s.energy <= energyMax(s) - currentHome(s).meal }, // « Se faire à manger », à la première fatigue
  { id: "semaine", kind: "geste", ready: (s) => s.freelance.proposals.entretien_duval !== undefined }, // la ligne du lundi, la semaine
  { id: "ensuite", kind: "jeu", ready: (s) => s.freelance.orders.length + s.freelance.bugs.length >= 2 },
  { id: "couleur", kind: "geste", ready: (s) => s.freelance.home >= 1 }, // la chambre
  { id: "etiquettes", kind: "geste", ready: (s) => s.freelance.tools.editeur !== undefined }, // un éditeur colore le code
  { id: "repos", kind: "geste", ready: (s) => s.freelance.delivery }, // « Ton repos : +N énergie / min »
  { id: "cette_semaine", kind: "jeu", ready: (s) => Object.keys(s.freelance.subs).length > 0 },
  { id: "ombre", kind: "geste", ready: (s) => s.freelance.home >= 2 }, // le T1
  { id: "clients", kind: "geste", ready: (s) => s.freelance.maintAll },
  { id: "ratios", kind: "jeu", ready: (s) => s.freelance.dinnerInvites > s.freelance.dinners + (s.freelance.dinnerOpen ? 1 : 0) }, // au premier dîner manqué
  { id: "verre", kind: "geste", ready: (s) => s.freelance.home >= 3 }, // le deux-pièces
  { id: "sans_toi", kind: "geste", ready: (s) => s.freelance.aiRate > 0 },
  { id: "menu", kind: "jeu", ready: (s) => isRevealed(s, "sans_toi") },
  { id: "d_ici_lundi", kind: "geste", ready: (s) => s.freelance.evening },
  { id: "top_clients", kind: "geste", ready: (s) => s.freelance.proposals.recommander !== undefined },
```

- [ ] **Step 2 : écrire les tests (ils échouent)**

Les aides `fresh`, `run`, `invoiced` (tâche 6) et `goTo` (tâche 11), et les imports `workClick`, `addOrder`, `addSite`, `acted`, `DUVAL`, `FRIDAY` sont déjà en tête de `tests/freelance.test.ts`.

```ts
import {
  vuePaliers, vueMenu, vueEntete, vueCarnet, vueVie, vueSortie, vueRendezVous, vueSemaine, vueMarque,
} from "../src/engine/freelance";

describe("chapitre 2 : l'écran", () => {
  it("à l'arrivée : pas de couleur, pas de menu, le logement en une ligne, un seul bouton", () => {
    const s = fresh();
    expect(vuePaliers(s)).toEqual({ couleur: false, etiquettes: false, ombre: false, verre: false, menu: false });
    expect(vueMenu(s)).toBeNull();
    expect(vueEntete(s)).toMatchObject({ quote: "Mme Duval : « Mon neveu devait le faire, mais il est parti à Lyon. »", money: "0 €", monday: null, when: "Lundi" });
    expect(vueVie(s)!.logement).toBe("Logement : le canapé convertible de Sam.");
    expect(vueVie(s)!.home).toBeNull();
    const c = vueCarnet(s);
    expect(c.task.title).toBe("Site vitrine pour la Boulangerie Duval");
    expect(c.work.label).toBe("Écrire du code : 5 lignes");
    expect(c.next).toBeNull();
    expect(c.invoice).toBeNull();
  });

  it("le site prêt, la carte de la micro-entreprise remplace la livraison", () => {
    const s = fresh();
    s.freelance.orders[0].done = s.freelance.orders[0].lines - 1;
    workClick(s);
    const c = vueCarnet(s);
    expect(c.invoice).toMatchObject({ title: "Créer ta micro-entreprise", field: "Nom de ton entreprise", cta: "Créer et facturer Mme Duval : 600 €" });
    c.invoice!.create("Pixel", 3);
    expect(vueMarque(s)).toEqual({ name: "Pixel", logo: 3, initial: "P" });
    expect(vueCarnet(s).invoice).toBeNull();
  });

  it("la chambre colore, le T1 donne l'ombre, le deux-pièces le verre et l'image", () => {
    const s = fresh();
    s.freelance.home = 1;
    acted(s);
    expect(vuePaliers(s).couleur).toBe(true);
    s.freelance.home = 2;
    acted(s);
    expect(vuePaliers(s).ombre).toBe(true);
    s.freelance.home = 3;
    acted(s);
    expect(vuePaliers(s).verre).toBe(true);
    expect(vueVie(s)!.logement).toBeNull();
    expect(vueVie(s)!.home!.caption).toBe("Un deux-pièces avec un bureau");
  });

  it("le menu arrive d'un coup, 35 s après ce qui travaille sans toi", () => {
    const s = fresh();
    s.freelance.aiRate = 20;
    acted(s);
    run(s, 34);
    expect(vueMenu(s)).toBeNull();
    run(s, 2);
    expect(vueMenu(s)).toEqual(["Tableau de bord", "Pro", "Perso", "Finances"]);
  });

  it("la ligne du lundi et « Cette semaine » disent les vrais montants", () => {
    const s = invoiced();
    s.freelance.revealed.semaine = 0;
    s.freelance.revealed.cette_semaine = 0;
    addSite(s, DUVAL.name, "vitrine", 1e9);
    s.freelance.home = 1;
    s.freelance.subs = { autocompletion: 5 };
    expect(vueEntete(s).monday).toBe("Chaque lundi : +50 € d'entretien, −110 € de loyer, −5 € d'abonnement");
    expect(vueEntete(s).when).toBe("Lundi, semaine 1");
    expect(vueSemaine(s)!.net).toBe("+600 €");
  });

  it("la bande de Nora parle des commandes qui s'empilent, avec le nom de ton entreprise", () => {
    const s = invoiced();
    s.freelance.revealed.nora = 0;
    s.freelance.bugArrivals = Array(12).fill(0);
    addOrder(s, "appli");
    addOrder(s, "boutique");
    const v = vueSortie(s)!;
    expect(v.title).toBe("Ces 7 derniers jours : 12 bugs arrivés.");
    expect(v.lines).toEqual(["Pendant que tu les corriges, 2 commandes attendent (4 300 €)."]);
    expect(v.buy.label).toBe("Embaucher Nora en alternance chez Pixel");
  });

  it("le vendredi, l'invitation des amis ; « D'ici lundi » une fois le travail du soir accepté", () => {
    const s = fresh();
    goTo(s, 2, FRIDAY);
    const r = vueRendezVous(s)!;
    expect(r.title).toBeNull();
    expect(r.items[0].title).toBe("Sam, Inès et Léo dînent ensemble ce soir.");
    s.freelance.evening = true;
    acted(s);
    expect(vueRendezVous(s)!.title).toBe("D'ici lundi");
  });
});
```

- [ ] **Step 3 : lancer les tests**

Run: `node_modules/.bin/vitest run tests/freelance.test.ts`
Expected: FAIL (`vue.ts` n'existe pas).

- [ ] **Step 4 : écrire `vue.ts`**

```ts
import type { GameState, FlBug, FlOrder, FlSite, FlLedger } from "../state";
import {
  KINDS,
  QUOTES,
  TEXTES,
  DUVAL,
  TOOL_BY_ID,
  NORA_SALARY,
  AGE_FREELANCE,
  COMPANY_DEFAULT_NAME,
  COMPANY_NAME_MAX,
  LOGO_COUNT,
  MEAL_PRICE,
  DINNER_ENERGY,
  OUTING_ENERGY,
  BUG_CLICKS,
} from "../content/freelance";
import { fmtEur, dayName, weekNumber, handsFree } from "./commun";
import { isRevealed } from "./revelations";
import {
  currentTask,
  clickLines,
  canWork,
  workClick,
  isTired,
  clientOf,
  maintenancePossible,
  bugsLast7Days,
  waitingValue,
} from "./carnet";
import { canCreateCompany, createCompany, companyInitial, companyName } from "./entreprise";
import { visibleProposals, acceptProposal } from "./demande";
import { toolOffered, canBuyTool, buyTool, ownedTools } from "./outils";
import { currentHome, energyMax, homeOffered, moveHome } from "./logement";
import {
  restPerMin,
  canEat,
  eat,
  deliveryOffered,
  acceptDelivery,
  canGoToDinner,
  goToDinner,
  canAnswerMaman,
  answerMaman,
  mamanIAOffered,
  acceptMamanIA,
  currentOuting,
  canGoOut,
  goOut,
} from "./vie";
import { compromisVisible, takeCompromis } from "./compromis";
import { noraOffered, hireNora } from "./sortie";
import { subsTotal, entrees, chargesPro, chargesPerso, net, canDeposit, depositAll, canWithdraw, withdrawAll } from "./finances";

// Ce que l'écran du chapitre 2 affiche, bloc par bloc. Chaque fonction rend null quand son bloc est caché.
// Freelance.svelte ne fait que mettre ces blocs en page, selon les paliers et l'onglet.

export interface Bouton {
  label: string;
  price?: string;
  lines: string[];
  disabled: boolean;
  act: () => void;
}
const bouton = (label: string, lines: string[], act: () => void, disabled = false, price?: string): Bouton => ({ label, lines, act, disabled, price });

// --- Les paliers, le menu, la marque ---

export interface VuePaliers {
  couleur: boolean;
  etiquettes: boolean;
  ombre: boolean;
  verre: boolean;
  menu: boolean;
}
export function vuePaliers(s: GameState): VuePaliers {
  return {
    couleur: isRevealed(s, "couleur"),
    etiquettes: isRevealed(s, "etiquettes"),
    ombre: isRevealed(s, "ombre"),
    verre: isRevealed(s, "verre"),
    menu: isRevealed(s, "menu"),
  };
}
export const vueMenu = (s: GameState): string[] | null => (isRevealed(s, "menu") ? TEXTES.tabs : null);
export function vueMarque(s: GameState): { name: string; logo: number; initial: string } | null {
  const c = s.freelance.company;
  return c ? { name: c.name, logo: c.logo, initial: companyInitial(c.name) } : null;
}

// --- L'en-tête ---

export interface VueEntete {
  quote: string;
  money: string;
  monday: string | null;
  when: string;
}
export function vueEntete(s: GameState): VueEntete {
  const f = s.freelance;
  const week = isRevealed(s, "semaine");
  const parts: string[] = [];
  if (week) {
    const possible = maintenancePossible(s);
    if (possible > 0) parts.push(TEXTES.mondayEntretien(fmtEur(possible)));
    const rent = currentHome(s).rent;
    if (rent > 0) parts.push(TEXTES.mondayRent(fmtEur(rent)));
    const subs = subsTotal(s);
    if (subs > 0) parts.push(TEXTES.mondaySubs(fmtEur(subs), Object.keys(f.subs).length));
    if (f.nora) parts.push(TEXTES.mondayNora(fmtEur(NORA_SALARY)));
  }
  return {
    quote: QUOTES[f.quote],
    money: fmtEur(s.money.toNumber()),
    monday: parts.length > 0 ? TEXTES.mondayLine(parts) : null,
    when: week ? TEXTES.dayWeek(dayName(s), weekNumber(s)) : dayName(s),
  };
}

// --- Le carnet ---

export interface VueTache {
  kind: "bug" | "red" | "order" | "empty";
  title: string;
  lines: string[];
  share: number | null;
  progress: string | null;
}
export interface VueLigne {
  tag: string;
  tagKind: "bug" | "red" | "order";
  client: string;
  detail: string;
  money: string;
  loss: boolean;
  dim: boolean;
}
export interface VueFacture {
  title: string;
  lines: string[];
  field: string;
  defaultName: string;
  maxLength: number;
  logos: string;
  logoCount: number;
  cta: string;
  create: (name: string, logo: number) => void;
}
export interface VueCarnet {
  title: string;
  count: string | null;
  invoice: VueFacture | null;
  task: VueTache;
  work: Bouton;
  next: VueLigne[] | null;
  more: string | null;
}

const orderOf = (s: GameState, id: number | null): FlOrder | undefined => s.freelance.orders.find((o) => o.id === id);
const siteOf = (s: GameState, id: number | null): FlSite | undefined => s.freelance.sites.find((x) => x.id === id);

function tacheBug(s: GameState, b: FlBug): VueTache {
  const progress = { share: b.clicks / BUG_CLICKS, progress: TEXTES.clicks(Math.floor(b.clicks)) };
  if (b.order !== null) {
    const o = orderOf(s, b.order);
    const c = clientOf(o?.client ?? "");
    return { kind: "red", title: TEXTES.redTitle(c.chez), lines: [TEXTES.redWhy(fmtEur(o ? KINDS[o.kind].price : 0))], ...progress };
  }
  const c = clientOf(siteOf(s, b.site)?.client ?? "");
  return { kind: "bug", title: TEXTES.bugTitle(c.chez), lines: [b.text, TEXTES.bugWhy(c.payer)], ...progress };
}
function tacheCommande(s: GameState, o: FlOrder): VueTache {
  const lines = [TEXTES.orderPrice(fmtEur(KINDS[o.kind].price))];
  if (s.freelance.aiRate > 0) lines.push(TEXTES.aiWithYou);
  return {
    kind: "order",
    title: TEXTES.orderTitle(KINDS[o.kind].label, clientOf(o.client).chez),
    lines,
    share: o.done / o.lines,
    progress: TEXTES.orderProgress(Math.floor(o.done), o.lines),
  };
}
function ligneBug(s: GameState, b: FlBug): VueLigne {
  if (b.order !== null) {
    const o = orderOf(s, b.order);
    return { tag: TEXTES.tagRed, tagKind: "red", client: clientOf(o?.client ?? "").name, detail: TEXTES.redText, money: TEXTES.blocked(fmtEur(o ? KINDS[o.kind].price : 0)), loss: true, dim: false };
  }
  const site = siteOf(s, b.site);
  return { tag: TEXTES.tagBug, tagKind: "bug", client: site?.client ?? "", detail: b.text, money: TEXTES.lossMonday(fmtEur(site?.fee ?? 0)), loss: true, dim: false };
}
function ligneCommande(o: FlOrder): VueLigne {
  const k = KINDS[o.kind];
  const detail = o.done > 0 ? TEXTES.orderDetail(k.label, Math.floor(o.done), o.lines) : TEXTES.orderWaiting(k.label);
  return { tag: TEXTES.tagOrder, tagKind: "order", client: o.client, detail, money: TEXTES.plusMoney(fmtEur(k.price)), loss: false, dim: o.done === 0 };
}
function boutonTravail(s: GameState): Bouton {
  const f = s.freelance;
  const task = currentTask(s);
  let label: string = TEXTES.nothing;
  if (!handsFree(s)) label = TEXTES.busy[f.busyWhy] ?? TEXTES.nothing;
  else if (task?.type === "bug") label = task.bug.order !== null ? TEXTES.fixRed : TEXTES.fixBug;
  else if (task) label = TEXTES.writeCode(clickLines(s)).replace(/(\d+)\.(\d)/, "$1,$2"); // « 2,5 lignes » quand tu es fatigué
  const lines = task && isTired(s) ? [TEXTES.tired] : [];
  return bouton(label, lines, () => workClick(s), !canWork(s));
}

export function vueCarnet(s: GameState): VueCarnet {
  const f = s.freelance;
  const task = currentTask(s);
  const t: VueTache = !task
    ? { kind: "empty", title: TEXTES.nothing, lines: [], share: null, progress: null }
    : task.type === "bug"
      ? tacheBug(s, task.bug)
      : tacheCommande(s, task.order);
  let next: VueLigne[] | null = null;
  let more: string | null = null;
  if (isRevealed(s, "ensuite")) {
    const rows: VueLigne[] = [];
    for (const b of f.bugs) if (task?.type !== "bug" || b.id !== task.bug.id) rows.push(ligneBug(s, b));
    for (const o of f.orders) if (task?.type !== "order" || o.id !== task.order.id) rows.push(ligneCommande(o));
    if (rows.length > 0) next = rows.slice(0, 3);
    if (rows.length > 3) more = TEXTES.more(rows.length - 3);
  }
  const invoice: VueFacture | null = canCreateCompany(s)
    ? {
        title: TEXTES.invoiceTitle,
        lines: TEXTES.invoiceLines,
        field: TEXTES.invoiceField,
        defaultName: COMPANY_DEFAULT_NAME,
        maxLength: COMPANY_NAME_MAX,
        logos: TEXTES.invoiceLogos,
        logoCount: LOGO_COUNT,
        cta: TEXTES.invoiceCta(fmtEur(KINDS.vitrine.price)),
        create: (name, logo) => {
          createCompany(s, name, logo);
        },
      }
    : null;
  return {
    title: TEXTES.carnetTitle,
    count: isRevealed(s, "menu") ? TEXTES.count(f.orders.length, f.bugs.length) : null,
    invoice,
    task: t,
    work: boutonTravail(s),
    next,
    more,
  };
}
```

Suite de `vue.ts` :

```ts
// --- Les améliorations, les clients, ce qui travaille sans toi ---

export function vueAmeliorations(s: GameState): { title: string; offer: Bouton | null; owned: string[] } | null {
  const offered = toolOffered(s);
  const sansToi = isRevealed(s, "sans_toi");
  const owned = ownedTools(s)
    .filter((t) => !(sansToi && (t.aiRate || t.id === "ia_mail" || t.formation)))
    .map((t) => `${t.name} : ${t.owned}`);
  if (!offered && owned.length === 0) return null;
  const offer = offered
    ? bouton(offered.cta, offered.lines, () => buyTool(s, offered.id), !canBuyTool(s, offered.id), offered.cost > 0 ? fmtEur(offered.cost) : TEXTES.eachMonday(fmtEur(offered.sub)))
    : null;
  return { title: TEXTES.upgradesTitle, offer, owned };
}

export interface VueClient {
  initials: string;
  name: string;
  detail: string;
  fee: string;
  late: boolean;
}
function vueClient(site: FlSite): VueClient {
  const initials = site.client
    .split(/\s+/)
    .filter((w) => /^\p{Lu}/u.test(w))
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
  const detail = site.client === DUVAL.name ? TEXTES.firstClient : `${KINDS[site.kind].label.toLowerCase()}, ${TEXTES.since(site.sinceWeek)}`;
  return {
    initials,
    name: site.client,
    detail,
    fee: site.bugOpen ? TEXTES.feeAtStake(fmtEur(site.fee)) : TEXTES.feeMonday(fmtEur(site.fee)),
    late: site.bugOpen,
  };
}
export function vueClients(s: GameState): { title: string; offers: Bouton[]; list: VueClient[] | null } | null {
  const offers = visibleProposals(s).map((p) => bouton(p.cta, p.lines, () => acceptProposal(s, p.id), false, TEXTES.free));
  const list = isRevealed(s, "clients") && s.freelance.sites.length > 0 ? s.freelance.sites.map(vueClient) : null;
  if (offers.length === 0 && !list) return null;
  return { title: TEXTES.clientsTitle, offers, list };
}
export function vueTopClients(s: GameState): { title: string; items: VueClient[] } | null {
  if (!isRevealed(s, "top_clients")) return null;
  const items = [...s.freelance.sites].sort((a, b) => b.fee - a.fee || a.sinceWeek - b.sinceWeek).slice(0, 4).map(vueClient);
  return { title: TEXTES.topClientsTitle, items };
}

export interface VueOutil {
  name: string;
  state: string;
  hint: string | null;
  cost: string | null;
  compromis: Bouton | null;
}
export function vueSansToi(s: GameState): { title: string; items: VueOutil[] } | null {
  if (!isRevealed(s, "sans_toi")) return null;
  const f = s.freelance;
  const items: VueOutil[] = [];
  if (f.aiRate > 0) {
    const sub = f.subs.ia_pro ?? f.subs.ia_pages ?? 0;
    items.push({ name: TOOL_BY_ID.ia_pages.name, state: TEXTES.aiState(f.aiRate), hint: TEXTES.aiHint, cost: TEXTES.eachMonday(fmtEur(sub)), compromis: null });
  }
  if (f.subs.ia_mail !== undefined) {
    items.push({ name: TOOL_BY_ID.ia_mail.name, state: TEXTES.mailState, hint: TEXTES.mailHint, cost: TEXTES.eachMonday(fmtEur(f.subs.ia_mail)), compromis: null });
  }
  if (f.tests) {
    items.push({
      name: TOOL_BY_ID.formation.name,
      state: TEXTES.testsState,
      hint: f.compromis === "taken" ? null : TEXTES.testsHint,
      cost: null,
      compromis: compromisVisible(s) ? bouton(TEXTES.compromisCta, TEXTES.compromisLines, () => takeCompromis(s), false, TEXTES.free) : null,
    });
  }
  if (f.nora) items.push({ name: TEXTES.noraName, state: TEXTES.noraHired, hint: null, cost: TEXTES.eachMonday(fmtEur(NORA_SALARY)), compromis: null });
  return { title: TEXTES.sansToiTitle, items };
}

// --- Ta vie ---

export interface VueVie {
  title: string;
  age: string;
  energy: string;
  share: number;
  tired: string | null;
  rest: string | null;
  logement: string | null; // en texte, jusqu'au deux-pièces
  home: { id: string; caption: string; line: string } | null; // en image, au deux-pièces
  homeOffer: Bouton | null;
  meal: Bouton | null;
  delivery: Bouton | null;
  ratios: [string, string][] | null;
}
export function vueVie(s: GameState): VueVie {
  const f = s.freelance;
  const h = currentHome(s);
  const max = energyMax(s);
  const verre = isRevealed(s, "verre");
  const next = homeOffered(s);
  const ratios: [string, string][] = [];
  if (isRevealed(s, "ratios")) {
    ratios.push([TEXTES.ratioMaman, TEXTES.ratioOf(f.mamanCalls, f.mamanRings)]);
    if (f.friends) ratios.push([TEXTES.ratioDinners, TEXTES.ratioOf(f.dinners, f.dinnerInvites)]);
    if (f.outings > 0) ratios.push([TEXTES.ratioOutings, TEXTES.times(f.outings)]);
    if (f.delivery) ratios.push([TEXTES.ratioMeals, TEXTES.mealPrice(fmtEur(MEAL_PRICE))]);
  }
  const mealLines =
    f.mealsToday >= 2 ? [TEXTES.mealDone] : TEXTES.mealLines(Math.round(s.energy), Math.min(max, Math.round(s.energy + h.meal)));
  return {
    title: TEXTES.colLife,
    age: TEXTES.ageWhen(AGE_FREELANCE, vueEntete(s).when),
    energy: TEXTES.energy(Math.round(s.energy), max),
    share: s.energy / max,
    tired: currentTask(s) && isTired(s) ? TEXTES.tired : null,
    rest: isRevealed(s, "repos") ? TEXTES.rest(restPerMin(s)) : null,
    logement: verre ? null : TEXTES.logement(h.label),
    home: verre ? { id: h.id, caption: TEXTES.homeCaption(h.label), line: TEXTES.homeSince(fmtEur(h.rent), max) } : null,
    homeOffer: next ? bouton(next.cta, TEXTES.homeLines(fmtEur(next.rent), max, next.energyMax), () => moveHome(s)) : null,
    meal: isRevealed(s, "repas") ? bouton(TEXTES.mealCta, mealLines, () => eat(s), !canEat(s)) : null,
    delivery: deliveryOffered(s) ? bouton(TEXTES.deliveryCta, TEXTES.deliveryLines(fmtEur(MEAL_PRICE), h.meal), () => acceptDelivery(s)) : null,
    ratios: ratios.length > 0 ? ratios : null,
  };
}

export interface VueRdv {
  title: string;
  when: string | null;
  buttons: Bouton[];
}
/** Les rendez-vous datés : dans « Ta vie », puis dans la carte sombre « D'ici lundi » (après le travail du soir). */
export function vueRendezVous(s: GameState): { title: string | null; items: VueRdv[] } | null {
  const f = s.freelance;
  const items: VueRdv[] = [];
  if (f.dinnerOpen) {
    const lines = [...TEXTES.dinnerLines(DINNER_ENERGY), ...(f.evening ? [TEXTES.dinnerEvening] : [])];
    items.push({ title: TEXTES.dinnerTitle, when: TEXTES.dIciFriday, buttons: [bouton(TEXTES.dinnerCta, lines, () => goToDinner(s), !canGoToDinner(s))] });
  }
  if (f.outingOpen) {
    const o = currentOuting(s);
    items.push({ title: TEXTES.outingTitle, when: null, buttons: [bouton(o.cta, TEXTES.outingLines(fmtEur(o.price), OUTING_ENERGY), () => goOut(s), !canGoOut(s))] });
  }
  if (f.mamanRing) {
    const buttons = [bouton(TEXTES.mamanCta, TEXTES.mamanLines(energyMax(s)), () => answerMaman(s), !canAnswerMaman(s))];
    if (mamanIAOffered(s)) buttons.push(bouton(TEXTES.mamanIACta, TEXTES.mamanIALines, () => acceptMamanIA(s), false, TEXTES.free));
    items.push({ title: TEXTES.mamanTitle, when: TEXTES.dIciSunday, buttons });
  }
  const dici = isRevealed(s, "d_ici_lundi");
  if (dici && f.sites.length > 0) {
    const [title, when] = TEXTES.dIciMonday(f.sites.length, fmtEur(maintenancePossible(s)));
    items.push({ title, when, buttons: [] });
  }
  if (items.length === 0) return null;
  return { title: dici ? TEXTES.dIciLundiTitle : null, items };
}

// --- L'argent ---

export function vueSemaine(s: GameState): { title: string; net: string; rows: [string, string][] } | null {
  if (!isRevealed(s, "cette_semaine")) return null;
  const l = s.freelance.ledger;
  const n = net(l);
  return {
    title: TEXTES.weekTitle,
    net: TEXTES.signed(fmtEur(n), n),
    rows: [
      [TEXTES.entrees, TEXTES.signed(fmtEur(entrees(l)), 1)],
      [TEXTES.charges, fmtEur(-(chargesPro(l) + chargesPerso(l)))],
      [TEXTES.achats, fmtEur(l.achats)],
    ],
  };
}

export interface VueBarre {
  label: string;
  livraisons: number;
  entretien: number;
  charges: number;
  current: boolean;
}
export function vueGagne(s: GameState): { title: string; big: string; delta: string | null; bars: VueBarre[]; note: string } | null {
  const h = s.freelance.history;
  if (!isRevealed(s, "menu") || h.length === 0) return null;
  const last = h[h.length - 1];
  const prev = h.length > 1 ? h[h.length - 2] : null;
  const diff = prev ? last.net - prev.net : 0;
  const delta = prev
    ? diff >= 0
      ? TEXTES.earnDelta(fmtEur(diff), h.length - 1)
      : TEXTES.earnDeltaDown(fmtEur(-diff), h.length - 1)
    : null;
  const first = Math.max(0, h.length - 8);
  const bars = h.slice(first).map((w, i) => ({
    label: `S${first + i + 1}`,
    livraisons: w.livraisons,
    entretien: w.entretien,
    charges: w.charges,
    current: first + i === h.length - 1,
  }));
  return { title: TEXTES.earnTitle, big: fmtEur(last.net), delta, bars, note: TEXTES.earnAchats };
}

export interface VueCompte {
  label: string;
  value: string;
  kind: "in" | "out" | "sub" | "net";
}
function ledgerRows(l: FlLedger): VueCompte[] {
  const rows: VueCompte[] = [{ label: TEXTES.entrees, value: TEXTES.signed(fmtEur(entrees(l)), 1), kind: "in" }];
  rows.push({ label: TEXTES.livraisons, value: fmtEur(l.livraisons), kind: "sub" });
  rows.push({ label: TEXTES.entretienOf(fmtEur(l.entretienPossible)), value: fmtEur(l.entretien), kind: "sub" });
  if (l.livret > 0) rows.push({ label: TEXTES.livret, value: fmtEur(l.livret), kind: "sub" });
  rows.push({ label: TEXTES.chargesPro, value: fmtEur(-chargesPro(l)), kind: "out" });
  if (l.abonnements > 0) rows.push({ label: TEXTES.abonnements, value: fmtEur(l.abonnements), kind: "sub" });
  if (l.salaires > 0) rows.push({ label: TEXTES.salaires, value: fmtEur(l.salaires), kind: "sub" });
  rows.push({ label: TEXTES.chargesPerso, value: fmtEur(-chargesPerso(l)), kind: "out" });
  if (l.loyer > 0) rows.push({ label: TEXTES.loyer, value: fmtEur(l.loyer), kind: "sub" });
  if (l.repas > 0) rows.push({ label: TEXTES.repas(l.repasCount), value: fmtEur(l.repas), kind: "sub" });
  if (l.sorties > 0) rows.push({ label: TEXTES.sorties, value: fmtEur(l.sorties), kind: "sub" });
  rows.push({ label: TEXTES.net, value: TEXTES.signed(fmtEur(net(l)), net(l)), kind: "net" });
  if (l.achats > 0) rows.push({ label: TEXTES.achats, value: fmtEur(-l.achats), kind: "out" });
  return rows;
}
export function vueFinances(s: GameState): {
  title: string;
  account: string;
  livret: string;
  livretRule: string;
  lastWeek: { title: string; rows: VueCompte[] } | null;
  deposit: Bouton;
  withdraw: Bouton;
} | null {
  if (!isRevealed(s, "menu")) return null;
  const f = s.freelance;
  return {
    title: TEXTES.financesTitle,
    account: fmtEur(s.money.toNumber()),
    livret: fmtEur(f.livretBalance),
    livretRule: TEXTES.livretRule,
    lastWeek: f.lastWeek ? { title: TEXTES.lastWeekTitle(f.history.length), rows: ledgerRows(f.lastWeek) } : null,
    deposit: bouton(TEXTES.deposit, [TEXTES.livretRule], () => depositAll(s), !canDeposit(s)),
    withdraw: bouton(TEXTES.withdraw, [TEXTES.withdrawSub], () => withdrawAll(s), !canWithdraw(s)),
  };
}

// --- La sortie ---

export function vueSortie(s: GameState): { title: string; lines: string[]; buy: Bouton } | null {
  if (!noraOffered(s)) return null;
  const f = s.freelance;
  const bugs = Math.max(bugsLast7Days(s), f.bugs.length);
  return {
    title: TEXTES.exitTitle(bugs),
    lines: [TEXTES.exitWhy(f.orders.length, fmtEur(waitingValue(s)))],
    buy: bouton(TEXTES.exitCta(companyName(s)), TEXTES.exitLines(fmtEur(NORA_SALARY)), () => hireNora(s)),
  };
}
export const vueFin = (s: GameState): string | null => (s.freelance.nora ? TEXTES.endLine : null);

export function vueSouvenirs(s: GameState, n = 5): { title: string; items: { text: string; missed: boolean }[] } | null {
  if (s.souvenirs.length === 0) return null;
  return {
    title: TEXTES.souvenirsTitle,
    items: s.souvenirs.slice(0, n).map((m) => ({ text: TEXTES.souvenir(m.day, m.text), missed: m.missed })),
  };
}
```

Dans `index.ts` : `export * from "./vue";`.

- [ ] **Step 5 : lancer les tests**

Run: `node_modules/.bin/vitest run`
Expected: toute la suite PASS. Si un test d'une tâche précédente casse parce qu'une ligne de `[interface]` repousse une nouveauté (35 s de plus), corriger le TEST (le rythme réel se vérifie à la tâche 16), jamais l'écart.

- [ ] **Step 6 : commit**

```bash
git add src/engine/freelance src/engine/content/freelance.ts tests/freelance.test.ts
git commit -m "feat(freelance): les paliers d'interface et les blocs d'écran

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 15: L'écran du chapitre 2 (Freelance.svelte, les logos, le test DOM)

**Files:**
- Create: `src/ui/freelance/Logo.svelte`, `src/ui/freelance/DeuxPieces.svelte`, `tests/ui/freelance.dom.test.ts`
- Modify: `src/ui/Freelance.svelte` (remplace l'écran provisoire de la tâche 2), `index.html`

**Interfaces:**
- Consumes : tous les `vue*` de la tâche 14, `startAtChapter(n, now)` (tâche 3), `game` (`src/ui/store.svelte.ts`).
- Produces : l'écran. Classes que le test DOM lit : `.fl` (racine, avec `.couleur`, `.etiquettes`, `.ombre`, `.verre`, `.menu`), `.side` (le menu, absent avant le palier), `.quote`, `.money`, `button.work`, `.invoice`, `.invoice input`, `.invoice input[type=radio]`, `.brand`, `.vie .logement`.

Mise en page (maquettes validées) :
- **Avant le menu** : la page du plongeur, deux colonnes. « Travail » à gauche (l'en-tête, la sortie, le carnet, les améliorations, les clients, ce qui travaille sans toi), « Ta vie » à droite (l'énergie, le logement, les rendez-vous, la semaine, les souvenirs).
- **Après le menu** : une colonne latérale (la marque et les 4 onglets) et la page de l'onglet. La carte de la tâche en cours et son bouton restent en haut de CHAQUE onglet : tu ne quittes jamais le clavier.
  - Tableau de bord : la sortie, le carnet, ce que tu gagnes et les clients qui paient le plus, ce qui travaille sans toi, puis « Ta vie » en colonne de droite.
  - Pro : le carnet, les améliorations, les clients, ce qui travaille sans toi.
  - Perso : ta vie, les rendez-vous, 8 souvenirs.
  - Finances : les finances, la semaine en cours.
- **Les paliers** ne changent que la peinture, jamais la place des blocs. Sans palier, la page est blanche, texte noir, boutons carrés à bordure (comme au plongeur). `.couleur` : le fond chaud et « Ta vie » teintée. `.etiquettes` : les étiquettes du carnet en couleur. `.ombre` : les ombres portées, les coins arrondis et la police Hanken Grotesk. `.verre` : le verre dépoli et l'image du deux-pièces.

- [ ] **Step 1 : écrire le test DOM (il échoue)**

`tests/ui/freelance.dom.test.ts` :

```ts
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
    input.dispatchEvent(new Event("input"));
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
```

La ligne `money` de l'en-tête s'écrit « Argent : 600 € » : `Freelance.svelte` l'affiche avec `TEXTES.money(entete.money)`.

- [ ] **Step 2 : lancer le test**

Run: `node_modules/.bin/vitest run tests/ui/freelance.dom.test.ts`
Expected: FAIL (pas de `.fl`, pas de `button.work` : l'écran est encore le provisoire).

- [ ] **Step 3 : les logos**

`src/ui/freelance/Logo.svelte` (cinq logos au trait, 24 × 24, dans la couleur du texte ; le cinquième est l'initiale du nom) :

```svelte
<script lang="ts">
  // Les 5 logos de la micro-entreprise, au trait, dans la couleur du texte (currentColor).
  let { logo, initial = "A", size = 24 }: { logo: number; initial?: string; size?: number } = $props();
</script>

<svg
  class="logo"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.8"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  {#if logo === 0}
    <path d="M9 7l-5 5 5 5M15 7l5 5-5 5" />
  {:else if logo === 1}
    <path d="M9 4c-2 0-3 1-3 3v2c0 1.5-1 3-2 3 1 0 2 1.5 2 3v2c0 2 1 3 3 3M15 4c2 0 3 1 3 3v2c0 1.5 1 3 2 3-1 0-2 1.5-2 3v2c0 2-1 3-3 3" />
  {:else if logo === 2}
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M7 10l3 2-3 2M12 15h5" />
  {:else if logo === 3}
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 9h18" />
    <circle cx="6" cy="6.5" r="0.4" />
    <circle cx="8.5" cy="6.5" r="0.4" />
  {:else}
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <text x="12" y="16.5" text-anchor="middle" font-size="12" font-weight="700" fill="currentColor" stroke="none">{initial}</text>
  {/if}
</svg>
```

Les libellés des radios viennent de `LOGO_LABELS` (tâche 1) en `aria-label`.

`src/ui/freelance/DeuxPieces.svelte` (l'image du logement, au palier du verre ; un dessin au trait, pas une photo) :

```svelte
<script lang="ts">
  // Le deux-pièces avec un bureau : un plan en perspective, simple, qui paraît au palier du verre.
</script>

<svg class="home-img" viewBox="0 0 320 150" role="img" aria-label="Un deux-pièces avec un bureau">
  <defs>
    <linearGradient id="dp-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f3c3a2" />
      <stop offset="1" stop-color="#e9d8d0" />
    </linearGradient>
  </defs>
  <rect width="320" height="150" fill="url(#dp-sky)" />
  <rect x="24" y="30" width="120" height="96" rx="4" fill="#fff" fill-opacity="0.55" stroke="#262120" stroke-opacity="0.25" />
  <rect x="152" y="30" width="144" height="96" rx="4" fill="#fff" fill-opacity="0.55" stroke="#262120" stroke-opacity="0.25" />
  <rect x="40" y="46" width="40" height="30" rx="2" fill="#b88597" fill-opacity="0.35" />
  <rect x="40" y="92" width="88" height="22" rx="3" fill="#262120" fill-opacity="0.12" />
  <rect x="170" y="84" width="80" height="6" rx="2" fill="#262120" fill-opacity="0.45" />
  <rect x="192" y="58" width="36" height="24" rx="2" fill="#262120" fill-opacity="0.7" />
  <rect x="236" y="62" width="26" height="18" rx="2" fill="#262120" fill-opacity="0.55" />
  <rect x="262" y="44" width="22" height="30" rx="2" fill="#ee9b58" fill-opacity="0.35" />
</svg>
```

- [ ] **Step 4 : les polices**

Dans `index.html`, dans `<head>`, après la balise `<title>` :

```html
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap"
      rel="stylesheet"
    />
```

- [ ] **Step 5 : écrire `Freelance.svelte`**

Remplacer tout `src/ui/Freelance.svelte` par :

```svelte
<script lang="ts">
  // Acte I, chapitre 2 : le développeur freelance. La page part de celle du plongeur (blanche, deux colonnes)
  // et s'enrichit par paliers que le moteur décide : couleur, étiquettes, ombre, verre, puis le menu.
  // Ce composant n'invente rien : chaque bloc, ses libellés et ses sous-titres viennent de engine/freelance/vue.ts
  // (null = bloc caché). Le nom de l'entreprise est un texte du joueur : toujours {…}, jamais {@html}.
  import { game } from "./store.svelte";
  import { TEXTES, LOGO_LABELS, COMPANY_DEFAULT_NAME } from "../engine/content/freelance";
  import {
    vuePaliers,
    vueMenu,
    vueMarque,
    vueEntete,
    vueCarnet,
    vueAmeliorations,
    vueClients,
    vueTopClients,
    vueSansToi,
    vueVie,
    vueRendezVous,
    vueSemaine,
    vueGagne,
    vueFinances,
    vueSortie,
    vueFin,
    vueSouvenirs,
    type Bouton,
  } from "../engine/freelance";
  import Logo from "./freelance/Logo.svelte";
  import DeuxPieces from "./freelance/DeuxPieces.svelte";

  const s = $derived(game.state);
  const p = $derived(vuePaliers(s));
  const menu = $derived(vueMenu(s));
  const marque = $derived(vueMarque(s));
  const entete = $derived(vueEntete(s));
  const carnet = $derived(vueCarnet(s));
  const amelio = $derived(vueAmeliorations(s));
  const clients = $derived(vueClients(s));
  const top = $derived(vueTopClients(s));
  const sansToi = $derived(vueSansToi(s));
  const vie = $derived(vueVie(s));
  const rdv = $derived(vueRendezVous(s));
  const semaine = $derived(vueSemaine(s));
  const gagne = $derived(vueGagne(s));
  const finances = $derived(vueFinances(s));
  const sortie = $derived(vueSortie(s));
  const fin = $derived(vueFin(s));

  let tab = $state(0); // 0 Tableau de bord, 1 Pro, 2 Perso, 3 Finances
  let companyName = $state(COMPANY_DEFAULT_NAME);
  let companyLogo = $state(0);
  const souvenirs = $derived(vueSouvenirs(s, menu && tab === 2 ? 8 : 5));
  const maxBar = $derived(gagne ? Math.max(1, ...gagne.bars.map((b) => b.livraisons + b.entretien)) : 1);
</script>

{#snippet achat(b: Bouton)}
  <button class="bt" disabled={b.disabled} onclick={b.act}>{b.label}</button>
  {#if b.price}<span class="price">{b.price}</span>{/if}
  {#each b.lines as l}<p class="sub">{l}</p>{/each}
{/snippet}

{#snippet enTete()}
  <header class="top">
    <p class="quote">{entete.quote}</p>
    <p class="money">{TEXTES.money(entete.money)}</p>
    {#if entete.monday}<p class="sub">{entete.monday}</p>{/if}
  </header>
{/snippet}

<!-- La tâche en cours et son bouton : en haut de chaque onglet. -->
{#snippet travail()}
  <section class="card now" aria-label={carnet.title}>
    <div class="work-head">
      <h2>{carnet.title}</h2>
      {#if carnet.count}<span class="count">{carnet.count}</span>{/if}
    </div>
    {#if carnet.invoice}
      {@const inv = carnet.invoice}
      <div class="invoice">
        <h3>{inv.title}</h3>
        {#each inv.lines as l}<p class="sub">{l}</p>{/each}
        <label class="field">
          <span>{inv.field}</span>
          <input type="text" maxlength={inv.maxLength} bind:value={companyName} />
        </label>
        <fieldset class="logos">
          <legend>{inv.logos}</legend>
          {#each Array.from({ length: inv.logoCount }, (_, i) => i) as i (i)}
            <label class="logo-pick" class:on={companyLogo === i}>
              <input type="radio" name="logo" value={i} aria-label={LOGO_LABELS[i]} bind:group={companyLogo} />
              <Logo logo={i} initial={companyName.trim().charAt(0).toUpperCase() || "A"} />
            </label>
          {/each}
        </fieldset>
        <button class="bt cta" onclick={() => inv.create(companyName, companyLogo)}>{inv.cta}</button>
      </div>
    {:else}
      <div class="task">
        <span class="tag {carnet.task.kind}">{carnet.task.title}</span>
        {#each carnet.task.lines as l}<p class="sub">{l}</p>{/each}
        {#if carnet.task.share !== null}
          <div class="meter"><i style="width: {Math.min(100, carnet.task.share * 100)}%"></i></div>
          <p class="sub">{carnet.task.progress}</p>
        {/if}
      </div>
      <button class="bt work cta" disabled={carnet.work.disabled} onclick={carnet.work.act}>{carnet.work.label}</button>
      {#each carnet.work.lines as l}<p class="sub">{l}</p>{/each}
    {/if}
  </section>
{/snippet}

{#snippet ensuite()}
  {#if carnet.next}
    <section class="card">
      <h3>{TEXTES.ensuite}</h3>
      <table class="table">
        <tbody>
          {#each carnet.next as r, i (i)}
            <tr class:dim={r.dim}>
              <td><span class="tag {r.tagKind}">{r.tag}</span></td>
              <td>{r.client}</td>
              <td>{r.detail}</td>
              <td class:loss={r.loss}>{r.money}</td>
            </tr>
          {/each}
          {#if carnet.more}<tr class="more"><td colspan="4">{carnet.more}</td></tr>{/if}
        </tbody>
      </table>
    </section>
  {/if}
{/snippet}

{#snippet blocSortie()}
  {#if sortie}
    <section class="exit">
      <div>
        <p class="t">{sortie.title}</p>
        {#each sortie.lines as l}<p>{l}</p>{/each}
      </div>
      <div class="buy">{@render achat(sortie.buy)}</div>
    </section>
  {/if}
  {#if fin}<p class="fin-line">{fin}</p>{/if}
{/snippet}

{#snippet blocAmelio()}
  {#if amelio}
    <section class="card">
      <h3>{amelio.title}</h3>
      {#if amelio.offer}<div class="buy">{@render achat(amelio.offer)}</div>{/if}
      {#each amelio.owned as o}<p class="sub">{o}</p>{/each}
    </section>
  {/if}
{/snippet}

{#snippet blocClients()}
  {#if clients}
    <section class="card">
      <h3>{clients.title}</h3>
      {#each clients.offers as o (o.label)}<div class="buy">{@render achat(o)}</div>{/each}
      {#if clients.list}
        <ul class="clients">
          {#each clients.list as c (c.name)}
            <li class:late={c.late}>
              <span class="face">{c.initials}</span>
              <span class="who"><b>{c.name}</b><span>{c.detail}</span></span>
              <span class="fee">{c.fee}</span>
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  {/if}
{/snippet}

{#snippet blocSansToi()}
  {#if sansToi}
    <section class="card">
      <h3>{sansToi.title}</h3>
      <div class="auto">
        {#each sansToi.items as t (t.name)}
          <div class="tool">
            <b>{t.name}</b>
            <span class="state">{t.state}</span>
            {#if t.hint}<p class="sub">{t.hint}</p>{/if}
            {#if t.compromis}<div class="buy">{@render achat(t.compromis)}</div>{/if}
            {#if t.cost}<p class="cost">{t.cost}</p>{/if}
          </div>
        {/each}
      </div>
    </section>
  {/if}
{/snippet}

{#snippet blocGagne()}
  {#if gagne}
    <section class="card earn">
      <div>
        <h3>{gagne.title}</h3>
        <p class="big">{gagne.big}</p>
        {#if gagne.delta}<p class="sub delta">{gagne.delta}</p>{/if}
        <div class="bars" aria-hidden="true">
          {#each gagne.bars as b (b.label)}
            <div class="bar" class:cur={b.current}>
              <span class="up">
                <i class="mai" style="height: {(b.entretien / maxBar) * 100}%"></i>
                <i class="del" style="height: {(b.livraisons / maxBar) * 100}%"></i>
              </span>
              <span class="down"><i style="height: {Math.min(100, (b.charges / maxBar) * 100)}%"></i></span>
              <small>{b.label}</small>
            </div>
          {/each}
        </div>
        <p class="sub">{gagne.note}</p>
      </div>
      {#if top}
        <div>
          <h3>{top.title}</h3>
          <ul class="clients">
          {#each top.items as c (c.name)}
            <li class:late={c.late}>
              <span class="face">{c.initials}</span>
              <span class="who"><b>{c.name}</b><span>{c.detail}</span></span>
              <span class="fee">{c.fee}</span>
            </li>
          {/each}
          </ul>
        </div>
      {/if}
    </section>
  {/if}
{/snippet}

{#snippet blocVie()}
  <section class="card vie" aria-label={vie.title}>
    <h2>{vie.title}</h2>
    <p class="sub">{vie.age}</p>
    <p>{vie.energy}</p>
    <div class="gauge"><i style="width: {Math.min(100, vie.share * 100)}%"></i></div>
    {#if vie.tired}<p class="sub warn">{vie.tired}</p>{/if}
    {#if vie.rest}<p class="sub rest">{vie.rest}</p>{/if}
    {#if vie.logement}<p class="logement">{vie.logement}</p>{/if}
    {#if vie.home}
      <figure class="home">
        <DeuxPieces />
        <figcaption><b>{vie.home.caption}</b><span class="sub">{vie.home.line}</span></figcaption>
      </figure>
    {/if}
    {#if vie.homeOffer}<div class="buy">{@render achat(vie.homeOffer)}</div>{/if}
    {#if vie.meal}<div class="buy">{@render achat(vie.meal)}</div>{/if}
    {#if vie.delivery}<div class="buy">{@render achat(vie.delivery)}</div>{/if}
    {#if vie.ratios}
      <dl>
        {#each vie.ratios as [k, v] (k)}<dt>{k}</dt><dd>{v}</dd>{/each}
      </dl>
    {/if}
  </section>
{/snippet}

{#snippet blocRdv()}
  {#if rdv}
    <section class="card" class:night={rdv.title !== null}>
      {#if rdv.title}<h2>{rdv.title}</h2>{/if}
      <ul>
        {#each rdv.items as r (r.title)}
          <li>
            <p class="t">{r.title}</p>
            {#if r.when}<p class="d">{r.when}</p>{/if}
            {#each r.buttons as b (b.label)}<div class="buy">{@render achat(b)}</div>{/each}
          </li>
        {/each}
      </ul>
    </section>
  {/if}
{/snippet}

{#snippet blocSemaine()}
  {#if semaine}
    <section class="card">
      <h3>{semaine.title}</h3>
      <p class="big-sm">{semaine.net}</p>
      {#each semaine.rows as [k, v] (k)}<p class="row"><span>{k}</span><span>{v}</span></p>{/each}
    </section>
  {/if}
{/snippet}

{#snippet blocSouvenirs()}
  {#if souvenirs}
    <section class="souv">
      <h3>{souvenirs.title}</h3>
      <ul>
        {#each souvenirs.items as m, i (i)}<li class:missed={m.missed}>{m.text}</li>{/each}
      </ul>
    </section>
  {/if}
{/snippet}

{#snippet blocFinances()}
  {#if finances}
    <section class="card fin">
      <h2>{finances.title}</h2>
      <p class="row"><span>{TEXTES.account}</span><span>{finances.account}</span></p>
      <p class="row"><span>{TEXTES.livret}</span><span>{finances.livret}</span></p>
      <div class="btns">
        <div class="buy">{@render achat(finances.deposit)}</div>
        <div class="buy">{@render achat(finances.withdraw)}</div>
      </div>
      {#if finances.lastWeek}
        <div class="ledger">
          <h3>{finances.lastWeek.title}</h3>
          {#each finances.lastWeek.rows as r (r.label)}
            <p class="row {r.kind}"><span>{r.label}</span><span>{r.value}</span></p>
          {/each}
        </div>
      {/if}
    </section>
  {/if}
{/snippet}

<main class="fl" class:couleur={p.couleur} class:etiquettes={p.etiquettes} class:ombre={p.ombre} class:verre={p.verre} class:menu={p.menu}>
  {#if menu}
    <div class="window">
      <aside class="side">
        {#if marque}
          <p class="brand"><i><Logo logo={marque.logo} initial={marque.initial} size={18} /></i><span>{marque.name}</span></p>
        {/if}
        <nav>
          {#each menu as label, i (label)}
            <button class="tab" class:on={tab === i} onclick={() => (tab = i)}>{label}</button>
          {/each}
        </nav>
      </aside>
      <div class="page">
        {@render enTete()}
        <div class="cols">
          <div class="col">
            {@render travail()}
            {#if tab === 0}
              {@render blocSortie()}
              {@render ensuite()}
              {@render blocGagne()}
              {@render blocSansToi()}
            {:else if tab === 1}
              {@render ensuite()}
              {@render blocAmelio()}
              {@render blocClients()}
              {@render blocSansToi()}
            {:else if tab === 2}
              {@render blocVie()}
              {@render blocSouvenirs()}
            {:else}
              {@render blocFinances()}
              {@render blocSemaine()}
            {/if}
          </div>
          <div class="col">
            {#if tab === 0}
              {@render blocVie()}
              {@render blocRdv()}
            {:else if tab === 2}
              {@render blocRdv()}
            {:else if tab === 1}
              {@render blocRdv()}
            {/if}
          </div>
        </div>
      </div>
    </div>
  {:else}
    {@render enTete()}
    <div class="cols">
      <section class="col travail" aria-label={TEXTES.colWork}>
        <h2>{TEXTES.colWork}</h2>
        {@render blocSortie()}
        {@render travail()}
        {@render ensuite()}
        {@render blocAmelio()}
        {@render blocClients()}
        {@render blocSansToi()}
      </section>
      <section class="col">
        {@render blocVie()}
        {@render blocRdv()}
        {@render blocSemaine()}
        {@render blocSouvenirs()}
      </section>
    </div>
  {/if}
</main>

<style>
  /* Sans palier : la page du plongeur. Papier blanc, texte noir, boutons carrés. */
  .fl {
    --ink: #262120;
    --soft: #6f6966;
    --faint: #a8a29e;
    --good: #4f8a68;
    --warn: #c0604a;
    --night: #1f1c1b;
    --card: transparent;
    --edge: #262120;
    --radius: 0;
    --shadow: none;
    --flow: #262120;
    min-height: 100vh;
    padding: 24px 16px 48px;
    color: var(--ink);
    background: #fff;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 15px;
    line-height: 1.45;
    font-variant-numeric: tabular-nums;
  }
  p { margin: 0; }
  ul { margin: 0; padding: 0; list-style: none; }
  h2 { font-size: 18px; margin: 0 0 8px; }
  h3 { font-size: 15px; margin: 0 0 6px; }
  .sub { color: var(--soft); font-size: 13px; }
  .warn { color: var(--warn); }
  .top { max-width: 1180px; margin: 0 auto 20px; }
  .quote { font-style: italic; }
  .money { font-size: 22px; margin-top: 6px; }
  .cols { max-width: 1180px; margin: 0 auto; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 360px); gap: 24px; align-items: start; }
  .col { display: grid; gap: 16px; align-content: start; min-width: 0; }
  .card { background: var(--card); border: 1px solid var(--edge); border-radius: var(--radius); box-shadow: var(--shadow); padding: 14px 16px; }
  .bt { font: inherit; color: var(--ink); background: #fff; border: 1px solid var(--ink); border-radius: var(--radius); padding: 6px 12px; cursor: pointer; }
  .bt:disabled { opacity: 0.45; cursor: default; }
  .bt:focus-visible, .tab:focus-visible, input:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
  .cta { font-weight: 600; margin-top: 10px; }
  .price { margin-left: 8px; color: var(--soft); font-size: 13px; }
  .buy { margin-top: 10px; }
  .work-head { display: flex; align-items: baseline; gap: 12px; }
  .count { margin-left: auto; color: var(--warn); font-size: 13px; font-weight: 600; }
  .task { margin-top: 6px; }
  .meter { height: 6px; background: rgba(38, 33, 32, 0.08); border-radius: var(--radius); overflow: hidden; margin: 8px 0 4px; }
  .meter i { display: block; height: 100%; background: var(--flow); }
  .tag { font-size: 13px; font-weight: 600; }
  .table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
  .table td { padding: 6px 8px 6px 0; border-top: 1px solid rgba(38, 33, 32, 0.12); vertical-align: middle; }
  .table td:last-child { text-align: right; white-space: nowrap; }
  .table .loss { color: var(--warn); }
  .table tr.dim td { color: var(--faint); }
  .table tr.more td { color: var(--soft); }
  .invoice .field { display: grid; gap: 4px; margin-top: 10px; }
  .invoice input[type="text"] { font: inherit; padding: 6px 8px; border: 1px solid var(--ink); border-radius: var(--radius); max-width: 320px; }
  .logos { border: 0; padding: 0; margin: 10px 0 0; display: flex; gap: 8px; flex-wrap: wrap; }
  .logos legend { font-size: 13px; color: var(--soft); margin-bottom: 4px; }
  .logo-pick { display: grid; place-items: center; width: 44px; height: 44px; border: 1px solid rgba(38, 33, 32, 0.25); border-radius: var(--radius); cursor: pointer; }
  .logo-pick.on { border-color: var(--ink); background: rgba(38, 33, 32, 0.06); }
  .logo-pick input { position: absolute; opacity: 0; width: 1px; height: 1px; }
  .clients li { display: flex; gap: 10px; align-items: center; padding: 6px 0; }
  .clients .who { min-width: 0; display: grid; }
  .clients .who span { color: var(--soft); font-size: 12.5px; }
  .clients .fee { margin-left: auto; font-size: 13px; white-space: nowrap; }
  .clients li.late .fee { color: var(--warn); }
  .face { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; font-size: 11.5px; font-weight: 600; border: 1px solid var(--ink); flex: none; }
  .auto { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
  .tool { display: flex; flex-direction: column; gap: 3px; border: 1px solid rgba(38, 33, 32, 0.2); border-radius: var(--radius); padding: 10px 12px; }
  .tool .state::before { content: ""; display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: var(--good); margin-right: 6px; }
  .tool .cost { margin-top: auto; color: var(--soft); font-size: 12.5px; }
  .earn { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 300px); gap: 20px; }
  .big { font-size: 40px; line-height: 1.05; letter-spacing: -0.02em; }
  .big-sm { font-size: 24px; margin-bottom: 6px; }
  .delta { color: var(--good); }
  .bars { display: grid; grid-template-columns: repeat(8, 1fr); gap: 10px; height: 160px; margin: 14px 0 8px; }
  .bar { display: grid; grid-template-rows: 70% 18% auto; justify-items: center; }
  .bar .up { width: 14px; display: flex; flex-direction: column-reverse; background: rgba(38, 33, 32, 0.05); }
  .bar .down { width: 14px; display: flex; }
  .bar .down i { display: block; width: 100%; background: #7d736f; }
  .bar .del { background: #262120; }
  .bar .mai { background: #8a8380; }
  .bar small { font-size: 11.5px; color: var(--faint); }
  .bar.cur small { color: var(--ink); font-weight: 600; }
  .gauge { height: 8px; background: rgba(38, 33, 32, 0.08); border-radius: var(--radius); overflow: hidden; margin: 6px 0; }
  .gauge i { display: block; height: 100%; background: var(--ink); }
  .rest { color: var(--good); }
  .logement { margin-top: 6px; }
  .home { margin: 10px 0 0; }
  .home :global(.home-img) { display: block; width: 100%; height: auto; border-radius: var(--radius); }
  .home figcaption { display: grid; margin-top: 6px; }
  dl { display: grid; grid-template-columns: 1fr auto; gap: 6px 12px; margin: 14px 0 0; font-size: 13.5px; }
  dt { color: var(--soft); }
  dd { margin: 0; font-weight: 600; text-align: right; }
  .t { font-weight: 600; }
  .d { color: var(--soft); font-size: 12.5px; }
  li + li { margin-top: 12px; }
  .row { display: flex; justify-content: space-between; gap: 12px; padding: 3px 0; font-size: 13.5px; }
  .row.sub span:first-child { padding-left: 12px; }
  .row.out span:last-child { color: var(--warn); }
  .row.net { font-weight: 700; border-top: 1px solid rgba(38, 33, 32, 0.15); margin-top: 4px; padding-top: 6px; }
  .ledger { margin-top: 14px; }
  .btns { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .souv { font-size: 15px; }
  .souv li { padding: 2px 0; }
  .souv li + li { margin-top: 0; }
  .souv li.missed { color: var(--faint); font-style: italic; }
  .exit { display: grid; grid-template-columns: 1fr auto; gap: 16px; align-items: center; border: 2px solid var(--ink); padding: 16px 18px; border-radius: var(--radius); }
  .exit .t { font-size: 17px; }
  .fin-line { font-style: italic; }

  /* Le menu : une colonne latérale et la page de l'onglet. */
  .window { max-width: 1400px; margin: 0 auto; display: grid; grid-template-columns: 210px minmax(0, 1fr); gap: 24px; }
  .side { display: grid; gap: 4px; align-content: start; }
  .brand { display: flex; align-items: center; gap: 10px; font-weight: 700; margin-bottom: 20px; }
  .brand i { width: 30px; height: 30px; display: grid; place-items: center; font-style: normal; border: 1px solid var(--ink); border-radius: var(--radius); }
  .tab { font: inherit; text-align: left; color: var(--soft); background: none; border: 0; border-radius: var(--radius); padding: 9px 12px; cursor: pointer; }
  .tab.on { color: var(--ink); background: rgba(38, 33, 32, 0.06); font-weight: 600; }
  .page { min-width: 0; }
  .page .top { margin: 0 0 18px; }
  .page .cols { max-width: none; }

  /* Palier 1, la chambre : la couleur (le fond et « Ta vie »). */
  .fl.couleur { background: linear-gradient(160deg, #f6e3d5 0%, #efe4e6 55%, #e6e2e3 100%); }
  .fl.couleur .vie { background: rgba(255, 255, 255, 0.55); border-color: rgba(184, 133, 151, 0.5); }
  .fl.couleur .gauge i { background: linear-gradient(90deg, #7fb596, var(--good)); }
  .fl.couleur .meter i { background: linear-gradient(90deg, #f0a462, #b88597); }

  /* Palier 2, la licence d'éditeur : les étiquettes du carnet prennent leur couleur. */
  .fl.etiquettes .tag { padding: 2px 9px; border-radius: 99px; font-size: 12px; }
  .fl.etiquettes .tag.order { background: rgba(238, 155, 88, 0.16); color: #b06a30; }
  .fl.etiquettes .tag.bug { background: rgba(192, 96, 74, 0.12); color: var(--warn); }
  .fl.etiquettes .tag.red { background: rgba(31, 28, 27, 0.08); }

  /* Palier 3, le T1 : l'ombre portée, les coins et la police définitive. */
  .fl.ombre {
    --radius: 14px;
    --edge: rgba(38, 33, 32, 0.08);
    --card: #fff;
    --shadow: 0 10px 30px rgba(90, 60, 50, 0.09);
    font-family: "Hanken Grotesk", system-ui, sans-serif;
    font-size: 14px;
  }
  .fl.ombre .bt { border-color: rgba(38, 33, 32, 0.2); }
  .fl.ombre .cta { background: var(--night); color: #fff; border: 0; padding: 12px 20px; box-shadow: 0 10px 22px rgba(31, 28, 27, 0.25); }
  .fl.ombre .souv { font-family: "Instrument Serif", Georgia, serif; font-size: 17px; }
  .fl.ombre .exit { border: 0; color: #fff; background: linear-gradient(120deg, #e9955a, #b27f93); box-shadow: 0 18px 36px rgba(178, 127, 147, 0.35); }
  .fl.ombre .exit .bt { background: #fff; color: var(--night); border: 0; font-weight: 700; }
  .fl.ombre .exit .sub { color: rgba(255, 255, 255, 0.85); }
  .fl.ombre .night { background: var(--night); color: #f2ece8; border: 0; }
  .fl.ombre .night .d, .fl.ombre .night .sub { color: rgba(242, 236, 232, 0.6); }

  /* Palier 4, le deux-pièces : le verre dépoli. */
  .fl.verre {
    --radius: 22px;
    --card: rgba(255, 255, 255, 0.46);
    --edge: rgba(255, 255, 255, 0.75);
    --shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85), 0 10px 30px rgba(90, 60, 50, 0.07);
    background:
      radial-gradient(900px 700px at 8% 12%, #f3c3a2 0%, transparent 60%),
      radial-gradient(700px 600px at 92% 88%, #e9b7a0 0%, transparent 55%),
      radial-gradient(800px 700px at 70% 0%, #d6d2d6 0%, transparent 60%),
      #cfc9c8;
  }
  .fl.verre .card { backdrop-filter: blur(24px) saturate(1.2); }
  .fl.verre .bar .del { background: linear-gradient(180deg, #f3b173, #ee9b58); }
  .fl.verre .bar .mai { background: linear-gradient(180deg, #caa0ae, #b88597); }
  .fl.verre .night { background: radial-gradient(420px 260px at 85% -10%, rgba(238, 155, 88, 0.55), transparent 65%), var(--night); }

  @media (max-width: 900px) {
    .cols, .window, .earn, .exit { grid-template-columns: 1fr; }
    .side { grid-auto-flow: column; overflow-x: auto; }
    .brand { margin-bottom: 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    .meter i, .gauge i { transition: none; }
  }
</style>
```

Un seul endroit peut contenir le nom de l'entreprise : `<span>{marque.name}</span>`, et la carte de facture via `bind:value`. Ne jamais passer par `{@html}`.

- [ ] **Step 6 : lancer le test DOM puis toute la suite**

Run: `node_modules/.bin/vitest run tests/ui/freelance.dom.test.ts`
Expected: PASS.
Run: `node_modules/.bin/vitest run`
Expected: toute la suite PASS.

- [ ] **Step 7 : vérifier les types et le rendu**

Run: `node_modules/.bin/svelte-check --tsconfig ./tsconfig.json`
Expected: 0 erreur.

Lancer `node_modules/.bin/vite` (http://localhost:5173/life-clicker/), choisir « 2. Freelance » dans le sélecteur en haut à droite, et vérifier dans le panneau du navigateur :
1. la page blanche à deux colonnes, sans menu ;
2. la carte de la micro-entreprise après la vitrine de Mme Duval (nom, 5 logos, bouton) ;
3. avec `game.state.freelance.home = 1..3` injecté dans la console puis un clic, chaque palier ;
4. avec `revealed.sans_toi = revealed.menu = 0`, le menu et ses 4 onglets ;
5. une largeur de 375 px, sans défilement horizontal.

Faire une capture d'écran de chaque étape.

- [ ] **Step 8 : commit**

```bash
git add src/ui/Freelance.svelte src/ui/freelance index.html tests/ui/freelance.dom.test.ts
git commit -m "feat(freelance): l'écran du chapitre 2, ses paliers et les logos

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 16: La sonde de rythme (R7)

**Files:**
- Create: `tests/rythme/freelance.ts`, `tests/freelance-rythme.test.ts`
- Modify (seulement si un test échoue) : `src/engine/content/freelance.ts`, jamais les seuils des tests

**Interfaces:**
- Consumes : tout le moteur.
- Produces :
  - `interface FlJoueur { cps: number; buys: boolean; answersMaman: boolean; dinners: boolean }`
  - `interface FlTrace { exitAt: number | null; reveals: [string, number][]; maxGap: number; tools: string[]; proposals: string[]; weeks: number[] }`
  - `playFreelance(j: FlJoueur, maxSecs: number, setup?: (s: GameState) => void): { s: GameState; trace: FlTrace }`

Ce que la sonde vérifie (spec R7, v4) :
- un joueur qui prend tout sort (Nora proposée) entre 10 et 22 minutes, à 2, 4 et 6 clics par seconde ;
- jamais plus de 180 s sans nouveauté avant la sortie ;
- le joueur rapide ne sort pas plus de 60 s après le joueur moyen ;
- tous les outils et toutes les propositions ont été vus ;
- le joueur qui ne clique pas ne casse rien, et celui qui refuse tout garde une offre à l'écran (pas de blocage) ;
- un départ à −2 000 € sort quand même ;
- embaucher Nora ne fait pas baisser le net de la semaine suivante (R7 : la sortie rapporte).

Si un seuil échoue, régler les chiffres dans `content/freelance.ts` (`TOOL_LATE`, `PROPOSAL_LATE`, prix, tailles) puis relancer toute la suite. Ne JAMAIS élargir un seuil de test pour qu'il passe. Si un seuil ne tient qu'en touchant à la thèse (par exemple rendre Nora inutile, ou faire payer l'énergie à l'IA), s'arrêter et demander à Alexandre.

- [ ] **Step 1 : écrire le joueur simulé**

`tests/rythme/freelance.ts` :

```ts
import { createInitialState, type GameState } from "../../src/engine/state";
import { tick } from "../../src/engine/loop";
import {
  startFreelance,
  workClick,
  canWork,
  canCreateCompany,
  createCompany,
  visibleProposals,
  acceptProposal,
  toolOffered,
  canBuyTool,
  buyTool,
  homeOffered,
  moveHome,
  canEat,
  eat,
  deliveryOffered,
  acceptDelivery,
  canGoToDinner,
  goToDinner,
  canAnswerMaman,
  answerMaman,
  mamanIAOffered,
  acceptMamanIA,
  compromisVisible,
  takeCompromis,
  noraOffered,
  energyMax,
  currentHome,
} from "../../src/engine/freelance";

// Un joueur simulé du chapitre 2 : il clique à un rythme fixe et prend ce qui se présente.
// La sonde lit le temps de calendrier (s.freelance.day), le même que le jeu.

export interface FlJoueur {
  cps: number; // clics par seconde
  buys: boolean; // accepte les outils, les propositions, les logements, les repas livrés, le compromis
  answersMaman: boolean; // décroche (jusqu'à ce que le répondeur IA se propose, qu'il accepte s'il achète)
  dinners: boolean; // va aux dîners
}
export interface FlTrace {
  exitAt: number | null; // Nora proposée
  reveals: [string, number][];
  maxGap: number; // plus long silence entre deux nouveautés, avant la sortie
  tools: string[];
  proposals: string[];
  weeks: number[]; // net de chaque semaine close
}

const DT = 0.05;

export function playFreelance(j: FlJoueur, maxSecs: number, setup?: (s: GameState) => void): { s: GameState; trace: FlTrace } {
  const s = createInitialState(0);
  startFreelance(s);
  setup?.(s);
  const f = s.freelance;
  let acc = 0;
  let exitAt: number | null = null;
  for (let t = 0; t < maxSecs && exitAt === null; t += DT) {
    acc += j.cps * DT;
    while (acc >= 1) {
      acc -= 1;
      if (canWork(s)) workClick(s);
    }
    if (canCreateCompany(s)) createCompany(s, "Pixel", 0);
    if (j.buys) {
      for (const p of visibleProposals(s)) acceptProposal(s, p.id);
      const tool = toolOffered(s);
      if (tool && canBuyTool(s, tool.id)) buyTool(s, tool.id);
      if (homeOffered(s)) moveHome(s);
      if (deliveryOffered(s)) acceptDelivery(s);
      if (compromisVisible(s)) takeCompromis(s);
      if (mamanIAOffered(s)) acceptMamanIA(s);
    }
    if (canEat(s) && s.energy <= energyMax(s) - currentHome(s).meal) eat(s);
    if (j.answersMaman && canAnswerMaman(s)) answerMaman(s);
    if (j.dinners && canGoToDinner(s)) goToDinner(s);
    tick(s, DT);
    if (noraOffered(s)) exitAt = f.day;
  }
  const reveals = Object.entries(f.revealed).sort((a, b) => a[1] - b[1]);
  const end = exitAt ?? f.day;
  const times = [0, ...reveals.map((r) => r[1]).filter((x) => x <= end), end];
  let maxGap = 0;
  for (let i = 1; i < times.length; i++) maxGap = Math.max(maxGap, times[i] - times[i - 1]);
  return {
    s,
    trace: {
      exitAt,
      reveals,
      maxGap,
      tools: Object.keys(f.tools),
      proposals: Object.keys(f.proposals),
      weeks: f.history.map((w) => w.net),
    },
  };
}
```

- [ ] **Step 2 : écrire les tests de rythme**

`tests/freelance-rythme.test.ts` :

```ts
import { describe, it, expect } from "vitest";
import { playFreelance, type FlJoueur } from "./rythme/freelance";
import { D } from "../src/engine/numbers";
import { TOOLS, PROPOSALS, FL_WEEK_SECS } from "../src/engine/content/freelance";
import { hireNora, toolOffered, visibleProposals } from "../src/engine/freelance";
import { tick } from "../src/engine/loop";

const joueur = (cps: number): FlJoueur => ({ cps, buys: true, answersMaman: true, dinners: true });
const MIN = 60;

describe("chapitre 2 : le rythme (R7)", () => {
  const runs = [2, 4, 6].map((cps) => ({ cps, ...playFreelance(joueur(cps), 30 * MIN) }));

  for (const r of runs) {
    it(`à ${r.cps} clics / s : la sortie entre 10 et 22 min, jamais plus de 180 s sans nouveauté`, () => {
      expect(r.trace.exitAt).not.toBeNull();
      expect(r.trace.exitAt!).toBeGreaterThanOrEqual(10 * MIN);
      expect(r.trace.exitAt!).toBeLessThanOrEqual(22 * MIN);
      expect(r.trace.maxGap).toBeLessThanOrEqual(180);
    });
    it(`à ${r.cps} clics / s : tous les outils et toutes les propositions ont paru`, () => {
      expect(r.trace.tools.sort()).toEqual(TOOLS.map((t) => t.id).sort());
      expect(r.trace.proposals.sort()).toEqual(PROPOSALS.map((p) => p.id).sort());
    });
  }

  it("le joueur rapide ne sort pas plus de 60 s après le joueur moyen", () => {
    const moyen = runs.find((r) => r.cps === 4)!.trace.exitAt!;
    const rapide = runs.find((r) => r.cps === 6)!.trace.exitAt!;
    expect(rapide - moyen).toBeLessThanOrEqual(60);
  });

  it("sans clic, rien ne casse : Mme Duval attend, l'argent reste à 0 €", () => {
    const { s, trace } = playFreelance({ cps: 0, buys: true, answersMaman: false, dinners: false }, 10 * MIN);
    expect(trace.exitAt).toBeNull();
    expect(s.freelance.company).toBeNull();
    expect(s.money.toNumber()).toBe(0);
    expect(Number.isFinite(s.energy)).toBe(true);
  });

  it("celui qui refuse tout garde toujours une offre à l'écran", () => {
    const { s } = playFreelance({ cps: 4, buys: false, answersMaman: true, dinners: false }, 12 * MIN);
    expect(toolOffered(s) !== undefined || visibleProposals(s).length > 0).toBe(true);
  });

  it("un départ à −2 000 € sort quand même", () => {
    const { trace } = playFreelance(joueur(4), 30 * MIN, (s) => {
      s.money = D(-2000);
    });
    expect(trace.exitAt).not.toBeNull();
    expect(trace.exitAt!).toBeLessThanOrEqual(25 * MIN);
  });

  it("embaucher Nora ne fait pas baisser le net de la semaine suivante", () => {
    const { s } = playFreelance(joueur(4), 30 * MIN);
    const before = s.freelance.history.length;
    const lastNet = s.freelance.history[before - 1].net;
    expect(hireNora(s)).toBe(true);
    // on laisse passer la fin de la semaine en cours, puis une semaine entière avec Nora, sans cliquer
    for (let t = 0; t < 2 * FL_WEEK_SECS && s.freelance.history.length < before + 2; t += 0.05) tick(s, 0.05);
    expect(s.freelance.history.length).toBe(before + 2);
    expect(s.freelance.history[before + 1].net).toBeGreaterThanOrEqual(lastNet);
  });
});
```

Le dernier test compare la semaine qui précède l'embauche (jouée en cliquant) à la première semaine pleine avec Nora (sans clic). C'est la promesse de R7 : Nora te remplace sur les bugs, tu ne perds rien à la déléguer.

- [ ] **Step 3 : lancer la sonde**

Run: `node_modules/.bin/vitest run tests/freelance-rythme.test.ts`
Expected: PASS. Si un test échoue, noter la valeur obtenue (sortie, silence le plus long, net), régler `content/freelance.ts`, puis relancer TOUTE la suite (`node_modules/.bin/vitest run`) : les tests des tâches 4 à 14 lisent les mêmes constantes.

- [ ] **Step 4 : consigner le rythme obtenu**

Ajouter à la fin de la section « v5 » de la spec (`docs/superpowers/specs/2026-09-27-refonte-progression-cynisme-design.md`) un paragraphe « Rythme mesuré » : pour 2, 4 et 6 clics / s, la minute de sortie, le silence le plus long, le net de la dernière semaine, et chaque constante réglée à cette étape avec son ancienne et sa nouvelle valeur.

- [ ] **Step 5 : commit**

```bash
git add tests/rythme/freelance.ts tests/freelance-rythme.test.ts src/engine/content/freelance.ts docs/superpowers/specs/2026-09-27-refonte-progression-cynisme-design.md
git commit -m "test(freelance): la sonde de rythme du chapitre 2

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 17: Vérification finale

**Files:**
- Modify: `docs/superpowers/specs/2026-09-27-refonte-progression-cynisme-design.md` (état « implémenté »)

- [ ] **Step 1 : toute la suite, les types, le build**

Run: `node_modules/.bin/vitest run`
Expected: PASS, aucun test ignoré.
Run: `node_modules/.bin/svelte-check --tsconfig ./tsconfig.json`
Expected: 0 erreur, 0 avertissement nouveau.
Run: `node_modules/.bin/vite build`
Expected: build réussi.

- [ ] **Step 2 : le texte joueur**

Run: `grep -nE "[—–]" src/engine/content/freelance.ts src/engine/freelance/*.ts src/ui/Freelance.svelte src/ui/freelance/*.svelte`
Expected: aucune ligne de texte joueur (un commentaire de code est toléré ; un libellé non).

- [ ] **Step 3 : une partie jouée dans le navigateur**

Avec `node_modules/.bin/vite`, choisir « 1. Plongeur », injecter une sauvegarde à la fin du plongeur (ou jouer jusqu'à l'annonce), répondre à l'annonce de Mme Duval, et vérifier :
1. l'arrivée au chapitre 2 sur la page blanche ;
2. la facture, le nom, le logo ;
3. le premier outil ;
4. la chambre (la couleur) ;
5. un lundi (la ligne « Chaque lundi »).

Puis, avec « 2. Freelance », jouer 5 minutes réelles et vérifier qu'il se passe toujours quelque chose en moins de 3 minutes. Capture d'écran de chaque palier atteint.

- [ ] **Step 4 : marquer la spec**

Dans la spec, sous le titre « Chapitre 2 détaillé : Freelance », ajouter la ligne : `État : implémenté sur la branche claude/narrative-coherence-diver-phase-363174 (plan docs/superpowers/plans/2026-09-29-chapitre-2-freelance.md).`

- [ ] **Step 5 : commit (sans pousser sur main)**

```bash
git add docs/superpowers/specs/2026-09-27-refonte-progression-cynisme-design.md
git commit -m "docs(freelance): chapitre 2 implémenté

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Ne pas pousser sur `main` : Alexandre valide la partie jouée d'abord.
