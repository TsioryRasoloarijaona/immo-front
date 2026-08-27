# Session Memory
_Last updated: 2026-08-27T00:00:00Z_
_Project: crm-prototype (Ayad Estate — CRM frontend), C:\Users\tsiory\Documents\ayad-internship\prototype\crm-prototype_

---

## 🎯 Current Objective
Continue wiring the React frontend against the real Spring Boot backend, driven by successive `docs/api-docsV4.json` revisions — this session: Dashboard Pipeline Kanban, cascade-reference tabs across Prospection↔Prospect↔Dossier, commercial self-assign on transform, filter/DB audits, a full DossierDetail Aperçu/Documents redesign pass, and wiring the new pièce-jointe upload endpoint.

---

## ✅ What Worked
1. **Doc-driven backend-gap workflow** (the default pattern all session, used ~6 times successfully): when a UI need requires data the API doesn't expose, (a) check `docs/api-docsV4.json` live via a one-off `node -e "...doc.components.schemas.X.properties..."` script, (b) if missing, hand the user an *exact* JSON Schema snippet (field name/type/description/DTO/operation), (c) wire the frontend defensively now — optional TS field + "NOT YET IN docs/api-docsV4.json" comment + UI branch that stays dormant until populated. Confirmed end-to-end twice this session: `DossierDetailDto/DossierListItemDto.prospectionId/prospectionCode` (requested → user added → verified live → dormant-comments cleaned up) and `POST /api/dossiers/{id}/pieces-jointes` (user announced "new endpoint", found and wired same session). Still open: `ProspectionDetailDto.dossierId/dossierCode` (reverse link, exact schema already handed to user).
2. **Dashboard Pipeline Kanban** (`Dashboard.tsx`): replaced the old "Dossiers par étape" bar chart with a 4-lane Kanban (Pré-prospection/Prospections/Clients/Dossier de vente) using new reusable `KanbanColumn`/`KanbanItemRow` components — generic over `accent`/`accentBg`/`countTone` so "Vente — actualité" (Nouveau/À traiter) reuses the *same* components with semantic info/amber accents instead of the shared identity accent. `StatCard` (`ui.tsx`) gained a `tone` prop reusing the existing Badge palette.
3. **Cascade-reference tabs across the pipeline**: `ProspectionDetail.tsx` → "Prospect" tab; `DossierDetail.tsx` → "Prospection" tab; `DossiersList.tsx` → "Prospection" column (stopPropagation badge link). `ProspectDetail.tsx`'s existing "Prospections" tab already covered the reverse (prospect→pré-prospect origin) — nothing needed there.
4. **Commercial self-assign on Transform**: resolves `ownCommercial = commerciaux.find(c => c.id === user?.employeeId)` — if the logged-in user is themselves a commercial, the "pick a commercial" dropdown disappears, their name shows read-only, Transformer assigns straight to them. Falls back to the old Select for non-commercial users.
5. **Filter/DB audit** (two separate user questions this session): confirmed Origine/Commercial/Tranche filters + all "Recherche multi-critère" search boxes are real server-side calls (not client-side filtering) across `/prospections`, `/dossiers`, `/devis`, `/prospects`. Flagged **Étape** filter (`ETAPE_ITEMS` in `ProspectionsList.tsx`) as hardcoded literals despite a real référentiel endpoint existing — user hasn't asked for the fix yet, don't do it unprompted. Confirmed `/api/prospects` genuinely only supports `search`+`type[]` server-side (no commercial/étape/tranche — ProspectListItemDto doesn't even carry a commercialId) — so "make Prospects filters match other sections" only had one real fix: search placeholder wording.
6. **DossierDetail Aperçu redesign**: "Client" card now fetches full contact via `getClient(d.clientId)` (téléphone/email/ville/adresse/type + "Fiche complète" link); "Article(s) réservé(s)" now fetches full detail via `getArticle()` per article and renders via `ArticleCompactPreview` (gained a `defaultExpanded` prop + a "Tranche" field) instead of a bare 4-field row.
7. **DossierDetail Documents tab redesign** (via `/impeccable`, screenshot-driven): 5 stacked full-width `Card`s (title + identical boilerplate line + buttons) were the "same-size cards as page structure" anti-pattern, forcing a scroll for what's just a list. Collapsed into one `Card` ("Documents générés (5)") containing 5 compact rows (`GeneratedDocumentRow`), mirroring the already-established `PieceJointeRow` row shape in the same file. Dropped the repeated "Document généré à partir des informations du dossier." line entirely (zero information, 5× repeated). Ran the Impeccable mechanical detector (`node .claude/skills/impeccable/scripts/detect.mjs --json <files>`) after — zero findings.
8. **Pièce-jointe upload wired**: `POST /api/dossiers/{id}/pieces-jointes` (multipart/form-data) — couldn't reuse `request()` (always JSON-encodes), built a standalone `uploadPieceJointe()` in `api.ts` with the same Spring ProblemDetail error-parsing inlined. UI: `AddPieceJointeRow`, same collapsed-ghost-button-expands-to-inline-form convention as `AddReglementRow`/`AddEcheanceRow` already in the file — file picker (styled label wrapping a hidden `<input type=file>`) + optional description + Envoyer/Annuler.
9. **`/impeccable` used mid-session**: ran `context.mjs`, noted `PRODUCT.md` is stale (still describes the old static-JSON-no-backend phase — real content is fine as background, just don't trust it over CLAUDE.md/live code for anything backend-related), proceeded as a narrow refinement directly on the incumbent implementation per routing rules (no DESIGN.md needed for a scoped layout fix). Loaded `craft-floor.md` before editing — its "same-size cards as page structure" ban directly named the Documents-tab problem.

---

## ❌ What Failed
- None this session — an in-flight `npx vite build` verification call was rejected mid-turn by the user (they wanted to redirect to the `/impeccable` Documents-tab request instead), not a technical failure; the pending edits were already safe on disk and verified clean afterward.

---

## 🐛 Bugs & Errors Log

| # | Error / Bug | Status | Fix applied |
|---|-------------|--------|-------------|
| 1-40 | See prior sessions' memory (rotated out) | — | — |
| 41 | Dashboard "Dossiers par étape" bar chart had no cross-entity pipeline visibility | Fixed | Pipeline Kanban (`KanbanColumn`) |
| 42 | "Vente — actualité" panel had dead gap, no containment | Fixed | Reused `KanbanColumn` w/ semantic accent |
| 43 | No cascade reference between Dossier/Prospection/Prospect | Fixed | Tabs + list column, `prospectionId` field added by user mid-session |
| 44 | Commercial had to manually self-select when transforming a prospection | Fixed | Auto-resolve via `user.employeeId` |
| 45 | Étape filter on Prospections list is hardcoded, not DB-backed | Open (user hasn't asked for fix) | Flagged only |
| 46 | DossierDetail "Client"/"Article(s)" showed minimal fields | Fixed | Fetch full `getClient`/`getArticle`, richer FieldGrid + `ArticleCompactPreview` |
| 47 | DossierDetail "Documents" tab forced a scroll (5 stacked cards) | Fixed | Collapsed to 1 card, 5 compact rows |
| 48 | No pièce-jointe upload UI (endpoint didn't exist) | Fixed | `uploadPieceJointe` + `AddPieceJointeRow`, endpoint landed this session |
| 49 | `ProspectionDetailDto.dossierId` still missing (reverse of #43) | Open | Exact schema already given to user, "Ouvrir le dossier" stays dormant until added |

---

## 🔑 Key Points to Remember
- **Always re-verify the live spec before assuming a field is missing** — the user edits `docs/api-docsV4.json` directly between turns, sometimes without an explicit "endpoint ready" announcement (this session: pieces-jointes upload was found via a search after the user just said "new endpoint to upload file"). Cheap check: `node -e "const doc=JSON.parse(require('fs').readFileSync('docs/api-docsV4.json','utf8')); console.log(Object.keys(doc.components.schemas.X.properties))"` or grep `doc.paths` for a keyword.
- **`user.employeeId`** (`UtilisateurCourantDto`) = the `CfgTier.id` for the logged-in employee, same id space as `commerciaux` (`CommercialListItemDto[]` from `useAppData()`) — the bridge for any "current user as business entity" feature.
- **`KanbanColumn`/`KanbanItemRow`** (`Dashboard.tsx`) are the reusable primitives for "lane of records + count + mini list + footer link" — generic over `accent`/`accentBg`/`countTone`.
- **Section-identity color convention holds**: `--sec-accent` = one shared hue per entity type (icon shape is the real identity signal); reserved status hues (`--success`/`--warning`/`--info`/`--amber`) are for real semantic states only. Don't re-diverge into per-entity hues.
- **Not every "make X consistent" request has a real fix** — verify against actual OpenAPI params first; some entities (e.g. Prospect) genuinely don't support the same filter dimensions as others.
- **Two document-fetch helper shapes in `api.ts`**: `fetchDossierDocumentBlob(dossierId, kind, format)` for the pdf/docx-capable pair (fiche-reservation, acte-reservation) vs `fetchDossierPdfOnlyDocumentBlob`/`fetchProspectionDocumentBlob` (no format param) for the pdf-only kinds added last session. `GENERATED_DOC_HANDLERS`'s `hasDocx` flag drives which button set `GeneratedDocumentRow` renders.
- **`request()` in `api.ts` always JSON-encodes the body** — file uploads (multipart/form-data) can't go through it; `uploadPieceJointe` is a standalone `fetch` with `FormData`, duplicating `performRequest`'s ProblemDetail error-parsing inline. If another upload endpoint appears, extract a shared helper instead of duplicating a third time.
- **`/impeccable` in this repo**: `PRODUCT.md` exists but is stale (describes the pre-backend static-JSON phase); no `DESIGN.md`. For narrow refinement commands (polish/layout on existing code), routing proceeds directly on the incumbent implementation without blocking on `init`/`new-work`. `craft-floor.md`'s bans are genuinely useful as a checklist (caught the Documents-tab "same-size cards" pattern precisely) — load it right before editing UI, not for planning. Run `detect.mjs --json <changed files>` once after building, not in a loop.
- **Established collapsed-inline-form convention** (now used 3×: `AddReglementRow`, `AddEcheanceRow`, `AddPieceJointeRow`): ghost "+ Label" button when closed → bordered `bg-muted/30` row with inputs + Ok/Envoyer + Annuler when open. Reuse this shape for any future "add a thing inline" UI rather than a modal.

---

## 📁 Important Files & Paths
- `src/pages/Dashboard.tsx` — Pipeline Kanban (`KanbanColumn`/`KanbanItemRow`), "Vente — actualité", `StatCard` tones.
- `src/components/ui.tsx` — `StatCard.tone` prop.
- `src/pages/prospections/ProspectionDetail.tsx` — "Prospect" tab, merged Documents segmented control, `ownCommercial` self-assign, `p.dossierId` check (dormant).
- `src/pages/dossiers/DossierDetail.tsx` — "Prospection" tab, richer Client/Article(s) cards (`getClient`/`getArticle`), Documents tab collapsed to `GeneratedDocumentRow` list, `AddPieceJointeRow` upload form.
- `src/pages/dossiers/DossiersList.tsx` — "Prospection" column.
- `src/components/ArticleCompactPreview.tsx` — `defaultExpanded` prop, "Tranche" field added.
- `src/lib/api.ts` — `uploadPieceJointe` (new, multipart), plus everything from prior sessions.
- `src/types.ts` — `DossierDetailDto`/`DossierListItemDto.prospectionId/prospectionCode` (now live), `ProspectionDetailDto.dossierId/dossierCode` (still dormant).
- `src/pages/prospects/ProspectsList.tsx` — search placeholder wording aligned.

---

## 🔧 Environment & Config
- Windows 11, PowerShell primary, Bash tool for POSIX bits.
- Stack unchanged: React 19 + TS + Vite 8 + Tailwind v4 + shadcn/base-ui, React Router v7.
- Verification commands unchanged: `npx tsc -b`, `npx eslint <files>`, `npx vite build && rm -rf dist`. All clean as of end of session on every file touched.
- Impeccable skill present at `.claude/skills/impeccable/` — `context.mjs` and `detect.mjs` both run successfully this session; no active design hook (`MANUAL_DETECTOR_REQUIRED` — must run `detect.mjs` by hand after edits).
- Pre-existing, still-unfixed, unrelated eslint errors (10 of them, carried over many sessions) — not touched.

---

## ⏭️ Next Step
> Waiting on the backend for `ProspectionDetailDto.dossierId`/`dossierCode` (exact schema already given to the user). Once added: re-verify via the node-script spec check, confirm "Ouvrir le dossier" activates on `ProspectionDetail.tsx` and the `NewDossier.tsx` redirect guard — no code changes needed, already wired.

### Backlog (carried over / accumulated)
- [ ] Étape filter on `/prospections`/`/pre-prospections` (`ETAPE_ITEMS`) is hardcoded — should reuse `/api/referentiels/etapes-prospection` (`useEtapesProspection`, already used elsewhere on the same page). Flagged, not yet requested by user.
- [ ] `MultiSelectDropdown.tsx` search input (typing to filter) — planned since an earlier session, never built.
- [ ] Remaining raw `<Select items={…}>` → `<SearchableSelect>` swaps across other files.
- [ ] Live-verify anything in a real browser — still never opened, user has repeatedly declined; don't initiate unprompted.
- [ ] Ask the user whether to commit — nothing committed across many sessions now.
- [ ] `sidebar.tsx:726` + 9 other pre-existing unrelated eslint errors — fix opportunistically.
- [ ] Consider whether `Hotline.tsx`/`Calendrier.tsx` should get a `PageShell` icon accent — deliberately left unaccented, revisit if asked.
