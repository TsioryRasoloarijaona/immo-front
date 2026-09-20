# Session Memory
_Last updated: 2026-09-20 (fin de session — le grand redesign)_
_Project: crm-prototype (Arpent — CRM immobilier), C:\Users\tsiory\Documents\ayad-internship\prototype\crm-prototype_

---

## 🎯 Current Objective

**Redesign complet de l'application, piloté en direct par l'utilisateur sur une
seule journée**, construit sur la branche `docs/demande-filtre-colonne` à sa
demande explicite. Quatre directions de palette en 24 h : bleu Attio (validé en
maquette puis rejeté) → indigo (livré puis remplacé) → **style « Uxerflow »
final** : canvas greige + feuille blanche flottante, accent orange, boutons
noirs. Puis quatre passes de raffinement sur retours : retenue de l'orange,
modernisation filtres/tables, équilibrage des bordures app-wide, conversions
timeline→table. Constantes tenues de bout en bout : zéro défilement de page,
densité de grille Omran 24 px, statuts+glyphes intouchés, AA vérifié à chaque
commit.

Maquette (restée à l'état indigo) :
https://claude.ai/code/artifact/d5cdd55f-132c-47fa-a613-5e743d192d54

---

## ✅ What Worked

1. **Maquette avant code** : le rejet du bleu a coûté un republish d'artifact,
   pas une réécriture.
2. **Tout passe par les tokens** : quatre palettes successives sans jamais
   toucher un composant — `index.css` est le seul point de vérité couleur.
3. **`npm run check:contrast` à chaque palette** : 52 paires AA revalidées en
   une commande, zéro échec sur les quatre directions.
4. **Grep du CSS compilé après chaque build** : preuve de migration totale
   (0 trace du violet, puis 0 trace de l'indigo, puis 0 brun en sombre).
5. **`variant="inset"` de la sidebar shadcn vendorisée** : l'architecture
   « feuille flottante » de la référence existait déjà dans le code — un prop,
   pas une réécriture.
6. **Édits mécaniques en N appels Edit** plutôt qu'un regex shell (cf. échec
   encodage ci-dessous).
7. **Doctrine écrite au moment du geste** : la règle des bordures est codifiée
   dans `index.css` près de `--border`, l'historique des palettes dans
   l'en-tête — la prochaine session lit le pourquoi sur place.

---

## ❌ What Failed

- **Patch regex via PowerShell** (`Get-Content -Raw` + `WriteAllText`) →
  UTF-8 sans BOM lu comme ANSI, mojibake sur tous les accents de
  ProspectionDetail.tsx. Réparé par `git checkout --` + refait à l'outil Edit.
  **Règle : le shell ne touche jamais un fichier source.** (Consigné en
  mémoire persistante.)
- **Guillemets doubles dans un message de commit** → PowerShell 5.1 éclate
  l'argument natif en pathspecs. Messages sans `"`.
- **Commentaire JSX `{/* */}` inséré dans une expression parenthésée** →
  erreur de syntaxe (il faut `/* */` JS). Attrapé par tsc avant commit, deux
  fois le même piège dans la même passe.
- **Le bleu #2563EB validé sur maquette a quand même été rejeté** : une
  validation de maquette n'immunise pas contre un revirement — livrer petit et
  tôt reste la seule vraie protection.

---

## 🐛 Bugs & Errors Log

| # | Error / Bug | Status | Fix applied |
|---|-------------|--------|-------------|
| 101 | 9 erreurs eslint préexistantes | Open | **La référence est 9** — inchangée après ~15 commits de redesign |
| 155 | `FEATURES.md` invente 17 endpoints « sans appelant » | Open (outil) | — |
| 156 | `CreerReglementRequest.dateReglement` publiée mais refusée en 400 | Open (backend) | — |
| 164 | Couloir « Dossier de vente » compte les actifs, liste tout | Open | slice(3) de dossiersPage non filtré |
| 167 | `derniereAlerteDate` ni filtrable ni triable | Open (backend) | — |
| 168 | Filtre par colonne client-side ment (chèque → 0/180) | Open (backend) | Demande dans `docs/filtres-avances.md`, PR non fusionnée |
| 169 | Corruption d'encodage par patch shell | Fixed | `git checkout` + Edit tool |
| 170 | JSX comment dans expression JS ×2 | Fixed | `/* */` au lieu de `{/* */}` |

---

## 🔑 Key Points to Remember

### L'état final du design (commits `29ac050` → `a2f9c2e`)
- **Architecture** : `Sidebar variant="inset"` (Layout.tsx) — canvas greige
  `--sidebar` (#f2f0ea clair / #121211 sombre), sidebar nue dessus, contenu
  dans une feuille blanche flottante. `PageShell fullHeight` =
  `md:h-[calc(100svh-1rem)]` (compense la marge m-2 de la feuille), en-tête
  `md:rounded-t-xl`, filet /70, sans séparateurs verticaux.
- **Couleurs** : `--brand` orange #c2410c / #fb923c (le coral #ff5a2d de la
  référence ne passe pas AA). `--primary` = encre noire #201d17 (inversé clair
  en sombre) — **découplé de --brand** : boutons noirs, orange réservé à la
  structure (nav active, focus, sélection, barres du graphe). Sombre quasi
  NEUTRE (feuille #1b1b19). `--sec-accent` = gris (`var(--text)`) : les ~80
  puces d'icônes d'entité sont neutres. Nouveau ton **`--progress` violet**
  (#6d28d9/#a78bfa) découplé de brand (badge.tsx, STAT_TONE_VARS, règle de
  grille). Statuts success/warning/amber/info inchangés.
- **Doctrine bordures (codifiée dans index.css près de --border)** : UN cadre
  par zone (conteneur de liste, panneau d'onglets, popover, contrôle) ; toute
  structure interne = surface `bg-muted/30-40 rounded-lg` sans bordure.
  `--input` à peine plus soutenu que `--border`. Règles verticales de colonnes
  RETIRÉES de ui/table.tsx (restaurables, note sur place) ; en-tête de table =
  bandeau `--surface-hover` (redit sur les cellules collantes de DataGrid) ;
  séparateurs de lignes /70 ; les huit barres de filtres sont des toolbars
  nues (seul le panneau « document en lot » de Dossiers garde sa carte).
- **Zéro-scroll partout** : Dashboard refondu un-viewport (file « À
  rappeler » + 5 couloirs fusionnés + synthèse + dossiers récents, 10→8
  appels), Calendrier étiré, TranchesList en table dense, TrancheDetail /
  ProspectDetail alignés sur la géométrie FicheShell, Hotline, 2 pages KPI.
  Radius 12 px, page 14/28 px, cartes py-2.5/3, KPI en carte segmentée
  (`KpiCell` local à Dashboard.tsx).
- **Timeline → table** : onglet Actions de la prospection (note ENTIÈRE,
  cellule `whitespace-normal min-w-60 max-w-120`, la ligne grandit) et onglet
  Historique du dossier. Timelines restantes : Historique prospection,
  fiche prospect/client, Hotline.
- **Dossier** : Pièces jointes et Documents générés = **deux onglets séparés**
  (ids `pieces` / `documents`).

### Pièges de session
- Le shell ne touche JAMAIS un fichier source (encodage). Commits sans `"`.
- Vérifier la branche avant d'éditer ET avant de commiter.
- **Cinquième direction de couleur = re-demander avant d'écrire.** L'historique
  complet vit dans l'en-tête d'index.css.
- Captures utilisateur en 125 % : diviser par 1,25.

### Vérification
- Cinq portes : `npx tsc -b --force` · eslint = **9** · `npm run
  check:contrast` · `npm run build` · grep du CSS compilé.
- **Rien de cette session n'a été vu au navigateur par moi** ; l'utilisateur a
  validé itérativement sur son écran.

---

## 📁 Important Files & Paths

- `src/index.css` — palette Uxerflow entière + doctrine bordures + historique
  des quatre directions dans l'en-tête. LE fichier à lire avant tout geste
  design.
- `src/components/Layout.tsx` — `variant="inset"`, footer sidebar sans border.
- `src/components/PageShell.tsx` — fullHeight calc, header allégé.
- `src/components/ui/table.tsx` — bandeau d'en-tête, plus de règles
  verticales ; `src/components/DataGrid.tsx` — bandes allégées, en-têtes
  collants sur `--surface-hover`.
- `src/components/ui.tsx` — Card aérée, STAT_TONE_VARS.progress violet ;
  `src/components/ui/badge.tsx` — variant progress.
- `src/pages/Dashboard.tsx` — réécrit (un viewport, KpiCell, 5 couloirs).
- `src/components/ProspectionFilterBar.tsx` + les 7 pages listes — filtres en
  toolbars nues.
- `src/pages/dossiers/DossierDetail.tsx` — Historique en table, onglets
  Pièces jointes / Documents générés séparés.
- `src/pages/prospections/ProspectionDetail.tsx` — onglet Actions en table,
  note entière.

---

## 🔧 Environment & Config

- Windows 11, PowerShell 5.1 + Git Bash, fichiers CRLF (Write produit du LF,
  git renormalise — warning bénin). Écran utilisateur à 125 %.
- Vite `:5173`, backend Spring `:8080`, lancés par l'utilisateur.
- Branche **`docs/demande-filtre-colonne`** — commits de la session :
  `29ac050` (indigo+dashboard), `456b1a6` (zéro-scroll ×7), `b5eb507`
  (Uxerflow), `5a636d1` (retenue orange), `c220811` (filtres/tables),
  `e8176c5`/`f416100` (Actions→table), `53b9073` (Historique→table),
  `bf7742a` (fiches sans sur-cadre), `329b3d2` (équilibrage bordures),
  `a2f9c2e` (onglets pièces/documents), + commits mémoire intercalés.
  **Poussée, PR toujours non fusionnée.** `origin/main` = `532e3a2` (15/09).

---

## ⏭️ Next Step

> **Tour de validation visuelle complet par l'utilisateur** sur l'état final
> (`npm run dev`) : Dashboard, une liste (Prospections), une fiche dossier
> (nouveaux onglets), Calendrier, **thème sombre neutre** — puis décider :
> fusionner la PR (elle porte tout le redesign + la demande backend du filtre
> par colonne) ou continuer les raffinements.

### Backlog (par priorité)

- [ ] Retours visuels sur l'état final (clair ET sombre).
- [ ] Faire fusionner la PR `docs/demande-filtre-colonne` (14+ commits).
- [ ] Barre d'action flottante à la sélection (référence « 2 Selected ») à la
      place de la carte « document en lot » de DossiersList.
- [ ] Uniformiser les timelines restantes en tables si souhaité (Historique
      prospection, fiche prospect/client, Hotline).
- [ ] #164 — couloir « Dossier de vente » : compte les actifs, liste tout.
- [ ] EncaissementDetail → FicheShell ; fusion des onglets pauvres de
      ProspectionDetail (8 → 6) ; ProjetsList à borner.
- [ ] #155, #156, #167, #168 — backend/outillage, inchangés.
- [ ] 9 erreurs eslint préexistantes (#101) ; supprimer `harness-densite.tsx`.
