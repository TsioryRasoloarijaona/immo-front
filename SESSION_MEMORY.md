# Session Memory
_Last updated: 2026-09-11T12:00:00Z_
_Project: crm-prototype (Arpent — CRM immobilier), C:\Users\tsiory\Documents\ayad-internship\prototype\crm-prototype_

---

## 🎯 Current Objective

Aligner les écrans sur le **logiciel de bureau Omran**, capture par capture, au
fil des livraisons de la spec V4. Quatre lots fusionnés (PR #33 → #36 :
sélecteur de colonnes serveur, puis les trois fiches). **Lot en cours :
`feat/groupement-listes`** — la bande de groupement de la grille légataire,
enfin réelle, sur les trois listes dont le serveur sait grouper.

---

## ✅ What Worked

1. **Lire le catalogue vivant plutôt que la spec.** Encore une fois le seul
   moyen d'obtenir des faits : la spec dit que `ColonneDto.groupe` a 6 valeurs,
   le runtime en sert 8 côté prospections (`CLOTURE` et `AUDIT` en plus) ; elle
   laisse croire que les prospects ont un groupement, le catalogue renvoie
   **0 groupable sur 47 colonnes** et l'endpoint n'existe pas.
2. **Écrire une sonde qui vérifie l'invariant affiché, pas l'endpoint.**
   `sonde-invariant.mjs` (scratchpad) rejoue les requêtes du front sur
   6 combinaisons de filtres et contrôle que **somme(effectifs) ==
   `totalElements` de la liste**, que chaque groupe se déplie sur son effectif
   exact, et le cas des dates. **16/16.** C'est la seule preuve disponible sans
   navigateur, et elle vaut plus qu'une relecture.
3. **Re-mesurer avant de crier au loup.** `/groupes` à 4 975 ms au premier
   appel → **48–114 ms** (dossiers) en régime établi. Démarrage à froid, comme
   la session précédente. Aucune alerte backend envoyée.
