import { Link } from 'react-router-dom';
import { House, X } from 'lucide-react';
import { ACCUEIL, titreOnglet, useOngletsEcrans } from '../lib/ongletsEcrans';
import { cn } from '../lib/utils';

const ONGLET =
  'relative flex h-8.5 items-center gap-2 rounded-t-md border border-b-0 border-transparent text-xs whitespace-nowrap select-none outline-hidden transition-colors focus-within:ring-2 focus-within:ring-ring';
const ACTIF = 'z-1 -mb-px h-9 border-border bg-background font-semibold text-foreground after:absolute after:inset-x-3 after:top-0 after:h-0.5 after:rounded-b-sm after:bg-(--brand)';
const INACTIF = 'text-muted-foreground hover:bg-(--surface-hover) hover:text-foreground';

/** Accueil puis un onglet par écran ouvert ; les listes gardent leurs filtres, l'onglet ne mémorise que la recherche d'URL. */
export default function OngletsEcrans({ titres }: Readonly<{ titres: ReadonlyMap<string, string> }>) {
  const { onglets, actif, fermer } = useOngletsEcrans(titres);

  return (
    <nav aria-label="Écrans ouverts" className="flex min-w-0 items-end gap-0.5 self-end overflow-x-auto [scrollbar-width:none]">
      <Link
        to={ACCUEIL}
        aria-current={actif === ACCUEIL ? 'page' : undefined}
        className={cn(ONGLET, 'px-3', actif === ACCUEIL ? ACTIF : INACTIF)}
      >
        <House className="size-3.5" aria-hidden />
        Accueil
      </Link>
      {onglets.map((o) => {
        const titre = titreOnglet(o.chemin, titres);
        return (
          <div key={o.chemin} className={cn(ONGLET, 'pr-1.5 pl-3', o.chemin === actif ? ACTIF : INACTIF)}>
            <Link
              to={o.chemin + o.recherche}
              aria-current={o.chemin === actif ? 'page' : undefined}
              className="max-w-44 truncate outline-hidden after:absolute after:inset-0"
            >
              {titre}
            </Link>
            <button
              type="button"
              aria-label={`Fermer ${titre}`}
              title="Fermer"
              onClick={() => fermer(o.chemin)}
              className="relative z-1 grid size-4.5 place-items-center rounded-sm opacity-55 hover:bg-(--neutral-bg) hover:opacity-100"
            >
              <X className="size-3" aria-hidden />
            </button>
          </div>
        );
      })}
    </nav>
  );
}
