# Session Memory
_Last updated: 2026-09-09T00:30:00Z_
_Project: crm-prototype (Ayad Estate — CRM frontend), C:\Users\tsiory\Documents\ayad-internship\prototype\crm-prototype_

---

## 🎯 Current Objective
Consommer au fil de l'eau les endpoints V4 que le backend livre (suppression de pièces jointes, KPI, note d'interaction, hotline par nom, confirmation de visite, indicatifs téléphoniques), corriger les bugs UX rencontrés en chemin, et **rediffuser la spec à chaque livraison** — c'est ce diff qui a rattrapé une régression déjà fusionnée.

---

## ✅ What Worked

1. **Le diff structurel de la spec avant toute écriture front.** Un script node comparant jeux d'opérations, schémas et **descriptions champ par champ** entre `git show HEAD:docs/api-docsV4.json` et l'arbre de travail. Il a trouvé à chaque fois le vrai contenu de la mise à jour, et surtout **une rupture de contrat sur du code déjà fusionné** (bug #107) qu'aucun autre signal n'aurait révélée : 157 opérations avant/après, zéro code de retour changé.
2. **Vérifier la prémisse de l'utilisateur avant de coder** — deux fois payant. « Les notes ne s'affichent pas » : elles l'étaient déjà, le backend y mettait un tampon. « Bug en prod » : l'application était saine, c'était le DNS.
3. **Écarter sa propre hypothèse avant de la publier.** Sur l'incident prod, avant de conclure « le site est tombé », j'ai testé `example.com`/`vercel.com` : mon réseau marchait, donc la panne était réelle. Puis `curl --resolve` par IP a montré `time_connect = 0` — la panne était au niveau TCP, pas applicatif.
4. **Scripts de patch dans un fichier `.cjs` du scratchpad, lancés par `node`** — jamais en heredoc (voir What Failed).
5. **Harnais HTML statiques servis en HTTP** pour valider un rendu sans pouvoir s'authentifier. Cinq fois utilisés (marques KPI, frise, hotline, tableau 9 colonnes, canaux d'envoi).
6. **Vérifier une hypothèse CSS par la mesure plutôt que par la spec** : `browser_evaluate` a confirmé que le conteneur `overflow-y-auto` défile bien en X sans casser la page (1280 vs 1376 px, `document.scrollWidth === clientWidth`).
7. **Extraire la regex du code source pour la tester**, plutôt qu'en recopier une version qui divergerait — utilisé pour la détection d'échec de chunk, contre le message réel de la console de prod.

---

## ❌ What Failed / Course-corrections

- **Balayage incomplet au premier jet.** Le refactor des indicatifs n'a d'abord couvert que les écrans que j'avais en tête ; l'utilisateur a dû signaler `/prospections/nouveau`. **Leçon : après un refactor transverse, grepper tout le code** (`FieldLabel[^>]*>(Téléphone|Mobile)<`, `label="Téléphone"`) plutôt que se fier à sa mémoire des écrans.
- **Heredoc `<<'EOF'` + `node -e`** : le transport avale les antislashs et exécute les backticks. Symptômes vus : `/^\\./` devenu `/^./` (0 correspondance), et `` `replace` `` remplacé par « No files replaced ». **Toujours passer par un fichier.**
- **Rejouer un script de patch déjà appliqué** → `ANCHOR: 0 matches`. Les scripts ne sont pas idempotents ; en écrire un neuf pour ce qui reste.
- **`patch()` écrit le fichier après *toutes* ses substitutions** : un jeu qui échoue à mi-parcours ne laisse rien sur disque — mais les fichiers déjà traités par un `patch()` **précédent**, si.
- **Commentaire JSX `{/* */}` entre deux attributs** → `TS1005`. Valide uniquement en position d'enfant.
- **Accents supprimés par excès de prudence** dans les patchs, à recorriger ensuite. L'outil Write gère l'UTF-8 : écrire le français correct du premier coup.
- **`feature-index.mjs add` avant le commit** → « Nothing to record » (il lit `main..HEAD`).

---

## 🐛 Bugs & Errors Log

