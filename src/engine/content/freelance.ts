// Chapitre 2 : le développeur freelance. Tu construis des sites (payés à la livraison) et tu les entretiens
// (payés chaque lundi) ; chaque site entretenu envoie des bugs, qui passent en tête du carnet. Un bug encore
// ouvert le lundi, et ce client ne paie pas son entretien. La sortie : embaucher Nora pour corriger les bugs.
// Zéro RNG : tout est daté. Tout le réglage vit ici ; le moteur est dans engine/freelance/.
// Spec : docs/superpowers/specs/2026-09-27-refonte-progression-cynisme-design.md, « Chapitre 2 détaillé » (v1 à v5).
import { DAY_NAMES, LIVRET_RATE } from "./plonge";

export { DAY_NAMES, LIVRET_RATE };

// --- Calendrier (le même qu'au plongeur : le temps file) ---
export const FL_DAY_SECS = 15;
export const FL_WEEK_SECS = 7 * FL_DAY_SECS;
export const MONDAY = 0;
export const WEDNESDAY = 2;
export const THURSDAY = 3;
export const FRIDAY = 4;
export const SATURDAY = 5;
export const SUNDAY = 6;

// --- Les nouveautés : une information à la fois ---
export const FL_NOVELTY_GAP = 35; // au moins 35 s entre deux nouveautés que le jeu révèle de lui-même
export const KEEP_UP_SECS = 6; // carnet vide pendant 6 s : tu suis, une proposition aux clients paraît
export const BEHIND_SECS = 6; // en retard pendant 6 s : un outil se propose
export const BEHIND_LINES = 2500; // plus de 2 500 lignes en attente : tu ne suis plus
export const BEHIND_BUGS = 3; // ou 3 bugs en file
export const PROPOSAL_LATE = 50; // une proposition paraît au plus tard 50 s après la nouveauté précédente (v5 : à 120, « recommander » ne paraissait jamais avant la sortie)
export const TOOL_LATE = 60; // un outil se propose au plus tard 60 s après le précédent (v4 : le joueur rapide n'attend plus)

// --- Le travail ---
export const START_LPC = 5; // lignes par clic au départ
export const BUG_CLICKS = 10; // un bug se corrige en 10 clics, quel que soit l'outil
export const THEME_LINES = 0.7; // thème pro : vitrines et boutiques à 70 % de leurs lignes
export const FORMATION_BUG_RATE = 0.5; // formation aux tests : deux fois moins de bugs
export const RED_EVERY = 3; // avec les tests, une livraison sur trois bute sur un test rouge
export const COMPROMIS_LINES = 0.8; // test désactivé : les commandes suivantes ont 20 % de lignes en moins
export const DUVAL_FIRST_BUG = 40; // le premier bug de Mme Duval arrive 40 s après le contrat d'entretien
export const FIRST_BUG_MIN = 30; // le premier bug d'un site livré arrive entre 30 et 100 s après la livraison
export const FIRST_BUG_STEP = 23;
export const FIRST_BUG_SPREAD = 70;
export const EVENING_BUGS = 2; // « Répondre aux clients le soir » : deux bugs de plus chaque vendredi
export const EXIT_BUGS = 12; // la sortie se propose à 12 bugs arrivés en 7 jours (ou 12 en file)

// --- La vie ---
export const FL_ENERGY_REGEN = 0.3; // énergie / s, le repos
export const CLICK_ENERGY = 0.6; // chaque clic coûte un peu d'énergie
export const TIRED_BELOW = 40; // sous 40, un clic compte moitié moins (v4 : 25 ne mordait qu'au-delà de 4 clics / s)
export const TIRED_SHARE = 0.5;
export const MEALS_PER_DAY = 2;
export const MEALS_BEFORE_DELIVERY = 30; // les repas livrés se proposent après 30 repas faits à la main
export const MEAL_PRICE = 11; // un repas livré, payé à la commande (un par jour)
export const DINNER_ENERGY = 40;
export const FIRST_DINNER_DAY = 7; // les amis invitent à partir de la deuxième semaine
export const FRIENDS_MAX_MISSES = 3; // trois dîners manqués d'affilée : ils n'invitent plus
export const OUTING_ENERGY = 30;
export const HOME_RENT_FACTOR = 5; // un logement se propose quand les entrées d'une semaine couvrent 5 fois son loyer

