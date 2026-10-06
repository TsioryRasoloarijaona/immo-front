# Session Memory
_Last updated: 2026-10-06_
_Project: crm-prototype (Arpent — CRM immobilier), C:\Users\tsiory\Documents\ayad-internship\prototype\crm-prototype_

---

## 🎯 Current Objective

**06/10 — `feat/dashboard-filtre-tranche`** (PR à fusionner) : liste « Tranche » sur le Dashboard, admin seulement (`?tranche=` dans l'URL, ignoré pour un commercial), propagée à tous les appels du tableau de bord et aux dialogues « Voir tout ». `feat/module-outils` fusionnée (#74).

**Petites features front à la demande, une PR par lot**, dans la boucle
habituelle : demande → (diff spec contre HEAD si le back a bougé) →
AskUserQuestion avant la branche → implémenter → build+lint → commit+push →
l'utilisateur fusionne → sync.

**Lot du 06/10 : `feat/module-outils`** (front seul, **statique**, aucun
changement de spec) — nouveau module **Outils** réservé à l'administrateur,
qui intègre l'outil autonome `prototype/generateur-virement/` (Node + jsPDF,
une page HTML à 4 onglets) aux règles de design de l'app. Commit `ed80d31`,
**poussé, PR à fusionner** :
`https://github.com/TsioryRasoloarijaona/immo-front/compare/main...feat%2Fmodule-outils?expand=1`.

Lots précédents tous fusionnés : #64 → #72 (`feat/dashboard-dialogues` = PR
#72, `main` = `dd994c0`, branche locale supprimée ce jour).

---

## ✅ What Worked

1. **Diff structurel du spec, pas `git diff` brut** — script node dans le
   scratchpad : `git show HEAD:docs/api-docsV4.json` vs fichier de travail.
2. **Quand le diff structurel est vide, lire `git log` d'`immo-crm`** et la
   FEATURE : une règle peut changer le comportement sans toucher l'OpenAPI.
3. **Lire la FEATURE backend avant de concevoir** (`immo-crm/instructions/`).
4. **Patron des listes** : `AdminGuard` / `PageShell` + `DataGrid` +
   `ColonneGrille[]` (patron `ClesApiList`) — un écran entier en une passe.
5. **`git-flow start` avec l'arbre sale** : stash ciblé → `start` → `pop`.
6. **Itérer sur la même PR** : commit + `feature-index add` + `push`.
7. **Un couloir vide à côté d'un KPI non nul = requête en échec** (#185).
8. **Plan / AskUserQuestion avec `preview` ASCII** pour un choix de
   disposition — utilisé encore le 06/10 (entrées de sidebar vs onglets).
9. **Trouver la vraie base d'un backend qui tourne** : `sqlcmd` +
   `sys.dm_exec_sessions` (`program_name LIKE '%JDBC%'`).
