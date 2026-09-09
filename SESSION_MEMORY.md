# Session Memory
_Last updated: 2026-09-09T16:20:00Z_
_Project: crm-prototype (Ayad Estate — CRM frontend), C:\Users\tsiory\Documents\ayad-internship\prototype\crm-prototype_

---

## 🎯 Current Objective
Consommer au fil de l'eau les endpoints V4 que le backend livre, **en rediffusant systématiquement la spec avant d'écrire une ligne de front**, et corriger les bugs UX rencontrés en chemin. Dernier livré : les trois lots de `GUIDE-FRONT-fiche-prospection.md` — panneau d'activité sur la fiche, journal enrichi, sélecteur de colonnes des listes.

---

## ✅ What Worked

1. **Le backend écrit désormais un guide d'intégration front.** `immo-crm/instructions/GUIDE-FRONT-fiche-prospection.md` — état réel des endpoints, ordre d'affichage recommandé avec **taux de population par champ**, pièges à ne pas reproduire, contrat des lots à venir. **Le lire avant de planifier** : il a inversé le sens de la demande de cette session (voir What Failed).
2. **Le diff structurel de la spec avant toute écriture front**, contre `HEAD` et jamais l'arbre de travail. Script réutilisable `scratchpad/diff-spec.cjs`. Il a rattrapé une rupture de contrat sur du code déjà fusionné (bug #107).
3. **`tsc -b --force` est le balayage exhaustif** après suppression d'un champ ou refactor transverse. **Ne jamais faire confiance au grep pour ça.**
4. **Confronter la spec au code par script plutôt qu'à l'œil.** Un `node -e` comparant les clés de `components.schemas.X.properties` aux champs déclarés dans `types.ts` a sorti en une commande les 4 champs manquants de `ProspectionDetailDto` et confirmé que `ProspectionListItemDto` était complet. À rejouer à chaque `docs:update`.
5. **Chercher les champs typés sans consommateur.** `grep` sur un nom de champ de `types.ts` répond « déclaré mais jamais lu » — c'est ainsi qu'on a trouvé le filtre Tranche sans colonne Tranche.
6. **Vérifier la prémisse de l'utilisateur avant de coder.** Payant à chaque fois.

---

## ❌ What Failed / Course-corrections

- **Avoir proposé d'ajouter des colonnes en dur à la liste.** L'analyse (filtre Tranche sans colonne Tranche) était juste, la conclusion fausse : le guide §4 montre que les colonnes manquantes le sont **par décision mesurée** — servir toutes les colonnes coûte **5 942 ms à la page 250 contre 123 ms sur huit colonnes**. La bonne réponse était le **sélecteur** du §5, pas des colonnes en dur. Leçon : quand un manque est aussi évident, chercher d'abord pourquoi il n'a pas déjà été comblé.
- **Diff contre la mauvaise base → conclusion inverse** (session précédente). La vraie base est toujours `git show HEAD:docs/api-docsV4.json` ; l'utilisateur lance `docs:update` **avant** de le dire, donc le `git status` de début de session ment.
- **Une mise à jour de `SESSION_MEMORY.md` non commitée est perdue au changement de branche.** **Commiter la mémoire avec le reste.**
- **Le heredoc ne se contente pas de corrompre : il peut bloquer** (`exit 143`). Fichier `.cjs` écrit avec Write puis `node`.
- **PowerShell `>` ré-encode** (UTF-16/BOM). Passer par le Bash tool pour extraire une base de diff.
- **`*/` dans un commentaire JSDoc ferme le bloc.** Reformuler.
- **Commentaire JSX `{/* */}` entre deux attributs** → `TS1005`. Valide uniquement en position d'enfant.
- **`feature-index.mjs add` avant le commit** → « Nothing to record » (il lit `main..HEAD`).

---

## 🐛 Bugs & Errors Log