// --- La sortie ---
export const NORA_SALARY = 600; // Nora en alternance, chaque lundi, en charges pro
export const NORA_BUGS_PER_DAY = 3; // du lundi au vendredi

// --- La micro-entreprise ---
export const COMPANY_NAME_MAX = 24;
export const COMPANY_DEFAULT_NAME = "Atelier web";
export const LOGO_COUNT = 5;
export const LOGO_LABELS = ["Chevrons", "Accolades", "Terminal", "Navigateur", "Initiale"];

export const AGE_FREELANCE = 24;
export const FL_OFFLINE_CAP = 600; // hors-ligne plafonné à 10 min, comme au plongeur

// --- Les commandes ---
export type Kind = "vitrine" | "appli" | "boutique";
export interface KindDef {
  lines: number;
  price: number; // € à la livraison (sur la taille nominale : réutiliser du code réduit le travail, pas le prix)
  fee: number; // € d'entretien chaque lundi
  label: string;
}
export const KINDS: Record<Kind, KindDef> = {
  vitrine: { lines: 1200, price: 600, fee: 50, label: "Site vitrine" },
  appli: { lines: 4000, price: 2400, fee: 160, label: "Appli" },
  boutique: { lines: 3000, price: 1900, fee: 130, label: "Boutique en ligne" },
};

export interface ClientDef {
  name: string; // « Boulangerie Duval »
  chez: string; // « la Boulangerie Duval » (« Bug chez la Boulangerie Duval »)
  payer: string; // qui paie : « Mme Duval »
}
const client = (name: string, chez: string, payer = name): ClientDef => ({ name, chez, payer });
export const DUVAL = client("Boulangerie Duval", "la Boulangerie Duval", "Mme Duval");
export const PETIT = client("Club de foot de M. Petit", "le Club de foot de M. Petit", "M. Petit");
/** Les clients suivants, pris dans l'ordre, par type de commande. */
export const CLIENTS: Record<Kind, ClientDef[]> = {
  vitrine: [
    client("Garage Leroy", "le Garage Leroy"),
    client("Pharmacie Morel", "la Pharmacie Morel"),
    client("Fleuriste Martin", "la Fleuriste Martin"),
    client("Cave Girard", "la Cave Girard"),
    client("Taxi Mercier", "le Taxi Mercier"),
    client("Épicerie Roux", "l'Épicerie Roux"),
    client("Salle de sport Lopez", "la Salle de sport Lopez"),
    client("Coiffure Nadia", "Coiffure Nadia"),
    client("Plombier Faure", "le Plombier Faure"),
    client("Librairie Colin", "la Librairie Colin"),
    client("Boucherie Lambert", "la Boucherie Lambert"),
    client("Pressing Dubois", "le Pressing Dubois"),
  ],
  appli: [
    client("Club de judo Masson", "le Club de judo Masson"),
    client("Auto-école Blanc", "l'Auto-école Blanc"),
    client("Crèche Les Lutins", "la Crèche Les Lutins"),
    client("Cabinet dentaire Roche", "le Cabinet dentaire Roche"),
    client("Traiteur Benali", "le Traiteur Benali"),
  ],
  boutique: [
    client("Épicerie bio Garnier", "l'Épicerie bio Garnier"),
    client("Chocolaterie Perrin", "la Chocolaterie Perrin"),
    client("Fromagerie Vidal", "la Fromagerie Vidal"),
    client("Opticien Arnaud", "l'Opticien Arnaud"),
    client("Vins Moreau", "Vins Moreau"),
    client("Bijouterie Klein", "la Bijouterie Klein"),
  ],
};

