# Session Memory
_Last updated: 2026-09-09T13:40:00Z_
_Project: crm-prototype (Ayad Estate — CRM frontend), C:\Users\tsiory\Documents\ayad-internship\prototype\crm-prototype_

---

## 🎯 Current Objective
Consommer au fil de l'eau les endpoints V4 que le backend livre, **en rediffusant systématiquement la spec avant d'écrire une ligne de front**, et corriger les bugs UX rencontrés en chemin. Dernier livré : le bloc `activite` des vues légataires et le lien de conversion prospection → dossier.

---

## ✅ What Worked

1. **Le diff structurel de la spec avant toute écriture front.** Script node comparant jeux d'opérations, schémas et **descriptions champ par champ**. Il a rattrapé une **rupture de contrat sur du code déjà fusionné** (bug #107) qu'aucun autre signal n'aurait révélée. Version réutilisable : `scratchpad/diff-spec.cjs` (prend deux chemins en arguments).
2. **La base du diff est `HEAD`, jamais l'arbre de travail.** L'utilisateur lance `docs:update` **avant** de le dire. Comparer l'arbre de travail à la spec live renvoie alors « AUCUN changement structurel » et masque tout le refactor — c'est arrivé cette session (voir What Failed). Extraire la base avec `git show HEAD:docs/api-docsV4.json`, et **re-vérifier `git status`** au lieu de se fier au snapshot de début de session.
3. **`tsc -b --force` est le balayage exhaustif des lecteurs d'un champ supprimé.** En retirant les déclarations fantômes `ProspectionDetailDto.dossierId/dossierCode`, mon grep manuel (limité à `pages/prospections` + `components`) avait raté `pages/dossiers/NewDossier.tsx`. tsc l'a trouvé. **Ne jamais faire confiance au grep pour ça** — c'est la leçon du refactor des indicatifs, reformulée.
4. **Lire la spec comme une source métier, pas seulement comme un contrat de types.** Les `description` springdoc portent les taux de population réels — c'est de là que sortent les décisions d'affichage, pas d'une intuition de design.
5. **`git stash push -- <chemins>` pour isoler la spec d'une PR en attente.** La spec mise à jour est arrivée pendant que `feat/offre-prix` attendait sa fusion : stash → fusion → `start` → `stash pop`. La PR n'a pas été polluée.
6. **Vérifier la prémisse de l'utilisateur avant de coder.** Payant à plusieurs reprises : « les notes ne s'affichent pas » (elles l'étaient, le backend y mettait un tampon), « bug en prod » (l'app était saine, c'était le DNS).
7. **Harnais HTML statiques servis en HTTP** pour valider un rendu sans pouvoir s'authentifier (`file:` est bloqué par Playwright).

---

## ❌ What Failed / Course-corrections

- **Diff contre la mauvaise base → conclusion inverse.** Premier diff : arbre de travail vs spec live → « identique », d'où un diagnostic faux (« le backend sert un build périmé »), étayé par des compteurs identiques 158/113 **et** un deep-compare canonique. La vraie base était `HEAD` : +1 schéma, +9 champs. Le signal manqué : le `git status` de début de session ne montrait pas `docs/` modifié parce que le `docs:update` a eu lieu **après**.
- **Une mise à jour de `SESSION_MEMORY.md` non commitée est perdue au changement de branche.** Celle de la session précédente (01:15Z) a disparu au passage sur `main`. **Commiter la mémoire avec le reste**, jamais la laisser en attente.
- **Le heredoc ne se contente pas de corrompre : il peut bloquer** (`exit 143` à 2 min). **Aucun heredoc, jamais** — fichier `.cjs` écrit avec Write puis `node`.
- **PowerShell `>` ré-encode** : `git show HEAD:… > f.json` produit un fichier sensiblement plus gros (UTF-16/BOM). Passer par le Bash tool pour extraire une base de diff.
- **`*/` dans un commentaire JSDoc ferme le bloc.** Reformuler, jamais échapper par un caractère invisible.
- **Balayage incomplet au premier jet** (refactor des indicatifs) : l'utilisateur a dû signaler un écran oublié. Après un refactor transverse, s'appuyer sur `tsc`, pas sur sa mémoire des écrans.
- **Rejouer un script de patch déjà appliqué** → `ANCHOR: 0 matches`. Non idempotents.
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
| 102 | Colonnes contact/relance absentes des listes prospection | Fixed | PR #19 |
| 103 | Confirmation de visite non renvoyable | Fixed | PR #20 |
| 104 | `emailEnvoye: false` invisible sur les écrans admin | Fixed | PR #17 — `EnvoiMailNotice` |
| 105 | **Prod : `ERR_CONNECTION_TIMED_OUT` sur les chunks après inactivité** | Fixed (hors code) | Le résolveur DNS de la box renvoie `64.29.17.65`/`216.198.79.65`, injoignables en TCP. Cloudflare/Google renvoient `.1`, qui répond en 0,09 s → **DNS sur 1.1.1.1 ou 8.8.8.8**. L'app et Vercel étaient sains |
| 106 | Écran blanc quand un chunk de page ne se charge pas | Fixed | PR #21 — `RouteErrorBoundary`. Se reproduira **à chaque déploiement** avec un onglet ouvert |
| 107 | **`ResultatEnvoiVisiteDto` restructuré → le composant fusionné en #20 était cassé** | Fixed | PR #22 — `motif`/`destinataire`/`nombrePiecesJointes` descendus dans des blocs `email`/`whatsapp` |
| 108 | Numéros sans indicatif → `NUMERO_INEXPLOITABLE` sur WhatsApp (43 cas réels) | Fixed | PR #23 — `TelephoneField` partagé |
| 109 | 4 champs `indicatif*` livrés **sans aucune annotation springdoc** | Open (backend) | Contourné : le front ne reformate rien. Viole la règle 10 du projet |
| 110 | Offre de prix après visite sans consommateur front | Fixed | **PR #24 fusionnée** — `OffrePrixSection` sous le sélecteur d'étape, commit `c698164` |
| 111 | **Forme du corps du 409 sur `offre-prix` invérifiable** | Open (constat) | La spec le déclare en `ResultatEnvoiOffreDto` sous un content-type générique — signature springdoc d'un `@ApiResponse` sans bloc `content`, alors que la convention projet est un ProblemDetail. Le 401 hors session interdit de trancher. Contourné : on lit `ApiError.message`, jamais la structure |
| 112 | **Deux gardes de conversion mortes depuis toujours** | Fixed | Branche `feat/activite-prospection`. `ProspectionDetail` (bouton « Ouvrir le dossier ») et surtout `NewDossier` (redirection anti-doublon) testaient `prospection.dossierId`, un champ **jamais livré par l'API**. Repointés sur `activite.dossierId` |

---

## 🔑 Key Points to Remember

- **Rediffuser la spec à chaque fois, contre `HEAD`.** Le bug #107 reste le cas d'école (opérations et codes de retour inchangés, seule la forme d'un DTO avait bougé, et du code déjà en `main` était cassé). La mise à jour « vues légataires » de cette session était en revanche **strictement additive** : 158 → 158 opérations, 112 → 113 schémas, aucune suppression, aucun changement de type.
- **Une déclaration « proposée » dans `types.ts` est une bombe à retardement.** `ProspectionDetailDto.dossierId` avait été déclaré côté front en pariant que le backend l'ajouterait au premier niveau, avec un commentaire promettant « nothing to change here once it does ». Le backend l'a livré **imbriqué sous `activite`** : les deux gardes compilaient, ne s'allumaient jamais, et rien ne l'aurait signalé. **Ne pas déclarer ce que l'API ne renvoie pas** ; si on le fait, `tsc` au moment de la suppression est le seul filet.
- **`ProspectionDetailDto.activite` vaut `null` en entier sur une pré-prospection** — la vue `ComSaleProspectionView` les exclut par construction (3 817). Afficher « 0 interaction » serait faux : l'absence du bloc signifie **« non disponible »**, jamais « zéro ». Même classe de piège que `envoye` sur l'offre.
- **`activite.dossierId` est `null` sur 98 %** — c'est le taux de conversion réel (358 dossiers pour 14 118 prospections), pas une donnée manquante.
- **`activite.joursInactivite` est renseigné à 100 %** et c'est le critère de tri des relances du logiciel de bureau — la matière première du manque UX « relances » décrit dans `CLAUDE.md`.
- **`InteractionDto.categorie` est un discriminant** : `Prospection` (46 666), `Dossier de vente (Réservation)` (1 325), `(Livraison)` (167), `Réclamation` (2). Et **`categorieId` ≠ `resultatId`** — le second est la sous-catégorie.
- **Deux envois à deux canaux, à ne pas confondre malgré le `CanalEnvoiDto` commun :**
  - *Confirmation de visite* — 99 % de numéros, 57 % d'emails. Les plans ne partent que par email.
  - *Offre de prix* — **l'asymétrie s'inverse** : 19,7 % d'emails contre 99,7 % de numéros, d'où le montant en clair sur WhatsApp et le PDF réservé à l'email. **Le 409 y est le cas majoritaire** (le montant vient du lot, renseigné sur 7 % des prospections de l'étape 4 — 94 sur 1 266) : garde-fou client, et 409 rendu comme une étape de parcours. **L'offre existe indépendamment de l'envoi** : `offreId`/`offreCode` toujours renseignés, ne jamais conditionner leur affichage à `envoye`, sinon on la croit perdue et on la régénère sous un autre numéro.
  - Les chiffres 57 %/99 % écrits dans la description de `CanalEnvoiDto` sont ceux de la visite : ne pas s'y fier sur l'offre.
