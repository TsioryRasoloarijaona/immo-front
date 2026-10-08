# Parcours de vente : ne plus perdre une fiche après une transformation

Front seulement (crm-prototype). Branche `feat/parcours-vente`. **Aucun changement backend.**

## Pourquoi

Après « Transformer en prospect » ou « Transformer en prospection », l'utilisateur reste où il
est avec un toast de 3,6 s sans lien ; la ligne disparaît parfois de la liste. Il doit changer de
menu et rechercher le contact. Rappel : pré-prospection et prospection sont **la même fiche**
(`ComProspection`, même `id`) ; seul `typeProspectionCode` change (`ComPreProspection` →
`ComProspection`). Le prospect est un tiers séparé (`prospectId`).

## Partie 1 — Message avec lien après chaque transformation

### 1a. Un composant de notification partagé

Il n'existe aucun système de toast global : le même `useState` + `setTimeout(3600)` + `<div
role="status">` est recopié (`components/ActionsLigneProspection.tsx:62-66,179-187`,
`pages/prospections/ProspectionDetail.tsx:603,658-661,1533`, `DossierDetail.tsx`, `SyncButton.tsx`,
pages virements). Créer **un** mécanisme partagé (contexte + composant monté une fois dans le
layout) qui accepte : un texte, une **action optionnelle** `{ libellé, vers: route }`, et une
variante (succès / erreur).

- **R1** Un toast **avec action** reste affiché jusqu'à fermeture (bouton ×) ou clic sur
  l'action ; sans action, il garde le comportement actuel (≈ 3,6 s).
- **R2** `role="status"` / `aria-live="polite"` conservés ; l'action est un vrai lien
  (navigation SPA), atteignable au clavier.
- **R3** Survit à une navigation (monté dans le layout, pas dans la page).
- Migrer vers lui **seulement** les toasts de `ActionsLigneProspection.tsx` et
  `ProspectionDetail.tsx`. Les autres copies restent telles quelles (hors périmètre).

### 1b. Les messages

| Action (où) | Texte | Action du toast |
|---|---|---|
| Transformer en prospect — liste pré-prospections (`ActionsLigneProspection`) | « {nom} est maintenant un prospect. » | « Ouvrir le prospect → » `/prospects/{prospectId}` |
| idem, cas « rattacher à un prospect existant » (`lierProspectAPreProspection`) | « {nom} est rattaché au prospect existant. » | idem |
| Transformer en prospection — liste (`ActionsLigneProspection`) | « {nom} est maintenant une prospection ({code}). » | « Ouvrir la prospection → » `/prospections/{id}` |
| Archiver / désarchiver depuis une liste | texte actuel | « Ouvrir la fiche → » vers la route de la fiche |

`prospectId` après création : le lire dans la réponse de l'appel API (vérifier le type de retour
dans `src/lib/api.ts` / `types.ts`) ; s'il n'y est pas, refetch de la prospection par `id`. Ne pas
modifier l'API.

### 1c. Sur la fiche

- **R4** Après « Transformer » sur `/pre-prospections/:id` (`ProspectionDetail.tsx:707-716`) :
  `navigate('/prospections/:id', { replace: true })` puis le toast (sans action, on y est déjà).
  La page prend alors l'habillage prospection.
- **R5** À l'ouverture de `/pre-prospections/:id` d'une fiche dont `typeProspectionCode ===
  'ComProspection'` (et inversement `/prospections/:id` d'une `ComPreProspection`) : rediriger
  (`replace`) vers la bonne route. Tester le **code**, jamais le libellé. `null` ou autre code :
  ne rien faire.
- Après « Créer prospect » sur la fiche : toast avec « Ouvrir le prospect → ».

### 1d. Fiche prospect → ses prospections

`pages/prospects/ProspectDetail.tsx:292-324`, `ProspectionRow` (`:436-501`) ne fait que se
déplier. Ajouter dans chaque ligne un lien « Ouvrir → » vers `/prospections/{id}` (ou
`/pre-prospections/{id}` selon son code), sans casser le dépliage. Même chose pour `DossierRow`
(`:506`) → `/dossiers/{id}`.

## Partie 2 — Barre de parcours en haut de la fiche

Sur `FicheProspection` (`ProspectionDetail.tsx`, les deux routes), une bande compacte **au-dessus**
de l'en-tête, distincte du stepper d'étapes commerciales existant (`showStepper`, `:683-686`) —
ne pas les confondre ni fusionner :

```
 ✓ Pré-prospection ──► ✓ Prospect ──► ● Prospection ──► ○ Dossier
   12/09                 14/09 [voir]     aujourd'hui        —
