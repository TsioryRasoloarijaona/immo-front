import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { Field as FormField, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import SearchableSelect from '../SearchableSelect';
import SelecteurCouleur from './SelecteurCouleur';
import type { Choix } from '../../lib/saisiePatrimoine';
import type { ChampReferentielDto } from '../../types/referentielsAdmin';

const SELECTION = new Set(['REFERENCE', 'OPERATEUR']);

/** Un champ du descripteur : le contrôle dépend de son type. */
export default function ChampReferentiel({ champ, id, valeur, onChange, items, desactive, erreur }: Readonly<{
  champ: ChampReferentielDto;
  id: string;
  valeur: string | boolean;
  onChange: (valeur: string | boolean) => void;
  items: Choix;
  desactive: boolean;
  erreur?: string | null;
}>) {
  if (champ.type === 'BOOLEEN') {
    return (
      <label htmlFor={id} className="flex items-center gap-2 self-end py-1.5 text-label text-foreground">
        <input id={id} type="checkbox" checked={valeur === true} disabled={desactive} onChange={(e) => onChange(e.target.checked)} />
        {champ.libelle}
      </label>
    );
  }
  const texte = String(valeur);
  let controle;
  if (SELECTION.has(champ.type)) {
    controle = (
      <div className="flex gap-1.5">
        <SearchableSelect id={id} items={items} value={texte || null} disabled={desactive} placeholder="Choisir…"
          emptyMessage="Aucun choix" className="w-full min-w-0" onValueChange={(v) => onChange(v ?? '')} />
        {!champ.obligatoire && !desactive && texte !== '' && (
          <Button type="button" variant="ghost" size="icon-sm" aria-label={`Effacer ${champ.libelle}`} onClick={() => onChange('')}>
            <X />
          </Button>
        )}
      </div>
    );
  } else if (champ.type === 'COULEUR') {
    controle = <SelecteurCouleur id={id} valeur={texte} desactive={desactive} onChange={onChange} />;
  } else {
    const nombre = champ.type !== 'TEXTE';
    controle = (
      <Input id={id} type={nombre ? 'number' : 'text'} step={nombre ? 'any' : undefined} min={nombre ? 0 : undefined}
        maxLength={champ.longueurMax ?? undefined} value={texte} disabled={desactive} aria-invalid={erreur ? true : undefined}
        onChange={(e) => onChange(e.target.value)} />
    );
  }
  return (
    <FormField>
      <FieldLabel htmlFor={id}>{champ.libelle}{champ.obligatoire ? ' *' : ''}{champ.type === 'FRACTION' ? ' (%)' : ''}</FieldLabel>
      {controle}
      {erreur && <p className="text-micro text-destructive">{erreur}</p>}
    </FormField>
  );
}
