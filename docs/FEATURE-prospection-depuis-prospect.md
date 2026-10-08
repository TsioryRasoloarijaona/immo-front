# Nouvelle prospection depuis la fiche prospect

Front seulement (crm-prototype). Branche `feat/prospection-depuis-prospect`. **Aucun changement
backend ni d'API** : `POST /api/prospections` (`createProspection`, `src/lib/api.ts:673`) crée
déjà une prospection pour un prospect existant (règles OMRAN, 5 champs obligatoires dont la
tranche).

## Pourquoi

Sur la fiche d'un prospect, impossible de lui ouvrir une prospection : il faut aller dans
Prospections › Nouvelle prospection, choisir « Prospect existant » et le rechercher à la main.
Un prospect (personne) peut avoir plusieurs prospections (une par projet) : on **crée** une
prospection pour lui, il reste prospect — ce n'est pas une transformation.

## Existant à réutiliser

- `pages/prospections/NewProspection.tsx` : `NouvelleProspectionDialog({ onClose })`, déjà un
  `Modal`, avec le mode `existing` / `new`, le sélecteur `selectedProspect`,
  `DoublonsProspectPanel` et `ProspectionExistanteNotice`. Ouvert aujourd'hui par
  `ProspectionsList` via la route `/prospections/nouveau` (`lazy`, `:44`, `:424`).
- `pages/prospects/ProspectDetail.tsx` : `FicheProspect` (page `/prospects/:id`, `/clients/:id`,
  et dialogue `FicheProspectDialog`), onglet « Prospections » (`:307`), liste
  `listProspectProspections`.

## Règles

- **R1** Bouton « Nouvelle prospection » sur `FicheProspect` : dans l'en-tête d'actions **et/ou**
  en tête de l'onglet « Prospections » (au choix le plus clair, un seul suffit s'il est bien
  visible). Présent en page et en dialogue, pour prospect comme pour client.
- **R2** Il ouvre `NouvelleProspectionDialog` **sans navigation**, avec une nouvelle prop
  optionnelle (ex. `prospectInitial`) : mode `existing` forcé, prospect pré-sélectionné et
  verrouillé (pas de recherche, pas de bascule « Nouveau prospect »). Sans la prop, le dialogue
  se comporte exactement comme aujourd'hui.
- **R3** Après création réussie : le dialogue se ferme, la liste de l'onglet « Prospections » de
  la fiche se recharge (la nouvelle ligne apparaît), toast de succès avec action « Ouvrir » qui
  ouvre la fiche prospection **en dialogue** (`usePreview().ouvrirFicheProspection(id, false)`),
  pas de navigation. Vérifier ce que fait aujourd'hui le dialogue après succès (navigation ?) et
  ne garder ce comportement que pour l'usage existant depuis la liste.
- **R4** `ProspectionExistanteNotice` (prospection déjà ouverte pour ce prospect) s'affiche comme
  aujourd'hui ; son « Ouvrir » ouvre la fiche existante en dialogue au lieu de naviguer quand on
  vient de la fiche prospect.
- **R5** Dialogue ouvert depuis une fiche elle-même en dialogue (`FicheProspectDialog`) : il
  s'empile au-dessus ; fermeture → retour à la fiche prospect.

## Hors périmètre

Backend, `types.ts`, la création de prospect, la transformation des pré-prospections.

## Vérification

`npm run build` vert + `npx eslint` sur les fichiers touchés. Contre le backend local si un
navigateur est disponible : depuis `/prospects/:id`, créer une prospection → elle apparaît dans
l'onglet, l'URL n'a pas changé ; l'usage depuis la liste Prospections est inchangé.
