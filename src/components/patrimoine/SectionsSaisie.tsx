import { X } from 'lucide-react';
import { Card } from '../ui';
import { Button } from '../ui/button';
import { Field as FormField, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import type { Brouillon, ChampDef, SectionSaisie } from '../../lib/saisiePatrimoine';

export type ListesChoix = Record<string, { label: string; value: string }[]>;

interface PropsChamp {
  def: ChampDef;
  valeur: string | boolean;
  onChange: (valeur: string | boolean) => void;
  liste?: { label: string; value: string }[];
  desactive: boolean;
  erreur: string | null;
}

const TYPE_INPUT: Partial<Record<ChampDef['type'], string>> = {
  date: 'date',
  montant: 'number',
  entier: 'number',
  pourcent: 'number',
  surface: 'number',
};

function ChampSaisie({ def, valeur, onChange, liste, desactive, erreur }: Readonly<PropsChamp>) {
  const id = `champ-${def.nom}`;
  const libelle = `${def.libelle}${def.obligatoire ? ' *' : ''}${def.type === 'pourcent' ? ' (%)' : ''}`;
  if (def.type === 'booleen') {
    return (
      <label htmlFor={id} className="flex items-center gap-2 self-end py-1.5 text-label text-foreground">
        <input id={id} type="checkbox" checked={valeur === true} disabled={desactive}
          onChange={(e) => onChange(e.target.checked)} />
        {def.libelle}
      </label>
    );
  }
  let controle;
  if (def.type === 'liste') {
    const items = liste ?? [];
    const effacable = !def.obligatoire && !desactive && String(valeur) !== '';
    controle = (
      <div className="flex gap-1.5">
        <Select items={items} value={String(valeur) || null} disabled={desactive}
          onValueChange={(v) => onChange(v ?? '')}>
          <SelectTrigger id={id} className="w-full min-w-0"><SelectValue placeholder="Choisir…" /></SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {items.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
            </SelectGroup>
          </SelectContent>
        </Select>
        {effacable && (
          <Button type="button" variant="ghost" size="icon-sm" aria-label={`Effacer ${def.libelle}`}
            onClick={() => onChange('')}>
            <X />
          </Button>
        )}
      </div>
    );
  } else if (def.type === 'texteLong') {
    controle = <Textarea id={id} value={String(valeur)} disabled={desactive} onChange={(e) => onChange(e.target.value)} />;
  } else {
    controle = (
      <Input id={id} type={TYPE_INPUT[def.type] ?? 'text'} step="any" min={def.type === 'texte' ? undefined : 0}
        value={String(valeur)} disabled={desactive} aria-invalid={erreur ? true : undefined}
        onChange={(e) => onChange(e.target.value)} />
    );
  }
  return (
    <FormField className={def.type === 'texteLong' ? 'sm:col-span-2' : undefined}>
      <FieldLabel htmlFor={id}>{libelle}</FieldLabel>
      {controle}
      {erreur && <p className="text-micro text-destructive">{erreur}</p>}
    </FormField>
  );
}

/** Sections de champs en cartes ; `verrouilles` : noms désactivés (création seule, article occupé…). */
export default function SectionsSaisie({
  sections,
  brouillon,
  onChange,
  listes = {},
  verrouilles = [],
  champErreur,
  messageErreur,
}: Readonly<{
  sections: SectionSaisie[];
  brouillon: Brouillon;
  onChange: (nom: string, valeur: string | boolean) => void;
  listes?: ListesChoix;
  verrouilles?: string[];
  champErreur?: string | null;
  messageErreur?: string | null;
}>) {
  return (
    <>
      {sections.map((section) => (
        <Card key={section.titre} title={section.titre}>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {section.champs.map((def) => (
              <ChampSaisie
                key={def.nom}
                def={def}
                valeur={brouillon[def.nom] ?? ''}
                onChange={(v) => onChange(def.nom, v)}
                liste={def.liste ? listes[def.liste] : undefined}
                desactive={def.lectureSeule === true || verrouilles.includes(def.nom)}
                erreur={champErreur === def.nom ? messageErreur ?? null : null}
              />
            ))}
          </div>
        </Card>
      ))}
    </>
  );
}
