# Session Memory
_Last updated: 2026-08-19T04:35:00Z_
_Project: crm-prototype (Ayad Estate — CRM frontend), C:\Users\tsiory\Documents\ayad-internship\prototype\crm-prototype_

---

## 🎯 Current Objective
Rewrite the static-JSON Ayad Estate CRM prototype into a fully wired React frontend against the real Spring Boot backend, driven by successive OpenAPI spec revisions (`docs/api-docsV0.json` → `V1` → `V2` → `V3` → `docs/qpi)docsV4.json` — note the V4 filename typo, it's the real/current spec and gets edited live by the user as the backend evolves).

---

## ✅ What Worked
- Full rewrite to backend DTO model (French field names verbatim), no adapter layer — user's explicit choice.
- Lightweight custom GET-cache in `api.ts` (TTL + in-flight dedup + mutation clears whole cache) instead of a heavier library.
- `fetchByteEndpointBlob()` — shared helper for every `format: byte` file endpoint (pièces jointes, fiche/acte de réservation): decodes base64-string / JSON-number-array / raw blob, tags with a guessed MIME type, throws on 0-byte results.
- `viewX()` pattern: `window.open('', '_blank')` called **synchronously** before the async fetch (preserves user-gesture, avoids popup blocker), then `win.location.href = objectUrl` once ready.
- `downloadX()` pattern: delayed `URL.revokeObjectURL()` (`setTimeout(..., 2000)`) — revoking immediately after `a.click()` races the browser's save and causes 0 KB downloads.
- `normalizeStatus()` / `canonicalStatusLabel()` in `dossierStatus.ts` — strips accents + uppercases for comparison, since backend's raw `statut` string ("CONCRETISATION") doesn't match the display pipeline's casing/accents ("Concrétisation"). All stepper/badge/filter code must compare through this, never with `===`.
- `toApiDateTime(dateOnly)` in `lib/format.ts` — pads `<input type="date">`'s `"YYYY-MM-DD"` to `"YYYY-MM-DDT00:00:00"`. **Required** for every request field typed `format: date-time` in the OpenAPI spec, even when the UI only collects a date. Applied to: `ChangerStatutRequest.date`, `CreerEcheanceRequest.dateEcheance`, `CreerReglementRequest.dateReglement`, `CreerProspectRequest.dateNaissance`, `pieceIdentite.delivreeLe`/`.valideJusquau`.
- Asking the user directly for the real backend property name when a client-side guess 400s (e.g. sort field), rather than guessing repeatedly — user confirmed `docDate` (not `dateDocument`) is the real sortable column for dossiers; `sort: ['docDate,desc']` now works.
- `makeCachedListHook()` factory in `referentiels.ts` for every référentiel dropdown (modes de paiement, catégories de bien, catégories d'échéance, tier-types, etc.) — consistent pattern, easy to extend when a new référentiel endpoint appears in the spec.
- Using `AskUserQuestion` before building a page whose backend semantics were genuinely undocumented (e.g. Clients list: N+1-per-row financial aggregation cost, and how to determine "client" vs "prospect") — got clean, actionable answers instead of guessing twice.
- Verification discipline every change: `npx tsc -b`, `npx eslint <files>`, `npx vite build` then `rm -rf dist` — all must be clean before reporting done.

---

## ❌ What Failed
- `sort: ['dateDocument,desc']` on `GET /api/dossiers` → 400. Guessed the JPA entity's sortable property name from the *response DTO* field name (`dateDocument`); Spring validates `Pageable.sort` against the entity property, not the DTO field, and OpenAPI doesn't document entity internals. **Lesson: don't guess Spring sort keys from DTO field names — ask.** (Resolved: real column is `docDate`.)
- Sending plain `"YYYY-MM-DD"` to any backend field typed `format: date-time` → 400 Bad Request, silently (Spring's ProblemDetail body for these had no `detail`/`title`, just a bare timestamp/status/error/path — hard to diagnose from the message alone, had to reason from the OpenAPI schema).
- Assuming a spec file's content was fully checked after reading only the first ~2000 lines in one pass — missed `acte-reservation`, the dossier-level `/historique` endpoint, and later the entire `/api/clients` controller on first reads of V3/V4; user had to correct me each time. **Lesson: grep the whole file for a keyword before concluding "doesn't exist", and re-check spec files that show a more recent mtime than my last read — the user edits them live.**
- **First `/clients` implementation was fundamentally wrong**: assumed "Client" was a tier-type classification of a `/api/prospects` record, built a filter UI around `useTierTypes()`, and — worse — silently applied a *guessed* default type-filter (matching a tier-type label against `/client/i`) even when the dropdown showed "Tous types" selected, so the list always showed 0 results with no way for the user to see unfiltered data. User corrected the actual domain rule ("tout le monde dans un dossier de vente est un client") and it turned out a dedicated `/api/clients*` controller already existed in the spec — should have asked/grepped before building on an assumption. **Lesson: a "smart default" that silently overrides a UI control the user can see (e.g. a dropdown showing "Tous types") is a trap — never apply a hidden filter the visible state contradicts.**

---

## 🐛 Bugs & Errors Log

| # | Error / Bug | Status | Fix applied |
|---|-------------|--------|-------------|
| 1 | Pièce jointe downloads were 0 KB | Fixed | `URL.revokeObjectURL()` was called synchronously right after `a.click()`; delayed it 2000ms |
| 2 | "Voir" (preview) vs "Télécharger" not distinguished for pièces jointes | Fixed | Added `viewPieceJointe()`/`downloadPieceJointe()`, MIME guessed from extension via `EXTENSION_MIME` map |
| 3 | Status stepper (`DossierStatusStepper`) showed no clickable "next" button ever | Fixed | Backend `statut` ("CONCRETISATION") didn't match pipeline labels ("Concrétisation") on exact string match; added `normalizeStatus()`/`canonicalStatusLabel()` |
| 4 | `PATCH /api/dossiers/{id}/statut` → 400 | Fixed | `ChangerStatutRequest.date` is `format: date-time`; was sending bare `"YYYY-MM-DD"`; added `toApiDateTime()` |
| 5 | `POST /api/dossiers/{id}/echeancier` → 400 | Fixed | Same date-time bug as #4, in `CreerEcheanceRequest.dateEcheance`; also proactively fixed the identical bug in `CreerReglementRequest.dateReglement` and `CreerProspectRequest`'s 3 date fields before they were reported |
| 6 | New dossier not visible in `/dossiers` list after creation | Fixed | No `sort` param on `GET /api/dossiers` — backend's default order doesn't put new rows on page 0. First attempt `sort:['dateDocument,desc']` → 400 (wrong field name guess). User supplied real column name; now `sort: ['docDate,desc']`, confirmed working |
| 7 | New dossier's Prix could end up empty and unfixable | Fixed | No `PATCH /api/dossiers/{id}` exists to edit a dossier post-creation, so an empty auto-filled Prix was permanent. Made Prix a **required** field client-side in `NewDossier.tsx` (`canCreate` now checks it), with a visible warning when auto-fill from selected articles' `salePrice` yields 0 |
| 8 | Schéma de financement looked empty right after dossier creation, easy to miss the pre-filled inline form | Fixed | No bulk-seed endpoint exists for échéancier at creation time (confirmed, real API limitation) — added an explanatory info banner on `DossierDetail.tsx` when landing via `?nouveau=1`, pointing at the pre-filled "Ajouter une échéance" form |
| 9 | Status stepper only allowed jumping to statuses the API listed as "reachable" (`etapes-suivantes`) | Fixed (by request) | User wants free jumps to any status even skipping steps — `isClickable` no longer requires `!!step`; shows a non-blocking hint in the confirm popup when the target wasn't API-listed |
| 10 | New `/clients` page always showed "0 client" | Fixed | Root cause was a hidden guessed type-filter applied even when UI showed "Tous types" (see Failures) — removed entirely once the real `/api/clients*` endpoints were found and wired |

**All logged bugs are currently Fixed.** No known open bugs as of this update.

---

## 🔑 Key Points to Remember
- **Spec files are living documents the user edits mid-session.** `docs/qpi)docsV4.json` (note the typo in the filename — it is NOT `api-docsV4.json`) is the current one; V0–V3 are historical/reference only. Always re-grep the *current* V4 file for a keyword before saying an endpoint "doesn't exist" — check file mtime if in doubt. This has now bitten twice (missed endpoints on V3/V4, and the whole `/api/clients` controller) — **grep first, always, before any "doesn't exist" claim.**
- **`format: date-time` fields are a systemic trap.** Any `<input type="date">` feeding a request body field must go through `toApiDateTime()`. Check this immediately when adding a new date-backed form field — don't wait for a 400 report.
- **No dossier edit endpoint exists** (`GET /api/dossiers/{id}` only — no PATCH for general fields). Any field left blank/wrong at `POST /api/dossiers` creation time is **permanent** from the frontend's perspective. This is why Prix was made a hard-required field in `NewDossier.tsx`.
- **Spring `Pageable.sort` values reference JPA entity column names, not DTO field names**, and OpenAPI never documents this mapping. Never guess a sort key from a DTO field — ask the user/backend. Confirmed working: dossiers sort by `docDate` (not `dateDocument`).
- **No bulk-seed for schéma de financement at dossier creation** — confirmed real API limitation (`CreerDossierRequest` has no échéancier field). Frontend workaround: land on `/dossiers/{id}?nouveau=1` which opens the "Ajouter échéance" form pre-filled with `totalAPayer`/today's date, with an explanatory banner.
- **Backend statut strings don't match the frontend's display pipeline casing/accents** (`"CONCRETISATION"` vs `"Concrétisation"`). All status comparisons/lookups MUST go through `normalizeStatus()`/`canonicalStatusLabel()` in `src/lib/dossierStatus.ts` — never compare `d.statut` with `===` against a pipeline label.
- **Dossier status transitions are deliberately non-blocking, by explicit user decision (asked twice, confirmed both times)**: (1) don't hard-require the API's suggested `champDate` fields before allowing a transition, since real dossiers routinely have empty fields even once a status is reached; (2) every status in the pipeline is now clickable regardless of whether `GET /statut/etapes-suivantes` listed it as reachable — jumping past/skipping steps is allowed, with only a soft non-blocking warning shown when the target isn't API-confirmed reachable.
- **"Client" is not a tier-type classification** — it's simply anyone who is the `clientId` of at least one dossier de vente. The backend has a **dedicated `client-controller`** for this (`/api/clients`, separate from `/api/prospects`), added in V4. Don't rebuild client-side filtering/guessing logic for this again.
- **New in V4 discovered this session** (user pointed each one out after live-editing the spec — always re-check before assuming absent):
  - `GET /api/dossiers/{id}/documents/fiche-reservation?format=pdf|docx`
  - `GET /api/dossiers/{id}/documents/acte-reservation?format=pdf|docx`
  - `GET /api/dossiers/{id}/statut/etapes-suivantes`
  - `GET /api/dossiers/{id}/historique` (paginated, `HistoriqueEvenementDto{date,type,utilisateur,description}`) — distinct from `GET /api/prospects/{id}/historique` (`HistoriqueDto`, different shape, prospect-scoped)
  - `GET /api/referentiels/categories-echeance`
  - `GET /api/clients` (search+pageable → `PageDtoClientListItemDto`, server-aggregated `nbDossiers`/`totalAPayer`/`totalRegle`/`totalReste`), `GET /api/clients/{id}` (→ **same `ProspectDetailDto`** as `/api/prospects/{id}` — same underlying entity, different controller), `GET /api/clients/{id}/dossiers` (→ `PageDtoDossierListItemDto`)
- Currency: Moroccan Dirham `1 350 000,00 DH` format. Dates displayed `DD/MM/YYYY`, API dates are `YYYY-MM-DD` or full ISO date-time depending on the field's schema `format`.
- User writes to me in French; code comments and identifiers stay in French to match domain terms (matches legacy Omran system field names), but keep them concise, not the legacy system's verbose labels.
- Still no référentiel/lookup for: règlement `typeId`/`banqueId` (raw UUID text inputs), autres-tranches/devis tranche/article ids — revisit if a matching endpoint shows up in the spec.

---

## 📁 Important Files & Paths
- `docs/qpi)docsV4.json` — **the live/current OpenAPI spec** (typo'd filename, not `api-docsV4.json`). User edits this directly mid-session; always re-check it, and grep the *whole* file, not just the first ~2000 lines.
- `docs/api-docsV0.json` … `api-docsV3.json` — historical spec snapshots, reference only.
- `instructions/FIX-clients-and-module-switcher.md` — old pre-real-API spec doc; Partie 1 (Clients page, route `/clients`) was implemented this session; Partie 2 (module switcher) was already done previously.
- `src/lib/api.ts` — all HTTP calls; `request()`/`performRequest()` (GET cache + error parsing), `fetchByteEndpointBlob()`, `fetchDossierDocumentBlob()`, `fetchPieceJointeBlob()`, `triggerBlobDownload()`, `showBlobInTab()`, `getEtapesSuivantes()`, `listHistoriqueDossier()`, `getCategoriesEcheance()`, `listClients()`, `getClient()`, `listClientDossiers()`.
- `src/lib/dossierStatus.ts` — `DOSSIER_STATUS_PIPELINE`, `DOSSIER_EXIT_STATUSES`, `normalizeStatus()`, `canonicalStatusLabel()`, `toneForStatus()`.
- `src/lib/format.ts` — `toApiDateTime()`, `formatCurrency`, `formatDate`, `todayISO`, etc.
- `src/lib/referentiels.ts` — `makeCachedListHook()` factory + all `useX` référentiel hooks.
- `src/components/DossierStatusStepper.tsx` — takes `nextSteps: EtapeSuivanteDto[]`; **every** pipeline/exit status is clickable now (not gated on being API-listed); shows confiance badge + optional date field when the API did list the step, else a soft "non listé comme atteignable" hint; submits `step.statut` (raw API value) when known, else the display label.
- `src/pages/dossiers/DossierDetail.tsx` — tabs: `apercu | financier | documents | historique | admin`. Contains `AddEcheanceRow`, `AddReglementRow`, `PieceJointeRow`, `GeneratedDocumentCard` (fiche/acte de réservation), historique timeline tab.
- `src/pages/dossiers/NewDossier.tsx` — dossier creation form; Prix is now a hard-required field with auto-fill + warning.
- `src/pages/dossiers/DossiersList.tsx` — list with filters; `sort: ['docDate,desc']` on `listDossiers()`.
- `src/components/CreateProspectForm.tsx` — date fields fixed to use `toApiDateTime()`.
- `src/pages/clients/ClientsList.tsx` — **new this session**. Route `/clients`, sidebar entry between Prospects and Dossiers de vente. Uses `listClients()`; columns Code/Affiché comme/Mobile/Téléphone/Ville/Email/Dossiers/À payer/Réglé(green)/Reste(red). Row click → `/prospects/:id` (reuses existing detail page; no separate `/clients/:id` route since `GET /api/clients/{id}` returns the same `ProspectDetailDto`).
- `src/types.ts` — DTOs; recently added `EtapeSuivanteDto`, `HistoriqueEvenementDto`, `ChangerStatutRequest.date`, `ClientListItemDto`.
- `src/App.tsx`, `src/lib/modules.ts`, `src/components/Layout.tsx` — `/clients` route + `moduleForPath` + sidebar entry (UserCheck icon) added this session.

---

## 🔧 Environment & Config
- Windows 11, PowerShell primary shell, Bash tool also available (Git Bash/POSIX).
- Stack: React 19 + TypeScript + Vite 8 + Tailwind v4 + shadcn/base-ui, React Router v7.
- Backend: Spring Boot, expected at `http://localhost:8080` (`API_BASE_URL` in `api.ts`), assumed running locally by the user during testing (errors reported are live 400s from a real backend, not mocked).
- Verification commands used after every change: `npx tsc -b`, `npx eslint <changed files>`, `npx vite build && rm -rf dist` (build output isn't kept, just used to confirm a clean build).
- No auth, no persistence beyond backend calls — matches `CLAUDE.md` project scope (Ventes + Patrimoine modules only, no Achat/Location/Comptabilité/RH/Trésorerie).

---

## ⏭️ Next Step
> No pending task — `/api/clients*` endpoints confirmed present in V4 and fully wired (`ClientsList.tsx` + `listClients`/`getClient`/`listClientDossiers` in `api.ts`), verified clean (`tsc`/`eslint`/`vite build`). Wait for the user's next instruction or bug report; if they mention new V4 spec changes, re-grep `docs/qpi)docsV4.json` fully (not just a partial read) before concluding anything is missing.

### Backlog (optional)
- [ ] Règlement `typeId`/`banqueId` are still raw UUID text inputs — no référentiel endpoint found yet for either; re-check spec if one appears.
- [ ] Other UUID-text-input fallbacks noted earlier in the project (autres-tranches/devis tranche/article ids) — revisit if/when matching référentiel or browse endpoints show up in the spec.
- [ ] No pièce-jointe upload endpoint exists — read-only for now; revisit if backend adds one.
- [ ] `getClient()`/`listClientDossiers()` are defined in `api.ts` but not yet used anywhere in the UI (detail reuses `/prospects/:id` via `getProspect`/`listProspectDossiers` instead) — fine as-is since both return equivalent data, but available if a dedicated `/clients/:id` page is ever wanted.
- [ ] Consider addressing the Vite build warning ("chunks larger than 500 kB") via code-splitting if bundle size becomes a real concern — not urgent for a prototype.
