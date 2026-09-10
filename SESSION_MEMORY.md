# Session Memory
_Last updated: 2026-09-09T22:40:00Z_
_Project: crm-prototype (Ayad Estate — CRM frontend), C:\Users\tsiory\Documents\ayad-internship\prototype\crm-prototype_

---

## 🎯 Current Objective
Consommer au fil de l'eau les endpoints V4 que le backend livre, **en rediffusant systématiquement la spec contre `HEAD` avant d'écrire une ligne de front**. La branche `feat/activite-prospection` porte toute la refonte prospection : panneau d'activité sur la fiche, journal enrichi, sélecteur de colonnes serveur, et volet de filtres avancés.

---

## ✅ What Worked

1. **Le backend écrit maintenant un guide d'intégration front.** `../immo-crm/instructions/GUIDE-FRONT-fiche-prospection.md` — état réel des endpoints, ordre d'affichage recommandé avec **taux de population par champ**, pièges, et contrat des lots à venir. **Le lire avant de planifier** : il a inversé le sens d'une demande cette session.
2. **Le diff structurel de spec contre `HEAD`, jamais l'arbre de travail.** `scratchpad/diff-spec.cjs <base> <nouveau>`, base extraite par `git show HEAD:docs/api-docsV4.json` **via le Bash tool** (PowerShell `>` ré-encode en UTF-16). Rejoué 3 fois cette session, il a tout cadré.
3. **Le harnais React piloté par Playwright.** Page Vite temporaire à la racine (`harness-x.html` + `src/harness-x.tsx` important `./index.css`), montant un composant seul avec des données factices, servie par le serveur de dev déjà lancé. **C'est la seule chose qui trouve les bugs de composition Base UI.**
4. **Le harnais HTML statique + `vite preview`** pour la seule mécanique CSS : reproduire la chaîne d'ancêtres, charger le CSS compilé, mesurer `scrollWidth`/`clientWidth` avec et sans le correctif.
5. **Confronter la spec au code par script.** Un `node -e` comparant `components.schemas.X.properties` aux champs déclarés dans `types.ts` sort les manquants en une commande.
6. **Chercher les champs typés sans consommateur** par grep : « déclaré mais jamais lu » a révélé le filtre Tranche sans colonne Tranche.
7. **Le rendu piloté par le `type` du catalogue** : 19 colonnes livrées d'un coup n'ont coûté que des entrées d'ordre, de largeur et de classe.

---

## ❌ What Failed / Course-corrections

