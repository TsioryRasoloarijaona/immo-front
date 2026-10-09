import { Fragment, useState } from 'react';
import { Columns3, RotateCcw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import RechercheMenu from './RechercheMenu';
import { filtrerColonnes, libelleGroupe } from '../lib/colonnes';
import { cn } from '../lib/utils';
import type { ColonneDto } from '../types';

/** Cocher une colonne change la requête, pas seulement l'affichage : `ACTIVITE` et
 * `CONVERSION` ne sont servis que demandés, sans eux le backend évite la vue légataire
 * lente. Ne jamais tout charger pour filtrer côté client. */
export default function ColumnSelector({
  catalogue,
  visibles,
  onBasculer,
  onReinitialiser,
  estDefaut,
  className,
}: Readonly<{
  catalogue: ColonneDto[];
  visibles: string[];
  onBasculer: (nom: string) => void;
  onReinitialiser: () => void;
  estDefaut: boolean;
  className?: string;
}>) {
  const [ouvert, setOuvert] = useState(false);
  const [requete, setRequete] = useState('');

  const filtre = filtrerColonnes(catalogue, requete);
  const groupes = [...new Set(filtre.map((c) => c.groupe))];
  const derniere = visibles.length === 1;

  return (
    <DropdownMenu
      open={ouvert}
      onOpenChange={(o) => {
        setOuvert(o);
        // Recherche vidée à la fermeture : sinon le menu rouvrirait amputé, sans explication.
        if (!o) setRequete('');
      }}
    >
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

      <DropdownMenuContent className="max-h-96 w-64" align="end">
        <RechercheMenu
          ouvert={ouvert}
          valeur={requete}
          onChange={setRequete}
          placeholder="Rechercher une colonne…"
          libelle="Rechercher une colonne"
        />

        {filtre.length === 0 ? (
          <p className="px-2 py-3 text-body text-muted-foreground">Aucune colonne ne correspond.</p>
        ) : (
          /* `DropdownMenuLabel` exige le contexte de `DropdownMenuGroup` : hors de lui,
             Base UI jette « MenuGroupContext is missing » et l'écran entier tombe. */
          groupes.map((groupe, i) => (
            <Fragment key={groupe}>
              {i > 0 && <DropdownMenuSeparator />}
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-micro text-muted-foreground">{libelleGroupe(groupe)}</DropdownMenuLabel>
                {filtre
                  .filter((c) => c.groupe === groupe)
                  .map((c) => {
                    const coche = visibles.includes(c.nom);
                    return (
                      <DropdownMenuCheckboxItem
                        key={c.nom}
                        checked={coche}
                        disabled={coche && derniere}
                        onCheckedChange={() => onBasculer(c.nom)}
                      >
                        {c.libelle}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuGroup>
            </Fragment>
          ))
        )}

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
