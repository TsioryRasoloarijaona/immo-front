# Session Memory
_Last updated: 2026-09-10T18:00:00Z_
_Project: crm-prototype (Arpent — CRM immobilier), C:\Users\tsiory\Documents\ayad-internship\prototype\crm-prototype_

---

## 🎯 Current Objective

Refonte visuelle en série, guidée par l'utilisateur au fil de l'eau : **densité de
grille calée sur le logiciel légataire Omran**, puis généralisation via un
`DataGrid` partagé, puis alignement des structures de données sur la spec V4, puis
**dé-marquage du produit** (renommé *Arpent*) et itération de thème. Quatre lots
fusionnés ; le cinquième est poussé, non fusionné, sans PR.

---

## ✅ What Worked

1. **Mesurer la capture de référence au pixel plutôt que d'estimer.** Le pas de
   ligne Omran (23,77px) a donné `--row-h: 24px` ; l'écart 33px→24px vaut ~7 lignes
   de données par écran. Toutes les décisions de densité en découlent.
2. **Vérifier dans le CSS *compilé*, pas dans la source.** `npm run build` puis
   `grep` sur `dist/assets/*.css`. C'est la seule chose qui a attrapé de vrais bugs
   cette session (voir #121, #123). Une syntaxe Tailwind v4 fausse
   (`h-(--row-h)`) n'émet **aucune classe** et le refactor no-ope en silence
   derrière trois portes vertes.
3. **Lire la source d'une dépendance au lieu de supposer.**
   `node_modules/@base-ui/react/internals/getStateAttributesProps.js` confirme que
   `state: {slot, variant}` émet `data-slot` **et** `data-variant` — ce qui a permis
   un sélecteur CSS fiable sans toucher `ui.tsx`.
4. **Le joint architectural : `BadgeTone` n'a que 6 valeurs**, et les 6 mappers de
   `lib/` le retournent déjà. Une table sur les 6 tons couvre **215 sites d'appel
   sans en toucher un seul**.
5. **`--primary`/`--ring`/les 8 `--sec-*`/les tokens sidebar aliasent tous
   `--brand`.** Changer une valeur propage à ~80 sites d'appel gratuitement.
6. **Étendre le gate quand le changement invalide ce qu'il mesure.**
   `check-contrast.mjs` a été étendu deux fois parce qu'il avait cessé de couvrir
   le cas réel — c'est le réflexe à garder.
7. **`git checkout main -- <fichier>` pour un revert fidèle**, plutôt que rejouer
   les valeurs à la main.
8. **Scripts Python écrits dans le scratchpad puis exécutés** — les heredocs
   bloquent (`exit 143`) et cassent sur les quotes.

---

## ❌ What Failed / Course-corrections

- **Le thème achromatique.** Livré comme spécification délibérée, conforme AA à
  des marges *plus larges* que la version colorée, statut porté par glyphe donc
  rien perdu sémantiquement. Rejeté à vue : « the app looks like it died on
  colour ». **L'en-tête d'`index.css` documentait déjà cet échec** pour une
  tentative antérieure ; j'ai lu le précédent, argumenté que les conditions
  différaient, et obtenu le même résultat.
- **Dé-teinter les gris.** Retirer le voile violet des neutres a retiré la vie
  avec. Un gris parfaitement neutre se lit *mort*, un gris teinté se lit
  *dessiné*. **Les gris violacés de cette palette sont voulus.**
- **Quatre accents de remplacement rejetés** : achromatique `#18181b`, violet vif
  `#7c3aed`, teal `#0f766e` (« lu comme vert »), marine `#1e3a8a` (interrompu
  avant commit). Retour à `#5d396e`.
- **Backticks dans un message `git-flow commit`** → substitution de commande bash,
  mot avalé. Arrivé **deux fois**. Corrigé par `git commit --amend -F fichier`.
- **Littéraux Python multi-lignes sur un fichier CRLF** → aucun match. Normaliser
  `\r\n`→`\n` en mémoire, éditer, réécrire en CRLF.
- **Le navigateur est inatteignable** depuis la session (voir Environment).
- **`git-flow start` refuse un arbre sale**, et `commit` refuse `main` → impasse.
  Contournement : `git stash push <fichiers>` → `start` → `stash pop`.
- **Supposer qu'un fetch devenu redondant est supprimable.** Le commentaire de
  `DossierDetail` disait que le résumé d'article manquait catégorie/type ; la
  livraison V4 les apporte, mais `ArticleCompactPreview` lit aussi `statut`,
  `tranche*`, `salePrice*`, `titreFoncier`, `adresse` — **le N+1 reste
  nécessaire**.

---

## 🐛 Bugs & Errors Log

| # | Error / Bug | Status | Fix applied |
|---|-------------|--------|-------------|
| 90-120 | Sessions antérieures | Fixed | PR #12 à #27 |
| 118 | `GET /api/prospections` sans réponse 200 documentée | **Open (backend)** | 4+ livraisons de spec sans correction |
| 109 | 4 champs `indicatif*` sans springdoc | Open (backend) | Viole la règle 10 |
| 111 | Corps du 409 d'`offre-prix` invérifiable | Open (constat) | — |
| 101 | 9 erreurs eslint préexistantes | Open | **La référence est 9** |
| 121 | **`display:none` périmé masquait les glyphes de statut** | Fixed | Une règle de la 1re passe de densité (sélecteur *différent* de celui modifié) survivait. Attrapée en grepant le CSS compilé, pas à l'œil |
| 122 | Règle « pastille compacte 16px » morte depuis le dépouillement | Fixed | Retirée avec sa raison ; deux règles se disputaient la même propriété |
| 123 | **`check-contrast` ne couvrait plus le cas réel** | Fixed ×2 | (a) pastilles dépouillées → paires ton-sur-carte ajoutées ; (b) tons redéclarés en périmètre cellule → fusion des valeurs de cellule |
| 124 | **En-tête vide au chargement** | Fixed | `h1` en `sr-only` + les retours anticipés loading/error montent `PageShell` **sans crumbs** → repli qui affiche le titre |
| 125 | `feat/activite-prospection` : `533d8fc` jamais dans la PR #27 | Fixed | Cherry-pické sur la branche suivante |
| 99 | `--chart-1..5` : 5 gris ne séparent pas 5 séries | Fixed | Rouvert par la passe achromatique, refermé au revert |

---

## 🔑 Key Points to Remember

### Le thème — LIRE AVANT DE TOUCHER À `index.css`
- **La palette est celle d'origine** : mauve `#5d396e` / `#c9a6d6`, gris violacés,
  fonds `#f7f7f9` / `#111014`.
- **« Retirer l'accent » est une impasse réglée** — deux échecs indépendants.
- **Ne pas égaliser les composantes** de `--text`/`--text-h`/`--bg`. Le voile
  violet est voulu.
- Le fond gris `#f7f7f9` a été signalé comme gênant ; **le blanc pur fonctionne**
  (cartes détachées par filet et ombre, pas par remplissage) — piste documentée.
- **Les glyphes de statut restent** (`TONE_GLYPH` dans `components/ui.tsx`).
  Couleur seule = échec WCAG sévérité High, que le design d'origine commettait.

### Dé-marquage — incohérence assumée
- Nom **Arpent**, aucun logo, favicon décâblé. Les fichiers `public/brand/`
  restent sur disque.
- **Le mauve restauré était échantillonné de la marque Ayad.** Le dé-marquage ne
  couvre donc plus que le nom, le logo et le favicon — **pas la palette**. C'est
  le fil qui reste à tirer, consigné dans `PRODUCT.md`.
- `PRODUCT.md` avait **passé outre la parole de l'utilisateur** (« no brand
  constraints ») en se fondant sur des fichiers du dépôt. Corrigé.

