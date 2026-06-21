import { D, type Decimal } from "../numbers";

export type GeneratorKind = "plonge" | "dev";

export interface GeneratorDef {
  id: string;
  label: string;
  baseCost: Decimal;
  growth: number;
  output: Decimal; // plonge → assiettes/s par unité ; dev → €/s par unité
  unlockAtMoney: Decimal; // seuil de révélation
  kind: GeneratorKind;
}

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
  {
    id: "equipe",
    label: "Monter une équipe",
    baseCost: D(25000),
    growth: 1.17,
    output: D(350),
    unlockAtMoney: D(18000),
    kind: "dev",
  },
];

export const GENERATORS_BY_ID: Record<string, GeneratorDef> =
  Object.fromEntries(GENERATORS.map((g) => [g.id, g]));