4. **Sonder les valeurs, pas les types.** C'est ce qui a trouvé le bug `remise`
   (voir #136) et disqualifié deux agrégats que le serveur accepte pourtant.
5. **Le grep du JS/CSS compilé.** A confirmé les 3 endpoints, les 3
   `bandeauRegroupement:!1`, et toutes les classes Tailwind neuves.
6. **Scripts Python dans le scratchpad** (`splice_*.py`) — les heredocs ont
   cassé **deux fois** sur les apostrophes/backticks des gros blocs JSX.

---

## ❌ What Failed / Course-corrections

- **Le navigateur reste inatteignable — 5ᵉ session.** Rien de ce lot n'a été vu
  à l'écran. La vérification visuelle est à faire par l'utilisateur.
- **Première architecture : passer la bande en prop `bande?: ReactNode` à
  `DataGrid`.** Abandonnée en cours de route : la bande disparaissait avec le
  tableau dans les états vides, donc un groupe sans ligne devenait un **écran
  sans issue** (plus de « Tous les groupes »). Remplacée par une bande rendue
  au niveau de l'écran + `bandeauRegroupement={false}` sur l'adaptateur.
- **`loading && !data` comme garde de chargement.** En mode groupes `data`
  reste nul par construction → un `LoadingState` plein écran se serait rallumé
  **par-dessus** des groupes déjà affichés à chaque changement de granularité.
  Corrigé en `loading && !pageAffichee` sur les trois écrans.
- **Grep sur les classes Tailwind avec un point.** Tailwind échappe (`.px-1\.5`) ;
  mon motif rendait 0 sur des classes qui marchent depuis des semaines.
  Faux négatif, pas un bug. Utiliser `grep -oF`.
- **`interface` pour extraire `DossierFilterParams`.** Aurait cassé
  `withPageable`, qui attend un `Record` : seul un **alias de type** reçoit la
  signature d'index implicite. Écrit en alias d'emblée.

---

## 🐛 Bugs & Errors Log

| # | Error / Bug | Status | Fix applied |
|---|-------------|--------|-------------|
| 90-132 | Sessions antérieures | Fixed | PR #12 → #36 |
| 101 | 9 erreurs eslint préexistantes | Open | **La référence est 9** — inchangée |
| 133 | `ModifierProspectionRequest` sans `temp*`/`commercialId` | **Open (backend)** | Champs en lecture seule ; demande consignée |
| 134 | 8 des 12 onglets dossier sans endpoint | **Open (backend)** | Non affichés ; demande consignée |
| 135 | Règle « `netAPayer.reste` = 0 sur dossier sorti » non vérifiée | Open (constat) | — |
| 136 | **`remise` affichait « 0 » sur toute la colonne Dossiers** — ratio 0–1 typé `NOMBRE`, et le commentaire du code affirmait l'inverse | Fixed | Rendu `formatPercent(d.remise, 2)` ; mesuré -0,207865 à 0,988329 |
| 137 | Granularité perdue au dépliage → `totalElements: 0` en **HTTP 200**, écran vide sans erreur | Fixed | Une seule granularité dérivée dans `lib/groupement.ts`, envoyée des deux côtés |
| 138 | `remise` / `probabiliteFinalisation` sommables côté serveur alors que ce sont des **taux** | Fixed | `AGREGATS_SANS_SENS` les retire du Σ |
| 139 | Filtre statut dossiers **interdit le groupement** (le contournement filtre après le serveur) | Workaround | Bande désactivée avec message ; **fait monter la demande backend statut en priorité** |
| 140 | `CLOTURE` servi par le catalogue prospections mais absent de `GroupeColonne` et de `LIBELLES_GROUPE` | Fixed | Ajouté à l'union (le libellé retombait déjà sur la clé brute) |

---

## 🔑 Key Points to Remember

### Le groupement — l'architecture en une phrase
- **Le serveur groupe, le front choisit.** `lib/groupement.ts` ne calcule rien :
  il porte le choix de l'utilisateur et le traduit en paramètres. Grouper côté
  front ne grouperait que la page chargée.
- **Deux vues, jamais les deux à la fois** : la liste repliée en groupes
  (`TableauGroupes`), ou des lignes — toutes, ou celles d'un groupe ouvert.
  **Une seule pagination**, qui numérote ce qui est à l'écran. Deux paginations
  imbriquées ne diraient plus ce qu'elles comptent.
- **La bande et le fil d'Ariane sont rendus par l'écran**, hors du test « y
  a-t-il des lignes » — sinon un groupe vide est sans issue. L'adaptateur reçoit
  `bandeauRegroupement={false}`.
- **`groupable`/`agregeable` se lisent, ne se déduisent jamais.** Mesuré :
  `joursInactivite`, `nbInteractions`, `nbVisites` sont des `NOMBRE` **non**
  agrégeables (vue légataire). `prix` est agrégeable mais **non** groupable.

### Les chiffres mesurés (11/09)

| Écran | colonnes | groupables | agrégeables | `/groupes` |
|---|---|---|---|---|
| Prospections | 56 | 21 | 2 | 235–664 ms |
| Dossiers | 40 | 22 | 8 | 48–114 ms |
| Pré-prospections | (même catalogue) | idem | idem | ~240 ms |
| **Prospects** | 47 | **0** | **0** | **n'existe pas** |

- Somme des effectifs == `totalElements` : vérifié sur 6 combinaisons de
  filtres. 116 dossiers, 9 654 prospections, 2 201 pré-prospections.
- Le **groupe `null` est légitime** et doit rester affiché, sinon l'égalité
  ci-dessus tombe. 93 dossiers sans avocat, 7 prospections sans étape. Il se
  déplie en envoyant `groupeColonne` **sans** `groupeValeur`.
- Les agrégats arrivent **bruités en flottant** (`17440269.999994`) ;
  `formatCurrency`/`formatNumber` l'absorbent via `toFixed`.

### Le piège à ne pas réapprendre
- **`granularite` doit accompagner la clé au dépliage.** `groupeValeur=2024`
  sans `granularite=ANNEE` rend `totalElements: 0` en **HTTP 200**. Une seule
  granularité circule, dérivée dans `useGroupement`.
- **Le filtre statut des dossiers et le groupement sont incompatibles.**
  `?statut=` veut le code brut (`CONCRETISATION` → 68, `Concrétisation` → **0
  en 200**) et aucune normalisation ne rattrape l'écart (« Remise des clés » →
  `REMISE DES CLEFS`, « Annulé » → `ANNULATION`). Le contournement des 500
  lignes filtre *après* le serveur ; `/groupes` ne renvoie pas de lignes à
  refiltrer. D'où la bande désactivée, avec le message qui dit pourquoi.

### Rappels des lots précédents (toujours valables)
- `FicheShell` sert les trois fiches ; ordre **identité → formulaire → onglets**,
  l'inverse a été essayé et rejeté. `panneau` n'est utilisé que par le dossier.
- **Dossier : `/api/dossiers/{id}` est GET-only** — pas de barre
  d'enregistrement sur cette fiche, et c'est normal.
- `DataGrid` en **`table-auto`** ; `largeur` est un **plafond** (20 px/unité,
  plancher 120 px). Tout conteneur de table veut `min-w-0` + `overflow-auto`.
- `?colonnes=` : ne rien envoyer tant que la sélection == défauts (évite une
  2ᵉ requête quand le catalogue atterrit). Propriété portante.
- **`quotePart` et `probabiliteFinalisation` sont des fractions** ;
  `PayeurDto.quotePart` est un pourcentage 0–100. Même nom, deux échelles.
- `activite` est nul sur **toute** pré-prospection (14/14). Jamais afficher
  « 0 interaction ».
