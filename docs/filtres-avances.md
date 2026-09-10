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
