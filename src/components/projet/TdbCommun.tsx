import { ChevronDown, ChevronRight } from 'lucide-react';
import MultiSelectDropdown from '../MultiSelectDropdown';

export function SelecteurProjets({ options, value, onChange }: Readonly<{
  options: { label: string; value: string }[];
  value: string[];
  onChange: (v: string[]) => void;
}>) {
  return (
    <span className="flex items-center gap-1.5 text-body text-muted-foreground">
      Projets
      <MultiSelectDropdown ariaLabel="Projets" placeholder="Tous" items={options} value={value} onChange={onChange} className="min-w-56" />
    </span>
  );
}

/** Cellule libellé d'une ligne d'arbre : indentation par niveau et bouton replier/déplier. */
export function CelluleArbre({ libelle, niveau, aEnfants, replie, onBascule }: Readonly<{
  libelle: string;
  niveau: number;
  aEnfants: boolean;
  replie: boolean;
  onBascule: () => void;
}>) {
  return (
    <td className="sticky left-0 bg-background whitespace-nowrap px-2" style={{ paddingLeft: 8 + niveau * 16 }}>
      {aEnfants ? (
        <button type="button" aria-expanded={!replie} aria-label={replie ? 'Déplier' : 'Replier'} onClick={onBascule} className="mr-1 inline-flex w-4 justify-center">
          {replie ? <ChevronRight className="size-3" /> : <ChevronDown className="size-3" />}
        </button>
      ) : (
        <span className="mr-1 inline-block w-4" />
      )}
      {libelle}
    </td>
  );
}
