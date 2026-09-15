# Session Memory
_Last updated: 2026-09-15T17:00:00Z_
_Project: crm-prototype (Arpent — CRM immobilier), C:\Users\tsiory\Documents\ayad-internship\prototype\crm-prototype_

---

## 🎯 Current Objective

Suivre les livraisons de la **spec V4** et maintenir le front en phase, écran par
écran. Cette session a livré la **fiche encaissement façon Omran** (pièces
jointes avec aperçu intégré + pointage), une **revue de performance mesurée**, la
**refonte du tableau de bord** autour des relances, la **synthèse annuelle**, le
**glisser-déposer des colonnes** sur les dix listes, la saisie de prospection **en
boîte**, et une **demande backend** pour le filtre par colonne.

**Première session où quelque chose a été vu à l'écran** — l'utilisateur envoie
des captures. Les huit précédentes étaient à l'aveugle.

---

## ✅ What Worked

1. **Mesurer avant de conclure, et accepter que la mesure contredise.** La revue
   perf annonçait « 500×500 comparaisons » — exact, et **sans effet** : 0,395 ms
   → 0,274 ms par frappe. Le banc a invalidé cinq de mes six « corrections ».
   C'est le seul outil qui empêche de vendre du vent.
2. **La sonde qui vérifie l'invariant affiché**, pas l'endpoint. Deux prises
   majeures : `valeurPipeline / dossiersActifs = 96,0000` exactement (le front
   affichait 116), et « et 0 de plus » qui allait masquer 69 relances.
3. **Tester la logique pure dans Node** quand elle est extractible — 19
   assertions sur le réordonnancement des colonnes, dont les deux cas qui
   cassent en vrai (colonne ajoutée / disparue du catalogue).
4. **Lire les en-têtes HTTP réels avant de concevoir.** L'aperçu PDF intégré
   n'est possible que parce que le stockage sert `inline`, sans
   `X-Frame-Options` ni CSP — vérifié, pas supposé.
5. **Sonder les chemins d'échec qui ne mutent rien** quand le chemin heureux est
   irréversible : statut inconnu → 400, charge utile exacte sur un id inexistant
   → 404 (donc le corps est parsé). Le règlement cible reste intact.
6. **Grep du CSS/JS compilé** après chaque livraison. A rattrapé `--danger`, un
   token qui n'existe pas, et confirmé que `bg-(--brand)/35` génère bien un
   `color-mix` — dont le **repli rend les deux états identiques**, ce qui
   justifie la légende.

---

## ❌ What Failed / Course-corrections

- **Commit sur `main` — deux fois.** Le garde-branche n'intercepte que
  `Write`/`Edit`/`NotebookEdit` ; j'édite via des scripts Python passés par Bash,
  **invisibles pour lui**. Seul `git-flow push` a arrêté le coup. Réparé deux
  fois par `git reset --soft HEAD~1`. La seconde fois la fusion est arrivée
  **pendant** le tour : vérifier la branche avant d'éditer ne suffit pas, il faut
  la revérifier **avant de commiter**.
- **Heredocs bash qui avalent les `\n`** — trois échecs cette session, à chaque
  fois en patchant un script Python par heredoc. **Écrire le script d'un bloc
  avec l'outil Write, jamais le patcher par heredoc.**
- **`s.count(a)` compte des sous-chaînes, pas des lignes.** Une ancre à 30
  espaces est incluse dans la même ligne à 34 espaces → « vue 2 fois ».
- **`rep(a)` qui re-convertit une ancre déjà en CRLF** produit `\r\r\n`. Les
  ancres s'écrivent toujours avec `\n` littéral.
- **Prop ajoutée au type mais pas déstructurée** — deux fois (`actionsSeules`,
  `plusRecentesDAbord`). tsc l'attrape, mais c'est une perte de tour à chaque
  fois.
- **Lire un chiffre de capture sans corriger l'échelle.** Une modale de 480 px
  mesurait 600 px : l'écran est en **125 %**. Diviser par 1,25 avant tout
  diagnostic de mise en page.

---

## 🐛 Bugs & Errors Log

