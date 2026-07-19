# Refonte des étapes, CTA et mécaniques — design (v3, correctifs du challenger intégrés)

> Objectif : corriger quatre défauts constatés en jeu.
> 1. Des CTA illogiques ou mal formulés.
> 2. Des mécaniques toujours identiques (clic + générateur + upgrade partout).
> 3. Des transitions entre métiers pas toujours logiques.
> 4. Une interface qui stagne dès le métier de dev au lieu d'embellir et de se complexifier.
>
> Direction confirmée par Alexandre : complexifier chaque acte, quitte à allonger le jeu ; plusieurs mécaniques différentes par acte ; évolution encore plus incrémentale, surtout sur la fin (Acte III).
>
> Challenge : GO conditionnel rendu le 2026-07-19 ; les 4 bloquants (B1 prime d'embauche lead, B2 économie Acte III autofinancée + grants d'actes écrasés, B3 gate célébrité sur le pic historique, B4 périodes tendance/bad buzz harmonisées) et les 6 importants (I1 posts scalant avec l'audience, I2 cooldown meeting + alliance réduite, I3 cartes 2 et 3 rééquilibrées, I4 seuils de cartes sur gains cumulés + gate fondateur sur les 5 décisions, I5 croissance des sondes 3 %/s, I6 expiration d'incident 40 s) sont intégrés ci-dessous.

## Audit de l'existant (résumé)

