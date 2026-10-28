import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { useOngletEnteteMemorise } from '../../lib/fenetreFiche';

export interface OngletEntete {
  id: string;
  titre: string;
  contenu: ReactNode;
}

/** Petit classeur à droite de la bande d'identité ; l'onglet actif est mémorisé par type de fiche. */
export default function ClasseurEntete({ type, onglets }: Readonly<{ type: string; onglets: OngletEntete[] }>) {
  const [actif, choisir] = useOngletEnteteMemorise(
    type,
    onglets.map((o) => o.id),
  );
  const courant = onglets.find((o) => o.id === actif);
  return (
    <div className="flex min-h-0 min-w-0 flex-col rounded-lg border border-border bg-muted/30">
      <div role="tablist" aria-label="Informations de l'en-tête" className="flex shrink-0 gap-0.5 overflow-x-auto border-b border-border px-1 pt-1">
        {onglets.map((o) => (
          <button
            key={o.id}
            type="button"
            role="tab"
            id={`entete-${type}-${o.id}`}
            aria-selected={o.id === actif}
            aria-controls={`entete-${type}-page`}
            className={cn(
              'relative h-6 shrink-0 px-2 text-body whitespace-nowrap text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-(--brand) focus-visible:ring-inset',
              o.id === actif && "font-semibold text-foreground after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-t after:bg-(--brand) after:content-['']",
            )}
            onClick={() => choisir(o.id)}
          >
            {o.titre}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`entete-${type}-page`}
        aria-labelledby={`entete-${type}-${actif}`}
        className="min-h-0 flex-1 overflow-auto p-2.5"
      >
        {courant?.contenu}
      </div>
    </div>
  );
}
