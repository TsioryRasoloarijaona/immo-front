import { Field } from '../../../components/ui';
import { Input } from '../../../components/ui/input';

type Commun = Readonly<{ label: string; disabled: boolean }>;

export function ChampTexte({ label, valeur, onChange, disabled }: Commun & Readonly<{ valeur: string | null; onChange: (v: string | null) => void }>) {
  return <Field label={label} value={<Input aria-label={label} value={valeur ?? ''} disabled={disabled} onChange={(e) => onChange(e.target.value || null)} />} />;
}

export function ChampNombre({ label, valeur, onChange, disabled }: Commun & Readonly<{ valeur: number | null; onChange: (v: number | null) => void }>) {
  return (
    <Field
      label={label}
      value={<Input aria-label={label} type="number" step="any" value={valeur ?? ''} disabled={disabled} onChange={(e) => {
        const n = Number(e.target.value);
        if (e.target.value === '') onChange(null);
        else if (!Number.isNaN(n)) onChange(n);
      }} />}
    />
  );
}

/** Case + date : décocher vide la date. */
export function ChampDate({ label, valeur, onChange, disabled }: Commun & Readonly<{ valeur: string | null; onChange: (v: string | null) => void }>) {
  return (
    <Field
      label={label}
      value={
        <span className="flex items-center gap-2">
          <input
            type="checkbox"
            aria-label={`${label} renseignée`}
            className="accent-(--brand)"
            checked={valeur !== null}
            disabled={disabled}
            onChange={(e) => onChange(e.target.checked ? new Date().toLocaleDateString('en-CA') : null)}
          />
          <Input aria-label={label} type="date" value={valeur ?? ''} disabled={disabled || valeur === null} onChange={(e) => onChange(e.target.value || null)} />
        </span>
      }
    />
  );
}

export function ChampCase({ label, valeur, onChange, disabled }: Commun & Readonly<{ valeur: boolean | null; onChange: (v: boolean) => void }>) {
  return (
    <Field
      label={label}
      value={<input type="checkbox" aria-label={label} className="accent-(--brand)" checked={valeur === true} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />}
    />
  );
}