### Grilles
- `DataGrid<T>` porte tout le chrome ; **un écran déclare des `ColonneGrille[]`,
  pas du balisage**. `ProspectionTable` en est un adaptateur.
- **Toujours poser `valeur`** quand le texte affiché n'est pas `row[nom]` — sinon
  tri et filtre comparent un code brut (`IN_WORK`) alors que l'utilisateur voit
  un libellé (« Pointé »).
- Tri / Σ / filtres sont **réels mais côté client, sur la page chargée** — le
  comportement natif de la grille DevExpress d'origine.
- `selection` rend la gouttière *pilotée* (Dossiers, documents en lot) ;
  `rendreDetail` ajoute le maître-détail (Offres).
- Hors périmètre **par décision** : Dashboard, PerformancesCommerciaux, et les
  sous-tableaux des pages de détail/formulaire (Hotline incluse).

### Contrat V4
- **Rediffuser la spec contre `HEAD`**, jamais contre l'arbre — l'utilisateur
  lance `docs:update` avant de le dire, parfois pas du tout (arbre propre ⇒ le
  lancer soi-même, backend sur `:8080`).
- **`CreerReglementRequest.dateReglement` est délibérément absent de
  `types.ts`** : le serveur le refuse à la création (400). L'audit le signalera à
  chaque passage — c'est voulu.
- `statut` y est typé au littéral `'IN_WORK'` : `POINTED` est refusé (400).
- `DossierDetailDto.projetId` provient de la **tranche** de l'article, pas de
  l'article (`StkItem.CfgProjectId` est `null` sur les 358 lignes réelles).
- `ProspectDetailDto.tranchesInteret` est **non optionnel** — vide plutôt
  qu'absent.
- Quatre `*Id` sans consommateur (`categorieId`, `etageId`, `immeubleId`,
  `societeId`) : pas d'écran cible, documenté comme voulu.

### Vérification
- **Portes** : `npx tsc -b --force`, `npx eslint src --ignore-pattern
  'src/harness-densite.tsx'` → **doit rester à 9**, `npm run build`, et
  `npm run check:contrast` dès qu'on touche aux couleurs.