- **10 métiers, 3 mécaniques.** Tout le jeu repose sur : clic actif, générateur (coût × croissance, X/s), upgrade one-shot. Les seules vraies variations : l'énergie (dev), les levées de fonds et le remplacement de l'équipe (biz), les followers (célébrité), l'acte à cooldown (Acte III). `lead_dev` et `cto` n'apportent AUCUN verbe neuf (embaucher = acheter un générateur). Les 4 phases d'Acte III sont un seul et même gameplay répété avec des nombres plus gros. Le jeu viole son propre principe 02 (« un nouveau verbe par phase »).
- **Contenu mort.** `clickLabel` définis mais jamais rendus pour cto (« Trancher une décision technique »), entrepreneur (« Arbitrer la roadmap »), politique (« Tenir un meeting »).
- **Grammaire des CTA incohérente.** Mélange noms (« Lave-vaisselle », « Ferme à propagande ») et verbes (« Embaucher un junior ») ; tutoiement ponctuel (« Monter ta boîte d'IA ») contre réfléchi ailleurs ; « Devenir lead developer » présente une promotion comme un achat en libre-service.
- **Transitions.** dev → lead à 150 € d'épargne ; entrepreneur → célébrité à 8 M€ sans pont narratif ni mécanique.
- **UI.** Acte I (papier) : identité forte, on garde. Ensuite : un seul tableau de bord dont seule la couleur d'accent change.

## Principes transverses (règles dures de la refonte)

1. **Grammaire des CTA.** Tout bouton est un verbe à l'infinitif. Possessif réfléchi (« sa/son ») quand nécessaire, jamais de tutoiement dans un CTA (le tutoiement reste réservé aux lignes narratives).
2. **Un verbe neuf par métier, plusieurs mécaniques par acte.** À l'intérieur d'une phase, les mécaniques arrivent ÉCHELONNÉES (règle « zéro ventre mou »).
3. **Toute promotion est méritée et racontée.** Le seuil porte sur ce que le joueur a FAIT dans la phase et le CTA se formule comme une décision qu'on prend.
4. **Chaque acte ajoute des couches d'UI.** Plus beau et plus dense à chaque métier ; l'Acte III gagne en densité mais perd en chaleur.
5. **Déterminisme.** Périodes fixes, files séquentielles, fenêtres datées. Pas de RNG.
6. Contraintes existantes : français partout, pas de tiret long/court séparateur, monnaie unique €, l'énergie ne module que les actions actives du joueur, l'Emprise n'est jamais une monnaie dépensable, automatiser sa vie creuse le Sens en silence.

## Inventaire des verbes après refonte

| Métier | Verbe(s) neuf(s) | Mécanique |
|---|---|---|
| Plongeur | laver, s'équiper, poser les gants, étudier | inchangé |
| Développeur | résoudre, livrer des missions | compteur de bugs + missions freelance à fenêtre |
| Lead dev | embaucher, éteindre les incendies | incidents périodiques qui divisent le rendement d'équipe |
| CTO | trancher | cartes de décision à 2 options, effets permanents |
| Fondateur | lancer, lever, racheter, donner des keynotes | keynote = boost temporaire + presse (followers) |
| Célébrité | poster, surfer la tendance, éteindre le bad buzz | fenêtres de tendance ×8 et polémiques qui drainent |
| Politique | convertir l'audience, sceller des alliances | meetings qui brûlent des followers en Emprise |
| Président | prendre le contrôle, réprimer | damier d'institutions (€/s + Emprise/s) + Résistance |
| Maître du monde | annexer, réprimer plus fort | damier de continents (€/s + Emprise/s) + Résistance mondiale |
| Empereur | plus rien (le jeu se joue seul) | sondes auto-répliquantes, paliers cosmiques |

## Par métier

### P0 Plongeur (inchangé sur le fond)
- CTA harmonisés : « Acheter un lave-vaisselle », « Acheter un lave-vaisselle pro ».
- « Postuler comme développeur » → « Postuler à un poste de développeur ».
- On ne touche à rien d'autre : l'Acte I minimal est l'identité du jeu.

### P1 Développeur — verbes : résoudre, livrer
Arrivée échelonnée : clic bugs → upgrade IDE → missions freelance (dès 10 bugs résolus) → chaîne IA (atteinte plus tard, en lead/CTO).
- Nouveau compteur `bugsResolved` (incrémenté par le clic dev, y compris pendant une mission).
- **Missions freelance.** Toutes les `MISSION_PERIOD` (45 s), une mission s'affiche : résoudre N bugs en 30 s → prime. 3 paliers auteurés selon les missions déjà livrées : « Livrer un site vitrine » (10 bugs, 25 €), « Livrer une appli mobile » (15 bugs, 60 €), « Livrer une migration legacy » (20 bugs, 150 €). Réussie ou expirée, elle disparaît jusqu'à la prochaine. Vérifié : faisable même à énergie 0 au départ (la régénération seule donne 18 clics en 30 s) ; le palier 3 demande un peu de réserve ou un « Se reposer » en cours : tendu, jamais bloquant.
- **Transition refaite** : promotion à 40 bugs résolus ET 2 missions livrées. CTA « Accepter le poste de lead dev ». **À l'acceptation : prime d'embauche de 200 €** (un poste, ça paie ; et ça évite le hard-lock du lead sans le sou identifié au challenge, en finançant les 2 ou 3 premiers juniors).
- « Meilleur IDE » → « Installer un meilleur IDE ».

### P2 Lead dev — verbe neuf : éteindre les incendies
Arrivée échelonnée : embauches → premier incident (dès le 1er junior) → seniors (fenêtre CTO).
- **Incidents déterministes.** Tant qu'on a une équipe humaine et que l'IA ne résout pas les bugs (`!aiResolving`), un incident démarre toutes les `INCIDENT_PERIOD` (75 s). Pendant un incident, le brut de l'équipe est divisé par 2. « Résoudre l'incident » (clic, 10 énergie) rétablit le plein rendement. **Sans intervention, l'incident s'éteint seul au bout de 40 s** (punition AFK réelle, jamais un état permanent).
- Invariant à verrouiller par test : le net d'équipe reste positif pendant un incident (junior 14/2 − 6 = +1 €/s ; senior 45/2 − 18 = +4,5 €/s) et l'érosion GPU ne coexiste jamais avec un incident (les GPU exigent `aiResolving`, qui éteint les incidents).
- Battement de thèse : dès que l'IA résout les bugs, plus aucun incident. Jamais commenté.
- CTA promotion : « Accepter le poste de CTO ».

### P3 CTO — verbe neuf : trancher
- **Décisions techniques.** File auteurée et séquentielle de 5 cartes. Chaque carte apparaît à un seuil de **gains cumulés depuis l'entrée en poste de CTO** (nouveau compteur, pas l'argent en caisse : évite l'empilement) : 3 500 / 7 000 / 12 000 / 18 000 / 25 000 €. Deux options aux effets permanents :
  1. « Migrer vers le cloud » (+15 % rendement équipe) vs « Monter ses propres serveurs » (−10 % coût des GPU).
  2. « Imposer la revue de code » (incidents 2× plus rares ET ils s'éteignent seuls en 10 s) vs « Livrer plus vite » (+10 % brut équipe).
  3. « Payer la dette technique » (coût one-shot 2 000 €, +20 % brut équipe) vs « Encaisser sans payer la dette » (+2 500 € cash, incidents 2× plus fréquents) : arbitrage liquidité contre rendement (le cash finance la chaîne IA à 9 000 €).
  4. « Standardiser l'outillage » (−10 % coût des embauches) vs « Laisser chacun choisir » (+5 % brut équipe).
  5. « Former l'équipe à l'IA » (chaque GPU érode 25 % moins le brut) vs « Garder l'IA pour l'infra » (+15 % débit IA).
- Carte bloquante douce : mise en évidence, le jeu continue, on tranche quand on veut.
- **Transition refaite** : promotion à 30 000 € ET les 5 décisions tranchées (le verbe du CTO est trancher ; on ne fonde pas sa boîte sans avoir tranché). CTA « Fonder sa boîte d'IA ».
- Les incidents continuent en CTO jusqu'à l'activation de l'IA. Toutes les options « côté humain » meurent au remplacement de l'équipe par l'IA : silencieusement cruel, dans la thèse, aucun commentaire.

### P4 Fondateur (Acte II, apogée) — verbes : lancer, lever, racheter, donner des keynotes
Arrivée échelonnée : produits → levée d'amorçage → keynotes (dès la 1re levée) → acquisitions → data center → série B → délégation de sa vie.
- Mécanique existante conservée (levées, produits × GPU, acquisitions, data center, remplacement de l'équipe, délégation de sa vie).
- « Mettre un produit IA en marché » → « Lancer un produit IA ».
- **Keynotes.** Toutes les `KEYNOTE_PERIOD` (60 s), « Donner une keynote » s'arme (6 énergie). Effet : +50 % de revenu produits pendant 15 s ET +5 000 followers (presse tech). Première apparition des followers AVANT la célébrité : le pont mécanique P4 → P5.
- Chaque levée bouclée : +10 000 followers ; chaque acquisition : +3 000 (la presse en parle). Tuile « On parle de toi » dès que followers > 0. Vérifié au challenge : ~100 à 150 k followers cumulés en fin de phase, soit 0,2 à 0,3 % de la gate célébrité : pont visible, aucun court-circuit.
- **Transition refaite** : 8 M€ ET au moins une levée bouclée ; CTA « Sortir de l'ombre ».

### P5 Célébrité — verbes : surfer la tendance, éteindre le bad buzz
Arrivée échelonnée : posts + tendances → campagnes d'image → premier bad buzz (dès 200 000 followers) → achat de followers (inchangé, mauvais ROI assumé).
- **Posts qui portent.** « Publier un post » rapporte `500 + 0,2 % des followers` (l'audience amplifie chaque post). Sans cela, le clic devient négligeable dès la première campagne (constat chiffré du challenge).
- **Tendances déterministes.** Toutes les `TREND_PERIOD` (50 s), fenêtre de `TREND_WINDOW` (10 s) : posts ×8. Bannière « Tendance » pulsante.
- **Bad buzz.** `BADBUZZ_PERIOD` = **100 s** (multiple de 50, décalage fixe de +15 s : zéro chevauchement avec les tendances, garanti ; le 90/50 initial rendait le non-chevauchement impossible). Pendant la polémique, les followers fuient (−1,5 %/s) jusqu'à « Répondre à la polémique » (8 énergie) ; extinction seule à 20 s (perte max ≈ 26 % si on ignore tout).
- **Transition corrigée (anti-plafond AFK)** : la gate politique porte sur le **pic historique** de followers (`maxFollowers` ≥ 50 M) : « 50 millions de personnes t'ont suivi ». Le bad buzz reste une vraie perte (sponsoring, meetings futurs) sans jamais pouvoir bloquer la promotion (le challenge a montré un plafond AFK à ~17 M avec une gate sur le stock courant).
- La révélation du Sens ne bouge pas.

### P6 Figure politique — verbes : convertir l'audience, sceller des alliances
Arrivée échelonnée : meetings → ferme à propagande → alliances (acte) → réseau d'influence.
- **Le meeting brûle l'audience.** « Tenir un meeting » (6 énergie, **cooldown propre de 15 s**) consomme 2 % des followers (minimum 10 000) et les convertit en Emprise (0,002 Emprise par follower consommé). Sans cooldown, le meeting spammé écrase alliances et générateurs (chiffré au challenge) ; à 15 s, meetings ≈ 133 Emprise/s, alliances ≈ 222/s, générateurs ~100/s : le trio coexiste. Les followers deviennent une ressource qui s'épuise en Acte III (thèse, jamais commentée).
- Générateurs renommés en verbes : « Installer une ferme à propagande », « Tisser un réseau d'influence ».
- Acte renommé : « Sceller une alliance » (grant **1e4**, réduit de 2e4), compteur affiché (« 3 alliances »). Gate présidence (50 000 Emprise) en ≈ 2 min de mix actif, phase ~4 à 5 min.

### P7a Président — verbes : prendre le contrôle, réprimer
Arrivée échelonnée : 2 premières institutions → la Résistance apparaît (dès 2 institutions) → cibles de répression → institutions restantes → lois d'exception.
- **Damier des institutions (conquête autofinancée).** 5 cibles UNIQUES, coût € one-shot, chacune rapporte de l'Emprise/s ET des €/s (la banque centrale imprime, les médias captés monétisent : métaphore froide et juste ; correctif central du challenge, sinon le damier est inachetable avec un revenu € gelé depuis l'Acte II) :

  | Cible | Coût | €/s | Emprise/s | Répression |
  |---|---|---|---|---|
  | Contrôler les médias nationaux | 2 M€ | +100 k | +1 000 | oui |
  | Soumettre le parlement | 10 M€ | +300 k | +3 000 | non |
  | Capturer la banque centrale | 40 M€ | +800 k | +6 000 | non |
  | S'attacher l'armée | 120 M€ | +2 M | +12 000 | non |
  | Surveiller la population | 300 M€ | +4 M | +25 000 | oui |

- **La Résistance.** Jauge 0..100, +1/s dès que 2 institutions sont contrôlées. L'Emprise/s est multipliée par (1 − résistance/150). Chaque cible de répression possédée : −2/s sur la jauge. Le contrôle appelle la contestation, la contestation appelle plus de contrôle. Purement mécanique, jamais commenté.
- Acte : « Faire passer une loi d'exception », grant **2e5** (écrasé depuis 4e6 : sinon 3 actes suffisaient à sauter la phase et le damier devenait décoratif), compteur (« 4 lois »). Gate monde : 1e7 d'Emprise, phase cible ~6 à 8 min.

### P7b Maître du monde — verbe : annexer
Arrivée échelonnée : continents un à un → Résistance mondiale (reset à 0, pente +1,5/s) → répression planétaire.
- **Damier des continents.** 6 cibles uniques, mêmes principes (€/s + Emprise/s). Le damier du président reste affiché, réduit et grisé : la conquête d'hier devient un acquis banal.

  | Cible | Coût | €/s | Emprise/s | Répression |
  |---|---|---|---|---|
  | Annexer l'Europe | 0,8 Md€ | +8 M | +300 k | non |
  | Annexer les Amériques | 2 Md€ | +20 M | +800 k | non |
  | Annexer l'Afrique | 5 Md€ | +50 M | +1,5 M | non |
  | Annexer l'Asie | 12 Md€ | +120 M | +3 M | non |
  | Déployer les essaims de drones | 25 Md€ | +0 | +6 M | oui |
  | Étendre la surveillance totale | 50 Md€ | +250 M | +10 M | oui |

- Acte : « Annexer une région », grant **1e8** (écrasé depuis 2e9), compteur (« 7 régions »). Gate empereur : 5e9, phase cible ~8 à 10 min.

### P8 Empereur cosmique — verbe final : plus rien (le jeu se joue seul)
Arrivée échelonnée : première sonde (achat unique) → croissance autonome → paliers cosmiques automatiques → moissonneuses → épilogue.
- **Sondes auto-répliquantes.** « Lancer la première sonde von Neumann » (50 Md€, achat unique). Ensuite `probes ×= (1 + PROBE_GROWTH × dt)` avec **PROBE_GROWTH = 3 %/s** (doublement ~23 s ; à 1,5 % l'épilogue traînait ~30 min, chiffré au challenge). Emprise/s = probes × 1. Épilogue (1e15) en ~17 min de phase, contemplatives.
- **Paliers cosmiques** franchis automatiquement (1e3 sondes : « Le système solaire est couvert. » ; 1e6 : « La galaxie est quadrillée. » ; 1e9 : « L'amas local répond. » ; 1e12 : « Le vide intergalactique aussi. ») : une ligne froide toutes les ~4 min. La progression continue, elle n'a plus besoin du joueur.
- « Récolter une moissonneuse stellaire » reste un achat répétable (sink €).
- Acte : « Coloniser un système stellaire », grant **1e12** (écrasé depuis 4e14 : l'acte à 4e14 donnait l'épilogue en 3 clics et tuait les sondes), compteur (« 12 systèmes »). L'acte est du rituel, pas du moteur (~2 % du seuil sur la phase).
- La Résistance n'existe plus à cette échelle (il ne reste personne pour résister) : la jauge disparaît, sans commentaire.
- Tuile Énergie masquée dès président (plus rien ne la consomme après le meeting politique ; « le pouvoir absolu ne fatigue pas »).

## Évolution de l'UI

| Étape | Ce qui s'ajoute |
|---|---|
| Plongeur | Papier blanc minimal (inchangé). |
| Développeur | Écran-fenêtre actuel + tuile « Bugs résolus » + carte de mission avec barre de progression et compte à rebours. |
| Lead dev | Panneau « Équipe » (effectif en pastilles) + bannière d'incident rouge qui casse le calme. |
| CTO | Cartes de décision (2 options côte à côte), première mise en scène riche. |
| Fondateur (Acte II) | Le panneau fleurit : sparkline du revenu (60 s, buffer côté UI), tuiles KPI avec flèches de tendance, palette chaude, halo sur la keynote pendant le boost, tuile « On parle de toi ». C'est ici que le jeu devient BEAU. |
| Célébrité | Skin réseau social : composeur « Publier », fil des derniers posts avec engagement, bannière de tendance pulsante, bandeau de bad buzz rouge, accent rose/violet. Sommet de chaleur visuelle. |
| Politique (Acte III) | Bascule froide existante + meeting avec cooldown visible + compteur d'alliances. |
| Président | Damier des institutions (grille qui se remplit en bleu froid) + jauge de Résistance. |
| Maître du monde | Second damier au-dessus du premier grisé ; la carte du pouvoir s'empile. |
| Empereur | Les nombres défilent seuls, paliers cosmiques en lignes froides, tuile Énergie disparue ; l'UI n'offre presque plus de prise. |

## Récapitulatif des constantes nouvelles

| Constante | Valeur |
|---|---|
| LEAD_HIRING_BONUS | 200 € |
| MISSION_PERIOD / MISSION_WINDOW | 45 s / 30 s |
| Missions (bugs, prime) | 10/25 € ; 15/60 € ; 20/150 € |
| Gate dev → lead | 40 bugs + 2 missions |
| INCIDENT_PERIOD / malus / coût / auto-extinction | 75 s / ×0,5 / 10 énergie / 40 s |
| Seuils cartes CTO (gains cumulés depuis CTO) | 3 500 / 7 000 / 12 000 / 18 000 / 25 000 € |
| Gate CTO → fondateur | 30 000 € + 5 décisions |
| KEYNOTE_PERIOD / boost / durée / followers / coût | 60 s / +50 % produits / 15 s / +5 000 / 6 énergie |
| Presse : levée / acquisition | +10 000 / +3 000 followers |
| Gate fondateur → célébrité | 8 M€ + 1 levée |
| Followers par post | 500 + 0,2 % des followers |
| TREND_PERIOD / TREND_WINDOW / multiplicateur | 50 s / 10 s / ×8 |
| BADBUZZ_PERIOD / décalage / drain / réponse / auto-extinction | 100 s / +15 s / −1,5 %/s / 8 énergie / 20 s |
| Gate célébrité → politique | maxFollowers ≥ 50 M |
| Meeting : cooldown / consommation / taux / coût | 15 s / max(10 000 ; 2 %) / 0,002 / 6 énergie |
| Grants d'actes (alliance / loi / région / colonisation) | 1e4 / 2e5 / 1e8 / 1e12 |
| Résistance : pente président / monde / facteur / répression | +1/s / +1,5/s / (1 − r/150) / −2/s par cible |
| PROBE_GROWTH / coût 1re sonde / Emprise par sonde | 3 %/s / 50 Md€ / 1/s |
| Paliers cosmiques (sondes) | 1e3 / 1e6 / 1e9 / 1e12 |

## Hors périmètre (assumé)

- Pas de refonte de l'Acte I. Pas de nouvelle ressource « notoriété ». Pas de RNG. Le système Sens/karma/épilogue ne bouge pas (l'épilogue reste à 1e15 d'Emprise).

## Sauvegarde

`SAVE_VERSION` 5 → 6. Convention existante du projet : version différente → archivage de l'ancienne save et départ à neuf (pas de migration fine). Les nouveaux champs : `bugsResolved`, `missionsDone`, état de mission courante, état d'incident, `decisionIndex` + effets, `ctoEarned`, timers keynote/tendance/bad buzz, `maxFollowers`, `meetingCooldown`, `acteCount`, `resistance`, `probes` (Decimal).

## Ordre d'implémentation (TDD, groupé en chunks)

- **A. Moteur, arc dev** : passe CTA/wording globale + contenu mort supprimé + `bugsResolved` + missions + prime lead + incidents + cartes CTO + nouvelles gates dev/lead/CTO. Bump SAVE_VERSION.
- **B. Moteur, Acte II** : keynotes + presse + gate « Sortir de l'ombre » + posts scalants + tendances + bad buzz + `maxFollowers` + gate politique.
- **C. Moteur, Acte III** : meetings (conversion + cooldown) + actes renommés/compteurs/grants écrasés + damiers institutions/continents (€/s + Emprise/s) + Résistance + sondes + paliers + masquage énergie.
- **D. UI, Actes I et II** : tuile bugs, carte mission, panneau équipe, bannière incident, cartes de décision, sparkline + embellissement Acte II, keynote, skin célébrité, bannières tendance/bad buzz.
- **E. UI, Acte III** : meeting + compteurs d'actes, damiers, jauge de Résistance, paliers cosmiques, empereur contemplatif.
- **F. Vérification finale** : build + suite + svelte-check + playtest navigateur phase par phase, puis commit.
