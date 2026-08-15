import { Card, Field, FieldGrid } from '../../../components/ui';
import { Field as FormField, FieldGroup, FieldLabel } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import { formatCurrency } from '../../../lib/format';
import { discountAmount, priceAfterDiscount, type WizardState } from './wizardTypes';

export default function StepPrix({
  state,
  onChange,
}: {
  state: Pick<WizardState, 'priceBeforeDiscount' | 'discount'>;
  onChange: (patch: Partial<Pick<WizardState, 'priceBeforeDiscount' | 'discount'>>) => void;
}) {
  const amount = discountAmount(state);
  const after = priceAfterDiscount(state);

  return (
    <Card title="Prix & remise">
      <FieldGroup>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <FormField>
            <FieldLabel htmlFor="w-price">Prix avant remise (DH)</FieldLabel>
            <Input
              id="w-price"
              type="number"
              min={0}
              step="0.01"
              value={state.priceBeforeDiscount || ''}
              onChange={(e) => onChange({ priceBeforeDiscount: Number(e.target.value) || 0 })}
            />
          </FormField>
          <FormField>
            <FieldLabel htmlFor="w-discount">Remise (%)</FieldLabel>
            <Input
              id="w-discount"
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={state.discount ? Math.round(state.discount * 10000) / 100 : ''}
              onChange={(e) => onChange({ discount: (Number(e.target.value) || 0) / 100 })}
            />
          </FormField>
        </div>
      </FieldGroup>

      <div className="mt-5 border-t border-border pt-4">
        <FieldGrid>
          <Field label="Prix avant remise" value={formatCurrency(state.priceBeforeDiscount)} />
          <Field label="Montant de la remise" value={formatCurrency(amount)} />
          <Field label="Prix TTC après remise" value={<span className="text-[15px] font-semibold text-foreground">{formatCurrency(after)}</span>} />
        </FieldGrid>
      </div>
      <p className="mt-3.5 text-[12px] text-muted-foreground">
        Ce montant TTC après remise est le prix cible que l'Échéancier (étape suivante) devra couvrir exactement.
      </p>
    </Card>
  );
}
