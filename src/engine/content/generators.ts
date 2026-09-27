import { D, type Decimal } from "../numbers";
import type { Job } from "../state";

export type GeneratorKind = "dev" | "ia" | "biz" | "audience" | "emprise";

/** Quels générateurs sont achetables selon le métier courant. */
export function generatorVisible(kind: GeneratorKind, job: Job): boolean {
  switch (kind) {
    case "biz":
      return job === "entrepreneur";
    case "audience":
      return job === "celebrite";
    default: // dev, ia
      return job === "developpeur" || job === "lead_dev" || job === "cto" || job === "entrepreneur";
  }
}

export interface GeneratorDef {
  id: string;
  label: string;
  baseCost: Decimal;
  growth: number;
  output: Decimal; // dev/biz → €/s ; ia → ignoré (voir aiIncomePerSec)
  unlockAtMoney: Decimal; // seuil de révélation
  kind: GeneratorKind;
  requiresFlag?: string; // ne se révèle que si ce flag est posé
  scalesWithGpu?: boolean; // biz : la production est multipliée par (1 + gpuProductBoost × nbGPU)
  bonusGpu?: number; // à l'achat, ajoute ce nombre de GPU au parc (acquisition qui absorbe l'infra)
  salaryPerSec?: Decimal; // dev : salaire versé en continu (soustrait du brut → rendement net)
  redundancyPerGpu?: number; // dev : brut érodé par GPU (l'IA fait peu à peu le travail de l'équipe)
  jobs?: Job[]; // si défini, n'est visible/achetable que pour ces métiers (sinon : selon kind)
  team?: boolean; // membre de l'équipe humaine (viré en bloc par « Remplacer l'équipe par l'IA »)
  settlementPerHead?: number; // prime de départ versée par tête lors du remplacement par l'IA
}

// L'IA résout les bugs en continu (sans énergie) ; chaque GPU multiplie son débit.
// Ces GPU persistent et deviennent l'armée d'IA de la boîte fondée en P3.
export const AI_BASE_INCOME = 70; // €/s de base une fois l'IA activée
export const GPU_MULT_PER_UNIT = 0.3; // chaque GPU : +30 % du débit IA

// Primes versées par tête lors du remplacement de l'équipe par l'IA (one-shot, irréversible).
export const JUNIOR_SETTLEMENT = 1200;
export const SENIOR_SETTLEMENT = 4000;

// Acte III : l'Emprise est produite par la MÊME armée de GPU (l'IA contrôle aussi le monde).
// C'est ce couplage qui rend vrai « tu as automatisé jusqu'au pouvoir » (et donc creux).
export const EMPRISE_GPU_BOOST = 0.15;

export const GENERATORS: GeneratorDef[] = [
  // Équipe humaine (manager+). Brut érodé par les GPU (l'IA fait peu à peu leur travail)
  // moins un salaire fixe : utile au début, puis pure charge une fois l'IA forte → on est
  // poussé à remplacer toute l'équipe par l'IA. On n'embauche qu'à partir du métier de manager.
  {
    id: "junior",
    label: "Embaucher un junior",
    baseCost: D(60),
    growth: 1.16,
    output: D(14), // brut €/s par junior (avant salaire et redondance IA)
    unlockAtMoney: D(40),
    kind: "dev",
    jobs: ["lead_dev", "cto", "entrepreneur"],
    salaryPerSec: D(6),
    redundancyPerGpu: 1.5,
    team: true,
    settlementPerHead: JUNIOR_SETTLEMENT,
  },
  {
    id: "senior",
    label: "Embaucher un dev senior",
    baseCost: D(600),
    growth: 1.18,
    output: D(45), // brut €/s : bien plus fort qu'un junior dans la fenêtre CTO à faible parc GPU
    unlockAtMoney: D(1500),
    kind: "dev",
    jobs: ["cto", "entrepreneur"],
    salaryPerSec: D(18),
    redundancyPerGpu: 5,
    team: true,
    settlementPerHead: SENIOR_SETTLEMENT,
  },
  // IA : le GPU multiplie le débit de l'IA (apex de fin d'Acte, fidèle à la thèse :
  // automatiser le travail avec l'IA est le plus puissant).
  {
    id: "gpu",
    label: "Ajouter un GPU",
    baseCost: D(9000),
    growth: 1.18,
    output: D(0), // non utilisé : l'effet passe par le multiplicateur IA
    unlockAtMoney: D(9000),
    kind: "ia",
    requiresFlag: "aiResolving",
  },
  // Boîte d'IA (entrepreneur) : les produits tournent sur l'armée de GPU.
  {
    id: "produit_ia",
    label: "Lancer un produit IA",
    baseCost: D(60000),
    growth: 1.18,
    output: D(1200), // €/s × (1 + gpuProductBoost × nbGPU)
    unlockAtMoney: D(45000),
    kind: "biz",
    scalesWithGpu: true,
  },
  {
    id: "acquisition",
    label: "Racheter une boîte d'IA",
    baseCost: D(600000),
    growth: 1.22,
    output: D(18000), // €/s
    unlockAtMoney: D(300000),
    kind: "biz",
    bonusGpu: 2,
  },
  // Célébrité : les campagnes d'image produisent des followers/s (vanité passive).
  {
    id: "campagne",
    label: "Lancer une campagne d'image",
    baseCost: D(25000),
    growth: 1.18,
    output: D(2000), // followers/s
    unlockAtMoney: D(0),
    kind: "audience",
  },
  // Acte III : appareil de pouvoir. Acheté en €, produit de l'Emprise/s, scalé par l'armée de GPU.
  {
    id: "propagande",
    label: "Installer une ferme à propagande",
    baseCost: D(2e6),
    growth: 1.18,
    output: D(5),
    unlockAtMoney: D(1.5e6),
    kind: "emprise",
    jobs: ["politique", "president", "monde", "empereur"],
  },
  {
    id: "influence",
    label: "Tisser un réseau d'influence",
    baseCost: D(1.5e7),
    growth: 1.2,
    output: D(40),
    unlockAtMoney: D(1e7),
    kind: "emprise",
    jobs: ["politique", "president", "monde", "empereur"],
  },
  // Les anciens générateurs d'Emprise président/monde/empereur (surveillance de masse, capture des
  // médias, drones, surveillance totale, sondes) sont remplacés par les damiers de contrôle
  // (content/control.ts) et les sondes auto-répliquantes (content/cosmos.ts). Ne restent ici que
  // propagande et influence (générateurs répétables de la phase politique) et la moissonneuse.
  {
    id: "moissonneuse",
    label: "Construire une moissonneuse stellaire",
    baseCost: D(1.5e12),
    growth: 1.26,
    output: D(5e8),
    unlockAtMoney: D(1e12),
    kind: "emprise",
    jobs: ["empereur"],
  },
];

export const GENERATORS_BY_ID: Record<string, GeneratorDef> =
  Object.fromEntries(GENERATORS.map((g) => [g.id, g]));

/** Un générateur est-il visible/achetable au métier courant (gate par jobs sinon par kind) ? */
export function generatorAvailable(def: GeneratorDef, job: Job): boolean {
  if (def.jobs) return def.jobs.includes(job);
  return generatorVisible(def.kind, job);
}