| # | Error / Bug | Status | Fix applied |
|---|-------------|--------|-------------|
| 101 | 9 erreurs eslint préexistantes | Open | **La référence est 9** — ne pas la faire bouger |
| 155 | `FEATURES.md` invente 17 endpoints « sans appelant » | **Open (outil)** | Défaut de correspondance sur les chemins à paramètres |
| 156 | `CreerReglementRequest.dateReglement` publiée mais refusée en 400 | **Open (backend)** | Consigné |
| 158 | **`--danger` n'est défini nulle part** — 2 composants l'utilisaient, le rouge n'a jamais rendu | Fixed | `--warning`, le vrai rouge du thème |
| 159 | Boîte de pointage débordante, bouton « Pointer » rogné | Fixed | `<input>` sans `min-w-0` ne cède pas sa largeur minimale ; `min-w-0 flex-1 basis-40`, modale 480→560 |
| 160 | **« Dossiers actifs » = 116, vrai chiffre 96** | Fixed | `dossiersParEtape` renvoie les sorties ; `estStatutSortie` ajouté. Prouvé : `valeurPipeline/96 = panierMoyen` |
| 161 | « Relances en retard » affichait **0** alors que 2 690 alertes étaient échues | Fixed | Mauvaise population câblée — voir Key Points |
| 162 | « Dossiers récents » affichait le code brut sous pastille neutre | Fixed | `canonicalStatusLabel` + `toneForStatus`, comme le Kanban du même écran |
| 163 | « Prospections récentes » sans `sort` → ordre non déterministe | Fixed | `sort: ['dateDocument,desc']` |
| 164 | Kanban « Dossier de vente » comptait les actifs, listait tout | **Open** | Signalé, non corrigé |
| 165 | « et N de plus » comptait le non-**chargé** → serait tombé à 0 en masquant 69 lignes | Fixed | Compte sur les lignes **affichées** |
| 166 | **`/api/dashboard/relances` ignore `sort`** (4 valeurs testées, même ordre) | Workaround | Charger la file entière (`size=200`, 367 ms) et prendre la fin |
| 167 | `derniereAlerteDate` ni filtrable, ni triable (400), ni groupable | **Open (backend)** | Demande écrite, voir #168 |
| 168 | **Filtre par colonne client-side** : taper `chèque` rend 0 sur 180 réels | **Open (backend)** | Demande complète dans `docs/filtres-avances.md` |

---

## 🔑 Key Points to Remember

### Le tableau de bord — deux populations de « relance », et la mauvaise était câblée
- `DashboardDto.relancesEnRetard` = relances de **dossier** (titre foncier), que
  le serveur renvoie **vides**. C'est ce qui affichait 0.
- `GET /api/dashboard/relances` = relances **commerciales**. `echeance`
  (`AUJOURDHUI`|`RETARD`) × `portee` (`MOI`|`EQUIPE`). Mesuré : 75 en
  RETARD/EQUIPE, 2 en RETARD/MOI.
- **`RETARD` est borné à 30 jours côté serveur, délibérément** : la base porte
  3 710 relances en retard dont **2 020 de plus d'un an**. L'écran doit se
  présenter comme une **file de travail**, jamais comme le compte de l'arriéré —
  sinon il ment autant que le « 0 ».
- `telephone` renseigné **50/50**, `prospectNom` 49/50 : le numéro est la prise
  fiable, pas le nom. D'où le `tel:` en avant.
- Ordre demandé : **plus récentes d'abord**. Le serveur ne trie que dans l'autre
  sens et ignore `sort` → charger la file entière et prendre la fin.

### La synthèse annuelle
- `GET /api/dashboard/annuel?annee=` — trois blocs **qui ne s'additionnent pas** :
  échéancier (dû), encaissements (réalisé), ventes concrétisées (sous-ensemble).
- **Les mois à venir sont renseignés** (oct. 380 k, nov. 50 k) : une courbe
  coupée au mois courant masquerait de la donnée vraie.
- `dossiersSansDateAvance` : le spec dit 232/387, **la base sert 21**, identique
  sur 2024/2025/2026. Afficher la valeur servie, jamais celle du spec.
- Forme : **barres**, pas courbe (douze sommes discrètes). Procédure `dataviz`
  suivie ; anti-patterns vérifiés.

### La grille
- **Glisser-déposer des colonnes** : `useOrdreColonnes` dans `lib/colonnes.ts`,
  appliqué dans `DataGrid`, clé par écran (`cleOrdre`), **dix listes**. Stockage
  `arpent.ordre-colonnes.<cle>`, distinct de `arpent.colonnes.<cle>` (sélection).
  Clavier : **Alt+←/→**.
- **Le filtre par colonne est client-side, sur la page chargée seulement** — et
  c'est un écran qui ment : `chèque` rend 0 sur 180. Demande écrite.
- `useDeferredValue` sur la ligne de filtres : seul changement perf qui touche le
  coût réel (le rendu de 500 lignes). Les cinq autres sont mesurées négligeables
  et conservées pour la clarté, pas la vitesse.

### Pièges déjà payés
- **Le garde-branche ne voit pas les éditions par Bash/Python.** Vérifier la
  branche avant d'éditer **et** avant de commiter.
