# Session Memory
_Last updated: 2026-09-24T01:30 (session « Dashboard : couloirs Pipeline vides + 2 par ligne »)_
_Project: crm-prototype (Arpent — CRM immobilier), C:\Users\tsiory\Documents\ayad-internship\prototype\crm-prototype_

---

## 🎯 Current Objective

**Petites features front à la demande, une PR par lot**, dans la boucle
habituelle : demande → diff spec (structurel, contre HEAD) → AskUserQuestion
avant la branche → implémenter → build+lint → commit+push → l'utilisateur
fusionne → sync. Deux lots le 23/09, **tous deux fusionnés** :
`feat/creation-pre-prospection` (PR #73 côté front) puis `feat/suivi-actions`
(5 itérations sur la même PR). `main` = `c37a7ff`.

**Lot du 24/09 : `fix/dashboard-pipeline`** (front seul, un fichier :
`src/pages/Dashboard.tsx`) — commité (`5561b17` amendé) et poussé, **PR
ouverte, en attente de la fusion par l'utilisateur**, puis `sync` :
https://github.com/TsioryRasoloarijaona/immo-front/compare/main...fix%2Fdashboard-pipeline?expand=1

---

## ✅ What Worked

1. **Diff structurel du spec, pas `git diff` brut** — script node dans le
   scratchpad : `git show HEAD:docs/api-docsV4.json` vs fichier de travail,
   ops ajoutées/retirées/modifiées, schémas idem, puis diff champ par champ
   des « modifiées ». Sépare en 30 s le vrai changement du bruit
   (`findAll_N`, LF/CRLF, descriptions).
2. **Quand le diff structurel est vide, lire `git log` d'`immo-crm`** et le
   diff de la FEATURE : la règle §3bis (suivi réservé à l'admin) n'a touché
   que le comportement, pas l'OpenAPI. Un « check the spec » peut donc
   arriver sans changement d'OpenAPI.
3. **Lire la FEATURE backend avant de concevoir** (`immo-crm/instructions/
   FEATURE-*.md`, section « Impact front ») : elle décrit le parcours voulu.
4. **Réutiliser la mécanique des listes à catalogue** (patron
   `EncaissementsList` + `EncaissementTable`) : `useColonnes*`,
   `useColonnesVisibles`, `useGroupement`, `useLignesGroupes`, `DataGrid`
   via un adaptateur de 15 lignes. Un écran entier en une passe.
5. **`postMultipart` existait déjà** (champ `fichier`, query string, pas de
   Content-Type manuel) — l'import CSV = deux one-liners dans `api.ts`.
6. **`git-flow start` avec l'arbre sale** : `git stash push -- <fichiers>` →
   `start` → `stash pop` → premier commit = le snapshot du spec.
7. **Itérer sur la même PR** : commit + `feature-index add` + `push` à chaque
   retour utilisateur, la PR suit.
8. **(24/09) Un couloir vide à côté d'un KPI non nul = requête en échec, pas
   donnée absente.** Diagnostic en 5 min : comparer le `sort` des appels qui
   marchent (`docDate`, `code`) à ceux qui échouent (`dateDocument`), puis
   lire l'entité JPA (`ComProspection.docDate`) et `GlobalExceptionHandler`
   (`PropertyReferenceException` → 400). Lecture seule du back, aucune
   requête authentifiée nécessaire.
9. **Plan mode + AskUserQuestion avec `preview` ASCII** pour un choix de
   disposition : l'utilisateur tranche en un clic entre deux maquettes.
10. **`git-flow start` avec `SESSION_MEMORY.md` sale** : `git stash push --
    SESSION_MEMORY.md` → `start` → `stash pop`, puis le fichier part dans le
    commit de la branche (plus besoin d'`allow-main-edits`).

---

## ❌ What Failed

- **`/tmp` sous Git Bash → `C:\tmp` pour node** : ENOENT. Toujours le
  scratchpad de session.
- **`git-flow start` avec fichiers non commis** refuse, et `commit` refuse
  `main` : contournement stash → start → pop.
- **`interface` de filtres passée à `withPageable`** → TS2345 (pas d'index
  signature implicite). Déclarer les `*FilterParams` en `type`.
- **`(dto as Record<string, unknown>)`** → TS2352 ; passer par `as unknown as`.
- **`useMemo` dépendant d'un `rows = data?.content ?? []`** → warning
  exhaustive-deps ; dépendre de `data` et dériver dedans.
- **`git-flow commit` n'ajoute pas le trailer `Co-Authored-By`** → amender le
  message (`git commit --amend -m` avec `printf`) **avant** le `push`.
- **`sort=dateDocument,desc` sur `/api/prospections`** → 400 « Propriété de
  tri invalide » : le tri se résout sur l'entité, pas sur le DTO.

---

## 🐛 Bugs & Errors Log

| # | Error / Bug | Status | Fix applied |
|---|-------------|--------|-------------|
| 101 | Erreurs eslint préexistantes — référence **10** | Open | — |
| 155 | `FEATURES.md` invente des endpoints « sans appelant » (21 affichés) | Open (outil) | — |
| 156 | `CreerReglementRequest.dateReglement` publiée mais refusée en 400 | Open (backend) | — |
| 164 | Couloir « Dossier de vente » compte les actifs, liste tout | Open | — |
| 167 | `derniereAlerteDate` ni filtrable ni triable | Open (backend) | — |
| 168 | Filtre par colonne client-side ment (chèque → 0/180) | Open (backend) | — |
| 180 | **Pas d'endpoint « désarchiver »** (vérifié 23/09, toujours absent) | Open (backend) | Item grisé « Bientôt » |
| 181 | Mode groupé : lignes d'un groupe déplié non rafraîchies après mutation | Open (limite documentée) | — |
| 182 | Import CSV : le tableau rend jusqu'à 5 000 lignes d'un bloc | Open (à surveiller) | Filtre par statut ; virtualiser si lent |
| 183 | Suivi des actions : pas de référentiel `ComActionMessageCategory` → pas de filtre Catégorie | Open (backend) | Filtre de colonne client-side de la grille |
| 184 | `ActionDetailDialog` ne montre que les colonnes demandées à la liste (pas d'endpoint de détail par action) | Open (limite documentée) | — |
| 185 | Dashboard : couloirs Pré-prospection / À traiter / Prospections vides depuis le 20/09 — `sort=dateDocument,desc` (champ DTO) → 400 « Propriété de tri invalide », avalé car seul `data` était lu | Fixed (24/09) | `sort: ['docDate,desc','id,asc']` (propriété d'entité) ; `KanbanColumn` reçoit `error` et l'affiche en rouge avec compte `—` |

---

## 🔑 Key Points to Remember

### Lot 1 du 23/09 — `feat/creation-pre-prospection` (fusionné)
- `POST /api/pre-prospections` (réponse **enveloppée** `{ preProspection,
  doublons }`, doublons signalés jamais refusés), `POST …/import/apercu` et
  `POST …/import?trancheId=…` (multipart `fichier`, même fichier aux deux).
- Boîte `NouvellePreProspectionDialog` via route `/pre-prospections/nouveau`
  (prop `nouveau`, `lazy()`) ; sans doublon → fiche ; avec → panneau ambre.
  **Téléphone = un seul champ texte** (`TempTel`), pas `TelephoneField`.
- Page `/pre-prospections/import` en 3 étapes (`fichier → apercu →
  resultat`), tranche pré-sélectionnée sur `trancheSuggereeId`, tons
  NOUVELLE→success ✓, DOUBLON→amber ⚠, DEJA_IMPORTEE→neutral, ERREUR→warning ✗.
- Routes statiques déclarées **avant** `/pre-prospections/:id`.

### Lot 2 du 23/09 — `feat/suivi-actions` (fusionné, 5 itérations)
- **Spec** : `GET /api/suivi-actions` (`?colonnes=`, `dateDebut/dateFin`
  **fin exclue**, `trancheId[]`, `utilisateur[]`, `typeId[]`, `categorieId[]`,
  `systeme`), `GET …/groupes` (`groupBy` requis, **rien d'agrégeable**),
  catalogue `GET /api/referentiels/colonnes/suivi-actions`.
- Page `/suivi-actions` (`pages/actions/SuiviActionsList.tsx`) +
  `SuiviActionTable` + `DISPOSITION_SUIVI_ACTIONS` + `useColonnesSuiviActions`.
  `GroupeColonne`/`LIBELLES_GROUPE` étendus : ACTION, RATTACHEMENT, IDENTIFIANTS.
- **`?colonnes=` part toujours** ici : `CLES_OUVERTURE_SUIVI_ACTION`
  (`prospectionId`, `dossierId`) sont hors défaut serveur et la boîte de
  détail en a besoin. Une requête de plus à la première peinture.
- **Période par défaut = mois courant** + raccourcis « Aujourd'hui » /
  « Ce mois » ; « Au » inclusif à l'écran → `lendemain(au)T00:00:00`.
- **Clic sur une ligne = `ActionDetailDialog`** (champs de la ligne groupés
  par groupe du catalogue, note complète, boutons Ouvrir la prospection / le
  dossier), **jamais de navigation** — décision utilisateur.
- **Sidebar** : section **Suivi** dans le module Vente (hors commercial) =
  Performances commerciales (admin) + Suivi des actions ; pour le
  commercial, l'entrée est dans **Profil** sous « Mes performances ».
  `/performances` a quitté Administration pour Vente dans `modules.ts`.
- **Règle §3bis** : suivi général réservé à `Administrateur` ; les autres
  rôles ne reçoivent que leurs actions (page vide, pas 403) → sélecteur
  Utilisateur masqué et requête sautée, page/sidebar titrées « Mes actions ».
- **KPI §7** (`PerformanceCommercialDto`) : `actionsParType[]`,
  `tauxActionVersRdv`, `utilisateurId`, `commercialId` nullable,
  `interactionsTotal` **hors « Système »** → cartes « Actions » / « Actions
  par type », ratio action → RDV, clé de ligne `commercialId ??
  utilisateurId`, mention « (compte) ». `/kpi/commerciaux/moi` ne renvoie
  plus 404 sans employé (repli conservé, documenté mort).
- Filtre Utilisateur alimenté par `/groupes?groupBy=utilisateur` hors
  période (valeurs réelles + effectif), comme la spec le prescrit.

### Lot du 24/09 — `fix/dashboard-pipeline` (PR ouverte)
- **Tri = propriété d'entité, jamais le champ DTO** : `docDate` (entité
  `ComProspection`) ≠ `dateDocument` (DTO). Un mauvais nom → 400 ProblemDetail
  « Propriété de tri invalide: '…' » (`GlobalExceptionHandler`). Les listes et
  `docs/filtres-avances.md` utilisent `docDate,desc` + `id,asc`.
- **Toujours destructurer `error` de `useApi`** sur les couloirs/cartes, sinon
  un 400 se déguise en état vide (#185 a duré 4 jours).
- **Disposition Pipeline : 2 couloirs par ligne** (`grid-cols-1 sm:grid-cols-2`),
  Dossier de vente en `sm:col-span-2`, `LIGNES_COULOIR = 5` lignes par couloir,
  carte en `shrink-0` → la colonne racine défile. Le « viewport unique » du
  20/09 est abandonné pour cette carte — décision utilisateur (AskUserQuestion,
  option « 3 puis 2 » refusée).
- `dossiersPage` reste à `size: 7` : « Dossiers récents » rend toute la page.

### La boucle git (rappel opérationnel)
- `node .claude/scripts/git-flow.mjs` depuis `prototype/` ; toujours
  AskUserQuestion avant `start` ; commits sans `"` ni accents ;
  `feature-index add` APRÈS commit, AVANT push ; `sync` après la fusion.
- Arbre sale sur `main` (spec rafraîchi) : stash ciblé → `start` → pop.
- Écrire sur `main` (ce fichier) : `prototype/.claude/allow-main-edits`,
  écrire, **le supprimer aussitôt**. Sur une branche : pas besoin.

### Pièges
- Le shell ne touche JAMAIS un fichier source (encodage) ; scratchpad, pas
  `/tmp` ; captures ÷1,25 ; vérifier `git branch --show-current` avant le
  premier édit de chaque lot.
- Un spec « modifié » peut n'être que du bruit LF/CRLF — diff structurel.
- `useApi` : rendre sur `!error && data` ; `refetch` garde les données.
- Le backend qui tourne sur `:8080` peut être en retard sur `immo-crm` HEAD
  (règle §3bis non active tant qu'il n'est pas redémarré).

### Vérification
- Portes : `npm run build` (tsc+vite) ✓ · eslint = **10** ✓ (23/09 soir).
  Pas de navigateur depuis la session — validation visuelle par
  l'utilisateur (faite : les deux PR sont fusionnées).

---

## 📁 Important Files & Paths

- `src/pages/Dashboard.tsx` — **24/09** : `TRI_PROSPECTIONS`, `LIGNES_COULOIR`,
  `KanbanColumn` (`error`, `className`), grille Pipeline 2 par ligne.
- `src/pages/actions/SuiviActionsList.tsx` — **nouveau** : page du suivi
  (filtres, groupement, boîte de détail, règle admin).
- `src/components/SuiviActionTable.tsx` — **nouveau** : adaptateur DataGrid.
- `src/components/ActionDetailDialog.tsx` — **nouveau** : détail d'une action.
- `src/pages/prospections/NewPreProspection.tsx` — **nouveau** : boîte de
  création avec panneau doublons.
- `src/pages/prospections/ImportPreProspections.tsx` — **nouveau** : import CSV.
- `src/pages/kpi/PerformancesCommerciaux.tsx`, `MesPerformances.tsx` —
  actions par type, ratio action → RDV, comptes sans employé.
- `src/components/Layout.tsx` — section Suivi, entrée Profil « Mes actions ».
- `src/lib/modules.ts` — `/suivi-actions` et `/performances` → `vente`.
- `src/lib/dispositions.ts` — `DISPOSITION_SUIVI_ACTIONS`,
  `CLES_OUVERTURE_SUIVI_ACTION`.
- `src/lib/api.ts` — `creerPreProspection`, `apercuImportPreProspections`,
  `importerPreProspections`, `getColonnesSuiviActions`, `listSuiviActions`,
  `listSuiviActionsGroupes`, `SuiviActionsFilterParams` (**type**, pas interface).
- `src/types.ts` — sections « Pré-prospection : création & import » et
  « Suivi des actions » ; `ActionParTypeDto` ; `PerformanceCommercialDto` étendu.
- `docs/api-docsV4.json` — snapshot du 23/09 soir (KPI §7 inclus).
- `immo-crm/instructions/FEATURE-creation-pre-prospection.md`,
  `FEATURE-suivi-actions.md` (§3bis, §7) — les contrats (lecture seule).

---

## 🔧 Environment & Config

- Windows 11, PowerShell 5.1 + Git Bash ; Vite `:5173`, Spring `:8080` lancés
  par l'utilisateur ; backend joignable (`/api-docs` vérifié).
- Front : `main` = `c37a7ff` ; branche `fix/dashboard-pipeline` poussée,
  PR ouverte. Back : `immo-crm` non touché (lecture seule pour vérifier
  `ComProspection.docDate` et `GlobalExceptionHandler`).
- Ce fichier est commité **sur la branche** avec le fix (plus de
  `allow-main-edits` nécessaire). Après `sync`, il suit `main`.

---

## ⏭️ Next Step

> **PR `fix/dashboard-pipeline` en attente de fusion.** Quand l'utilisateur
> confirme : `node .claude/scripts/git-flow.mjs sync front` depuis
> `prototype/`, puis demander le prochain lot. Retour visuel attendu de
> l'utilisateur : couloirs prospection remplis (Prospections = KPI), 2 par
> ligne, titres entiers, page qui défile ; backend arrêté → message rouge + `—`.

### Backlog (par priorité)

- [ ] Retours visuels sur le suivi des actions (poids des colonnes, boîte de
      détail) et sur l'import CSV.
- [ ] #183 — filtre Catégorie dès qu'un référentiel existe.
- [ ] #184 — détail d'action complet si un endpoint par id arrive.
- [ ] #182 — virtualiser `TableauLignes` si un fichier de 5 000 lignes rame.
- [ ] Câbler « Désarchiver » (#180) dès que le back expose l'endpoint.
- [ ] #181 — rafraîchir les lignes des groupes dépliés après mutation.
- [ ] #164 — couloir « Dossier de vente » ; EncaissementDetail → FicheShell ;
      fusion des onglets pauvres de ProspectionDetail.
- [ ] Timelines restantes → tables (Historique prospection, fiche
      prospect/client, Hotline).
- [ ] Barre d'action flottante à la sélection (DossiersList).
- [ ] #155, #156, #167, #168 — backend/outillage.
- [ ] 10 erreurs eslint préexistantes (#101) ; supprimer `harness-densite.tsx`.