- **Les portes ne rendent rien.** Le contrôle qui trouve les bugs est le grep du
  CSS compilé.
- **Rien n'a été vérifié au navigateur de toute la session.**

---

## 📁 Important Files & Paths

- `src/index.css` — en-tête réécrit : historique des 4 accents rejetés, les deux
  constats sur les gris et le fond. **À lire avant tout changement de couleur.**
- `src/components/DataGrid.tsx` — **nouveau**, le chrome de grille partagé.
- `src/components/ProspectionTable.tsx` — adaptateur `ColonneDto` → `ColonneGrille`.
- `src/components/ui.tsx` — `Badge` + la table `TONE_GLYPH`.
- `src/components/PageShell.tsx` — en-tête compact, `h1` en `sr-only` **avec
  repli** quand il n'y a pas de crumbs.
- `scripts/check-contrast.mjs` — étendu : paires ton-sur-carte (cas grille).
- `src/types.ts` — aligné V4 ; porte les omissions volontaires commentées.
- `harness-densite.html` + `src/harness-densite.tsx` — **non suivis** (dans
  `.git/info/exclude`), toujours dans l'arbre. Servis sur
  `http://localhost:5173/harness-densite.html`, ils mesurent et affichent leur
  propre verdict. **À supprimer après vérification humaine.**
- Scratchpad : `diff-spec.cjs`, `audit-types.cjs`, `theme*.py`, `fixmsg*.py`.

---

## 🔧 Environment & Config

- Windows 11, PowerShell + Git Bash. Fichiers **CRLF**.
- Serveur de dev sur `:5173` (lancé par l'utilisateur), backend Spring sur `:8080`.
- **`gh` CLI installé** — `C:\Program Files\GitHub CLI\gh.exe`, **pas sur le PATH**
  des shells déjà lancés. Authentifié `TsioryRasoloarijaona`, scope `repo`.
- **Aucun navigateur atteignable** : `claude-in-chrome` renvoie
  `ERR_CONNECTION_REFUSED` sur le serveur de dev alors que `curl` répond 200 (son
  Chrome n'est pas sur cette machine) ; `--dump-dom` a disparu de Chrome ; pas de
  Playwright dans le projet. Les **URL publiques** (préviews Vercel) *naviguent*,
  mais `javascript_tool` exige une permission de domaine.
- **`main` à `2b7d79d`** — PR #28, #29, #30, #31 fusionnées.

---

## ⏭️ Next Step

> **Vérifier au navigateur** ce qui n'a jamais été vu : l'en-tête compact sur une
> page en chargement (le repli sans crumbs), les six glyphes de statut à 11px dans
> une liste, le dépli d'**Offres** et la sélection en lot de **Dossiers** — les
> deux seuls endroits où une fonctionnalité qui marchait a été touchée.

### Backlog (par priorité)

- [ ] **`refactor/theme-noir-blanc` : 8 commits, poussée, NON fusionnée, SANS PR.**
      Nom faux (ne livre ni noir-et-blanc ni le violet). Contenu net vs `main` :
      renommage Arpent + favicon, glyphes de statut, en-tête compact, 5
      descriptions retirées, paires de contraste. **Décision en attente de
      l'utilisateur** : écraser les 8 commits en un seul + ouvrir la PR sous un
      titre exact (réécrit une branche déjà poussée).
- [ ] Supprimer le harnais après la vérification humaine.
- [ ] **Demandes backend** (`from_front.md`) : la réponse 200 disparue de
      `GET /api/prospections` (#118) ; référentiel plat des supports d'origine ;
      tri serveur par `joursInactivite` ; les 4 `indicatif*` sans springdoc
      (#109) ; corps du 409 (#111) ; `?colonnes=`/`filtres` sur
      `/api/pre-prospections`.
- [ ] Vérifier sur données réelles que le backend accepte les **paramètres plats**
      des filtres avancés, et que `typeProspection=ComPreProspection` ramène bien
      les **830 pré-prospections**. Un code inconnu ne lève pas d'erreur — il rend
      un résultat vide, indistinguable de « aucun résultat ».
- [ ] Les colonnes `typeProspectionCode`/`typeProspection` apparaissent-elles dans
      le **catalogue serveur** ? Il est servi à l'exécution, la spec ne le dit pas.
- [ ] Faire valider les seuils 30 j / 90 j de la pastille d'inactivité.
- [ ] Le N+1 par article de `DossierDetail` — demande serveur éventuelle.
- [ ] Champs spec absents de `types.ts` : `MontantsOffreDto.commissionPercent` est
      un **ratio** (0.03) quand `remisePercent` voisin est un entier (5).
- [ ] 4 sous-collections de prospection sans écran (villes, types de bien,
      profils, catégories) : 12 endpoints, fonctions écrites, zéro appelant.
- [ ] 9 erreurs eslint préexistantes (#101).
