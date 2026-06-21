import { D, type Decimal } from "../numbers";

export type UpgradePhase = "plonge" | "dev";

export interface UpgradeDef {
  id: string;
  label: string;
  cost: Decimal;
  unlockAtMoney: Decimal; // seuil de révélation
  phase: UpgradePhase; // plonge (métier plongeur) ou dev (métiers dev)
  requires?: string; // upgrade prérequis (enchaîne la séquence)
  setDishesPerClick?: number; // plonge : fixe les assiettes/clic
  unlocksHand?: boolean; // plonge : débloque le lavage continu à la main
  setHandRate?: number; // plonge : fixe le débit continu (assiettes/s)
  mulClickValue?: number; // dev : multiplie la valeur du clic (résoudre un bug)
  unlocksAi?: boolean; // dev : débloque l'orchestration d'agents IA
  startsAi?: boolean; // dev : active l'IA qui résout les bugs en continu (révèle les GPU)
}

export const UPGRADES: UpgradeDef[] = [
  // --- Plonge ---
  { id: "gants", label: "Gants de plonge", cost: D(0.5), unlockAtMoney: D(0.2), phase: "plonge", setDishesPerClick: 2 },
  { id: "eponge", label: "Meilleure éponge", cost: D(2), unlockAtMoney: D(1.5), phase: "plonge", requires: "gants", setDishesPerClick: 4 },
  { id: "coup_de_main", label: "Prendre le coup de main", cost: D(5), unlockAtMoney: D(4), phase: "plonge", requires: "eponge", unlocksHand: true, setHandRate: 10 },
  { id: "gants_pro", label: "Gants pro", cost: D(15), unlockAtMoney: D(12), phase: "plonge", requires: "coup_de_main", setDishesPerClick: 8, setHandRate: 20 },

  // --- Développeur (multiplient la valeur d'un bug résolu) ---
  { id: "ide", label: "Meilleur IDE", cost: D(120), unlockAtMoney: D(90), phase: "dev", mulClickValue: 2 },
  { id: "copilot", label: "Assistant de code IA", cost: D(1500), unlockAtMoney: D(1200), phase: "dev", requires: "ide", mulClickValue: 3 },

  // --- Pont IA : automatiser le travail (sain), prépare l'armée d'IA de la future boîte ---
  { id: "orchestrer_ia", label: "Orchestrer des agents IA", cost: D(5000), unlockAtMoney: D(4000), phase: "dev", requires: "copilot", unlocksAi: true },
  { id: "laisser_ia", label: "Laisser l'IA résoudre les bugs", cost: D(9000), unlockAtMoney: D(7000), phase: "dev", requires: "orchestrer_ia", startsAi: true },
];

export const UPGRADES_BY_ID: Record<string, UpgradeDef> =
  Object.fromEntries(UPGRADES.map((u) => [u.id, u]));