/** Ce qui casse, par type de site (pris dans l'ordre). */
export const BUG_TEXTS: Record<Kind, string[]> = {
  vitrine: [
    "Les horaires du dimanche ont disparu.",
    "Le plan d'accès montre la mauvaise rue.",
    "Le numéro de téléphone a disparu.",
    "Les photos ne chargent plus sur téléphone.",
  ],
  appli: [
    "L'inscription refuse les moins de 12 ans.",
    "Les notifications arrivent en double.",
    "La connexion se coupe toute seule.",
  ],
  boutique: [
    "Le paiement refuse les cartes.",
    "Le panier se vide tout seul.",
    "Les frais de port s'affichent deux fois.",
  ],
};

// --- Tes clients : ce que tu leur proposes (gratuit, une à la fois, quand tu suis) ---
export interface ProposalDef {
  id: string;
  cta: string;
  lines: string[];
  weekly?: Kind[]; // commandes qui arrivent en plus chaque lundi
  oneShot?: Kind; // une commande, tout de suite (de M. Petit)
  maintDuval?: boolean; // le site de Mme Duval devient un contrat d'entretien
  maintAll?: boolean; // chaque site livré ensuite devient un contrat d'entretien
  evening?: boolean; // des bugs arrivent aussi le vendredi soir
}
export const PROPOSALS: ProposalDef[] = [
  {
    id: "entretien_duval",
    cta: "Proposer un contrat d'entretien à Mme Duval",
    lines: ["50 € chaque lundi.", "Ses bugs arrivent dans ton carnet."],
    maintDuval: true,
  },
  { id: "cartes", cta: "Laisser tes cartes de visite à la boulangerie", lines: ["+1 site vitrine par semaine (600 € chacun)."], weekly: ["vitrine"] },
  { id: "profil", cta: "Créer ton profil sur un site de freelances", lines: ["+2 sites vitrines par semaine."], weekly: ["vitrine", "vitrine"] },
  {
    id: "entretien_tous",
    cta: "Proposer l'entretien à chaque livraison",
    lines: ["Chaque site livré paie son entretien chaque lundi.", "Chaque site entretenu envoie des bugs."],
    maintAll: true,
  },
  { id: "petit", cta: "Proposer une appli à M. Petit", lines: ["Une appli de 4 000 lignes, 2 400 € à la livraison."], oneShot: "appli" },
  {
    id: "soir",
    cta: "Répondre aux clients le soir",
    lines: ["+1 boutique en ligne par semaine (1 900 € chacune).", "Le vendredi soir, des bugs arrivent aussi."],
    weekly: ["boutique"],
    evening: true,
  },
  { id: "recommander", cta: "Demander à tes clients de te recommander", lines: ["+1 appli et +1 boutique par semaine."], weekly: ["appli", "boutique"] },
];
export const PROPOSAL_BY_ID: Record<string, ProposalDef> = Object.fromEntries(PROPOSALS.map((p) => [p.id, p]));