- **Trois portes vertes sur du code qui plantait au premier clic.** `tsc`, `eslint` et `npm run build` ne rendent rien. Deux bugs Base UI (#116, #120) et un bug de layout (#117) sont passés au travers. **Pour toute primitive Base UI composée à la main, monter un harnais.**
- **Avoir proposé des colonnes en dur.** L'analyse était juste (filtre Tranche sans colonne), la conclusion fausse : le guide §4 montre que les colonnes manquantes le sont **par décision mesurée** — 5 942 ms à la page 250 contre 123 ms. La réponse était le sélecteur. **Quand un manque est aussi évident, chercher d'abord pourquoi il n'a pas été comblé.**
- **Un catalogue de colonnes codé en dur, mort en une demi-journée.** Le serveur a livré son référentiel le lendemain. C'est exactement l'argument du §5.3.
- **`{/* */}` dans une branche de ternaire** → `TS1005`. Ce n'est une position d'enfant ni entre deux attributs, ni entre `) : (` et l'élément. Utiliser `/* */` nu.
- **`min-w-0` posé trop bas** (#117) : la contrainte doit être cassée sur l'élément flex de l'axe concerné, pas sur un descendant.
- **`stopPropagation` React trop tard** (#120) : React délègue à la racine, les écouteurs natifs des ancêtres passent avant.
- **Playwright et l'extension Chrome ne peuvent pas atteindre l'application** : la première est renvoyée sur l'écran de connexion, la seconde rend une page d'erreur sur `localhost:5173`.
- **Le heredoc peut bloquer** (`exit 143`). Fichier `.cjs` écrit avec Write puis `node`.
- **`feature-index.mjs add` avant le commit** → « Nothing to record » (il lit `main..HEAD`).

---

## 🐛 Bugs & Errors Log

| # | Error / Bug | Status | Fix applied |
|---|-------------|--------|-------------|
| 90-108 | Sessions antérieures (pièces jointes, KPI, session expirée, hotline, DNS prod, `RouteErrorBoundary`, `ResultatEnvoiVisiteDto`, indicatifs) | Fixed | PR #12 à #23 |
| 99 | `--chart-1..5` échoue la validation catégorielle | Open (constat) | Une seule teinte pour les marques KPI |
| 100 | `workflowDescription \|\| statutDescription` masque le statut | Open (différé) | Choix de l'utilisateur |
| 101 | 9 erreurs eslint préexistantes | Open | 8× `react-refresh/only-export-components` + 1× `set-state-in-effect` |
| 109 | 4 champs `indicatif*` **sans annotation springdoc** | Open (backend) | Viole la règle 10 du projet |
| 110 | Offre de prix sans consommateur front | Fixed | PR #24 |
| 111 | Corps du 409 de `offre-prix` invérifiable | Open (constat) | On lit `ApiError.message`, jamais la structure |
| 112 | Deux gardes de conversion mortes depuis toujours | Fixed | `9dcd8a2` — repointées sur `activite.dossierId` |
| 113 | 4 champs de `ProspectionDetailDto` jamais reflétés dans `types.ts` | Fixed | `tranche*`/`article*` |
| 114 | Filtre « Tranche » sans colonne Tranche | Fixed | Colonne cochable, pas en dur |
| 115 | Les 8 champs d'`InteractionDto` sans consommateur | Fixed | Journal enrichi |
| 116 | **`MenuGroupContext is missing` — écran blanc** | Fixed | `DropdownMenuLabel` est un `Menu.GroupLabel` : exige un `Menu.Group` parent, j'avais mis un `<div>` |
| 117 | **La table élargissait la fenêtre au lieu de défiler** | Fixed | `min-w-0` sur `SidebarInset`. Mesuré : sans, 1534 px pour 1425 ; avec, 1440 pour 1440 |
| 118 | **`GET /api/prospections` n'a plus de réponse 200 documentée** | **Open (backend)** | Ne déclare qu'un `400`, typé `PageDtoProspectionListItemDto` alors que sa description dit ProblemDetail. `@ApiResponse(responseCode="400")` sans bloc `content`, qui évince le 200. **Trois livraisons de spec sont passées sans le corriger** |
| 119 | Huit champs de prospection affichés alors qu'ils sont morts | Fixed | Retirés de la consultation, **saisie conservée** sur décision de l'utilisateur |
| 120 | **La recherche-par-lettre de Base UI volait les frappes** | Fixed | Écouteur **natif** sur le champ (la cible), pas React. `Escape`/flèches/`Entrée`/`Tab` continuent de remonter |

---

## 🔑 Key Points to Remember

### Contrat et données
- **Rediffuser la spec contre `HEAD` à chaque « nouvelle version »**, l'utilisateur lance `docs:update` **avant** de le dire.
- **La fiche prospection est ouverte 7 372 fois/an, sa liste 270.** Facteur 27 — l'arbitrage à refaire pour toute demande sur ces écrans.
- **Omettre `?colonnes=` n'est pas neutre** : sans lui le backend **n'interroge pas la vue légataire** et les groupes `ACTIVITE`/`CONVERSION` sont absents. Sur `ProspectionListItemDto` (53 champs), `undefined` y veut dire « non demandée », pas « vide ». On n'envoie le paramètre que si la sélection s'écarte des défauts.
- **Les filtres avancés sont déclarés en un paramètre objet `filtres`, `required: true`** — artefacts springdoc. Spring lie ce genre d'objet depuis des **paramètres plats**, et un objet sans champ obligatoire se lie vide. **Non vérifié (401).** Si un filtre reste sans effet en réel, c'est la première hypothèse.
- **`activite` vaut `null` en entier sur une pré-prospection** (3 817, exclues par la vue) **et sur les 4 prospections créées par l'application** (pas de `StrEntityId`). Absence = « non disponible », jamais « zéro ». À l'intérieur d'un bloc présent, `nbVisites: 0` veut bien dire « aucune visite ».
- **Champs mesurés morts, à ne jamais afficher** : `prix` (4 lignes sur 14 114, `0` — jamais `null` — ailleurs), `surface`, `prixJusqua`, `surfaceJusqua`, `avance`, les trois `financement*`. **`cin` vaut 2,7 %, pas 99 %** — la première mesure comptait les non-`NULL` d'une colonne à chaînes vides. **Se méfier des taux à 99 % sur une colonne texte.**
- **`telephone`/`email` appliquent un repli et servent à joindre ; `mobileProspect` (99,8 %) et `emailFiche` (59,1 %) sont les valeurs brutes et servent à éditer ou dédoublonner.** Pas des doublons.
- **`creePar` n'est à 34,3 %** que parce que les prospections créées par cette API n'en portent pas (bug backend #41). Vide = « créée depuis l'application ».
- **`/api/referentiels/entites` est `CfgCompany`** — le référentiel du filtre `societeId`, malgré un nom qui évoque `StrEntity`.
- **`?colonnes=` et `filtres` n'existent que sur `/api/prospections`.** Ni `/api/pre-prospections` ni `/api/prospects/{id}/prospections`.
- **`origineSupportId` est le seul filtre sans écran** : pas de référentiel plat des supports, seulement `/origines-prospection/{id}/supports`.
- **`InteractionDto` : on écrit dans `description`, on lit dans `note`** (le `description` renvoyé est un tampon). **`categorieId` ≠ `resultatId`.**
- **Chaînes vides déjà normalisées en `null` par le backend** : un test de nullité suffit.
- **Offre de prix** : 19,7 % d'emails contre 99,7 % de numéros ; **le 409 est le cas majoritaire** ; `offreId`/`offreCode` toujours renseignés — ne jamais conditionner leur affichage à `envoye`.
- **`remisePercent` est un pourcentage (5 = 5 %)** ; `remisePercent: 0` force une renumérotation. Champs vides = champs **omis**.

### Front
- **Trois portes de validation ne rendent rien.** `npx tsc -b --force` (le `--force` est obligatoire), `npx eslint src` → **doit rester à 9**, `npm run build`, plus `npm run check:contrast` si on touche aux couleurs. **Pour toute composition Base UI, monter un harnais en plus.**
- **Le piège flex de largeur** : un élément flex d'une **rangée** a `min-width: auto` = la largeur minimale de son contenu. Un tableau large remonte donc et élargit la page. Casser la contrainte sur l'élément flex de l'axe concerné — ici `min-w-0` sur `SidebarInset`, qui **touche toute l'application**.
- **Base UI** : `Menu.GroupLabel` exige un `Menu.Group` parent ; la recherche-par-lettre vole les frappes d'un `<input>` interne, et seul un écouteur **natif sur le champ** l'arrête.
- **Le narrowing d'un `p.activite?.x` testé en JSX ne survit pas au closure d'un `onClick`** — hoister.
- **La nav se modifie à trois endroits** : `modules.ts`, `App.tsx`, `Layout.tsx`.
- **Le seuil de re-sonde de session (60 s) doit rester au-dessus du TTL du cache GET (30 s)** dans `api.ts`.
- **Seuils de la pastille d'inactivité : 30 j / 90 j, proposés par le guide, NON validés par le métier.** Point unique : `SEUIL_INACTIVITE_TIEDE`/`_FROID`.
- **`--warning` est le rouge (#b02012), `--amber` l'orange (#92580a)** — pas ce que les noms laissent croire.

### Vérification
- **Aucune vérification authentifiée n'est possible** : pas d'identifiants, Playwright renvoyé sur l'écran de connexion et **je ne saisis pas de mot de passe**, extension Chrome en erreur sur `localhost:5173`, 401 sur tout appel anonyme y compris les référentiels.
- **Les captures Playwright atterrissent à la racine du dépôt** (non ignorée) → **les déplacer dans le scratchpad**.
- **Ordre de publication** : commit → `feature-index add` → `generate` → `push` → attendre la fusion → `sync`.
- **Commiter `SESSION_MEMORY.md` avec le reste**, jamais la laisser en attente.

---

## 📁 Important Files & Paths

- `../immo-crm/instructions/GUIDE-FRONT-fiche-prospection.md` — **le guide d'intégration**, canal du backend vers le front.
- `src/types.ts` — `ActiviteProspectionDto`, `ColonneDto`, `FiltresAvancesProspection`, `ProspectionListItemDto` (53 champs).
- `src/lib/colonnes.ts` — ne porte **que** ce que le serveur n'a pas : `ORDRE`, `POIDS`, `LIBELLES_GROUPE`, `filtrerColonnes` (multi-mots, sans accents), `useColonnesVisibles`. **Rien n'est stocké tant que l'utilisateur n'a rien changé**, et « réinitialiser » *efface* l'entrée pour suivre le `parDefaut` serveur.
- `src/components/ProspectionTable.tsx` — tableau partagé, **rendu générique piloté par le `type`** + `RENDUS`/`CLASSES`/`TITRES`.
- `src/components/ColumnSelector.tsx` — sections, recherche multi-mots, écouteur natif anti-typeahead, dernière colonne verrouillée.
- `src/components/ProspectionFiltresAvances.tsx` — volet des 14 filtres.
- `src/components/ActiviteProspection.tsx` — `InactiviteBadge`, `DossierIssuBanner`, `ActiviteCard`.
- `src/lib/domain.tsx` — `FiltresAvancesState` (chaînes pour nombres/dates, booléens ternaires), `emptyFiltresAvances`, `countActiveFiltresAvances`, `toFiltresAvances`.
- `src/lib/referentiels.ts` — `useColonnesProspections`, `useProjetsReferentiel`.
- `src/components/Layout.tsx` — `min-w-0` sur `SidebarInset`.
- `src/components/ui/table.tsx` — prop `containerClassName` pour neutraliser l'`overflow-x-auto` interne.
- `docs/api-docsV4.json` — le contrat. Scratchpad : `diff-spec.cjs`, `spec-head*.json`.

---

## 🔧 Environment & Config

- Windows 11, PowerShell + Bash. Fichiers **CRLF**.
- React 19 + TS + Vite 8 + Tailwind v4 + shadcn/**Base UI**, React Router v7. Aucune bibliothèque de graphiques.
- Serveur de dev sur `:5173` (lancé par l'utilisateur), backend Spring sur `:8080` depuis IntelliJ. Prod Vercel sur `immo.tsiory.tech`.
- Branche courante `feat/activite-prospection`, **8 commits, poussée, en attente de fusion** : `9dcd8a2`, `17ccc1c`, `61dcaf0` (correctif de l'utilisateur), `d840df0`, `6d4eb9e`, `28b22f9`, `b549548`, `7c7c7f7`.
- Branches supprimées récupérables ~30 j : `feat/remise-dossier` = `9e2838a`, `refractor/best-practice` = `fe5a204`.

---

## ⏭️ Next Step
> Attendre la fusion GitHub de `feat/activite-prospection`, puis `node .claude/scripts/git-flow.mjs sync front`. Ne rien commencer d'autre avant.

### Backlog (par priorité)
- [ ] **Vérifier sur données réelles** — rien de la refonte prospection n'a pu l'être : (1) le volet de filtres avancés, et surtout **que le backend accepte bien les paramètres plats** ; (2) le sélecteur de colonnes sur le vrai catalogue — **les `nom` sont supposés égaux aux noms de champs du DTO**, confirmé par l'exemple de la spec sur quatre seulement ; (3) une prospection **réellement transformée** (bandeau, bouton, redirection anti-doublon, badge de catégorie du journal) ; (4) une **pré-prospection** → `ActiviteCard` en « non disponible » ; (5) modifier un prospect sans perdre son indicatif — seul scénario où une erreur **détruirait** une donnée ; (6) le 409 de l'offre de prix (#111).
- [ ] **Demandes backend** (via `from_front.md`) : **la réponse 200 disparue de `GET /api/prospections` (#118)**, trois livraisons sans correction ; un référentiel plat des supports d'origine ; le **tri serveur par `joursInactivite`** (`Pageable.sort` sur un champ de vue, non documenté) — c'est le vrai manque UX « relances » ; les 4 champs `indicatif*` sans springdoc (#109) ; le corps du 409 (#111) ; `?colonnes=`/`filtres` sur `/api/pre-prospections`.
- [ ] **Faire valider les seuils 30 j / 90 j** de la pastille d'inactivité par le métier.
- [ ] **Effets de bord à surveiller** du `min-w-0` sur `SidebarInset` : les autres écrans larges (Dossiers, Encaissements, Articles) n'ont pas de conteneur `overflow-auto` comme les listes de prospection — leur contenu large sera peut-être coupé plutôt qu'étiré.
- [ ] **Champs spec absents de `types.ts`** : `DevisDto.schemaFinancement`, `MontantsOffreDto.commissionPercent`, `ProspectionAutreTrancheDto`, `DossierListItemDto.dateConcretisation`, et surtout **`CreerReglementRequest.statut`/`dateReglement`** — seul écart *fonctionnel*.
- [ ] **Quatre sous-collections de prospection sans écran** : villes, types de bien, profils, catégories. 12 endpoints, fonctions `api.ts` écrites, zéro appelant.
- [ ] Ré-échelonner `--chart-1..5` (#99). Calendrier : ni note ni heure. Audit #3 mobile : 18/27 pages sans breakpoint, **décision de périmètre à prendre**.
- [ ] Nettoyer `ModifierProspectionRequest.trancheId/articleId` (jamais envoyés).
- [ ] 9 erreurs eslint préexistantes (#101).
