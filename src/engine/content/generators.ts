import { D, type Decimal } from "../numbers";

export type GeneratorKind = "plonge" | "dev" | "ia" | "biz";

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
}

// L'IA résout les bugs en continu (sans énergie) ; chaque GPU multiplie son débit.
// Ces GPU persistent et deviennent l'armée d'IA de la boîte fondée en P3.
export const AI_BASE_INCOME = 80; // €/s de base une fois l'IA activée
export const GPU_MULT_PER_UNIT = 0.25; // chaque GPU : +25 % du débit IA

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
  // Développeur : automatisation qui résout des bugs toute seule (€/s, sans énergie).
  {
    id: "tests",
    label: "Écrire des tests",
    baseCost: D(20),
    growth: 1.15,
    output: D(1), // €/s
    unlockAtMoney: D(12),
    kind: "dev",
  },
  {
    id: "ci",
    label: "Pipeline CI/CD",
    baseCost: D(180),
    growth: 1.15,
    output: D(8),
    unlockAtMoney: D(130),
    kind: "dev",
  },
  {
    id: "junior",
    label: "Embaucher un junior",
    baseCost: D(2500),
    growth: 1.16,
    output: D(45),
    unlockAtMoney: D(1800),
    kind: "dev",
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
];

export const GENERATORS_BY_ID: Record<string, GeneratorDef> =
  Object.fromEntries(GENERATORS.map((g) => [g.id, g]));
