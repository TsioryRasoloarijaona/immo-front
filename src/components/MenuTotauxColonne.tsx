import { Sigma } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { LIBELLES_FONCTION } from '../lib/groupement';
import { cn } from '../lib/utils';
import type { FonctionAgregat } from '../types';

/** Σ d'en-tête en mode « totaux serveur » : une case par fonction du catalogue, cumulables comme dans OMRAN. */
export default function MenuTotauxColonne({
  libelle,
  fonctions,
  actives,
  onBasculer,
}: Readonly<{
  libelle: string;
  fonctions: FonctionAgregat[];
  actives: FonctionAgregat[];
  onBasculer: (fonction: FonctionAgregat) => void;
}>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'shrink-0 rounded px-0.5 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50',
          actives.length > 0 ? 'text-(--brand)' : 'text-muted-foreground/50',
        )}
        title={`Totaux de ${libelle} sur toutes les lignes filtrées`}
        aria-label={`Totaux de ${libelle}`}
      >
        <Sigma className="size-2.75" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-44" align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="truncate text-micro text-muted-foreground">{libelle}</DropdownMenuLabel>
          {fonctions.map((f) => (
            <DropdownMenuCheckboxItem key={f} checked={actives.includes(f)} onCheckedChange={() => onBasculer(f)}>
              {LIBELLES_FONCTION[f]}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
