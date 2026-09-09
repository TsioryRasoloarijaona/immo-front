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
| 116 | **`MenuGroupContext is missing` — écran blanc à l'ouverture du sélecteur** | Fixed | `DropdownMenuLabel` est un `Menu.GroupLabel` Base UI : il exige un `Menu.Group` parent, j'avais mis un `<div>`. `tsc`, eslint et le build étaient tous verts sur du code qui plantait au premier clic |
| 117 | **La table élargissait la fenêtre entière au lieu de défiler** | Fixed | `min-w-0` sur `SidebarInset` (`Layout.tsx`). Mesuré dans Playwright : sans, la page fait 1534 px pour 1425 ; avec, 1440 pour 1440 et la table défile chez elle |
| 118 | **`GET /api/prospections` n'a plus de réponse 200 documentée** | Open (backend) | Ne déclare qu'un `400`, typé `PageDtoProspectionListItemDto` sous `*/*` alors que sa description dit ProblemDetail. Signature d'un `@ApiResponse(responseCode="400")` sans bloc `content`, qui évince le 200 par défaut. **Une seconde livraison de spec est passée sans le corriger** — personne côté backend ne l'a vu, il faut le signaler explicitement. Rien ne casse à l'exécution ; le contrat de la liste la plus utilisée n'est plus décrit. Même famille que #111 |
| 120 | **La recherche-par-lettre de Base UI volait les frappes du champ du sélecteur** | Fixed | Une seule lettre fermait le menu. Un `onKeyDown` React ne suffit pas : React délègue à la racine, l'écouteur natif que Base UI pose sur le popup s'exécute avant. Écouteur **natif** sur le champ, qui est la cible — `Escape`/flèches/`Entrée`/`Tab` continuent de remonter |
| 119 | **Huit champs de prospection affichés alors qu'ils sont morts** | Fixed | `prix` (4 lignes sur 14 114, et `0` ailleurs), `surface`, `prixJusqua`, `surfaceJusqua`, `avance`, 3× `financement*` : 0 ligne. Retirés de la consultation, **saisie conservée** sur décision de l'utilisateur |

---

## 🔑 Key Points to Remember

