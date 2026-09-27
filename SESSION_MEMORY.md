# Session Memory
_Last updated: 2026-09-28 (session du 28/09 : filtre Archivé + période par défaut « mois courant » sur les listes)_
_Project: crm-prototype (Arpent — CRM immobilier), C:\Users\tsiory\Documents\ayad-internship\prototype\crm-prototype_

---

## 🎯 Current Objective

**Petites features front à la demande, une PR par lot**, dans la boucle
habituelle : demande → diff spec (structurel, contre HEAD) → AskUserQuestion
avant la branche → implémenter → build+lint → commit+push → l'utilisateur
fusionne → sync. Deux lots le 23/09, **tous deux fusionnés** :
`feat/creation-pre-prospection` (PR #73 côté front) puis `feat/suivi-actions`
(5 itérations sur la même PR). `main` = `c37a7ff`.

**Lot du 24/09 (1) : `fix/dashboard-pipeline`** — fusionné (PR #64),
`main` = `d54490f`, branche locale supprimée.

**Lot du 24/09 (2) : `feat/desarchiver-prospection`** — fusionné (PR #65),
`main` = `55f806b`.

**Lot du 25/09 (1) : `feat/doublons-prospect-projet`** — fusionné (PR #66),
`main` = `c59a1c5`. Le snapshot spec a voyagé sur la branche (stash → start
→ pop) au lieu d'être commité sur `main`, sur décision de l'utilisateur.

**Lot du 25/09 (2) : `feat/cles-api`** — fusionné (PR #67), `main` =
`ba4353e`. Snapshot spec sur la branche, même mécanique. Le « clic création
→ login » venait de la base d'**écriture** (`yesRems`) sans la table
`AppApiClient` : 500 non géré → forward `/error` → 401 → déconnexion.
Migration 011 appliquée par l'utilisateur, résolu.

**Lot du 25/09 (3) : `feat/suivi-action-detail-hotline`** (front seul, sans
changement de spec) — fusionné en **deux PR** : #68 (`db9af14`, partie avant
le dernier push) puis #69 (`12d3953`, correctif `5af5712` « hotline par
numéro seulement » + mémo). `main` = `12d3953`.

**Lot du 28/09 : `feat/filtre-archive-periode-mois`** (front seul, sans
changement de spec) — filtre « Archivé : Non / Oui / Tous » (défaut Non) sur
Prospections et Pré-prospections, et période par défaut = mois courant sur
les cinq listes à période. Poussé, **PR à fusionner**.

**Reliquats** : la branche locale + distante `feat/desarchiver-prospection`
porte un commit de mémo (`1b97322`) jamais fusionné ; `git branch -d`
refuse. L'utilisateur décide (drop ou petite PR). La branche locale
`feat/suivi-action-detail-hotline` est entièrement fusionnée mais `sync`
(lancé depuis `main`) ne l'a pas supprimée : `git branch -d` à la main.

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
11. **(25/09) Trouver la vraie base d'un backend qui tourne, sans ses env
    vars** : `sqlcmd` (ODBC 17, creds de `src/test/resources/application.
    properties`) + `sys.dm_exec_sessions` filtré sur `program_name LIKE
    '%JDBC%'` → base par pool (5 sessions = pool d'écriture `yesRems`, 10 =
    lecture `yesRemsProd`). Puis `OBJECT_ID('dbo.X','U')` par base. Lecture
    seule, décisif en 3 requêtes.
12. **Un 401 sur un seul POST alors que le GET passe = 500 déguisé** :
    `GlobalExceptionHandler` sans catch-all → `sendError(500)` → forward
    `/error` → chaîne de sécurité sans contexte → 401 → le front déconnecte.
    Mécanisme décrit dans le commentaire de `SecurityConfig` (bug 403→401
    de `4642aa2`).
13. **Mémo sur la branche en attente plutôt que `main`** : `git checkout
    <branche>` → éditer → `git-flow commit` → `push`, le mémo suit la PR.
14. **`sqlcmd` ne s'authentifie que via `-S localhost,49687 -U tsix -C`** ;
    le mot de passe se lit du fichier de test au moment de l'appel, jamais
    tapé ni imprimé.
15. **(28/09) Un défaut de filtre se pose dans la fonction « état vide »,
    pas dans l'écran** : `emptyProspectionFilters()` rend le mois courant et
    `archive: 'non'` → l'état initial, « Réinitialiser » et
    `hasActiveProspectionFilters` suivent sans une ligne de plus.

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
- **(25/09) PR fusionnée avant le dernier push** → le commit reste orphelin
  sur la branche ; `sync` refuse de la supprimer. Toujours vérifier
  `git log main..<branche>` après un « merged » avant d'annoncer la fin.
  Solution : seconde PR depuis la même branche (le compare ne montre que
  le commit manquant).
- **`git branch -d feat/desarchiver-prospection`** refuse : un commit de
  mémo poussé après la fusion de la PR #65. Pas supprimé (décision
  utilisateur en attente).
- **`docker ps` / `/actuator/info`** : Docker Desktop arrêté, actuator
  muet — le backend tourne hors conteneur ; ce sont les sessions SQL qui
  ont dit sur quelle base (What Worked #11).
- **Hypothèse « AdmUser NOT NULL sans défaut »** pour le 401 de création :
  fausse (seuls `PKey`, `Code`). La bonne piste était la table absente sur
  la base d'écriture.
- **(28/09) `new Date(y, m, 1).toISOString().slice(0, 10)`** → recule d'un
  jour à l'est de Greenwich (date locale convertie en UTC). Toujours
  `jourISO` / `debutMoisISO` / `finMoisISO` de `lib/format.ts`.

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
| 180 | Pas d'endpoint « désarchiver » | Fixed (24/09) | `PATCH /api/prospections/{id}/desarchiver` câblé : menu de ligne + bouton fiche |
| 181 | Mode groupé : lignes d'un groupe déplié non rafraîchies après mutation | Open (limite documentée) | — |
| 182 | Import CSV : le tableau rend jusqu'à 5 000 lignes d'un bloc | Open (à surveiller) | Filtre par statut ; virtualiser si lent |
| 183 | Suivi des actions : pas de référentiel `ComActionMessageCategory` → pas de filtre Catégorie | Open (backend) | Filtre de colonne client-side de la grille |
| 184 | `ActionDetailDialog` ne montre que les colonnes demandées à la liste (pas d'endpoint de détail par action) | Open (limite documentée) | — |
| 185 | Dashboard : couloirs Pré-prospection / À traiter / Prospections vides depuis le 20/09 — `sort=dateDocument,desc` (champ DTO) → 400 « Propriété de tri invalide », avalé car seul `data` était lu | Fixed (24/09) | `sort: ['docDate,desc','id,asc']` (propriété d'entité) ; `KanbanColumn` reçoit `error` et l'affiche en rouge avec compte `—` |
| 186 | `/cles-api` : clic « Créer la clé » → redirection login. La base d'**écriture** `yesRems` n'avait pas `AppApiClient` (migration 011 appliquée sur `yesRemsProd`/`Test` seulement) ; GET lisait `yesRemsProd`, POST écrivait `yesRems` | Fixed (25/09, hors front) | L'utilisateur a appliqué `011_AppApiClient.sql` sur `yesRems` |
| 187 | Backend : aucun `@ExceptionHandler(Exception.class)` → tout 500 sur route authentifiée devient 401 (forward `/error`) et le front **déconnecte** au lieu d'afficher l'erreur | Open (backend) | À remonter : catch-all ProblemDetail 500 dans `GlobalExceptionHandler` |
| 188 | PR #68 fusionnée avant le push de `5af5712` (hotline par numéro seulement) : `main` cherchait encore par nom en repli | Fixed (28/09) | Seconde PR #69 fusionnée, `main` = `12d3953` |
| 189 | `ActionDetailDialog` : `tiersId` n'était pas demandé à la liste → impossible de charger la fiche de la personne | Fixed (25/09) | `tiersId` ajouté à `CLES_OUVERTURE_SUIVI_ACTION` |
| 190 | Offres : préréglage « Le mois en cours » décalé d'un jour (31/08 → 29/09) à l'est de UTC — `isoDate` passait par `toISOString()` | Fixed (28/09) | `isoDate` = `jourISO` (heure locale) |
| 191 | La recherche par nom est bornée à la période affichée : un prospect d'un mois passé ne sort pas tant que les dates ne sont pas vidées | Open (conséquence assumée) | Bouton « Toutes les périodes » dans l'état vide |

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

### Lot du 24/09 (2) — `feat/desarchiver-prospection` (PR ouverte)
- Spec : `PATCH /api/prospections/{id}/desarchiver` sans corps → 200
  `ProspectionDetailDto`, 404, **409 si pas archivée**. Seul `fermee` change :
  `dateFermeture` / `raisonFermeture*` **conservés** (88 prospections ouvertes
  en prod en portent), relances non réarmées. `archiver` désarme désormais les
  relances (contrat inchangé). `/kpi/commerciaux/moi` : descriptions seules.
- **« Archivée » se lit sur `fermee`, jamais sur `dateFermeture`** — déjà le
  cas partout (grep 24/09) avant ce lot.
- Menu de ligne (`ActionsLigneProspection`) : « Désarchiver » réel à la place
  de l'item grisé « Bientôt », sans boîte (toast + `onMutation`).
- Fiche (`ProspectionDetail`) : bouton « Désarchiver » (`ArchiveRestore`)
  quand `fermee` ; bloc clôture affiché si `fermee || dateFermeture`, libellé
  « Date d'archivage » / « Dernier archivage » ; condition `!isPre` retirée
  (l'app sait archiver une pré-prospection, la donnée décide).
- `sync front` n'a pas supprimé `fix/dashboard-pipeline` (lancé depuis
  `main`) → `git branch -d` à la main.

### Lot du 25/09 (1) — `feat/doublons-prospect-projet` (fusionné, PR #66)
- Spec (+2 routes, 158 → 160) : `GET /api/prospects/doublons` (nom, prenom,
  raisonSociale, telephone, mobile, email → `ProspectDoublonDto[]` avec
  `criteres` ∈ NOM/TELEPHONE/EMAIL ; vide = rien ; 400 si aucun critère
  exploitable) et `POST /api/pre-prospections/{id}/lier-prospect`
  (`{ prospectId }`, 400 si déjà un prospect, 409 `prospectionExistante`).
  `CreerProspectRequest.ignorerDoublons?: boolean`.
- **Cassant** : `POST /api/prospects` et `creer-prospect` → **409
  `doublons`** sur tout homonyme (237 groupes sur 244 en prod) sauf
  `ignorerDoublons: true`. `POST /api/prospections`, `transformer`,
  `tranche-principale` (seulement si le projet change) → **409
  `prospectionExistante`** = le prospect a déjà une prospection **ouverte**
  sur ce projet (une fermée ne bloque pas).
- Deux lecteurs dans `api.ts` : `doublonsDepuisErreur(err)` et
  `prospectionExistanteDepuisErreur(err)` — `null` pour toute autre erreur
  (un 409 sans le champ reste une phrase). Ils reposent sur
  `ApiError.problem`, déjà là depuis les transitions de statut.
- Deux composants partagés : `DoublonsProspectPanel` (amber — une question,
  pas une erreur ; badge par critère, NOM en `amber`, TELEPHONE/EMAIL en
  `warning` ; lien fiche en nouvel onglet ; bouton de ligne dont le verbe
  dépend de l'écran ; « Nouveau contact » = renvoi avec `ignorerDoublons`)
  et `ProspectionExistanteNotice` (info — une redirection ; lien « Ouvrir la
  prospection », `detail` du ProblemDetail comme message).
- Écrans : `CreateProspectForm` (« Rattacher » → `lier-prospect`, qui peut
  lui-même 409 `prospectionExistante`), `NewProspect` (« Ouvrir la fiche » →
  navigate), `NewProspection` (« Choisir » → bascule en mode « existant »
  avec la fiche ; **après un `createProspect` réussi on bascule aussi** pour
  qu'un second clic ne recrée pas la fiche si la prospection 409),
  `TransformerProspectionDialog` (sert la fiche et le menu de ligne),
  picker tranche de `ProspectionDetail`.
- Piège évité : `onClick={handleCreate}` passerait l'événement comme
  `ignorerDoublons` (truthy) — toujours `() => handleCreate(false)`.
- Non fait (optionnel dans la FEATURE §5) : appel de `/doublons` à la volée
  pendant la saisie. Le 409 couvre le besoin ; à ajouter si l'utilisateur
  veut être prévenu avant de cliquer.

### Lot du 25/09 (2) — `feat/cles-api` (fusionné, PR #67)
- **Diagnostic #186** : lecture + écriture sur deux bases
  (`DataSourceConfig`, routage sur `readOnly`) ; la table manquait sur la
  base d'écriture seulement. La FEATURE §8 dit « appliquer 011 sur chaque
  base servie » — la locale d'écriture avait été oubliée. Le front n'avait
  rien à changer.
- Spec (+3 routes, 160 → 163, **rien de modifié**) : `GET/POST
  /api/cles-api`, `POST /api/cles-api/{id}/regenerer`, `DELETE
  /api/cles-api/{id}` — rôle Administrateur (403 sinon). Schémas `CleApiDto`
  (jamais le secret, `clePrefixe` = `ak_` + 8), `CleApiCreeeDto` (`cleApi` +
  `cle` en clair **une seule fois**, création et régénération seulement),
  `CreerCleApiRequest` (`nom`, `portees` ⊂ PRE_PROSPECTIONS_ECRIRE /
  PRE_PROSPECTIONS_LIRE / REFERENTIELS_LIRE, `compteCode?`). Nouveau
  `securitySchemes.cleApi` (`X-Api-Key`) — sans effet sur le front, qui
  reste sur le cookie.
- Écran `/cles-api` (`pages/utilisateurs/ClesApiList`) sur le patron
  `UtilisateursList` : `AdminGuard` + `DataGrid` (nom + préfixe, portées en
  badges, compte de service, statut Active/Révoquée avec qui/quand, dernier
  usage, création). **Pas de pagination ni recherche serveur** : l'endpoint
  renvoie tout, la ligne de filtres du grid suffit ; seul filtre d'écran :
  statut. Entrée sidebar « Clés d'API » (icône `Bot`) + `moduleForPath`.
- `CreerCleApiDialog` : nom, cases à cocher des portées (préréglage n8n
  coché : écrire pré-prospections + lire référentiels, `lib/clesApi.ts`),
  `compteCode` en champ libre (pas un sélecteur : rattacher un compte
  humain lui transmettrait son périmètre, la FEATURE le déconseille).
- `SecretCleApiDialog` : le secret avec bouton copier, une seule fois,
  après création **et** après régénération (même boîte, `mode`). La boîte
  de secret remplace celle de création sans repasser par la liste.
- Régénérer et révoquer passent par `useConfirm` (irréversibles) ; révoquée
  → plus d'actions sur la ligne, elle reste listée pour l'audit.
- `libellePortee` traduit le code en libellé métier ; `valeur` sur la
  colonne pour que le filtre du grid cherche le libellé, pas le code.

### Lot du 25/09 (3) — `feat/suivi-action-detail-hotline` (PR #68 fusionnée sans `5af5712` ; seconde PR à fusionner)
- Demande : le détail d'une action du suivi était illisible (valeurs
  `truncate`), sans téléphone ni email, et il fallait un bouton « Voir
  hotline » ouvrant le même résultat que la page Hotline.
- **`SuiviActionDto` ne porte pas les coordonnées** et le back est hors
  périmètre : `tiersId` ajouté à `CLES_OUVERTURE_SUIVI_ACTION`
  (`lib/dispositions.ts`), et `ActionDetailDialog` charge
  `getProspect(tiersId)` à l'ouverture (mobile d'abord, sinon téléphone,
  `formatTelephone` + lien `tel:` ; email en `mailto:`).
- Rendu du résultat hotline **extrait** de `pages/hotline/Hotline.tsx` vers
  `components/HotlineResultat.tsx` (`FicheCard`, lignes dépliables, carte
  d'en-tête, avis `tronque`, appels sans fiche). `onCreerFiche` optionnel :
  seul la page le passe. La page ne garde que le formulaire.
- `components/HotlineResultDialog.tsx` : `Modal` 960, `rechercherHotline`
  par `CritereHotline`, pied « Ouvrir la hotline ». Ouvert **par-dessus**
  le détail (Dialog imbriqué, Base UI le supporte).
- Critère du bouton : **le numéro seulement, jamais le nom** (décision
  utilisateur, 2e itération) — sans numéro le bouton est désactivé avec un
  `title` qui dit pourquoi ; désactivé aussi tant que la fiche charge.
- Détail réorganisé : bloc Personne en tête (avatar, nom, code, type, badges,
  coordonnées, boutons « Fiche » et « Voir hotline »), message étiqueté,
  sections en `dl` libellé/valeur avec `break-words`, deux sections côte à
  côte en `md`. Largeur 640 → 720.

### Lot du 28/09 — `feat/filtre-archive-periode-mois` (PR à fusionner)
- Demande : « rajoute le filtre archive oui / non par défaut non, puis pour
  l'affichage dans toutes les sections met la date par défaut ce mois ».
  Tranché par AskUserQuestion : **toutes les listes à période**, forme
  **Non / Oui / Tous**.
- **Filtre Archivé** : remplace « Ouvertes / Clôturées / Toutes ». État
  `archive: 'non'|'oui'|'tous'` (ex-`ouvertes`), traduit par
  `ouvertesDepuisArchive` (`lib/domain.tsx`) : non → `ouvertes=true`, oui →
  `false`, tous → absent. **Rien ne change sur le fil.** Libellés
  « Archivé : Non » etc. — le déclencheur n'affiche que la valeur.
- **Période par défaut = mois entier** (1er → dernier jour, heure locale) sur
  Prospections, Pré-prospections, Dossiers (date de réservation),
  Encaissements (date pièce), Offres (préréglage `mois-courant`). Le Suivi
  des actions garde 1er → aujourd'hui. « Réinitialiser » revient au mois.
- **`hasActiveFilters` compare les dates au défaut, pas au vide** : vider les
  dates est un filtre actif.
- **État vide** : sans filtre actif → « Rien ce mois-ci » + bouton « Toutes
  les périodes » (vide les deux dates) ; l'ancien « n'est encore
  enregistré(e) » aurait menti.
- **Vocabulaire** : badge « Clôturée » → « Archivée » aux cinq endroits
  (table, aperçu, hotline, fiche prospection, fiche prospect).
- **`/prospections?periode=toutes`** : lu une fois à l'ouverture par
  `ProspectionsList`, ouvre sans borne de date. Utilisé par le lien « Toutes
  les prospections » du Dashboard (arriéré des relances). Les autres listes
  ne lisent pas ce paramètre.
- Dashboard non touché par ailleurs (couloirs et KPI sans borne de période).

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
- Portes : `npm run build` (tsc+vite) ✓ · eslint = **10** ✓ (28/09, lot
  filtre Archivé + période). Pas de navigateur depuis la session —
  validation visuelle par l'utilisateur (faite pour les PR #66, #67, #68 ;
  **à faire** pour le lot du 28/09 et pour le correctif `5af5712` : bouton
  « Voir hotline » désactivé sans numéro).

---

## 📁 Important Files & Paths

- `src/lib/format.ts` — **28/09** : `jourISO`, `debutMoisISO`, `finMoisISO`
  (heure locale) — la période par défaut des listes.
- `src/lib/domain.tsx` — **28/09** : `ProspectionFilterBarState.archive`,
  `emptyProspectionFilters()` = défauts (mois courant, archive non),
  `ouvertesDepuisArchive`.
- `src/components/ProspectionFilterBar.tsx` — **28/09** : sélecteur Archivé.
- `src/pages/prospections/ProspectionsList.tsx`, `PreProspectionsList.tsx`,
  `OffresList.tsx`, `src/pages/dossiers/DossiersList.tsx`,
  `src/pages/encaissements/EncaissementsList.tsx` — **28/09** : mois par
  défaut, état vide « Toutes les périodes ».
- `src/pages/Dashboard.tsx` — **24/09** : `TRI_PROSPECTIONS`, `LIGNES_COULOIR`,
  `KanbanColumn` (`error`, `className`), grille Pipeline 2 par ligne.
- `src/pages/actions/SuiviActionsList.tsx` — **nouveau** : page du suivi
  (filtres, groupement, boîte de détail, règle admin).
- `src/components/SuiviActionTable.tsx` — **nouveau** : adaptateur DataGrid.
- `src/components/ActionDetailDialog.tsx` — détail d'une action ; **25/09** :
  bloc Personne (fiche via `tiersId`), message étiqueté, `dl` sans troncature,
  bouton « Voir hotline » (numéro seulement).
- `src/components/HotlineResultat.tsx` — **25/09, nouveau** : rendu du résultat
  hotline, partagé par la page et la boîte (`FicheCard`, lignes dépliables).
- `src/components/HotlineResultDialog.tsx` — **25/09, nouveau** : hotline en
  boîte (`Modal` 960), par `CritereHotline`.
- `src/pages/hotline/Hotline.tsx` — **25/09** : ne garde que le formulaire.
- `src/pages/utilisateurs/ClesApiList.tsx`, `CreerCleApiDialog.tsx`,
  `SecretCleApiDialog.tsx`, `src/lib/clesApi.ts` — **25/09, nouveaux** :
  écran `/cles-api` (admin), création, secret une seule fois, portées.
- `src/components/DoublonsProspectPanel.tsx`, `ProspectionExistanteNotice.tsx`
  — **25/09, nouveaux** : les deux 409 du lot doublons, rendus comme une
  question / une redirection.
- `src/lib/api.ts` — **25/09** : `rechercherDoublonsProspect`,
  `lierProspectAPreProspection`, `doublonsDepuisErreur`,
  `prospectionExistanteDepuisErreur`, `listClesApi`, `creerCleApi`,
  `regenererCleApi`, `revoquerCleApi`.
- `src/types.ts` — **25/09** : `ProspectDoublonDto`, `CritereDoublon`,
  `LierProspectRequest`, `ProspectionExistanteDto`, `CleApiDto`,
  `CleApiCreeeDto`, `CreerCleApiRequest`, `PorteeCleApi`,
  `CreerProspectRequest.ignorerDoublons`.
- `docs/api-docsV4.json` — snapshot du 25/09 (163 routes : doublons + clés
  d'API).
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
- Front : `main` = `12d3953` (PR #69). Branches locales :
  `feat/filtre-archive-periode-mois` (lot du 28/09, PR à fusionner),
  `feat/suivi-action-detail-hotline` (fusionnée, à supprimer) et
  `feat/desarchiver-prospection` (reliquat). Back : `immo-crm`
  non touché (lecture seule : `SecurityConfig`, `GlobalExceptionHandler`,
  `DataSourceConfig`, `CleApiAdminService`, migration 011).
- Backend `:8080` lancé par l'utilisateur **hors Docker** (Docker Desktop
  arrêté) ; lecture sur `yesRemsProd`, écriture sur `yesRems`
  (`SOURCE_DB_*`). SQL Server `localhost,49687`, `sqlcmd` ODBC 17 dispo ;
  creds de test dans `immo-crm/src/test/resources/application.properties`
  (jamais recopiés ici).
- Ce fichier est commité **sur la branche** en attente. Après `sync`, il
  suit `main`.

---

## ⏭️ Next Step

> **PR `feat/filtre-archive-periode-mois` à fusionner** :
> `https://github.com/TsioryRasoloarijaona/immo-front/compare/main...feat%2Ffiltre-archive-periode-mois?expand=1`.
> Quand l'utilisateur confirme : `node .claude/scripts/git-flow.mjs sync
> front` depuis `prototype/`, vérifier `git log main..HEAD` vide et la
> branche supprimée, puis demander le prochain lot (AskUserQuestion avant
> `start`).

### Backlog (par priorité)

- [ ] Retour visuel sur le lot du 28/09 : chaque liste s'ouvre sur le mois
      courant, « Archivé : Non » par défaut, « Toutes les périodes » dans
      l'état vide, Offres « Le mois en cours » = 1er → dernier jour.
- [ ] #191 — si la recherche bornée au mois gêne : ignorer la période dès
      qu'une recherche est saisie, ou étendre `?periode=toutes` aux autres
      listes.
- [ ] Supprimer la branche locale fusionnée
      `feat/suivi-action-detail-hotline` (`git branch -d`).
- [ ] Décider du sort de `feat/desarchiver-prospection` (commit de mémo
      `1b97322` non fusionné) : `git branch -D` + suppression distante, ou
      petite PR.
- [ ] #187 — remonter au backend le catch-all `@ExceptionHandler(Exception.
      class)` : sans lui, toute erreur serveur déconnecte l'utilisateur.
- [ ] Retour visuel sur le détail du suivi (bloc Personne, hotline en boîte)
      et sur `/cles-api` (secret une seule fois, régénérer, révoquer).
- [ ] Doublons : appel `GET /api/prospects/doublons` à la volée pendant la
      saisie (FEATURE §5, optionnel) si l'utilisateur veut être prévenu
      avant de cliquer.
- [ ] Hotline : la page ne prend pas de paramètre d'URL ; « Ouvrir la
      hotline » depuis la boîte arrive sur un formulaire vide. Ajouter
      `?telephone=` si demandé.
- [ ] Retours visuels sur le suivi des actions (poids des colonnes) et sur
      l'import CSV.
- [ ] #183 — filtre Catégorie dès qu'un référentiel existe.
- [ ] #184 — détail d'action complet si un endpoint par id arrive.
- [ ] #182 — virtualiser `TableauLignes` si un fichier de 5 000 lignes rame.
- [ ] Boîte d'archivage : prévenir que les relances seront désarmées et ne
      reviendront pas au désarchivage (si l'utilisateur le souhaite).
- [ ] #181 — rafraîchir les lignes des groupes dépliés après mutation.
- [ ] #164 — couloir « Dossier de vente » ; EncaissementDetail → FicheShell ;
      fusion des onglets pauvres de ProspectionDetail.
- [ ] Timelines restantes → tables (Historique prospection, fiche
      prospect/client, Hotline).
- [ ] Barre d'action flottante à la sélection (DossiersList).
- [ ] #155, #156, #167, #168 — backend/outillage.
- [ ] 10 erreurs eslint préexistantes (#101) ; supprimer `harness-densite.tsx`.
