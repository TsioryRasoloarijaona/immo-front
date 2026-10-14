import { useId } from 'react';
import SearchableSelect, { type SearchableSelectOption } from '../../SearchableSelect';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';

const LIBELLE = 'mb-0.5 block text-micro font-medium text-muted-foreground';
/** Choisir « Aucun » vide le champ (envoyé dans `champsAVider`). */
const AUCUN: SearchableSelectOption = { label: '— Aucun —', value: '' };

export function ChampDate({
  label,
  value,
  onChange,
}: Readonly<{ label: string; value: string; onChange: (v: string) => void }>) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={LIBELLE}>{label}</label>
      <Input id={id} type="date" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function ChampTexte({
  label,
  value,
  onChange,
  maxLength,
  multiligne,
}: Readonly<{ label: string; value: string; onChange: (v: string) => void; maxLength: number; multiligne?: boolean }>) {
  const id = useId();
  return (
    <div className={multiligne ? 'sm:col-span-2' : undefined}>
      <label htmlFor={id} className={LIBELLE}>{label}</label>
      {multiligne ? (
        <Textarea id={id} value={value} maxLength={maxLength} rows={3} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <Input id={id} value={value} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

export function ChampCase({
  label,
  checked,
  onChange,
}: Readonly<{ label: string; checked: boolean; onChange: (v: boolean) => void }>) {
  return (
    <label className="flex items-center gap-2 text-body text-foreground">
      <input
        type="checkbox"
        className="size-3.5 accent-primary"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

export function ChampListe({
  label,
  items,
  value,
  onChange,
  chargement,
}: Readonly<{
  label: string;
  items: SearchableSelectOption[];
  value: string;
  onChange: (v: string) => void;
  chargement?: boolean;
}>) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={LIBELLE}>{label}</label>
      <SearchableSelect
        id={id}
        items={[AUCUN, ...items]}
        value={value || null}
        onValueChange={(v) => onChange(v ?? '')}
        placeholder={chargement ? 'Chargement…' : '— Aucun —'}
        className="w-full"
        emptyMessage="Aucun résultat"
      />
    </div>
  );
}