- **`GUIDE-FRONT-fiche-prospection.md` est le canal du backend vers le front**, au même titre que `/api-docs`. Il donne les taux de population champ par champ — c'est de là que sortent les décisions d'affichage conditionnel, pas d'une intuition de design.
- **La fiche prospection est ouverte 7 372 fois sur 12 mois, sa liste 270** (journal d'usage du logiciel de bureau, 311 923 ouvertures d'écran). Facteur 27. C'est pourquoi l'enrichissement est parti du détail, et c'est l'arbitrage à refaire pour toute nouvelle demande sur ces écrans.
- **Le lot « listes » est livré** (spec du 09/09 après-midi). `GET /api/referentiels/colonnes/prospections` → `ColonneDto[]` et `GET /api/prospections?colonnes=` existent. **Le catalogue en dur que j'avais écrit est mort en une demi-journée** — c'est l'illustration de pourquoi le serveur en porte un : il est la même source que la liste blanche qui valide le paramètre, les deux ne peuvent pas diverger.
- **Omettre `?colonnes=` n'est pas neutre** : sans lui le backend **n'interroge pas la vue légataire du tout**, et les groupes `ACTIVITE`/`CONVERSION` sont absents de la réponse. C'est ce qui sépare 123 ms de 5 942 ms à la page 250. Sur `ProspectionListItemDto`, `undefined` sur ces champs veut donc dire **« non demandée »**, pas « vide ».
- **On n'envoie le paramètre que si la sélection s'écarte des défauts.** Le paramètre absent produit exactement la réponse par défaut : l'omettre évite une seconde requête au moment où le catalogue finit de charger, la clé de dépendance restant identique avant et après.
- **Les filtres avancés (`FiltresAvancesProspection`, 15 critères) sont déclarés comme un paramètre objet `filtres`, marqué `required: true`.** Les deux sont des artefacts springdoc : Spring lie ce genre d'objet depuis des **paramètres plats** (`?inactiviteMin=30&projetId=a`), et un objet sans champ obligatoire se lie vide. C'est ainsi que le front l'envoie. **Non vérifié sur l'API réelle** (401).
- **`origineSupportId` est le seul des 15 sans écran** : il n'existe pas de référentiel plat des supports, uniquement `/origines-prospection/{id}/supports`. À demander comme endpoint, ou câbler en cascade.
- **`/api/referentiels/entites` est bien `CfgCompany`** — c'est le référentiel du filtre `societeId`, malgré un nom qui évoque `StrEntity`.
- **`?colonnes=` n'existe que sur `/api/prospections`.** Ni `/api/pre-prospections` ni `/api/prospects/{id}/prospections`. Sur l'écran des pré-prospections le catalogue est donc filtré des groupes `ACTIVITE`/`CONVERSION`, qui y seraient vides par construction.
- **Les `nom` du catalogue sont supposés égaux aux noms de champs du DTO** — l'exemple de la spec (`code,prospectNom,joursInactivite,nbInteractions`) le confirme sur quatre. **Non vérifié sur l'endpoint réel (401).** En cas d'écart, la dégradation est douce : rendu générique par `type`, poids par défaut, colonne en fin de tableau — on perd les badges et l'ordre, pas les données. Sauf si le `nom` ne correspond à aucune propriété du DTO, auquel cas la colonne serait vide.
- **`ProspectionListItemDto` fait 53 champs** (20 → 34 → 53 en une journée, tout additif). Le rendu piloté par le `type` du catalogue a tenu : les 19 derniers champs n'ont coûté que des entrées d'`ORDRE`, de `POIDS` et de `CLASSES`, aucun rendu. C'est la justification concrète de ce choix — un `Record<nom, rendu>` exhaustif aurait demandé 19 fonctions.
- **Deux paires « brut » / « avec repli » à ne pas confondre** : `telephone` et `email` appliquent un repli (fiche → numéro de premier contact) et servent à *joindre* ; `mobileProspect` (99,8 %) et `emailFiche` (59,1 %) sont les valeurs brutes de la fiche et servent à *éditer ou dédoublonner*. Ce ne sont pas des doublons.
- **`creePar` n'est renseigné qu'à 34,3 %** : les prospections créées par cette API n'en portent pas (bug backend #41). Une colonne vide y veut dire « créée depuis l'application », pas « auteur inconnu ».
- **`societeId` filtrait déjà les résultats côté serveur** — seules les sociétés actives sont servies — sans avoir jamais été renvoyée. Un filtre invisible qui devient visible.
- **Champs mesurés morts, à ne jamais afficher** : `prix` (4 lignes sur 14 114, `0` — jamais `null` — ailleurs), `surface`, `prixJusqua`, `surfaceJusqua`, `avance`, `financementFondsPropres`, `financementCredit`, `financementAutre`. Et **`cin` vaut 2,7 %, pas 99 %** — la première mesure comptait les non-`NULL` d'une colonne qui porte des chaînes vides. Se méfier des taux à 99 % sur une colonne texte.
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
- **Les trois portes ne rendent rien.** Elles ont toutes été vertes sur un composant qui plantait au premier clic (#116). Pour toute primitive Base UI composée à la main, il faut un rendu réel : le compilateur ne connaît pas les contextes React.
- **Le piège flex de largeur** (#117) : un élément flex d'une **rangée** a `min-width: auto` = la largeur minimale de son contenu. Un tableau large remonte donc jusqu'à l'ancêtre concerné et élargit la page. `overflow` et `min-w-0` posés **plus bas** n'y changent rien — il faut casser la contrainte sur l'élément flex de l'axe concerné, ici `SidebarInset`. Le `min-h-0` déjà présent partout est le pendant vertical du même problème.
- **Le harnais React est la meilleure auto-vérification disponible, et il faut le rejouer pour toute composition Base UI.** Une page Vite temporaire à la racine (`harness-x.html` + `src/harness-x.tsx` important `./index.css`), montant le composant seul avec des données factices, servie par le serveur de dev déjà lancé, pilotée par Playwright. **Supprimer les deux fichiers avant de commiter.** Il a trouvé en une itération ce que trois portes vertes avaient laissé passer : le vol de frappes du menu (#120), et il a validé le volet de filtres (déclencheur `render`, menus imbriqués dans un panneau, compteur, remise à zéro).
- **Le harnais HTML statique** reste utile pour la seule mécanique CSS (chaîne d'ancêtres + `dist/` servi par `vite preview`). Reproduire la chaîne d'ancêtres réelle, servir `dist/` avec `npx vite preview`, charger le **CSS compilé**, puis `browser_evaluate` pour comparer `scrollWidth`/`clientWidth` avec et sans le correctif. Ça teste la mécanique CSS, pas l'écran réel.
- **Aucune vérification authentifiée n'est possible** : pas d'identifiants, Playwright est renvoyé sur `/` (écran de connexion) et **je ne saisis pas de mot de passe**, l'extension Chrome répond mais rend une page d'erreur sur `localhost:5173`. Tout appel anonyme au backend renvoie 401, y compris les référentiels. Les captures Playwright atterrissent **à la racine du dépôt** (non ignorée par git) → **les déplacer dans le scratchpad**.
- **Ordre de publication** : commit → `feature-index add` → `generate` → `push` → attendre la fusion → `sync`. Si `start` refuse pour arbre sale : `git stash push -- <chemins>` → `start` → `stash pop`.
- Cookie `SameSite=Strict` → seul `tsiory.tech` (et localhost) authentifie.

---

## 📁 Important Files & Paths

- `../immo-crm/instructions/GUIDE-FRONT-fiche-prospection.md` — **le guide d'intégration**. Réf. d'implémentation backend : `FEATURE-vues-legacy-prospection.md`.
- `src/components/ActiviteProspection.tsx` — **nouveau**. `InactiviteBadge` (seuils 30/90), `DossierIssuBanner` (bandeau de conversion), `ActiviteCard` (rangs 2-4 + état « non disponible »).
- `src/lib/colonnes.ts` — **nouveau**. Ne porte plus **que** ce que le serveur n'a pas : `ORDRE` (ordre d'affichage), `POIDS` (largeurs), `LIBELLES_GROUPE`, et `useColonnesVisibles` (persistance `localStorage`, clés `ayad.colonnes.prospections` / `.pre-prospections`). **Rien n'est stocké tant que l'utilisateur n'a rien changé**, et « réinitialiser » *efface* l'entrée au lieu d'y écrire les défauts du jour — l'écran suit ainsi le `parDefaut` du serveur, qui évolue (`prix` vient d'en sortir).
- `src/lib/referentiels.ts` — `useColonnesProspections`, le catalogue mis en cache au niveau du module comme les autres référentiels.
- `src/components/ProspectionTable.tsx` — **nouveau**. Tableau partagé par les deux listes. **Rendu générique piloté par le `type` du catalogue**, avec quelques rendus spécifiques (`RENDUS`/`CLASSES`/`TITRES`) : une colonne ajoutée côté serveur s'affiche sans toucher au fichier.
- `src/components/ColumnSelector.tsx` — **nouveau**. Sections par `groupe`, dernière colonne verrouillée, « rétablir les défauts ». `DropdownMenuGroup` obligatoire autour de `DropdownMenuLabel` (#116).
- `src/components/Layout.tsx` — `min-w-0` sur `SidebarInset`. **Touche toute l'application** : n'importe quel contenu large défile désormais dans son propre conteneur au lieu d'étirer la page (#117).
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
- [ ] **Demandes backend à formuler** (via `from_front.md`) : **la réponse 200 disparue de `GET /api/prospections` (#118)** — le plus urgent, c'est le contrat de la liste la plus utilisée ; les 4 champs `indicatif*` sans annotation springdoc (#109) ; le corps réel du 409 de `offre-prix` (#111) ; et **`?colonnes=` sur `/api/pre-prospections`** si on veut y proposer les colonnes d'activité.
- [ ] **Tri serveur par `joursInactivite`** — la colonne existe maintenant en liste, mais `Pageable.sort` sur un champ calculé par la vue n'est pas documenté. C'est le vrai manque UX « relances » : à demander et à vérifier avant de câbler un en-tête cliquable.
- [ ] **Champs spec toujours absents de `types.ts`** : `DevisDto.schemaFinancement`, `MontantsOffreDto.commissionPercent`, `ProspectionAutreTrancheDto`, `DossierListItemDto.dateConcretisation`, et surtout **`CreerReglementRequest.statut`/`dateReglement`** — seul écart *fonctionnel* : impossible de créer un règlement déjà pointé.
- [ ] **Quatre sous-collections de prospection sans écran** : villes, types de bien, profils, catégories. 12 endpoints, fonctions `api.ts` écrites, **zéro appelant**.
- [ ] Ré-échelonner `--chart-1..5` avant toute série catégorielle (#99).
- [ ] Calendrier : ni note ni heure. Demande backend.
- [ ] Audit #6 — chips de filtres actifs. Audit #3 — mobile : 18/27 pages sans breakpoint, **décision de périmètre à prendre**.
- [ ] Nettoyer `ModifierProspectionRequest.trancheId/articleId` (jamais envoyés).
- [ ] 9 erreurs eslint préexistantes (#101).
