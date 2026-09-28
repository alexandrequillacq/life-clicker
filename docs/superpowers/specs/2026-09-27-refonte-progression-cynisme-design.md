# Refonte de la progression : une pente graduelle vers le cynisme (v1, challengée)

> Statut : squelette challengé le 2026-09-27 (go conditionnel, 6 bloquants intégrés ci-dessous). Prochaine étape : détailler chapitre par chapitre avec Alexandre, un chapitre validé à la fois. Les jalons d'interface viendront APRÈS la validation des étapes.
> Références : [études de cas 2](../../../knowledge/references/etudes-de-cas-jeux-2.md) (25 jeux, sourcés), [études de cas 1](../../../knowledge/references/etudes-de-cas-jeux.md).

## Cadrage acté (2026-09-27)

- Échelle des métiers **ajustable** : départ plongeur, arrivée empereur cosmique, thèse inchangée.
- Registre : **satire grinçante**. Drôle d'abord, glaçant ensuite.
- Colonne vertébrale :
  - **A, l'échelle des compromis.** Chaque métier propose un compromis que le joueur choisit lui-même : concret, rentable, raisonnable pris isolément, un peu plus gros que le précédent.
  - **C, l'humain devient un nombre.** À chaque métier, la représentation des collègues, clients, citoyens recule d'un cran.
  - **B, même geste, autre cible**, en motif ponctuel (3 occurrences).
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
- **La vie garde ses prénoms pendant que le travail perd les siens** (C inversé). Camille, Maman, Lou restent nommés jusqu'au bout. Une délégation de LIEN remplace le prénom sur la frise par un nom de service (« Maman » devient « VoixIA »).
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

### Hors périmètre v1 (YAGNI)
- « Reprendre sa vie en main » à coût croissant : v2. Le rendez-vous manqué suffit à rendre la vie coûteuse.

## L'échelle (9 métiers)

| # | Métier | Âge | Durée | Les autres, vus comme | Compromis |
|---|---|---|---|---|---|
| 1 | Plongeur | 22 | 10 min | toi seul, le chef par une ligne | Programmer le lave-vaisselle en cycle court |
| 2 | Développeur freelance | 24 | 14 min | clients nommés | Désactiver le test qui échoue |
| 3 | Lead dev | 27 | 14 min | collègues avec prénom | Garder l'équipe jusqu'à 22 h |
| 4 | CTO | 31 | 14 min | pastilles d'initiales | Entraîner l'IA sur les messages privés des utilisateurs |
| 5 | Fondateur | 34 | 16 min | un effectif | Licencier 38 des 96 salariés de DataNova |
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

**2. Développeur freelance, 24 ans (~14 min)**
- Verbes : **missions payées à la livraison** (le clic résout les bugs qui font avancer la mission ; plus de paiement au bug). Clients : Mme Duval (site vitrine), M. Petit (appli du club de foot), Kévin (migration de sa start-up de livraison). Puis « Écrire un script qui met les sites en ligne » : une file de 3 tâches qui s'exécute seule, première automatisation de son travail, célébrée.
- Compromis : « Désactiver le test qui échoue » (mission livrée tout de suite ; le bug revient chez Kévin sous forme d'incident quand on y est lead).
- Vie : « Dîner avec des amis, vendredi 20 h », « Aller courir ». Délégation de corvée : « Se faire livrer ses courses » (point neutre).
- Promotion : 3 missions livrées à Kévin → « Accepter le CDI que propose Kévin ».

### Acte II, confort (couleur, puis beauté)

**3. Lead dev, 27 ans (~14 min)**
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
- Verbes : poster et surfer la tendance ; **les sponsors dictent** (une demande en file bloque « Publier » tant qu'on ne l'a pas acceptée ou refusée) ; **la polémique** est une rafale de commentaires critiques qu'on éteint avec « Supprimer un commentaire » (motif B, 1re occurrence).
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
- Première moitié : damier des institutions (« Contrôler les médias nationaux », « Nommer un ami à la banque centrale », « Nommer ses généraux », « Surveiller la population »…), Résistance, **élection datée** toutes les 4 min (−10 % d'Emprise courante si l'adhésion est sous 50 %). Après les médias, le bandeau ne publie plus que du positif, et « Supprimer un article » a le même bouton et le même son que « Supprimer un commentaire » (motif B, 2e occurrence). « Signer un décret sans vote ». Le dernier décret masque la jauge de Résistance et gèle son effet : un trou reste visible dans la grille.
- Compromis 1 : « Reporter les élections de deux ans » (supprime la taxe électorale).
- Seconde moitié : « Proclamer le gouvernement mondial », puis le damier des continents.
- Compromis 2 : « Couper Internet dans les régions qui résistent » (Résistance −50 %).
- Vie : « Aller aux 18 ans de Lou », ou « Envoyer un attaché aux 18 ans de Lou ».
- Promotion : Emprise → l'empire cosmique s'ouvre.

**9. Empereur cosmique (~8 min, le final accélère)**
- Verbes : **liquider l'interface pour lancer la sonde**. La première sonde coûte 50 Md€ ; chaque tuile de la liste blanche se vend 6 à 12 Md€ (en vendre 4 avance la sonde d'environ 5 min). Puis les sondes se répliquent seules et l'écran vidé se remplit de leurs points. À l'emplacement exact du premier bouton du plongeur réapparaît un bouton vide ; il incrémente un compteur « assiettes » sans effet (motif B, 3e occurrence).
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

**Ce que le joueur a appris en sortant.** Cliquer, s'équiper, automatiser ; que la fatigue ne touche que les mains ; que sa vitesse profite d'abord au chef ; qu'un appel se rate si l'on travaille le dimanche, et que c'est lui qui a proposé d'ouvrir ; qu'un petit arrangement rapporte, et que c'est le client qui paie.

## Ordre de travail
1. Détailler et valider chaque chapitre avec Alexandre (mécaniques, chiffres, wording), dans l'ordre.
2. Jalons d'interface, une fois les étapes validées.
3. Implémentation découpée : colonne vertébrale d'abord (compromis, rendez-vous, frise, âge), puis acte par acte, playtest entre chaque.
