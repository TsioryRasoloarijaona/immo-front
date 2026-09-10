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
- Generous whitespace, clear typographic hierarchy.
- **One accent, five status hues, true grey neutrals.** Three rules, no scoped
  exceptions. The accent is **teal `#0f766e`** (`#5eead4` in dark) and carries
  every action, focus ring, link and section chip; the five reserved status
  hues colour a status wherever it appears; the neutrals are true greys with
  no cast.
- **There is no brand colour.** The former `#5d396e` was sampled from the Ayad
  identity mark and went with the name — the product is called **Arpent** and
  carries no company identity. The teal is a *chosen* hue. Why teal and not
  the obvious professional blue: the status hues already own green, red, amber
  and blue, and a blue accent would sit on top of `--info` and make a primary
  button read as an informational state.
- **Do not make the palette achromatic. That has been tried twice and rejected
  twice** — the second time as a deliberate, WCAG-clean specification, and it
  was still rejected on sight ("the app looks like it died on colour"). A
  dense operator tool that is nothing but greys reads as broken rather than
  restrained. The header of `src/index.css` records both attempts; treat "no
  accent" as a settled dead end rather than a simplification to rediscover.
- **Status is carried by a glyph as well as colour.** `TONE_GLYPH` in
  `components/ui.tsx` maps each of the six `BadgeTone` values to a lucide
  icon. These arrived with the achromatic pass but are the one thing worth
  keeping from it: colour alone is a High-severity WCAG failure, the original
  coloured-badge design committed it, and the glyph is what makes a red
  "Annulé" legible to a colour-blind operator. Do not drop them for space.
- See `PRODUCT.md` §Brand Commitments for the de-branding.
- Cards and clean tables over the legacy system's dense multi-tab modal
  forms — collapse related fields into logical grouped sections instead of
  replicating every flat field list 1:1.

> **Exception, decided deliberately: data grids are dense on purpose.**
> The "generous whitespace" rule above governs page chrome, forms and detail
> views. It does **not** govern the list tables, which were refactored on
> `feat/densite-tableaux` to the measured geometry of the legacy Omran grid:
> a 24px row (`--row-h`), 6px cell gutters (`--cell-px`), `--text-body` cells,
> `--text-micro` headers, and vertical hairline column rules.
>
> The reason is measured, not stylistic. Omran fits ~24 prospection rows in
> the viewport; the shadcn default row (33px) fit ~17. The commerciaux are
> migrating *from* Omran and use these screens to triage who to call back, so
> seven fewer leads per glance is a real regression in the one job the screen
> has. Density is the feature there.
>
> Three heights, all measured off the reference and all tokens in `index.css`:
> `--row-h` 24px (data), `--row-h-head` 22px, `--row-h-filter` 19px. The header
> really is shorter than a data row in the original. Tune the tokens if the
> density needs adjusting — don't reach into the components.
>
> **The grid chrome lives in `src/components/DataGrid.tsx`, and every list
> screen uses it.** Group-by band, gutter with a current-row `▶` indicator and
> a per-row checkbox, sortable headers, a `Σ` summary toggle per column, and
> the per-column filter row with its `A` / `=` operator glyphs.
>
> **A list screen declares `ColonneGrille[]`, not table markup.** That is the
> whole point: the chrome is uniform because it exists once. Adding a column is
> an entry in an array — `nom`, `libelle`, `type` (drives alignment, formatting
> and the filter glyph), `largeur` (a relative weight, normalised), and
> optionally `rendu` / `valeur` / `classe` / `titre`. **Always set `valeur`
> when the displayed text isn't `row[nom]`** — otherwise sort and filter
> compare a raw code (`IN_WORK`) while the user sees and types a label
> ("Pointé"). `ProspectionTable` is a thin adapter that maps the server's
> `ColonneDto` catalogue onto this.
>
> Sort, `Σ` and the filter row are **real but client-side, over the loaded page
> only** — what the original DevExpress grid does natively. Server-side
> filtering stays with each page's own filter panel, which paginates. Don't
> "unify" the two: they answer different questions.
>
> Two optional props matter. `selection` makes the checkbox gutter *controlled*
> — Dossiers passes its batch-document selection through it, so the gutter is
> the real selector there instead of a second, decorative column. And
> `rendreDetail` adds a chevron gutter plus a `colSpan` expansion row — that's
> what let Offres keep its montants detail panel instead of losing it to the
> conversion.
>
> Deliberately non-functional, and marked: the group-by band carries a
> `Bientôt` pill because drag-to-group doesn't exist, and the checkbox gutter
> is visual-only on every screen *except* Dossiers.
>
> **Out of scope by design, not by omission:** Dashboard and
> `PerformancesCommerciaux` (analytics, not lists — user's call), and the
> sub-tables embedded in detail pages and forms (`DossierDetail`,
> `ProspectDetail`, `TrancheDetail`, `ArticleDetail`, `NewDossier`,
> `NewProspection`, `ArticleResultsList`, `Hotline`). A filter row, `Σ` and a
> checkbox gutter on a three-row échéancier would be more chrome than data.
> Those still inherit the density and the thin scrollbars, which are global.
>
> What did **not** change, and must not: the palette, the sidebar, the page
> shell, and Omran's top filter panel (Entité / Période / Commercial / Nature /
> Aboutie / Archivé) — that one stays out, `ProspectionFiltresAvances` covers
> it. No Windows 3D bevels. Take the geometry and the affordances, leave the
> chrome styling.
>
> So: do not "fix" the tables back to airy padding.
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
