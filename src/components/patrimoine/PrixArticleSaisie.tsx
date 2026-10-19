import { Card, Field, FieldGrid } from '../ui';
import { Field as FormField, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { formatCurrency } from '../../lib/format';
import { apercuPrix, type ModePrix, type Surface } from '../../lib/saisieArticle';
import type { Brouillon } from '../../lib/saisiePatrimoine';

const MODES = [
  { label: 'Prix au m² HT', value: 'HT' },
  { label: 'Prix au m² TTC', value: 'TTC' },
];

const nombre = (v: string | boolean | undefined) => Number(v ?? '') || 0;

function LignePrix({ surface, libelle, brouillon, onChange, verrouille }: Readonly<{
  surface: Surface;
  libelle: string;
  brouillon: Brouillon;
  onChange: (nom: string, valeur: string) => void;
  verrouille: boolean;
}>) {
  const nomSurface = surface === 'Provisoire' ? 'surfaceProvisoire' : 'surfaceDefinitive';
  const mode = brouillon[`mode${surface}`] as ModePrix;
  const tva = nombre(brouillon.tauxTva) / 100;
  const apercu = apercuPrix(nombre(brouillon[nomSurface]), nombre(brouillon[`prixM2${surface}`]), mode, tva);

  // Changer de sens garde le même prix : la valeur saisie devient celle de l'autre sens.
  function changerMode(nouveau: ModePrix) {
    const valeur = nouveau === 'HT' ? apercu.prixM2HT : apercu.prixM2TTC;
    onChange(`mode${surface}`, nouveau);
    onChange(`prixM2${surface}`, valeur ? String(Math.round(valeur * 1e6) / 1e6) : '');
  }

  return (
    <div className="flex flex-col gap-2.5">
      <h3 className="text-label font-semibold text-foreground">{libelle}</h3>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <FormField>
          <FieldLabel htmlFor={`champ-${nomSurface}`}>Surface (m²)</FieldLabel>
          <Input id={`champ-${nomSurface}`} type="number" step="any" min={0} disabled={verrouille}
            value={String(brouillon[nomSurface])} onChange={(e) => onChange(nomSurface, e.target.value)} />
        </FormField>
        <FormField>
          <FieldLabel htmlFor={`mode-${surface}`}>Saisie</FieldLabel>
          <Select items={MODES} value={mode} disabled={verrouille} onValueChange={(v) => changerMode(v as ModePrix)}>
            <SelectTrigger id={`mode-${surface}`} className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {MODES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectGroup>
            </SelectContent>
          </Select>
        </FormField>
        <FormField>
          <FieldLabel htmlFor={`prix-${surface}`}>{`Prix au m² ${mode}`}</FieldLabel>
          <Input id={`prix-${surface}`} type="number" step="any" min={0} disabled={verrouille}
            value={String(brouillon[`prixM2${surface}`])} onChange={(e) => onChange(`prixM2${surface}`, e.target.value)} />
        </FormField>
      </div>
      <FieldGrid>
        <Field label="Prix au m² HT" value={formatCurrency(apercu.prixM2HT)} />
        <Field label="Prix au m² TTC" value={formatCurrency(apercu.prixM2TTC)} />
        <Field label="Prix de l'article HT" value={formatCurrency(apercu.prixHT)} />
        <Field label="Prix de l'article TTC" value={formatCurrency(apercu.prixTTC)} />
      </FieldGrid>
    </div>
  );
}

/** Carte « Surfaces et prix » : calculs affichés en direct (formules OMRAN, FEATURE-patrimoine-ecriture.md §5.5). */
export default function PrixArticleSaisie({ brouillon, onChange, verrouille }: Readonly<{
  brouillon: Brouillon;
  onChange: (nom: string, valeur: string) => void;
  verrouille: boolean;
}>) {
  return (
    <Card title="Surfaces et prix">
      <div className="flex flex-col gap-4">
        <FormField className="max-w-60">
          <FieldLabel htmlFor="champ-tauxTva">TVA (%)</FieldLabel>
          <Input id="champ-tauxTva" type="number" step="any" min={0} max={100} disabled={verrouille}
            value={String(brouillon.tauxTva)} onChange={(e) => onChange('tauxTva', e.target.value)} />
        </FormField>
        <LignePrix surface="Provisoire" libelle="Provisoire" brouillon={brouillon} onChange={onChange} verrouille={verrouille} />
        <LignePrix surface="Definitif" libelle="Définitif" brouillon={brouillon} onChange={onChange} verrouille={verrouille} />
      </div>
    </Card>
  );
}
