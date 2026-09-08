# Session Memory
_Last updated: 2026-09-08T18:00:00Z_
_Project: crm-prototype (Ayad Estate — CRM frontend), C:\Users\tsiory\Documents\ayad-internship\prototype\crm-prototype_

---

## 🎯 Current Objective
Consommer, écran par écran, les endpoints V4 que le backend livre au fil de l'eau (suppression de pièces jointes, KPI commerciaux, note d'interaction, recherche hotline par nom), et corriger les bugs UX rencontrés en chemin (redirection après reconnexion, session expirée, historiques).

---

## ✅ What Worked

1. **Diff structurel de la spec avant d'écrire une ligne** — un script node de ~20 lignes qui compare les jeux d'opérations, les schémas et **les descriptions champ par champ** entre `git show HEAD:docs/api-docsV4.json` et l'arbre de travail. C'est ce qui a trouvé, à chaque fois, le vrai contenu de la mise à jour : 2 DELETE, puis `InteractionDto.note`, puis `telephone`/`nom` exclusifs. Trois fois sur quatre, le titre de la mise à jour ne disait pas ce qui avait réellement changé.
2. **Vérifier la prémisse de l'utilisateur avant de coder.** Sur « les notes ne s'affichent pas », l'exploration a montré que `description` **était** déjà rendu aux six endroits ; le vrai problème était que le backend y mettait un tampon. Coder tout de suite aurait produit un correctif inutile.
3. **Scripts de patch écrits dans un fichier scratchpad puis lancés avec `node`** — jamais en heredoc. Voir « What Failed » : le transport du Bash tool mange les antislashs et interprète les backticks.
4. **Ancres de remplacement avec compteur d'occurrences** (`if (n !== 1) throw`) et `writeFileSync` **après** toutes les substitutions du fichier : un patch partiel n'est jamais écrit sur disque.
5. **Harnais HTML statiques servis en HTTP** pour valider le rendu quand l'authentification est impossible. Trois fois utile (marques KPI, frise, hotline). `file:` est bloqué par Playwright → petit serveur `node -e` en tâche de fond.
6. **Replier un 404 métier dans la valeur de succès** (union discriminée) plutôt que réécrire un hook de chargement : garde `useApi`, évite la règle `react-hooks/set-state-in-effect`.
7. **`git-flow start` + préservation des docs** : copier `docs/*.json` dans le scratchpad → `git checkout -- docs/` → `start` → recopier. Le `start` exige un arbre propre et refuse sinon.

---

## ❌ What Failed / Course-corrections