| # | Error / Bug | Status | Fix applied |
|---|-------------|--------|-------------|
| 90-98 | Sessions antérieures de la même journée (pièces jointes, KPI, redirection, session expirée, note d'interaction, hotline par nom) | Fixed | PR #12 à #18 |
| 99 | `--chart-1..5` échoue la validation catégorielle dans les deux thèmes | Open (constat) | Contourné : une seule teinte pour les marques KPI |
| 100 | `workflowDescription \|\| statutDescription` masque le statut | Open (différé) | Choix de l'utilisateur |
| 101 | 9 erreurs eslint préexistantes | Open | 8× `react-refresh/only-export-components` + 1× `set-state-in-effect` |
| 102 | Colonnes contact/relance absentes des listes prospection | Fixed | PR #19 — le backend a ajouté `telephone`, `email`, `derniereAlerteDate`, `derniereAlerteMessage` |
| 103 | Confirmation de visite non renvoyable | Fixed | PR #20 — bouton sur les interactions planifiant un RDV |
| 104 | `emailEnvoye: false` invisible sur les écrans admin | Fixed | PR #17 — `EnvoiMailNotice` |
| 105 | **Prod : `ERR_CONNECTION_TIMED_OUT` sur les chunks après inactivité** | **Fixed (hors code)** | **Le résolveur DNS de la box renvoie `64.29.17.65`/`216.198.79.65`, injoignables en TCP. Cloudflare/Google renvoient `.1`, qui répondent en 0,09 s. → passer le DNS sur 1.1.1.1 ou 8.8.8.8.** L'app et la config Vercel étaient saines |
| 106 | Écran blanc quand un chunk de page ne se charge pas | Fixed | PR #21 — `RouteErrorBoundary`. Se produira **à chaque déploiement** avec un onglet ouvert, indépendamment du DNS |
| 107 | **`ResultatEnvoiVisiteDto` restructuré → le composant fusionné en #20 était cassé** | Fixed | PR #22 — `motif`/`destinataire`/`nombrePiecesJointes` sont descendus dans des blocs `email`/`whatsapp`. Le bouton affichait « Rien n'a été envoyé » même en cas de succès |
| 108 | Numéros sans indicatif → `NUMERO_INEXPLOITABLE` sur WhatsApp (43 cas réels) | Fixed | PR #23 — `TelephoneField` partagé sur les 4 formulaires + 5 affichages |
| 109 | 4 champs `indicatif*` livrés **sans aucune annotation springdoc** | Open (backend) | Contourné : le front ne reformate rien. Viole la règle 10 du projet |
| 110 | Offre de prix après visite sans consommateur front | Fixed | PR à venir — `POST /api/prospections/{id}/offre-prix`, section sous le sélecteur d'étape |
| 111 | **Forme du corps du 409 sur `offre-prix` invérifiable** | Open (constat) | La spec déclare `ResultatEnvoiOffreDto` sous un content-type générique — signature springdoc d'un `@ApiResponse` sans bloc `content`, alors que la convention projet est un ProblemDetail. Le 401 hors session interdit de trancher. Contourné : on lit `ApiError.message`, jamais la structure |

---

## 🔑 Key Points to Remember

- **Rediffuser la spec à chaque fois, y compris après livraison.** Le bug #107 est le cas d'école : opérations et codes de retour inchangés, seule la forme d'un DTO avait bougé, et du code déjà en `main` était cassé.
- **Le Bash tool abîme antislashs et backticks.** Patchs de code → fichier `.cjs` écrit avec Write, exécuté par `node`. Fichiers en **CRLF** : normaliser les ancres (`t.replace(/\r?\n/g,'\r\n')`).
- **Portes de validation** : `npx tsc -b --force` (le `--force` est obligatoire), `npx eslint src` → **doit rester à 9**, `npm run build`, plus `npm run check:contrast` si on touche aux couleurs.
- **Aucune vérification authentifiée n'est possible** : pas d'identifiants, extension Chrome non connectée, Playwright sans session — et depuis #92 tout visiteur anonyme est renvoyé sur `/`. Repli : harnais HTML statique servi en HTTP (`file:` est bloqué par Playwright). Les captures atterrissent à la racine du dépôt → **les déplacer** dans le scratchpad.
- **Confirmation de visite = deux canaux indépendants.** `envoye` racine = au moins un abouti. **L'asymétrie est la norme** : 99 % des prospects ont un numéro, 57 % un email. Motifs distincts : `DESTINATAIRE_ABSENT` (obtenir la coordonnée) vs `NUMERO_INEXPLOITABLE` (réparer celle qui existe) vs `SERVICE_INACTIF`. Les plans ne partent **que par email**.
- **`InteractionDto` : on écrit dans `description`, on lit dans `note`.** Le `description` renvoyé est un tampon `JJ/MM/AAAA HH:MM auteur` sur 46 546 lignes sur 46 546 — ne jamais l'afficher.
- **Offre de prix ≠ confirmation de visite, malgré le `CanalEnvoiDto` commun.** Trois écarts qui changent l'écran : (1) **le 409 est le cas majoritaire** — le montant vient du lot, renseigné sur 7 % des prospections de l'étape 4 (94 sur 1 266) — donc garde-fou client (bouton inactif + lien vers l'onglet Article) et 409 rendu comme une étape de parcours ; (2) **l'asymétrie des canaux s'inverse** : 19,7 % d'emails contre 99,7 % de numéros, d'où le montant en clair sur WhatsApp et le PDF réservé à l'email ; (3) **l'offre existe indépendamment de l'envoi** — `offreId`/`offreCode` sont toujours renseignés, ne jamais conditionner leur affichage à `envoye`, sinon le commercial la croit perdue et la régénère sous un autre numéro. Les chiffres 57 %/99 % écrits dans la description de `CanalEnvoiDto` sont ceux de la visite : ne pas s'y fier ici.
- **`remisePercent` est un pourcentage (5 = 5 %)**, contrairement à `DossierDetailDto.discount` qui est un ratio 0–1. Et **envoyer `remisePercent: 0` n'est pas neutre** : le backend ne réutilise une offre existante que si l'appel n'impose ni remise ni prix — un 0 explicite force donc une renumérotation. Champs vides = champs omis.
- **Indicatifs téléphoniques** : `PaysDto.indicatifTelephone` (integer) alimente la liste ; les champs prospect sont des `string`. **Le front ne recompose rien** — la spec ne dit pas si le numéro perd son zéro initial. Le formulaire d'édition **reconduit explicitement** les indicatifs, sinon une modification les effacerait.
- **La nav se modifie à trois endroits** : `modules.ts` (préfixe d'URL → module), `App.tsx` (route lazy), `Layout.tsx` (sous-menu écrit à la main).
- **Le seuil de re-sonde de session (60 s) doit rester au-dessus du TTL du cache GET (30 s)** dans `api.ts`.
- **Ordre de publication** : commit → `feature-index add` → `generate` → `push` → attendre la fusion → `sync`.
- Cookie `SameSite=Strict` → seul `tsiory.tech` (et localhost) authentifie ; `*.vercel.app` n'est **pas** un contournement.

---

## 📁 Important Files & Paths

- `src/components/TelephoneField.tsx` — **nouveau**, sélecteur d'indicatif + numéro. Point unique des 4 formulaires.
- `src/components/RouteErrorBoundary.tsx` — **nouveau**, filet sous les routes lazy ; recharge dur, la clé de reset étant le chemin.
- `src/components/Timeline.tsx` — frise partagée des 6 historiques (emplacement `actions` ajouté pour le bouton de confirmation).
- `src/components/kpi/*` — marques KPI, une seule teinte (`--chart-1` + `--chart-1-track`).
- `src/lib/format.ts` — `formatDateTime` (réel), `formatHeures`, `formatTelephone`.
- `src/lib/api.ts` — `setUnauthorizedHandler`, KPI, `rechercherHotline(CritereHotline)`, `renvoyerEmailVisite`.
- `src/lib/auth.tsx` — accroche 401 + re-sonde au retour d'onglet.
- `docs/api-docsV4.json` — le contrat. **Le diffuser avant toute écriture front.**
- Scratchpad de session : `…\3e849c97-…\scratchpad` — scripts de patch et harnais réutilisables comme modèles.

---

## 🔧 Environment & Config

- Windows 11, PowerShell + Bash. Fichiers **CRLF**.
- React 19 + TS + Vite 8 + Tailwind v4 + shadcn/Base UI, React Router v7. **Aucune bibliothèque de graphiques.**
- Backend Spring sur `:8080` — up en fin de session. Prod Vercel sur `immo.tsiory.tech` (CNAME `5ad35b418d08d209.vercel-dns-017.com`).
- Ports 5173-5177 occupés par des serveurs de dev laissés par les vérifications.

---

## ⏭️ Next Step
> Branche `feat/offre-prix` poussée, en attente de la fusion GitHub. **La dette réelle reste la vérification** : rien des PR #17 à #24 n'a été cliqué sur données réelles authentifiées. Dérouler le backlog ci-dessous, en commençant par la modification d'un prospect — c'est le seul scénario où une erreur **détruirait** une donnée (perte de l'indicatif).

### Backlog (par priorité)
- [ ] **Vérifier sur données réelles** : (1) modifier un prospect sans perdre son indicatif ; (2) confirmation de visite, cas « WhatsApp part / email absent » ; (3) **offre de prix : le 409 sans lot, et la forme réelle de son corps (#111)** ; (4) note d'interaction non vide ; (5) `/performances` et `/mes-performances` (403 non-admin, 404 sans fiche employé) ; (6) hotline par nom accentué + bandeau `tronque` ; (7) session expirée (baisser `app.jwt.expiration-minutes` à 1).
- [ ] **Demander l'annotation springdoc des 4 champs `indicatif*`** (#109) — notamment : `telephone` perd-il son zéro initial ?
- [ ] **11 champs de la spec absents de `types.ts`** : `ProspectionDetailDto` (trancheCode/Description, articleCode/Description), `DevisDto.schemaFinancement`, `MontantsOffreDto.commissionPercent`, `ProspectionAutreTrancheDto`, `DossierListItemDto.dateConcretisation`, et surtout **`CreerReglementRequest.statut`/`dateReglement`** — seul écart *fonctionnel* : impossible de créer un règlement déjà pointé.
- [ ] **Quatre sous-collections de prospection sans écran** : villes, types de bien, profils, catégories. 12 endpoints, fonctions `api.ts` écrites, **zéro appelant**. À spécifier avant d'attaquer.
- [ ] Ré-échelonner `--chart-1..5` avant toute série catégorielle (#99).
- [ ] Calendrier : ni note ni heure (`EvenementCalendrierDto` n'a pas de champ note ; pas de `GET /api/interactions/{id}`). Demande backend.
- [ ] Audit #6 — chips de filtres actifs. Audit #3 — mobile : 18/27 pages sans breakpoint, **décision de périmètre à prendre**.
- [ ] Nettoyer les déclarations mortes : `ModifierProspectionRequest.trancheId/articleId` (jamais envoyés), `ProspectionDetailDto.dossierId/dossierCode` (branche dormante documentée).
- [ ] 9 erreurs eslint préexistantes (#101).
