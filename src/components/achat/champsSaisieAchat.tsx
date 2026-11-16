import SearchableSelect, { type SearchableSelectOption } from '../SearchableSelect';
import { Field, FieldError, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';

/** Champ numérique contrôlé : vide = null. */
export function ChampNombre({ id, valeur, onChange, libelle, className }: Readonly<{
  id?: string;
  valeur: number | null;
  onChange: (valeur: number | null) => void;
  libelle: string;
  className?: string;
}>) {
  return (
    <Input
      id={id}
      type="number"
      step="any"
      aria-label={libelle}
      className={className}
      value={valeur ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
    />
  );
}

export function ChampTexte({ id, libelle, valeur, onChange, type = 'text', erreur, requis }: Readonly<{
  id: string;
  libelle: string;
  valeur: string;
  onChange: (valeur: string) => void;
  type?: 'text' | 'date';
  erreur?: string;
  requis?: boolean;
}>) {
  return (
    <Field data-invalid={!!erreur}>
      <FieldLabel htmlFor={id}>{libelle}{requis && ' *'}</FieldLabel>
      <Input id={id} type={type} value={valeur} aria-invalid={!!erreur} onChange={(e) => onChange(e.target.value)} />
      <FieldError>{erreur}</FieldError>
    </Field>
  );
}

export function ChampListe({ id, libelle, items, valeur, onChange, erreur, requis, disabled }: Readonly<{
  id: string;
  libelle: string;
  items: SearchableSelectOption[];
  valeur: string | null;
  onChange: (valeur: string | null) => void;
  erreur?: string;
  requis?: boolean;
  disabled?: boolean;
}>) {
  return (
    <Field data-invalid={!!erreur}>
      <FieldLabel htmlFor={id}>{libelle}{requis && ' *'}</FieldLabel>
      <SearchableSelect id={id} label={libelle} items={items} value={valeur} onValueChange={onChange} placeholder="Choisir…" disabled={disabled} />
      <FieldError>{erreur}</FieldError>
    </Field>
  );
}
