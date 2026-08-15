# Fix: reproduce Omran's real pipeline visualization — stage stepper + action/report timeline

## What's wrong

The prospection detail page shows the 5-stage stepper (À traiter → En cours
→ Qualifié → Après visites → Avant concrétisation) but nothing about *how*
a prospection actually moves between those stages. In the real system,
progression happens through a logged sequence of calls, visits, and notes
— each one is a distinct record with its own outcome and a short report.
That log is completely absent from the current build. This is the single
most "Omran-like" piece of the UI and it needs to look and feel like the
real operational tool, not just a status badge.

## The two layers to build, precisely

**Layer 1 — Nature stepper (already exists, keep it, minor polish only).**
The 5 ordered stages, plus two side-track/exception states that don't fit
the linear order: "A rappeler par le commercial" and "Affaires à suivre".
If a prospection's `nature` is one of those two side-track values, don't
force it into the 1–5 stepper position — show it as a distinct tag/badge
next to the stepper instead, since it's explicitly not part of the ordered
sequence in the real system.

**Layer 2 — Action/Communication timeline (net-new, this is the main ask).**
Every prospection has zero or more entries from `communications.json`
(filter by matching `prospectionId`), each representing one real
interaction. Render this as a **vertical chronological timeline** below
the stepper, most recent first. Each entry is a "mini-report" card showing:

- **Action type** (`actionType`) as an icon + label — real values: "Note",
  "Téléphone entrant" (incoming call), "Téléphone Sortant" (outgoing call),
  "Visite" (site visit), "WEB". Use a distinct icon per type (phone-in,
  phone-out, note, calendar/visit, globe) so the timeline is scannable at
  a glance without reading every line.
- **Date** (`date`) — when the interaction happened.
- **The report itself** (`report` field — this is real free-text call/visit
  notes, e.g. "Prospect trouve que les prix sont chers et qu'elle fera une
  visite tout de meme"). This is the actual content of the "petit rapport
  après appel" — display it prominently, it's the substance of the card,
  not a footnote.
- **Who logged it** (`user`).
- **Follow-up reminder**, if set (`alertDate`) — show as a small "Relance
  prévue le [date]" chip on the card. If `alertDate` is in the past and the
  prospection isn't closed, style it as overdue (this is the same
  overdue-follow-up concept as the dashboard's "Relances en retard" card —
  reuse that visual treatment for consistency).
- Entries where `isSystem` is true are automated system notes, not human
  call reports (e.g. payment-due reminders) — style these more mutedly
  (smaller, greyed, no action-type icon needed) so they read as background
  noise rather than another sales interaction.

**"Add an interaction" action.** Add a button ("Ajouter un appel / une
visite" or similar) that opens a small form matching the real system's
"Action" entry screen: Action type (select), Résultat (select — this
prototype can offer a short realistic list even without a dedicated JSON
lookup for it, e.g. "Rendez-vous pris", "À relancer", "Ne répond pas",
"Hors budget" — a handful is enough, doesn't need the full 22-value list),
a free-text report field, and an optional follow-up date. Like the
pipeline-transition buttons already noted in the earlier fix, this can be
visual-only (adds to local state / shows a toast, no persistence needed)
— the point is demonstrating the *interaction*, not building a working
backend.

## Data notes

- The `report` field (was previously misleadingly named `alertMessage` in
  the JSON — already renamed to `report` in the latest data export,
  re-copy `json/communications.json` if you're working from an older copy)
  holds the actual note/report text. `alertDate` is the separate follow-up
  reminder date. Don't conflate the two — a report can exist with no
  follow-up date, and vice versa.
- Not every prospection has communications in this 50-record sample (some
  do, some don't — that's realistic, not a bug). Show a clean empty state
  ("Aucune interaction enregistrée pour cette prospection") rather than an
  empty timeline with no explanation.
- Apply the same timeline treatment to the **Dossier de vente detail page**
  — dossiers link to communications via `folderId` the same way. A dossier
  in progress should show its own interaction history (e.g. "client a
  appelé pour reporter le rendez-vous de remise des clés"), same card
  format, just filtered by `folderId` instead of `prospectionId`.

## Why this matters

This log — call, outcome, report, next action — is literally how the sales
team's day-to-day work happens in the real system. A pipeline stage badge
alone tells you *where* a lead is; the timeline tells you *why* and *what
happens next*, which is the operational value the whole CRM exists to
provide. Without it, the prototype shows the skeleton of the sales process
but none of the actual work.
