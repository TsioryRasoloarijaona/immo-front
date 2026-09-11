# Filtres avancés — Dossiers de vente

> ✅ **Implémenté côté backend (docsV4) et câblé côté front.** Ce document
> est conservé comme trace historique de ce qui a été demandé/pourquoi —
> voir la section "Statut au 22/08" tout en bas pour l'état actuel.

Contexte : la page `/dossiers` a été redessinée pour reprendre le panneau de
filtres de l'ancien Omran (`Vente > Dossiers de vente`) — capture de
référence fournie par le métier, checklist Tranche + Statut + Période +
recherche multi-critère. Le panneau est en place côté front
(`src/pages/dossiers/DossiersList.tsx`, `src/components/MultiSelectDropdown.tsx`)
mais une partie est **volontairement statique** (contrôles visibles,
désactivés, badge "Bientôt") car l'API actuelle (`docs/api-docsV4.json`,
`GET /api/dossiers`) ne les supporte pas encore. Ce document liste ce qu'il
faudrait côté backend pour les activer.

## Déjà supporté (rien à faire)

`GET /api/dossiers` accepte aujourd'hui `statut` (une seule valeur),
`commercial` (UUID), `projet` (UUID) et `search`, en plus de `pageable`.
Le front utilise déjà `statut`, `commercial` et `search`. `projet` (filtre
par **Entité**, l'objet parent d'une Tranche — voir `ProjetListItemDto`)
n'est pas encore câblé côté UI mais ne nécessite aucun changement backend :
c'est du travail front pur, à faire dans un prochain passage.

## 1. Statut — passer de valeur unique à multi-sélection

Aujourd'hui : `?statut=Concrétisation` (une seule valeur, le reste est
ignoré silencieusement si on en envoie plusieurs).

**La checklist Statut est déjà un vrai multi-select côté UI** (voir
`MultiSelectDropdown.tsx` — n'importe quel nombre de cases peut être coché à la
fois). En attendant que l'API accepte une liste, `DossiersList.tsx`
contourne la limite côté front (`fetchDossiers()`) :

- 0 ou 1 statut coché → un seul appel `GET /api/dossiers?statut=…`,
  pagination serveur normale (inchangé).
- 2+ statuts cochés → un appel **par statut coché** (`Promise.all`, taille
  de page 500 — le dataset actuel fait ~374 dossiers), fusion par `id`,
  tri par `dateDocument` desc, puis pagination **côté client** sur le
  résultat fusionné.

Ce contournement fonctionne mais fait N requêtes au lieu d'une et ne
scalera pas si le volume de dossiers grossit beaucoup. Le vrai correctif
reste côté backend :

Proposition : accepter le paramètre `statut` répété
(`?statut=Réservation&statut=Concrétisation`) — c'est la convention Spring
la plus simple pour `@RequestParam List<String> statut`. Garder la
compatibilité avec l'appel actuel à une seule valeur (une liste à un seul
élément doit se comporter identiquement à aujourd'hui). Une fois ce
paramètre disponible, `fetchDossiers()` peut redevenir un simple passe-plat
vers `listDossiers()` et le contournement de fusion côté client peut être
supprimé.

## 2. Filtre par Tranche (et pas seulement par Entité/Projet)

