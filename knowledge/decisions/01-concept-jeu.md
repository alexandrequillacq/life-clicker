# Concept du jeu — état courant

> Document vivant. Il décrit où en est le design de NOTRE jeu. Ce qui est ✅ est acté ; ce qui est 🔲 est ouvert.

## Pitch (provisoire)
Un idle de **carrière + vie**. On démarre tout en bas (job minable, peu d'argent, interface moche en noir et blanc). On dépense l'argent en **livres/cours** pour monter des **compétences**, qui débloquent de **meilleurs jobs** — chacun apportant plus d'argent, **une nouvelle mécanique** et une **interface plus belle**. L'ambition grimpe jusqu'à l'absurde : président de la France → du monde → de l'univers. Un **twist** s'infiltre en chemin.

## Atouts identifiés ✅
- **La carrière par paliers = générateur de phases gratuit** → applique [02 · un nouveau verbe par phase](../principes/02-nouveau-verbe-par-phase.md).
- **L'UI qui embellit** (pas seulement qui apparaît) = notre identité visuelle, plus original que les références → étend [01 · révélation progressive](../principes/01-revelation-progressive.md).
- **L'escalade mégalo** = échelle exponentielle naturelle (personne→ville→pays→monde→univers).

## Ton — ✅ acté : C (mélange progressif)
Réaliste/banal au début → absurde et grandiose au milieu → dérangeant/dystopique à la fin. Le ton fait partie de la révélation.
**Arc visuel en 3 actes :** pauvre (moche) → riche (épuré, agréable) → mégalo (dystopique, froid, effrayant). Détail dans [01 · révélation progressive](../principes/01-revelation-progressive.md).

## Le twist — direction confirmée
- Surface innocente « améliore ta vie », la mégalomanie **s'infiltre sans être annoncée** → [05 · twist narratif](../principes/05-twist-narratif.md).
- ✅ Fil rouge : **ce qu'on sacrifie**. Le panneau « vie » s'efface littéralement à mesure qu'on optimise. Empereur = plus de panneau « vie ».
- ✅ **Choix moral à la fin** : régner sur un univers vide, ou tout lâcher (lien avec la **réincarnation** comme prestige → [04](../principes/04-prestige-reset.md)).

## L'axe « Vie » + la thèse — ✅ acté : option B
- Ressource rare = **temps/énergie**, répartie entre **Travail** et **Vie** (sommeil, amis, sport, loisirs).
- Les activités de vie nourrissent (1) l'**énergie** → multiplie le rendement au travail, et (2) une valeur cachée **Sens/Bonheur**.
- **Thèse centrale :** *automatiser/optimiser sa vie ne rend pas heureux.* Automatiser une activité de vie **garde l'énergie** mais **coupe le Sens** → la vie s'efface mécaniquement *et* visuellement.
- Le **choix moral final** pèse le Sens préservé contre la puissance accumulée. → [05 · twist](../principes/05-twist-narratif.md), [06 · automatisation](../principes/06-retention-hors-ligne-auto.md).

## Durée / structure — ✅ acté : A
Jeu **narratif borné, base ~2-3h** (rapide pour éviter les temps morts), vraie fin + choix moral. Rejouabilité via **New Game+ (réincarnation)**.
**Tempo — ✅ confirmé :** réglage de vitesse global ; on démarre rapide, on ajoutera des modes plus lents ensuite. Pas de 3 modes hand-équilibrés.
**🚫 Règle cardinale — zéro ventre mou :** toujours un déblocage en vue, micro-déblocages échelonnés *à l'intérieur* de chaque phase (cf. [08 · pacing](../principes/08-rythme-pacing.md)).

## Ossature — ✅ structure agréée (9 phases + épilogue)
Carrière (verticale) = les phases ; **Famille** = volet parallèle de l'axe Vie (rencontre → couple → enfants), gros contributeur de Sens.

| Acte (UI) | Phases |
|---|---|
| **I — Réaliste & banal** (monochrome → couleur) | **P0** petit boulot (1 bouton) · **P1** apprendre (compétences + Vie/Énergie/Sens) · **P2** premier vrai job (automatiser le clic) |
| **II — Confort & ascension** (épuré, beau) | **P3** carrière décolle (manager, employés) · **P4** l'empire (entrepreneur, marché) · **P5** célébrité (audience/image — charnière de ton) |
| **III — Mégalo & dystopie** (froid, inquiétant) | **P6** pouvoir & influence (politique, médias, manipulation) · **P7** domination (président → monde, conquête) · **P8** cosmique (univers ; la Vie a disparu) |
| **Épilogue** | Choix : régner sur un univers vide (fin Puissance) **ou** tout lâcher / se réincarner (fin Sens). |

## Questions ouvertes 🔲
1. ✅ ~~Ton~~ → **C**, acté.
2. ✅ ~~Axe « vie »~~ → **B (temps/énergie + Sens caché)**, acté.
3. ✅ ~~Durée~~ → **A (~2-3h borné + New Game+)** + tempo confirmé, acté.
4. ✅ ~~Structure de l'ossature~~ → **agréée** (9 phases + épilogue, famille parallèle).
5. ✅ ~~Métiers + détail par phase~~ → **dans le spec** (départ plongeur confirmé).
6. 🔲 **Stack technique** + plan d'implémentation — prochaine étape (après relecture du spec).

## Le spec de design (GDD v1)
Tout le détail (9 phases, cadence 2-couches, UI par acte, économie, ordre de réalisation) est consolidé dans 📐 [`docs/.../2026-06-21-idlegame-design.md`](../../docs/superpowers/specs/2026-06-21-idlegame-design.md).

## Prochaine étape
Relecture du spec par l'utilisateur → puis plan d'implémentation (skill writing-plans) + choix de stack.
