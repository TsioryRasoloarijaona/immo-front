import { Field, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import SearchableSelect from '../SearchableSelect';
import type { ChampTache as Champ } from '../../lib/saisieTache';

const TYPE_INPUT = { texte: 'text', nombre: 'number', date: 'datetime-local' } as const;

/** Un champ de la fiche tâche : le contrôle dépend du genre ; `erreur` s'affiche sous le champ. */
export default function ChampTache({ champ, valeur, items, erreur, onChange }: Readonly<{
  champ: Champ;
  valeur: string;
  items: { label: string; value: string }[];
  erreur?: string;
  onChange: (valeur: string) => void;
}>) {
  const id = `tache-${champ.cle}`;
  let controle;
  if (champ.genre === 'liste') {
    controle = (
      <SearchableSelect id={id} items={items} value={valeur || null} placeholder="Choisir…" emptyMessage="Aucun choix"
        className="w-full min-w-0" onValueChange={(v) => onChange(v ?? '')} />
    );
  } else if (champ.genre === 'long') {
    controle = <Textarea id={id} rows={3} value={valeur} aria-invalid={erreur ? true : undefined} onChange={(e) => onChange(e.target.value)} />;
  } else {
    controle = (
      <Input id={id} type={TYPE_INPUT[champ.genre]} min={champ.genre === 'nombre' ? 0 : undefined} step={champ.genre === 'nombre' ? 'any' : undefined}
        value={valeur} aria-invalid={erreur ? true : undefined} onChange={(e) => onChange(e.target.value)} />
    );
  }
  return (
    <Field className={champ.genre === 'long' || champ.cle === 'description' ? 'col-span-full' : undefined}>
      <FieldLabel htmlFor={id}>{champ.libelle}</FieldLabel>
      {controle}
      {erreur && <p role="alert" className="text-micro text-destructive">{erreur}</p>}
    </Field>
  );
}
