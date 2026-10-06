# FEATURE — Brancher le module « Outils › Virements » sur l'API generateur-virement

Branche : `feat/virements-api` dans **crm-prototype** seulement (coupée de `main`
le 06/10/2026). Spec placée ici (et non dans `immo-crm/instructions/`) car
immo-crm n'est pas touché.

## Objectif

Les écrans `src/pages/outils/virements/` (Nouvel ordre, Historique,
Bénéficiaires, Sociétés + 6 modales) tournent aujourd'hui sur une maquette en
mémoire (`donnees.ts`). Les brancher sur le service `generateur-virement`
(Node/Express, PR #1 fusionnée), et ajouter l'écran **Journal** (admin).

**Le contrat fait foi : `../generateur-virement/GUIDE-FRONTEND.md`** (§1 à §15),
et en cas de doute `../generateur-virement/src/app.js`. Cette spec ne recopie pas
le guide ; elle fixe ce qu'il laisse ouvert et ce qui est propre au CRM.

## Décisions utilisateur (06/10/2026)

1. Branche `feat/virements-api`, front seulement. **Le service ne doit pas être
   modifié** : si un défaut du service bloque, s'arrêter et le signaler (pas de
   contournement côté front qui masquerait le défaut).
2. **Développement local : proxy Vite + en-têtes simulés** (pas de Caddy local).
3. Extra retenu : **l'écran Journal (§11)**. Hors périmètre : l'aperçu du
   courrier dans la modale Société, l'affichage détaillé des `erreurs` d'import
   (on garde le toast avec compteurs, en avertissement s'il y a des erreurs).

## Transport

- Nouveau client `src/lib/virements.ts`, distinct de `api.ts` (autres formes
  d'erreur, pas de ProblemDetail) :
  - **base** : `import.meta.env.DEV ? '/svc/virement' : \`${API_BASE_URL}/svc/virement\``
    (`API_BASE_URL` importé de `api.ts`). En production, l'appel passe par Caddy
    sur le même hôte que `/api/*`, cookie compris.
  - `credentials: 'include'` sur **tous** les appels ; `204` non parsé ;
    erreur non 2xx → une `ErreurVirement(status, erreur, corps)` portant le
    message `erreur` du service, à afficher tel quel.
  - Réactions par code selon GUIDE §1 : 401 → même traitement que le CRM
    (retour à la connexion, réutiliser le mécanisme existant d'`api.ts`) ;
    403 → toast « accès refusé » + relire `/moi`, **jamais** de déconnexion ;
    409 → second temps de confirmation là où le guide le prévoit (§8.2, §9.3,
    §10.2) ; 500 → citer `reference` ; 502 → erreur technique.
  - Téléversements en `multipart/form-data`, champ `file`.
  - Liens de fichiers (PDF, pièces, logos) = simples `href` vers
    `base + chemin` ; le cookie part tout seul.
- **Proxy de dev** (`vite.config.ts`, bloc `server.proxy`, donc absent du
  build) : `/svc/virement` → `http://127.0.0.1:3010`, préfixe retiré, et ajout
  des en-têtes `X-User-Id`, `X-Username`, `X-User-Roles` (rôles encodés un par
  un, séparés par des virgules), `X-Employee-Id`. Valeurs par défaut : un UUID
  fixe de dev, `dev`, `Administrateur`. Surchargeables par variables
  d'environnement `VIREMENT_DEV_ROLES` / `VIREMENT_DEV_USER` (lues par
  `vite.config.ts` via `process.env`, **pas** exposées au bundle) pour tester
  un non-admin. Commentaire en tête du bloc : en production, c'est Caddy qui
  pose ces en-têtes après `forward_auth`.

## Types

- Dans `src/pages/outils/virements/types.ts` (pas dans `src/types.ts`, réservé
  au miroir de l'OpenAPI d'immo-crm). **Noms du fil exactement**, en
  snake_case (`fournisseur_nom`, `date_virement`, `par_defaut`, `types_dossier`…),
  formes du GUIDE §14. `par_defaut`, `entete_filet` et les cases du modèle sont
  des `0 | 1` sur le fil.
- `donnees.ts` : la maquette en mémoire disparaît. Ce qui reste utile (libellés
  de statut `emis → Émis`…, valeurs du modèle GHRIZA pour une nouvelle
  société §10.1) peut rester, le reste est supprimé. **Les listes métier
  viennent de `GET /meta`**, chargé une fois (§2), jamais recopiées en dur.

## Règles (chacune vérifiée à l'écran)

- **R1 — Droits.** Le niveau admin vient de `GET /moi` → `admin`, **pas** des
  rôles CRM (l'accès au service inclut Comptabilité et Direction Générale).
  Pour `admin = false` : masquer Supprimer (ordre, pièce, bénéficiaire), l'écran
  Sociétés et le Journal, et dans « Modifier l'ordre » ne proposer que
  statut / référence / note, en n'envoyant **que** les champs changés (§8.1,
  §12). La visibilité du module Outils dans le CRM (`adminOnly`) est inchangée.
- **R2 — Argent.** Aucun total calculé côté écran pour être enregistré : les
  totaux affichés de l'Historique, des dossiers et des sociétés sont ceux du
  serveur (`total_montant`, `par_societe`…). Seule exception, l'indication
  « N bénéficiaires · total X DH » sous le formulaire groupé (aperçu de
  saisie, le serveur refait le calcul). Format `src/lib/format.ts`.
- **R3 — PDF.** Le front n'envoie jamais de PDF ni de pièce `ordre_pdf` ; la
  génération = **un seul appel** `POST /ordres` ou `POST /ordres/groupe` (§4.3),
  puis le bloc « après génération » (§4.4) avec le lien
  `/ordres/:id/pdf?download=1`. Bouton **Regénérer le PDF** sur la ligne
  `ordre_pdf` de la fiche (§7.4).
- **R4 — Aperçu.** `ApercuCourrier` reste un aperçu HTML, alimenté par la
  société choisie telle que servie par `GET /societes` (§5) ; logo via
  `GET /societes/:id/logo` ou `/societes/logo-defaut`.
- **R5 — Fraîcheur.** Après chaque action, recharger ce qui en dépend
  (bénéficiaires après génération, historique après une modification de
  pièce, etc. — §4.3, §7.3).
- **R6 — Comportements de modale** (§3) : saisie protégée « Quitter sans
  enregistrer ? », Échap ne ferme que la fenêtre du dessus, bouton
  « Enregistrement… » désactivé pendant l'appel, suppressions confirmées en
  rouge, toasts succès ~4 s / erreur ~7 s.

## Écrans

Routes existantes, inchangées : `/outils/virements/{nouveau,historique,beneficiaires,societes}`.
Contenu, filtres, états vides et messages : GUIDE §4, §6–§10, mot pour mot.

**Nouveau** : `/outils/virements/journal` (admin), entrée de barre latérale
dans le module Outils sous « Sociétés ». `GET /journal?limite=100` ; bouton
« Charger plus » qui passe à `limite=1000`. Ligne et libellés d'action : §11
(action inconnue → code brut).

Chaque écran : chargement → `LoadingState`, erreur → `ErrorState` avec le
message du service, vide → message du guide.

## Hors périmètre

- Le service `generateur-virement` (aucun fichier), immo-crm, Caddy.
- L'aperçu de courrier dans la modale Société ; le détail des erreurs d'import.
- La visibilité du module Outils dans la navigation.

## Vérification

1. `npm run build` → exit 0.
2. Lancer le service en local **avec le stockage mémoire** (n'écrit pas dans le
   vrai bucket S3) : dans `generateur-virement/`,
   `OV_STOCKAGE=memoire npm start` (Postgres local `virement`, déjà dans `.env`).
   `curl -s http://127.0.0.1:3010/sante` doit répondre.
3. `npm run dev`, puis parcours en navigateur avec captures :
   a. ordre seul généré → bloc après génération, PDF téléchargé et ouvrable ;
   b. ordre groupé (2 lignes) → « OV-… à OV-… », Historique filtré sur le groupe ;
   c. Historique : recherche, filtre Dossier, ventilation par société ;
   d. fiche d'un ordre : ajout d'une pièce, montant de facture avec la puce
      « ≠ … DH viré », changement de statut, Regénérer le PDF ;
   e. Bénéficiaires : création, modification, suppression en deux temps (409 →
      `force=1`), import d'un petit `.xlsx` ;
   f. Sociétés : modification d'une société + logo ;
   g. Journal : les actions ci-dessus apparaissent ;
   h. **non-admin** : relancer le service avec `OV_ROLES_ADMIN=Administrateur`
      et le front avec `VIREMENT_DEV_ROLES=Comptabilité` → pas de Supprimer, pas
      de Sociétés ni de Journal, « Modifier » réduit à statut/référence/note.
4. Rapport : écarts éventuels entre le guide et le comportement réel du
   service (route, forme, message), à signaler, pas à contourner.
