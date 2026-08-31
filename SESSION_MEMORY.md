# Session Memory
_Last updated: 2026-08-30T00:15:00Z_
_Project: crm-prototype (Ayad Estate — CRM frontend), C:\Users\tsiory\Documents\ayad-internship\prototype\crm-prototype_

---

## 🎯 Current Objective
Continue wiring the React frontend against the real Spring Boot backend (`immo-crm`) driven by successive `docs/api-docsV4.json` revisions — this session: re-scoped the `autorisation-versement` endpoint (échéance → règlement), redesigned the "Documents générés" chip row into a tile grid, then ran a full 27-page UI/UX audit (`/ui-ux-pro-max`) and implemented its top 5 findings.

---

## ✅ What Worked

1. **Diffing the spec before touching code** (standing user instruction). `git diff docs/api-docsV4.json` showed one substantive change: `getAutorisationVersement` moved from `/dossiers/{id}/echeancier/{echeanceId}/documents/...` to `/dossiers/{id}/reglements/{reglementId}/documents/...`. Backend rationale in the new description: the fields that give the document value (`StlAccountId` 76%, `StlSettlementTypeId` 99.9%, `TierId` 99.7%) live on the règlement and almost never on the échéance (2/958, 1/958) — an échéance-scoped doc came out blank on nearly every real dossier. Frontend was still calling the old path → every click would 404.
2. **Grounding UI copy in the spec instead of inventing it.** The Documents générés redesign needed a one-line description per document; extracted them from each endpoint's own `description` in `api-docsV4.json` via a node script. 4 of 6 had real descriptions; `fiche-reservation`/`acte-reservation` have none, so those two lines were written deliberately modest.
3. **Auditing by grepping structure, not reading 10k lines.** Counting `sm:|md:|lg:|xl:` per page (18/27 = zero), `text-\[Npx\]` frequency (15 distinct values, 279 uses), `PageShell` prop adoption, and `{!loading && !error &&` render patterns surfaced every systemic finding cheaply and verifiably.
4. **Shared-primitive leverage again** — the codebase's recurring win. `useDebouncedValue` (`lib/useApi.ts`) + `ResultsRegion` (`components/ui.tsx`) fixed the worst interaction across all 9 list pages; `EmptyState`'s new `action` slot + `hasActiveProspectionFilters()` in `lib/domain.tsx` fixed empty states everywhere.
5. **Key realization on the loading bug**: `useApi` was *already* preserving `data` across refetches (`run()` never clears it) — the pages were simply choosing not to render it. So the fix was a render-condition change (`!loading && !error` → `!error && data`), not a data-flow change.
6. **Node scripts for mechanical multi-file edits**, with indentation-matched block finding for JSX close tags. Much faster than 20+ Edit calls. Must handle CRLF (`strip = l => l.replace(/\r$/,'')`) — first attempt silently `SKIP`ped every file without it.
7. **Verifying compiled output, not just source.** After the type-scale change, grepped `dist/assets/*.css` to confirm `.text-body{font-size:var(--text-body)}` etc. actually emitted (font-size only, no line-height, as intended). Tailwind silently drops unsupported classes — source-only checks would have missed it.
8. **Lint regression check via `git stash`**: captured the eslint error set before/after and diffed. Confirmed the 10 errors are all pre-existing (only a line-number shift in `useApi.ts`).

---

## ❌ What Failed / Course-corrections