- **`remisePercent` est un pourcentage (5 = 5 %)**, contrairement à `DossierDetailDto.discount` qui est un ratio 0–1. Et **`remisePercent: 0` n'est pas neutre** : le backend ne réutilise une offre existante que si l'appel n'impose ni remise ni prix — un 0 explicite force une renumérotation, donc un second document chez le prospect. Champs vides = champs **omis**.
- **`InteractionDto` : on écrit dans `description`, on lit dans `note`.** Le `description` renvoyé est un tampon `JJ/MM/AAAA HH:MM auteur` sur 46 546 lignes sur 46 546 — ne jamais l'afficher.
- **Indicatifs téléphoniques** : `PaysDto.indicatifTelephone` (integer) alimente la liste ; les champs prospect sont des `string`. **Le front ne recompose rien.** Le formulaire d'édition **reconduit explicitement** les indicatifs, sinon une modification les effacerait.
- **La nav se modifie à trois endroits** : `modules.ts` (préfixe d'URL → module), `App.tsx` (route lazy), `Layout.tsx` (sous-menu écrit à la main).
- **Le seuil de re-sonde de session (60 s) doit rester au-dessus du TTL du cache GET (30 s)** dans `api.ts`.
- **Portes de validation** : `npx tsc -b --force` (le `--force` est obligatoire), `npx eslint src` → **doit rester à 9**, `npm run build`, plus `npm run check:contrast` si on touche aux couleurs.
- **Aucune vérification authentifiée n'est possible** : pas d'identifiants, extension Chrome non connectée, Playwright sans session, et depuis #92 tout visiteur anonyme est renvoyé sur `/`. Le backend répond **401** sur tout appel non authentifié — c'est ce qui bloque #111. Repli : harnais HTML statique servi en HTTP. Les captures atterrissent à la racine du dépôt → **les déplacer** dans le scratchpad.
- **Ordre de publication** : commit → `feature-index add` → `generate` → `push` → attendre la fusion → `sync`. Et si `start` refuse pour cause d'arbre sale : `git stash push -- <chemins>` → `start` → `stash pop`.
- Cookie `SameSite=Strict` → seul `tsiory.tech` (et localhost) authentifie ; `*.vercel.app` n'est **pas** un contournement.

---

## 📁 Important Files & Paths

- `src/types.ts` — **`ActiviteProspectionDto`** (nouveau, 19 champs) ; `ProspectionDetailDto.activite` remplace les fantômes `dossierId`/`dossierCode` ; `InteractionDto` +8 champs (catégorie, tranche, projet).
- `src/pages/prospections/ProspectionDetail.tsx` — `OffrePrixSection` (sous le sélecteur d'étape, visible à partir de l'étape 4) + `ConfirmationVisiteButton` + `LigneCanal` partagé ; `dossierIssu` hoisté (le narrowing d'un `p.activite?.dossierId` testé en JSX ne survit pas au closure du `onClick`).
- `src/pages/dossiers/NewDossier.tsx` — redirection anti-doublon vers le dossier existant, enfin active.
- `src/components/TelephoneField.tsx` — sélecteur d'indicatif + numéro. Point unique des 4 formulaires.
- `src/components/RouteErrorBoundary.tsx` — filet sous les routes lazy ; recharge dure, clé de reset = le chemin.
- `src/components/Timeline.tsx` — frise partagée des 6 historiques (emplacement `actions`).
- `src/lib/api.ts` — `setUnauthorizedHandler`, `ApiError.problem`, KPI, `rechercherHotline`, `renvoyerEmailVisite`, `envoyerOffrePrix`.
- `src/lib/referentiels.ts` — `useModesPaiement` et consorts (`makeCachedListHook`).
- `docs/api-docsV4.json` — le contrat. **Le diffuser contre `HEAD` avant toute écriture front.**
- `../FEATURES.md` — index dérivé du code. Régénéré à chaque feature.
- Scratchpad `…\0e8e01bb-…\scratchpad\` — `diff-spec.cjs` (diff de spec réutilisable), `show-op.cjs` (dump d'une opération), `patch-plan.md`, `spec-head2.json`.

---

## 🔧 Environment & Config

- Windows 11, PowerShell + Bash. Fichiers **CRLF**.
- React 19 + TS + Vite 8 + Tailwind v4 + shadcn/Base UI, React Router v7. **Aucune bibliothèque de graphiques.**
- Backend Spring sur `:8080`, lancé depuis IntelliJ (PID visible via `Get-NetTCPConnection -LocalPort 8080`). Branche backend correspondante : `feat/vues-legacy-prospection` (`bb5660c`). Prod Vercel sur `immo.tsiory.tech`.
- **Dépôt front** : `main` + la branche courante. Deux branches supprimées sur décision explicite de l'utilisateur restent récupérables ~30 j via les objets non référencés : `feat/remise-dossier` = `9e2838a` (3 commits : saisie liée remise/prix, simulation serveur), `refractor/best-practice` = `fe5a204` (10 commits : perf, a11y, **état de navigation dans l'URL**). `git branch <nom> <sha>` les ressuscite tant qu'un `gc` agressif n'est pas passé.

---

## ⏭️ Next Step
> Pousser `feat/activite-prospection` et **attendre la fusion GitHub**. Une fois confirmée : `node .claude/scripts/git-flow.mjs sync front`.

### Backlog (par priorité)
- [ ] **Vérifier sur données réelles** : (1) une prospection réellement transformée → le bouton « Ouvrir le dossier » et la redirection anti-doublon de `NewDossier`, **jamais exécutés jusqu'ici** et qui ne concernent que 2 % des cas ; (2) une **pré-prospection** → `activite` absent, aucun « 0 » affiché ; (3) modifier un prospect sans perdre son indicatif — seul scénario où une erreur **détruirait** une donnée ; (4) offre de prix : le 409 sans lot, et la forme réelle de son corps (#111) ; (5) confirmation de visite, cas « WhatsApp part / email absent » ; (6) `/performances` et `/mes-performances` (403 non-admin, 404 sans fiche employé) ; (7) hotline par nom accentué + bandeau `tronque` ; (8) session expirée (baisser `app.jwt.expiration-minutes` à 1).
- [ ] **4 champs spec toujours absents de `types.ts`** sur `ProspectionDetailDto` : `trancheCode`, `trancheDescription`, `articleCode`, `articleDescription` (ajout trivial, écarté de cette PR par discipline de portée). Plus `DevisDto.schemaFinancement`, `MontantsOffreDto.commissionPercent`, `ProspectionAutreTrancheDto`, `DossierListItemDto.dateConcretisation`, et surtout **`CreerReglementRequest.statut`/`dateReglement`** — seul écart *fonctionnel* : impossible de créer un règlement déjà pointé.
- [ ] **Exploiter le reste du bloc `activite`** : panneau d'activité sur la fiche (inactivité, dernière communication, visites, relance en cours, projet) avec l'état « non disponible » sur pré-prospection ; et `joursInactivite` comme critère de tri des relances.
- [ ] **Demander l'annotation springdoc des 4 champs `indicatif*`** (#109) — notamment : `telephone` perd-il son zéro initial ? Et **le corps réel du 409 de `offre-prix`** (#111).
- [ ] **Quatre sous-collections de prospection sans écran** : villes, types de bien, profils, catégories. 12 endpoints, fonctions `api.ts` écrites, **zéro appelant**. À spécifier avant d'attaquer.
- [ ] Ré-échelonner `--chart-1..5` avant toute série catégorielle (#99).
- [ ] Calendrier : ni note ni heure (`EvenementCalendrierDto` n'a pas de champ note ; pas de `GET /api/interactions/{id}`). Demande backend.
- [ ] Audit #6 — chips de filtres actifs. Audit #3 — mobile : 18/27 pages sans breakpoint, **décision de périmètre à prendre**.
- [ ] Nettoyer les déclarations mortes restantes : `ModifierProspectionRequest.trancheId/articleId` (jamais envoyés).
- [ ] 9 erreurs eslint préexistantes (#101).