| # | Error / Bug | Status | Fix applied |
|---|-------------|--------|-------------|
| 90-98 | Sessions antérieures (pièces jointes, KPI, redirection, session expirée, note d'interaction, hotline par nom) | Fixed | PR #12 à #18 |
| 99 | `--chart-1..5` échoue la validation catégorielle dans les deux thèmes | Open (constat) | Contourné : une seule teinte pour les marques KPI |
| 100 | `workflowDescription \|\| statutDescription` masque le statut | Open (différé) | Choix de l'utilisateur |
| 101 | 9 erreurs eslint préexistantes | Open | 8× `react-refresh/only-export-components` + 1× `set-state-in-effect` |
| 102-104 | Colonnes contact/relance, confirmation de visite, `emailEnvoye` | Fixed | PR #19, #20, #17 |
| 105 | Prod : `ERR_CONNECTION_TIMED_OUT` sur les chunks | Fixed (hors code) | DNS de la box. Passer sur 1.1.1.1 ou 8.8.8.8 |
| 106 | Écran blanc quand un chunk de page ne se charge pas | Fixed | PR #21 — `RouteErrorBoundary` |
| 107 | `ResultatEnvoiVisiteDto` restructuré → composant fusionné en #20 cassé | Fixed | PR #22 |
| 108 | Numéros sans indicatif → `NUMERO_INEXPLOITABLE` sur WhatsApp | Fixed | PR #23 — `TelephoneField` |
| 109 | 4 champs `indicatif*` livrés **sans annotation springdoc** | Open (backend) | Viole la règle 10 du projet |
| 110 | Offre de prix après visite sans consommateur front | Fixed | PR #24 — `OffrePrixSection` |
| 111 | Forme du corps du 409 sur `offre-prix` invérifiable | Open (constat) | On lit `ApiError.message`, jamais la structure |
| 112 | Deux gardes de conversion mortes depuis toujours | Fixed | `9dcd8a2` — repointées sur `activite.dossierId` |
| 113 | **4 champs de `ProspectionDetailDto` jamais reflétés dans `types.ts`** (`trancheCode`, `trancheDescription`, `articleCode`, `articleDescription`) | Fixed | Lot A. La fiche n'avait que les identifiants et laissait l'onglet Article seul à nommer le lot |
| 114 | **Filtre « Tranche » sans colonne Tranche** — `trancheCode`/`trancheDescription` typés sur `ProspectionListItemDto`, zéro consommateur | Fixed | Lot C : colonne cochable dans le sélecteur, plutôt qu'en dur |
| 115 | **Les 8 champs ajoutés à `InteractionDto` en `9dcd8a2` n'avaient aucun consommateur** | Fixed | Lot B |

---

## 🔑 Key Points to Remember

- **`GUIDE-FRONT-fiche-prospection.md` est le canal du backend vers le front**, au même titre que `/api-docs`. Il donne les taux de population champ par champ — c'est de là que sortent les décisions d'affichage conditionnel, pas d'une intuition de design.
- **La fiche prospection est ouverte 7 372 fois sur 12 mois, sa liste 270** (journal d'usage du logiciel de bureau, 311 923 ouvertures d'écran). Facteur 27. C'est pourquoi l'enrichissement est parti du détail, et c'est l'arbitrage à refaire pour toute nouvelle demande sur ces écrans.
- **Le sélecteur de colonnes ne fait rien côté réseau pour l'instant.** `?colonnes=` **n'existe pas** et sera **ignoré** ; `GET /api/referentiels/colonnes/prospections` non plus. Le catalogue est donc en dur dans `src/lib/colonnes.ts`, **à la forme exacte du futur référentiel** (`nom`/`libelle`/`groupe`/`type`/`parDefaut`) + deux ajouts front documentés (`champs`, `poids`). Ne **jamais** conditionner l'affichage à la prise en compte du paramètre (guide §5), et ne **jamais** charger large pour filtrer côté client (§5.4.3).
- **Quand `?colonnes=` arrivera** : envoyer `colonnes.flatMap((c) => c.champs)`, et rendre optionnels les champs de `ProspectionListItemDto` — **déjà le cas**, `id` excepté, donc rien à faire.
- **`ProspectionDetailDto.activite` vaut `null` en entier sur une pré-prospection** (la vue les exclut : 3 817) **et sur les 4 prospections créées par l'application** (pas de `StrEntityId`, guide §7). L'absence du bloc signifie **« non disponible »**, jamais « zéro ». En revanche, *à l'intérieur* d'un bloc présent, `nbVisites: 0` veut bien dire « aucune visite ».
- **Seuils de la pastille d'inactivité : 30 j / 90 j, proposés par le guide et NON validés par le métier.** Le backend n'en impose aucun. Ils vivent en un point unique : `SEUIL_INACTIVITE_TIEDE`/`_FROID` dans `ActiviteProspection.tsx`.
- **`--warning` est le rouge (#b02012) et `--amber` l'orange (#92580a)** — la correspondance avec un vert/orange/rouge n'est pas celle que les noms laissent croire.
- **`InteractionDto.categorie` n'est badgé que lorsqu'il diffère de `'Prospection'`.** Renseigné à 100 %, mais c'est la valeur ordinaire (46 666 lignes sur 48 160) : la montrer partout serait 20 fois le même mot par page. Même règle pour la tranche de l'interaction, affichée seulement si elle diffère de celle de la prospection. **À revoir sur une prospection réellement transformée** — seul cas où le fil peut mélanger les catégories, invérifiable d'ici.
- **`categorieId` ≠ `resultatId`** : le second est la sous-catégorie.
- **Pas de filtre sur le journal** : `GET /api/prospections/{id}/interactions` ne prend que la pagination. Un filtre client sur une page de 20 mentirait sur le total.
- **`activite.dossierId` est `null` sur 98 %** — taux de conversion réel (358 dossiers pour 14 118 prospections), pas une donnée manquante.
- **Deux envois à deux canaux, à ne pas confondre :** *confirmation de visite* (99 % de numéros, 57 % d'emails, plans par email seulement) et *offre de prix* (**19,7 % d'emails contre 99,7 % de numéros**, 409 majoritaire car le montant vient du lot, renseigné sur 7 % des prospections d'étape 4). **`offreId`/`offreCode` sont toujours renseignés : ne jamais conditionner leur affichage à `envoye`.** Les 57 %/99 % écrits dans `CanalEnvoiDto` sont ceux de la visite.
- **`remisePercent` est un pourcentage (5 = 5 %)**, contrairement à `DossierDetailDto.discount` qui est un ratio. **`remisePercent: 0` n'est pas neutre** : il force une renumérotation. Champs vides = champs **omis**.
- **`InteractionDto` : on écrit dans `description`, on lit dans `note`.** Le `description` renvoyé est un tampon `JJ/MM/AAAA HH:MM auteur`.
- **Chaînes vides déjà normalisées en `null` par le backend** (verrouillé par un test) : un simple test de nullité suffit, inutile d'ajouter `=== ''`.
- **Indicatifs téléphoniques** : le front ne recompose rien. Le formulaire d'édition **reconduit explicitement** les indicatifs, sinon une modification les effacerait.
- **La nav se modifie à trois endroits** : `modules.ts`, `App.tsx`, `Layout.tsx`.
- **Le seuil de re-sonde de session (60 s) doit rester au-dessus du TTL du cache GET (30 s)** dans `api.ts`.
- **Portes de validation** : `npx tsc -b --force` (le `--force` est obligatoire), `npx eslint src` → **doit rester à 9**, `npm run build`, plus `npm run check:contrast` si on touche aux couleurs.
- **Aucune vérification authentifiée n'est possible** : pas d'identifiants, extension Chrome non connectée, Playwright sans session, 401 sur tout appel anonyme. Repli : harnais HTML statique servi en HTTP. Les captures atterrissent à la racine du dépôt → **les déplacer**.
- **Ordre de publication** : commit → `feature-index add` → `generate` → `push` → attendre la fusion → `sync`. Si `start` refuse pour arbre sale : `git stash push -- <chemins>` → `start` → `stash pop`.
- Cookie `SameSite=Strict` → seul `tsiory.tech` (et localhost) authentifie.

---

## 📁 Important Files & Paths

- `../immo-crm/instructions/GUIDE-FRONT-fiche-prospection.md` — **le guide d'intégration**. Réf. d'implémentation backend : `FEATURE-vues-legacy-prospection.md`.
- `src/components/ActiviteProspection.tsx` — **nouveau**. `InactiviteBadge` (seuils 30/90), `DossierIssuBanner` (bandeau de conversion), `ActiviteCard` (rangs 2-4 + état « non disponible »).
- `src/lib/colonnes.ts` — **nouveau**. `COLONNES_PROSPECTION` (12 colonnes, 9 par défaut) + `useColonnesVisibles` (persistance `localStorage`, clés `ayad.colonnes.prospections` / `.pre-prospections`). **L'ordre du tableau est l'ordre d'affichage**, pas celui des sections du sélecteur.
- `src/components/ProspectionTable.tsx` — **nouveau**. Tableau partagé par les deux listes (supprime la duplication) ; `CELLULES`/`CLASSES`/`TITRES` indexés par nom de colonne ; largeurs calculées depuis `poids`.
- `src/components/ColumnSelector.tsx` — **nouveau**. Sections par `groupe`, dernière colonne verrouillée, « rétablir les défauts ».
- `src/types.ts` — `ActiviteProspectionDto` (19 champs) ; `ProspectionDetailDto.activite` + les 4 champs `tranche*`/`article*` ; `InteractionDto` +8 champs.
- `src/pages/prospections/ProspectionDetail.tsx` — pastille + nb d'interactions dans l'en-tête, bandeau de conversion, `ActiviteCard` en tête de l'aperçu, Tranche/Article dans les détails, journal enrichi. `dossierIssu`/`joursInactivite`/`nbInteractions` **hoistés** (le narrowing d'un `p.activite?.x` testé en JSX ne survit pas au closure d'un `onClick`).
- `src/pages/prospections/{ProspectionsList,PreProspectionsList}.tsx` — `ProspectionTable` + `ColumnSelector`.
- `docs/api-docsV4.json` — le contrat. **Le diffuser contre `HEAD` avant toute écriture front.**
- `../FEATURES.md` — index dérivé du code.

---

## 🔧 Environment & Config

- Windows 11, PowerShell + Bash. Fichiers **CRLF**.
- React 19 + TS + Vite 8 + Tailwind v4 + shadcn/Base UI, React Router v7. **Aucune bibliothèque de graphiques.**
- Backend Spring sur `:8080`, lancé depuis IntelliJ. Prod Vercel sur `immo.tsiory.tech`.
- Deux branches supprimées restent récupérables ~30 j : `feat/remise-dossier` = `9e2838a`, `refractor/best-practice` = `fe5a204`. `git branch <nom> <sha>`.

---

## ⏭️ Next Step
> Pousser `feat/activite-prospection` et **attendre la fusion GitHub**. Une fois confirmée : `node .claude/scripts/git-flow.mjs sync front`.

### Backlog (par priorité)
- [ ] **Vérifier sur données réelles** — rien de cette session n'a pu l'être : (1) une prospection **réellement transformée** → bandeau de conversion, bouton « Ouvrir le dossier », redirection anti-doublon de `NewDossier`, **et** le badge de catégorie du journal, dont la règle « ≠ Prospection » repose sur une hypothèse ; (2) une **pré-prospection** → `ActiviteCard` en « non disponible », aucun « 0 » affiché ; (3) le sélecteur de colonnes : persistance après rechargement, colonne Tranche réellement peuplée, dernière colonne verrouillée ; (4) modifier un prospect sans perdre son indicatif — seul scénario où une erreur **détruirait** une donnée ; (5) offre de prix : le 409 sans lot et la forme de son corps (#111) ; (6) `/performances` et `/mes-performances` ; (7) hotline par nom accentué ; (8) session expirée.
- [ ] **Faire valider les seuils 30 j / 90 j de la pastille d'inactivité** par le métier. Aucune source ne les fonde aujourd'hui.
- [ ] **Demandes backend à formuler** (via `from_front.md`) : les 4 champs `indicatif*` sans annotation springdoc (#109) ; le corps réel du 409 de `offre-prix` (#111) ; et surtout **le lot « listes »** — `?colonnes=` + `GET /api/referentiels/colonnes/prospections`, sans quoi `joursInactivite` ne peut pas devenir un critère de tri des relances, qui est le vrai manque UX.
- [ ] **Champs spec toujours absents de `types.ts`** : `DevisDto.schemaFinancement`, `MontantsOffreDto.commissionPercent`, `ProspectionAutreTrancheDto`, `DossierListItemDto.dateConcretisation`, et surtout **`CreerReglementRequest.statut`/`dateReglement`** — seul écart *fonctionnel* : impossible de créer un règlement déjà pointé.
- [ ] **Quatre sous-collections de prospection sans écran** : villes, types de bien, profils, catégories. 12 endpoints, fonctions `api.ts` écrites, **zéro appelant**.
- [ ] Ré-échelonner `--chart-1..5` avant toute série catégorielle (#99).
- [ ] Calendrier : ni note ni heure. Demande backend.
- [ ] Audit #6 — chips de filtres actifs. Audit #3 — mobile : 18/27 pages sans breakpoint, **décision de périmètre à prendre**.
- [ ] Nettoyer `ModifierProspectionRequest.trancheId/articleId` (jamais envoyés).
- [ ] 9 erreurs eslint préexistantes (#101).