- **Heredoc `<<'EOF'` + `node -e` : le transport collapse `\\` → `\` et exécute les backticks.** Symptômes vus : une ancre regex `/^\\./` devenue `/^./` (0 correspondance), et un commentaire `` `replace` et non `push` `` remplacé par « No files replaced et non ». **Toujours passer par un fichier `.cjs` écrit avec l'outil Write.**
- **Accents supprimés par excès de prudence** dans un premier patch (« piece jointe », « Echec ») → il a fallu une seconde passe de correction. L'outil Write gère parfaitement l'UTF-8 : écrire le français correct du premier coup.
- **Commentaire JSX `{/* */}` placé entre deux attributs** d'un élément → `TS1005: '...' expected`. Il n'est valide qu'en position d'enfant.
- **`feature-index.mjs add` avant le commit** → « Nothing to record » : il lit `main..HEAD`. Ordre correct : **commit → add → generate → push**.
- **Palette `--chart-1..5` inutilisable en catégoriel** (voir Key Points).
- **La question à choix multiples a reçu deux réponses contradictoires** (« Afficher l'heure » + « ni l'un ni l'autre ») ; j'ai retenu le choix explicite et l'ai dit.

---

## 🐛 Bugs & Errors Log

| # | Error / Bug | Status | Fix applied |
|---|-------------|--------|-------------|
| 1-89 | Sessions antérieures (rotées) | — | — |
| 90 | Pièces jointes non supprimables depuis l'UI | Fixed | PR #12 — `removePieceJointe` / `removeReglementPieceJointe`, confirmation via `useConfirm`, garde-fou POINTED + rattrapage du 409 |
| 91 | 2 endpoints KPI sans consommateur | Fixed | PR #13 — `/performances` (admin) et `/mes-performances` (commercial) |
| 92 | **Après déconnexion, la reconnexion revient sur la page du compte précédent** | Fixed | PR #14/15 — effet dans `AuthGate` : `navigate('/', {replace:true})` quand `status === 'unauthenticated'` |
| 93 | **Après quelques minutes d'inactivité l'interface « bugge », il faut rafraîchir** | Fixed | PR #15 — le JWT expirait sans que rien ne le détecte : `AuthProvider` n'interrogeait `/api/mon-compte` qu'au montage. Accroche 401 globale + re-sonde au retour d'onglet |
| 94 | Note d'interaction absente du journal | Fixed | PR #17 — le backend a ajouté `InteractionDto.note` ; `description` est un tampon généré. Bascule sur `note` |
| 95 | Retours à la ligne des mémos écrasés en un seul paragraphe | Fixed | PR #16 — `whitespace-pre-line` + `break-words` dans `TimelineRow` |
| 96 | `formatDateTime` était un alias de `formatDate` — heure supprimée partout | Fixed | PR #16 — implémenté pour de bon (`DD/MM/YYYY HH:mm`). Était du **code mort**, aucun appelant |
| 97 | Recherche hotline limitée au téléphone | Fixed | PR #18 — `nom` exclusif de `telephone`, bandeau `tronque` |
| 98 | `emailEnvoye: false` (SMTP inactif) invisible : l'admin croit l'employé servi | Fixed | PR #17 — `EnvoiMailNotice` sur les deux écrans d'administration |
| 99 | **`--chart-1..5` échoue la validation catégorielle** dans les deux thèmes | Open (constat) | Contourné : les marques KPI n'utilisent qu'**une** teinte. À re-échelonner avant toute vraie série multiple |
| 100 | `workflowDescription \|\| statutDescription` masque le statut | Open (différé) | L'utilisateur a choisi de ne pas y toucher |
| 101 | 9 erreurs eslint préexistantes | Open (préexistant) | 8× `react-refresh/only-export-components` + 1× `set-state-in-effect` (`use-mobile.ts:14`) |

---

## 🔑 Key Points to Remember

- **Le Bash tool abîme les antislashs et les backticks.** Tout patch de code passe par un `.cjs` écrit avec Write, exécuté par `node`. Les fichiers sont en **CRLF** : normaliser les ancres (`t.replace(/\r?\n/g,'\r\n')`).
- **Portes de validation** : `npx tsc -b --force` (le `--force` est obligatoire, `tsc -b` a déjà masqué de vraies erreurs), `npx eslint src` → **doit rester à 9**, `npm run build`, plus `npm run check:contrast` quand on touche aux couleurs.
- **Aucune vérification authentifiée n'est possible** : pas d'identifiants, extension Chrome non connectée, Playwright part sans session. Le correctif #92 renvoie même tout visiteur anonyme vers `/`, donc les pages internes sont inatteignables. **Méthode de repli : harnais HTML statique servi en HTTP.** Les captures Playwright atterrissent à la racine du dépôt → les déplacer dans le scratchpad (`.playwright-mcp/` est gitignoré, pas la capture).
- **`InteractionDto` : asymétrie écriture/lecture.** On écrit dans `description` (`CreerInteractionRequest`), on lit dans **`note`**. Le `description` renvoyé est un libellé généré `JJ/MM/AAAA HH:MM <auteur>` sur 46 546 lignes sur 46 546 — **ne jamais l'afficher**. Les `HistoriqueDto` / `HistoriqueEvenementDto`, eux, ont un `description` qui est un vrai contenu.
- **Hotline : `telephone` XOR `nom`.** Les deux ou aucun → 400. Nom : sous-chaîne insensible casse+accents, 2 caractères mini, **plafond 20 fiches** et `tronque` **à afficher** (« MOHAMED » = 555 fiches). Sur une recherche par nom, `telephoneRecherche`/`telephoneNormalise` valent `null`.
- **Palette de graphiques** : `--chart-1..5` échoue la séparation daltonienne (ΔE 6,7) **et** la séparation en vision normale (ΔE 9,9) en clair ; en sombre elle échoue aussi la bande de luminosité. Chaque teinte passe le contraste ≥3:1 isolément. Les écrans KPI n'utilisent donc que `--chart-1` + `--chart-1-track` (ajouté), parce qu'ils encodent une **grandeur**, pas une identité. Validateur : `scripts/validate_palette.js` du skill `dataviz` (n'accepte que du hex → convertir l'OKLCH).
- **`useApi` aplatit les erreurs en chaîne et jette le `status`.** Pour distinguer un 404 métier : replier le cas dans la valeur de succès (union discriminée), pas un hook maison.
- **Le seuil de re-sonde de session (60 s) doit rester au-dessus du TTL du cache GET (30 s)** dans `api.ts`, sinon la sonde relit une promesse en cache et ne détecte jamais l'expiration.
- **Ordre de publication** : commit → `feature-index add` → `generate` → `push` → attendre la fusion → `sync`. `add` lit `main..HEAD`.
- **Protocole de branche tenu tout du long** : demander avant chaque `start`, toujours couper de `main` fraîchement tiré.
- Le cookie est `SameSite=Strict` → seul `tsiory.tech` (et localhost) authentifie ; les prévisualisations `*.vercel.app` ne peuvent pas se connecter.

---

## 📁 Important Files & Paths

- `src/components/Timeline.tsx` — **nouveau**, `TimelineList` / `TimelineRow`. Point unique des six historiques ; c'est là que vivent les règles « note » et « heure ».
- `src/components/kpi/{KpiMarks,PeriodeFilterBar,periode}.tsx|ts` — **nouveaux**. `periode.ts` est séparé exprès (un fichier ne peut exporter composant **et** fonction sans casser le Fast Refresh).
- `src/pages/kpi/{PerformancesCommerciaux,MesPerformances}.tsx` — **nouveaux**. Routes `/performances` (admin, via `AdminGuard`) et `/mes-performances`.
- `src/lib/auth.tsx` — accroche 401 + re-sonde au retour d'onglet + `sessionExpiree`.
- `src/lib/api.ts` — `setUnauthorizedHandler`, `removePieceJointe*`, KPI, `rechercherHotline(CritereHotline)`.
- `src/lib/format.ts` — `formatDateTime` réel, `formatHeures`.
- `src/lib/modules.ts`, `src/components/Layout.tsx`, `src/App.tsx` — la nav se modifie **aux trois endroits** : `modules.ts` ne mappe qu'un préfixe d'URL, le sous-menu est du JSX écrit à la main dans `Layout.tsx`.
- `src/index.css` — `--chart-1-track` ajouté (clair + sombre + binding Tailwind).
- `docs/api-docsV4.json` — le contrat. **Le diffusier avant toute écriture front.**

---

## 🔧 Environment & Config

- Windows 11, PowerShell + Bash. Fichiers **CRLF**.
- React 19 + TS + Vite 8 + Tailwind v4 + shadcn/Base UI, React Router v7. **Aucune bibliothèque de graphiques** — marques faites main en CSS.
- Backend Spring sur `:8080` — **était up** en fin de session (`/api-docs` → 200). SQL Server requis.
- Serveurs de dev : ports 5173-5177 occupés en fin de session (plusieurs `npm run dev` laissés par les vérifications ; les miens ont été arrêtés).
- Scratchpad de session : `C:\Users\tsiory\AppData\Local\Temp\claude\C--Users-tsiory-...\3e849c97-...\scratchpad` — contient les scripts de patch et les harnais, réutilisables comme modèles.

---

## ⏭️ Next Step
> Tout est fusionné (PR #12 à #18) et `main` est à jour ; il ne reste qu'à `node ../.claude/scripts/git-flow.mjs sync front`. Ensuite, **la dette réelle est la vérification** : rien de cette session n'a été cliqué sur données réelles authentifiées. Dérouler en priorité les scénarios listés dans le backlog ci-dessous, en commençant par la note d'interaction (#94) — c'est le seul dont on ignore encore s'il affiche bien quelque chose.

### Backlog (par priorité)
- [ ] **Vérifier sur données réelles** : note d'interaction (`note` non vide ?), suppression de pièce jointe + garde POINTED, `/performances` et `/mes-performances` (403 non-admin, 404 sans fiche employé), session expirée (baisser `app.jwt.expiration-minutes` à 1 pour tester), hotline par nom accentué + bandeau `tronque`, `EnvoiMailNotice` avec et sans SMTP.
- [ ] **Ré-échelonner `--chart-1..5`** avant toute série catégorielle réelle (bug #99).
- [ ] `statutDescription` masqué par `workflowDescription` (bug #100) — décision différée.
- [ ] Le Calendrier n'affiche ni note ni heure : `EvenementCalendrierDto` n'a pas de champ note (il a `interactionId`, mais aucun `GET /api/interactions/{id}` n'existe). Demande backend à formuler.
- [ ] Audit #6 — chips de filtres actifs (état de filtrage invisible une fois posé).
- [ ] Audit #3 — mobile : 18/27 pages sans breakpoint. **Décision de périmètre à prendre avec l'utilisateur.**
- [ ] 25 endpoints backend sans appelant front (voir `FEATURES.md`).
- [ ] 9 erreurs eslint préexistantes (#101) — à traiter à l'occasion.
- [ ] Étape filter `/prospections` encore codée en dur (`ETAPE_ITEMS`) au lieu de `/api/referentiels/etapes-prospection`.
- [ ] `MultiSelectDropdown.tsx` — champ de recherche jamais construit.