- Les captures de l'utilisateur sont en **125 %** : diviser par 1,25.
- Les endpoints de preuve/pointage sont scopés `/api/dossiers/{id}/reglements/…`
  ; `EncaissementDetailDto.dossierId` est accepté — vérifié 332/332, y compris
  les 7 règlements à cheval sur plusieurs dossiers.
- Pointer exige **une preuve jointe** (409) **et** une date (400) ; `POINTED` et
  `CANCELED` sont terminaux.
- Données légataires : `CHÉQUE` s'écrit avec un **accent aigu** (159 lignes) à
  côté de `CHEQUE` sans accent (21).

### Vérification
- Quatre portes : `npx tsc -b --force`, `npx eslint src --ignore-pattern
  'src/harness-densite.tsx'` → **9**, `npm run check:contrast`, `npm run build`.
- **Les portes ne rendent rien.** Les deux contrôles utiles restent le **grep du
  compilé** et la **sonde d'invariant affiché**.

---

## 📁 Important Files & Paths

- `src/components/ReglementPreuves.tsx` — preuves + pointage, partagé par
  l'échéancier et la fiche encaissement. `ReglementDocumentsJoints` porte
  l'aperçu `<iframe>`.
- `src/lib/reglementRegles.ts` — les deux fonctions pures (un module qui exporte
  des composants ne peut rien exporter d'autre : `react-refresh`).
- `src/lib/colonnes.ts` — `useColonnesVisibles` **et** `useOrdreColonnes`.
- `src/components/DataGrid.tsx` — glisser-déposer, filtre/tri/Σ, dépliant.
- `src/pages/Dashboard.tsx` — bloc « À rappeler » en tête, `ColonneRelances`,
  `LigneRelance`.
- `src/components/SyntheseAnnuelle.tsx` — les douze barres.
- `src/pages/prospections/NewProspection.tsx` — **exporte désormais une boîte**,
  montée par `ProspectionsList` via la route `/prospections/nouveau`.
- `docs/filtres-avances.md` — **toutes les demandes backend**, dont la nouvelle
  section « Filtre par colonne (15/09) ».
- Scratchpad : `sonde-invariant-dashboard.mjs`, `sonde-relances-v2.mjs`,
  `sonde-accents.mjs`, `test-ordre.mjs`, `bench-grille.mjs`.

---

## 🔧 Environment & Config

- Windows 11, PowerShell + Git Bash. Fichiers **CRLF**.
- Vite `:5173`, backend Spring `:8080`, lancés par l'utilisateur. **Le backend
  est tombé une fois en cours de session** — `ECONNREFUSED`, redémarré par lui.
- Identifiants de test : dans les sondes du scratchpad. **Non consignés ici.**
- `main` à **`532e3a2`**. PR #41 à #48 fusionnées cette session.
- Branche **`docs/demande-filtre-colonne`**, poussée, **non fusionnée** — un
  commit, documentation seule.
- **L'utilisateur fusionne vite, parfois en cours de tour.** Traiter `main` comme
  mouvant.

---

## ⏭️ Next Step

> **Faire fusionner `docs/demande-filtre-colonne`**, puis transmettre la demande
> à l'équipe backend : le filtre par colonne est la seule demande en cours dont
> l'absence produit un **résultat faux présenté comme complet**, sur les dix
> listes.

### Backlog (par priorité)

- [ ] **Vérifier au navigateur ce qui a été livré à l'aveugle** : `/` → bloc « À
      rappeler » (Moi = 2, Équipe = 75, Aujourd'hui = 0, « Dossiers actifs » =
      **96**) ; synthèse annuelle sur **2025**, bien plus dense (juillet à 30,4 M
      écrase l'échelle) ; `/dossiers` → glisser « Prix » sur « Code », recharger,
      « rétablir » ; `/prospections` → « Nouvelle prospection » en boîte, Retour
      la ferme.
- [ ] **#164 — Kanban « Dossier de vente »** : compte les actifs, liste tout,
      sorties comprises.
- [ ] **#167 — `derniereAlerteDate`** ni filtrable ni triable ni groupable :
      l'arriéré de 2 690 alertes reste hors de portée.
- [ ] **#155 — réparer le détecteur d'endpoints de `FEATURES.md`** (16 faux
      positifs sur 17).
- [ ] **#156 — trancher `CreerReglementRequest.dateReglement`**.
- [ ] Le **pointage n'a jamais été exercé en écriture réelle** — irréversible,
      demande l'accord de l'utilisateur sur un règlement désigné.
- [ ] Divergence `titreFoncier` entre liste et fiche.
- [ ] Supprimer `harness-densite.tsx` (non suivi).
- [ ] 9 erreurs eslint préexistantes (#101).
