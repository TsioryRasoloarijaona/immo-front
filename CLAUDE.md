# Ayad Estate — Modern Sales/CRM Static Prototype

## Context

This is a **static, JSON-driven React prototype** of a modern replacement for
Omran Estate, a legacy Windows CRM used by a Moroccan real-estate promoter.
The goal at this stage is **UI/UX validation only** — no backend, no auth, no
persistence beyond in-memory state. Read from the bundled JSON files as if
they were an API response.

The real backend (Spring Boot + PostgreSQL) comes later. This prototype's
purpose is to prove out the information architecture and interaction design
before that build starts, using **real sample data exported from the legacy
system's SQL Server database** (not fabricated placeholder content).

Scope for this pass: **Sales pipeline (Prospection → Dossier de vente) +
Patrimoine (Tranches/Articles) + a portfolio Dashboard**. Do not build
Achat, Location, Comptabilité, RH, or Trésorerie — those are out of scope.

## Data

All data lives in `/data/*.json` (copy the files from `./json/` into the
project's `public/data/` or `src/data/` — your call based on how you set up
fetching). Load them as static imports or `fetch()` calls at runtime; there
is no live API.

Files:
- `prospections.json` — 50 real leads, mid-pipeline (both raw "pré-prospection"
  and qualified "prospection" stages live in this one array — Omran uses a
  single table for both; distinguish by whether `isClosed`/`nature` progression
  looks pre- or post-qualification, see field notes below)
- `dossiers.json` — 50 real sale files (the reservation-through-handover records)
- `communications.json` — 50 real interaction/call-log entries, linked to
  prospections via `prospectionId` and to dossiers via `folderId`
- `tranches.json` — 16 real projects/development-phases, each with a full
  `rules` object (penalties, delays, thresholds — see below, this is
  important)
- `articles.json` — 50 real lots/units
- `settlements.json` — 50 real payment transactions
- `lookups.json` — array with one object containing enum value lists
  (prospection origins, statuses, payment methods, gift catalog, etc.)

**Data honesty note:** the source export was a 50-row-per-table sample from
a 274-table production database, so most foreign keys between tables don't
actually cross-resolve within this sample (e.g. a dossier's `CfgCustomerId`
usually points to a client row that isn't in this particular 50-row `CfgTier`
sample). Where that happened, the transform script filled the gap with
**deterministic mock data** (same GUID always produces the same fake person/
lot, so the UI stays internally consistent across pages) and tagged those
records with `"_isMock": true`. All financial figures (prices, discounts,
penalties, dates, rule thresholds, enum values) are real production data —
only some client/article/commercial *names* are synthetic. Don't strip the
`_isMock` flag; it's harmless to leave in the data and useful for later
auditing, just don't surface it in the UI itself.

### Key entities and what they mean

**Prospection** (`prospections.json`) — a lead. Field notes:
- `nature` — the pipeline stage. Real values seen: `"1 A TRAITER"`,
  `"2 EN COURS DE TRAITEMENT"`, `"3 QUALIFIÉ"`, `"4 APRES VISITES"`,
  `"5 AVANT CONCRETISATION"`, plus two side-track values `"A RAPPELER PAR LE
  COMMERCIAL"` and `"AFFAIRES A SUIVRE"`. Treat 1–5 as an ordered progress
  bar/stepper; the other two as exception states.
- `isClosed` / `closingReason` / `closingReasonText` — a lead can be closed
  (lost) at any stage with a reason (real values in `lookups.json` →
  `prospectionClosingReasons`, e.g. "HORS BUDGET", "PROSPECT A DÉJÀ RÉSERVÉ").
- `budgetMin`/`budgetMax`/`areaMin`/`areaMax` — the lead's stated range.
  Some real records have these as 0 with the real budget only present as
  free text inside `notes` (e.g. `"Budget: À partir de 1 170 000 DHS (3
  chambres + salon)"`) — this reflects a real data-quality gap in the legacy
  system (agents typed budget into notes instead of the structured field).
  Surface both: structured fields when present, and don't hide `notes` even
  when they duplicate/override the structured fields.
- `origin` / `support` — marketing channel and specific campaign (e.g.
  "FACEBOOK" / "AYAD DEVELOPPEMENT (ADS)"). Real value lists in
  `lookups.json`.
- `alertValidityDate` / `alertMessage` — a pending follow-up reminder. Treat
  a past-due `alertValidityDate` as an urgent/overdue visual state (this
  maps to a real UX gap in the legacy system — it only shows a passive red
  icon; your dashboard should make this more prominent, e.g. a proper
  "needs follow-up today" list).
- `article` — the specific lot the lead is interested in, when set.