10. **Un 401 sur un seul POST = 500 déguisé** (#187).
11. **Mémo sur la branche en attente**, il suit la PR.
12. **(06/10) Maquette statique partagée entre écrans** : un magasin en
    mémoire `useSyncExternalStore` (`donnees.ts` : `useVirements` /
    `majVirements`) — un ordre généré apparaît dans l'historique sans backend.
13. **(06/10) Fichier hors du répertoire de travail** : la lecture est
    bloquée (`blockReadsOutsideWorkingDirectories`) ; ne pas contourner par
    le shell — demander `/add-dir` ou que l'utilisateur colle le contenu
    (il a collé `index.html`).
14. **(06/10) Build vert du premier coup** en lisant d'abord `Layout`,
    `ModuleSwitcher`, `AdminGuard`, `ClesApiList`, `Modal`, `PageShell`,
    `ui.tsx`, les props de `DataGrid`.

---

## ❌ What Failed

- **`/tmp` sous Git Bash → `C:\tmp` pour node** : toujours le scratchpad.
- **`git-flow start` avec fichiers non commis** refuse ; `commit` refuse `main`.
- **`interface` de filtres passée à `withPageable`** → TS2345 ; utiliser `type`.
- **`(dto as Record<string, unknown>)`** → TS2352 ; `as unknown as`.
- **`git-flow commit` n'ajoute pas le trailer `Co-Authored-By`** → `git
  commit --amend -m "$(printf …)"` **avant** `push` (fait le 06/10).
- **`sort=dateDocument,desc`** → 400 : trier sur la propriété d'entité.
- **PR fusionnée avant le dernier push** → commit orphelin ; vérifier
  `git log main..<branche>` après un « merged ».
- **`new Date().toISOString().slice(0,10)`** → recule d'un jour à l'est de
  UTC. Toujours `todayISO` / `jourISO` (rattrapé le 06/10 dans `SocieteDialog`).
- **(06/10) Exporter un hook à côté de composants** → eslint
  `react-refresh/only-export-components`. `useNotification` a son propre
  fichier.
- **(06/10) `curl localhost:5173` depuis la session** → 000 : le serveur de
  dev n'est pas joignable d'ici (cf. mémoire « Browser unreachable »).

---

## 🐛 Bugs & Errors Log

| # | Error / Bug | Status | Fix applied |
|---|-------------|--------|-------------|
| 101 | Erreurs eslint préexistantes — référence **10** | Open | — (toujours 10 au 06/10) |
| 155 | `FEATURES.md` invente des endpoints « sans appelant » (22 affichés) | Open (outil) | — |
| 156 | `CreerReglementRequest.dateReglement` publiée mais refusée en 400 | Open (backend) | — |
| 164 | Couloir « Dossier de vente » compte les actifs, liste tout | Open | — |
| 167 | `derniereAlerteDate` ni filtrable ni triable | Open (backend) | — |
| 168 | Filtre par colonne client-side ment (chèque → 0/180) | Open (backend) | — |
| 181 | Mode groupé : groupes dépliés non rafraîchis après mutation | Open (limite) | — |
| 182 | Import CSV : jusqu'à 5 000 lignes d'un bloc | Open (à surveiller) | — |
| 183 | Suivi des actions : pas de filtre Catégorie (pas de référentiel) | Open (backend) | — |
| 184 | `ActionDetailDialog` limité aux colonnes demandées | Open (limite) | — |
| 187 | Backend sans catch-all → tout 500 authentifié devient 401 → déconnexion | Open (backend) | À remonter |
| 191 | Recherche par nom bornée à la période (mois courant) | Open (assumé) | Bouton « Toutes les périodes » |
| 192 | « Archivé : Oui » renvoyait tout | Corrigé backend d'après l'utilisateur, **non vérifié** | `docs:update` + contrôle à faire |
| 193 | (06/10) L'utilisateur ne trouvait pas le module Outils (cherchait dans Administration) | Open (découvrabilité) | Expliqué : tuile Outils du sélecteur de modules (icône grille en haut à droite) ou `/outils`. Proposé : lien « Outils → Ordres de virement » dans la sidebar Administration — **réponse attendue** |

---

## 🔑 Key Points to Remember

### Lot du 06/10 — `feat/module-outils` (PR à fusionner)
- Demande : « créer un module Outils, réservé à l'admin, qui intègre le
  contenu HTML de `generateur-virement/public/index.html`, avec notre
  design ; interface statique pour l'instant ».
- Tranché (AskUserQuestion) : branche `feat/module-outils` ; **4 entrées de
  sidebar** (pas d'onglets dans la page) sous le groupe « Ordres de
  virement ».
- **Module** : `APP_MODULES` gagne `{ slug: 'outils', icon: Hammer, path:
  '/outils/virements/nouveau', adminOnly: true }` ; nouveau champ
  `AppModule.adminOnly` → `ModuleSwitcher` filtre les tuiles réservées pour
  les non-admins. `moduleForPath('/outils…') = 'outils'`. `Layout` : `outils`
  exclu de `activeSoonModule`, groupe sidebar admin, message « réservé » pour
  les autres. Ce n'est **pas** une entrée d'Administration.
- **Routes** (`App.tsx`, `lazy`) : `/outils` et `/outils/virements` →
  `Navigate` vers `nouveau` ; `/outils/virements/{nouveau,historique,
  beneficiaires,societes}`.
- **Écrans** (`src/pages/outils/virements/`) : `NouvelOrdre` (formulaire +
  `ApercuCourrier` en direct, un ou plusieurs bénéficiaires, panneau
  post-génération « Compléter le dossier ») ; `HistoriqueVirements`
  (recherche, filtre dossier, 3 `StatCard`, totaux par société, `DataGrid`,
  clic → `OrdreDetailDialog`, crayon → `ModifierOrdreDialog`) ;
  `Beneficiaires` (recherche, filtre nature, ajout/modif/suppression,
  `DossierBeneficiaireDialog`, import Excel factice) ; `Societes` (`DataGrid`,
  `SocieteDialog` large avec aperçu du courrier à droite).
- **Tout est fictif** : `donnees.ts` (3 sociétés GHRIZA / DIOURI ARCHI SARL /
  ADMOD, 8 bénéficiaires, 10 ordres OV-2026-0041→0050), magasin en mémoire,
  perdu au rechargement. Bandeau « Maquette » sur chaque écran
  (`CadreVirements`). Aucun PDF, upload ni import réel : « Joindre » rattache
  un nom de fichier fictif.
- **Types locaux à `donnees.ts`**, pas dans `types.ts` : aucun DTO n'existe.
  Ils iront dans `types.ts` quand le contrat backend sera écrit.
- **Liste des pièces par type inventée** (ordre signé, facture/bulletin, avis
  de débit) — à confirmer avec la comptabilité.
- **« Mon compte » de l'outil d'origine non repris** (mot de passe, comptes,
  journal) : le CRM a déjà ses comptes et son module Administration.
- **`ApercuCourrier` reste blanc en thème sombre**, volontairement (image
  d'une feuille imprimée, couleurs hors jetons, proportions A4). Modèles à
  `{societe}`, `{compte}`, `{montant}`, `{beneficiaire}`, gras selon les cases
  de la société.
- Boutons d'action dans une ligne cliquable : `onClick` **et** `onKeyDown`
  `stopPropagation`, sinon la ligne s'ouvre aussi.
- Notifications en `z-60` (au-dessus des dialogues `z-50`).

### Lots antérieurs (tous fusionnés) — l'essentiel
- **Dashboard en dialogues (#72)** : `FicheProspection({ id, pre, variante })`
  exportée de `ProspectionDetail.tsx`, `CadreFiche`, `FicheProspectionDialog`
  (`refetchAllApis()` différé à la fermeture), `Modal` (`pleineHauteur`,
  `width` en chaîne CSS). Filtres des couloirs déclarés une fois
  (`FILTRES_OUVERTES`, `FILTRES_A_TRAITER`).
- **Filtres par défaut (#70/#71)** : « Archivé : Non/Oui/Tous » (défaut Non)
  via `ouvertesDepuisArchive` ; période par défaut = mois courant sur les
  cinq listes à période ; commercial connecté pré-rempli sur Prospections
  (l'état ne stocke que les `modifs`, défauts dérivés).
- **Clés d'API (#67)** : `/cles-api`, secret affiché une seule fois.
- **Doublons (#66)** : 409 `doublons` / `prospectionExistante`, lus par
  `doublonsDepuisErreur` / `prospectionExistanteDepuisErreur`.
- **Suivi des actions** : règle §3bis (suivi général = admin seul).
- Tri = **propriété d'entité** (`docDate`), jamais le champ DTO.
- Toujours destructurer `error` de `useApi` ; rendre sur `!error && data`.

### La boucle git (rappel opérationnel)
- `node .claude/scripts/git-flow.mjs` depuis `prototype/` ; toujours
  AskUserQuestion avant `start` ; messages de commit sans `"` ni accents ;
  amender pour le trailer ; `feature-index add` + `generate` APRÈS commit,
  AVANT push ; `sync` après la fusion.
- Écrire sur `main` : `prototype/.claude/allow-main-edits`, écrire, le
  supprimer aussitôt. Sur une branche : pas besoin.

### Pièges
- Le shell ne touche JAMAIS un fichier source (encodage) ; scratchpad, pas
  `/tmp` ; captures ÷1,25 ; `git branch --show-current` avant le premier édit.
- Pas de navigateur depuis la session : validation visuelle par l'utilisateur.

### Vérification
- 06/10 : `npm run build` ✓ · eslint = **10** ✓. **Rien vu à l'écran** :
  module Outils à contrôler (Nouvel ordre sur fenêtre étroite, dialogue
  Société, empilement Dossier bénéficiaire → Ordre).

---

## 📁 Important Files & Paths

- `src/pages/outils/virements/` — **06/10, nouveau** :
  - `donnees.ts` — types, libellés, pièces requises, données fictives,
    magasin `useVirements` / `majVirements`, `prochainNumero`, `nouvelId`.
  - `CadreVirements.tsx` — `AdminGuard` + fil d'Ariane + bandeau maquette ;
    `ChoixSimple` (Select en une ligne).
  - `useNotification.tsx` — notification de bas d'écran.
  - `ApercuCourrier.tsx` — le courrier rendu depuis le modèle de la société.
  - `NouvelOrdre.tsx`, `HistoriqueVirements.tsx`, `Beneficiaires.tsx`,
    `Societes.tsx` — les quatre écrans.
  - `OrdreDetailDialog.tsx`, `ModifierOrdreDialog.tsx`,
    `BeneficiaireDialog.tsx`, `DossierBeneficiaireDialog.tsx`,
    `SocieteDialog.tsx` — les boîtes.
- `src/lib/modules.ts` — **06/10** : module `outils`, champ `adminOnly`.
- `src/components/ModuleSwitcher.tsx` — **06/10** : filtre `adminOnly`.
- `src/components/Layout.tsx` — **06/10** : groupe sidebar « Ordres de virement ».
- `src/App.tsx` — **06/10** : routes `/outils/...`.
- `../generateur-virement/` — l'outil d'origine (hors du répertoire de
  travail, lecture bloquée ; `index.html` collé par l'utilisateur). Son
  `app.js` (107 kB) et `server.js` n'ont pas été lus.
- `src/pages/prospections/ProspectionDetail.tsx`, `src/components/CadreFiche.tsx`,
  `src/components/FicheProspectionDialog.tsx`, `src/components/dashboard/` —
  Dashboard en dialogues (#72).
- `src/lib/format.ts` — `todayISO`, `jourISO`, `debutMoisISO`, `finMoisISO`.
- `docs/api-docsV4.json` — snapshot du 25/09 (163 routes) ; pas rafraîchi depuis.
- `FEATURES.md` (racine `prototype/`) — lot `module-outils` enregistré
  (43 routes, 186 endpoints, 144 fonctions api).

---

## 🔧 Environment & Config

- Windows 11, PowerShell 5.1 + Git Bash ; Vite `:5173` et Spring `:8080`
  lancés par l'utilisateur (non joignables depuis la session le 06/10).
- Front : branche courante `feat/module-outils` (`ed80d31` + ce mémo), `main`
  = `dd994c0`. Branche locale restante : `feat/desarchiver-prospection`
  (reliquat). Back `immo-crm` non touché.
- Lecture hors du répertoire de travail bloquée par
  `permissions.blockReadsOutsideWorkingDirectories` → `/add-dir` pour lire
  `generateur-virement/`.
- SQL Server `localhost,49687`, `sqlcmd` ODBC 17 ; creds de test dans
  `immo-crm/src/test/resources/application.properties` (jamais recopiés ici).

---

## ⏭️ Next Step

> **Réponse de l'utilisateur sur #193** : ajouter ou non un lien « Outils →
> Ordres de virement » dans la sidebar Administration (même branche, la PR
> suit). Puis contrôle à l'écran et fusion de la PR `feat/module-outils` ;
> ensuite `node .claude/scripts/git-flow.mjs sync front` depuis `prototype/`,
> vérifier `git log main..HEAD` vide, demander le prochain lot.

### Backlog (par priorité)

- [ ] Retour visuel sur le module Outils : les quatre écrans, aperçu du
      courrier (police, en-tête texte/logo/aucun, groupé), dialogue Société
      sur petite fenêtre, Échap qui ferme un niveau à la fois.
- [ ] Ordres de virement côté serveur (quand demandé) : FEATURE backend
      (sociétés, bénéficiaires, ordres, pièces, génération PDF openpdf contre
      un courrier de référence), puis remplacer le magasin en mémoire par
      `useApi` et déplacer les types dans `types.ts`. Lire `app.js` /
      `server.js` / `GUIDE-FRONTEND.md` de `generateur-virement` d'abord
      (`/add-dir`).
- [ ] Confirmer la liste des pièces par type de virement.
- [ ] #192 — `npm run docs:update`, diff structurel, commit du snapshot,
      contrôle « Archivé : Oui ».
- [ ] Retour visuel sur le Dashboard en dialogues et sur les filtres du 28/09.
- [ ] Décider du sort de `feat/desarchiver-prospection` (commit de mémo
      `1b97322` non fusionné).
- [ ] #187 — remonter le catch-all `@ExceptionHandler(Exception.class)`.
- [ ] Si demandé : Clients et Dossiers en dialogues sur le Dashboard.
- [ ] #191 — ignorer la période dès qu'une recherche est saisie.
- [ ] Hotline : paramètre `?telephone=`.
- [ ] Doublons à la volée pendant la saisie (FEATURE §5, optionnel).
- [ ] #183, #184, #182, #181, #164 ; timelines → tables ; barre d'action
      flottante (DossiersList).
- [ ] #155, #156, #167, #168 — backend/outillage.
- [ ] 10 erreurs eslint préexistantes (#101) ; supprimer `harness-densite.tsx`.
