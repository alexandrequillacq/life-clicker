# IdleGame — Spec de design (GDD v1)

- **Date :** 2026-06-21
- **Statut :** en attente de relecture utilisateur
- **Pourquoi de chaque choix :** voir la [base de connaissance](../../../knowledge/README.md). Ce spec est le *quoi* ; la base est le *pourquoi*.

---

## 1. Pitch & vision

Un jeu idle/incrémental **narratif et borné** (~2-3h, fin avec choix moral, rejouable via réincarnation). On démarre **plongeur** dans un restaurant, avec une interface moche en noir et blanc et un seul bouton. On dépense l'argent en livres/cours pour monter des compétences, décrocher de meilleurs métiers, et grimper une échelle qui mène jusqu'à empereur de l'univers. À chaque palier : **une nouvelle mécanique** et une **interface qui évolue** (moche → belle → dystopique). En parallèle, une **vie** (énergie, sens, famille) qu'on peut nourrir… ou sacrifier. Un twist s'infiltre sans être annoncé.

## 2. Thèse & ton

- **Thèse centrale :** *optimiser/automatiser sa vie ne rend pas heureux.* Le genre idle a dressé le joueur à adorer l'automatisation ; le jeu retourne ce réflexe contre lui. Automatiser le **travail** = sain ; automatiser la **vie** = piège séduisant qui vide l'existence de son sens.
- **Ton : mélange progressif (C).** Réaliste/banal au début → absurde et grandiose au milieu → dérangeant/dystopique à la fin. Le ton fait partie de la révélation. Tout le récit passe par du **texte diégétique** (libellés de boutons, événements, logs) — jamais de cinématique qui coupe le rythme. → [principe 05](../../../knowledge/principes/05-twist-narratif.md).

## 3. Boucle de jeu centrale

Boucle classique du genre, à laquelle on greffe l'axe Vie :

1. **Action** (cliquer le bouton du métier) → gagne de l'**argent (€)**.
2. **Dépenser** en upgrades et générateurs → revenu automatique qui compose.
3. **Apprendre** (livres/cours) → compétences qui multiplient les gains.
4. **Énergie** : une jauge qui **multiplie tout le rendement** ; elle se recharge via les activités de Vie et décroît avec le temps/travail.

**Maths (valeurs par défaut, à affiner en playtest) :** coût des achats `× ~1,15` par unité, production `× ~1,1` → le prochain achat est toujours à quelques secondes. Paliers qui **doublent** à des seuils (compétences niv. 5/10/25 ; employés 25/50/100…). Pas de progrès < +20 % (sinon il ne se *sent* pas). → [principe 03](../../../knowledge/principes/03-courbes-de-cout.md).

## 4. Les axes de jeu

| Axe | Quoi | Effet mécanique |
|---|---|---|
| **Travail** (vertical) | Le métier du moment + ses générateurs/employés | Produit l'€, le nerf de la progression. |
| **Vie · Énergie** | Activités : dormir, amis, sport, loisirs, week-ends | Recharge la jauge **Énergie** → multiplie le rendement de travail. *Au début, s'en occuper est le jeu optimal.* |
| **Vie · Sens** *(caché tôt)* | Valeur de bonheur/sens nourrie par une vie *réellement vécue* (non automatisée) et par la famille | **N'est pas un panneau à gérer au début** : s'accumule en coulisse. **Révélé seulement quand il commence à se vider** (fin Acte II / Acte III). Détermine la teneur de la fin. |
| **Famille** (parallèle) | Se construit au fil des actes : rencontre → couple → enfants | Gros contributeur de **Sens** + petit bonus d'Énergie/moral. La négliger/automatiser coûte cher en Sens. Ancre émotionnelle du sacrifice. |

## 5. L'automatisation, piège thématique