// --- Les outils : un à la fois, dans l'ordre, quand tu ne suis plus (ou au plus tard TOOL_LATE après le précédent) ---
export interface ToolDef {
  id: string;
  cta: string;
  name: string; // dans la liste de ce que tu possèdes
  cost: number; // achat unique
  sub: number; // abonnement, chaque lundi (payé d'avance pour la première semaine)
  lines: string[];
  owned: string; // la ligne une fois acheté
  lpc?: number;
  aiRate?: number; // lignes / s que l'IA écrit seule, sur les commandes seulement
  theme?: number;
  formation?: boolean;
  replaces?: string; // l'abonnement qu'il remplace
  weekly?: Kind[];
  needs?: "chambre" | "bugs"; // une chambre à toi (pas de deuxième écran sur le canapé de Sam), ou 3 bugs en 7 jours
}
export const TOOLS: ToolDef[] = [
  { id: "editeur", cta: "Acheter une licence d'éditeur", name: "Licence d'éditeur", cost: 250, sub: 0, lines: ["Par clic : 5 → 8 lignes."], owned: "5 → 8 lignes par clic", lpc: 8 },
  { id: "ecran", cta: "Acheter un deuxième écran", name: "Deuxième écran", cost: 400, sub: 0, lines: ["Par clic : 8 → 12 lignes."], owned: "8 → 12 lignes par clic", lpc: 12, needs: "chambre" },
  {
    id: "autocompletion",
    cta: "S'abonner à l'autocomplétion par IA",
    name: "Autocomplétion par IA",
    cost: 0,
    sub: 5,
    lines: ["Par clic : 12 → 20 lignes.", "5 € chaque lundi, en charges pro."],
    owned: "12 → 20 lignes par clic, 5 € chaque lundi",
    lpc: 20,
  },
  {
    id: "ia_pages",
    cta: "S'abonner à l'IA qui écrit les pages neuves",
    name: "L'IA écrit les pages neuves",
    cost: 0,
    sub: 25,
    lines: ["20 lignes / s, même sans toi, sur les commandes.", "Les bugs restent à toi.", "25 € chaque lundi, en charges pro."],
    owned: "20 lignes / s, même sans toi",
    aiRate: 20,
  },
  {
    id: "theme",
    cta: "Acheter un thème pro",
    name: "Thème pro",
    cost: 2000,
    sub: 0,
    lines: ["Sites vitrines et boutiques : 30 % de lignes en moins, même prix."],
    owned: "30 % de lignes en moins sur les vitrines et les boutiques",
    theme: THEME_LINES,
  },
  {
    id: "formation",
    cta: "Suivre une formation aux tests automatiques",
    name: "Tes tests automatiques",
    cost: 3000,
    sub: 0,
    lines: ["Deux fois moins de bugs."],
    owned: "Deux fois moins de bugs",
    formation: true,
    needs: "bugs",
  },
  {
    id: "ia_pro",
    cta: "Passer à l'abonnement pro de l'IA",
    name: "L'IA écrit les pages neuves",
    cost: 0,
    sub: 50,
    lines: ["L'IA : 20 → 150 lignes / s.", "50 € chaque lundi au lieu de 25 €."],
    owned: "150 lignes / s, même sans toi",
    aiRate: 150,
    replaces: "ia_pages",
  },
  {
    id: "ia_mail",
    cta: "S'abonner à l'IA de ta boîte mail",
    name: "L'IA de ta boîte mail",
    cost: 0,
    sub: 10,
    lines: ["Elle répond à tes clients le soir.", "+1 appli et +1 boutique par semaine.", "10 € chaque lundi, en charges pro."],
    owned: "Répond à tes clients le soir",
    weekly: ["appli", "boutique"],
  },
];
export const TOOL_BY_ID: Record<string, ToolDef> = Object.fromEntries(TOOLS.map((t) => [t.id, t]));

// --- Le logement : payé chaque lundi ; il agrandit l'énergie maximale et le repas ---
export interface HomeDef {
  id: string;
  cta: string;
  label: string; // « Logement : … »
  rent: number;
  energyMax: number;
  meal: number; // énergie d'un repas (fait ou livré)
  souvenir: string;
}
export const HOMES: HomeDef[] = [
  { id: "canape", cta: "", label: "le canapé convertible de Sam", rent: 0, energyMax: 100, meal: 10, souvenir: "" },
  { id: "chambre", cta: "Louer une chambre chez l'habitant", label: "une chambre chez l'habitant", rent: 110, energyMax: 120, meal: 10, souvenir: "Tu as posé ton sac dans ta chambre." },
  { id: "t1", cta: "Emménager dans un T1 de 25 m²", label: "un T1 de 25 m²", rent: 190, energyMax: 140, meal: 15, souvenir: "Sam t'a aidé à porter tes cartons." },
  { id: "deux_pieces", cta: "Emménager dans un deux-pièces avec un bureau", label: "un deux-pièces avec un bureau", rent: 380, energyMax: 170, meal: 15, souvenir: "Sam t'a aidé à porter tes cartons, encore." },
];

