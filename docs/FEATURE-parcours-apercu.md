# Aperçu en dialogue au lieu de changer de page (parcours + actions récentes)

Front seulement (crm-prototype). Branche `feat/parcours-apercu`. **Aucun changement backend,
aucun changement d'API.**

## Pourquoi

Sur une fiche, l'utilisateur veut consulter le prospect, le dossier ou une fiche récente **sans
quitter la page** : aujourd'hui « Voir » de la barre de parcours et les liens du menu « Actions
récentes » naviguent, puis il faut rechercher à nouveau la fiche d'origine. Retour utilisateur
sur la barre : « pas très visible ».

## Ce qui existe déjà (à réutiliser, ne pas recréer)

`usePreview()` (`lib/previewContext.ts`, hôte unique `components/PreviewProvider.tsx` monté dans
`App.tsx`) : `previewProspection(id)`, `previewDossier(id)`, `previewProspect(id)` ouvrent
`ProspectionPreviewDialog` / `DossierPreviewDialog` / `ProspectPreviewDialog`, qui chargent la
fiche et portent déjà « Ouvrir la fiche complète ↗ ». Déjà utilisé par `Calendrier.tsx:81` et
`Dashboard.tsx:469`.

## 1. Barre de parcours (`components/ParcoursVente.tsx`, `lib/parcours.ts`)

- **R1** Le lien d'une étape (`lien`, `lib/parcours.ts:84,100`) n'est plus une route : il porte
  la cible (`{ type: 'prospect' | 'dossier', id, libelle }`). Le clic ouvre `previewProspect(id)`
  / `previewDossier(id)` ; aucune navigation. C'est un `<button type="button">`, atteignable au
  clavier, avec un `aria-label` explicite (« Aperçu du prospect », « Aperçu du dossier {code} »).
- **R2 Visibilité** : la barre devient un bandeau lisible — fond léger + bordure fine + coins
  arrondis cohérents avec les cartes de la fiche, libellés d'étape en taille de texte courante
  (pas `text-label`/`text-micro` pour le libellé principal), l'action « Voir » rendue comme un
  petit bouton (variante `outline`/`ghost` `size="xs"` ou équivalent existant) au lieu d'un lien
  gris minuscule. Garder : `<ol>`, `aria-current="step"`, l'accent passé en prop, les glyphes par
  statut, le défilement horizontal en écran étroit (pas de débordement de page), la date.
- Ne pas toucher au calcul des étapes (R6–R9 de `FEATURE-parcours-vente.md`) ni au stepper des
  étapes commerciales.

## 2. Menu « Actions récentes » (`components/ActionsRecentes.tsx`)

- **R3** Clic sur « Ouvrir » d'une action → aperçu selon `cibleType` : `PRE_PROSPECTION` et
  `PROSPECTION` → `previewProspection(cibleId)`, `DOSSIER` → `previewDossier(cibleId)`. Lien
  secondaire « Prospect » → `previewProspect(prospectId)`. Plus aucune navigation depuis le menu ;
  libellés « Aperçu » / « Prospect » (boutons, pas liens).
- **R4** Le popover se **ferme** avant l'ouverture du dialogue (sinon deux pièges à focus
  concurrents) ; à la fermeture du dialogue, l'utilisateur est sur la même page qu'avant. Sur
  mobile, la barre latérale se referme comme aujourd'hui.
- La navigation reste possible via « Ouvrir la fiche complète » **dans** le dialogue.

## Hors périmètre

- Backend, `types.ts`, `api.ts`.
- Le contenu des trois dialogues d'aperçu (sauf correction indispensable pour R1/R3).
- Les autres liens de l'app (listes, fiche prospect → prospections, toasts « Ouvrir → »).

## Vérification

- `npm run build` vert (seule porte front).
- Contre le backend local si possible : sur une fiche prospection avec prospect, « Voir » ouvre
  l'aperçu du prospect, l'URL ne change pas, Échap rend la main sur la fiche ; idem pour un
  dossier ; depuis le menu Actions récentes, chaque type ouvre le bon aperçu et l'URL ne change
  pas. Capture de la barre si un navigateur est disponible (optionnelle).
