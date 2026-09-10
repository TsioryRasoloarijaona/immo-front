# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences, both real:

- **Production end-users (design target):** Ayad Estate's commercial/sales
  staff — the agents who work prospections (leads) through to dossiers de
  vente (sale files) day to day — plus the managers/directors who consult
  the portfolio Dashboard for pipeline and sales-status overview. The
  prototype should be designed as if these people will actually use it.
- **Immediate audience (this build's reviewers):** Ayad Estate stakeholders
  and decision-makers evaluating this static prototype to decide whether to
  greenlight the real backend build (Spring Boot + PostgreSQL) and
  full-scope rollout.

## Product Purpose

A modern replacement for Omran Estate, the legacy Windows CRM currently
used by Ayad Estate, a Moroccan real-estate promoter. This pass is a
**static, JSON-driven React prototype** built to validate information
architecture and interaction design before the real backend is built —
UI/UX validation only, no auth, no persistence beyond in-memory state.
Success is a prototype coherent and credible enough that stakeholders
approve moving to the real build.

Scope for this pass: **sales pipeline** (Prospection → Dossier de vente),
**Patrimoine** (Tranches/Articles), and a portfolio **Dashboard**. Achat,
Location, Comptabilité, RH, and Trésorerie are explicitly out of scope for
this pass (but the nav should signal they exist and are coming).

## Positioning

Everything the legacy system does today, but built on the visual and
interaction language of modern SaaS tools (Linear / Stripe Dashboard /
Attio) instead of the legacy system's dense multi-tab Windows-forms modal
layout: generous whitespace, clear hierarchy, status as color-coded
pills, cards and clean tables instead of flat field dumps, and grouped
logical sections instead of 1:1 field replication. The real differentiator
versus the legacy tool is that this makes existing, real business rules
(pipeline stages, tranche rules engine, conversion gates) legible and
navigable rather than buried in dense forms.

## Operating Context

- Real production workflows being modeled: a lead comes in
  (Pré-Prospection, unqualified) → gets qualified into a Prospection
  (linked contact + assigned commercial) → converts into a Dossier de
  vente (sale file) that progresses through reservation, compromis,
  notary, credit, and handover milestones. See
  `instructions/FIX-prospection-pipeline.md` for the two-step
  pré-prospection → prospection → dossier gate this UI must represent
  correctly (a deliberate business process, not incidental UI — it's how
  the sales team prevents opening a sale file on an unqualified,
  unassigned lead).
- Tranches (projects/development phases) are the configuration hub: each
  carries a real "rules engine" (cancellation penalties, legal
  cooling-off delay, titre-foncier follow-up delays, credit verification
  thresholds, gift/loyalty toggles, syndic fees) that this prototype's
  Tranche detail view renders as a grouped settings-style screen.
  Articles are the individual lots/units within tranches.
  Communications are logged interactions (calls, visits, notes) linked to
  either a prospection or a dossier.
- The business operates in French; field labels stay French but with
  modern, concise wording rather than the legacy system's verbose labels.
  Currency is Moroccan Dirham (`1 350 000,00 DH` — space thousands
  separator, comma decimal, DH suffix). Dates display as `DD/MM/YYYY`.

## Capabilities and Constraints

- React (functional components + hooks), React Router, Vite, TypeScript.
  No backend calls — all data loads from bundled JSON (`public/data/` or
  `src/data/`) via static import or `fetch`. No authentication, no
  real write/mutation persistence (forms and action buttons can exist
  visually — toast/confirm is enough — without wiring real state changes).
- Data is a real 50-row-per-table sample exported from the legacy
  system's SQL Server database (274 tables total), so most foreign keys
  don't reliably cross-resolve within the sample. Gaps are filled with
  deterministic mock data tagged `_isMock: true` in the JSON (same GUID →
  same fake person/lot, so the UI stays internally consistent). All
  financial figures, dates, rule thresholds, and enum values are real
  production data; only some client/article/commercial *names* may be
  synthetic. The `_isMock` flag should never surface in the UI itself.
- Dossiers have no reliable explicit status field in this sample; display
  status must be derived from a priority-ordered set of milestone date
  fields (documented in CLAUDE.md and implemented as a shared utility,
  not per-component logic).
- Full future module scope (beyond this pass): Achat, Location,
  Comptabilité, RH, Trésorerie — the nav should include a disabled/greyed
  "Bientôt" section for these so the eventual full scope stays visible.

## Brand Commitments

**The product is deliberately de-branded. It is called *Arpent* and carries no
Ayad identity.**

This section previously said the opposite, and the reversal is worth recording
because it corrects a mistake this file made about the user's own instructions.
It read:

> **Correction to the init interview:** the user said no brand constraints
> exist, but the repository has a real, already-applied Ayad Développement
> identity that this note takes as binding […] Treat the accent color and logo
> as fixed.

The user *had* said no brand constraints exist. A previous pass overrode that
on the strength of files it found in the repo, and elevated an accident of the
working tree into a product commitment. The user has since restated the
original position. The repo's contents were never a mandate.

What holds now:

- **Name: Arpent.** An old French unit of land area — native to the domain,
  attached to no company. Six sites carry it: `index.html`'s `<title>`,
  `Layout.tsx` (title attribute, wordmark, `sr-only`), `AuthScreen.tsx`'s
  wordmark, and `Login.tsx`'s description.
- **No logo.** Not "a different logo" — none. The identity is a **wordmark**:
  the name set in a heavy, tight-tracked cut of the app's own sans. There is no
  raster asset to maintain, and none should be added.
- **No brand colour — but the app is not colourless.** The former `#5d396e`
  was sampled from the Ayad mark; removing the colour and removing the name
  were one act, not two. What replaced it is a *chosen* accent, **teal
  `#0f766e`**, which belongs to the product rather than to a company.
- **The monochrome experiment is closed.** A pass between these two states
  removed colour entirely. It was deliberate and WCAG-clean, and it was
  rejected on sight — the app read as dead. The lesson is recorded in the
  header of `src/index.css` so it is not rediscovered as a simplification:
  de-branding and de-colouring are separable, and only the first was wanted.
- **The logo kit still exists on disk** at `public/brand/` and
  `public/LOGO - Copie/`, deliberately not deleted — but nothing references it.
  The favicon and apple-touch-icon links are gone from `index.html`. Rewiring
  is one line if the decision is ever reversed.
- The neutral/typography/layout system still follows the Linear/Stripe
  Dashboard/Attio direction from CLAUDE.md, with the grid-density exception
  documented there.

**Do not re-derive brand constraints from repository contents.** That is the
specific error this section used to embody.

## Evidence on Hand

Real sample data in `/json/*.json` (50 prospections, 50 dossiers, 50
communications, 16 tranches, 50 articles, 50 settlements, plus a lookups
file of enum value lists) — exported from the legacy production database,
not fabricated placeholder content. See CLAUDE.md's "Data" and "Data
honesty note" sections for full field-level documentation of each entity.
No customer testimonials, press, or case studies exist or should be
fabricated.

## Product Principles

1. **Real data, real rules, real credibility.** Every number, threshold,
   and status shown must trace to actual legacy production data or a
   documented derivation from it — nothing fabricated beyond the
   already-tagged deterministic mock fill-ins.
2. **Make the legacy system's rules legible, not just prettier.** The
   value of this prototype over the old CRM is surfacing real business
   logic (pipeline gates, tranche rules engine, revival reminders,
   overdue alerts) clearly — not just re-skinning the same dense forms.
3. **Respect the real workflow shape.** Pipeline stages and conversion
   gates (pré-prospection → prospection → dossier) are deliberate business
   process, not incidental UI; don't collapse or reorder them for visual
   convenience.
4. **Stay honest about prototype boundaries.** No real persistence, auth,
   or backend — visual-only affordances for actions that will be wired up
   later are acceptable and should read as intentional, not broken.
5. **Modern SaaS craft, French business substance.** Adopt Linear/Stripe/
   Attio-level visual and interaction quality while keeping terminology
   in concise, modern French matching how the business actually talks.

## Accessibility & Inclusion

No formal compliance standard required — confirmed with the user. General
good practice (solid contrast, keyboard navigability, semantic markup)
applies as baseline craft, appropriate for an internal validation
prototype.