- **The `/ui-ux-pro-max` `--design-system` result was largely off-target** and was explicitly rejected: it matched "real estate" the *industry* and returned a marketing **Hero-Centric landing** pattern plus a **Cinzel / Josefin Sans** luxury property pairing. Neither applies to an internal CRM. Only the Style match (**Minimalism & Swiss Style** — "Best For: Enterprise apps, dashboards, professional tools") was on target. **Lesson: for this project, query `--domain ux` targets directly; the industry-keyword design-system path misroutes to property-marketing profiles.** Self-hosted Geist Variable is correct and should not change.
- **Two self-inflicted regex bugs in the batch scripts** (both caught by tsc/review, both fixed — see bugs table): `\[search, ` also matched `const [search, setSearch] = useState`, and the `[search,`→`[debouncedSearch,` rule missed *multi-line* dependency arrays, leaving `ArticlesList` in a worse state than before (still one request per keystroke, now sending a stale term). **Lesson: after any scripted multi-file rewrite, grep for the pattern's variants (`^\s*search,$`) — don't trust that tsc catches it, since both halves still typecheck.**
- **`/tmp/foo` paths don't resolve for `node -e` on this machine** (resolves to `C:\tmp\...`, ENOENT) even though the Bash tool writes them fine via heredoc. Write the script to `/tmp/x.mjs` and `node /tmp/x.mjs` (works), but don't have node itself read from `/tmp`.
- **Scoped down deliberately**: did NOT restructure DossiersList's batch-document toolbar into a contextual selection bar. I'd labelled it "cheap" in the audit; on inspection it means reworking a working flow on a guess. Said so explicitly rather than doing it.

---

## 🐛 Bugs & Errors Log

| # | Error / Bug | Status | Fix applied |
|---|-------------|--------|-------------|
| 1-69 | See prior sessions' memory (rotated out) | — | — |
| 70 | `autorisation-versement` wired to the old échéance-scoped path — every click would 404 after the backend re-scoped it | Fixed | `lib/api.ts` URL + param renamed to `reglementId`; `AutorisationVersementButton` moved out of the échéance row into the règlement rows inside `EcheanceReglementsHistory`, beside `ReglementRecuButton` |
| 71 | "Documents générés" was 6 identical grey chips with 2–3 unlabeled 24px icon buttons (eye/download/file-down indistinguishable), no info scent, chip = the app's *status-label* language misapplied to primary actions | Fixed | Rebuilt as a responsive tile grid: per-doc icon, spec-derived description, PDF/PDF·Word badge, labelled "Aperçu" + "Télécharger" (Word choice moved into a `DropdownMenu`), inline error in the failing tile, `h-9 sm:h-7` targets |
| 72 | **Typing in any list destroyed the view** — `filters.search` a raw `useApi` dep (no debounce) + `{!loading && !error &&` unmounted table/count/pagination → 6 requests and 6 collapse-rebuild cycles typing "BENANI" | Fixed | `useDebouncedValue(v, 300)` + `ResultsRegion` (keeps stale rows at `opacity-55`, `aria-busy`, `pointer-events-none`; `LoadingState` only when `loading && !data`) across all 9 list pages |
| 73 | No type scale — 15 distinct arbitrary sizes / 279 uses incl. half-pixels (9.5, 10.5, 11.5, 12.5, 13.5, 14.5) | Fixed | 6 semantic `@theme` steps (`--text-micro/body/label/title/page/hero` = 11/12.5/13/15/19/21px); all 279 sites migrated, zero `text-[Npx]` remain |
| 74 | Script bug: `\[search, ` clobbered `const [search, setSearch] = useState('')` → `const [debouncedSearch, setSearch]` in 7 files | Fixed | Targeted repair script restoring the destructuring |
| 75 | Script bug: multi-line dep arrays not rewritten — `ArticlesList` fetcher used `debouncedSearch` while dep watched raw `search` (worse than before: per-keystroke fetch with a stale term) | Fixed | `ArticlesList.tsx:146` → `debouncedSearch`; swept `^\s*search,$` for other occurrences (none) |
| 76 | `prefers-reduced-motion` never respected anywhere in `src/` | Fixed | Global block in `index.css`; animations collapsed to ~0 (not removed — Base UI popups close on `transitionend`); `.animate-spin` exempt (busy status ≠ decoration) |
| 77 | Empty states were dead ends — "Ajustez vos filtres" with no button, and no distinction between filtered-empty and genuinely-empty | Fixed | `EmptyState` gained `action`; 9 lists branch on `hasActiveFilters` / `hasActiveProspectionFilters(filters)`; French generated from a per-noun gender table ("Aucune offre… enregistrée") |
| 78 | Seven duplicate `<h1>`s — Profil + all 6 detail pages rendered a second h1 for the record name while `PageShell` already renders one | Fixed | Demoted to `<h2>`; rule documented on `PageShell`'s `title` prop where the h1 is owned |
| 79 | `fullHeight` inconsistent across same-archetype list pages; Calendrier/Hotline/Profil/NewDossier had no section icon | Fixed | `fullHeight` + internal-scroll architecture on `ClientsList`; icons reused verbatim from `Layout.tsx`'s sidebar (Calendar/Phone/UserCircle/Folder). Tranches/Projets left on document scroll deliberately (short unpaginated lists) |
| 80 | DossiersList batch bar: choosing a doc kind left both buttons disabled next to "0 dossier sélectionné" with no explanation | Fixed | Replaced with "Cochez les dossiers à inclure dans le document." when nothing is selected |
| 81 | `useApi.ts` `react-hooks/set-state-in-effect` (+ 9 others incl. `sidebar.tsx`) | Open (pre-existing) | Untouched; verified via `git stash` diff that this session added zero new lint errors |

