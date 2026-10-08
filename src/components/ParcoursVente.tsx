import { Link } from 'react-router-dom';
import { Check, ChevronRight, Circle, CircleDot, Minus } from 'lucide-react';
import { formatDate } from '../lib/format';
import type { EtapeParcours } from '../lib/parcours';
import { cn } from '../lib/utils';

const ICONE = {
  faite: Check,
  courante: CircleDot,
  'a-venir': Circle,
  sautee: Minus,
} as const;

const LIBELLE_STATUT = {
  faite: 'faite',
  courante: 'étape actuelle',
  'a-venir': 'à venir',
  sautee: 'sans objet',
} as const;

/** La bande « parcours de vente » au-dessus de l'en-tête d'une fiche
 * prospection. Distincte du stepper des étapes commerciales : celle-ci dit
 * quel *document* la fiche est devenue, pas où en est la négociation. */
export default function ParcoursVente({ etapes, accent }: { etapes: EtapeParcours[]; accent: string }) {
  return (
    <nav aria-label="Parcours de vente" className="overflow-x-auto">
      <ol className="flex min-w-max items-start gap-1 px-1 py-1">
        {etapes.map((e, i) => {
          const Icone = ICONE[e.statut];
          const active = e.statut === 'faite' || e.statut === 'courante';
          return (
            <li
              key={e.cle}
              aria-current={e.statut === 'courante' ? 'step' : undefined}
              className="flex items-start gap-1"
            >
              {i > 0 && (
                <span aria-hidden className="flex h-5 items-center text-muted-foreground/60">
                  <ChevronRight className="size-3.5" />
                </span>
              )}
              <div className="flex min-w-0 flex-col gap-0.5 px-1.5">
                <span
                  className={cn(
                    'flex items-center gap-1.5 text-label whitespace-nowrap',
                    e.statut === 'courante' && 'font-semibold text-foreground',
                    e.statut === 'faite' && 'text-foreground',
                    e.statut === 'a-venir' && 'text-muted-foreground',
                    e.statut === 'sautee' && 'text-muted-foreground/60',
                  )}
                >
                  <span
                    className={cn(
                      'inline-flex size-4 shrink-0 items-center justify-center rounded-full',
                      active ? 'text-white' : 'border border-border text-muted-foreground',
                    )}
                    style={active ? { backgroundColor: accent } : undefined}
                  >
                    <Icone className="size-2.5" strokeWidth={3} aria-hidden />
                  </span>
                  <span className="hidden sm:inline">{e.libelle}</span>
                  <span className="sm:hidden">{e.libelleCourt}</span>
                  <span className="sr-only"> — {LIBELLE_STATUT[e.statut]}</span>
                </span>
                <span className="flex items-center gap-1.5 pl-5.5 text-micro whitespace-nowrap text-muted-foreground tabular-nums">
                  {e.statut === 'sautee' || e.statut === 'a-venir' ? (
                    '—'
                  ) : (
                    <>
                      {e.date && <span>{formatDate(e.date)}</span>}
                      {e.lien && (
                        <Link to={e.lien.vers} className="font-medium text-(--brand) underline-offset-2 hover:underline">
                          {e.lien.libelle}
                        </Link>
                      )}
                      {!e.date && !e.lien && <span aria-hidden>&nbsp;</span>}
                    </>
                  )}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
