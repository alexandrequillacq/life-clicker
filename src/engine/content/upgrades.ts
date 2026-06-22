import { D, type Decimal } from "../numbers";

export type UpgradePhase = "plonge" | "dev" | "biz";

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
  grantCash?: Decimal; // biz : injection de capital ponctuelle (levée de fonds)
  setGpuProductBoost?: number; // biz : monte le boost par GPU des produits (data center)
  automatesLife?: boolean; // biz : automatise la vie (confort attractif ; graine du piège, lu en P5)
}

export const UPGRADES: UpgradeDef[] = [
  // --- Plonge ---
  { id: "gants", label: "Gants de plonge", cost: D(0.5), unlockAtMoney: D(0.2), phase: "plonge", setDishesPerClick: 2 },
  { id: "eponge", label: "Meilleure éponge", cost: D(2), unlockAtMoney: D(1.5), phase: "plonge", requires: "gants", setDishesPerClick: 4 },
  { id: "coup_de_main", label: "Prendre le coup de main", cost: D(5), unlockAtMoney: D(4), phase: "plonge", requires: "eponge", unlocksHand: true, setHandRate: 10 },
  { id: "gants_pro", label: "Gants pro", cost: D(10), unlockAtMoney: D(7), phase: "plonge", requires: "coup_de_main", setDishesPerClick: 8, setHandRate: 20 },

  // --- Développeur (multiplient la valeur d'un bug résolu) ---
  { id: "ide", label: "Meilleur IDE", cost: D(120), unlockAtMoney: D(90), phase: "dev", mulClickValue: 2 },
  { id: "copilot", label: "Assistant de code IA", cost: D(1500), unlockAtMoney: D(1200), phase: "dev", requires: "ide", mulClickValue: 3 },

  // --- Pont IA : automatiser le travail (sain), prépare l'armée d'IA de la future boîte ---
  // Le livre qui apprend à se servir de l'IA débloque l'orchestration d'agents.
  { id: "orchestrer_ia", label: "Lire « How to setup Claude Code »", cost: D(5000), unlockAtMoney: D(4000), phase: "dev", requires: "copilot", unlocksAi: true },
  { id: "laisser_ia", label: "Laisser l'IA résoudre les bugs", cost: D(9000), unlockAtMoney: D(7000), phase: "dev", requires: "orchestrer_ia", startsAi: true },

  // --- Entrepreneur : leviers de la boîte d'IA ---
  // Levées de fonds : injection de capital ponctuelle (cash one-shot), pas un multiplicateur.
  { id: "leve_amorcage", label: "Boucler une levée d'amorçage", cost: D(0), unlockAtMoney: D(80000), phase: "biz", grantCash: D(150000) },
  { id: "leve_serie_a", label: "Boucler un tour de série A", cost: D(0), unlockAtMoney: D(500000), phase: "biz", requires: "leve_amorcage", grantCash: D(800000) },
  { id: "leve_serie_b", label: "Boucler un tour de série B", cost: D(0), unlockAtMoney: D(2500000), phase: "biz", requires: "leve_serie_a", grantCash: D(4000000) },
  // Data center : seul multiplicateur, justifié (plus d'infra → chaque GPU produit plus).
  { id: "data_center", label: "Construire un data center", cost: D(1500000), unlockAtMoney: D(1200000), phase: "biz", setGpuProductBoost: 0.15 },
  // Graine du piège : automatiser la vie (confort célébré, jamais commenté).
  { id: "nounou", label: "Engager une nounou", cost: D(120000), unlockAtMoney: D(100000), phase: "biz", automatesLife: true },
];

export const UPGRADES_BY_ID: Record<string, UpgradeDef> =
  Object.fromEntries(UPGRADES.map((u) => [u.id, u]));