---

## 🔑 Key Points to Remember

- **`instructions/from_front.md` (backend repo `immo-crm`) remains the only file any session may read/write outside `crm-prototype`.** Unchanged hard rule; not needed this session.
- **Never initiate `mcp__claude-in-chrome__*` calls** — including for self-verification. Verify with `npx tsc -b`, `npx eslint src`, `npx vite build`, `node .claude/skills/impeccable/scripts/detect.mjs --json <files>`, and by grepping `dist/assets/*.css` for compiled classes. Describe results in text.
- **Type scale is now a real system — use it.** New UI must use `text-micro|body|label|title|page|hero`, never `text-[Npx]`. Named (not `text-xs`/`sm`/`base`) *on purpose*: those are Tailwind defaults consumed by the vendored shadcn primitives, and redefining them would silently restyle every one. Tokens are font-size only — ~40 sites pair them with an explicit `leading-*` that must keep winning.
- **`ResultsRegion` + `useDebouncedValue` are the list-page convention now.** Any new list must follow it: `{loading && !data && <LoadingState/>}` / `{!error && data && <ResultsRegion loading={loading}>…}`, and never put a raw search box value into `useApi` deps.
- **Color stays reserved-hue, not decorative** (`BadgeTone`); density/spacing changes belong in shared components (`ui/table.tsx`, `ui.tsx`'s `Card`/`Field`/`FieldGrid`/`StatCard`, `.page` in `index.css`) — always look for the shared primitive first. This session added `ResultsRegion` and `EmptyState.action` to that set.
- **`PageShell` owns the page's only `<h1>`.** Anything a page renders below it is `h2` or deeper.
- **Backend spec is the source of truth for UI copy about documents** — pull descriptions from `api-docsV4.json`, don't invent them; where the spec is silent, keep the wording modest and say so.
- **Commit workflow**: user says "commit it/same branch" frequently — always on `api-integration`, never a new branch, split by logical concern, with a separate `docs: sync api-docsV4` commit when the spec changed. `git add -p`/`-i` unavailable in this non-interactive shell, so same-file same-session changes bundle into one clearly-described commit rather than a faked split. Verify `tsc -b` + eslint clean before every commit.
- **`git status` can lie about what prior sessions committed** — check fresh. (True again this session: the V4 doc diff was sitting uncommitted at start.)

---

## 📁 Important Files & Paths

- `src/lib/useApi.ts` — **new** `useDebouncedValue(value, delay = 300)`; `useApi` itself unchanged (already preserved `data` across refetch).
- `src/components/ui.tsx` — **new** `ResultsRegion` (stale-while-revalidating list wrapper); `EmptyState` gained an `action` slot.
- `src/lib/domain.tsx` — **new** `hasActiveProspectionFilters(state)` (field-by-field diff vs `emptyProspectionFilters()`, so new filters are covered automatically; `ouvertes` defaults to `'open'`, not `'all'`).
- `src/index.css` — **new** type-scale `@theme` block (6 steps) + `prefers-reduced-motion` block.
- `src/components/PageShell.tsx` — `title` prop now documents the single-h1 rule.
- `src/pages/dossiers/DossierDetail.tsx` — `AutorisationVersementButton` re-scoped to `reglementId` and relocated to règlement rows; `GENERATED_DOC_HANDLERS` gained `description`/`Icon`; `GeneratedDocumentChip` → `GeneratedDocumentCard` (tile grid).
- `src/lib/api.ts` — `fetchAutorisationVersementBlob` now hits `/reglements/{reglementId}/documents/autorisation-versement`.
- 9 list pages (`Articles`, `Clients`, `Dossiers`, `Encaissements`, `Offres`, `PreProspections`, `Prospections`, `Prospects`, `Utilisateurs`) — debounce + `ResultsRegion` + branched empty states; `ClientsList` also converted to `fullHeight`.
- `docs/api-docsV4.json` / `.backup.json` — synced (autorisation-versement re-scope; backup also gained `/referentiels/natures` + `/referentiels/etages`).

---

## 🔧 Environment & Config

- Windows 11, PowerShell primary, Bash tool for POSIX bits. **Files are CRLF on disk** — any node script doing line-based edits must strip `\r`.
- Stack unchanged: React 19 + TS + Vite 8 + Tailwind v4 + shadcn/base-ui, React Router v7, self-hosted `@fontsource-variable/geist`.
- Verification: `npx tsc -b`, `npx eslint src`, `npx vite build` (~1s), `node .claude/skills/impeccable/scripts/detect.mjs --json <files>`.
- `/ui-ux-pro-max` search tool lives at `C:\Users\tsiory\.claude\skills\ui-ux-pro-max\scripts\search.py`; must `cd` there first, `python` works.
- **Nothing committed this session** — 48 files changed, ~1231/-487, all still in the working tree on `api-integration`.

---

## ⏭️ Next Step
> Commit the working tree as four logical commits on `api-integration`: (1) `fix:` autorisation-versement re-scoped to règlement, (2) `docs:` sync api-docsV4, (3) `feat:` Documents générés tile grid, (4) `perf/fix:` list debounce + stale-while-revalidating + type scale + reduced-motion + empty-state actions + frame consistency. Verify `tsc -b`/eslint clean first (was clean at session end).

### Backlog (carried over / accumulated)
- [ ] **Audit #6** — active-filter chips: filter state is invisible once set (7 controls, no summary of *why* you're seeing 12 of 374). Add dismissible chips + "N filtres actifs" count.
- [ ] **Audit #3 — mobile: a scope DECISION, not a bug.** 18/27 pages have zero breakpoints; tables survive via `overflow-x-auto` but the filter bars don't (hardcoded `min-w-55`/`w-32.5`/`w-65` wrap into a ~400px stack at 375px). Either collapse filters into a sheet below `md` + card fallback for tables, or explicitly close it as desk-only. **Ask the user.**
- [ ] DossiersList batch-document toolbar → contextual selection bar (deliberately skipped; needs a design decision on how it's actually used).
- [ ] `Skeleton` exists in `ui/skeleton.tsx` but only `sidebar.tsx` uses it — consider skeleton rows for first load.
- [ ] Confirm and build "S. articles" sum on `DossierDetail.tsx` if user confirms the mapping.
- [ ] from_front.md request #4 (Articles columns/filters gap: Type Présentation, Superficie Sous Articles, TVA, prix/surface range filters) — Nature/Étage partially delivered (detail-only, no list filter yet).
- [ ] Étape filter on `/prospections`/`/pre-prospections` (`ETAPE_ITEMS`) still hardcoded — should reuse `/api/referentiels/etapes-prospection`.
- [ ] `MultiSelectDropdown.tsx` search input (typing to filter) — long planned, never built.
- [ ] Remaining raw `<Select items={…}>` → `SearchableSelect` swaps (only `InteractionForm.tsx` done).
- [ ] Ask whether to push `api-integration` — never pushed across many sessions, well ahead of origin.
- [ ] 10 pre-existing eslint errors (`useApi.ts` set-state-in-effect, `sidebar.tsx:726`, +8) — fix opportunistically.