**Dossier de vente** (`dossiers.json`) — an actual sale file, created once a
Prospection converts. Field notes:
- No explicit `status` string is reliably present in this sample (the
  legacy system stores status as a GUID FK into a generic cross-module
  workflow-engine table that isn't meaningfully reconstructable from this
  export). **Derive a display status from the date fields present**, in this
  priority order (latest reached milestone wins):
  `finalTitleDate` set → "Formalisé" · `deliveryDateReal` set → "Remise des
  clés" · `creditPossessionDate` or `bankRecordDate` set → "Crédit débloqué"
  · `creditApprovalDate` set → "Crédit en cours" · `precisionActDate` set →
  "Envoi au notaire" · `agreementSavingDate` set → "Compromis" ·
  `agreementDate` set → "Concrétisation" · else → "Réservation". Implement
  this as a small utility function, not inline per-component logic, since
  multiple views need it (dashboard, list, detail badge).
- `price`, `priceHT`, `priceBeforeDiscount`, `discount`, `discountAmount`,
  `totalToPay` — real pricing breakdown. `discount` is a ratio (0–1), not a
  percentage integer — format accordingly.
- `revival1`/`revival2` + `revival1ValidityDate`/`revival2ValidityDate` —
  the titre-foncier follow-up reminder pair described in the legacy
  system's Tranche rules (`agreementFirstDelay`/`agreementSecondDelay`,
  typically 30–60 days). Show these as a small timeline/checklist on the
  detail view.
- `probabilityOfFinalisation` — a ratio (0–1) — deal-closing confidence.
- `article` — the reserved lot (may be `_isMock` per the note above).

**Tranche** (`tranches.json`) — a project/development phase. This is the
configuration hub. Field notes:
- `standing` — real values: "Moyen standing", "Haut standing", "Très Haut
  Standing" (a tier/luxury classification — display as a badge).
- `rules` — a nested object with **real configured business thresholds**:
  `cancellationPenalityPercent` (+ `cancellationPenalityBasedOnItemPrice`
  toggle — whether the penalty applies to sale price or amounts actually
  collected), `withdrawalDelay` (legal cooling-off period **in hours**, real
  value 48 in the sample data), `agreementFirstDelay`/`agreementSecondDelay`
  (titre-foncier reminder delays in days), `interventionMinimumDelai` +
  `maxVisitNumber` (technical-visit scheduling constraints),
  `isWithGiftForProposer`/`isWithGiftForOldCustomer`/
  `isWithGiftForProspectionOrigin` + `accumulatedGifts` (referral/loyalty
  gift toggles), `isWithVerifCredit` + `creditPercent`,
  `isWithVerifMaxEcheanceDelai` + `maxEcheanceDelai`, `syndicAmount` +
  `syndicPeriod` (monthly condo fee × duration in months),
  `commerceTribunal` + `cancellationRightCode` (legal/jurisdiction fields).
  **Build a real settings-style form UI for this** — this is the closest
  thing to a "rules engine config screen" the legacy system has, and it's a
  strong opportunity to show it well: grouped sections (Financial
  Thresholds / Penalties / Legal & Scheduling / Gifts & Loyalty), not one
  giant flat form.
- `isForSale`/`isForRent`/`isForProject`/`isForBuy`/`isForSav` — module
  visibility flags (a Tranche can be scoped to only some modules).

**Communication** (`communications.json`) — a logged interaction (call,
visit, note). `actionType` real values include "Téléphone Sortant",
"Téléphone entrant", "Visite", "Note", "WEB". Link via `prospectionId` or
`folderId` (mutually exclusive per record) to show a timeline on the
relevant detail page.

**Settlement** (`settlements.json`) — an actual payment transaction.
`status` real values seen: "IN_WORK" and others — treat as a small status
enum, not free text. `isCredit` distinguishes debit/credit direction.

## Design direction

Follow **Linear / Stripe Dashboard / Attio** as the visual references —
**not** the legacy system's dense Windows-forms layout. Concretely:
- Generous whitespace, clear typographic hierarchy, muted neutral palette
  with one accent color for primary actions and status.
- Status as color-coded pill/badge components, not text labels alone.
- Cards and clean tables over the legacy system's dense multi-tab modal
  forms — collapse related fields into logical grouped sections instead of
  replicating every flat field list 1:1.
- A left sidebar nav mirroring the two in-scope modules (**Ventes**,
  **Patrimoine**) plus **Dashboard** — don't reproduce the legacy system's
  full 10-module sidebar (Achat/Location/RH/etc.), just show the two in
  scope plus a disabled/greyed section labeled "Bientôt" (Coming soon) for
  the rest, so the nav still communicates the eventual full scope.
- Keep French field labels (the business operates in French) but modern,
  concise wording — you don't need to preserve the legacy system's exact
  verbose labels.

## Pages to build

1. **Dashboard** (`/`) — portfolio overview. Real aggregate stats computed
   client-side from the JSON: total pipeline value, dossiers by derived
   status (see status-derivation logic above), prospections needing
   follow-up today (`alertValidityDate` ≤ today and not `isClosed`), a
   recent-activity feed from `communications.json` sorted by date desc.
