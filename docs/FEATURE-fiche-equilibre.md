# Équilibre haut / bas des fiches de détail

Front seulement (crm-prototype). Branche `feat/fiche-equilibre`. Aucun changement backend, API,
`types.ts`, `api.ts`.

## Pourquoi

Critique `impeccable` du 08/10/2026 (`.impeccable/critique/2026-10-08T17-29-30Z__…md`, score
27/40) sur la fiche prospection : le haut (titre, actions, parcours, identité, carte des champs)
prend ~55 % de la hauteur, le bas (onglets + contenu, là où l'agent travaille) ~45 % ; une seule
ligne d'action visible sans défiler. Cible ≈ **35 / 65**. Maquette validée par l'utilisateur :
https://claude.ai/artifact/Ha4DGZ243yRwfL7jesBaLD (planche « Après » = cible, « Avant » =
aujourd'hui). L'utilisateur veut la même chose sur **toutes** les fiches de détail.

**Règle absolue : toute l'information affichée aujourd'hui reste affichée.** On déplace, fusionne
et dédoublonne ; on ne cache rien derrière un clic (sauf un doublon strict).

## Périmètre — les fiches, en page **et** en dialogue

| Fiche | Fichier | Variantes |
|---|---|---|
| Pré-prospection / prospection | `pages/prospections/ProspectionDetail.tsx` (`FicheProspection`) | page, `FicheProspectionDialog` |
| Prospect / client | `pages/prospects/ProspectDetail.tsx` (`FicheProspect`) | page, `FicheProspectDialog` |
| Dossier | `pages/dossiers/DossierDetail.tsx` (`FicheDossier`) | page, `FicheDossierDialog` |
| Encaissement | `pages/encaissements/EncaissementDetail.tsx` | page |

Coque partagée : `components/CadreFiche.tsx`, `components/FicheShell.tsx`,
`components/ChampsFiche.tsx` (`GrilleFiche`), `components/ParcoursVente.tsx`,
`components/ActiviteProspection.tsx`, `components/Modal.tsx`. Corriger **une fois** dans la coque
ce qui est commun, puis fiche par fiche le reste.

## Principes (dans l'ordre de priorité)

- **P0 — Haut en deux lignes.**
  1. Ligne 1 = identité dans la ligne de titre (en dialogue : la barre de titre du `Modal`,
     aujourd'hui presque vide ; en page : l'en-tête de `PageShell`) : code, nom, statut/étape,
     badge d'état propre à la fiche (« 7 j sans action », statut dossier, etc.).
  2. Ligne 2 = barre de parcours **sur une seule ligne** (le « Voir » devient un bouton icône œil
     à côté de l'étape, avec `aria-label`) à gauche, actions à droite. Fiches sans parcours :
     actions seules, alignées sur la même ligne que le titre si la place le permet.
  - Supprimer de la ligne d'identité ce qui est **déjà** dans la carte des champs (date, commercial,
    société, nombre d'interactions déjà porté par l'onglet).
- **P1 — Carte des champs : une seule grille régulière.**
  - Une `GrilleFiche` de 4 colonnes (2 en écran étroit), lignes complètes, sans seconde grille
    imbriquée ni zone vide. Les champs longs (Notes, observations) prennent les colonnes restantes
    de la dernière ligne ; une zone de texte démarre sur 1–2 lignes.
  - Les champs repris par la ligne d'identité (code, nom, date de création, commercial) ne sont
    pas répétés en tête de grille ; ce qui n'y figure pas va sur une petite ligne grise de pied de
    carte (« Créée le … par … »), pour ne rien perdre. Conserver les cadenas et leur `aide`.
- **P1 — Bas : le travail d'abord.**
  - Dans l'onglet d'activité (Actions de la prospection, équivalents dossier / prospect /
    encaissement), le bloc de résumé devient **une ligne** (dernière action · résultat · visites ·
    relance en cours si elle existe) au-dessus du tableau ; retirer les doublons stricts (ex.
    « Projet » = Tranche, « Dernier échange » = 1re ligne du tableau).
  - L'action la plus fréquente de l'onglet (« Ajouter une action » sur la prospection,
    équivalent ailleurs) est un bouton dans cette ligne, juste au-dessus du tableau — et quitte
    la barre du haut.
  - En-tête de tableau collant (`sticky top-0`) dans la zone qui défile.
  - « Parcours (0) » de l'onglet Actions → « Historique de statut » (évite la confusion avec la
    barre de parcours) ; vide → une ligne grise.
- **P2 — Onglets cohérents.** Soit un compteur sur chaque onglet de collection, soit aucun et les
  onglets vides atténués — pas de pastille « 0 » qui ressemble à du contenu. Onglet actif
  souligné à l'accent (`--brand`), pas une boîte pâle.

Garder : seul le contenu de l'onglet défile (`FicheShell.tsx:83–150`, chaîne `min-h-0`), la barre
« modifications non enregistrées », la densité des tableaux (exception documentée dans
`crm-prototype/CLAUDE.md` — ne pas aérer les grilles), la palette, les glyphes de statut, la
navigation clavier, le responsive (pas de débordement horizontal de page).

## Méthode

1. Pour chaque fiche, mesurer avant (hauteur des bandes) en lisant le code, appliquer P0–P2,
   vérifier qu'aucune donnée n'a disparu (liste champ par champ avant/après dans le rapport).
2. Passe finale `impeccable polish` sur les fichiers touchés (skill du repo,
   `.claude/skills/impeccable`, référence `reference/polish.md`), puis le détecteur
   `node .claude/skills/impeccable/scripts/detect.mjs --json <fichiers>`.

## Hors périmètre

Backend, données, contenu des onglets autres que l'onglet d'activité, listes (`DataGrid`),
`*PreviewDialog`, palette / thème.

## Vérification

`npm run build` vert ; `npx eslint` sur les fichiers touchés ; détecteur `impeccable` ; pour chaque
fiche, la liste avant/après des informations affichées (aucune perte) ; navigateur si disponible
(page + dialogue, largeur 1440 et 390).
