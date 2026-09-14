# Session Memory
_Last updated: 2026-09-14T10:00:00Z_
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
- **Première forme livrée : deux vues séparées** (une liste de groupes, puis
  la liste restreinte au groupe ouvert, avec un fil d'Ariane). Portes vertes,
  16 contrôles API verts, poussée — puis **rejetée par l'utilisateur**, capture
  d'Omran à l'appui : il veut un **dépliant**, les groupes intercalés dans la
  grille, ouvrables **plusieurs à la fois**. La leçon n'est pas technique :
  « replier une liste » avait deux lectures possibles et j'ai choisi la mienne
  sans demander, alors qu'une capture existait.
- **Première tentative de câblage : bande en prop `bande?: ReactNode` sur
  `DataGrid`.** Abandonnée : la bande disparaissait avec le tableau dans les
  états vides. Remplacée par une bande rendue au niveau de l'écran +
  `bandeauRegroupement={false}` sur l'adaptateur.
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
| 142 | **`--muted-foreground` sur une ligne teintée `--warning-bg` = 4,34:1 en sombre** (AA exige 4,5) — trouvé en *étendant* `check-contrast`, qui ne couvrait pas le cas | Fixed | Token dédié `--retard-bg` à 0,07 → 4,77 / 4,81. Sept paires ajoutées au garde |
| 147 | `git-flow sync` refuse : « local main has diverged » | Fixed | L'utilisateur avait commité le snapshot de spec **directement sur main** (`10c54b3 update docs`), pendant que ma branche portait le même. Contenu vérifié **identique octet pour octet** à `origin/main` → `reset --hard origin/main`, rien perdu |
| 145 | **`inclureSansValeur` : le serveur cesse de servir le groupe des lignes vides, par defaut** — grouper les dossiers par avocat n'affichait plus que 23 lignes sur 116, en silence | Fixed | `inclureSansValeur: true` toujours envoye ; invariant somme = totalElements restaure et reverifie |
| 146 | `ARTICLE` / `DELAIS` inconnus de `LIBELLES_GROUPE` ; `articleId` / `responsableVenteId` cochables et afficheraient des UUID | Fixed | Libellés ajoutés, les deux `*Id` dans `masquees` (bug #126 qui revient) |
| 154 | **Trois champs fantômes sur `DossierDetailDto`** (`titreFoncier`, `presentation*`) → deux lignes de la fiche affichaient un tiret en permanence, la donnée étant sur l'article dans la même réponse | Fixed | Retirés du dossier, ajoutés à `ArticleSummaryDto`, les deux lignes lisent `premierArticle` |
| 155 | `FEATURES.md` annonce 17 endpoints « sans appelant » — **16 le sont à tort** | Open (outil) | Défaut de correspondance sur les chemins à paramètres dans le détecteur |
| 156 | Le spec publie `CreerReglementRequest.dateReglement` **alors que le serveur la refuse en 400** | Open (backend) | Non ajoutée ; la contradiction contrat/comportement est consignée |
| 152 | `GroupeDto.agregats` typé `Record<string, number>` alors qu'un `MIN`/`MAX` sur colonne DATE rend une **chaîne ISO** et qu'un `MIN` vide rend `null` | Fixed | `ValeurAgregat = number \| string \| null` ; le compilateur a immédiatement pointé les deux sites de `DataGrid` qui formataient en devise |
| 153 | Une moyenne de `remise` se serait affichée « 0,07 » au lieu de « 7,31 % » | Fixed | `ColonneGrille.formatValeur`, posé sur les deux colonnes de ratio dans `DossierTable` |
| 150 | Groupement Encaissements par `compteCode` : le defaut `inclureSansValeur=false` n'aurait affiche **4 lignes sur 332** | Fixed | `useGroupement` envoie toujours `true` — rien a faire dans l'ecran, la machinerie le portait deja |
| 151 | **Sept des 27 colonnes `parDefaut` des encaissements sont des cles UUID** | Fixed | `DISPOSITION_ENCAISSEMENTS.masquees` (9 entrees) ; 19 colonnes visibles, verifie sans UUID servi |
| 149 | Liste Encaissements : **6 435 400 DH d'encaissements non affectés absents**, que l'écran légataire affiche — un opérateur qui compare les totaux conclurait à un bug | Workaround | Mention sous le compteur ; servir ces pièces est une décision produit backend en attente |
| 148 | **Le seuil de 30 j est annulé — toute relance échue repasse en rouge** (demande utilisateur, confirmée par la mesure #144) | Fixed | `relanceTardive` → `relanceEnRetard`, seuil supprimé. Page 1 : 17/20 en rouge. **Piste réglée, ne pas la rouvrir sans remesurer par page** |
| 144 | Seuil de 30 j sur le fond rouge : mesure **apres** livraison, la liste etant triee par date d'alerte decroissante, **la page 1 passe de 17/20 a 0/20 rouge** — le repere se deplace aux pages 6+ | Open (constat) | Livre comme choisi ; relev̀e par page dans `docs/filtres-avances.md` pour arbitrer |
| 143 | `PreProspectionsList` affirme en commentaire que `/api/pre-prospections` n'accepte pas `?colonnes=` — **mesuré, il l'accepte et l'honore** | Open (constat) | Non touché ; l'écran ne s'en sert pas. Commentaire à corriger, optimisation à prendre |
| 141 | **L'ordre des lignes n'est pas déterministe côté serveur** — sur `docDate` seule, le lot de 20 n'était pas le préfixe du lot de 40, par intermittence | Fixed | `sort=docDate,desc` **+** `sort=id,asc` sur les lots de groupe ; vérifié 15/15. **Le même aléa vaut pour la pagination ordinaire** — non touché, consigné |

---

## 🔑 Key Points to Remember

### Le groupement — l'architecture en une phrase
- **Le serveur groupe, le front choisit.** `lib/groupement.ts` ne calcule rien :
  il porte le choix de l'utilisateur et le traduit en paramètres. Grouper côté
  front ne grouperait que la page chargée.
- **C'est un dépliant, pas deux écrans.** Les en-têtes de groupe
  s'intercalent dans le corps de `DataGrid` (`groupes?: GroupementGrille<T>`),
  et **plusieurs groupes restent ouverts en même temps**. C'est la forme
  demandée, capture d'Omran à l'appui ; une bascule entre deux vues a été
  livrée d'abord et rejetée.
- **Chaque groupe pagine ses propres lignes**, par lots de 20
  (`TAILLE_LOT_GROUPE`), avec une ligne de pied qui annonce le reste. Un groupe
  n'est pas borné : 7 612 prospections dans « 1 A TRAITER ».
- **« Charger plus » redemande la page 0 avec une taille plus grande**, jamais
  une concaténation de pages. Cela **exige un tri qui tranche** — voir #141.
- La pagination du bas numérote **les groupes** quand la liste est repliée.
- **La bande est rendue par l'écran**, hors du test « y a-t-il des lignes » —
  sinon un écran vide n'a plus de sortie. L'adaptateur reçoit
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
- `src/components/RechercheMenu.tsx` — **nouveau**. La barre de recherche
  collante des menus déroulants, extraite de `ColumnSelector` quand la bande de
  groupement en a eu besoin. **Ce qui justifie l'extraction, c'est l'effet
  clavier**, pas le balisage : Base UI vole chaque frappe via sa recherche
  par lettre, et le correctif doit être un écouteur **natif posé sur le champ**
  — un `onKeyDown` React s'exécute trop tard, React déléguant à la racine.
  Vérifié au grep du bundle : le jeu de touches n'existe qu'en un exemplaire.
- `src/components/BandeGroupement.tsx` — **nouveau**. La bande réelle : menu de
  colonnes par sections, granularité (DATE seulement), ordre, Σ, dégrouper.
  Prop `bloque` pour la raison d'indisponibilité.
- `src/components/DataGrid.tsx` — porte le dépliant : `GroupementGrille<T>`,
  en-têtes de groupe en `colSpan`, `rendreLigne` extrait pour que la ligne se
  rende à l'identique à plat ou sous un groupe, `appliquer` pour filtrer/trier
  **à l'intérieur** de chaque groupe.
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
- **`main` à `6783069`** — PR #37, #38 et #39 **toutes fusionnées**. Arbre
  propre, quatre portes vertes sur `main` après fusion.
- **Onze branches locales fusionnées traînent** (`feat/activite-prospection`
  … `fix/spec-groupes-et-colonnes`) ; `sync` ne les supprime pas. Ménage à
  faire, mais c'est la décision de l'utilisateur.
- `FEATURES.md` : `spec-groupes-et-colonnes` enregistré via `add` juste avant
  la synchro ; `relances-en-retard` **ajouté à la main**, `add` lisant
  `main..HEAD` qui était déjà vide une fois la branche fusionnée.
  **Enregistrer au feature-index avant de pousser**, jamais après.
- `SESSION_MEMORY.md` est modifié dans l'arbre sur `main` : il partira avec le
  prochain lot, comme d'habitude (stash → `start` → pop).

---

## ⏭️ Next Step

> **Vérifier le dépliant et le fond rouge au navigateur** — rien n'a été vu à l'écran. Chemin :
> `/dossiers` → bande → « Regrouper par » → **Statut**, cocher un ou deux
> totaux, puis **ouvrir deux groupes en même temps** (c'est le point que la
> première livraison ratait). Ouvrir « CONCRETISATION » (68 lignes) pour voir
> la ligne « 48 de plus — en charger 20 ». Puis grouper par **Date du
> document** : un groupe ouvert qui rend 0 ligne signifierait que la
> granularité ne circule pas.

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
