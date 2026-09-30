# Refonte de la progression : une pente graduelle vers le cynisme (v1, challengée)

> Statut : squelette challengé le 2026-09-27 (go conditionnel, 6 bloquants intégrés ci-dessous). Prochaine étape : détailler chapitre par chapitre avec Alexandre, un chapitre validé à la fois. Les jalons d'interface viendront APRÈS la validation des étapes.
> Références : [études de cas 2](../../../knowledge/references/etudes-de-cas-jeux-2.md) (25 jeux, sourcés), [études de cas 1](../../../knowledge/references/etudes-de-cas-jeux.md).

## Cadrage acté (2026-09-27)

- Échelle des métiers **ajustable** : départ plongeur, arrivée empereur cosmique, thèse inchangée.
- Registre : **satire grinçante**. Drôle d'abord, glaçant ensuite.
- Colonne vertébrale :
  - **A, l'échelle des compromis.** Chaque métier propose un compromis que le joueur choisit lui-même : concret, rentable, raisonnable pris isolément, un peu plus gros que le précédent.
  - **C, l'humain devient un nombre.** À chaque métier, la représentation des collègues, clients, citoyens recule d'un cran.
  - **B, même geste, autre cible**, en motif ponctuel (4 occurrences : la carte candidat et rencontre au ch3, le commentaire, l'article, les assiettes).
- **Wording concret** : un lecteur doit pouvoir mimer chaque CTA. Objets, chiffres, prénoms. Jamais de jargon creux.

## Diagnostic de l'existant (résumé)

1. La thèse n'est pas jouée : l'axe Vie = « Se reposer » + un achat « Déléguer sa vie perso ». La famille prévue au GDD n'existe pas.
2. Le cynisme arrive par sauts et le joueur ne franchit jamais une ligne lui-même.
3. Porte-monnaie unique incohérent (le lead paie ses juniors de sa poche, le CTO ses GPU ; les levées coûtent 0 € ; `fireTeam()` CRÉDITE les primes de départ au lieu de les faire payer).
4. Agentivité effondrée sur les 3 derniers métiers.
5. L'énergie change de sens à chaque métier ; « Se reposer » mélange recharge et geste de vie.
6. L'UI saute (papier → tableau de bord au dev) puis stagne.

## Règles transverses

### R1. Vie : l'âge, la frise, les prénoms
- Un **âge** avance avec les métiers (22 ans au plongeur, 52 au chef d'État, sans objet à l'empereur). Une simple étiquette, jamais commentée.
- Une **frise de vie** discrète enregistre les gestes. Elle **remplace l'affichage chiffré du Sens** (le nombre reste interne ; frise ET jauge serait YAGNI). Tant que le Sens est caché, elle est jolie et neutre ; à sa révélation (célébrité), elle reçoit sa légende ; à l'épilogue, elle est le seul bilan, sans texte.
- **La vie garde ses prénoms pendant que le travail perd les siens** (C inversé). Camille, Maman, Lou restent nommés jusqu'au bout. Une délégation de LIEN remplace le prénom sur la frise par un nom de service (« Maman » devient « Répondeur IA », voir le chapitre 2 v2). Un lien peut aussi se perdre par négligence (les amis qui n'invitent plus) : même effet sur le Sens, sans nom de service.
- **Corvées et liens.** Déléguer une corvée (courses, ménage) pose un point neutre et ne creuse pas le Sens. Déléguer un lien (l'anniversaire, l'appel du dimanche, la fête d'école) pose un segment gris et creuse le Sens.
- Calibrage Sens : **7 par lien délégué** (au lieu de 12), plafond de gestes vécus relevé de 5 à **12**, pour que le Sens ne tombe pas au plancher dès la politique.

### R2. Énergie et rendez-vous
- L'énergie est l'endurance du joueur pour ses actions ACTIVES. Rien d'autre. **Dormir** la recharge ; ce n'est pas un geste de vie.
- **Les gestes de vie sont des rendez-vous datés** (Clickolding). Une carte arrive à heure fixe (« Dîner avec Sam, vendredi 20 h ») et reste ouverte 30 s. Y aller occupe les mains 20 s : pendant ce temps, la mission, l'incident, la tendance ou la keynote en cours sont perdus. Le calendrier est déterministe et crée volontairement une collision sur deux.
- Ignorer la carte pose un point manqué sur la frise. **Déléguer supprime les collisions pour toujours** (voilà la rentabilité réelle) et ajoute un petit élément d'ambiance vivant à l'écran (le piège est beau).
- En Acte III, il n'y a plus d'événements actifs à perdre : les gestes deviennent gratuits mais rares et cachés (il faut les chercher).

### R3. Les compromis
- Un compromis par métier (deux pour le chef d'État, un par moitié). Présenté comme une option ordinaire, **rentable**, jamais obligatoire.
- **Plafond** : +30 % sur le flux qui mène à la gate, ou 25 % de la gate en one-shot. Ainsi, refuser tout coûte environ +16 min sur 2 h (+13 %, cible < 20 %).
- **Un compromis est gratuit** : c'est un choix, pas un achat ; son prix est moral. (Mesuré en simulation plongeur : à 120 €, un +30 % sur la machine ne se rembourse qu'en ~15 min, donc personne ne le prend et la pente disparaît.)
- Refusé : reste proposé. Accepté : irréversible.
- Un compromis accepté tôt **ouvre une porte plus loin** (Suzerain).
- **L'IA est toujours une fête.** Le compromis porte sur ce qu'on fait des gens ou des données, jamais sur l'automatisation du travail elle-même.

### R4. Le bouton dit vrai, le bandeau euphémise
- Le CTA affiche le geste réel, chiffré : « Licencier 38 des 96 salariés de DataNova (+40 % de revenu) ». C'est aussi le consentement éclairé.
- Le canal périphérique (la ligne du chef, puis les mails, puis le bandeau d'actualités de l'Acte III) euphémise : « DataNova gagne en agilité ». Le cynisme naît de l'écart entre les deux, jamais d'un commentaire.

### R5. Porte-monnaie (à trancher au chapitre Lead dev)
- Proposition : de lead dev à CTO, embauches et IA sont payées par le **budget de l'équipe** ; l'**épargne perso** (salaire fixe + prime annuelle) ne sert qu'au logement, jamais à une gate ; les deux ne s'échangent jamais. Au fondateur, ils fusionnent (« ta vie = ta boîte »).
- Levées de fonds contre des **parts** (dilution visible). Règle de rentabilité : prime ≥ dilution × revenu/s × 300 s.
- Les primes de départ se PAIENT.

### R6. Cadence
- 9 métiers, environ 2 h au total, 2 verbes neufs par métier, une nouveauté perceptible toutes les 1 à 2 min, jamais plus de 2 à 3 min sans rien.
- L'Acte III accélère : 13, 16, puis 8 min.

### R7. Garde-fous anti-blocage (à verrouiller par test)
- Vivier de 8 prénoms au lead ; la gate compte les personnes embauchées au total, pas en poste.
- Budget d'équipe : plancher alloué ≥ coût de la prochaine embauche.
- Sponsors : au plus 1 demande en attente, 1 toutes les 40 s, « Refuser le partenariat » gratuit.
- Vendre l'interface : liste blanche de tuiles décoratives seulement, jamais un verbe, la promotion ou le compteur de sortie.
- La loi qui masque la Résistance GÈLE aussi son effet à la valeur courante.
- L'élection datée ne bloque jamais, elle taxe.

### R8. Trois fils sur toute la partie (2026-09-29, ajustables en chemin)
L'image : un regard d'optimisation, légitime et célébré au travail, déborde peu à peu sur toute la vie. La satire n'est jamais dite : le joueur la vit, parce qu'il a lui-même envie de pousser les chiffres de sa vie. Dominer l'univers en est la conclusion logique : plus rien n'échappe au tableau de bord. Trois conditions : la mesure doit rapporter vraiment (sinon la satire devient un sermon) ; ce que tu cliques dit ce qui compte pour toi ; le jeu ne te punit jamais toi, le coût tombe sur les autres et sur le Sens.

**Fil 1 : ta main suit le goulot.** Chaque chapitre, une personne ou une machine reprend ta tâche manuelle (elle ne « s'automatise » jamais seule), et ta main remonte d'un cran.
- Ch1 : laver. Ch2 : coder et corriger. Ch3 : coder, puis appeler des entreprises et aller aux déjeuners (un commercial reprend les appels, pas les déjeuners).
- Ch4 : un directeur commercial prend les déjeuners, la prospection s'automatise ; ta main ne sert plus qu'à ta vie.
- Ch5 : l'IA remplace l'équipe, puis ta vie ; la main ne sert plus à rien (clic factice).
- Ch6 à 9 : la main sert à posséder et à dominer.

**Fil 2 : l'échelle des achats.** Des prix réalistes ; l'incrémental vient de ce qu'on achète.
- Ch1 : de l'équipement. Ch2 : des outils et des abonnements. Ch3 : des postes et des bureaux (qui limitent les places, illustrés comme le logement).
- Ch4 : des équipes, des étages, le patrimoine (compte-titres, immobilier avec apport et crédit), la voiture. Ch5 : des GPU, des rachats, des levées. Ch6 à 9 : des médias, des institutions, des pays, des planètes.

**Fil 3 : de la mesure au maladif.** Une mesure s'achète une fois et révèle une règle cachée qui rapporte (la montre du ch1 en est le modèle). Une optimisation est une délégation unique. Jamais de suivi par clics répétés (ce serait du travail déguisé), jamais de score qui commente (R4).
- Ch1 : la montre révèle le revenu par minute. Ch2 : « Ton repos : +N énergie / min », les ratios (« Appels de Maman décrochés : 6 sur 7 »).
- Ch3 : le tableur des soirées (combien tu peux en sacrifier).
- Ch4 : la montre connectée, le sommeil, le patrimoine ; l'onglet Perso dépasse l'onglet Pro.
- Ch5 : les courbes de Lou (percentiles), le tableau de bord de vie parfait, l'apogée de beauté.
- Ch6 : ta vie devient contenu, mesurée en followers ; le Sens se révèle.
- Ch7 à 9 : la même grille appliquée à une population, à la Terre, à l'univers.

### Hors périmètre v1 (YAGNI)
- « Reprendre sa vie en main » à coût croissant : v2. Le rendez-vous manqué suffit à rendre la vie coûteuse.

## L'échelle (9 métiers)

> **2026-09-28 : les chapitres 2 à 5 changent.** Plus de CDI, de lead dev ni de CTO : c'est ta propre boîte qui grandit (freelance, studio, agence, boîte d'IA). Passer de freelance à CDI se lisait comme une régression, et payer ses juniors ou ses GPU de sa poche n'a de sens que si la boîte est à toi. Les fiches des chapitres 3 à 5 ci-dessous datent de l'ancienne échelle et seront reprises chapitre par chapitre. La fiche du chapitre 2 est remplacée par la section « Chapitre 2 détaillé » plus bas.

| # | Métier | Âge | Durée | Les autres, vus comme | Compromis |
|---|---|---|---|---|---|
| 1 | Plongeur | 22 | 10 min | toi seul, le chef par une ligne | Programmer le lave-vaisselle en cycle court |
| 2 | Développeur freelance | 24 | 14 min | toi seul, clients nommés | Désactiver le test qui échoue |
| 3 | Ton studio : une équipe | 27 | 14 min | collègues avec prénom, que tu embauches | Garder l'équipe jusqu'à 22 h |
| 4 | Ton agence : plusieurs équipes | 31 | 14 min | pastilles d'initiales, des chefs d'équipe entre toi et eux | à trouver |
| 5 | Ta boîte d'IA | 34 | 16 min | un effectif | Licencier 38 des 96 salariés de DataNova |
| 6 | Célébrité | 40 | 16 min | des followers | Faire la promo du jeton $MOI à ses abonnés |
| 7 | Figure politique | 46 | 13 min | des électeurs en % | Rendre les chômeurs responsables de la dette |
| 8 | Chef d'État | 52 | 16 min | la population en %, puis des milliards | Reporter les élections de deux ans · Couper Internet dans les régions qui résistent |
| 9 | Empereur cosmique | sans objet | 8 min | plus personne | Démonter la Terre pour fabriquer des sondes |

La pente des victimes : personne (des assiettes grasses) → un client → ton équipe → des inconnus (leurs données) → 38 salariés comptés → tes propres fans → un groupe entier → la démocratie → des régions → la Terre, où vivent Camille et Lou.

### Acte I, pauvre (papier blanc)

**1. Plongeur, 22 ans (~10 min)**
- Verbes : laver, s'équiper, acheter des machines, poser les gants. **L'information se paie** : l'argent s'affiche en pièces dans un bocal, non chiffré, jusqu'à « Ouvrir un compte en banque » ; « S'acheter une montre » révèle le revenu par minute.
- Compromis : « Programmer le lave-vaisselle en cycle court » (machines +30 %, une assiette sur cinq ressort grasse ; le chef ne dit rien).
- Vie : « Regarder par la fenêtre » apparaît après 20 s sans clic (0 €, un point sur la frise). Premier rendez-vous : « Appeler Maman, dimanche ».
- Promotion : 5 livres lus → « Répondre à l'annonce de Mme Duval » (site vitrine de sa boulangerie).

**2. Développeur freelance, 24 ans (~14 min)** (fiche remplacée, voir « Chapitre 2 détaillé »)
- Verbes : **missions payées à la livraison** (le clic résout les bugs qui font avancer la mission ; plus de paiement au bug). Clients : Mme Duval (site vitrine), M. Petit (appli du club de foot), Kévin (migration de sa start-up de livraison). Puis « Écrire un script qui met les sites en ligne » : une file de 3 tâches qui s'exécute seule, première automatisation de son travail, célébrée.
- Compromis : « Désactiver le test qui échoue » (mission livrée tout de suite ; le bug revient chez Kévin sous forme d'incident quand on y est lead).
- Vie : « Dîner avec des amis, vendredi 20 h », « Aller courir ». Délégation de corvée : « Se faire livrer ses courses » (point neutre).
- Promotion : 3 missions livrées à Kévin → « Accepter le CDI que propose Kévin ».

### Acte II, confort (couleur, puis beauté)

**3. Lead dev, 27 ans (~14 min)** (fiche remplacée, voir « Chapitre 3 : Ton studio »)
- Verbes : **embaucher des personnes avec un prénom** (vivier de 8, au plus 5 en poste). **L'astreinte nominative** : chaque personne bascule entre « Coder » (produit) et « Astreinte » (éteint seule un incident en 5 s, ne produit rien). Charge individuelle : +1 pastille par incident éteint ; à 5, arrêt maladie 60 s. « Offrir un afterwork » remet tout à 0 (énergie, recharge 90 s). Incident sans personne d'astreinte : « Redémarrer le serveur à 3 h ».
- Compromis : « Garder l'équipe jusqu'à 22 h » (+30 % de production, +1 pastille/min pour tous ; le premier à 5 démissionne et sa place reste vide).
- Vie : « Accepter le verre de Camille » (le couple démarre). Délégation de lien : « Programmer ses SMS d'anniversaire à l'avance ».
- Promotion : 5 personnes embauchées au total et l'équipe a livré 12 000 € → « Accepter le poste de CTO ».

**4. CTO, 31 ans (~14 min)**
- Verbes : **brancher l'IA colonne par colonne** (Paperclips, Human Resource Machine). Un kanban de 5 colonnes (Tests, Revue, Déploiement, Support, Astreinte) avec des initiales dedans. « Brancher l'IA sur les tests » (9 k€), puis 15 k, 25 k, 40 k, 60 k. Chaque colonne passe au vert, ses incidents disparaissent, ses initiales glissent vers « Sans affectation » (salaire toujours dû). La dernière colonne tue les incidents : cascade célébrée. **Trancher** : 3 cartes, dont 2 portes.
- Compromis : « Entraîner l'IA sur les messages privés des utilisateurs » (IA +25 % ; porte : « Surveiller la population » coûte 30 % de moins au chef d'État).
- Vie : « Emménager avec Camille ». Délégation de lien : « Laisser l'IA répondre aux messages de Camille ».
- Promotion : 5 colonnes branchées et 3 cartes tranchées → « Fonder sa boîte d'IA ».

**5. Fondateur, 34 ans (~16 min, apogée de beauté)**
- Verbes : lancer des produits ; « Céder 15 % de sa boîte contre 150 000 € » (dilution visible) ; « Racheter DataNova (96 salariés) » ; keynotes ; « Remplacer l'équipe par l'IA » (primes de départ payées). Ensuite, « Résoudre un bug » reste cliquable au même emplacement, animé, à 0 € et 0 énergie (travail factice, jamais signalé).
- Compromis : « Licencier 38 des 96 salariés de DataNova » (filiale +40 %/s ; le bandeau : « DataNova gagne en agilité »).
- Vie : « Accueillir Lou » (naissance). Délégations de lien : « Engager une nounou à plein temps », « Confier l'appel du dimanche à Maman à une IA vocale » (« Maman » devient « VoixIA » sur la frise). Chaque délégation ajoute un élément d'ambiance vivant.
- Promotion : 8 M€ et une levée → « Accepter l'invitation d'un plateau télé ».

**6. Célébrité, 40 ans (~16 min, charnière)**
- Verbes : poster et surfer la tendance ; **les sponsors dictent** (une demande en file bloque « Publier » tant qu'on ne l'a pas acceptée ou refusée) ; **la polémique** est une rafale de commentaires critiques qu'on éteint avec « Supprimer un commentaire » (motif B, 2e occurrence).
- Compromis : « Faire la promo du jeton $MOI à ses abonnés » (+2 M€ ; le jeton s'effondre, −8 % de followers courants, le pic reste).
- Vie : « Aller à la fête d'école de Lou ». Délégations : « Envoyer son assistante à la réunion parents-profs », « Filmer l'anniversaire de Lou pour un sponsor ». **Le Sens se révèle** : la frise reçoit sa légende.
- Promotion : pic de 50 M followers → « Entrer en politique ».

### Acte III, pouvoir (froid, dystopique)

**7. Figure politique, 46 ans (~13 min)**
- Verbes : **tenir des meetings** (convertir des followers en Emprise) ; **promettre** (« Promettre le métro gratuit à Lyon » : des voix maintenant, une dette plus tard). Le **bandeau d'actualités** apparaît. Achats renommés : « Payer 500 faux comptes », « Inviter des députés à dîner », « Serrer la main d'un milliardaire ».
- Compromis : « Rendre les chômeurs responsables de la dette » (meetings +40 % ; porte : +0,5/s de Résistance au chef d'État).
- Vie : « Assister au spectacle de fin d'année de Lou » (rare).
- Promotion : Emprise → « Se présenter à la présidentielle ».

**8. Chef d'État, 52 ans (~16 min, fusion président + maître du monde)**
- Première moitié : damier des institutions (« Contrôler les médias nationaux », « Nommer un ami à la banque centrale », « Nommer ses généraux », « Surveiller la population »…), Résistance, **élection datée** toutes les 4 min (−10 % d'Emprise courante si l'adhésion est sous 50 %). Après les médias, le bandeau ne publie plus que du positif, et « Supprimer un article » a le même bouton et le même son que « Supprimer un commentaire » (motif B, 3e occurrence). « Signer un décret sans vote ». Le dernier décret masque la jauge de Résistance et gèle son effet : un trou reste visible dans la grille.
- Compromis 1 : « Reporter les élections de deux ans » (supprime la taxe électorale).
- Seconde moitié : « Proclamer le gouvernement mondial », puis le damier des continents.
- Compromis 2 : « Couper Internet dans les régions qui résistent » (Résistance −50 %).
- Vie : « Aller aux 18 ans de Lou », ou « Envoyer un attaché aux 18 ans de Lou ».
- Promotion : Emprise → l'empire cosmique s'ouvre.

**9. Empereur cosmique (~8 min, le final accélère)**
- Verbes : **liquider l'interface pour lancer la sonde**. La première sonde coûte 50 Md€ ; chaque tuile de la liste blanche se vend 6 à 12 Md€ (en vendre 4 avance la sonde d'environ 5 min). Puis les sondes se répliquent seules et l'écran vidé se remplit de leurs points. À l'emplacement exact du premier bouton du plongeur réapparaît un bouton vide ; il incrémente un compteur « assiettes » sans effet (motif B, 4e occurrence).
- Compromis : « Démonter la Terre pour fabriquer des sondes » (sondes ×10, soit environ 77 s gagnées).
- Option : « Vendre sa frise » (15 Md€) : l'épilogue montre alors une frise vide.
- Épilogue : la frise comme seul bilan, puis deux choix (régner sur le vide, ou renoncer et renaître). Aucun commentaire.

## Chapitre 1 détaillé : Plongeur (v2, challengé, en test par Alexandre)

**Intention.** Apprendre la grammaire de l'idle (clic, équipement, passif, automatisation) dans un monde pauvre et concret, drôle. Poser les fils du jeu : le chef (canal périphérique), le calendrier, la frise de vie, le premier compromis. La durée n'est pas une cible : Alexandre jugera au test (simulé : ~10 min à 4 clics/s, ~12 min à 2 clics/s).

**Incohérences de l'existant corrigées.**
- Un plongeur n'achète pas 15 lave-vaisselle au restaurant : les machines deviennent des **objets uniques et concrets**, jamais des générateurs répétables.
- On ne lave pas plus d'assiettes que le restaurant n'en salit : **pile finie**, revenu plafonné par l'affluence.
- « Se reposer » juste après avoir posé les gants ne servait à rien : il disparaît du chapitre (« Dormir » arrive avec le freelance, quand le clic coûte de l'énergie).
- Les gants pro promettaient 20 assiettes/s à la main alors que la fatigue plafonnait la main à 6/s : l'équipement réduit désormais la **fatigue**, la jauge bouge vraiment.
- La montre révélait un revenu qui excluait le clic : elle affiche les **gains réels des 60 dernières secondes**.
- Le bouton « Laver une assiette » mentait dès les gants : il dit le nombre (« Laver 4 assiettes »).
- `poseGantsVisible` se déclenchait à 2 machines : il se déclenche au lave-vaisselle pro.
- Les multiplicateurs de la vieille machine (joint, panier, détartrage) ne s'appliquent qu'à elle ; le cycle court (un programme) s'applique aux deux.

### Le restaurant : calendrier, pile, affluence
- **Un jour = 25 s**, du lundi au dimanche (une semaine ≈ 3 min). Le jour est affiché en petit (« Samedi »). Le restaurant est **fermé le dimanche** au départ.
- **Couverts par jour** : 40 au départ, 3 assiettes par couvert. Les assiettes sales arrivent dans une **pile** affichée (« 34 assiettes sales ») ; la moitié arrive pendant le **coup de feu de midi** (les 8 premières secondes du jour), c'est là que cliquer compte.
- **Débordement** : au-delà de 60 + couverts assiettes en attente, le chef lave lui-même le surplus (perdu pour toi, jamais bloquant). Ligne : « Le chef a fait la plonge lui-même. Il n'a rien dit. »

### Les demandes au chef (idée d'Alexandre, challengée)
- Quand ta pile est restée vide au moins 12 s sur la journée (tu vas plus vite que le restaurant), une demande apparaît : « Proposer au chef d'ouvrir le soir », avec un sous-titre qui dit l'effet (« +15 couverts par jour »). C'est une action du joueur, gratuite, gatée par sa vitesse, au plus une par jour.
- Challenge retenu :
  - elle doit apparaître **seulement** quand tu vas assez vite, sinon on la clique dès la première seconde et la pile déborde ; c'est ce qui rend la boucle alternée (acheter de la capacité, vider la pile, demander, la pile remonte) ;
  - comme elle est toujours bénéfique pour le revenu, son intérêt n'est pas le choix mais la **satire** : tu demandes toi-même plus de travail au même tarif, et l'une d'elles a un prix de vie écrit dans le sous-titre ;
  - « Proposer » plutôt que « Demander » : un plongeur ambitieux propose, le chef accepte parce que tu suis.
- La liste (9 demandes, ×1,3 environ chacune) :

| # | CTA | Sous-titre | Ligne du chef |
|---|---|---|---|
| 1 | Proposer au chef d'ouvrir le soir | +15 couverts par jour | « Si tu suis, moi je veux bien. » |
| 2 | Proposer une formule du midi à 12 € | +20 couverts par jour | |
| 3 | Proposer d'installer une terrasse | +25 couverts par jour | |
| 4 | **Proposer d'ouvrir le dimanche** | **+1 jour de service par semaine. Tu travailles le dimanche.** | « Ta mère comprendra. » |
| 5 | Proposer d'accepter les groupes | +35 couverts par jour | |
| 6 | Proposer un brunch le samedi | +45 couverts par jour | |
| 7 | Proposer de s'inscrire sur une appli de livraison | +65 couverts par jour | |
| 8 | Proposer de louer la salle pour des séminaires | +85 couverts par jour | |
| 9 | Proposer de faire traiteur pour des mariages | +120 couverts par jour | « Tu es la meilleure chose qui soit arrivée à ce restaurant. Toujours 5 centimes l'assiette. » |

### La vie dans ce chapitre
- **Maman appelle le dimanche à midi.** Carte « Décrocher » ouverte 30 s ; décrocher occupe les mains 20 s (pendant ce temps elles se reposent : +60 d'énergie). Ignorer pose « Maman (message vocal) » sur la frise.
  - Tant que le restaurant est fermé le dimanche, l'appel ne coûte rien : c'est un moment doux.
  - Après « Proposer d'ouvrir le dimanche », l'appel tombe en plein coup de feu : décrocher coûte des assiettes. **La collision est provoquée par ta propre demande.** C'est le premier arbitrage vie/travail du jeu, et c'est le joueur qui l'a créé.
- **« Regarder par la fenêtre »** apparaît après 20 s sans aucune action (ni clic ni achat ; l'appel ne compte pas), au plus une fois par jour. Lignes tournantes : « Il pleut sur le parking. », « Le livreur fume sous l'auvent. » Un point sur la frise. Il se découvre naturellement quand la machine travaille seule (automatiser son travail libère du temps pour vivre), ou très tôt pour le joueur passif (l'inactif est récompensé par la vie).
- La frise apparaît au premier geste.

### Le compromis : les assiettes grasses (version d'Alexandre + choix)
- Débloqué avec le joint : « Passer la machine en cycle court (+30 % d'assiettes, une fournée sur cinq ressort grasse) ». Gratuit, réversible tant qu'on ne l'a pas activé, puis permanent.
- Une fournée sur cinq ressort grasse : **la machine s'arrête**, son revenu est gelé, message « Assiettes grasses. Le lave-vaisselle est à l'arrêt. » Deux boutons :
  - « Relancer un cycle » : on relave (~8 s de machine perdues) ;
  - « Les ranger quand même » : rien de perdu. Au service suivant : « Un client s'est plaint de la propreté de son assiette. Le chef l'a essuyée et l'a resservie. »
- Le vrai compromis est ce second bouton, refait à chaque fournée : gratuit, rentable, et c'est le client qui paie. Sans action, la machine reste à l'arrêt, sans blocage (un clic suffit).

### Séquence (simulation v3, joueur glouton à 4 clics/s qui demande tout dès que possible)

| t | Déblocage | Coût | Effet |
|---|---|---|---|
| 0:00 | « Laver une assiette » | | 1 assiette/clic ; « 5 centimes l'assiette. En liquide. » ; un bocal de pièces |
| 0:02 | « Mettre des gants de plonge » | 0,50 € | 2/clic |
| 0:07 | « Acheter une vraie éponge » | 2 € | 4/clic |
| 0:25 | Demande 1 : ouvrir le soir | gratuit | 55 couverts/j |
| 0:27 | « S'acheter une montre » | 5 € | gains des 60 dernières secondes |
| ~0:30 | « Ouvrir un compte en banque » (25 € gagnés au total) | gratuit | le solde s'affiche ; « Tu vides le bocal au guichet. » |
| 0:51 | Coup de main (300 assiettes lavées) | gratuit | les mains lavent seules 10/s ; l'énergie apparaît ; « Tes mains lavent toutes seules. » |
| 1:15 | Demande 3 : terrasse | | 100 couverts/j |
| 1:17 | « Réparer le vieux lave-vaisselle de la réserve » | 20 € | 6 assiettes/s sans fatigue ; « Elle marche ? Elle reste au restaurant. » |
| 1:40 | Demande 4 : **ouvrir le dimanche** | | Maman tombera en plein service |
| 2:16 | « Enfiler des gants pro » | 40 € | 6/clic, fatigue −40 % |
| 3:21 | « Changer le joint de la machine » | 60 € | vieille machine ×1,5 ; le compromis devient disponible |
| 4:17 | « Acheter un deuxième panier à vaisselle » | 100 € | vieille machine ×1,5 |
| 5:21 | « Installer une douchette de prélavage » | 135 € | fatigue −33 % |
| 6:42 | « Détartrer la machine » | 175 € | vieille machine ×1,5 |
| 8:05 | « Payer la moitié d'un lave-vaisselle pro au chef » | 240 € | +40 assiettes/s ; « On dira que c'est un investissement. » |
| 8:05 | « Poser les gants » | | fin du manuel ; « Tu la lances le matin et tu rentres. Toujours 5 centimes l'assiette. » |
| 8:05 à 10:04 | 5 études : « Acheter un manuel de HTML d'occasion », « S'inscrire au cours du soir de la mairie », « Acheter un manuel de JavaScript », « Acheter un ordinateur portable reconditionné », « Passer l'examen du cours du soir » | 30 → 110 € | la fenêtre se découvre ici |
| 10:04 | « Répondre à l'annonce de Mme Duval » | | « Boulangerie Duval. Cherche quelqu'un pour faire notre site. » Le chef : « Ta moitié de machine ? Je la garde. Un investissement, on avait dit. » |

Variantes mesurées (fin du chapitre) : 2 clics/s 12:04 · 6 clics/s 9:43 · refuser le cycle court 10:42 (+6 %) · relancer chaque fournée 10:23 · ne jamais ouvrir le dimanche 10:34 · ne plus cliquer après le coup de main 15:14, sans blocage. Plus long écart entre deux nouveautés : 82 s (fin de chapitre, capacité limitante : à resserrer au TDD).

### Garde-fous et sauvegarde
- Les minuteurs (jour, appel, fournée grasse) sont persistés en temps de jeu ; le hors-ligne ne les fait pas avancer et un appel en cours au rechargement se termine (point posé).
- Hors-ligne plafonné à 10 min en Acte I (sinon 4 h d'absence sautent le chapitre, compromis compris).
- `SAVE_VERSION` 6 → 7 (les anciens lave-vaisselle étaient comptés en quantité).
- Gardé de l'existant : clic sans énergie, révélation progressive (prix visible vers 75 %, 2 lignes au plus), revenu hors-ligne passif ; `vieVecueTicks` alimenté par la fenêtre et par Maman.

### Décisions d'implémentation (2026-09-27, retours d'Alexandre sur les maquettes + 3e challenge)
- **Deux colonnes** : « Travail » (jour, pile, bouton Laver, mains, dernière minute, lave-vaisselle, améliorations, le chef, poser les gants, l'annonce) et « Ta vie » (âge, énergie, appel de Maman, tes études, la fenêtre, souvenirs). L'argent et la réplique du chef sont en tête, sur toute la largeur. « Ta vie » naît au coup de main (avec l'énergie) ou au premier moment de vie ; sur téléphone, les colonnes s'empilent, Travail d'abord.
- **L'énergie est côté vie** : la fatigue du travail la vide (1 énergie par assiette lavée à la main, 0,6 avec les gants pro, 0,4 avec la douchette ; au challenge, 0,5 laissait la jauge au-dessus de 93, donc morte), et elle alimente les études. Écho côté travail : « Tes mains : 7 assiettes / s (fatiguées) ».
- **L'argent avant la banque** : « Dans ta poche : 8 pièces de 5 centimes », puis « environ 3 € en pièces » ; la banque donne le centime près (« Bocal » rejeté, pas clair).
- **Souvenirs** au lieu de la frise (rejetée : on ne comprenait pas ce qu'elle représentait) : une ligne par moment, « Dimanche : Maman t'a raconté son jardin. », les manqués en gris. Chaque souvenir est typé (lien, contemplation) pour le bilan final et la révélation du Sens. Les études n'y figurent pas.
- **Règle dure : chaque achat affiche son sous-titre chiffré**, calculé par le moteur (jamais codé en dur, puisque le cycle court et l'ordre des achats changent les chiffres).
- **Tes études** s'ouvrent en posant les gants (avant : une ligne grise « Quand les machines tourneront seules, tu auras le temps d'étudier. »). Chiffres : manuel de HTML 30 € (6 × 20 pages, 10 énergie), cours du soir 45 € (8 séances, 20 énergie), manuel de JavaScript 60 € (6 × 20 pages), ordinateur reconditionné 150 € (5 exercices, 15 énergie), examen 40 € après le cours (3 révisions puis « Passer l'examen », 15 énergie ; « Reçu. 16 sur 20. »). Total 415 énergie, 325 €. L'appel de Maman suspend les études ; lire ne compte pas comme une action de travail (la fenêtre reste découvrable pendant les études, avec des lignes « chez soi »).
- **Coûts ajustés au moteur réel** : détartrage 150 €, moitié du lave-vaisselle pro 200 € ; une pile de 12 assiettes attend le joueur à son arrivée (le premier bouton n'est jamais grisé).
- **Mesures du moteur** (joueur glouton qui accepte tout) : fin du chapitre à 11:35 à 4 clics/s, 12:09 à 2 clics/s, 10:35 à 6 clics/s, 16:42 sans cliquer après le coup de main ; refuser le cycle court rallonge de 4 %. Plus long creux : 76 s à 4 clics/s. L'énergie descend à ~32 au pire du coup de feu.

### v2 après le premier test d'Alexandre (2026-09-27, 4e challenge)
Retour : trop d'informations d'un coup, trop rapide, « Dans ta poche » pas naturel, « Dernière minute » et « Tes mains » pas clairs, et on n'automatise pas une tâche manuelle. Ce qui change (et remplace les puces ci-dessus quand elles se contredisent) :
- **Plus de mains automatiques.** Seul le clic lave à la main ; les machines prennent le relais. Les gants pro et la douchette donnent des assiettes par clic (6, puis 8). L'énergie ne sert plus qu'aux études et n'apparaît qu'en posant les gants (régénération 2 / s).
- **« Argent : 12,35 € »** au centime près dès le premier clic. Plus de poche ni de compte en banque au début.
- **Revenu automatique** en tête : « Le lave-vaisselle te rapporte 10,29 € / min » (au pluriel avec le pro), hors clic, calculé comme min(débit des machines, assiettes d'un jour ouvert) × jours ouverts / 7 × 0,05 × 60 ; 0 quand la machine est à l'arrêt. La même fonction sert au hors-ligne. Les sous-titres des machines disent « Il te rapporte : A → B € / min » et « Pas plus : le restaurant ne salit pas plus d'assiettes. » quand les arrivées plafonnent.
- **La montre donne le jour et le coup de feu** (« Affiche le jour de la semaine »).
- **Livret A** vers 18:30 : gratuit, +5 % de l'argent chaque lundi (« Aujourd'hui, ce serait +8,40 € »). L'argent qui travaille est célébré ; plafond pour les chapitres suivants à trancher au chapitre 2.
- **Maman en plein service coûte vraiment** : pendant l'appel, la pile ne monte plus et le chef lave à ta place ce que la machine ne suit pas (« Tu perds environ 11,31 € »).
- **Une information à la fois**, par des gates en temps de calendrier (qui ne tourne pas hors-ligne) : gants à 0:45, compteur d'assiettes à la première pile vide après 1:45, montre 90 s après l'éponge, réparation 75 s après la montre, gants pro 45 s après, Maman à partir du 3e dimanche (naissance de « Ta vie »), première demande au chef après 10:15 et la machine réparée (puis 2 jours entre deux demandes ; les couverts s'affichent avec la première), « Proposer d'ouvrir le dimanche » sort de la file et devient une proposition unique au 6e lundi après un appel, livret à 18:30. Le débordement et la fenêtre restent cachés tant que ce qu'ils expliquent n'est pas visible.
- **Coûts** : gants 8 €, éponge 12 €, montre 30 €, réparation 35 € (4 assiettes / s), gants pro 40 €, joint 45 €, panier 70 €, douchette 90 €, détartrage 110 €, moitié du pro 240 €.
- **Mesures du moteur** : fin à 23:38 à 4 clics/s, 24:05 à 2, 23:20 à 6, 31:12 sans cliquer après la réparation ; refuser le cycle court : 26:10 (+11 %). Plus grand écart entre deux nouveautés : 2:56 ; jamais deux informations dans la même demi-minute après le premier clic.

### v3 après le deuxième test d'Alexandre (2026-09-27, 5e challenge)
Retours : le bouton clignotait en cliquant vite ; à 100 assiettes on attendait sans rien pouvoir faire ; les améliorations affichaient « 12,34 € → 12,34 € / min » (pourquoi acheter ?) ; aux études on attendait l'énergie ; le temps doit filer, 200 couverts ; Maman doit tout bloquer (pour qu'on finisse par en avoir marre, l'IA répondra plus tard) mais recharger l'énergie ; plus d'assiettes grasses avec le pro. Ce qui change :
- **L'offre devance la capacité** : 200 couverts, un jour de 15 s (coup de feu 5 s), soit 40 assiettes / s en moyenne. Chaque achat de clic ou de machine rapporte vraiment plus ; le débordement (« Aujourd'hui, il en a lavé 84. ») est la perte visible. Les sous-titres n'affichent jamais « A → A ».
- **Le chef répond au rattrapage** : il paraît 35 s après la réparation, son bouton grisé donne la cible (« Le chef dit oui si tu suis : moins de 4 assiettes sales pendant 6 s dans la journée », « Aujourd'hui : 2 s sur 6 ») ; au plus une demande par jour. Pas de bouton « Attendre » : sauter le temps, c'est sauter le jeu.
- **Une file des nouveautés** : ce que le jeu révèle de lui-même (pile, chef, premier appel de Maman, première fournée grasse, dimanche, premier appel en service, livret, offre du pro, repas) attend 35 s après la nouveauté précédente, et les achats qui changent l'écran (montre, réparation, joint, détartrage, pro, poser les gants, première demande) comptent comme nouveautés. Dimanche : 35 s après le panier, une fois Maman appelée ; livret : 60 s après le premier appel en plein service (ou 240 s après le panier sans dimanche) ; pro : 180 s après le détartrage.
- **Au téléphone, tout s'arrête** (tous les boutons grisés, « Encore 14 s ») ; en raccrochant, l'énergie est pleine (« Énergie : 10 → 100 »). Maman appelle chaque dimanche à partir du 4e.
- **Le lave-vaisselle pro ne sort pas d'assiettes grasses**, même en cycle court.
- **Aux études**, la régénération passive tombe à 0,3 / s ; « Se faire à manger » (+10 énergie, deux repas par jour, sans souvenir : une corvée) et l'appel de Maman rechargent. Étapes plus fines : 10 pages pour 5 énergie.
- **Le bouton « Laver N assiettes » garde un libellé stable** ; il ne dit « Aucune assiette sale » qu'après 1,5 s de pile vide.
- **Chiffres** : gants 3 € (2 / clic), éponge 6 € (3 / clic), montre 65 €, réparation 45 € (6 assiettes / s), gants pro 80 € (4 / clic), joint 50 €, panier 160 €, douchette 200 € (5 / clic), détartrage 260 €, moitié du pro 720 € ; demandes +20, +25, +30, +35, +40, +50, +60, +70 couverts.
- **Mesures du moteur** : 20:30 à 4 clics/s, 29:05 à 2, 16:18 à 6, 34:35 sans cliquer après la réparation ; refuser le cycle court : 21:50 (+6,5 %). Plus grand écart entre deux nouveautés : 2:59 à 4 et 6 clics/s, 3:37 à 2 ; jamais deux nouveautés du jeu dans la même demi-minute ; temps mort d'affilée au plus 20 s.
- **À trancher plus tard** : « Dormir » (spec R2) arrive au freelance ; le repas recharge sans souvenir, pour rester déléguable sans creuser le Sens.

### v3.1 : code nettoyé, début resserré (2026-09-28, 6e challenge)
- **Le réglage vit dans les données.** Chaque chose qui paraît à l'écran a sa ligne dans la table `REVEALS` (`src/engine/content/plonge.ts`), avec sa nature (jeu : attend son tour dans la file ; geste : conséquence d'une action ; offre : un achat qui se propose). Tous les textes sont dans `TEXTES`. Le moteur est découpé dans `src/engine/plonge/`, et l'écran est calculé par `vue.ts`.
- **Mesurer :** `node_modules/.bin/vite-node tests/rythme/frise.ts` (durée, plus grand écart, temps mort, frise avec les achats, nouveautés à moins de 30 s).
- **Début :** les gants se proposent dès le premier euro gagné (grisés jusqu'à 3 €) ; le compteur d'assiettes paraît 35 s après l'achat de l'éponge (90 s après les gants sans éponge) ; la montre 40 s après le compteur ; les gants pro 35 s après le chef (ils tombaient 10 s après lui).
- **Mesures :** à 4 clics/s, gants 0:04 (achat 0:14), éponge 0:15 (0:29), compteur 1:04, montre 1:45 (2:18), réparation 3:03 (3:33), chef 4:08, gants pro 4:43 ; fin 19:29 (29:03 à 2 clics/s, 16:10 à 6, 34:30 en AFK, 21:36 en refusant le cycle court).
- **Restent à trancher :** à 2 clics/s la montre reste grisée 142 s (prix) ; la douchette tombe à moins de 30 s de Maman ou du dimanche ; le souvenir de Maman est daté du lundi (l'appel de 20 s déborde sur le jour suivant).

### v4 après le troisième test d'Alexandre (2026-09-28, 7e et 8e challenges)
- **Restaurant :** 50 couverts, 1 assiette par couvert, arrivées régulières (plus de coup de feu du midi, qui pourra revenir en amélioration). Dimanche fermé dès le début : avant la montre, la pile dit seulement « Pas d'assiette supplémentaire aujourd'hui. ». Sous le compteur, deux lignes réservées (affichées ou non) pour ce qui s'y écrit : le bouton « Laver » ne bouge jamais.
- **Achats :** verbe « Acheter ». Gants au premier euro, puis chaque amélioration se propose quand tu ne suis plus (plus de 2 brassées sales pendant 6 s d'un jour ouvert), ou au plus tard 120 s après la précédente. La montre d'occasion (15 €) vient 30 s après l'éponge et donne le jour. Clic : gants 2, éponge 3, gants pro 4, éponge pro 5, douchette 6. Vieux lave-vaisselle : réparé 10/s, puis joint, panier, détartrage (×1,5 chacun). Pro : +40/s, puis « Poser les gants », puis pendant les études : détartrage du pro (×1,25, les pro déjà installés), deuxième pro (+40/s), adoucisseur (×1,2 sur toutes les machines).
- **Concessions (gratuites) :** « Ne passer qu'un coup d'éponge par assiette » (+20 % par clic), « Programmer le lave-vaisselle en cycle court » (+30 % sur le vieux seulement ; une fournée sur 4 ressort grasse et se relave seule, 6 s sans rien sortir), « Ne plus relaver les assiettes grasses » (plus de relavage ; le client se plaint au service suivant). Plus aucune interruption.
- **Demandes au chef :** soir +40, formule +50, terrasse +60, brunch +70, livraison +100, séminaires +130, mariages +160, petit-déjeuner +120, cantine +140, cars +160, puis, une fois les gants posés, le deuxième restaurant (×2). « Groupes » supprimé. Ouvrir le dimanche se propose après le 3e appel décroché (ou la 5e sonnerie). Un clic sur la demande, et le chef dit oui, sans condition. La suivante se propose quand tu suis (6 s de pile vide sur des jours ouverts depuis la précédente), jamais moins de 35 s après, au plus tard 120 s après ; une fois proposée, elle reste.
- **Maman :** sonne tout le dimanche ; décrocher bloque tout jusqu'à lundi, sauf les machines, et recharge l'énergie. Le souvenir est daté du dimanche.
- **Livret A :** après le premier livre, dépôt et retrait libres ; chaque lundi, 1 % du plus petit solde de la semaine (déposer le dimanche ne rapporte rien).
- **Études :** 60, 120, 240, 480, 960 € (prix doublés à chaque étape).
- **Mesures :** fin 22:22 à 4 clics/s (29:03 à 2, 20:26 à 6, 30:09 en AFK, 24:58 en refusant les concessions) ; plus grand écart 2:44 à 4 clics/s ; à la main, pile vide 2 % du temps, débordement 0 %.
- **Restent à trancher :** après les gants posés, le deuxième restaurant fait déborder la pile environ 7 min, jusqu'au deuxième pro ; en AFK, 4:19 entre l'annonce des études et « Poser les gants ».

### v5 après le quatrième test d'Alexandre (2026-09-28, 9e challenge)
- **Couverts plus rapides :** soir +40, formule +60, terrasse +80, brunch +110, livraison +140, séminaires +180, mariages +210, petit-déjeuner +230, cantine +300 (1400 couverts à la main) ; au moins 20 s entre deux demandes ; le repli à 120 s seulement si la pile tient en deux brassées. Pile sous un clic : 4 % du temps à 2 clics/s, 10 % à 4, 18 % à 6.
- **Gants posés :** plus de compteur de pile ; « Assiettes sales : X / minute » et « Les lave-vaisselle peuvent en laver Y / minute ». Une demande ne se propose que si les machines peuvent laver ce qu'elle ajoute (vérifié sur toute une partie). Pro et deuxième pro : 60/s. Ordre : détartrage du pro, cars +200, deuxième pro, deuxième restaurant +800, adoucisseur, plateaux-repas +600.
- **Vie :** la fenêtre revient tous les 2 jours et reste jusqu'au clic, +20 d'énergie une fois les gants posés ; 52 phrases pour Maman, 77 pour la fenêtre. Examen : 700 €, 50 d'énergie par étape.
- **Écran :** « Mercredi midi / soir » une fois le soir ouvert ; deux lignes réservées sous la pile tant que tu laves à la main ; sous-titres sans titre, en « seconde » et « minute » ; le livret sur une ligne (« ~X € » par lundi si rien ne bouge), deux boutons sans sous-titre.
- **Mesures :** fin 21:00 à 4 clics/s (28:00 à 2, 19:15 à 6, 29:15 en AFK, 22:45 en refusant les concessions) ; plus grand écart 2:15 à 4 clics/s.

**Ce que le joueur a appris en sortant.** Cliquer, s'équiper, automatiser ; que la fatigue ne touche que les mains ; que sa vitesse profite d'abord au chef ; qu'un appel se rate si l'on travaille le dimanche, et que c'est lui qui a proposé d'ouvrir ; qu'un petit arrangement rapporte, et que c'est le client qui paie.

## Chapitre 2 détaillé : Freelance (v1, décidé avec Alexandre le 2026-09-28, challengé deux fois, à relire)

État : implémenté sur la branche claude/narrative-coherence-diver-phase-363174 (plan docs/superpowers/plans/2026-09-29-chapitre-2-freelance.md).

**Pourquoi le refaire.** « Répondre à l'annonce de Mme Duval » menait à l'ancien écran : « Résoudre un bug » payé 1 € au clic, et des missions « 10 bugs en 30 s ». On promettait un site et l'on corrigeait les bugs d'un site qui n'existait pas. On était payé au bug alors que la spec disait « à la livraison ». Mme Duval disparaissait, et l'interface sautait de la feuille blanche au tableau de bord.

**Intention.** Rejouer la grammaire du plongeur dans un monde de code, avec deux sources d'argent qui tirent en sens contraire. **Construire** paie une fois à la livraison. **Entretenir** paie chaque lundi sans toi, mais envoie des bugs. Chaque contrat que tu proposes te charge un peu plus, et c'est toi qui le proposes. Le chapitre se termine quand tu ne suis plus seul : tu embauches, ce qui ouvre le studio. Personne ne te propose de poste, tu grandis.

**Continuité avec le plongeur (mesurée, `playthrough` + `autoIncomePerMin`).** À la sortie, le joueur a 1 à 120 € en poche (les études ont tout pris), un livret vide et 432 € / min de revenu automatique, qui reste au chef avec les machines. Le chapitre 2 part donc de 0 € / min. La première livraison doit rapporter du même ordre par minute, pour que le nouveau métier ne se lise pas comme une régression. L'argent et le livret A (1 % chaque lundi) sont conservés.

### La boucle : deux axes et un carnet
- **Capacité** (lignes de code par seconde) : le bouton « Écrire du code », les outils, puis le générateur.
- **Demande** (lignes commandées par semaine) : des propositions que tu fais toi-même, gratuites, qui ne paraissent que quand tu suis (comme les demandes au chef : carnet vide pendant 6 s, au moins 35 s après la nouveauté précédente, au plus 60 s).
- **Le tarif** dépend du type de commande et monte un peu avec la taille (sinon deux petits sites valent un gros, et la taille n'est pas un levier).
- **Le carnet** est une seule file. Les bugs passent en tête et le clic les traite en premier. Un bug coûte **10 clics fixes, quels que soient les outils** : un clavier ne trouve pas un bug, et le générateur n'écrit que des pages neuves. C'est ce travail de jugement qui sature et justifie l'embauche (chapitre 3), puis l'IA (chapitre 5).
- **Bug ouvert, client qui ne paie pas** : tant que le site d'un client a un bug ouvert, il ne paie pas l'entretien du lundi. La perte est chiffrée (« M. Petit ne paiera pas lundi : l'appli plante au lancement. »), jamais définitive : il suffit de corriger. Les livraisons continuent de payer, donc aucun blocage.
- **Les pièces nommées** (« Page d'accueil », « Horaires d'ouverture », « Photos des viennoiseries », « Plan d'accès ») sont les libellés de la progression de la commande en cours, pas un axe.
- **Supprimé** : « Écrire un script qui met les sites en ligne » (il automatisait une étape que le jeu ne montre jamais).
- **Le générateur écrit même pendant que tu corriges un bug** : c'est une machine, il n'a pas besoin de tes mains.

### Ce que deviennent les axes aux chapitres 3 à 5
- Capacité : toi, puis des collègues avec prénom (studio), des équipes avec leurs chefs (agence), l'IA qui écrit et corrige (boîte d'IA). Les personnes embauchées par leur prénom au chapitre 3 sont celles que l'IA remplace au chapitre 5.
- Demande : Mme Duval et M. Petit, puis Kévin (sa start-up de livraison, un contrat qui exige une équipe), puis des grands comptes, puis le rachat de DataNova.
- Bugs : toi, puis les personnes d'astreinte, puis l'IA qui les éteint tous d'un coup (cascade célébrée).

### Séquence (simulation jetable v2, joueur glouton à 4 clics/s)
Cadence du plongeur : 1 jour = 15 s, l'entretien tombe le lundi. Le clic écrit 5 lignes au départ. Les achats se proposent quand tu ne suis plus (plus de 2 500 lignes en attente ou 3 bugs en file pendant 6 s), au plus tard 120 s après la nouveauté précédente.

| t | Nouveauté | Coût | Effet |
|---|---|---|---|
| 0:00 | Commande de Mme Duval : site vitrine | | 1 200 lignes, 600 € à la livraison |
| 1:05 | « Proposer un contrat d'entretien à Mme Duval » | gratuit | 50 € chaque lundi ; ses bugs arrivent |
| 1:40 | « Laisser tes cartes de visite à la boulangerie » | gratuit | +1 site vitrine par semaine |
| 2:53 | « Proposer une appli à M. Petit » | gratuit | une appli de 4 000 lignes, 2 400 € |
| 3:28 | « Acheter un deuxième écran » | 150 € | 5 → 8 lignes par clic |
| 4:03 | « Acheter un clavier » | 400 € | 8 → 12 lignes par clic |
| 5:49 | « Proposer l'entretien à chaque livraison » | gratuit | chaque site livré devient un contrat |
| 6:24 | « Créer ton profil sur un site de freelances » | gratuit | +2 sites vitrines par semaine |
| 6:59 | « Répondre aux clients le soir » | gratuit | +1 boutique en ligne par semaine ; les bugs arrivent aussi le vendredi soir |
| 7:34 | « Écrire un générateur de pages » | 1 200 € | 20 lignes / s sans toi, sur les pages neuves seulement |
| 8:09 | « Réutiliser le code de tes sites » | 2 000 € | sites suivants : 30 % de lignes en moins |
| 9:03 | « Installer des tests automatiques » | 3 000 € | deux fois moins de bugs ; se propose quand 3 bugs sont arrivés dans la semaine |
| 9:31 | Un test échoue, et « Désactiver le test qui échoue » paraît | gratuit | voir « Le compromis » |
| 10:15 | « Accepter des commandes de boutiques en ligne » | gratuit | +1 boutique par semaine |
| 10:50 | « Apprendre au générateur à faire les formulaires » | 6 000 € | 20 → 60 lignes / s |
| 11:38 | « Demander à tes clients de te recommander » | gratuit | +1 appli par semaine |
| 13:38 | « Prendre les clients d'un freelance qui arrête » | gratuit | +1 appli et +1 boutique par semaine |
| 14:02 | « Embaucher quelqu'un pour corriger les bugs » | | ouvre le chapitre 3 |

Commandes simulées (lignes, € à la livraison, entretien chaque lundi) : vitrine 1 200 / 600 / 50, appli 4 000 / 2 400 / 160, boutique 3 000 / 1 900 / 130. Chaque site entretenu envoie un bug par semaine (deux fois moins avec les tests), et le premier arrive entre 30 et 100 s après la livraison. Chaque bug est rattaché au site d'un client nommé.

**Sortie** : « Embaucher quelqu'un pour corriger les bugs » se propose dès que **12 bugs** sont arrivés sur les 7 derniers jours, ou que 12 bugs attendent dans la file. Le seuil est absolu : il ne dépend ni de la vitesse de clic ni des lundis, et il est testé en continu. Les appels de Maman n'y comptent pas, puisqu'ils ne font arriver aucun bug.

Mesures de la simulation v2 :

| Partie | Fin | Plus grand écart | Compromis |
|---|---|---|---|
| 2 clics/s | 18:07 | 3:14 | 14:52 |
| 4 clics/s | 14:02 | 2:00 | 9:31 |
| 6 clics/s | 10:44 | 1:11 | 9:18 |
| arrête de cliquer après le générateur | 17:30 | 2:18 | 9:31 |
| refuse le compromis | 14:01 | 2:00 | refusé |

Au départ, à 4 clics/s, une vitrine de 600 € prend environ une minute : on gagne environ 600 € par minute, au-dessus des 432 € du plongeur. La première simulation avait le sens des bugs inversé : les tests doublaient les bugs, et ses mesures sont caduques.

**À reprendre au TDD, dans le vrai moteur :**
- La simulation ne modélise ni l'énergie ni la vie.
- À 2 clics/s, le compromis arrive après 10 min et le plus grand écart dépasse 3 min de 14 s.
- Refuser le compromis ne rallonge presque rien (14:01 contre 14:02) : la sortie dépend des bugs reçus, et le compromis ne touche que la vitesse de livraison. Son gain doit se voir ailleurs, par exemple en argent par minute, ou en reliant la sortie à la demande tenue.

### Le compromis
- Une fois les tests installés, une livraison sur trois bute sur un test rouge. **Sans compromis, il y a une issue** : le test rouge est un bug de 10 clics, en tête du carnet, qu'on corrige avant de livrer. Rien ne bloque.
- Au premier test rouge paraît « Désactiver le test qui échoue ». C'est gratuit, et irréversible une fois accepté. Le gain est permanent : plus aucun test rouge, et les livraisons vont 20 % plus vite (sous le plafond de +30 % de R3).
- **Le coût tombe sur les clients, jamais sur toi.** Ils ne t'envoient pas un bug de plus. Leurs propres clients tombent parfois sur une page blanche, et tu l'apprends par la ligne du client, sans effet sur ton argent : « Mme Duval a perdu deux commandes de gâteaux ce week-end. Elle ne sait pas pourquoi. » Il rejoue « Ne plus relaver les assiettes grasses ».

### Les collisions
- « Répondre aux clients le soir » fait aussi arriver des bugs le vendredi soir. Si tu vas dîner, ils restent ouverts jusqu'à samedi, et un bug encore ouvert le lundi fait un impayé. Le coût se lit dans un système qui existe déjà.
- Maman, le dimanche, produit le même effet : un bug laissé ouvert pendant l'appel peut coûter un lundi. Ces impayés ne comptent jamais dans la sortie.
- Le dîner occupe les mains jusqu'au samedi matin, comme Maman jusqu'à lundi. La règle R2 (« 20 s ») est remplacée par cette durée en jours, déjà adoptée pour Maman au plongeur.

### L'énergie
- Écrire du code fatigue : chaque clic coûte un peu d'énergie. Quand la jauge est basse, le bouton écrit moins de lignes (« Écrire du code : 2 lignes », avec la fatigue écrite à côté), mais **il ne se grise jamais**.
- La fatigue touche aussi les bugs : fatigué, un clic ne compte que pour moitié sur un bug. Sinon, l'énergie ne pèserait plus rien au moment précis où les bugs prennent le carnet.
- Le générateur ne se fatigue pas : c'est une machine (règle de CLAUDE.md).

### La vie
- **Au clic, ce qui recharge :**
  - « Se faire à manger », comme au plongeur ;
  - de temps en temps, « Aller au cinéma » ou « Aller au restaurant » : rare, occupe les mains un moment, recharge beaucoup, laisse un souvenir ;
  - **Maman, toujours le dimanche** : décrocher bloque tout jusqu'à lundi, sauf le générateur, et remplit l'énergie ;
  - **« Dîner avec des amis, vendredi soir »** : y aller occupe les mains jusqu'à samedi. Après « Répondre aux clients le soir », il tombe pendant les commandes du soir. La collision vient de ta propre proposition, comme le dimanche du plongeur.
- **L'automatisation de la vie arrive doucement.** Le joueur finit par se lasser de cliquer pour recharger. « Se faire livrer les repas du midi » donne alors de l'énergie qui remonte seule, et « Ta vie » affiche en tête « Ton repos : +N énergie / min », miroir exact de « Le lave-vaisselle te rapporte ». On commence à suivre sa vie comme un revenu. Le jeu ne le commente jamais : c'est le début de la pente.
- **Garde-fous de la thèse.** Au chapitre 2, on n'automatise que des corvées (les repas) : souvenir neutre, le Sens ne se creuse pas. Les liens (Maman, les amis) ne s'automatisent que plus tard, et c'est là que le Sens se creuse. L'appel de Maman confié à une IA reste au chapitre 5.
- **Retirés** : « Dormir » et « Aller courir » (une information à la fois), « Se faire livrer ses courses » (remplacé par les repas du midi).

### L'interface
La même page que le plongeur : les colonnes « Travail » et « Ta vie », une information à la fois, les nouveautés en file avec au moins 35 s d'écart. On ajoute seulement un léger habillage (la première couleur, récompense de la fin de l'Acte I). L'ancien tableau de bord (`App.svelte`, `missions.ts`, « Résoudre un bug » dans `career.ts`) n'est plus atteint depuis le plongeur.

### Pour démarrer en TDD
- **Tarif** : il se calcule sur la taille nominale de la commande. « Réutiliser le code » réduit le travail, pas le prix : c'est ce qui le rend rentable.
- **Refus** : une proposition refusée reste proposée (R3) et ne bloque pas les suivantes. Sans « Répondre aux clients le soir », la sortie reste atteignable par les autres commandes (à verrouiller par un test R7).
- **Garde-fous R7 à tester** : la sortie est atteignable à 2, 4 et 6 clics/s, en arrêtant de cliquer après le générateur, en refusant le compromis et en refusant chaque proposition une à une. Le test rouge ne bloque jamais le carnet. L'énergie ne grise jamais le bouton.
- **Sauvegarde** : le passage du plongeur au freelance migre l'argent et le livret A ; les champs du plongeur restent en lecture pour le bilan final.

### Restent à trancher
- Les chiffres de l'énergie (coût du clic, seuil de fatigue, recharges, repas livrés, prix des repas) et le calendrier des sorties, à simuler avec la vie.
- Le texte de la sortie (qui est la première personne embauchée, et sous quel prénom).
- Le vrai gain du compromis (voir « À reprendre au TDD »).

### v2 après la maquette de fin (2026-09-29, 3 challenges)
Retours d'Alexandre sur la maquette de l'écran de fin : « le générateur de code, ça n'existait pas avant l'IA » ; les amis doivent devenir pénibles puis cesser d'inviter ; Maman répondue par une IA en fin de chapitre ; la maison doit évoluer par des loyers ; plus de stats de vie et de banque. Ce qui suit remplace les sections ci-dessus quand elles se contredisent. La séquence et ses mesures sont à resimuler avec ces changements.

**Les outils, dans l'ordre réel.** Avant l'IA, rien n'écrit du code sans toi : la seule chose qui travaille seule au chapitre 2 est une IA. Elle écrit ici des pages neuves ; au chapitre 5, elle remplacera les gens.

| Bouton | Sous-titre | Prix | Axe |
|---|---|---|---|
| « Acheter un deuxième écran » | Par clic : 5 → 8 lignes | 150 € | lignes par clic (demande un bureau : pas sur le canapé de Sam) |
| « Acheter la licence d'un vrai éditeur de code » | Par clic : 8 → 12 lignes | 400 € | lignes par clic |
| « Activer l'autocomplétion par IA » | Par clic : 12 → 20 lignes | 600 € | lignes par clic (elle complète la ligne, elle ne trouve pas les bugs) |
| « Laisser une IA écrire les pages neuves » | 20 lignes / s, même sans toi. Les bugs restent à toi. | 1 200 € | lignes par seconde sans toi |
| « Acheter un thème pro pour tous tes clients » | Sites vitrines et boutiques : 30 % de lignes en moins, même prix | 2 000 € | lignes par commande |
| « Suivre une formation aux tests automatiques » | Bugs : deux fois moins par site et par semaine | 3 000 € | bugs |
| « Prendre l'abonnement pro de l'IA » | L'IA : 20 → 60 lignes / s | 6 000 € | lignes par seconde sans toi |
| « Brancher une IA sur ta boîte mail » | Elle répond aux clients le soir : environ +4 000 € par semaine | 4 800 € | demande |

- Le « générateur de pages » disparaît partout, y compris la règle « il écrit pendant que tu corriges » : c'est désormais l'IA qui écrit pendant que tu corriges.
- Libellés revus : « Ajouter les boutiques en ligne à ton profil », « Reprendre les clients d'un freelance qui arrête ». La sortie a un prénom : « Embaucher Nora pour corriger les bugs » (prénom à confirmer), et elle est **gratuite** (elle reste possible en négatif).

**Le logement : des loyers, jamais un achat en une fois.**
- Un logement se propose dans la file des nouveautés quand la moyenne de tes deux dernières semaines atteint au moins 8 fois son loyer (il pèse ~10 % du revenu). Refusé, il reste proposé ; accepté, on ne redescend jamais.
- **Le loyer est prélevé chaque lundi**, après l'entretien. Si l'argent manque, le compte passe en négatif (« Argent : -85 € », signe moins U+2212 ou trait d'union, sans rouge ni message). Il ne touche jamais au livret (un retrait forcé coûterait ses intérêts en silence). En négatif, les achats et le dépôt sur le livret sont impossibles ; les propositions gratuites, le compromis, les rendez-vous, Maman, « Tout reprendre », les clics et la sortie restent possibles. Les livraisons paient toujours : aucun blocage.
- **Pourquoi déménager** : un bénéfice réel pour le travail, par la vie (R2). Le logement monte l'**énergie maximale** (la barre grandit en largeur) ; la chambre donne un bureau, donc le deuxième écran ; le T1 donne une vraie cuisine (les repas rechargent plus). Jamais une obligation : la satire est la ligne « Loyer » qui grossit sur le graphique, sans commentaire.

| Vers | Logement | Loyer | Énergie max | Ce que ça change |
|---|---|---|---|---|
| départ | « Logement : canapé convertible chez Sam » (texte seul) | 0 € | 100 | tu dors mal, pas de bureau |
| ~2:20 | « Louer une chambre en colocation » | 110 € chaque lundi | 120 | un bureau (le deuxième écran paraît ensuite) |
| ~4:55 | « Louer un T1 de 25 m² » | 190 € chaque lundi | 140 | une vraie cuisine : un repas recharge plus |
| ~12:40 | « Louer un deux-pièces avec un bureau » | 380 € chaque lundi | 170 | plus d'autonomie avant la fatigue |

- À l'emménagement, l'énergie gagne l'écart, comme une nuit reposée ; Maman remplit jusqu'au nouveau maximum ; le seuil de fatigue reste à 25.
- « Studio » est réservé au chapitre 3 (ton entreprise) : le logement s'appelle « T1 ».
- **Sam** : quitter son canapé pose « Sam t'a aidé à porter tes cartons. » (souvenir neutre). Tant que tu vis chez lui, le dîner du vendredi a lieu « dans le salon de Sam » ; ensuite « chez Sam », il faut y aller.
- **L'image** : le canapé et la chambre sont une ligne de texte ; le T1 devient une petite vignette dessinée ; le deux-pièces une illustration en couleur en tête du tableau de bord. La maison d'architecte (référence d'Alexandre, photo nocturne pleine largeur) est l'apogée du chapitre 5. Un palier égale un seul changement visuel.
- Chapitres suivants : un loft (3), une maison avec jardin (4), la maison d'architecte (5), une résidence gardée et froide (Acte III). `homes.ts` est à réécrire en loyers.
- **Les véhicules commencent au chapitre 3** : scooter puis voiture d'occasion (tu rentres plus vite du dîner : les mains sont libres dès vendredi minuit), berline (4), « Prendre un chauffeur » (5, corvée déléguée), le jet (6).

**L'ordre du lundi** : l'entretien est encaissé, puis le loyer prélevé, puis le livret verse ses intérêts. Une seule ligne récapitule : « Lundi : 4 080 € d'entretien, 380 € de loyer, +40 € de livret ».

**La banque au chapitre 2** : le compte courant et le livret A seulement. Pas d'assurance vie (redondante avec le livret). Un **compte-titres** ouvre au chapitre 3 : « Ouvrir un compte-titres », « Acheter des actions », « Tout vendre », « Plus que le livret, mais ça peut baisser ». Sans hasard, c'est une courbe fixe, datée, identique à chaque partie : +8, +6, -4, +9, +7, -25, +10, +9 % par semaine (+15 % sur 8 semaines contre +8,3 % pour le livret ; acheter juste avant la chute coûte 25 %).

**Les amis (Sam, Inès, Léo).**
- Le dîner du vendredi est un choix explicite : « Y aller » ou « Travailler ce soir-là » (qui vaut « laisser passer la carte »).
- **Pénible** : « Y aller » affiche son vrai coût, qui grandit avec tes clients du soir (« Les bugs du vendredi attendront : -890 € lundi »).
- **Inutile** : une fois les repas livrés, le sous-titre dit « Énergie déjà pleine ». Il ne reste que le souvenir.
- **La fin** : après **3 dîners manqués d'affilée** (un dîner honoré remet le compteur à zéro), la ligne « Sam, Inès et Léo ne t'invitent plus le vendredi. » paraît. La carte du vendredi, leurs visages et leur ligne de stat disparaissent pour toujours. Le Sens perd 7, une fois. Nouveau cas R1 : le **lien perdu par négligence**. Le jeu ne dit jamais que ce sont les repas livrés qui ont ôté la raison d'y aller.

**Maman, l'arc sur tout le jeu.**
- Chapitre 2 (fin) : après l'IA de la boîte mail, un dimanche où au moins 5 bugs sont ouverts, paraît « Laisser l'IA répondre aux messages de Maman » (gratuit, irréversible). Tes dimanches redeviennent travaillés : plus rien ne s'arrête jusqu'à lundi. Sur la frise, « Maman » devient « Répondeur IA » : « Dimanche : le Répondeur IA a répondu à Maman. Elle demande si tu manges bien. » Le Sens perd 7.
- Plus tard : l'IA appelle Maman elle-même, avec ta voix, pour garder le lien (faux) ; puis tout est automatisé, et il n'y a même plus rien à suivre. À l'épilogue, on constate qu'on n'a plus de lien avec personne. Aux chapitres 3 et 4, Maman ne crée plus de collision : Camille porte la vie.
- Les exemples de R1 (« Maman » devient « VoixIA ») et du chapitre 5 sont à mettre à jour dans ce sens.

**Les chiffres de ta vie** : des compteurs et des ratios, affichés comme une donnée, jamais comme un commentaire : « Ton repos : +58 énergie / min », « Appels de Maman décrochés : 7 sur 9 », « Dîners avec tes amis : 2 sur 6 ». Ils ne comptent qu'à partir de leur révélation (jamais « 0 sur 3 » d'emblée). Le Sens reste interne.

**Les repas livrés** sont payés à la commande, pas en abonnement (un abonnement creuserait le négatif en silence). Leur prix est réaliste (~75 € par semaine).

**L'interface** : le chapitre part de la page du plongeur, avec des sections arrondies et une couleur légère (maquette « L'arrivée », validée), et finit en tableau de bord complet en verre dépoli (maquette de fin, validée dans son style). On construit l'écran de fin d'abord, puis le chemin inverse : on retire rubrique par rubrique, de la plus tardive à la plus précoce, jusqu'à l'arrivée. Chaque rubrique paraît quand elle sert, une à la fois.

**Tests R7 à ajouter** :
- partir à -2 000 € : la sortie reste atteignable à 2 et 4 clics/s ;
- une livraison en négatif est créditée ;
- propositions et compromis restent possibles en négatif ;
- le loyer ne touche jamais le livret ;
- l'ordre du lundi (entretien de 50 €, loyer de 110 € : 0 € devient -60 €) ;
- l'énergie ne dépasse jamais l'énergie maximale du logement ;
- la sortie reste atteignable en refusant chaque logement.

### v3 : charges, navigation, sortie payante (2026-09-29, 4e challenge et audit de la maquette)
Retours d'Alexandre : « Banque » devient « Finances » avec les charges, pour voir ce qu'on gagne vraiment par semaine ; embaucher coûte un salaire chaque semaine ; charges pro et perso séparées ; la sortie en tête et côté pro ; un menu Pro, Perso, Finances et un tableau de bord. Ce qui suit remplace v2 quand elles se contredisent.

**Un seul compte courant, deux catégories de charges** (R5 : un porte-monnaie unique au chapitre 2 ; la séparation éventuelle se tranche au chapitre 3). Tout se paie depuis le même compte ; pro et perso ne se séparent qu'à l'affichage.
- **Entrées** : les livraisons (au fil de l'eau), l'entretien et les intérêts du livret (le lundi).
- **Charges pro, le lundi** : les abonnements IA, puis le salaire de Nora au chapitre 3. Les outils suivent leur forme réelle :
  - achats uniques : le deuxième écran (150 €), la licence d'éditeur (400 €), le thème pro (2 000 €), la formation aux tests (3 000 €) ;
  - **abonnements, prélevés chaque lundi** : l'autocomplétion par IA (5 €), l'IA qui écrit les pages neuves (25 €, puis l'abonnement pro à 50 € qui la remplace), l'IA de la boîte mail (10 €). Leurs gros prix uniques (600, 1 200, 6 000, 4 800 €) disparaissent : **la cadence est à resimuler**.
  - Chaque sous-titre met le gain face au prix : « L'IA : 20 → 60 lignes / s, 50 € chaque lundi ».
- **Charges perso** : le loyer (le lundi) et les repas livrés (11 € débités à chaque repas).
- **Aucune charge n'est suspendue en négatif** (couper l'IA ou le repos creuserait la spirale).
- **L'ordre du lundi** : l'entretien, puis les charges pro, puis le loyer, puis le livret. Une seule ligne le dit ; le détail est dans Finances.
- **Le net de la semaine** = livraisons + entretien + intérêts − charges pro − charges perso, du lundi au dimanche. C'est le grand chiffre de « Ce que tu gagnes », et le graphique montre les charges en barres sous zéro.
- La ligne « Abonnements IA : 65 € » à côté de « Nora : 600 € » prépare le chapitre 5 sans un mot.

**La sortie devient payante.**
- « Embaucher Nora pour corriger les bugs » : **600 € chaque lundi**, en charges pro, dès le lundi qui suit. Sous-titre : « 600 € chaque lundi, en charges pro. Elle corrige jusqu'à 15 bugs par semaine, du lundi au vendredi. » Ligne de contexte : « Ces 7 derniers jours : 12 bugs arrivés. » et l'entretien en jeu lundi.
- Nora corrige 3 bugs par jour ouvré, jamais le week-end : les bugs du vendredi soir restent les tiens (elle ne travaille pas le week-end, toi si). Son gain minimal (~600 € d'impayés évités et ~120 clics libérés) dépasse son salaire.
- Elle paraît en tête du tableau de bord, en bande pleine largeur côté pro, et reste affichée. Elle reste possible en négatif ; Nora ne part jamais, même impayée.
- Tests R7 : le net de la semaine qui suit l'embauche est au moins celui d'avant, à 2, 4 et 6 clics/s, en arrêtant de cliquer après l'IA et en partant de −2 000 € ; si ce test échoue, on baisse le salaire, pas sa capacité.

**La navigation : Tableau de bord, Pro, Perso, Finances.**
- Trois conditions : une barre de travail fixe sur chaque onglet (la tâche en cours, le bouton, l'argent, l'énergie, la nouveauté en attente) ; aucune action urgente n'existe seulement dans un onglet (seuls le livret et « Tout reprendre » vivent dans Finances) ; le menu arrive tard (jusqu'à ~10 min, la page reste en deux colonnes Travail et Ta vie).
- Un onglet paraît quand il sert : **Finances** d'abord (il crée le menu, avec le Tableau de bord), quand il y a au moins 3 lignes de charges ; **Perso** ensuite, avec les ratios ; **Pro** en dernier, quand la liste des clients déborde (vers l'IA de la boîte mail).
- Contenu à la fin : le **Tableau de bord** réunit la sortie, le carnet, le net de la semaine et ses clients, ce qui travaille sans toi, « D'ici lundi », le logement, ta vie et tes finances ; **Pro** : le carnet complet, les clients, les outils, le compromis ; **Perso** : ta vie et ses ratios, les repas, le logement, les souvenirs ; **Finances** : les comptes, le livret, le détail de la semaine, le graphique.

**Détails corrigés par l'audit** (maquette de fin, état figé au dimanche de la semaine 8) :
- la carte sombre s'appelle « D'ici lundi » (elle ne couvre que les jours à venir) ; « Laisser l'IA répondre aux messages de Maman » se propose le dimanche, à côté de « Décrocher » ;
- le test rouge survient à la livraison (« Sa boutique est prête, un test échoue : 1 900 € bloqués ») ; il passe juste après la tâche en cours, avant les autres bugs ;
- la ligne « Dîners avec tes amis » disparaît avec eux ; « Sorties » devient « Cinéma et restaurant » ;
- les ratios ne comptent que les dimanches passés (« Appels de Maman décrochés : 6 sur 7 » à la semaine 8) ;
- « Tes clients qui paient le plus », triés ; plus de compteur « Clients » (une règle de recommandation n'existe pas) ;
- les montants sont en euros entiers (« 10 000 € », jamais « 10 k€ ») et chaque bouton de Finances a son sous-titre (« +1 % chaque lundi »).

### v4 : prix et cadence vérifiés (2026-09-29, simulation jetable v3)
Simulation de toutes les règles v3 à 2, 4 et 6 clics/s, en arrêtant de cliquer, et en refusant tout. Déjà corrigé dans la simulation : 7 propositions au lieu de 9, la licence d'éditeur avant l'écran, le logement proposé à 5 fois son loyer, les repas livrés après 30 repas faits à la main, la sortie qui attend l'IA de la boîte mail.

**Décision d'Alexandre : des prix réalistes et peu chers.** À 4 clics/s, chaque outil est payable dès qu'il paraît, avec 5 à 30 fois son prix en poche (1 190 € quand paraît la licence à 250 €, 12 377 € à l'IA de la boîte mail). C'est voulu : au chapitre 2, la contrainte est ton temps et tes bugs, pas l'argent. L'argent qui dort prépare le compte-titres du chapitre 3.

**À corriger en implémentation** (à revérifier par la sonde de rythme) :
- **Le joueur rapide finit plus tard** (18:17 à 6 clics/s, 14:26 à 4). Un outil ne se propose que quand tu ne suis plus, avec un repli à 120 s ; le joueur rapide suit toujours, donc il attend 120 s à chaque outil. Correction : un outil se propose aussi 60 s après le précédent, même quand tu suis.
- **La fatigue ne mord qu'au-delà de 4 clics/s** (au plus bas 24 d'énergie à 4 clics/s, sous le seuil de 25). Le seuil de fatigue passe à 40 pour que les repas et le logement servent à tout le monde.
- **Le début est creux** : les trois premières semaines rapportent 268 à 650 € de net, moins que les 432 € par minute du plongeur. Il faut plus de demande tôt, ou une vitrine mieux payée.
- **Le compromis et l'IA de Maman** n'apparaissent souvent pas avant Nora à 4 clics/s : la sortie doit les attendre, ou ils doivent arriver plus tôt.
- **Le salaire de Nora n'est pas encore simulé** : le test R7 de la v3 reste à passer.

**Ce qui tient** : toutes les nouveautés passent, au plus 2:14 d'écart entre deux ; le compte ne passe jamais en négatif ; la part des bugs monte de 3 % à 70 % des clics ; les amis partent chez le joueur lent et chez celui qui arrête de cliquer.

### v5 : les paliers d'interface (2026-09-29, challengé, maquettes des écrans intermédiaires)
Retours d'Alexandre : valider le chapitre 2 en entier avant le 3 ; au début pas de menu, le logement en texte, peu d'informations d'argent ; des sections sans couleur ni ombre ; la couleur et l'ombre arrivent avec des améliorations.

**Qui apporte quoi (décision d'Alexandre : l'hybride).** Chaque moitié de l'écran suit son pendant réel.
- Ta vie et l'ambiance suivent le logement : la chambre apporte la couleur, le T1 l'ombre portée (et la typographie définitive), le deux-pièces le verre dépoli et l'image du logement.
- Le travail suit les outils : la licence d'éditeur colore les étiquettes du carnet (Bug, Commande, Test rouge), comme un éditeur colore le code. Le thème pro sert aux sites des clients, il ne touche pas ton écran.
- Les sous-titres restent sur la statistique qui change (loyer, énergie maximale, lignes par clic). Le changement visuel est un effet de bord muet, célébré par une animation, jamais écrit.
- Le code actuel allume la couleur à l'annonce (`answerAnnonce`, `flags.firstColor`) : c'est désormais la chambre.

**Chaque palier est un événement dans la file des nouveautés**, soumis aux 35 s d'écart comme les autres ; jamais un temps fixe. Le menu arrive une seule fois, avec ses quatre entrées, quand la page dépasse la hauteur d'un écran.

| Déclencheur (4 clics / s) | Ce qui paraît |
|---|---|
| Début | Argent, carnet, Ta vie (âge, jour, énergie), « Logement : le canapé convertible de Sam. », souvenirs. Filets, pas de couleur ni d'ombre, pas de menu. |
| Entretien Duval (1:05) | La ligne du lundi ; le jour affiche la semaine (« Vendredi, semaine 1 »). |
| Carnet à 2 éléments (~1:45) | « Ensuite », et l'argent en jeu d'un bug (« −50 € lundi »). |
| Chambre (2:15) | La couleur de Ta vie et du fond ; le loyer dans la ligne du lundi. |
| Premier outil (3:43) | « Améliorations » ; l'éditeur colore les étiquettes. |
| Repas livrés (4:53) | « Ton repos : +N énergie / min ». |
| Premier abonnement (6:03) | « Cette semaine » : net, entrées, charges, achats à part. |
| T1 (7:00) | L'ombre portée, la typographie définitive. |
| Entretien à chaque livraison (8:04) | « Tes clients ». |
| Premier dîner manqué | Les ratios de vie. |
| Deux-pièces (9:14) | Le verre et l'image du logement. |
| Première IA qui travaille seule (9:49) | « Ce qui travaille sans toi ». |
| La page dépasse un écran (~10:25) | Le menu : Tableau de bord, Pro, Perso, Finances. |
| Répondre le soir (11:28) | La carte sombre « D'ici lundi ». |
| Recommander (12:03) | « Tes clients qui paient le plus ». |
| Compromis (13:13) | Le test rouge et « Désactiver le test qui échoue ». |
| Sortie (14:26) | La bande « Embaucher Nora en alternance » ; l'IA de la boîte mail passe au moins 35 s avant. |

**Chiffres corrigés, pris dans la simulation** (la maquette de fin avait pris l'argent en poche pour un net de semaine) :
- **La semaine s'ouvre le lundi** : les paiements du lundi comptent dans la semaine qui commence.
- **Les achats uniques sont hors du net** : une ligne « Achats » à part ; le graphique montre le net hors achats. Sinon le net plonge juste avant la sortie (thème et formation) et Nora paraît hors de prix.
- Nets S1 à S8 : 650, 540, 518, 2 253, 2 178, 3 398, 2 223, 3 623 €. À la sortie (mardi de la semaine 9) : 12 367 € en compte, 13 sites entretenus (950 € possibles le lundi), aucun bug ouvert, 7 commandes en attente (9 900 €), 65 € d'abonnements, énergie 133 / 170, repos 78 / min (un repas vaut 15 dès le T1).
- **La bande de Nora dit la vraie pression** : « Ces 7 derniers jours : 12 bugs arrivés. Pendant que tu les corriges, 7 commandes attendent (9 900 €). » (décision d'Alexandre ; le déclencheur ne change pas).
- **Conséquence au chapitre 3** : on en sort avec ~3 600 € net par semaine, pas ~10 000 €. Un junior à 950 € pèse vraiment ; « l'argent ne contraint plus » est à resimuler.

**À régler en implémentation** : l'argent du plongeur est conservé à l'annonce, alors que la simulation démarre à 0 € ; à 2 clics / s la chambre n'arrive qu'à 7:00 (la couleur du travail arrive quand même vers 4:00 avec l'éditeur) ; à 6 clics / s la partie finit plus tard qu'à 4 (déjà noté en v4).

Maquettes (hors dépôt) : `maquette-freelance-paliers.html` (écrans 1 à 4 : 0:30, 4:00, 7:30, 10:10) et `maquette-freelance-fin.html` (la fin, chiffres alignés).

**Rythme mesuré** (2026-09-29, sonde `tests/rythme/freelance.ts` : un joueur qui prend tout, décroche, va aux dîners ; temps de calendrier). L'entretien de chaque site et les outils sont des actions requises : toujours proposés, jamais perdus. Refuser un logement, laisser une proposition de côté un moment ou refuser le compromis ne bloque pas la sortie (la sonde le vérifie, sortie en moins de 40 min dans chaque cas) :

| Clics / s | Sortie (Nora proposée) | Silence le plus long | Net de la dernière semaine close |
|---|---|---|---|
| 2 | 19:10 (1 150 s) | 105 s | 5 778 € |
| 4 | 17:16 (1 036 s) | 105 s | 12 418 € |
| 6 | 16:05 (965 s) | 63 s | 8 668 € |

Test R7 de la spec (le joueur arrête de cliquer dès l'IA qui écrit les pages neuves, joue la sortie, embauche Nora, puis une semaine entière avec elle, toujours sans cliquer) :

| Clics / s | Départ | Sortie | Net avant l'embauche | Net de la semaine avec Nora |
|---|---|---|---|---|
| 2 | 0 € | 19:35 | 2 918 € | 3 998 € |
| 2 | −2 000 € | 28:20 | 2 268 € | 2 668 € |
| 4 | 0 € | 17:50 | 5 418 € | 5 988 € |
| 4 | −2 000 € | 19:35 | 4 578 € | 5 298 € |
| 6 | 0 € | 16:05 | 3 728 € | 5 768 € |
| 6 | −2 000 € | 17:50 | 7 078 € | 7 178 € |

Avant réglage : sorties à 17:51, 16:17 et 16:05 ; silences de 135, 114 et 101 s ; nets de 4 360, 8 268 et 8 588 €. « Recommander » ne paraissait jamais avant la sortie (ni « Répondre le soir » à 2 clics / s) : avec une nouveauté toutes les 35 à 60 s, la place ne restait jamais libre 120 s.

Constante réglée :
- `PROPOSAL_LATE` : 120 → 60 s. Toutes les propositions paraissent avant la sortie, à chaque cadence. À 50 s, le test R7 tombait à 6 clics / s depuis −2 000 € (7 078 € avant, 5 408 € avec Nora), et même un salaire de Nora à 0 € ne suffisait pas (6 008 €) : la semaine d'avant avait livré un gros arriéré d'un coup. L'écart vient de la semaine où tombe la sortie, pas de Nora.
- `NORA_SALARY` reste à 600 €, l'IA pro à 60 lignes / s.

Fragile : à 6 clics / s depuis −2 000 €, la marge n'est que de 100 € ; une sortie décalée d'une semaine la fait varier de ±2 000 €.

Le répondeur IA de Maman glisse à 2 clics / s : l'IA de la boîte mail arrive à 935 s, pendant l'appel du dimanche (930 à 945 s), la place n'est libre qu'à 970 s ; le dimanche suivant, le joueur décroche dès la sonnerie et l'offre n'a pas le temps de paraître ; elle paraît deux dimanches plus tard (1 140 s).

À revoir au chapitre 3 : le joueur qui clique sort avec 6 500 à 12 400 € net par semaine, loin des ~3 600 € de la simulation ; celui qui arrête de cliquer après l'IA, avec 2 900 à 7 100 €.


## Chapitre 3 : Ton studio (v2, 2026-09-29, challengé deux fois, à simuler)
Retours d'Alexandre sur l'esquisse : « Donner ton clavier » ne marche pas (tout le monde a un clavier) ; à la place, se consacrer à la vente, puis recruter des commerciaux, puis automatiser la prospection ; des prix cohérents mais incrémentaux (postes, puis bureaux qui s'embellissent comme l'appartement) ; choisir ses recrues selon leurs caractéristiques ; une appli de rencontre, puis des statistiques sur le couple qui donnent envie d'optimiser. Ce qui suit remplace l'esquisse. Tous les nombres sont supposés, à simuler.

**L'argent ne contraint plus rien** (~10 000 € net par semaine en fin de ch2, soit ~95 € par seconde). Ce qui limite, ce sont les places au bureau, le calendrier et les compétences. Les prix restent réalistes et l'incrémental vient de la nature des achats (fil 2).

### Recruter en choisissant
- « Ouvrir un poste de développeur junior » (puis senior, puis commercial) fait arriver 3 candidats, un par jour ouvré.
- **Un humain vaut par ce que l'IA ne fait pas.** L'IA du ch2 n'écrit que les pages neuves ; une recrue corrige des bugs, fait les applis et les boutiques, et le senior ouvre les gros projets. Sinon l'IA à 50 € écrase le junior à 950 € et le ch5 perd son effet. Cible : un junior rapporte ~1,8 fois son salaire la semaine qui suit.
- **Aucune carte ne domine, et les écarts portent sur des mécaniques, pas sur le salaire** (l'argent ne pèse rien) :
  - le rapide : « Applis : +25 lignes / s. Ne travaille pas le week-end. » ;
  - le rigoureux : « Corrige 4 bugs par jour. Accepte l'astreinte. » ;
  - le discret : plus lent, « Reste tard sans rien dire. » Il ne part pas avec le compromis de 22 h (graine de la pente).
- Chaque carte : un prénom, une ligne de vie (« Hugo apporte des chouquettes le lundi. »), deux lignes chiffrées, le salaire en dernier.
- Salaires chargés par semaine : junior ~950 €, senior ~1 500 €, commercial 700 € plus 8 % des contrats qu'il signe. **Nora est en alternance** (décision d'Alexandre) : « Embaucher Nora en alternance » au ch2, 600 € chaque lundi reste plausible.
- **Vivier sans soft-lock** : les candidats non choisis restent et reviennent (« Hugo cherche toujours. »). 5 juniors, 4 seniors, 3 commerciaux. Test R7 : réembaucher reste possible après avoir refusé chaque carte une fois, et après une démission.
- Le senior ouvre « Proposer à Kévin de refaire toute sa plateforme de livraison » (30 000 lignes, 18 000 €, 900 € d'entretien ; « Il faut quelqu'un qui a déjà monté un serveur. »).
- L'astreinte du week-end (+50 % du salaire, chaque lundi) se propose à qui l'accepte sur sa carte.
- « Augmenter tes tarifs » (proposition gratuite) : les nouveaux clients paient 50 % de plus. C'est ce qui explique que les contrats grossissent.

### Les bureaux (ils limitent les places)
- Ton salon : toi et Nora à distance.
- « Louer 3 places dans un coworking » : 200 € chaque lundi.
- « Louer un local rue des Tanneurs, 6 places » : 600 € chaque lundi, dépôt de garantie de 2 mois (~5 200 €) à l'entrée, et « Équiper le local : 6 postes » (9 000 €, achat unique).
- Chaque bureau a son illustration sur le tableau de bord, de plus en plus belle, comme le logement. Le plateau de 12 places passe au ch4 (l'agence, ce sont des étages).

### Ta main passe du code à la vente
- **Déclencheur** : la première fois que le carnet reste vide 6 s (l'équipe a tout livré), se propose « Arrêter de coder pour chercher des clients ». Le bouton « Écrire du code » disparaît ; « Appeler la pharmacie Martin » prend sa place.
- Un fichier nommé d'entreprises du quartier, déterministe : un appel sur 8 décroche un rendez-vous, toujours le 8e (pas de hasard).
- **Le rendez-vous est daté** : au plus 2 déjeuners par semaine, mardi et jeudi à 12 h (« Déjeuner avec la pharmacie Martin, jeudi 12 h »). Y aller occupe les mains 20 s (R2) et signe le contrat. Le calendrier limite la vente, pas la vitesse de clic.
- « Ouvrir un poste de commercial » : il passe les appels à ta place et décroche les rendez-vous. **Toi, tu vas encore aux déjeuners** : ce sont eux qui entrent en collision avec tes soirées. Au ch4, un directeur commercial prend les déjeuners et la prospection s'automatise (fichier acheté, mails envoyés seuls).

### La vie : l'appli, puis le tableur
- Depuis le ch2, les amis ne t'invitent plus : le vendredi soir est vide. Se propose « Télécharger une appli de rencontre ».
- 3 profils : un prénom et une ligne, **aucun chiffre** (R1 : la vie garde ses prénoms). « Proposer un verre à Camille » est un rendez-vous daté (vendredi 20 h). Après : « Revoir Camille » ou « Ne pas donner suite ». Au 3e verre avec la même personne, vous êtes ensemble. Le prénom choisi est une variable du moteur, utilisée jusqu'à l'épilogue.
- Les soirées rechargent l'énergie, qui sert encore aux appels.
- **Règle connue, jamais cachée** : 3 soirées manquées d'affilée et elle part (comme les amis). **Un seul départ possible, avant l'emménagement** (décision d'Alexandre) : l'appli revient alors avec 3 profils ; après l'emménagement (ch4), plus de départ.
- **La mesure révèle la règle** (comme la montre au ch1) : « Suivre vos soirées dans un tableur ». Sous-titre : « Soirées manquées d'affilée : 1 sur 3 avant qu'elle parte. » Le gain est réel : tu sais combien de soirées tu peux sacrifier pour un déjeuner (environ un déjeuner de plus toutes les 2 semaines, ~+4 000 € par semaine). Drôle, rentable, jamais commenté.
- **Délégation du lien** : « Faire livrer des fleurs à Camille chaque vendredi » (40 € chaque lundi, en charges perso). Une soirée manquée ne compte plus dans les 3 : la collision disparaît (R2), le Sens perd 7. Frise : « Vendredi : fleurs livrées à Camille ». Réserver un restaurant serait une corvée (R1), donc neutre.

### Le compromis et la sortie
- « Garder l'équipe jusqu'à 22 h » : son gain sert la sortie (la plateforme de Kévin livrée plus tôt, ~+10 % de durée pour qui refuse). Le coût tombe sur eux : « Yasmine a raté le spectacle de son fils. » Une seule démission possible, non punitive, et le vivier la remplace. Reclassé en A (voir le motif B ci-dessous).
- **Sortie** : le local est plein et ton commercial signe plus de contrats que l'équipe ne peut en livrer. « Ouvrir une deuxième équipe » (ton senior en devient le chef). C'est l'entrée au ch4.

### Reporté au ch4
Le compte-titres (avec l'immobilier et le robot-conseiller : un bloc patrimoine), le plateau de 12 places, la montre connectée, la voiture. Le livret reste plafonné à 22 950 € dès le ch3 : l'argent qui dépasse dort, visible, et appelle le ch4.

### Le motif B (décision d'Alexandre : 1re occurrence)
La carte partagée devient la 1re occurrence du motif B. Candidats et profils utilisent le même composant, et « Ne pas donner suite » a le même bouton et le même son pour un candidat et pour Camille. Le compromis de 22 h est reclassé en A. Les occurrences suivantes (commentaire, article, assiettes) glissent d'un cran.

### Séquence esquissée (à simuler, écart maximal ≤ 2:30)
0:00 Nora en poste · 1:30 premier poste junior et le coworking · 3:00 l'appli de rencontre · 4:00 augmenter tes tarifs · 4:30 le senior et la plateforme de Kévin · 5:30 le compromis · 6:30 arrêter de coder, appeler · 7:30 le local rue des Tanneurs · 8:30 le tableur des soirées · 9:30 l'astreinte · 10:30 le commercial · 11:30 les fleurs · 13:00 la sortie.

**Garde-fous** : test R7 à chaque embauche (le net de la semaine suivante au moins celui d'avant, y compris depuis −2 000 €) ; masse salariale en fin de chapitre ~7 000 € chaque lundi, à vérifier contre les revenus ; la sortie dépend d'actes, jamais d'une attente.

## Ordre de travail
1. Détailler et valider chaque chapitre avec Alexandre (mécaniques, chiffres, wording), dans l'ordre.
2. Jalons d'interface, une fois les étapes validées.
3. Implémentation découpée : colonne vertébrale d'abord (compromis, rendez-vous, frise, âge), puis acte par acte, playtest entre chaque.
