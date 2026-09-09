import { Columns3, RotateCcw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { cn } from '../lib/utils';
import type { ColonneDefinition } from '../lib/colonnes';

/** Sélecteur de colonnes d'une liste.
 *
 * Présenté par sections, comme le prévoit le `groupe` du référentiel serveur à
 * venir (`GUIDE-FRONT-fiche-prospection.md` §5.3) : une liste plate de douze
 * cases à cocher se lit mal, et le regroupement est déjà la forme que le
 * serveur imposera.
 *
 * Le sélecteur ne modifie **que** l'affichage : `?colonnes=` n'est pas encore
 * pris en compte côté serveur, qui renvoie donc toujours les 20 champs. Rien
 * n'est filtré ni tronqué côté client au-delà du rendu — le §5.4.3 interdit
 * explicitement de charger large pour filtrer ensuite, et ce n'est pas ce qui
 * se passe ici : la requête est inchangée. */
export default function ColumnSelector({
  catalogue,
  visibles,
  onBasculer,
  onReinitialiser,
  estDefaut,
  className,
}: {
  catalogue: ColonneDefinition[];
  visibles: string[];
  onBasculer: (nom: string) => void;
  onReinitialiser: () => void;
  estDefaut: boolean;
  className?: string;
}) {
  // Ordre de première apparition dans le catalogue, pour que l'ordre des
  // sections suive celui des colonnes dans le tableau.
  const groupes = [...new Set(catalogue.map((c) => c.groupe))];
  const derniere = visibles.length === 1;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'flex h-8 items-center gap-1.5 rounded-lg border border-input bg-transparent px-2.5 text-sm whitespace-nowrap outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-input/50',
          className,
        )}
      >
        <Columns3 aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="text-muted-foreground">Colonnes</span>
        <span className="font-medium text-foreground">{visibles.length}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-96 w-56" align="end">
        {groupes.map((groupe, i) => (
          <div key={groupe}>
            {i > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-micro text-muted-foreground">{groupe}</DropdownMenuLabel>
            {catalogue
              .filter((c) => c.groupe === groupe)
              .map((c) => {
                const coche = visibles.includes(c.nom);
                return (
                  <DropdownMenuCheckboxItem
                    key={c.nom}
                    checked={coche}
                    // Un tableau sans colonne n'a pas de sens : la dernière
                    // cochée se verrouille plutôt que de laisser produire une
                    // grille vide.
                    disabled={coche && derniere}
                    onCheckedChange={() => onBasculer(c.nom)}
                  >
                    {c.libelle}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </div>
        ))}
        {!estDefaut && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onReinitialiser}>
              <RotateCcw aria-hidden className="size-3.5" />
              Rétablir les colonnes par défaut
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
