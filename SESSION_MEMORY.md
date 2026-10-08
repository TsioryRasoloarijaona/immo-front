# Session Memory — crm-prototype
_Last updated: 2026-10-08 (end of day)_ · state and decisions only (≤ 3 KB); history = git log + FEATURES.md

## Current state

- Fiches de détail rebalanced (#83, docs/FEATURE-fiche-equilibre.md): identity in the title line,
  parcours on one line, one 4-col grid + grey footer, activity tab = one-line summary + main action
  above the table, line tabs with counters. Shared shell: CadreFiche (entete/parcours/typeFiche),
  ChampsFiche (GrilleFiche, PiedFiche), FicheShell (OngletsLigne, LigneActivite).
- Full fiches in dialogs (#81): `usePreview().ouvrirFiche{Prospection,Dossier,Prospect}`, stacked in
  PreviewProvider, closed on any navigation (location.key). FicheDossier/FicheProspect extracted.
- Actions récentes menu in the sidebar (#80), opens full fiches; « Nouvelle prospection » on the
  prospect fiche (#82).
- None of #80–#83 seen in a browser by Claude (no Chrome extension) — user checks.
- Front PRs: the manager merges them itself once build + review are green.

## Open

- #193: Outils module hard to find (people look under Administration); possible sidebar link.
- #187 (backend): any authenticated 500 comes back as 401 → logout.
- #192: « Archivé : Oui » fixed on the backend, not checked on screen.
- #191: name search limited to the period; #182: CSV import up to 5 000 lines in one go.
- #156, #167, #168, #183: backend gaps (dateReglement, sort/filter on derniereAlerteDate,
  client-side column filters, Catégorie filter).
- 10 pre-existing eslint errors (#101); `harness-densite.tsx` to delete.
- `GET /api/prospects/{id}/prospections` sends `typeProspectionCode: null` → links go via the R5 hop.
- `yesRemsTest` has 0 ComProspection: no live end-to-end test of the vente flow possible there.
- `CLAUDE.md` still describes the static-JSON phase.

## Rules worth remembering

- Sort on the **entity property** (`docDate`), never on the DTO field.
- Dates: `todayISO` / `jourISO` from `lib/format.ts`, never `toISOString().slice(0,10)`.
- `useApi`: always destructure `error`; render on `!error && data`.
- `buildQuery` repeats arrays (`a=x&a=y`); `postMultipart` goes through it.
- Exporting a hook next to components → eslint `react-refresh/only-export-components`.
- Action buttons inside a clickable row: `stopPropagation` on `onClick` **and** `onKeyDown`.
- Notifications `z-60`, dialogs `z-50`. `ApercuCourrier` stays white in dark mode on purpose.
- List pattern: `PageShell` + `DataGrid` + `ColonneGrille[]` (see `ClesApiList`).
