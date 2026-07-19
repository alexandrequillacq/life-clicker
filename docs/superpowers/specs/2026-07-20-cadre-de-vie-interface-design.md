# Le cadre de vie embellit l'interface — design (v2, challengé)

> Remplace le système « décor de fond = photo du logement ». Direction d'Alexandre : plutôt que d'acheter des maisons en arrière-plan, les achats embellissent l'INTERFACE elle-même ; l'interface doit devenir quelque chose de très joli, très épuré.
>
> Challenge : GO conditionnel rendu le 2026-07-20. Trois bloquants intégrés ci-dessous : B1 règle de possession des tokens + détokénisation préalable des fonds en dur, B2 variante gelée de chaque niveau en Acte III, B3 crossfade à deux couches pour le fondu d'achat. Décision actée : les ambiances chaudes des niveaux 4 et 5 ne seront pratiquement jamais vues chaudes (la maison s'achète en fin de célébrité, la villa en Acte III) ; c'est ASSUMÉ, c'est la thèse (le confort acheté reste, la chaleur a disparu).

## Constat

- Les photos de logement (public/homes/) sont un corps étranger : sourcing difficile, rendu hétérogène, aucune cohérence avec l'esthétique du jeu, et le bouton « Réduire l'écran » n'existe que pour les admirer.
- L'identité visuelle du jeu (concept doc : « l'UI qui embellit = notre identité visuelle ») n'est pas servie par un fond photo : elle est servie par l'interface.
- La thèse impose de garder le rôle narratif du logement : « acheter un meilleur logement n'est PAS automatiser sa vie », ce sont les fruits honnêtes de la réussite.

## Principe

**L'échelle de logement reste (mêmes coûts, mêmes seuils, même rôle de puits d'argent honnête), mais son effet devient la transformation de l'interface.** Chaque niveau de cadre de vie est un THÈME complet : ambiance d'arrière-plan dessinée (dégradés composés, jamais de photo), matière du panneau, rayons, ombres, lumière, température de l'accent. Le joueur ACHÈTE de la lumière, de l'espace, du calme ; il le voit instantanément dans l'objet qu'il a sous les yeux en permanence.

Règle d'épure (dure) : chaque niveau RAFFINE (lumière, matière, profondeur, espacement), il n'AJOUTE jamais d'ornement (pas de stickers, pas de décorations, pas de confetti). Plus on est riche, plus c'est calme.

## L'échelle (6 niveaux, coûts inchangés)

| Niv. | Lieu (affiché dans la barre de fenêtre) | CTA | Coût | Ambiance (stage) | Écran (panneau) |
|---|---|---|---|---|---|
| 0 | Sous-sol | (départ) | 0 | Quasi noir, vignette serrée, halo d'ampoule froide en haut | Panneau terne #f4f4f4, coins 12px, ombre courte et dure, aucun flou : un moniteur bas de gamme |
| 1 | Premier logement | Quitter le sous-sol | 2 000 € | Gris-bleu d'aube, une diagonale de lumière de fenêtre | Blanc franc, coins 14px, ombre plus douce, liseré de lumière en haut du panneau |
| 2 | Appartement lumineux | Louer un appartement lumineux | 50 000 € | Plein jour pâle (ciel voilé), nappe de soleil | Coins 16px, ombre large et douce, cartes blanc chaud, espacements aérés (+2px de padding), accent plus lumineux |
| 3 | Loft | S'installer dans un loft | 1 M€ | Brique et bois au crépuscule, halos de lampes chaudes | VERRE : panneau translucide + backdrop-filter blur, coins 18px, ombre profonde, bordures fines |
| 4 | Maison avec jardin | S'offrir une maison avec jardin | 20 M€ | Vert-doré de matin de jardin, taches de lumière feuillue | Verre conservé, accent réchauffé, léger regain de saturation, lumière interne douce |
| 5 | Villa avec piscine | Faire construire une villa avec piscine | 500 M€ | Azur et sable au couchant, miroitement lent (animation ~60 s, discrète) | Sommet : coins 20px, filets dorés en liseré, le panneau le plus serein du jeu |

- **La barre de fenêtre affiche le lieu** en petit à droite (« Loft ») : l'achat a un nom visible en permanence, la récompense est étiquetée.
- **Transition d'achat** : bref fondu d'ambiance (~1 s) au moment de l'achat, pour que l'embellissement se vive comme un événement.
- **Acte III par-dessus tout thème** : la palette act3 existante continue d'écraser la chaleur du panneau, et l'ambiance du stage est refroidie/désaturée par le voile existant. On peut posséder la villa ET vivre dans un monde gelé : le confort acheté reste, la chaleur a disparu. C'est exactement la thèse, sans un mot.