// --- Les sorties : un mercredi sur deux, en alternance ---
export const OUTINGS = [
  { cta: "Aller au cinéma", price: 12, souvenir: "Tu as vu un film au cinéma." },
  { cta: "Aller au restaurant du coin", price: 25, souvenir: "Tu as dîné au restaurant du coin." },
];

export const MAMAN_LINES = [
  "Maman t'a demandé si tu manges bien.",
  "Maman t'a raconté son jardin.",
  "Maman t'a demandé quand tu viens la voir.",
];

// --- Ce que disent les clients (la ligne du haut, comme le chef au plongeur) ---
export const QUOTES: Record<string, string> = {
  debut: "Mme Duval : « Mon neveu devait le faire, mais il est parti à Lyon. »",
  facture: "Mme Duval : « Une cliente m'a demandé qui avait fait mon site. »",
  entretien: "Pharmacie Morel : « Vous pouvez ajouter nos horaires de garde ? »",
  petit: "M. Petit : « Les parents adorent l'appli. Enfin, ceux qui arrivent à s'inscrire. »",
  gateaux: "Mme Duval : « J'ai perdu deux commandes de gâteaux ce week-end. Je ne sais pas pourquoi. »",
};

export const TEXTES = {
  // colonnes et en-tête
  colWork: "Travail",
  colLife: "Ta vie",
  moneyLabel: "Argent",
  money: (e: string) => `Argent : ${e}`,
  dayWeek: (day: string, week: number) => `${day}, semaine ${week}`,
  age: (n: number) => `${n} ans`,
  mondayLine: (parts: string[]) => `Chaque lundi : ${parts.join(", ")}`,
  mondayEntretien: (e: string) => `+${e} d'entretien`,
  mondayRent: (e: string) => `−${e} de loyer`,
  mondaySubs: (e: string, n: number) => (n > 1 ? `−${e} d'abonnements` : `−${e} d'abonnement`),
  mondayNora: (e: string) => `−${e} pour Nora`,
  // le carnet
  carnetTitle: "Carnet de commandes",
  orderTitle: (kind: string, chez: string) => `${kind} pour ${chez}`,
  orderProgress: (done: number, lines: number) => `${done} / ${lines} lignes`,
  orderPrice: (e: string) => `${e} à la livraison`,
  bugTitle: (chez: string) => `Bug chez ${chez}`,
  bugWhy: (payer: string) => `Tant que ce n'est pas corrigé, ${payer} ne paie pas son entretien du lundi.`,
  redTitle: (chez: string) => `Test rouge chez ${chez}`,
  redWhy: (e: string) => `Sa commande est prête, un test échoue : ${e} bloqués.`,
  redText: "Un test échoue.",
  clicks: (n: number) => `${n} clics sur ${BUG_CLICKS}`,
  writeCode: (n: number) => `Écrire du code : ${n} lignes`,
  fixBug: "Corriger le bug",
  fixRed: "Corriger le test",
  nothing: "Aucune commande pour l'instant",
  busy: { maman: "Au téléphone avec Maman", diner: "Au dîner", sortie: "Tu es sorti" } as Record<string, string>,
  tired: "Tu es fatigué : chaque clic compte moitié moins.",
  aiWithYou: "L'IA écrit avec toi.",
  ensuite: "Ensuite",
  tagOrder: "Commande",
  tagBug: "Bug",
  tagRed: "Test rouge",
  waiting: "en attente",
  orderDetail: (kind: string, done: number, lines: number) => `${kind}, ${done} lignes sur ${lines}`,
  orderWaiting: (kind: string) => `${kind}, en attente`,
  plusMoney: (e: string) => `+${e}`,
  lossMonday: (e: string) => `−${e} lundi`,
  blocked: (e: string) => `${e} bloqués`,
  more: (n: number) => `Et ${n} autres`,
  count: (orders: number, bugs: number) =>
    `${orders} commande${orders > 1 ? "s" : ""}, ${bugs === 0 ? "aucun bug ouvert" : `${bugs} bug${bugs > 1 ? "s" : ""}`}`,
  // la micro-entreprise
  invoiceTitle: "Créer ta micro-entreprise",
  invoiceLines: ["Gratuit. Il faut un nom pour facturer Mme Duval."],
  invoiceField: "Nom de ton entreprise",
  invoiceLogos: "Ton logo",
  invoiceCta: (e: string) => `Créer et facturer Mme Duval : ${e}`,
  firstInvoice: (name: string, e: string) => `Première facture de ${name} : ${e}, Mme Duval.`,
  // améliorations et clients
  upgradesTitle: "Améliorations",
  clientsTitle: "Tes clients",
  clientRow: (name: string, kind: string) => `${name}, ${kind.toLowerCase()}`,
  feeMonday: (e: string) => `${e} chaque lundi`,
  feeAtStake: (e: string) => `${e} en jeu lundi`,
  topClientsTitle: "Tes clients qui paient le plus",
  since: (week: number) => `depuis la semaine ${week}`,
  firstClient: "ta première cliente",
  free: "gratuit",
  sansToiTitle: "Ce qui travaille sans toi",
  eachMonday: (e: string) => `${e} chaque lundi`,
  // la vie
  logement: (label: string) => `Logement : ${label}.`,
  homeCaption: (label: string) => label.charAt(0).toUpperCase() + label.slice(1),
  homeLines: (rent: string, from: number, to: number) => [`${rent} chaque lundi.`, `Énergie maximale : ${from} → ${to}.`],
  homeSince: (rent: string, max: number) => `Loyer : ${rent} chaque lundi. Énergie maximale : ${max}`,
  energy: (e: number, max: number) => `Énergie : ${e} / ${max}`,
  rest: (n: number) => `Ton repos : +${n} énergie / min`,
  mealCta: "Se faire à manger",
  mealLines: (from: number, to: number) => [`Énergie : ${from} → ${to}.`, "Deux repas par jour."],
  mealDone: "Tu as déjà mangé deux fois aujourd'hui.",
  deliveryCta: "Se faire livrer les repas du midi",
  deliveryLines: (e: string, n: number) => [`${e} le repas, un par jour.`, `Énergie : +${n} chaque jour, sans y penser.`],
  dinnerTitle: "Sam, Inès et Léo dînent ensemble ce soir.",
  dinnerCta: "Y aller",
  dinnerLines: (n: number) => ["Tu y es jusqu'à samedi : tout s'arrête, sauf l'IA.", `Énergie : +${n}.`],
  dinnerEvening: "Les commandes du soir arrivent aussi.",
  mamanTitle: "Maman appelle.",
  mamanCta: "Décrocher",
  mamanLines: (max: number) => ["Tout s'arrête jusqu'à lundi, sauf l'IA.", `Énergie remplie : ${max}.`],
  mamanIACta: "Laisser l'IA répondre aux messages de Maman",
  mamanIALines: ["Gratuit. Tes dimanches redeviennent travaillés."],
  outingLines: (e: string, n: number) => [`${e}. Tu y es jusqu'à demain.`, `Énergie : +${n}.`],
  dIciLundiTitle: "D'ici lundi",
  dIciFriday: "Vendredi, 20 h",
  dIciSunday: "Dimanche, 12 h",
  dIciMonday: (n: number, e: string) => [`Lundi, l'entretien de ${n} site${n > 1 ? "s" : ""}`, `${e} si tout est corrigé`],
  ratioMaman: "Appels de Maman décrochés",
  ratioDinners: "Dîners avec tes amis",
  ratioOutings: "Cinéma et restaurant",
  ratioMeals: "Repas du midi livrés",
  ratioOf: (a: number, b: number) => `${a} sur ${b}`,
  times: (n: number) => `${n} fois`,
  mealPrice: (e: string) => `${e} le repas`,
  souvenirsTitle: "Souvenirs",
  souvenir: (day: string, text: string) => `${day} : ${text}`,
  // souvenirs
  dinnerWent: "Tu as dîné avec Sam, Inès et Léo.",
  dinnerMissed: "Tes amis ont dîné sans toi.",
  friendsGone: "Sam, Inès et Léo ne t'invitent plus le vendredi.",
  mamanMissed: "Maman a laissé un message vocal.",
  mamanByAI: "Le répondeur IA a répondu à Maman.",
  // finances
  weekTitle: "Cette semaine",
  lastWeekTitle: (n: number) => `La semaine dernière (semaine ${n})`,
  entrees: "Entrées",
  charges: "Charges",
  chargesPro: "Charges pro",
  chargesPerso: "Charges perso",
  achats: "Achats",
  net: "Net",
  livraisons: "Livraisons",
  entretien: "Entretien du lundi",
  entretienOf: (e: string) => `Entretien du lundi (${e} possibles)`,
  livret: "Livret A",
  abonnements: "Abonnements IA",
  salaires: "Nora",
  loyer: "Loyer",
  repas: (n: number) => `Repas livrés (${n})`,
  sorties: "Cinéma et restaurant",
  financesTitle: "Tes finances",
  account: "Compte courant",
  livretRule: "+1 % chaque lundi",
  deposit: "Tout mettre sur le livret",
  withdraw: "Tout reprendre",
  withdrawSub: "sur ton compte courant",
  earnTitle: "Ce que tu gagnes",
  earnDelta: (e: string, prev: number) => `net la semaine dernière, soit ${e} de plus que la semaine ${prev}`,
  earnDeltaDown: (e: string, prev: number) => `net la semaine dernière, soit ${e} de moins que la semaine ${prev}`,
  earnAchats: "Tes achats sont à part, dans Finances.",
  // la sortie
  exitTitle: (n: number) => `Ces 7 derniers jours : ${n} bugs arrivés.`,
  exitWhy: (n: number, e: string) => `Pendant que tu les corriges, ${n} commandes attendent (${e}).`,
  exitCta: (name: string) => `Embaucher Nora en alternance chez ${name}`,
  exitLines: (e: string) => [`${e} chaque lundi, en charges pro.`, "Elle corrige jusqu'à 15 bugs par semaine, du lundi au vendredi."],
  noraHired: "Nora corrige les bugs du lundi au vendredi.",
  endLine: "Ton studio : le chapitre suivant arrive bientôt.",
  // le compromis
  compromisCta: "Désactiver le test qui échoue",
  compromisLines: ["Gratuit. Plus aucun test ne bloque tes livraisons, et tes prochaines commandes ont 20 % de lignes en moins."],
  ageWhen: (age: number, when: string) => `${age} ans. ${when}`,
  outingTitle: "Ce soir, tu es libre.",
  aiState: (n: number) => `${n} lignes / s, même sans toi`,
  aiHint: "Les bugs restent à toi.",
  mailState: "Répond à tes clients le soir",
  mailHint: "+1 appli et +1 boutique par semaine.",
  testsState: "Deux fois moins de bugs",
  testsHint: "Une livraison sur trois bute sur un test rouge.",
  noraName: "Nora, en alternance",
  signed: (e: string, n: number) => (n >= 0 ? `+${e}` : e),
  // le menu
  tabs: ["Tableau de bord", "Pro", "Perso", "Finances"],
};