2. **Prospections list + detail** (`/prospections`, `/prospections/:id`) —
   list with filters (nature, origin, commercial, closed/open), detail page
   showing all fields grouped logically + linked communications timeline +
   a clear "convert to dossier" affordance (visual only, no real backend
   action needed — a disabled or toast-confirm button is fine).
3. **Dossiers list + detail** (`/dossiers`, `/dossiers/:id`) — list with
   derived-status filter and search, detail page with grouped sections
   (Identity & Article / Pricing / Financing Schedule if you want to
   synthesize a simple schema from the price fields / Key Dates & Milestones
   / Client). Show the revival1/revival2 reminder pair clearly.
4. **Tranches list + detail** (`/tranches`, `/tranches/:id`) — list of the
   16 real projects with standing badges, detail page split into the
   grouped Règles de Gestion sections described above, plus linked
   Articles for that tranche if you can match them (article↔tranche linkage
   isn't reliable in this sample; if it doesn't resolve cleanly, just list
   all `articles.json` on a general Articles list view instead of nesting
   them incorrectly under the wrong Tranche).

## Technical constraints

- React, functional components + hooks. Client-side routing (React Router
  is fine, or a simple internal view-state router if you prefer to keep it
  dependency-light for a prototype — your call).
- No backend calls. Load JSON via static import or `fetch('/data/...')`.
- No authentication.
- Currency formatting: Moroccan Dirham, e.g. `1 350 000,00 DH` (space
  thousands separator, comma decimal, DH suffix — matches how the legacy
  system displays amounts).
- Dates are already normalized to `YYYY-MM-DD` strings or `null` in the
  JSON — format for display as `DD/MM/YYYY`.
- Keep it a single cohesive app (shared layout/sidebar/header across all
  pages), not disconnected standalone pages.

## Explicitly out of scope for this pass

- Any write/mutation functionality (forms can exist visually but don't need
  to persist)
- Achat, Location, Comptabilité, RH, Trésorerie modules
- Authentication/multi-user
- PDF/document generation
- Real API integration — that's the next phase after this prototype is
  validated

## Graphify — when to use it, when not to

`graphify-out/graph.json` is an AST-derived structure graph (functions, files,
calls, imports) plus semantic edges over the Markdown. It is **orientation and
verification, not lookup**. Rules below are drawn from sessions where it was
actually used, not from the tool's own description.

### Use it

- **Reloading context** on an area you haven't touched recently. `/graphify
  load` gives the architecture in one command — communities, god nodes,
  cross-cutting edges — where grep would take several rounds.
- **Before refactoring a shared abstraction**, to size the blast radius. A god
  node with 100+ edges (`request()`, `cn()`, `useApi()`) means every change is
  a wide change.
- **After a structural change**, run `--update` and read the node diff. It is
  independent confirmation that what landed matches what was intended — a
  refactor that adds nodes you didn't expect is a refactor that did something
  you didn't mean.
- **"What connects to what"** across many files, and **doc↔code links** the
  semantic pass surfaces (e.g. `SESSION_MEMORY.md` prose ↔ its implementation).
  Grep cannot find those.

### Do not use it

- **To locate a known symbol or file.** Grep/Glob is faster and always current.
- **Below function granularity** — dataflow inside a function, a dependency
  array, a specific line. Not modelled.
- **For attribute or pattern sweeps** (`aria-label`, `className`,
  `transition-all`, a JSX prop). Not modelled.
- **For anything driven by the OpenAPI spec.** `docs/api-docsV4.json` produces
  **zero AST nodes** — the contract this whole app is built against is
  invisible to the graph. Use `git diff docs/api-docsV4.json`, which is the
  standing rule anyway.
- **As a substitute for `SESSION_MEMORY.md`.** The graph holds *where*, never
  *why*. Decisions and rationale are not in it.
- **When it is stale relative to `HEAD`** and the question is about recent
  code. Check `built_at_commit` first; reasoning over a stale graph means
  reasoning about code that no longer exists.

### Keeping it current

- **Automatic:** a `post-commit` hook (`graphify hook install`) re-runs AST
  extraction on the files each commit touched. Code-only, so it costs **zero
  LLM tokens** and takes a second or two. This covers the common case.
- **Manual `/graphify --update`** when `*.md` under `docs/` or `instructions/`
  changes. The hook deliberately skips docs: they need semantic extraction,
  which dispatches subagents and costs tokens, so it should be a decision, not
  a side effect of committing.
- **Full rebuild** only after editing `.graphifyignore`, or when clustering has
  drifted enough that community labels no longer describe reality.
- **Precondition:** keep `.graphifyignore` excluding `.claude/`, `.agents/` and
  `graphify-out/`. Without it the graph is majority tooling internals and the
  god nodes / suggested questions describe the skill machinery instead of this
  application.
