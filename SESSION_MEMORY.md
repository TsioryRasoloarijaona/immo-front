# Session Memory
_Last updated: 2026-09-20_
_Project: crm-prototype (Arpent — CRM immobilier), C:\Users\tsiory\Documents\ayad-internship\prototype\crm-prototype_

---

## 🎯 Current Objective

**Redesign complet demandé le 20/09** (inspiration Attio/Linear/Pipedrive) : nouvelle
palette **indigo #4F46E5 sur fond blanc pur** (le violet Ayad est remplacé — le bleu
#2563EB a été proposé puis **rejeté par l'utilisateur**), hiérarchie de l'information
en 4 niveaux (agir/argent/état/métadonnées), et **zéro défilement de page** partout.
Construit **sur la branche `docs/demande-filtre-colonne`** à la demande explicite de
l'utilisateur (« construit dans le même branch »), qui portait déjà la demande
backend du filtre par colonne.

Maquette validée avant le code : https://claude.ai/code/artifact/d5cdd55f-132c-47fa-a613-5e743d192d54
(Dashboard 1512×712, un 1080p à 125 %).

---

## ✅ What Worked

1. **Maquette HTML avant le code.** L'utilisateur a choisi « montre des maquettes
   d'abord », a validé la direction… puis rejeté le bleu. Le rejet a coûté un
   republish d'artifact, pas une réécriture de l'app.
2. **`npm run check:contrast` lit le CSS réel** : les 52 paires AA revalidées en une
   commande après le remplacement complet de la palette. Zéro échec.
3. **Grep du compilé après build** : 0 occurrence du violet (`5d396e`, `c9a6d6`),
   6 de l'indigo, 0 de l'ancien fond gris — la migration est totale, prouvée.
4. **Le mécanisme zéro-scroll existait déjà** (`fullHeight` de PageShell + chaîne
   `min-h-0`) : 9 pages sur 18 l'avaient. Généraliser = poser la géométrie, pas
   l'inventer. `Card` accepte `className` et son contenu est ciblable par
   `[&>[data-slot=card-content]]:…` pour la distribution de hauteur.
5. **Fusionner plutôt que compresser** : le Dashboard tenait en un viewport en
   supprimant les doublons (prospections et dossiers rendus 2×, 3 KPI redondants,
   « Leads du jour » vide 140px), pas en rapetissant les contenus. 10 appels → 8.

---

## ❌ What Failed / Course-corrections

- **PowerShell a corrompu l'encodage de ProspectDetail.tsx** : un patch regex via
  `Get-Content -Raw` + `WriteAllText` a lu l'UTF-8 sans BOM comme ANSI → mojibake
  sur tous les accents (`â€”`, `RenseignÃ©`). Réparé par `git checkout --` puis
  refait avec l'outil Edit. **Ne JAMAIS patcher un fichier du projet par le shell —
  Write/Edit uniquement.** (Même famille que les heredocs bash de la session
  précédente.)
- **Guillemets doubles dans un message de commit via PowerShell 5.1** : les `"` de
  l'argument natif ont éclaté le message en pathspecs. Message sans guillemets, ou
  guillemets français.
- **Le bleu #2563EB validé en maquette a été rejeté après coup** — troisième
  direction de palette du projet. L'indigo a été choisi par élimination : statuts
  réservés (vert/rouge/ambre), teal et bleu rejetés, violet quitté.

---

## 🐛 Bugs & Errors Log

| # | Error / Bug | Status | Fix applied |
|---|-------------|--------|-------------|
| 101 | 9 erreurs eslint préexistantes | Open | **La référence est 9** — inchangée après tout le redesign |
| 155 | `FEATURES.md` invente 17 endpoints « sans appelant » | Open (outil) | — |
| 156 | `CreerReglementRequest.dateReglement` publiée mais refusée en 400 | Open (backend) | — |
| 164 | Kanban « Dossier de vente » compte les actifs, liste tout | Open | Toujours vrai dans le nouveau couloir (slice 3 de dossiersPage non filtré) |
| 167 | `derniereAlerteDate` ni filtrable ni triable | Open (backend) | — |
| 168 | Filtre par colonne client-side ment (chèque → 0/180) | Open (backend) | Demande dans `docs/filtres-avances.md`, PR toujours pas fusionnée |
| 169 | **Corruption d'encodage par patch shell** (cette session) | Fixed | `git checkout` + Edit tool ; règle : jamais de patch par shell |

---

## 🔑 Key Points to Remember

### La palette (commit `29ac050`)
- **Accent unique indigo** : `--brand #4f46e5` clair / `#a5b4fc` sombre, hover
  `#4338ca`/`#c7d2fe`. `--bg`/`--background` = **blanc pur** (la piste documentée
  « cartes détachées par filet et ombre » est devenue la valeur). Gris **re-voilés
  vers l'indigo** (la leçon « gris teinté = dessiné » est conservée, seule la teinte
  du voile a tourné). Statuts inchangés. Charts oklch hue 320→277.
