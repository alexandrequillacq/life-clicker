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
    label: "Lave-vaisselle",
    baseCost: D(1),
    growth: 1.15,
    baseOutput: D(0.1),
    unlockAtMoney: D(0.5),
  },
];

export const GENERATORS_BY_ID: Record<string, GeneratorDef> =
  Object.fromEntries(GENERATORS.map((g) => [g.id, g]));
