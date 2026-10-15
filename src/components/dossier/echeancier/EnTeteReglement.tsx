import { Field as FormField, FieldGroup, FieldLabel } from '../../ui/field';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { referentielItems } from '../../../lib/referentiels';
import type { EnTete, ReferentielsReglement } from '../../../lib/reglementEnTete';

function placeholderPayeur(chargement: boolean, aucunPayeur: boolean): string {
  if (chargement) return 'Chargement…';
  return aucunPayeur ? 'Aucun acquéreur rattaché' : 'Acquéreur ou co-acquéreur';
}

function ChampSelect({
  id,
  label,
  items,
  value,
  placeholder,
  disabled,
  onChange,
}: Readonly<{
  id: string;
  label: string;
  items: { label: string; value: string }[];
  value: string | null;
  placeholder: string;
  disabled?: boolean;
  onChange: (v: string | null) => void;
}>) {
  return (
    <FormField>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select items={items} value={value} onValueChange={(v) => onChange(v)} disabled={disabled}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </FormField>
  );
}

/** Montant, date d'échéance, payeur, type, puis banque et référence selon le type. Pas de date de règlement : 400. */
export default function EnTeteReglement({
  valeur,
  refs,
  onChange,
}: Readonly<{
  valeur: EnTete;
  refs: ReferentielsReglement;
  onChange: (valeur: EnTete) => void;
}>) {
  const typesItems = refs.typesReglement.data.map((t) => ({ label: t.description || t.code || t.id, value: t.id }));
  const payeursItems = (refs.payeurs.data ?? []).map((p) => ({
    label: [p.nom || p.id, p.pieceIdentite].filter(Boolean).join(' · '),
    value: p.id,
  }));
  const maj = (champs: Partial<EnTete>) => onChange({ ...valeur, ...champs });

  return (
    <FieldGroup>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField>
          <FieldLabel htmlFor="reg-montant">Montant</FieldLabel>
          <Input id="reg-montant" type="number" min={0} step="0.01" value={valeur.montant} onChange={(e) => maj({ montant: e.target.value })} />
        </FormField>
        <FormField>
          <FieldLabel htmlFor="reg-date-echeance">Date d'échéance</FieldLabel>
          <Input id="reg-date-echeance" type="date" value={valeur.dateEcheance} onChange={(e) => maj({ dateEcheance: e.target.value })} />
        </FormField>
        <ChampSelect
          id="reg-payeur"
          label="Réglé par"
          items={payeursItems}
          value={valeur.payeurId}
          placeholder={placeholderPayeur(refs.payeurs.loading, refs.aucunPayeur)}
          disabled={refs.aucunPayeur}
          onChange={(v) => maj({ payeurId: v })}
        />
        <ChampSelect
          id="reg-type"
          label="Type de règlement"
          items={typesItems}
          value={valeur.typeId}
          placeholder={refs.typesReglement.loading ? 'Chargement…' : 'Type de règlement'}
          onChange={(v) => maj({ typeId: v, banqueId: null })}
        />
        {refs.banqueRequise && (
          <ChampSelect
            id="reg-banque"
            label="Banque"
            items={referentielItems(refs.banques.data)}
            value={valeur.banqueId}
            placeholder={refs.banques.loading ? 'Chargement…' : 'Banque'}
            onChange={(v) => maj({ banqueId: v })}
          />
        )}
        {refs.referenceRequise && (
          <FormField>
            <FieldLabel htmlFor="reg-reference">Référence (n° de chèque…)</FieldLabel>
            <Input id="reg-reference" value={valeur.reference} onChange={(e) => maj({ reference: e.target.value })} required />
          </FormField>
        )}
      </div>
      {refs.aucunPayeur && (
        <p className="text-micro text-destructive">
          Ce dossier n'a aucun acquéreur rattaché : impossible d'enregistrer un règlement.
        </p>
      )}
    </FieldGroup>
  );
}
