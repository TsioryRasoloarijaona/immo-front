# Session Memory — crm-prototype
_Last updated: 2026-10-08_ · state and decisions only (≤ 3 KB); history = git log + FEATURES.md

## Current state

- `feat/parcours-vente` (docs/FEATURE-parcours-vente.md): shared `ToastProvider` (action link =
  persistent toast; nested provider inside `FicheProspectionDialog`, modal hides #root), toasts with
  « Ouvrir → » after conversions, R5 redirect by `typeProspectionCode`, `ParcoursVente` bar on the
  fiche (origin unknown → no Pré-prospection step). Only list/fiche prospection toasts migrated.
  Part 3 « Actions récentes » (needs backend: who in StrHistory + feed endpoint) not started.
- Import sélectif merged (#78 era): « Nouvelles » / « Doublons » checkboxes on the CSV import.
- Merged on `main`: Outils › Virements module wired to `generateur-virement` (`src/lib/virements.ts`,
  `/svc/virement` behind the Vite proxy in dev), Dashboard filtered by tranche (admin only),
  Arpent access from the Omran accounts.

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