- **Automatiser le travail = sain et encouragé** (embaucher pour ton ancien poste, managers, etc.) → fait monter le joueur d'un cran (principe du genre).
- **Automatiser la vie = piège** : engager une femme de ménage, un chef privé, un coach, une nounou, une secrétaire qui texte tes amis… C'est efficace, ça libère des clics — mais ça **garde le bonus d'Énergie tout en coupant le Sens**. Une vie automatisée n'est pas vécue.
- Le joueur le fera *naturellement* (le genre l'a conditionné) ; le jeu ne le commente pas. La conséquence (Sens vidé) ne se révèle que tard. → [principe 06](../../../knowledge/principes/06-retention-hors-ligne-auto.md), [principe 05](../../../knowledge/principes/05-twist-narratif.md).

## 6. Arc visuel en 3 actes

L'interface **embellit puis bascule dans le malaise** — elle raconte le twist toute seule. On introduit **un seul élément visuel/UI à la fois**, déclenché par un seuil franchi. → [principe 01](../../../knowledge/principes/01-revelation-progressive.md).

| Acte | Ambiance UI |
|---|---|
| **I — Réaliste & banal** | Terminal monochrome, texte brut, un bouton. Se structure (panneaux qui apparaissent), gagne sa **première couleur** en fin d'acte. |
| **II — Confort & ascension** | Épurée, agréable, colorée, animée, fluide. **Apogée du confort visuel** (riche, satisfaisant). |
| **III — Mégalo & dystopie** | Vire au froid, contrastes durs, esthétique « officielle »/régime, grandiose et glaçante. Retour au fond noir du début mais immense et glacé. |

## 7. Rythme & cadence

- **Base ~2-3h** (rapide, pour éviter les temps morts). **Tempo réglable** (coefficient de vitesse global) ; on démarre rapide, on ajoutera des modes plus lents ensuite. *Pas* de 3 modes hand-équilibrés.
- 🚫 **Règle cardinale — zéro ventre mou.** Jamais ~20 min sans rien. Toujours un déblocage en vue.
- ⚖️ **Deux couches** pour concilier rythme et familiarisation :
  - **Couche 1 · contenu familier (rapide, ~30-90s) :** upgrades, +€/clic, paliers de doublement. Zéro charge cognitive → flux continu. *Tient le zéro-ventre-mou.*
  - **Couche 2 · nouvelle mécanique (espacé, en solo) :** un panneau/ressource/verbe à la fois ; on laisse le joueur l'utiliser ~1-3 min et en sentir l'effet **avant** d'empiler la suivante.
- **Progrès hors-ligne** (plafonné) : « pendant ton absence, tu as continué à gagner ». Récompense de retour, pas une corvée.
- **Bonus aléatoires** thématiques (« opportunité », « coup de chance », « rencontre ») = boosts temporaires, par-dessus la boucle déterministe.
- → [principe 08](../../../knowledge/principes/08-rythme-pacing.md).

## 8. Les 9 phases en détail

Pour chaque phase : **métier**, **nouveau verbe/mécanique** (couche 2, espacée), **contenu continu** (couche 1), **ce que l'UI montre**, **état de Vie/Famille/Sens**, **condition de sortie**. Durées indicatives au tempo « rapide » de base.

### ACTE I — Réaliste & banal

**P0 · Plongeur** *(~3 min)*
- **Métier :** plongeur. Bouton **« Laver une assiette »** (+0,05 €). Cold open : rien d'autre à l'écran.
- **Couche 2 (1 seule) :** ~1:30, « Un collègue couvre un créneau » → **premier revenu automatique** (introduit l'idle, seul).
- **Couche 1 :** éponge, gants, organisation → +€/clic.
- **UI :** monochrome, le compteur € apparaît au 1er clic ; passage centimes→euros = 1er jalon visuel.
- **Vie/Famille/Sens :** aucun.
- **Sortie :** assez d'€ pour « acheter ton premier livre » → P1.

**P1 · Plongeur qui étudie** *(~5 min)*
- **Métier :** toujours plongeur ; boutons **« Lire un livre »**, **« Cours du soir »**.
- **Couche 2 (espacée, 1 à la fois) :** (a) « Lire un livre » → **panneau Compétences** (chaque niveau = milestone ×). *Respire ~1-2 min.* (b) « Temps libre » → **panneau Vie** + jauge **Énergie** (multiplie le rendement ; le joueur sent l'income monter quand reposé). (c) « Voir des amis » → recharge Énergie (le **Sens** s'accumule en coulisse, invisible).
- **Couche 1 :** nouvelles compétences, cours plus chers (×1,5), upgrades de plonge.
- **UI :** toujours monochrome, mais l'écran se **structure** (panneaux qui apparaissent).
- **Sortie :** seuil de compétences → « Diplôme » → P2.

**P2 · Employé de bureau** *(~5 min, fin d'Acte I)*
- **Métier :** assistant admin. Bouton **« Traiter un dossier »** (revenu très supérieur à la plonge).
- **Couche 2 :** (a) « Postuler à un vrai job » → saut de revenu + **l'UI gagne sa première couleur** (récompense de fin d'acte). (b) « Embaucher pour ta plonge » → **automatise entièrement P0**. (c) **« Tu rencontres quelqu'un »** → démarre le **volet Famille** (panneau parallèle ; gros Sens + petit moral).
- **Couche 1 :** upgrades de productivité bureau, compétences continuent.
- **Sortie :** promotion → Acte II.

### ACTE II — Confort & ascension

**P3 · Chef d'équipe → cadre** *(~5-7 min)*
- **Métier :** manager. Verbe **« Déléguer une tâche »**, gérer des **employés**.
- **Couche 2 :** (a) **panneau Employés** (chaque type = générateur auto ; milestones 25/50/100). (b) « Bureau plus grand » = multiplicateur d'équipe. (c) Vie s'enrichit (sport → Énergie+, week-ends → Sens) ; Famille grandit (« emménager ensemble »).
- **Première tentation d'automatiser la vie** (discrète) : « Engager une femme de ménage » (libère du temps, garde l'Énergie, **ne nourrit pas le Sens** — non explicité).
- **UI :** épurée, colorée, premières animations (le beau commence).
- **Sortie :** capital suffisant → « Monter ta boîte » → P4.

**P4 · Fondateur → PDG** *(~7-10 min)*
- **Métier :** entrepreneur. Verbe **« Lever des fonds »** / investir. Système **Marché/Investissements** (placer de l'argent qui rapporte des %, croissance exponentielle).
- **Couche 2 :** (a) **panneau Entreprise/Marché** (produits, investissements). (b) **acquisitions** (racheter des boîtes = générateurs plus gros). (c) Vie : la famille a des **enfants** (gros potentiel de Sens) ; le temps manque → automatiser la vie devient *très* tentant (nounou, chef, coach). Le jeu laisse faire. **Le Sens plafonne sans que rien ne l'annonce.**
- **UI :** apogée de la beauté (riche, fluide, satisfaisant).
- **Sortie :** fortune + notoriété → P5.

**P5 · Icône médiatique / star** *(~7 min, charnière de ton)*
- **Métier :** personnalité publique. Verbe **« Publier un post »**, cultiver une **audience** (followers = nouvelle ressource).
- **Couche 2 :** (a) **panneau Audience/Image** (followers, posts, campagnes — l'adoration grimpe, grisant). (b) **acheter des followers / fabriquer l'image** → l'adoration est manufacturée, c'est creux (1er vrai malaise : le beau qui sonne faux). (c) **Révélation du Sens** : si le joueur a tout automatisé, son Sens est bas malgré le succès — la jauge Sens, jusque-là cachée, **apparaît ici**, basse. ← moment-clé du twist.
- **UI :** encore beau mais qqch se fige, trop parfait, légèrement froid (uncanny).
- **Sortie :** célébrité → bascule dans le pouvoir → P6.

### ACTE III — Mégalo & dystopie

**P6 · Figure politique** *(~7 min)*
- **Métier :** politique (ministre, leader de parti). Verbe **« Racheter un média »**, **manipuler l'opinion**.
- **Couche 2 :** (a) **panneau Influence/Médias** (contrôler des médias, orienter l'opinion). (b) financer des campagnes, neutraliser des rivaux. (c) Vie : panneau rétréci, activités automatisées/abandonnées ; Famille distante (beat narratif : les enfants te connaissent à peine).
- **UI :** franchement dystopique (froid, contrastes durs, typo « officielle » oppressante).
- **Sortie :** prendre le pouvoir → Président → P7.

**P7 · Président de la France → du Monde** *(~5-7 min)*
- **Métier :** chef d'État. Verbe **« Annexer un pays »**, **conquérir**. Système **Carte** (nations à contrôler).
- **Couche 2 :** (a) **carte du monde** (chaque pays = ressources/puissance). (b) consolidation (armée, surveillance, propagande). (c) Vie quasi vide ; **Sens en chute libre, visible et alarmant** ; la famille disparaît de l'écran (un dernier message).
- **UI :** grandiose et glaçante (échelle mondiale, esthétique de régime).
- **Sortie :** monde unifié → P8.

**P8 · Empereur de l'univers** *(~5 min)*
- **Métier :** tyran cosmique. Verbe **« Convertir une planète »**, dominer le cosmos. Système d'expansion cosmique (planètes → systèmes → galaxies ; l'échelle explose vers la notation scientifique). Sondes auto-réplicantes (clin d'œil sobre à Paperclips).
- **État :** **le panneau Vie a totalement disparu.** Sens ≈ 0. Tu règnes sur tout, et c'est vide et silencieux.
- **UI :** immense, froide, quasi abstraite — chiffres astronomiques sur fond noir. Boucle visuelle avec le noir du début, mais glacé.
- **Sortie :** plus rien à conquérir → **Épilogue**.

## 9. Prestige / réincarnation (New Game+)

- Habillage thématique du prestige : **la réincarnation / une nouvelle vie**. → [principe 04](../../../knowledge/principes/04-prestige-reset.md).
- Tu recommences plongeur, en gardant un capital de **karma** (talent inné) = multiplicateur de départ → tu re-grimpes plus vite.
- Formule **sous-linéaire** (ex. racine cubique d'un agrégat de richesse/sens accumulés) pour que reset = récompense et qu'on rejoue.
- Le karma peut débloquer de petits raccourcis/variantes en NG+ (sans dénaturer la première expérience).

## 10. Épilogue & choix moral

Tu as tout. L'univers est à toi, vide. Un écran final sobre, deux options :
- **Régner sur l'univers vide** (fin « Puissance ») : le compteur tourne dans le silence. Fin froide, façon mort thermique.
- **Tout lâcher / se réincarner** (fin « Sens ») : tu abandonnes le pouvoir → New Game+ ; tu repars d'en bas avec ton karma. *La fin qui te rend une vie.*

La **teneur** de la fin dépend du **Sens préservé** vs la **puissance accumulée** : tout automatisé/sacrifié → la fin Puissance n'en est que plus glaçante ; du Sens gardé → la réincarnation est douce. Le jeu ne juge pas explicitement ; il montre.

## 11. Systèmes transverses

- **Sauvegarde** locale (auto-save fréquent) + reprise hors-ligne.
- **Réglage tempo** (Posé/Normal/Rapide) dès le départ.
- **Succès / milestones** qui rebouclent sur la production (pas seulement cosmétiques).
- **Bonus aléatoires** (opportunités) légers, par-dessus la boucle.

## 12. Hors-périmètre (YAGNI)

- ❌ Pas de monétisation / pay-to-win (projet perso ; cf. [pièges](../../../knowledge/principes/07-pieges-a-eviter.md)).
- ❌ Pas de multijoueur, pas de comptes/cloud (sauvegarde locale).
- ❌ Pas de 3 modes hand-équilibrés (juste le coefficient de tempo).
- ❌ Pas d'app native au départ (web ; responsive éventuellement plus tard).

## 13. Contraintes techniques & ordre de réalisation

- **Plateforme : web** (tourne dans le navigateur — idéal pour l'UI qui évolue via DOM/CSS, facile à itérer et partager). **Stack précise à décider dans le plan d'implémentation** (vanilla JS/HTML/CSS vs framework léger type Svelte). Reco : démarrer simple.
- **Ordre de construction (important pour un premier projet) :**
  1. **Tranche verticale = Acte I (P0-P2) + l'infra de base** (boucle, sauvegarde, hors-ligne, tempo). Prouve le *feel* : boucle centrale, apparition d'UI, axe Vie/Énergie, 1er changement de couleur. **C'est le MVP jouable, on le teste avant tout le reste.**
  2. Acte II (P3-P5).
  3. Acte III (P6-P8) + épilogue + réincarnation.
- **Playtester l'équilibrage à chaque tranche** — c'est là que les idle se gagnent ou se perdent.

## 14. Risques & mitigation

| Risque | Mitigation |
|---|---|
| **Murs / ventres mous** (équilibrage) | Règle des 2 couches ; playtest à chaque tranche ; courbes ×1,15/×1,1. |
| **Scope creep** | 9 phases bornées + liste YAGNI ; le NG+ absorbe les envies d'extension. |
| **Premier projet, on s'éparpille** | Tranche verticale (Acte I) livrée et jouable avant tout le reste. |
| **Le twist ne prend pas** | Sens caché puis révélé ; tout en texte diégétique ; l'arc visuel porte la bascule. |

---

## Liens
- Base de connaissance : [README](../../../knowledge/README.md)
- Concept (état vivant) : [concept-jeu](../../../knowledge/decisions/01-concept-jeu.md)
- Journal des décisions : [journal](../../../knowledge/decisions/00-journal-decisions.md)
