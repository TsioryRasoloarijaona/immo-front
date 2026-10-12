import { Input } from '../ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { valeurAffichee, valeurSaisie, type GenreChamp } from '../../lib/saisiePatrimoine';
import type { OptionSelect } from './SaisiePatrimoine';

/** Liste déroulante compacte d'une cellule d'onglet. */
export function SelectCellule({
  etiquette,
  options,
  valeur,
  onChange,
  invalide,
}: Readonly<{
  etiquette: string;
  options: OptionSelect[];
  valeur: string | undefined;
  onChange: (v: string | undefined) => void;
  invalide: boolean;
}>) {
  return (
    <Select items={options} value={valeur ?? null} onValueChange={(v) => onChange((v as string) || undefined)}>
      <SelectTrigger size="sm" className="w-full min-w-48" aria-label={etiquette} aria-invalid={invalide}>
        <SelectValue placeholder="Choisir…" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

/** Saisie numérique d'une cellule ; `taux` : fraction affichée et saisie en %. */
export function NombreCellule({
  etiquette,
  genre,
  valeur,
  onChange,
  invalide,
}: Readonly<{
  etiquette: string;
  genre: Extract<GenreChamp, 'nombre' | 'montant' | 'taux' | 'entier'>;
  valeur: number | undefined;
  onChange: (v: number | undefined) => void;
  invalide: boolean;
}>) {
  return (
    <Input
      type="number"
      inputMode="decimal"
      className="h-7 w-28 text-right"
      aria-label={etiquette}
      aria-invalid={invalide}
      value={valeurAffichee(genre, valeur)}
      onChange={(e) => onChange(valeurSaisie(genre, e.target.value) as number | undefined)}
    />
  );
}