```

| Étape | Faite si | Lien si faite | Date |
|---|---|---|---|
| Pré-prospection | l'historique contient « Pré-prospection créée » **ou** le code actuel est `ComPreProspection` | — (c'est la fiche elle-même) | date de cet événement |
| Prospect | `prospectId` renseigné | `/prospects/{prospectId}` | « Prospect créé et lié » / « Prospect existant rattaché » |
| Prospection | `typeProspectionCode === 'ComProspection'` | — | « Transformée en prospection » ou « Prospection créée » |
| Dossier | `p.activite.dossierId` renseigné | `/dossiers/{dossierId}` (libellé = `dossierCode`) | — |

- **R6** Étape courante (●) = la dernière faite. Les étapes faites portent ✓, les suivantes ○.
- **R7** (révisé) Seul ce CRM écrit l'historique (~35 événements en base réelle sur 14 041
  `ComProspection`) : l'absence d'événement ne prouve rien pour une fiche OMRAN. Donc :
  - événement « Prospection créée » présent (créée directement ici) → étape Pré-prospection
    **grisée « — »** ;
  - aucun événement d'origine (ni « Pré-prospection créée » ni « Prospection créée ») → origine
    inconnue : l'étape Pré-prospection **n'est pas affichée**, la barre commence à Prospect.
    Jamais barrée, jamais ✓ inventé.
- **R8** Dates : tirées de `listProspectionHistorique` (`api.ts:731`) en reconnaissant le
  **début** des descriptions écrites par `ProspectionService.enregistrerHistorique` :
  `"Pré-prospection créée : "`, `"Prospect créé et lié : "`, `"Prospect existant rattaché : "`,
  `"Transformée en prospection : "`, `"Prospection créée : "`. Événement introuvable → étape
  quand même déterminée par les champs, simplement **sans date**. Format de date : celui du
  reste de l'app (voir `crm-prototype/CLAUDE.md`, règles de formatage).
- **R9** `typeProspectionCode` `null` ou `RntProspection` : ne pas afficher la barre.
- **R10** Pas de requête en plus si l'historique est déjà chargé par la page (« Parcours »,
  `:1399-1423`) : réutiliser la même donnée.
- Libellés français, accessibilité : liste ordonnée (`<ol>`), étape courante `aria-current="step"`.
- Responsive : sur écran étroit, la bande reste sur une ligne avec défilement horizontal, ou
  passe en libellés courts ; pas de débordement de page.

## Hors périmètre

- Backend, OpenAPI, `types.ts` (sauf si un type manque pour lire une réponse **existante**).
- Partie 3 (« Actions récentes ») : feature suivante, pas maintenant.
- Les autres copies de toast (dossiers, virements, SyncButton).
- Le stepper d'étapes commerciales existant.

## Vérification

- `npm run build` vert (seule porte du front).
- Contre le backend local (`yesRemsTest`, `:8080`) : parcours réel pré-prospection → prospect →
  prospection depuis la liste **et** depuis la fiche ; vérifier R1, R4, R5, 1d, et la barre à
  chaque étape (dont une prospection créée directement, R7). Lister dans le rapport chaque cas
  vérifié et son résultat ; une capture de la barre si le navigateur est disponible (optionnelle).
