# Fix: Detail pages are only showing a fraction of the available real data

## What's wrong

Comparing what's rendering on screen against the actual JSON fields, the
Dossier and Prospection detail pages are surfacing roughly a quarter of
what's available. Real, meaningful production fields exist in the data and
are being silently dropped instead of displayed. This isn't a nice-to-have
— the whole point of this prototype is to validate the UI against *real*
Omran data, so under-displaying it defeats the purpose.

Go through every field listed below and make sure it's rendered somewhere
sensible on the relevant detail page. Group them logically (see suggested
groupings) rather than dumping a flat field list.

## Dossier de vente detail page — currently missing

**Pricing breakdown** (currently only shows top-line `price`) — add a
"Détail du prix" section:
- `unitCost` (prix au m²), `itemPrice` (prix de l'article), `underItemsPrice`
  (prix des sous-articles), `priceBeforeDiscount`, `discount` (ratio —
  format as %), `discountAmount`, `priceAfterDiscount`, `vatRatio`,
  `priceHT`, `totalToPay`, `commissionRate`

**Deal metadata**:
- `probabilityOfFinalisation` (ratio → %, show as a progress indicator)
- `paymentMethod`

**Milestones — this is the big gap.** The "Jalons clés" card currently
shows only one entry. The real system (and this data) tracks a whole
legal/administrative timeline. Show ALL of these as a proper timeline/
checklist, each as present (with date) or pending (greyed, no date):
- `reservationDate`, `agreementDate` (concrétisation), `agreementSavingDate`
  (compromis), `agreementDatePrevisionel`, `ownershipCertificateDate`,
  `creditApprovalDate`, `creditPossessionDate`, `advanceDate`,
  `insuranceDate`, `bankRecordDate`, `interventionDate`, `receptionDate`,
  `precisionActDate`, `contractPrintDate`, `deliveryDateReal`

**Relances (titre foncier follow-ups) — a specific known gap.** Add a
distinct small section for:
- `revival1` + `revival1ValidityDate`, `revival2` + `revival2ValidityDate`
  Show as "1ère relance" / "2ème relance" with their validity/deadline
  dates. This pairs directly with the Tranche's `agreementFirstDelay`/
  `agreementSecondDelay` rules already shown elsewhere — worth a short note
  or tooltip linking the two if easy, but not required.

**Cancellation / closure** (only show this section if any of these are
set, otherwise omit — don't show an empty "cancellation" block on an active
dossier):
- `cancelDate`, `cancelDescription`

**Legal**:
- `finalTitleNumber`, `finalTitleDate` (titre foncier définitif)

**Flags** — small icon/badge row, not full sentences:
- `isAccounted` (comptabilisé), `isOldCustomer` (ancien client),
  `isPenaltyDisabled` (pénalité désactivée), `isConfirmedAgreementDate`
  (date confirmée)

## Prospection detail page — currently missing

**Marketing/channel info** — add a section (this matters a lot for a sales
team judging lead quality/source):
- `origin` (source), `support` (campagne/support)

**Financing breakdown** — currently "Budget & superficie recherchés" shows
budget/area but not financing:
- `fundingOwnBase` (autofinancement), `fundingCredit` (crédit),
  `fundingOther` (autre financement)

**Closure info** (only if `isClosed` is true — omit section otherwise):
- `closingDate`, `closingReason`, `closingReasonText`

**Flags**:
- `isOldCustomer` (ancien client)

**Audit trail** — small, secondary/muted styling, doesn't need to be
prominent, but shouldn't be entirely absent either:
- `createdBy` / `createdAt`, `updatedBy` / `updatedAt`

## Tranche detail page — check too

This page was better-covered already (Règles de Gestion sections looked
complete against the `rules` object), but double check these top-level
fields are all shown, not just the ones already confirmed:
- `marketingStartDate`/`marketingEndDate` (should already be there, but
  verify), `endDateConcretisation`, `startDateFinalisation`, `revival1Date`
  — these three specifically weren't confirmed visible.

## General instruction

Don't assume a field is unimportant because it's `0`, `false`, `null`, or
an empty string — a lot of these fields being empty in a given record is
itself real information (e.g. a dossier with no `cancelDate` is simply
active, which is fine to omit per the note above, but a dossier with
`probabilityOfFinalisation: 0` while `isAccounted: false` might indicate a
stalled deal worth surfacing, not hiding). Where a whole optional section
would be empty for a given record, it's fine to omit that section
entirely for that record — but don't omit fields that DO have real values
just because a sibling field nearby happens to be empty.
