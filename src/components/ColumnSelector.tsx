import { Fragment, useEffect, useRef, useState } from 'react';
import { Columns3, RotateCcw, Search } from 'lucide-react';
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
import { filtrerColonnes, libelleGroupe } from '../lib/colonnes';
import { cn } from '../lib/utils';
import type { ColonneDto } from '../types';

/** Touches qu'on laisse remonter au menu depuis le champ de recherche.
 *
 * Base UI équipe ses menus d'une recherche par frappe : n'importe quelle
 * touche imprimable déplace le focus vers l'élément dont le libellé commence
 * par cette lettre. Dans un menu qui contient un champ de saisie, ce
 * comportement vole chaque caractère tapé. On arrête donc la propagation de
 * tout le reste — mais surtout pas de celles-ci, qui sont la navigation :
 * sans elles on ne pourrait plus fermer le menu ni descendre du champ vers la
 * liste au clavier. */
const TOUCHES_DU_MENU = new Set(['Escape', 'ArrowDown', 'ArrowUp', 'Enter', 'Tab']);

/** Sélecteur de colonnes d'une liste.
 *
 * Le catalogue vient de `GET /api/referentiels/colonnes/prospections` — la même
 * source que la liste blanche qui valide `?colonnes=`, donc les deux ne peuvent
 * pas diverger. Rien n'est codé en dur ici : une colonne ajoutée côté serveur
 * apparaît dans ce menu sans redéploiement.
 *
 * Présenté par sections et doublé d'une recherche : le catalogue dépasse la
 * quarantaine de colonnes, où parcourir six sections à l'œil coûte plus cher
 * que taper trois lettres.
 *
 * Cocher une colonne change la **requête**, pas seulement l'affichage : les
 * groupes `ACTIVITE` et `CONVERSION` ne sont servis que s'ils sont demandés, et
 * sans eux le backend n'interroge pas la vue légataire. C'est ce qui sépare
 * 123 ms de 5 942 ms à la page 250 — et pourquoi on ne charge jamais tout pour
 * filtrer ensuite côté client. */
export default function ColumnSelector({
  catalogue,
  visibles,
  onBasculer,
  onReinitialiser,
  estDefaut,
  className,
}: {
  catalogue: ColonneDto[];
  visibles: string[];
  onBasculer: (nom: string) => void;
  onReinitialiser: () => void;
  estDefaut: boolean;
  className?: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [requete, setRequete] = useState('');
  const champRef = useRef<HTMLInputElement>(null);

  // Deux choses à l'ouverture du menu.
  //
  // 1. Reprendre le focus. Le menu le place sur son premier élément ; on le
  //    récupère à la frame suivante, une fois ce placement terminé.
  //
  // 2. Neutraliser la recherche-par-lettre de Base UI, **en natif**. Un
  //    `onKeyDown` React ne suffit pas : React délègue ses écouteurs à la
  //    racine de l'application, si bien que l'écouteur natif que Base UI pose
  //    sur le popup — un ancêtre du champ — s'exécute avant. Mesuré : une
  //    seule lettre fermait le menu. Posé sur le champ, qui est la cible de
  //    l'événement, l'écouteur passe avant tout ancêtre et `stopPropagation`
  //    fait son office.
  useEffect(() => {
    if (!ouvert) return;
    let champ: HTMLInputElement | null = null;
    const auClavier = (e: KeyboardEvent) => {
      if (!TOUCHES_DU_MENU.has(e.key)) e.stopPropagation();
    };
    // Dans la frame suivante, pas dans le corps de l'effet : le popup est
    // monté par portail et sa référence n'est pas encore garnie ici.
    const frame = requestAnimationFrame(() => {
      champ = champRef.current;
      champ?.focus();
      champ?.addEventListener('keydown', auClavier);
    });
    return () => {
      cancelAnimationFrame(frame);
      champ?.removeEventListener('keydown', auClavier);
    };
  }, [ouvert]);

  const filtre = filtrerColonnes(catalogue, requete);
  // Ordre de première apparition, pour que les sections suivent l'ordre des
  // colonnes dans le tableau. Un groupe dont plus rien ne correspond disparaît.
  const groupes = [...new Set(filtre.map((c) => c.groupe))];
  const derniere = visibles.length === 1;

  return (
    <DropdownMenu
      open={ouvert}
      onOpenChange={(o) => {
        setOuvert(o);
        // Une recherche laissée en place rouvrirait le menu amputé de la
        // plupart de ses colonnes, sans que rien n'explique pourquoi.
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
        {/* Marges négatives : le popup porte `p-1`, que la barre annule pour
            occuper toute sa largeur et se coller au bord haut quand la liste
            défile dessous. */}
        <div className="sticky -top-1 z-20 -mx-1 -mt-1 mb-1 border-b border-border bg-popover px-2 pt-2 pb-1.5">
          <div className="flex items-center gap-1.5">
            <Search aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              ref={champRef}
              type="text"
              value={requete}
              onChange={(e) => setRequete(e.target.value)}
              placeholder="Rechercher une colonne…"
              aria-label="Rechercher une colonne"
              className="h-6 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {filtre.length === 0 ? (
          <p className="px-2 py-3 text-body text-muted-foreground">Aucune colonne ne correspond.</p>
        ) : (
          /* `DropdownMenuLabel` est un `Menu.GroupLabel` de Base UI : il lit un
             contexte que seul `Menu.Group` fournit et jette « MenuGroupContext
             is missing » s'il en sort. Le `DropdownMenuGroup` n'est donc pas
             une commodité sémantique, c'est ce qui rend le titre de section
             légal — un `<div>` à la place fait planter l'écran entier. */
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
                        // Un tableau sans colonne n'a pas de sens : la dernière
                        // cochée se verrouille plutôt que de laisser produire
                        // une grille vide.
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