- `marqueurTri: null` ≠ « pas de note » ; `doublonDeCode` peut exister sans
  `doublonDeId`.

### Vérification
- Portes : `npx tsc -b --force`, `npx eslint src --ignore-pattern
  'src/harness-densite.tsx'` → **doit rester à 9**, `npm run build`.
- **Les portes ne rendent rien.** Les deux contrôles utiles : le grep du JS/CSS
  compilé (`grep -oF` pour les classes échappées, Tailwind scanne **aussi les
  commentaires**), et une **sonde qui rejoue les requêtes du front et vérifie
  l'invariant affiché**.

---

## 📁 Important Files & Paths

- `src/lib/groupement.ts` — **nouveau**. `useGroupement`, `AGREGATS_SANS_SENS`,
  `GROUPEMENTS_SANS_INTERET`, dérivation de `paramsGroupes`/`depliage`.
- `src/components/BandeGroupement.tsx` — **nouveau**. La bande réelle : menu de
  colonnes par sections, granularité (DATE seulement), ordre, Σ, dégrouper.
  Prop `bloque` pour la raison d'indisponibilité.
- `src/components/TableauGroupes.tsx` — **nouveau**. Les groupes repliés + une
  colonne par agrégat + `BandeauGroupeOuvert` (le fil d'Ariane).
- `src/lib/api.ts` — `listDossiersGroupes` / `listProspectionsGroupes` /
  `listPreProspectionsGroupes`, `ParamsGroupes`, `ParamsDepliage`,
  `DossierFilterParams` (alias, pas interface).
- `src/components/DossierTable.tsx` — correctif `remise` (#136).
- `src/components/FicheShell.tsx`, `ChampsFiche.tsx`, `lib/formulaireFiche.ts`,
  `lib/dispositions.ts` — lots précédents, inchangés.
- `docs/filtres-avances.md` — section « Groupement des listes (11/09) », et la
  demande statut requalifiée en bloquante.
- Scratchpad : `sonde-groupes.mjs`, `sonde-groupes2.mjs`, `sonde-ratios.mjs`,
  `sonde-statut.mjs`, **`sonde-invariant.mjs`**, `splice_*.py`.

---

## 🔧 Environment & Config

- Windows 11, PowerShell + Git Bash. Fichiers **CRLF** — normaliser en mémoire
  avant tout splice Python.
- Vite `:5173`, backend Spring `:8080`, tous deux lancés par l'utilisateur.
- **Identifiants du compte de test** retrouvés dans une sonde de la session
  précédente (`scratchpad/.../sonde-fiche.mjs`). **Non consignés ici.**
  ⚠️ Ils ont transité en clair dans deux transcriptions ; à changer si le
  compte n'est pas jetable.
- **Aucun navigateur atteignable** depuis la session (5ᵉ fois).
- Branche **`feat/groupement-listes`**, cuttée depuis `main` à `747aaf7`.

---

## ⏭️ Next Step

> **Vérifier le groupement au navigateur** — rien n'a été vu à l'écran. Chemin
> le plus rapide : `/dossiers` → bande → « Regrouper par » → **Statut**, puis
> cocher un ou deux totaux, ouvrir un groupe, revenir. Puis grouper par **Date
> du document** pour éprouver la granularité (c'est là qu'un bug se verrait :
> un groupe ouvert qui rend 0 ligne signifierait que la granularité ne circule
> pas). Enfin `/prospections` avec le volet avancé ouvert, pour confirmer que
> les effectifs suivent les filtres.

### Backlog (par priorité)

- [ ] **Demande backend statut — désormais bloquante** : elle n'empêche plus
      seulement de filtrer efficacement, elle **interdit le groupement** sur
      Dossiers. Consignée dans `docs/filtres-avances.md`.
- [ ] Autres demandes backend consignées : champs `temp*` de la prospection,
      les 8 onglets dossier sans endpoint.
- [ ] **Pas de `/api/prospects/groupes`** : l'écran Clients n'a pas de bande.
      Le catalogue le dit honnêtement (0 groupable) mais sa **description**
      annonce le contraire — à signaler, sans conséquence fonctionnelle.
- [ ] Une **moyenne** serait l'agrégat juste pour `remise` /
      `probabiliteFinalisation` ; l'endpoint ne sert que des sommes.
- [ ] Vérifier la règle du dossier sorti (`netAPayer.reste = 0`) sur un
      `ANNULATION` — il y en a **15** en base, donc c'est enfin testable.
- [ ] `titreFoncier` / `presentationCode` mesurés 0/10 contre 69,6 % et 23,2 %
      annoncés — à revérifier sur un échantillon plus large.
- [ ] Supprimer `harness-densite.tsx` (non suivi, toujours dans l'arbre ; ses
      fixtures ont dû être complétées de `groupable`/`agregeable`).
- [ ] 9 erreurs eslint préexistantes (#101).
