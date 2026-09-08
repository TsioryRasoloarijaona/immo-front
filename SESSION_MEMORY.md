# Session Memory
_Last updated: 2026-09-07T10:00:00Z_
_Project: crm-prototype (Ayad Estate — CRM frontend), C:\Users\tsiory\Documents\ayad-internship\prototype\crm-prototype_

---

## 🎯 Current Objective
Three unrelated pieces of maintenance on the deployed app: fix the Vercel SPA deep-link 404 (`vercel.json`, merged as PR #10), resolve the 8-file merge conflict from bringing `main` into `refractor/best-practice`, and diff the latest `docs/api-docsV4.json` update to see whether it introduced a new document generator (**it did not**).

---

## ✅ What Worked

1. **Reading the whole component before resolving a conflict, not just the hunk.** Decisive on the pièces-jointes conflicts: everything *outside* the markers was already main's post-S3 version, so HEAD's side referenced `busyAction`/`busy` (state that no longer exists), called `handle('view')` (now zero-arg), and used `Download` (not even imported in `ArticleDetail`). It could not compile. The hunk alone looked like a legitimate two-sides choice; the surrounding 40 lines proved one side was dead.
2. **Attributing each conflict to the commit that caused it** — `git log --oneline HEAD..MERGE_HEAD -- <file>` per conflicted file. Collapsed 10 hunks into exactly 2 causes (`939e8e7 perf(cache)` on 6 files, the S3 pièces-jointes pair on 2), which made the resolutions mechanical instead of case-by-case.
3. **Recognising complementary, not competing, changes.** The 4 `tranches` hunks: main added a cache key (`useApi(…, [], 'tranches-filtre')`), the branch added `useMemo` around `trancheItems`. Correct resolution was **both**, not either. Taking "main's side" wholesale would have silently dropped the branch's memoization.
4. **`tsc -b --force` after resolving, not plain `tsc -b`.** The incremental build info masked errors; `--force` caught the real one (duplicate `clearApiCache` import).
5. **Grepping for markers *and* asking git separately.** `grep -rn '^<<<<<<<'` returned "none" while `git diff --diff-filter=U` still listed all 8 files as unresolved — markers gone ≠ staged. Both checks are needed.
6. **Structural spec diff instead of reading raw JSON.** A ~40-line node script comparing route sets / operation bodies / schema keys between `git show HEAD:docs/api-docsV4.json` and the working tree gave `152 → 152, +0/-0, 2 modified ops` in one shot.

---

## ❌ What Failed / Course-corrections

- **I told the user the merge resolutions were "gone" — that was wrong.** After the user switched to a new branch, the working tree showed main's version of `ProspectionsList.tsx` etc., and I read that as a revert. It was simply a *different branch* (`feat/resevation-model`, cut from main). The merge had in fact been committed as `fe5a204 "fix merge"` and every resolution survived. **Lesson: before concluding work was lost, check the branch it lived on (`git log <branch>`, `git grep <probe> <branch>`), not the current working tree.**
- **The user's premise on the docs update didn't hold.** Asked to check a "new file generator" in the spec update; there is none — 152 routes before and after, identical route set, zero schema changes. The réservation generators already existed and were already fully wired. Said so plainly rather than inventing a finding.
- **`$schema` key in `vercel.json`** → removed. Functionally useless to Vercel and it made VS Code emit "Unable to load schema … untrusted".
- **`git-flow.mjs` has no merge command** (`start`/`commit`/`push`/`sync`/`status` only). Its `commit` does `git add -A` + a normal commit, which is the wrong shape for concluding a merge and would have re-staged the 180 files just removed from the index.

---

## 🐛 Bugs & Errors Log

| # | Error / Bug | Status | Fix applied |
|---|-------------|--------|-------------|
| 1-81 | See prior sessions' memory (rotated out) | — | — |
| 82 | **Vercel 404 on every deep link** — `immo.tsiory.tech/pre-prospections` returned Vercel's `NOT_FOUND`; only entering via `/` worked, F5 broke the app | Fixed | Added `vercel.json` with a catch-all `{"source": "/(.*)", "destination": "/index.html"}` rewrite. Rewrites run *after* the filesystem check, so hashed `dist/assets/*` still serve normally. Merged as PR #10 |
| 83 | 8 files / 10 hunks conflicted merging `main` into `refractor/best-practice` | Fixed | See "Key Points" for the per-cause resolution rules. Committed as `fe5a204` |
| 84 | **`clearApiCache` imported twice in `auth.tsx`** — both sides added it at different positions in the same import block, so git auto-merged *both* with no conflict marker. `TS2300: Duplicate identifier` | Fixed | Removed the second occurrence. **This is the dangerous class: a silent auto-merge defect outside every marker** — only `tsc` caught it |
| 85 | Merge re-added **180** `.agents/` + `.claude/skills/` files that the branch had just untracked (`7d0733a`) and gitignored (`4dfbf39`) — they were *new on main* via `3df77e1 "egent"`, so the branch's deletion didn't cover them | Fixed | `git rm -r --cached .agents .claude` before concluding the merge. User confirmed the choice |
| 86 | Expected a "new file generator" in the docs update — none exists | Not a bug | Spec unchanged structurally (152→152 routes, 0 new schemas); update is 3 description edits + 6 in the backup |
| 87 | **`SameSite=Strict` blocks auth from any non-`tsiory.tech` origin** — per the new `POST /api/auth/connexion` description, the browser won't attach the cookie, so every post-login call goes anonymous | Open (constraint) | Not fixable frontend-side. Means **`*.vercel.app` preview deploys cannot log in**. Only the `tsiory.tech` production domain authenticates |
| 88 | `GET /api/dossiers/{id}/documents/fiche-reservation` and `.../acte-reservation` have **empty `summary` + `description`** — the only 2 of 27 document endpoints undocumented | Open (backend) | Springdoc annotation gap. Why those two tiles' UI copy had to be hand-written. Candidate for `immo-crm/instructions/from_front.md` |
| 89 | 9 pre-existing eslint errors | Open (pre-existing) | Was 10 last session; the branch's `useApi` refactor fixed the `set-state-in-effect` there. Remaining: 8× `react-refresh/only-export-components` (`badge`/`button`/`sidebar`/`tabs`/`appData`×2/`auth`/`theme`) + 1× `set-state-in-effect` (`use-mobile.ts:14`) |

---

## 🔑 Key Points to Remember

- **`vercel.json` now exists and must not be deleted.** Without the catch-all rewrite every route except `/` 404s in production. It is the whole fix for #82.
- **The backend cookie is `SameSite=Strict`** → the frontend *must* be served from `tsiory.tech`. Preview/staging on another domain will look "randomly broken": login appears to succeed, then everything 401s. Documented in the spec's `connexion` description as of this update.
- **Merge-conflict resolution rules established this session** (they will recur — `refractor/best-practice` is a 10-commit perf/a11y branch against a moving `main`):
  - `useApi` **cache key + `useMemo` are complementary** — keep both, never pick a side.
  - Anything on the branch side touching pièces-jointes is **pre-S3 dead code**. Main's single "Ouvrir" action is deliberate: the presigned URL is served `Content-Disposition: inline`, so a separate "Télécharger" would do the same thing while lying. Take main's structure, **graft the branch's a11y** (`role="alert"`, `aria-label`) onto it.
  - `showToast` was extracted to `lib/useToast` (`d6679a7`, timer-leak fix). **Never reintroduce a local `function showToast` with a bare `setTimeout`** from main's side of a conflict.
- **After resolving, always `tsc -b --force`** — plain `tsc -b` can skip stale-but-broken files, and the worst defects (#84) sit *outside* the conflict markers where git auto-merged both sides.
- **`.claude` and `.agents` are gitignored on `refractor/best-practice`.** Any future merge from `main` will keep trying to re-add them until main drops them too — re-run `git rm -r --cached .agents .claude` before concluding.
- **Diffing the spec before frontend work remains the standing rule** and stays cheap via the structural-diff script. This time it disproved an assumption rather than catching breakage — equally valuable.
- **`GET /api/dossiers` `trancheId` semantics widened**: now matches "au moins un article lié — **ou l'article principal**". Same filter can return *more* dossiers than before. `projet` is now "résolu par la tranche de l'article principal".
- **Branch protocol held**: asked before cutting `fix/vercel-spa-rewrite`, and asked before dropping the 180 files. Both were the user's call.

---

## 📁 Important Files & Paths

- `vercel.json` — **new, merged to main via PR #10.** 8 lines, rewrites-only (no `$schema`, no cache headers — deliberately minimal).
- `docs/api-docsV4.json` + `.backup.json` — **modified, uncommitted** on `feat/resevation-model`. 3 + 6 description edits, no structural change.
- `src/lib/auth.tsx` — merge kept main's `clearApiCache` comment (it describes *both* caches and the failed-POST path); duplicate import removed.
- `src/pages/{dossiers/DossiersList,prospections/OffresList,prospections/ProspectionsList,prospections/PreProspectionsList}.tsx` — all four now `useApi(…, [], 'tranches-filtre')` **and** `useMemo`'d `trancheItems`.
- `src/pages/prospections/ProspectionDetail.tsx` — main's `if (loading && !p)` guard kept; main's leaky `showToast` dropped in favour of `useToast`.
- `src/pages/articles/ArticleDetail.tsx`, `src/pages/dossiers/DossierDetail.tsx` — single "Ouvrir" action + `role="alert"` / `aria-label` grafted on.
- `/tmp/specdiff.mjs`, `/tmp/showconf.mjs` — throwaway helpers (structural OpenAPI diff; conflict-region printer). Worth recreating, not preserved.

---

## 🔧 Environment & Config

- Windows 11, PowerShell primary + Bash tool. **Files are CRLF** — git warns `LF will be replaced by CRLF` on the docs files; harmless.
- Stack unchanged: React 19 + TS + Vite + Tailwind v4 + shadcn/Base UI, React Router v7.
- Verification used: `npx tsc -b --force`, `npx eslint src`, `npx vite build` (~1.7–3 s). All green at session end.
- Git: `main` = `07bd958`. `refractor/best-practice` = `fe5a204` (**merge commit, 2 parents, 10 commits ahead of its remote — NOT pushed**). `feat/resevation-model` = local only, never pushed, off `07bd958`.
- `git-flow.mjs` commands: `status` / `start` / `commit` / `push` / `sync` only — **no merge support**; conclude merges with plain git.

---

## ⏭️ Next Step
> Decide what `feat/resevation-model` is actually for. The branch is cut but carries only the 2 modified docs files. If a réservation-document generator was expected on the backend, restart it and re-run `npm run docs:update` — the current spec has **no new endpoint** (152→152 routes), so either the backend wasn't rebuilt or the endpoint lacks springdoc annotations. Otherwise commit the 2 docs files as a `docs: sync api-docsV4` commit and state the branch's real goal.

### Backlog (carried over / accumulated)
- [ ] **Push `refractor/best-practice`** — 10 commits ahead of its remote including the merge `fe5a204`; PR not opened. Ask first.
- [ ] Report to `immo-crm/instructions/from_front.md`: `fiche-reservation` / `acte-reservation` missing `@Operation` summary+description (bug #88).
- [ ] Confirm the widened `trancheId` semantics (#87 note) don't break any frontend assumption about dossier counts per tranche.
- [ ] **Audit #6** — active-filter chips: filter state invisible once set; add dismissible chips + "N filtres actifs".
- [ ] **Audit #3 — mobile: a scope DECISION, not a bug.** 18/27 pages have zero breakpoints; filter bars break at 375px. Responsive, or explicitly desk-only? **Ask the user.**
- [ ] DossiersList batch-document toolbar → contextual selection bar (needs a design decision on real usage).
- [ ] `Skeleton` exists in `ui/skeleton.tsx` but only `sidebar.tsx` uses it — consider skeleton rows for first load.
- [ ] from_front.md request #4 (Articles columns/filters: Type Présentation, Superficie Sous Articles, TVA, prix/surface range filters).
- [ ] Étape filter on `/prospections` / `/pre-prospections` (`ETAPE_ITEMS`) still hardcoded — should reuse `/api/referentiels/etapes-prospection`.
- [ ] `MultiSelectDropdown.tsx` search input (typing to filter) — long planned, never built.
- [ ] Remaining raw `<Select items={…}>` → `SearchableSelect` swaps (only `InteractionForm.tsx` done).
- [ ] 9 pre-existing eslint errors (#89) — fix opportunistically.