- **L'en-tête d'index.css porte tout l'historique** — violet→essais→retour→indigo.
  Le lire avant tout changement de couleur. C'est la **troisième** direction ; en
  cas de nouveau doute, re-demander à l'utilisateur avant d'écrire.
- `TONE_GLYPH`, la densité de grille Omran (`--row-h` 24px), DataGrid : intouchés.

### Le zéro-scroll (commits `29ac050` + `456b1a6`)
- **Dashboard refondu** : fullHeight, bande KPI 4 tuiles, file « À rappeler » à
  gauche (336px, deux sections empilées Aujourd'hui/En retard, bascule Moi/Équipe),
  **pipeline fusionné en 5 couloirs** (Pré-prospection / À traiter (ambre) /
  Prospections / Clients / Dossier de vente), synthèse annuelle + dossiers récents
  en pied (`min-[1500px]:flex-row`). Supprimés : « Vente — actualité », « Leads du
  jour », « Prospections récentes » (doublons), 1 StatCard relances (le compte vit
  dans l'en-tête de la file).
- **Sept pages converties** : Calendrier (grille 6 semaines étirée, cellules
  flexibles), TranchesList (cartes → table dense), TrancheDetail (identité 1 ligne,
  règles compactées, scroll interne), ProspectDetail/ClientDetail (géométrie
  FicheShell, 6 TabsContent en `min-h-0 flex-1 overflow-y-auto`), Hotline
  (recherche 1 ligne, résultats seuls défilants), MesPerformances,
  PerformancesCommerciaux (filtre période épinglé).
- **Restent en défilement de page** (non traités, par choix ou par risque) :
  ProjetsList, les formulaires (NewDossier, NewProspect…), EncaissementDetail
  (déjà fullHeight mais hors FicheShell), et les régimes minceur non faits :
  barre de filtres Encaissements (2 rangées), carte « document en lot » de
  DossiersList, fusion des 8 onglets de ProspectionDetail.

### Vérification
- Quatre portes inchangées : `npx tsc -b --force` · eslint = **9** ·
  `npm run check:contrast` · `npm run build`. Plus le grep du compilé.
- **Rien n'a été vu au navigateur cette session** — tout le redesign est à
  vérifier visuellement par l'utilisateur (thème sombre inclus, jamais rendu).

---

## 📁 Important Files & Paths

- `src/index.css` — palette entière remplacée (light + dark), en-tête historique
  enrichi d'une section « Redesign du 20/09 ».
- `src/pages/Dashboard.tsx` — réécrit intégralement (structure un-viewport).
- `src/pages/calendrier/Calendrier.tsx`, `src/pages/tranches/TranchesList.tsx`
  (réécrit), `src/pages/tranches/TrancheDetail.tsx`,
  `src/pages/prospects/ProspectDetail.tsx`, `src/pages/hotline/Hotline.tsx`,
  `src/pages/kpi/MesPerformances.tsx`, `src/pages/kpi/PerformancesCommerciaux.tsx`.
- Maquette : scratchpad `maquette-dashboard.html` → artifact
  `d5cdd55f-132c-47fa-a613-5e743d192d54` (version indigo).

---

## 🔧 Environment & Config

- Windows 11, PowerShell 5.1 + Git Bash. Fichiers **CRLF** (les fichiers réécrits
  par Write sont en LF — git les renormalisera, warning bénin).
- Branche **`docs/demande-filtre-colonne`**, commits `7178179` (demande backend),
  `eed50d5` (mémoire), `29ac050` (palette+dashboard), `456b1a6` (zéro-scroll ×7).
  **Poussée, PR toujours non fusionnée.** `origin/main` = `532e3a2`, inchangé
  depuis le 15/09.
- L'utilisateur écran **125 %** : viewport CSS ≈ 1536×~780.

---

## ⏭️ Next Step

> **Vérification visuelle par l'utilisateur** (`npm run dev`) : Dashboard en
> indigo/blanc — un seul viewport ? — puis thème sombre (jamais rendu), puis
> Calendrier, Tranches, fiche Client, Hotline. Ajuster sur retours avant de
> poursuivre les régimes minceur.

### Backlog (par priorité)

- [ ] Retours visuels sur le redesign (palette indigo, densités, deux thèmes).
- [ ] Régimes minceur restants : filtres Encaissements 1 rangée + popover, carte
      « document en lot » de Dossiers → toolbar contextuelle à la sélection,
      fusion des onglets pauvres de ProspectionDetail (8 → 6).
- [ ] EncaissementDetail → FicheShell (uniformisation).
- [ ] ProjetsList : borner la hauteur (`overflow-auto` non contraint, ligne 56).
- [ ] #164 — couloir « Dossier de vente » : compte les actifs, liste tout.
- [ ] Faire fusionner la PR `docs/demande-filtre-colonne` (elle porte maintenant
      le redesign entier + la demande backend filtre par colonne).
- [ ] #155, #156, #167, #168 — inchangés (backend/outillage).
- [ ] 9 erreurs eslint préexistantes (#101).
