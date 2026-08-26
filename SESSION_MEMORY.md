# Session Memory
_Last updated: 2026-08-25T13:45:00Z_
_Project: crm-prototype (Ayad Estate — CRM frontend), C:\Users\tsiory\Documents\ayad-internship\prototype\crm-prototype_

---

## 🎯 Current Objective
Rewrite the static-JSON Ayad Estate CRM prototype into a fully wired React frontend against the real Spring Boot backend, driven by successive OpenAPI spec revisions (`docs/api-docsV4.json`, a living document the backend team updates mid-project). This session: redesign/polish the prospection detail page (`ProspectionDetail.tsx`) — Choix article collapse, a real Devis/Offres feature, app-wide code splitting, and a full desktop+mobile polish pass.

---

## ✅ What Worked
- **`/impeccable` skill used for UI work this session** (user's project has it installed under `.claude/skills/impeccable`). For a scoped refinement of an existing screen, the skill's `new-work.md` routing rule applied: "a section/component inside an established surface inherits that surface" — no concept-seed roll, no DESIGN.md rewrite, just build in the existing shadcn/Tailwind + brand-purple vocabulary. `craft-floor.md` checks + `detect.mjs` mechanical scan run clean after every change this session.
1. **"Choix article" collapse** (prospection Article tab) — `ChoixArticleSection`'s full projet/tranche/catégorie/type picker + 47-row article table used to render unconditionally, cluttering the screen (per user's screenshot). Fixed by reusing the exact "Modifier"/"Terminé" toggle pattern already shipped in `NewDossier.tsx` last session: collapsed once a tranche principale exists, forced open only when nothing's picked yet. App now has one consistent convention across both screens.
2. **Devis ("Offres") — real implementation**, driven by a fresh v4 spec diff (`git show HEAD:docs/api-docsV4.json` → Node `Object.keys(paths)` set-diff, the proven repeated technique). Found new `GET /api/prospections/{id}/devis/{devisId}` and confirmed the existing list/create endpoints already return a full `DevisDto` with a `montants` (`MontantsOffreDto`, ~20-field HT/TTC breakdown) that the code hadn't caught up to (types were a 5-field stub, the create UI was raw-UUID text inputs). Implemented:
   - `types.ts`: full `DevisDto`, new `MontantsOffreDto`, richer `CreerDevisRequest` (sousArticleIds, prospectId/commercialId/modePaiementId overrides, remisePercent).
   - `api.ts`: new `getDevisById`.
   - `DevisFormSection` — real projet→tranche→catégorie/type→article cascade (mirrors `ArticleCascadePicker`'s mechanic but self-contained since it also needs a sous-articles multi-select via `MultiSelectDropdown`, a prix override, remise %, and mode de paiement), collapsed behind "Nouvelle offre" like every other picker on this page. Prospect/commercial silently default to the prospection's own per the backend contract — not re-asked in the form.
   - `DevisRow` — code/tranche/article/prix always visible, a "Montants" toggle expands the full HT/TTC breakdown grouped like the legacy Offre form's "Montants" tab (Avant remise / Remise / Prix de vente final), same expand-on-demand shape as `ArticleCompactPreview`.
   - **User explicitly rejected a table layout for the Offres list** ("un tableau sera mieux" → tried it → "non remet comme avant") — reverted `DevisRow`/the Offres section back to the bordered-card-row list. **Keep it card-row style; do not re-propose a table for this list.**
3. **App-wide code splitting** — `App.tsx`: every routed page under `AuthenticatedApp` converted to `React.lazy()`, `<Routes>` wrapped in `<Suspense fallback={<LoadingState />}>`. Login/onboarding gates stay eager (render before any route does). Fixed the `npx vite build` "chunks larger than 500 kB" warning — single 726 kB bundle → ~40 per-route chunks (largest ~222 kB vendor/theme chunk).
4. **Full polish pass on `ProspectionDetail.tsx`** (this session's last major task, via `/polish` skill) — desktop unchanged in spirit (already matched established Linear/Stripe/Attio density), mobile-specific fixes:
   - Header (title/badges + action buttons) — was a fixed vertical right-aligned button stack on all widths; now `flex-col` full-width-stretched buttons below `sm`, restores to the original right-aligned row above `sm`. Same treatment applied to the "commercial transformer" select+button row and the "Clôturer"/archiver reason+détail+confirm row.
   - Pipeline stepper — added `transition-colors duration-300` on the stage circles/connector for a smooth authored transition when étape changes; the 5 per-stage text labels (up to ~19 chars, e.g. "Avant concrétisation") are `hidden sm:block` since 5-across on a 360px phone would wrap into an unreadable ladder — replaced below `sm` with a single-line "Étape X/5 · <current label>" caption.
   - Toast — was `fixed bottom-6 right-6` (same copy-pasted pattern also present verbatim in `Hotline.tsx` and `DossierDetail.tsx`, **not touched this session, out of scope**); now `inset-x-4 bottom-4` (full-width, centered text) below `sm`, restores to the original bottom-right pill above `sm`.
   - `ArticleCascadePicker` + `DevisFormSection`'s Projet/Tranche selects — were fixed `w-[180px]`/`w-[190px]`, now `w-full sm:w-[180px]`/`w-full sm:w-[190px]` with the filter row `flex-col sm:flex-row`; same pattern duplicated in both components (they don't share code) so both needed editing separately — **a `replace_all` Edit only catches truly identical whitespace/indentation across both call sites; when indentation differs (nested one level deeper), it silently only replaces the first match despite reporting success — always grep to confirm both landed.**
   - Tabs row — `TabsList` is `w-fit`/`whitespace-nowrap` with no built-in scroll/wrap; 4 tab labels + 3 count badges can outgrow a narrow phone. Wrapped in a page-local `overflow-x-auto` div (didn't touch the shared `ui/tabs.tsx` primitive — used site-wide) using `-mx-4 px-4` to bleed to the screen edge, matching `.page`'s own mobile gutter exactly. **Breakpoint chosen deliberately as `min-[881px]:` (arbitrary Tailwind value), not the default `sm:` (640px)** — `.page`'s own mobile padding rule in `index.css` switches at `@media (max-width: 880px)`, so using `sm:` would have cancelled the edge-bleed 240px too early and reintroduced overflow risk between 640–880px.
   - `ArticleResultsList`'s scrollable table wrapper — checked whether it needed `overflow-x-auto` for mobile; **turned out unnecessary and reverted**: the shared `ui/table.tsx` `<Table>` primitive already wraps itself in `overflow-x-auto` internally, so the outer `overflow-y-auto` was already sufficient. Don't double-wrap.
- Verification discipline unchanged and re-run after every batch this session: `npx tsc -b`, `npx eslint <changed files>` (+ full `npx eslint src` sweep — only the same 10 pre-existing unrelated shadcn/hooks errors survive, confirmed untouched), `npx vite build && rm -rf dist`, and `node .claude/skills/impeccable/scripts/detect.mjs --json <changed file>` (clean `[]` every run).

---

## ❌ What Failed / Noteworthy flakiness
- **Browser-tool verification was attempted twice this session and rejected by the user both times** (`mcp__claude-in-chrome__tabs_context_mcp` calls interrupted) — each time the user redirected to a different concrete task instead (spec diff, table revert, code splitting, save-session). **Signal: don't reach for live-browser verification proactively this session; the user wants code-level work + tsc/eslint/build/detector verification, and will ask explicitly if they want a browser pass.** Not yet confirmed whether this is a lasting preference or just this session's flow — worth a light touch-check next time rather than assuming either way.
- `Edit` with `replace_all: true` reported "All occurrences were successfully replaced" while actually only replacing one of two textually-near-identical blocks, because the second had different leading whitespace (nested one indent level deeper in `DevisFormSection` vs `ArticleCascadePicker`). Always grep afterward to confirm every intended site changed — the tool's success message only means "the ones that matched" not "the count you expected."

---

## 🐛 Bugs & Errors Log

| # | Error / Bug | Status | Fix applied |
|---|-------------|--------|-------------|
| 1-21 | See prior sessions (package.json restore, calendrier freeze, a11y, filter code/description mismatches, `ArticleListItemDto` rename, référentiel filter objects, financing-schema `0` vs `—` bug, React Compiler memoization dep array, etc.) | Fixed/Open as before | Unchanged this session |
| 22 | Vite build warning: single 726 kB JS chunk (`(!) Some chunks are larger than 500 kB after minification`) | Fixed | `App.tsx` — every routed page converted to `React.lazy()` behind a `Suspense` boundary; bundle now ~40 per-route chunks, largest ~222 kB |
| 23 | `Devis`/`Offres` feature was a stub: 5-field `DevisDto`, raw-UUID-typing create form, no HT/TTC breakdown despite the backend already returning one | Fixed | Full `DevisDto`/`MontantsOffreDto`/`CreerDevisRequest` types, real cascading `DevisFormSection`, expandable `DevisRow` — verified against a re-diffed v4 spec |
| 24 | Mobile: "Choix article"/"Nouvelle offre" cascade pickers' Projet/Tranche selects were fixed-width (`w-[180px]`/`w-[190px]`), cramped on narrow viewports | Fixed | `w-full sm:w-[…]` + `flex-col sm:flex-row` filter row, in both `ArticleCascadePicker` and `DevisFormSection` (edited separately — see replace_all gotcha above) |
| 25 | Mobile: prospection detail Tabs row (4 labels + 3 count badges) has no wrap/scroll affordance in the shared `ui/tabs.tsx` primitive, risking page-width overflow on narrow phones | Fixed | Page-local `overflow-x-auto` wrapper with edge-bleed margin matching `.page`'s own `880px` mobile-padding breakpoint (`min-[881px]:` variant, not the default `sm:` 640px) — shared `ui/tabs.tsx` left untouched |
| 26 | Mobile: pipeline stepper's 5 per-stage text labels (up to ~19 chars) would wrap into an unreadable ladder under 5 columns on a ~360px phone | Fixed | Labels `hidden sm:block`; a single "Étape X/5 · <label>" caption shown only below `sm` |

---

## 🔑 Key Points to Remember
- **Devis/Offres list must stay a bordered-card-row list, not a table** — the user tried the table alternative mid-session and explicitly asked to revert. Don't re-propose it.
- **`DevisFormSection` and `ArticleCascadePicker` are two separate, non-shared implementations of the same projet→tranche→catégorie/type→article cascade mechanic** (both live in `ProspectionDetail.tsx`). They were never unified into one shared component — any future cascade-picker fix (styling, responsive width, new filter) needs to be applied to **both** call sites by hand; grep for `w-\[180px\]`/`w-\[190px\]` or `cascade-projet`/`devis-projet` id prefixes to find both.
- **Mobile breakpoint discipline**: most of this page's mobile fixes use Tailwind's default `sm:` (640px) for simple flex-direction/width toggles — that's fine and consistent with the rest of the app. The **one exception is the Tabs edge-bleed wrapper**, which must track `.page`'s own CSS breakpoint (`@media (max-width: 880px)` in `index.css`) via `min-[881px]:`, because it's tied to that exact padding value (16px mobile / 24px desktop), not an arbitrary UI judgment call. If `.page`'s breakpoint or padding ever changes in `index.css`, this wrapper needs to change with it.
- **`Table` (shared `ui/table.tsx`) already self-wraps in `overflow-x-auto`** — never add a second overflow-x wrapper around it "just in case"; check the primitive first.
- **`useModesPaiement`/`getModesPaiement` referentiel hook existed but was unused before this session** — now consumed by `DevisFormSection`'s mode de paiement field.
- Same date-time / Spring-sort-key / `_isMock` / status-derivation / référentiel code-vs-description gotchas from prior sessions still apply — nothing about those changed this session.
- **Nothing committed this session** (or any of the ~7 prior ones) — everything is still uncommitted. User has not asked for a commit yet.
- Dev server (`npm run dev`, background task) and the real backend at `http://localhost:8080` were both confirmed running mid-session, but no live-browser check actually completed this session (see What Failed) — code-level verification (tsc/eslint/build/detector) was the only verification that ran to completion.

---

## 📁 Important Files & Paths
- `src/App.tsx` — **rewritten this session**: every routed page is `React.lazy()`, `<Routes>` wrapped in `<Suspense fallback={<LoadingState />}>`. Login/onboarding gates (`Login`, `ChangePasswordGate`, `CompleteProfileGate`) stay eager imports.
- `src/pages/prospections/ProspectionDetail.tsx` — **heavily edited this session** (now ~1470 lines): `ChoixArticleSection` collapse-behind-Modifier pattern; full `DevisFormSection`/`DevisRow` implementation (replacing the old `DevisAddButton` stub); mobile polish across the header, pipeline stepper, étape/clôture rows, toast, cascade-picker filter rows, and the Tabs edge-bleed wrapper.
- `src/types.ts` — **changed this session**: full `DevisDto`, new `MontantsOffreDto`, richer `CreerDevisRequest`.
- `src/lib/api.ts` — **changed this session**: new `getDevisById`.
- `docs/api-docsV4.json` / `docs/api-docsV4.backup.json` — still show as modified in git status. This session's diff confirmed `GET /api/prospections/{id}/devis/{devisId}` and 9 other new paths (see chat for the full list: `/api/utilisateurs` POST, `/api/dossiers/simulation-financement` POST, `/api/prospections/{id}/tranche-principale` PATCH, `/api/tranches` GET, `/api/referentiels/tranches|sous-articles|projets|articles` GET, `/api/articles/{id}/sous-articles` GET — most already implemented in prior sessions per SESSION_MEMORY history; only the devis-detail endpoint and the richer `DevisDto`/`CreerDevisRequest` schema were new work this session).
- All other files listed as untouched in prior sessions' memory remain untouched this session too.

---

## 🔧 Environment & Config
- Windows 11, PowerShell primary shell, Bash tool also available (Git Bash/POSIX) — never use `/tmp` paths in Bash tool calls on this machine, use the session scratchpad directory instead.
- Stack: React 19 + TypeScript + Vite 8 + Tailwind v4 + shadcn/base-ui, React Router v7. React Compiler is active.
- This project has the **`/impeccable` design skill installed** (`.claude/skills/impeccable`) — used this session for both the "Choix article" refinement and the full polish pass. For narrow refinements of an already-established surface, its `new-work.md` routing says to inherit the existing visual world directly (no concept-seed roll, no DESIGN.md rewrite) — only run its heavier direction-roll machinery for a genuinely new surface or a deliberate visual-identity replacement.
- Backend confirmed running locally this session at `http://localhost:8080` (per curl checks in earlier sessions); dev server (`npm run dev`) also confirmed running via background task this session, but no live browser check was completed (see What Failed).
- Verification commands after every change: `npx tsc -b`, `npx eslint <changed files>` (+ full `npx eslint src` sweep before declaring done), `npx vite build && rm -rf dist`, `node .claude/skills/impeccable/scripts/detect.mjs --json <changed file>`. All clean as of end of session — only the same 10 pre-existing, unrelated shadcn/hooks eslint errors remain, and the bundle-size warning is now resolved.

---

## ⏭️ Next Step
> The `ProspectionDetail.tsx` polish pass (header, pipeline stepper, toast, cascade-picker filter rows, Tabs edge-bleed) is implemented and verified at the code level (tsc/eslint/build/detector all clean) but **has not been visually confirmed in a browser at either desktop or mobile width** — the user interrupted both browser-tool attempts this session to redirect to other tasks. If resuming, ask whether to (a) do a live browser pass now (desktop + a narrow/mobile viewport) to confirm the polish actually renders as intended, or (b) move on / commit.

### Backlog (optional)
- [ ] Live-verify in the browser: the full `ProspectionDetail.tsx` polish pass (header stacking, pipeline stepper mobile caption, toast positioning, cascade-picker responsive widths, Tabs horizontal scroll) at both desktop and mobile widths — never actually opened in a browser this session.
- [ ] Ask the user whether to commit this session's (and prior sessions') work — nothing committed across ~8 sessions now.
- [ ] The identical `fixed bottom-6 right-6` toast pattern is copy-pasted in `Hotline.tsx` and `DossierDetail.tsx` too — only `ProspectionDetail.tsx`'s copy got the mobile-responsive fix this session. Consider extracting a shared `Toast` component so this doesn't need fixing three times, and apply the same mobile fix to the other two if not extracted.
- [ ] Decide whether prospection search-criteria editing (Villes/Types de bien/Profils/Catégories, removed from the "Article" tab several sessions ago) needs a new home elsewhere in the page, or is intentionally gone — still unresolved, carried over.
- [ ] Consider reusing `ArticleCascadePicker` in `ArticleDetail.tsx` for consistency — still not done, out of scope so far.
- [ ] Consider unifying `ArticleCascadePicker` and `DevisFormSection`'s duplicated cascade-picker mechanic into one shared component — flagged this session as a maintenance risk (see Key Points) but not acted on, out of scope for a polish pass.
- [ ] `sidebar.tsx:726` + the other 9 pre-existing eslint errors — unrelated, fix opportunistically.
- [ ] Clean up `BACKUP_PATH`'s stale typo'd filename in `scripts/update-api-docs.mjs` (cosmetic, still open).
- [ ] Watch for recurrence of the ~30s slow-response issue on list endpoints — not investigated, backend-side.
- [ ] No pièce-jointe upload endpoint exists — read-only for now.
