# Session Memory
_Last updated: 2026-08-27T15:45:00Z_
_Project: crm-prototype (Ayad Estate — CRM frontend), C:\Users\tsiory\Documents\ayad-internship\prototype\crm-prototype_

---

## 🎯 Current Objective
Continue wiring the React frontend against the real Spring Boot backend (`immo-crm`), driven by successive `docs/api-docsV4.json` revisions — this session: full Utilisateurs (admin) list, a new Articles section (list+detail) in Patrimoine, a new Encaissements section (list+detail) in Ventes, Article↔Dossier reverse-link surfacing, a static VOIP button, several réglement/référentiel wirings, a Dossiers search bug diagnosis, and a cross-device (LAN) connectivity fix. Also **established `instructions/from_front.md` in the backend repo (`immo-crm`) as the standing, sole-permitted channel for all backend endpoint requests** — this is now a hard rule, not just a convention.

---

## ✅ What Worked

1. **`instructions/from_front.md` protocol, now the load-bearing workflow of every session**: numbered requests (Contexte/Endpoint souhaité/Pourquoi/Contournement actuel), newest prepended to "Demandes en cours", moved to "Traitées" with a "livré" note once confirmed live — never deleted, kept as history. **Explicit user constraint: only this one file may be read/written outside `crm-prototype`** — no other file in the `immo-crm` repo (not even `CLAUDE.md`) may be touched or read. Used successfully end-to-end 7 times this session (see Bugs table). **Always re-verify claims against the live `docs/api-docsV4.json` before trusting an "endpoint ready"/from_front.md "livré" note** — caught one case this session where the backend's own from_front.md said a field was delivered but the JSON schema hadn't been regenerated yet; correctly refused to activate the dormant code until re-verified.
2. **Utilisateurs (admin) list** (`UtilisateursList.tsx`, new): wired `GET /api/utilisateurs` (search + disabled tri-state — the only two real server filters, confirmed against the live spec; deliberately did *not* add a fake role/type filter). Row action deep-links to `ReinitialiserMotDePasse.tsx` via `?admUserId=` query param (added `useSearchParams` there), cleaning up two stale "no user directory exists" comments in `NouvelUtilisateur.tsx`/`ReinitialiserMotDePasse.tsx`.
3. **Articles section** (new, Patrimoine — `ArticlesList.tsx` + existing `ArticleDetail.tsx` enhanced): first built against `GET /api/tranches/{id}/articles` (mandatory Tranche picker) because no flat endpoint existed; requested `GET /api/articles` (global, filterable) → delivered same session → rewrote the list to make Tranche an optional multi-select filter instead of a required gate, added `search`/`statut` (now truly "tous" capable)/`categorieId`/`typeId`. `ArticleDetail.tsx` gained `lotParentId` "Fait partie de" navigation and Tranche field (both already-live fields that were simply unsurfaced).
4. **Article↔Dossier reverse link**: user showed the legacy Articles grid (État/N° Dossier/Client columns, colored dot for reservation stage) and asked to replicate it + show "Dossier de vente" details on the article page. Wired dormant first (`dossierId`/`dossierCode`/`dossierStatut`/`clientId`/`clientNom` on both `ArticleListItemDto`/`ArticleDetailDto`, État column reusing `canonicalStatusLabel`/`toneForStatus` from `lib/dossierStatus.ts`, "Dossier de vente" card fetching via existing `getDossier()`) → requested in from_front.md, same names/shapes as `DossierListItemDto` on purpose (zero new mapping logic needed) → delivered same session, confirmed live, dormant comments cleaned up.
5. **Encaissements section** (new module under Ventes — `EncaissementsList.tsx` + `EncaissementDetail.tsx`): built off a legacy screenshot showing ~10 filters. `GET /api/encaissements` (global règlement catalogue across all dossiers) didn't exist — requested with the exact filter set from the screenshot → delivered same session, matches 1:1 (search/reference/entiteId/typeId/etat/compteId/depotId/comptabilise/champDate+range/montant range). Added 3 new référentiels (`entites`/`comptes`/`depots`). User explicitly rejected a Sheet/panel-based detail view ("no I want to navigate to a real page ... like dossiers de vente, prospections") → rebuilt as a real `/encaissements/:id` route matching every other detail page's pattern, which required requesting `GET /api/encaissements/{id}` as **blocking** (flagged distinctly from the other non-blocking requests in the file) → delivered same session.
6. **`AddReglementRow` (DossierDetail.tsx) UUID-text-input fix**: was a raw "UUID type de règlement" text box. Requested `types-reglement`/`banques` référentiels, explicitly asking the backend to confirm whether the existing `modes-paiement` référentiel was the same table (it wasn't — `StlSettlementType` vs `ComPaymentMethod`) rather than guessing and silently mis-wiring it. Delivered with a bonus `banqueObligatoire` flag on `TypeReglementDto` → now a real `Select` + conditional Banque `Select` shown only when required.
7. **Échéance règlement history**: `GET .../echeancier/{echeanceId}/reglements` went from undocumented to fully documented with a richer `ReglementDto` (added `reference`/`typeId`/`typeCode`/`typeLibelle`/`banqueId`/`banqueNom`/`payeurId`/`payeurNom`, replacing the old plain-string `type`). Wired as a collapsed-by-default "Détail des règlements" toggle per échéance row (`EcheanceReglementsHistory`), refetching automatically after a new règlement is added via a per-row `reglementsVersion` counter (required extracting the row into its own `EcheanceRow` component to hold that state legally).
8. **Static VOIP button**: added a non-functional "Appeler" button (Phone icon, toast "Intégration VOIP à venir.") to `ProspectionDetail.tsx` (covers both /prospections and /pre-prospections) and `DossierDetail.tsx` — exactly as requested, no real telephony.
9. **Dossiers search bug, diagnosed not "broken"**: user reported "le searchbar sur dossier de vente ne marche pas". Root cause: `GET /api/dossiers?search=` only ever matched `code`, but the frontend placeholder promised "client, code de dossier" — a client-name search that never existed. Fixed the placeholder to be honest first, then requested the backend extend `search` to also match client nom/prénom/raison sociale (matching `/api/prospects`' convention) → delivered same session, placeholder restored, zero other code changes needed (search param was already being sent through untouched).
10. **Cross-device (LAN) connectivity, two-part diagnosis**: user reported "when I try to access the app on other device on the network the backend cannot be reached." Front-end half (found and fixed directly, no backend needed): `API_BASE_URL` was hardcoded to `http://localhost:8080` — a LAN device loading the front from the dev machine's IP was still calling *its own* localhost, which has no backend. Fixed by deriving `API_BASE_URL` from `window.location.hostname` when `VITE_API_BASE_URL` isn't explicitly set; removed the hardcoded override from local `.env` (gitignored, safe to edit); added `server: { host: true }` to `vite.config.ts` so the dev server itself is LAN-reachable. Backend half: filed as request #7 (CORS + credentialed-cookie theory) — **the backend's actual root cause turned out to be different from my hypothesis**: CORS was already fine (`allowedOriginPatterns("*")` + credentials), the real bug was `app.jwt.cookie-secure=true` hardcoded with no dev profile — a `Secure` cookie is silently dropped by browsers over plain HTTP on a LAN IP (but tolerated on `localhost`, which browsers treat as a secure context even over HTTP) — so login always "succeeded" but no session ever persisted. Fixed via a new `application-dev.properties` (`cookie-secure=false`), opt-in via `SPRING_PROFILES_ACTIVE=dev`.

---

## ❌ What Failed
- None outright this session. One near-miss: almost trusted a from_front.md "livré" note for the Article↔Dossier fields without re-checking `docs/api-docsV4.json` — caught it, verified, found it genuinely wasn't live yet on that first check, correctly held off and only activated after a second re-check confirmed it.

---

## 🐛 Bugs & Errors Log

| # | Error / Bug | Status | Fix applied |
|---|-------------|--------|-------------|
| 1-49 | See prior sessions' memory (rotated out) | — | — |
| 50 | No admin screen to browse/filter user accounts (`GET /api/utilisateurs` existed, unused) | Fixed | `UtilisateursList.tsx`, search+disabled filters, deep-link to reset-password |
| 51 | No Articles list screen in Patrimoine (only per-Tranche browsing existed) | Fixed | `ArticlesList.tsx`, initially Tranche-gated then upgraded to flat catalogue once `GET /api/articles` landed |
| 52 | Article had no visibility into its reserving Dossier/Client/real status | Fixed | Reverse-link fields on both Article DTOs, État/N° Dossier/Client columns + "Dossier de vente" card |
| 53 | No Encaissements (règlements) screen anywhere in the app | Fixed | `EncaissementsList.tsx` + `EncaissementDetail.tsx`, `GET /api/encaissements(/{id})` |
| 54 | "Ajouter un règlement" required pasting a raw UUID for type de règlement | Fixed | `types-reglement`/`banques` référentiels, real `Select`s, conditional Banque field |
| 55 | No way to see the individual règlements behind an échéance's Réglé/Reste total | Fixed | `EcheanceReglementsHistory` collapsed toggle, live-refetch on add |
| 56 | "Dossiers de vente" search silently failed for client-name queries | Fixed | Backend extended `search` to match client name too; placeholder was temporarily corrected then restored |
| 57 | App backend unreachable from other devices on the LAN | Fixed | Front: dynamic `API_BASE_URL` + `vite.config.ts` `host: true`. Backend: `app.jwt.cookie-secure` dev profile (root cause was the cookie, not CORS as first hypothesized) |
| 58 | `ArticleListItemDto`/`ArticleDetailDto` "État plus riche"/Type Présentation/Superficie Sous Articles/TVA + Nature/Vocation/Étage/Entité/prix-surface-range filters | Open (request #4) | Only the Dossier/Client half (request #5) has been delivered; #4's remaining items still unconfirmed by backend |

---

## 🔑 Key Points to Remember
- **`instructions/from_front.md` (backend repo `immo-crm`) is the only file this session is allowed to read or write outside `crm-prototype`** — explicit, repeated user constraint. Never open/edit anything else in that repo (not `CLAUDE.md`, not source files) even to investigate a bug — write the question into from_front.md instead and wait for the user's answer/fix, as happened with the LAN cookie bug (my own hypothesis in the request was CORS; the backend's actual fix was the cookie flag — filing the question was still the right move, just don't assume your own diagnosis is the final answer).
- **Verification discipline reinforced this session**: `from_front.md` "livré" notes are the backend author's claim, not proof — always re-run the `node -e "...doc.components.schemas.X.properties..."` check against `docs/api-docsV4.json` before flipping dormant code live. Caught one real case of a premature "livré" claim this session (Article↔Dossier fields, first check came back empty, second check after the user re-exported the spec came back correct).
- **New global-vs-scoped endpoint pattern, now proven 3×**: when only a scoped listing exists (`/api/tranches/{id}/articles`) but the UI need is a flat catalogue, build the scoped version first (never block on the backend), request the flat global endpoint with the exact filter shape needed, then swap once delivered. Same shape both times: Articles (`GET /api/articles`) and implicitly Encaissements (`GET /api/encaissements` didn't have a scoped predecessor, but same "build against a screenshot, request exact params" approach).
- **Blocking vs non-blocking requests need to be flagged differently in from_front.md** — established this session for `GET /api/encaissements/{id}`: most requests have a working frontend fallback while waiting (dormant fields, narrower interim UI), but a real page route with no by-id endpoint has *no* fallback (it just 404s) — mark those `**bloquant**` explicitly so they don't get deprioritized like the cosmetic ones.
- **Reverse-link convention**: when requesting a reverse FK (Article→Dossier, previously Prospection→Dossier), always ask for the *same field names/types* as the existing forward DTO already uses (e.g. `dossierStatut` matching `DossierDetailDto.statut` exactly) — lets the frontend reuse existing display helpers (`canonicalStatusLabel`/`toneForStatus`) with zero new mapping code, and makes it trivial to verify the delivered schema is correct.
- **`localhost` is not a good proxy for "network works"** — it's treated as a browser secure-context exception (Secure cookies, mixed content, etc. all get waived), which can mask bugs (the cookie-secure bug here) that only manifest on a real LAN IP over plain HTTP. Worth testing via LAN IP occasionally, not just localhost, once the infra allows it.
- **`.env` is gitignored in this repo** — safe to edit directly for local dev-environment fixes (done this session for `VITE_API_BASE_URL`) without worrying about affecting other devs/commits.
- Section-identity color/icon conventions, established collapsed-inline-form pattern (`AddReglementRow`/`AddEcheanceRow`/`AddPieceJointeRow`/now also the "+X" toggles), and the doc-driven backend-gap workflow from prior sessions all still hold and were reused, not re-derived.

---

## 📁 Important Files & Paths
- `src/pages/utilisateurs/UtilisateursList.tsx` — new, admin user directory.
- `src/pages/utilisateurs/ReinitialiserMotDePasse.tsx` — `?admUserId=` prefill via `useSearchParams`.
- `src/pages/articles/ArticlesList.tsx` — new, global Articles catalogue (search/tranche/statut/catégorie/type filters, État/N° Dossier/Client columns).
- `src/pages/articles/ArticleDetail.tsx` — `lotParentId` nav, Tranche field, "Dossier de vente" card.
- `src/pages/encaissements/EncaissementsList.tsx` + `EncaissementDetail.tsx` — new module, full legacy-parity filter set.
- `src/pages/dossiers/DossierDetail.tsx` — `AddReglementRow` (real Select+conditional Banque), `EcheanceReglementsHistory`/`EcheanceRow`, static VOIP button.
- `src/pages/prospections/ProspectionDetail.tsx` — static VOIP button.
- `src/pages/dossiers/DossiersList.tsx` — search placeholder (client name now genuinely supported).
- `src/lib/api.ts` — `listUtilisateurs`, `listArticles`, `listEncaissements`/`getEncaissement`, `getTypesReglement`/`getBanques`/`getEntitesReferentiel`/`getComptesReferentiel`/`getDepotsReferentiel`, `listEcheanceReglements`; `API_BASE_URL` now dynamic (`window.location.hostname`-based).
- `src/lib/domain.tsx` — `ENCAISSEMENT_ETAT_LABELS`/`encaissementEtatLabel`/`encaissementEtatTone`.
- `src/types.ts` — `UtilisateurListItemDto`, `TypeReglementDto`, `EncaissementDto`, richer `ReglementDto`, Article↔Dossier reverse-link fields on both Article DTOs.
- `vite.config.ts` — `server: { host: true }` for LAN reachability.
- `.env` (local, gitignored) — `VITE_API_BASE_URL` override removed.
- `C:\Users\tsiory\Documents\project\immo-crm\instructions\from_front.md` — **the** backend-request channel; 7 requests filed this session, all resolved same-session except #4 (partially resolved via #5).

---

## 🔧 Environment & Config
- Windows 11, PowerShell primary, Bash tool for POSIX bits.
- Stack unchanged: React 19 + TS + Vite 8 + Tailwind v4 + shadcn/base-ui, React Router v7.
- Verification commands unchanged: `npx tsc -b`, `npx eslint <files>`, `npx vite build && rm -rf dist`. All clean as of end of session on every file touched.
- Backend LAN/dev run now needs `SPRING_PROFILES_ACTIVE=dev` (or `-Dspring.profiles.active=dev`) to disable `Secure` cookies for cross-device testing — otherwise defaults to `cookie-secure=true` (production-safe default, unchanged).
- Pre-existing, still-unfixed, unrelated eslint errors (10 of them, carried over many sessions) — not touched.

---

## ⏭️ Next Step
> Nothing blocking right now — everything requested this session that could be delivered same-session was, and verified live. Next natural step: revisit open request #4 (Type Présentation / Superficie Sous Articles / TVA columns + Nature/Vocation/Étage/Entité/prix-surface-range filters on Articles) if/when the backend responds; otherwise wait for the user's next ask.

### Backlog (carried over / accumulated)
- [ ] Request #4 (from_front.md) — Articles columns/filters gap not yet addressed by backend (Type Présentation, Superficie Sous Articles, TVA, Nature/Vocation/Étage filters, Entité filter, prix/surface range).
- [ ] Étape filter on `/prospections`/`/pre-prospections` (`ETAPE_ITEMS`) is hardcoded — should reuse `/api/referentiels/etapes-prospection`. Flagged, not yet requested by user.
- [ ] `MultiSelectDropdown.tsx` search input (typing to filter) — planned since an earlier session, never built.
- [ ] Remaining raw `<Select items={…}>` → `<SearchableSelect>` swaps across other files.
- [ ] Live-verify anything in a real browser — still never opened directly by Claude; user has now started testing via LAN devices themselves.
- [ ] Ask the user whether to commit — nothing committed across many sessions now.
- [ ] `sidebar.tsx:726` + 9 other pre-existing unrelated eslint errors — fix opportunistically.
- [ ] Consider whether `Hotline.tsx`/`Calendrier.tsx` should get a `PageShell` icon accent — deliberately left unaccented, revisit if asked.
