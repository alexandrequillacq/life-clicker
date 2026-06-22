import { D, type Decimal } from "../numbers";
import type { Job } from "../state";

export type GeneratorKind = "plonge" | "dev" | "ia" | "biz" | "audience";

/** Quels générateurs sont achetables selon le métier courant. */
export function generatorVisible(kind: GeneratorKind, job: Job): boolean {
  switch (kind) {
    case "plonge":
      return job === "plongeur";
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
  output: Decimal; // plonge → assiettes/s ; dev/biz → €/s ; ia → ignoré (voir aiIncomePerSec)
  unlockAtMoney: Decimal; // seuil de révélation
  kind: GeneratorKind;
  requiresFlag?: string; // ne se révèle que si ce flag est posé
  scalesWithGpu?: boolean; // biz : la production est multipliée par (1 + gpuProductBoost × nbGPU)
  bonusGpu?: number; // à l'achat, ajoute ce nombre de GPU au parc (acquisition qui absorbe l'infra)
  salaryPerSec?: Decimal; // dev : salaire versé en continu (soustrait du brut → rendement net)
  redundancyPerGpu?: number; // dev : brut érodé par GPU (l'IA fait peu à peu le travail des juniors)
}

// L'IA résout les bugs en continu (sans énergie) ; chaque GPU multiplie son débit.
// Ces GPU persistent et deviennent l'armée d'IA de la boîte fondée en P3.
export const AI_BASE_INCOME = 70; // €/s de base une fois l'IA activée
export const GPU_MULT_PER_UNIT = 0.3; // chaque GPU : +30 % du débit IA

// Prime versée par junior lors du remplacement de l'équipe par l'IA (one-shot, irréversible).
export const JUNIOR_SETTLEMENT = 1200;

export const GENERATORS: GeneratorDef[] = [
  // Plonge : automatisation par assiettes (s'arrête quand on quitte le métier).
  {
    id: "lave_vaisselle",
    label: "Lave-vaisselle",
    baseCost: D(8),
    growth: 1.15,
    output: D(4), // assiettes/s
    unlockAtMoney: D(6),
    kind: "plonge",
  },
  {
    id: "lave_vaisselle_pro",
    label: "Lave-vaisselle pro",
    baseCost: D(90),
    growth: 1.15,
    output: D(20), // assiettes/s : la machine industrielle qui fait accélérer la plonge
    unlockAtMoney: D(70),
    kind: "plonge",
  },
  // Développeur : une équipe de juniors résout les bugs (€/s, sans énergie).
  // Brut érodé par les GPU (l'IA fait peu à peu leur travail) moins un salaire fixe :
  // utile au début, puis pure charge une fois l'IA forte → on est poussé à les remplacer.
  {
    id: "junior",
    label: "Embaucher un junior",
    baseCost: D(60),
    growth: 1.16,
    output: D(14), // brut €/s par junior (avant salaire et redondance IA)
    unlockAtMoney: D(40),
    kind: "dev",
    salaryPerSec: D(6),
    redundancyPerGpu: 1.5,
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
    label: "Mettre un produit IA en marché",
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
];

export const GENERATORS_BY_ID: Record<string, GeneratorDef> =
  Object.fromEntries(GENERATORS.map((g) => [g.id, g]));