Un Dossier n'a pas de `trancheId` direct dans `DossierListItemDto` /
`DossierDetailDto` — le lien passe par les `articles` du dossier, chacun
rattaché à une Tranche. Le paramètre `projet` existant ne filtre qu'au
niveau Entité (le parent), pas au niveau Tranche (l'enfant, ex. "AYAD
PRIVATE FERME BRETONE").

Besoin (deux parties) :

1. **Un moyen de lister les Tranches à plat**, pour peupler la checklist
   sans le contournement N+1 déjà utilisé dans `TranchesList.tsx`
   (`GET /api/projets` puis `GET /api/projets/{id}/tranches` pour chacun).
   Idéalement `GET /api/tranches?projetId=` (optionnel) retournant au
   minimum `{ id, code, description }` — même forme que
   `TrancheListItemDto` actuel.
2. **Un paramètre de filtre sur `/api/dossiers`**, par ex. `trancheId`
   (répétable comme `statut`, pour le multi-select), qui filtre les
   dossiers dont au moins un article appartient à une des tranches
   demandées.

## 3. Filtre par période (plage de dates)

La capture de référence propose un sélecteur "quel champ de date filtrer"
(Date réservation, etc.) + une plage Du/Au. Aujourd'hui `DossierListItemDto`
n'expose qu'un seul champ date, `dateDocument` — les autres jalons
(réservation, compromis, crédit débloqué, remise des clés…) qui existaient
dans l'échantillon JSON d'origine (voir `CLAUDE.md` — `agreementDate`,
`creditApprovalDate`, `deliveryDateReal`, etc.) ne sont plus renvoyés par
l'API depuis que `statut` est calculé côté serveur.

Deux niveaux possibles, du plus simple au plus fidèle à la capture :

- **Minimal** : ajouter `dateDebut` / `dateFin` sur `/api/dossiers`,
  filtrant sur `dateDocument`. Suffisant pour une plage de dates simple,
  mais pas pour choisir *quel* jalon filtrer.
- **Complet** (fidèle à la capture) : exposer les jalons bruts utilisés
  pour calculer `statut` (au moins date de réservation et date de
  concrétisation, les deux plus demandées) sur le DTO, plus un paramètre
  `champDate` (enum) + `dateDebut`/`dateFin` pour indiquer sur quel jalon
  la plage s'applique.

## Ce que le front fera une fois ces endpoints prêts

- Retirer le badge "Bientôt" et l'état `disabled` des sections Tranche et
  Période dans `DossiersList.tsx`.
- Simplifier `fetchDossiers()` en un simple passe-plat vers `listDossiers()`
  une fois que `statut` accepte une liste côté API (supprimer le
  contournement multi-appels/fusion décrit au point 1).
- Câbler `projet` (Entité) dès maintenant si un backend n'est pas
  nécessaire pour ça — c'est indépendant des points 1-3 ci-dessus.

---

# Filtres avancés — Prospections / Pré-prospections / Prospects

> ✅ **Implémenté côté backend (docsV4, révision 88 routes) et câblé côté
> front.** Section ajoutée le 22/08 puis fermée le même jour.

Contexte : demande de reprendre le même panneau de filtres que Dossiers
(`MultiSelectDropdown` Étape/Origine/Tranche/Commercial + plage de dates +
recherche + Réinitialiser) sur `/prospections`, `/pre-prospections` et
`/prospects`. Panneau partagé dans `src/components/ProspectionFilterBar.tsx`
(état dans `lib/domain.tsx` — `ProspectionFilterBarState`).

## Demandé au backend

1. `GET /api/prospections` — passer `etape`, `origine`, `commercial` en
   listes répétables (comme `statut` sur `/api/dossiers`).
2. `GET /api/prospections` — nouveaux params `trancheId` (répétable) et
   `dateDebut`/`dateFin` (ISO datetime, filtre sur `dateDocument`).
3. `ProspectionListItemDto` — ajouter `trancheId` (déjà présent sur
   `ProspectionDetailDto` uniquement).
4. `GET /api/pre-prospections` — accepter exactement le même jeu de
   paramètres que `/api/prospections` (`search`, `etape[]`, `origine[]`,
   `commercial[]`, `trancheId[]`, `dateDebut`/`dateFin`, `ouvertes`) —
   n'acceptait auparavant que `pageable`.
5. `GET /api/prospects` — passer `type` en liste répétable.

Tout ce qui précède est confirmé présent dans `docs/api-docsV4.json` (révision
88 routes) et câblé côté front dans `lib/api.ts`
(`ProspectionFilterParams`, `listProspects`), `ProspectionsList.tsx`,
`PreProspectionsList.tsx` (plus de filtrage client-side — vrai passe-plat
serveur maintenant) et `ProspectsList.tsx`. Rien de plus à faire ici.

---

# Offres — nouvelle section `/offres` (liste globale, cross-prospections)

> ✅ **Implémenté côté backend (docsV4) et câblé côté front.** Demandé et
> livré le même jour (26/08) — `GET /api/devis` + `DevisDto.prospectionId`/
> `prospectionCode` + `DevisPageDto.sommePrixVenteTTCPage`, exactement comme
> demandé aux points 1-3 ci-dessous. Contrairement aux Devis déjà existants
> (`GET/POST /api/prospections/{id}/devis`, câblés depuis plusieurs sessions
> dans `ProspectionDetail.tsx`), cette page est une **nouvelle vue au niveau
> module Vente** — reprend le panneau `Vente > Offres` de l'ancien Omran
> (capture fournie par le métier : checklist Entité, Période + plage Du/Au,
> Commercial, recherche multi-critère, liste triable avec un total).
> Contrairement à la capture, le panneau reprend le layout `Card` horizontal
> déjà utilisé par `/dossiers` et `/prospections` (pas le panneau vertical
> legacy — cohérent avec `CLAUDE.md`, "Design direction"). Section conservée
> comme trace historique de la demande.

Front en place : `src/pages/prospections/OffresList.tsx`, route `/offres`,
entrée de sidebar "Offres" sous **Ventes** (`Layout.tsx`), appelle
`listOffres()` (`lib/api.ts`) → `GET /api/devis`, confirmé présent dans
`docs/api-docsV4.json`.

## 1. Nouvel endpoint : `GET /api/devis`

Liste globale des offres, tous prospections confondues — symétrique de
`GET /api/dossiers` (déjà global) vs. `GET /api/clients/{id}/dossiers`
(déjà scopé). Aujourd'hui seul `GET /api/prospections/{id}/devis` (scopé)
existe.

Paramètres (mêmes conventions que `DossierFilterParams`/
`ProspectionFilterParams` — voir sections précédentes de ce document) :

- `search` — recherche multi-critère (code offre, nom du prospect, code
  article…), même sémantique que sur `/api/dossiers`/`/api/prospections`.
- `trancheId` — répétable (`?trancheId=…&trancheId=…`), filtre "Entité" de
  la capture (en réalité un filtre par Tranche, comme sur `/api/dossiers`).
- `commercial` — UUID, valeur unique (la capture n'a qu'un select simple,
  pas de checklist, contrairement à Étape/Origine ailleurs).
- `dateDebut` / `dateFin` — plage sur `dateDocument` (date de l'offre).
- `pageable` standard.

Réponse : `PageDto<DevisDto>` — le DTO existe déjà et couvre déjà la
quasi-totalité des colonnes de la capture (`code`, `dateDocument`,
`tranche`/`trancheDescription`, `article`/`articleDescription`,
`commercial`, `prospect`, `modePaiement`, `montants.remisePercent`,
`montants.prixVenteTTC`, `notes`). Un seul champ manque :

## 2. `DevisDto` — ajouter `prospectionId` / `prospectionCode`

La capture a une colonne "Prospection" (le code de la prospection dont
l'offre est issue, ex. `26/05930`). `DevisDto` n'expose aujourd'hui aucun
lien vers sa prospection parente — logique tant qu'il n'était consommé que
nesté sous `/api/prospections/{id}/devis` (le parent est déjà connu de
l'appelant), mais nécessaire pour :
- afficher la colonne "Prospection" de la liste globale ;
- permettre à `OffresList.tsx` de faire un lien cliquable vers
  `/prospections/{prospectionId}` depuis une ligne d'offre (déjà câblé côté
  front, juste en attente du champ).

Front : le type `DevisDto` (`src/types.ts`) a déjà `prospectionId?: UUID` /
`prospectionCode?: string` en attente, marqués optionnels — aucun autre
changement de type nécessaire une fois le backend les renvoie.

## 3. Total affiché

La capture affiche un total agrégé ("Total : 6 851 151 DH"). Livré comme
`DevisPageDto.sommePrixVenteTTCPage` — **somme de la page courante
uniquement**, pas un total plein-filtre sur l'ensemble des résultats (les
offres sans montant renseigné sont exclues de la somme). `OffresList.tsx`
l'affiche tel quel, libellé "Total (page)" pour ne pas laisser croire à un
total plein-jeu de filtres. Un vrai total plein-filtre resterait à faire si
le besoin se précise (même contournement multi-fetch que pour les statuts
de `/api/dossiers`, §1 plus haut).

## Statut au 26/08

Tout ce qui précède (`GET /api/devis`, `DevisDto.prospectionId`/
`prospectionCode`, `DevisPageDto.sommePrixVenteTTCPage`) est confirmé
présent dans `docs/api-docsV4.json` et câblé côté front dans `lib/api.ts`
(`DevisFilterParams`, `listOffres`, type `DevisPageDto`) et
`OffresList.tsx`. Au passage : `DevisDto.prix` (un champ qui n'a jamais
existé dans le schéma réel) a été retiré du type front et des deux endroits
qui s'y référaient encore par erreur (`ProspectionDetail.tsx`,
`NewDossier.tsx`) — tous deux remplacés par `montants.prixVenteTTC`, le
vrai champ. Rien de plus à faire ici.

## Demande backend — filtre statut sur /api/dossiers (10/09)

Le contournement decrit au §1 (charger 500 lignes, filtrer et paginer cote
client parce que `?statut=` attend le code brut `StrStatus.Code` et rend 0
ligne sur le libelle accentue) vient de prendre un cout supplementaire avec
le selecteur de colonnes.

Mesure sur le serveur reel : les groupes `PATRIMOINE` et `ORIGINE` du
catalogue `/api/referentiels/colonnes/dossiers` traversent
article -> tranche -> projet -> societe et dereferencent la prospection, soit
**trois jointures paresseuses par ligne**. Sur le chemin nominal cela porte
sur 20 lignes ; des qu'un filtre de statut est actif, le contournement les
applique a **500**.

Deux consequences immediates, deja absorbees cote front :

- `fetchDossiersWithStatusWorkaround` redemande `statut` meme quand
  l'utilisateur decoche la colonne — sans quoi le filtre client ne matche plus
  rien et l'ecran se vide sans message.
- La selection de colonnes s'applique telle quelle a la requete de 500 lignes.

**Ce qu'on demande** : que `GET /api/dossiers?statut=` accepte le libelle
d'affichage (ou normalise accents et casse), ou a defaut qu'il expose les codes
bruts exacts. Le contournement disparait alors, et son cout avec lui.

Non demandé, et c'est délibéré : rien sur `?colonnes=` lui-meme, dont le
contrat s'est verifie exactement comme la spec le decrit — 400 avec la liste
des noms valides sur un nom inconnu, `id` toujours servi, et une liste close
(demander `prospectionCode` sans `prospectionId` renvoie bien la colonne
sans son id).

## Groupement des listes — ce qui a ete mesure (11/09)

Livraison V4 : `GET /api/{prospections,pre-prospections,dossiers}/groupes`,
plus `groupeColonne`/`groupeValeur`/`granularite` sur les listes, plus les
booleens `groupable`/`agregeable` sur `ColonneDto`.

Verifie contre le serveur reel, 16 controles, tous verts :

- **somme des effectifs == `totalElements` de la liste**, a filtres egaux, sur
  6 combinaisons (dossiers/statut, dossiers/commercial+recherche,
  dossiers/tranche+fenetre de dates, prospections/etape+ouvertes,
  prospections/origine+recherche, pre-prospections/origine) ;
- **deplier un groupe redonne exactement son effectif**, groupe nul compris
  (93 dossiers sans avocat, 7 prospections sans etape) ;
- **temps en regime etabli** : 48-114 ms (dossiers), 235-664 ms
  (prospections), ~240 ms (pre-prospections). Le premier appel a 4 975 ms est
  un demarrage a froid, pas une regression.

Catalogue mesure : prospections 21 groupables / 2 agregeables sur 56 colonnes ;
dossiers 22 / 8 sur 40 ; **prospects 0 / 0**, et il n'existe pas de
`/api/prospects/groupes` — cet ecran n'a donc pas de bande de groupement, ce
qui est coherent. La description du catalogue prospects annonce pourtant que
les drapeaux « pilotent la bande de groupement » : formulation a corriger, sans
consequence fonctionnelle.

### Forme retenue : le depliant, pas deux ecrans

Les groupes s'intercalent **dans la grille**, comme dans le logiciel de bureau :
un en-tete `⊟ Statut : CONCRETISATION (68 items)` porte l'effectif et les
bandes « Total : », et s'ouvre sur place pour laisser apparaitre ses lignes dans
les memes colonnes. **Plusieurs groupes restent ouverts en meme temps** — c'est
tout l'interet du depliant, et ce qu'une bascule entre deux vues ne permet pas.

Un groupe n'est pas borne (mesure : 7 612 prospections dans « 1 A TRAITER »), il
se charge donc par lots de 20, avec une ligne de pied qui annonce le reste.

### Constat serveur : l'ordre des lignes n'est pas deterministe

Le chargement par lots redemande la page 0 avec une taille plus grande, ce qui
suppose que le lot precedent en soit le prefixe. **Mesure : ce n'est pas
toujours le cas.** Le groupe « 2024 » des dossiers, trie sur la seule
`docDate`, ressortait dans un ordre different d'un appel a l'autre — les ex
aequo sont departages par le plan SQL du moment, et le desordre est
intermittent.

Absorbe cote front en passant un tri qui tranche : `sort=docDate,desc` **plus**
`sort=id,asc`, accepte 200 sur les trois endpoints. Verifie ensuite 15 fois de
suite sur trois groupes : prefixe stable 15/15.

**A noter pour plus tard** : le meme aleas existe sur la pagination ordinaire
des listes, ou il peut cacher ou dupliquer une ligne entre deux pages. Non
touche ici — ce serait changer l'ordre d'affichage actuel sans que personne ne
l'ait demande — mais c'est un vrai defaut latent.

### Piege serveur, absorbe cote front

`?granularite=` **doit accompagner la cle** au depliage. Mesure :
`?groupeColonne=dateDocument&groupeValeur=2024` sans `granularite=ANNEE` rend
`totalElements: 0` en **HTTP 200** — un ecran vide, sans erreur. Le front fait
circuler une seule granularite, derivee au meme endroit pour les deux requetes
(`lib/groupement.ts`).

### Deux colonnes `agregeable` dont la somme n'informe pas

Le serveur accepte `?agregats=remise` et `?agregats=probabiliteFinalisation`.
Ce sont des taux, pas des quantites :

- `remise` est un **ratio 0-1** (mesure : -0,207865 a 0,988329) ; sa somme par
  statut vaut 1,88 / 4,97 / 0,29 ;
- `probabiliteFinalisation` vaut **1 sur les 116 dossiers** ; sa somme est donc
  l'effectif du groupe, deja affiche a cote.

Le front ne les propose pas au Σ (`AGREGATS_SANS_SENS`). Rien a demander : la
somme est calculable, c'est son sens qui manque. Une moyenne serait l'agregat
juste pour un taux — a considerer si le besoin se confirme.

### Consequence sur la demande §statut ci-dessus : elle monte en priorite

Le contournement des 500 lignes n'empeche plus seulement de filtrer
efficacement — il **interdit le groupement** des que l'utilisateur filtre par
statut.

Raison : le contournement filtre *apres* le serveur. L'endpoint `/groupes` ne
renvoie pas de lignes a refiltrer, il renvoie des effectifs deja calcules. Lui
cacher le filtre statut donnerait des groupes comptes sur un perimetre plus
large que la liste affichee — des totaux faux presentes comme justes. Le front
desactive donc la bande de groupement tant qu'un statut est filtre, en
l'annoncant (`GROUPEMENT_ET_STATUT` dans `DossiersList.tsx`).

Re-mesure du 11/09, inchangee : `statut=CONCRETISATION` rend 68 dossiers,
`statut=Concrétisation` en rend **0 en HTTP 200**. Et aucune normalisation ne
rattrape l'ecart — « Remise des clés » se code `REMISE DES CLEFS`, « Annulé »
se code `ANNULATION`. Il faut le backend.

## Livraison spec : inclureSansValeur, article et delais (11/09)

### Le piege : un defaut serveur qui retire des lignes en silence

`inclureSansValeur` est apparu sur les trois endpoints `/groupes`. **Ce n'est
pas un ajout, c'est un changement de comportement par defaut** : le groupe des
lignes dont la colonne groupee est vide n'est plus servi sauf demande
explicite, et le parametre vaut `false` par defaut.

Mesure contre le serveur :

| groupement | defaut | `inclureSansValeur=true` | total liste |
|---|---|---|---|
| dossiers / avocatNom | 1 groupe, **23 lignes** | 2 groupes, 116 | 116 |
| dossiers / responsableVenteNom | 2 groupes, 79 | 3 groupes, 116 | 116 |
| prospections / etape | 7 groupes, **9 647** | 8 groupes, 9 654 | 9 654 |
| dossiers / statut | 7 groupes, 116 | idem | 116 |

Grouper les dossiers par avocat aurait donc affiche **23 dossiers sur 116**,
sans rien pour l'expliquer : les 93 sans avocat ne sont dans aucun groupe. Le
front envoie desormais toujours `true` (`useGroupement`), ce qui restaure
l'egalite somme des effectifs = `totalElements` sur laquelle l'ecran repose.

L'argument du serveur se tient sur une colonne peu renseignee — le groupe vide
ecraserait les autres — mais pour une liste, faire disparaitre des lignes sans
le dire est pire qu'un groupe dominant, qui lui est lisible et paginable.

### Seize colonnes de plus sur les dossiers, deux nouveaux groupes

`ARTICLE` (9 colonnes : le lot lui-meme) et `DELAIS` (3 durees). Toutes
`parDefaut: false`, donc **la vue par defaut ne bouge pas**.

Population mesuree sur les 116 dossiers servis : `articleCode`,
`articleLibelle`, `bloc`, `etage`, `typeArticle`, `categorieArticle` a
**116/116** ; `articleTitreFoncier` 33/116 ; `responsableVenteNom` 23/116 ;
`delaiConcretisation` 95/116, `delaiNotaire` 24/116, `delaiLivraison` 19/116.

Cout mesure d'une page de 20 : ~75 ms par defaut, ~175 ms en demandant les
treize nouvelles colonnes. Reel mais modeste, et opt-in.

Trois choses a savoir :

- Les `delai*` sont des **entiers en jours** (mesure 0 a 443), et le libelle du
  catalogue porte deja l'unite (« Delai notaire (j) »). Le formatage `NOMBRE`
  par defaut les sert correctement : ce ne sont pas des ratios deguises comme
  `remise`. Ils restent donc sommables — ce sont des quantites, pas des taux —
  meme si une moyenne dirait davantage.
- `delaiNotaire` mesure **concretisation → compromis**, malgre son nom.
- `articleCode` est **la cle de tri par defaut de la liste du logiciel de
  bureau** (`ORDER BY ArticleCode, H1Code, H2Code, H3Code`). A savoir si l'ordre
  de la liste doit un jour reproduire celui d'Omran.
- Le serveur declare `articleCode` groupable, mais il rend **105 groupes pour
  116 dossiers** : techniquement valide, sans interet pratique. Laisse au
  catalogue plutot qu'ecarte par un cas particulier cote front.

`articleId` et `responsableVenteId` sont cochables et auraient affiche des
UUID : ajoutes a `DISPOSITION_DOSSIERS.masquees`, comme les six autres cles de
jointure avant eux. `ARTICLE` et `DELAIS` etaient inconnus de
`LIBELLES_GROUPE` et se seraient affiches en capitales brutes dans le selecteur
de colonnes et le menu de groupement.

### Les sept champs de la fiche dossier

`DossierDetailDto` gagne `responsableVente*`, `dateCompromis`,
`dateLivraisonReelle` et les trois delais. **Pas ajoutes au formulaire** : la
fiche tient en une page sans defilement et le dossier est le plus tendu des
trois. Les jalons et delais vont sous le parcours de statut, qui parle deja
d'avancement ; le responsable de vente rejoint le commercial et le notaire dans
l'onglet Acquereurs.

Le responsable de vente est un **acteur distinct du commercial**, pas un
synonyme : 221 des 358 dossiers reels (61 %) en portent un.

## Relances en retard signalees sur la ligne (11/09)

Les prospections et pre-prospections dont la relance est en retard **de plus
de 30 jours** et qui ne sont pas fermees portent un fond rouge leger sur toute
la ligne.

### Pourquoi un seuil, et pourquoi 30

Sans seuil, **336 prospections sur 500** sont concernees (67 %), soit 17 lignes
sur 20 en page 1. Un repere qui s'allume sur deux tiers des lignes ne repere
plus rien. Repartition mesuree du retard :

| anciennete | lignes |
|---|---|
| <= 7 j | 26 |
| 8-30 j | 43 |
| 31-180 j | 162 |
| > 180 j | 105 |

Le seuil de 30 j coupe les deux premieres tranches : il reste 267 lignes, 53 %.

### Effet reel par page, a connaitre

La liste sort **triee par date d'alerte decroissante**. Le seuil ne repartit
donc pas le rouge uniformement, il le deplace vers le fond de la liste :

| page | echues (seuil 0) | rouges (seuil 30) | age median du retard |
|---|---|---|---|
| 1 | 17/20 | **0/20** | 3 j |
| 2 | 13/20 | 0/20 | 8 j |
| 3 | 15/20 | 0/20 | 11 j |
| 4 | 14/20 | 0/20 | 16 j |
| 5 | 11/20 | 1/20 | 21 j |
| 6 | 9/20 | 9/20 | 41 j |
| 7 | 14/20 | 14/20 | 49 j |
| 8 | 13/20 | 13/20 | 47 j |

**A l'ouverture de l'ecran, aucune ligne n'est rouge.** Le repere sert donc a
reperer les dossiers qui trainent quand on parcourt la liste, pas a annoncer un
retard des l'arrivee. Si c'est le second usage qui est voulu, il faut soit
baisser le seuil, soit trier par anciennete.

Deux autres constats :

- **0 sur 20 et 1 sur 500** cote pre-prospections, quel que soit le seuil.
  L'ecran ne rougira quasiment jamais ; ce n'est pas un bug de cablage.
- `fermee` est dans la condition : 16 lignes sur 500 sont echues **et**
  fermees. Une prospection perdue garde son alerte mais ne sera plus rappelee.
- Le **badge** de la colonne Alerte, lui, s'allume des l'echeance passee. Les
  deux signaux sont volontairement desynchronises : le badge dit « c'est du »,
  le fond dit « ca traine ». Une ligne peut donc porter un badge sans fond.

### Le fond ne doit pas dependre de la selection de colonnes

`?colonnes=` est une liste close. Verifie : avec une selection personnalisee
reduite, la charge utile ne contient que `id, prospectNom, etape` — le fond
rouge disparaitrait sans que rien ne l'explique, et decocher `fermee` seule
ferait passer les leads perdus pour des relances a faire. D'ou
`toujoursDemandees` dans `DispositionColonnes` : ces deux colonnes sont
demandees meme decochees, et filtrees sur le catalogue puisqu'un nom inconnu
fait 400 sur toute la liste.

### Constat au passage : la spec du front est perimee sur les pre-prospections

`PreProspectionsList` porte un commentaire disant que
`GET /api/pre-prospections` **n'accepte pas** `?colonnes=`. Mesure du 11/09 :
il l'accepte et l'honore (`?colonnes=prospectNom,etape` rend bien trois champs).
L'ecran ne s'en sert pas — son selecteur de colonnes est purement d'affichage.
Non touche ici, mais le commentaire est a corriger et il y a une optimisation a
prendre.

### Contraste : le garde ne couvrait pas une ligne teintee

Teinter une ligne entiere met le texte des cellules sur un fond qu'aucune paire
du garde ne mesurait — les blocs existants verifient un *ton* sur sa teinte,
jamais le texte ordinaire dessus. Etendu, il a trouve un echec reel :
`--muted-foreground` sur `--warning-bg` tombe a **4,34:1 en theme sombre**
(AA exige 4,5). D'ou un token dedie `--retard-bg` a un alpha plus faible
(0,07), qui donne 4,77:1 et 4,81:1. `npm run check:contrast` couvre desormais
sept paires sur ce fond, dans les deux themes.

## Demande backend — champs éditables de la pré-prospection (10/09)

`ModifierProspectionRequest` porte quatorze champs, dont huit mesurés morts
(prix, surface, avance, financements). Il **ne porte pas** les quatre seuls
champs qu'un commercial a besoin de corriger sur un lead non transformé :

| Champ | Servi par le GET | Modifiable |
|---|---|---|
| `tempDescription` | oui, 14/14 mesuré | **non** |
| `tempTel` | oui, 14/14 | **non** |
| `tempEmail` | oui, 5/14 | **non** |
| `commercialId` | oui (nul sur 14/14) | **non** |

Ce sont exactement les champs que le logiciel de bureau rend éditables sur son
écran « Pré-Prospections » — Description, Téléphone, Email, Commercial. Chez
nous ils sont affichés avec un cadenas, parce qu'un champ qui accepte la
frappe et perd la saisie au rechargement est pire qu'un champ grisé.

Le contournement existe mais change le sens du geste :
`POST /api/pre-prospections/{id}/creer-prospect` accepte bien
prénom / nom / téléphone / email, donc la seule façon de corriger un numéro
mal saisi est de promouvoir le lead en fiche tiers. Sur un doublon avéré,
c'est précisément ce qu'on ne veut pas faire.

**Ce qu'on demande** : ajouter `tempDescription`, `tempTel`, `tempEmail` et
`commercialId` à `ModifierProspectionRequest`. Rien sur les huit champs morts,
qu'on n'affiche pas.

### Non demandé

`ancienClient` est dans le même cas (servi, non modifiable) sur la
prospection, mais il se déduit du tiers et n'a pas la même urgence.

Les « Donnée 2 » à « Donnée 9 » du logiciel de bureau — `TempField2` à
`TempField9` — ne sont pas exposées. Le rang 6 n'en sert que deux,
`TempField1` et `TempField10`, et **c'est le bon arbitrage** : le serveur les
interprète (`noteQualification`, `doublonDeCode`) au lieu de les servir
brutes. On ne demande pas les huit autres sans mesure préalable.

## Demande backend — les huit onglets absents de la fiche dossier (11/09)

L'écran « Dossier de vente » du logiciel de bureau porte **douze** onglets dans
sa zone basse. Cinq ont un endpoint et sont livrés :

| Onglet légataire | Endpoint |
|---|---|
| Schéma de financement | `GET/POST /api/dossiers/{id}/echeancier` + règlements imbriqués |
| Acquéreurs | `GET /api/dossiers/{id}/payeurs` |
| Règlements | imbriqués sous les échéances |
| Décomptes | `EcheanceDto.decompte`, servi depuis cette livraison |
| *(hors Omran)* Documents | `GET/POST /api/dossiers/{id}/pieces-jointes` |

Les huit autres n'ont **rien** : Sous articles, Modifications, Cadeaux,
Dépenses, Factures proforma, Factures, Avoirs, Réclamations. Ils ne sont pas
affichés — un onglet vide coûte un clic pour apprendre qu'il n'y a rien.

**Ce qu'on demande** : rien dans l'immédiat. Cette note existe pour que le
périmètre restant soit écrit quelque part, et pour qu'on ne re-découvre pas
l'absence à chaque passage sur cet écran. À prioriser avec le métier — la
facturation (Factures proforma / Factures / Avoirs) est vraisemblablement le
bloc qui porte le plus de valeur, mais c'est une décision métier, pas une
lecture de capture d'écran.

### Vérifié et sans demande

`GET /api/dossiers/{id}` est servi en **GET uniquement** — pas de PATCH
général. La fiche est donc en lecture seule, les seules écritures passant par
`PATCH /statut` et par l'échéancier. Ce n'est pas signalé comme un manque :
contrairement à la prospection, l'écran légataire ne laisse pas non plus
modifier librement un dossier de vente.

Un point non vérifiable de mon côté : la règle « sur un dossier sorti,
`netAPayer.reste` tombe à zéro ». Aucun dossier `ANNULATION` ni `DESISTEMENT`
dans les 25 premiers de la base de test, donc l'affichage du bandeau
« Dossier sorti » **n'a pas été vu en situation**.
