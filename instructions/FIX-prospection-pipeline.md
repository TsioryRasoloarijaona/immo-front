# Fix: Prospections pipeline is missing a stage and an action

## What's wrong

The real Omran pipeline has **two distinct stages before a sale file
exists**, each ending in its own explicit conversion action:

```
Pré-Prospection  --[Transformer en prospection]-->  Prospection  --[Créer / ouvrir dossier]-->  Dossier de vente
```

The current build treats "Prospections" as one flat list with a single
button, **"Convertir en dossier de vente"**, on every record. That
collapses two real, separately-meaningful steps into one, and loses the
raw-lead stage entirely.

## How to tell the two stages apart in the data

`prospections.json` doesn't have an explicit `stage` field, but the
distinction is derivable from two fields that are already there:

- **Pré-Prospection** (raw, unqualified lead): `prospect` is `null` AND/OR
  `commercial` is `null`. This is the "just captured, not yet worked" state
  — in the real system it usually still has marketing-channel data
  (`origin`, `support`) and sometimes an unstructured budget in `notes`,
  but no linked Person record and no assigned salesperson yet.
- **Prospection** (qualified lead): `prospect` is set AND `commercial` is
  set. This means someone has actually linked it to a real contact and
  assigned an owner — the real qualification signal.

In the current 50-record sample: 6 records are still pré-prospections by
this definition, 44 are already-qualified prospections. That's a realistic
mix to demo both stages and both transitions.

## What to change

1. **List view (`/prospections`)**: add a filter/tab or a visual grouping
   that separates Pré-Prospections from Prospections (e.g. two tabs
   "Pré-prospections (6)" / "Prospections (44)", or a status column that
   shows "Non qualifiée" vs the existing `nature` stepper value). Don't
   just bury the distinction in a column — it's a real pipeline gate, make
   it visible at a glance the way the étape/status column already is.

2. **Detail view for a Pré-Prospection** (`prospect` or `commercial` null):
   - Do **not** show "Convertir en dossier de vente" — that action isn't
     valid yet at this stage.
   - Show a **"Transformer en prospection"** action instead. Visually this
     can be disabled/require the missing fields (prospect, commercial) to
     be conceptually "filled" first, matching the real system where this
     button only activates once required fields are set — a tooltip or
     helper text explaining what's missing is enough for this prototype,
     no real validation logic needed.
   - The 1–5 status stepper still applies (Nature is shared across both
     stages), but frame the page so it's clearly a *lead*, not yet a
     *qualified prospection* — e.g. a distinct badge or header treatment.

3. **Detail view for a Prospection** (`prospect` and `commercial` both
   set): keep the existing layout, but the button should read **"Créer /
   ouvrir dossier"** (matching the real system's actual button label),
   not "Convertir en dossier de vente" — small wording fix but it's the
   real terminology from the legacy system and should carry through.

4. Both actions can remain visual-only (toast/confirm, no real state
   mutation needed) — this is still a static prototype. The point is
   showing the *right number of steps with the right labels*, not wiring
   up real conversion logic.

## Why this matters

This two-step gate (lead → qualified → sale file) is a deliberate business
process, not incidental UI — it's how the sales team enforces that nobody
opens a sale file on an unqualified, unassigned lead. Collapsing it into
one button misrepresents the actual workflow this prototype is supposed to
validate.
