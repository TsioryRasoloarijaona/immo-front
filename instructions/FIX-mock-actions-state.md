# Fix: implement real mock actions — status transitions, commercial assignment, notes/reports, RDV scheduling

## What this adds

Up to now every "action" button (Transformer en prospection, Créer/ouvrir
dossier, Ajouter un appel/visite) has been visual-only — it doesn't change
anything. This fix makes them **actually mutate in-memory state**, so the
prototype behaves like a real (if unpersisted) app: click a transition,
see the record actually move to its next stage, see the new communication
actually appear in the timeline, etc.

**Persistence: none required.** Plain React state (useState/useReducer,
lifted to a shared context or top-level state store) is enough. A page
refresh resetting everything back to the original JSON is expected and
fine — this is not going to a database yet.

**Important: reproduce Omran's real transition rules, not a free-form
status picker.** Every transition below has a real gating condition
observed in the legacy system. Implement the same conditions, not just a
dropdown that lets you set any status at any time — the whole point is
demonstrating the actual guarded workflow, not a generic CRUD form.

## 1. Pré-Prospection → Prospection ("Transformer en prospection")

**Real behavior to reproduce:**
- The button exists on every Pré-Prospection record (`prospect` and/or
  `commercial` null — see the earlier pipeline fix for how these are
  identified).
- **It's disabled/greyed until required fields are filled**: a linked
  `prospect` (a Person) and an assigned `commercial` (salesperson) at
  minimum. In the real system `article`/`tranche` are also normally set by
  this point, but for this prototype, gating on prospect + commercial is
  enough to demonstrate the real "not just one click" behavior.
- If those fields are missing, give the user a way to fill them right on
  this page (a simple inline "Assigner un commercial" select, and — if
  `prospect` isn't set — a small "Créer prospect" mini-form: at minimum
  Nom, Prénom, Téléphone, matching what the real system requires; see
  `FIX-missing-data-fields.md` and the process map for the real Prospect
  fields, you don't need every field, just enough to make the linkage
  real).
- Once those are filled and the button is enabled, clicking it should:
  1. Show the same confirm-before-transition pattern as the real system:
     *"Vous devez enregistrer vos modifications avant cette opération.
     Voulez-vous continuer ?"* (Oui/Non).
  2. On confirm, the record now counts as a qualified Prospection (i.e.
     it moves out of the "Pré-Prospections" bucket into "Prospections" in
     whatever list/tab split you built for the earlier pipeline fix).
  3. Its Nature can also advance one step if it was still at
     "1 À traiter" (bump to "2 En cours de traitement" is a reasonable
     default — this mirrors real usage where qualifying a lead usually
     also means someone has started working it).

## 2. Assigning/reassigning a commercial

- Add a "Commercial" select (real names available in the data — reuse
  whatever commercial names already appear across `prospections.json`/
  `dossiers.json`, no need for a separate lookup file) editable at any
  point on both the Prospection and Dossier detail pages, not just as
  part of the qualification gate above. Reassignment should be possible
  any time, matching how a real sales org actually works (leads/deals get
  reassigned for many reasons after initial qualification too).

## 3. Adding a note/report (the call/visit log from the previous fix)

- The "Ajouter un appel/visite" form from `FIX-pipeline-timeline.md`
  should now actually push a new entry into the timeline's local state
  when submitted, appearing immediately at the top (most recent first).
  Use the same shape as `communications.json` entries: `actionType`,
  `report`, `user` (can default to a fixed "current user" mock, e.g. the
  assigned commercial or a fixed demo user), `date` (now), and an optional
  `alertDate`.
- This applies on both Prospection and Dossier detail pages, matching the
  earlier fix.

## 4. RDV (rendez-vous) date picker

- When logging an interaction whose `actionType` is "Visite", or whenever
  the report's outcome implies a future appointment (e.g. the user picks
  an outcome like "Rendez-vous pris" from the small Résultat list added in
  the previous fix), show a **date + time picker** for the RDV, not just
  the generic `alertDate` field — this should feel like scheduling an
  actual appointment (date, time, and free-text like "visite technique" /
  "visite de réservation" as a short label), not a generic reminder.
- Store the scheduled RDV as part of that communication entry (extend the
  local-state shape with an `appointmentDate`/`appointmentLabel` pair,
  doesn't need to exist in the original JSON schema — this is prototype
  state, not a data-fidelity requirement).
- Surface upcoming RDVs somewhere visible — a "Prochain RDV" chip on the
  record's header is enough for this pass; a dedicated calendar view is
  out of scope for now.

## 5. Prospection → Dossier de vente ("Créer / ouvrir dossier")

**Real behavior to reproduce:**
- Only appears/enables once the Prospection is actually qualified (i.e.
  it has moved past the pré-prospection gate from #1 above — `prospect`
  and `commercial` both set). This mirrors the real system exactly:
  you cannot open a Dossier from a raw, unqualified lead.
- Clicking it should create a new Dossier de vente record in local state,
  pre-filled from the Prospection's data (client = the linked prospect,
  commercial, article/tranche if set, a default `statusIdRaw`-equivalent
  of "Réservation" — i.e. the first real status in the 11-value Dossier
  Statut pipeline), and navigate the user to that new Dossier's detail
  page. This is the single most important transition in the whole
  pipeline — it's the moment a lead becomes an actual sale — so it should
  feel like a real, slightly weighty action (a confirm step is
  appropriate here too, not just an instant silent creation).

## 6. Dossier de vente status progression

**Real behavior to reproduce — this is a real ordered enum, not free
text.** The 11 real values, in real order:

```
Réservation → Concrétisation → Meilleurtaux → Compromis → Envoi au notaire
→ Crédit en cours → Crédit débloqué → Minute → Remise des clés → Formalisé
→ Livraison provisoire
```

- Add a "Faire avancer le statut" action (button or a small stepper
  control) that moves a Dossier to the **next** status in this fixed
  order only — not an arbitrary jump. This matches the real system, where
  each status represents a real milestone that has to actually happen
  (notary visit, credit approval, key handover...) before the next one
  makes sense.
- A manual "regression"/rollback control isn't necessary for this
  prototype, but if you want one, keep it clearly secondary (e.g. a small
  "Annuler la dernière étape" rather than a free status dropdown that
  implies any status is reachable from any other).
- When status changes, if the dossier's underlying milestone date fields
  are empty for the newly-reached status (see `FIX-missing-data-fields.md`
  for the full milestone field list — e.g. reaching "Concrétisation" should
  populate `agreementDate` if it's not already set), auto-fill today's date
  into the matching field so the milestone timeline built in the earlier
  fix visibly updates too. This is what makes the status progression feel
  connected to the rest of the page instead of being an isolated badge.

## General notes

- All of this is **mock/local state only** — no validation needs to be
  bulletproof, but the *shape* of the gating (disabled buttons until
  conditions are met, fixed-order progression, confirm dialogs on
  meaningful transitions) should feel like the real Omran workflow, since
  that's the explicit goal here: reproducing the actual guarded pipeline,
  not building a generic editable CRM.
- Where you need a small info-density decision Omran doesn't fully specify
  in our source material (e.g. exact wording of a confirm dialog for the
  Dossier-status-advance action), use your judgment and keep it consistent
  with the tone of the confirm dialogs already documented (short, direct,
  Oui/Non).
