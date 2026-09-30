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
  const l = Number.isFinite(logo) ? Math.floor(logo) : 0;
  f.company = { name, logo: Math.max(0, Math.min(LOGO_COUNT - 1, l)) };
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
