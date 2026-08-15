import { Badge, Card, Field, FieldGrid } from '../../../components/ui';
import { formatCurrency, formatDate } from '../../../lib/format';
import {
  FINANCING_STATE_LABEL,
  FINANCING_STATE_TONE,
  financingCategoryLabel,
  financingLinesTotal,
  financingValidationState,
  lineRemaining,
  lineSettled,
} from '../../../lib/financing';
import { discountAmount, priceAfterDiscount, type WizardState } from './wizardTypes';

export default function StepRecap({ state }: { state: WizardState }) {
  const target = priceAfterDiscount(state);
  const total = financingLinesTotal(state.echeancier);
  const validation = financingValidationState(total, target);

  return (
    <div className="flex flex-col gap-4">
      <Card title="Acheteur(s)">
        <FieldGrid>
          <Field label="Nom" value={state.client.name} />
          <Field label="Téléphone" value={state.client.phone} />
          <Field label="Mobile" value={state.client.mobile} />
          <Field label="Email" value={state.client.email} />
          <Field label="Ville" value={state.client.city} />
        </FieldGrid>
      </Card>

      <Card title={`Lot(s) — ${state.lots.length}`}>
        {state.lots.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">Aucun lot sélectionné.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {state.lots.map((l) => (
              <div key={l.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-md border border-border px-3 py-2 text-[13px]">
                <span className="font-medium text-foreground">{l.code}</span>
                <span className="text-muted-foreground">{l.description}</span>
                <span className="text-muted-foreground">{l.area ? `${l.area} m²` : '—'}</span>
                <span className="font-medium tabular-nums text-foreground">{formatCurrency(l.salePrice)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Prix & remise">
        <FieldGrid>
          <Field label="Prix avant remise" value={formatCurrency(state.priceBeforeDiscount)} />
          <Field label="Remise" value={`${(state.discount * 100).toFixed(2).replace(/\.00$/, '')}%`} />
          <Field label="Montant de la remise" value={formatCurrency(discountAmount(state))} />
          <Field label="Prix TTC après remise" value={<span className="font-semibold text-foreground">{formatCurrency(target)}</span>} />
        </FieldGrid>
      </Card>

      <Card
        title="Échéancier"
        action={<Badge tone={FINANCING_STATE_TONE[validation]}>{FINANCING_STATE_LABEL[validation]}</Badge>}
      >
        <div className="flex flex-col gap-2">
          {state.echeancier.map((l) => (
            <div key={l.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-md border border-border px-3 py-2 text-[13px]">
              <span className="font-medium text-foreground">{financingCategoryLabel(l.categorie)}</span>
              <span className="text-muted-foreground">{formatDate(l.date)}</span>
              <span className="text-muted-foreground">Réglé {formatCurrency(lineSettled(l))} · Reste {formatCurrency(lineRemaining(l))}</span>
              <span className="font-medium tabular-nums text-foreground">{formatCurrency(l.montant)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