## Ce qui disparaît

- Les photos (public/homes/ n'est plus référencé ; le champ `bg` avec `url(...)` disparaît de homes.ts).
- Le bouton « Réduire l'écran » et l'état `screenOpen` : il n'y a plus de photo à admirer derrière ; l'ambiance se voit autour du panneau en permanence. Moins de chrome, plus d'épure.

## Règle de possession des tokens (B1, contrainte dure)

- **Le logement possède la MATIÈRE, la GÉOMÉTRIE et l'AMBIANCE** : `--radius`, `--panel-alpha`, `--panel-blur`, `--shadow`, `--edge` (liseré), et les couches d'ambiance du stage.
- **Le métier et l'acte possèdent la COULEUR** : `--accent`, `--tint` (teinte de panneau), `--card-tint`, `--fg`, `--muted`.
- **Composition mécanique** : le panneau se rend via `color-mix(in srgb, var(--tint) …, transparent)` + `backdrop-filter: blur(var(--panel-blur))`. Loft + célébrité = verre teinté rose sans qu'aucun système ne connaisse l'autre. Aucune combinaison n'est écrite à la main.
- **Prérequis (premier chantier)** : détokéniser tous les fonds en dur du composant (winbar, .buy, .ghost, .primary.ghost-danger, .bar) qui sont aujourd'hui des `#ffffff`/`#dfe4ec` opaques : sur du verre, ces aplats flotteraient comme des pansements.

## Variante gelée en Acte III (B2, contrainte dure)

L'Acte III remplace la COULEUR (tint sombre, accent acier), le logement GARDE matière et géométrie. Exemple villa gelée : panneau sombre translucide + blur 20 px + coins 20 px, liseré doré remplacé par un filet acier discret, miroitement conservé à opacité réduite de moitié, ambiance aux mêmes stops désaturée sous le voile existant. Acheter la maison ou la villa en pleine dystopie DOIT produire un delta visible : plus de verre, plus de profondeur, plus de calme, mais froid.

## Fondu d'achat (B3) et garde-fous

- Les dégradés CSS ne se transitionnent pas : l'ambiance est rendue en DEUX couches empilées avec crossfade d'opacité (~1 s) au changement de homeLevel. Sur mobile, le fondu se voit aussi SUR le panneau (bref éclaircissement du tint).
- Mobile : bande d'ambiance réservée en haut (padding-top ~10 vh, panneau max-height ~78 vh) ; la récompense passe par la matière, le lieu nommé et le fondu.
- Lisibilité verre : `--panel-alpha` ≥ 0,72, blur ≥ 20 px + `saturate(1.2)`, cartes quasi opaques (le texte vit dans les cartes), winbar avec sa propre matière (sinon couture opaque au scroll).
- Animation villa : couche dédiée animée en transform/opacity uniquement (jamais le fond sous blur), `prefers-reduced-motion` respecté (l'animation disparaît, le thème reste complet).
- Filet doré : UN liseré 1 px sur le panneau seulement, jamais sur cartes ni boutons (limite d'épure).

## Mécanique et code

- homes.ts : `HomeDef` garde `label`, `cta`, `cost`, `unlockAtMoney` ; `bg` supprimé. Aucune constante d'économie ne bouge (coûts et seuils identiques : zéro impact de pacing).
- UI : `data-home={s.homeLevel}` sur `.stage` (et `.screen` si utile) ; tout le thème est du CSS par niveau (variables + dégradés composés). L'ambiance = 2 à 3 couches de dégradés (radial + linéaire) par niveau, pas d'images.
- L'Acte I (plongeur, papier) ne change pas : le premier achat de logement arrive de toute façon après la bascule dev (seuil de révélation 1 200 €).
- Tests : adapter homes.test.ts (plus de bg) ; un test DOM : l'attribut data-home suit homeLevel et le lieu s'affiche dans la barre de fenêtre.

## Ce que ça règle

1. Cohérence visuelle totale (tout est dessiné, plus de dépendance à des photos).
2. La promesse « l'interface embellit » devient littérale et achetable : 5 paliers de beauté répartis sur le jeu, en plus des bascules d'acte.
3. Un chrome en moins (toggle), une identité en plus (le lieu nommé dans la barre).
