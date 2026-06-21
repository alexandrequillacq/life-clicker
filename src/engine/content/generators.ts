import { D, type Decimal } from "../numbers";

export interface GeneratorDef {
  id: string;
  label: string;
  baseCost: Decimal;
  growth: number;
  dishesPerSec: Decimal; // débit en assiettes/s par unité (indépendant de l'énergie)
  unlockAtMoney: Decimal; // seuil de révélation
}

export const GENERATORS: GeneratorDef[] = [
  {
    id: "lave_vaisselle",
    label: "Lave-vaisselle",
    baseCost: D(8),
    growth: 1.15,
    dishesPerSec: D(4),
    unlockAtMoney: D(6),
  },
];

export const GENERATORS_BY_ID: Record<string, GeneratorDef> =
  Object.fromEntries(GENERATORS.map((g) => [g.id, g]));
