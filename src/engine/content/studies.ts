import { D, type Decimal } from "../numbers";

// Études : « Lire un livre » coûte de l'argent (acheter des livres) et fait
// monter le niveau. Le but n'est pas de mieux gagner à la plonge (un plongeur
// instruit ne lave pas mieux), mais de débloquer un vrai métier.
export const BOOK_BASE_COST: Decimal = D(5);
export const BOOK_GROWTH = 1.5;
export const STUDY_THRESHOLD = 5; // niveaux requis pour postuler en bureau

// Métier de bureau : « Traiter un dossier » rapporte bien plus qu'une assiette.
export const OFFICE_VALUE_PER_CLICK: Decimal = D(0.5);
