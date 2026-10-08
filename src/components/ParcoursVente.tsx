import { Check, ChevronRight, Circle, CircleDot, Eye, Minus } from 'lucide-react';
import { Button } from './ui/button';
import { formatDate } from '../lib/format';
import type { CibleEtapeParcours, EtapeParcours } from '../lib/parcours';
import { usePreview } from '../lib/previewContext';
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

function libelleAccessible(c: CibleEtapeParcours): string {
  if (c.type === 'prospect') return 'Ouvrir la fiche du prospect';
  return c.code ? `Ouvrir le dossier ${c.code}` : 'Ouvrir le dossier';
}

/** La bande « parcours de vente » au-dessus de l'en-tête d'une fiche
 * prospection. Distincte du stepper des étapes commerciales : celle-ci dit
 * quel *document* la fiche est devenue, pas où en est la négociation.
 * « Voir » ouvre la fiche complète en dialogue, empilé au-dessus d'un
 * éventuel dialogue courant : l'utilisateur reste sur la fiche. */
export default function ParcoursVente({ etapes, accent }: { etapes: EtapeParcours[]; accent: string }) {
  const { ouvrirFicheProspect, ouvrirFicheDossier } = usePreview();

  const ouvrir = (c: CibleEtapeParcours) => {
    if (c.type === 'prospect') ouvrirFicheProspect(c.id);
    else ouvrirFicheDossier(c.id);
  };

  return (
    <nav
      aria-label="Parcours de vente"
      className="overflow-x-auto rounded-xl bg-muted/50 ring-1 ring-foreground/10"
    >
      <ol className="flex min-w-max items-start gap-2 px-3 py-2">
        {etapes.map((e, i) => {
          const Icone = ICONE[e.statut];
          const active = e.statut === 'faite' || e.statut === 'courante';
          const nonAtteinte = e.statut === 'sautee' || e.statut === 'a-venir';
          return (
            <li
              key={e.cle}
              aria-current={e.statut === 'courante' ? 'step' : undefined}
              className="flex items-start gap-2"
            >
              {i > 0 && (
                <span aria-hidden className="flex h-6 items-center text-muted-foreground/60">
                  <ChevronRight className="size-4" />
                </span>
              )}
              <div className="flex min-w-0 flex-col gap-1 pr-1">
                <span
                  className={cn(
                    'flex h-6 items-center gap-2 text-sm whitespace-nowrap',
                    e.statut === 'courante' && 'font-semibold text-foreground',
                    e.statut === 'faite' && 'font-medium text-foreground',
                    e.statut === 'a-venir' && 'text-muted-foreground',
                    e.statut === 'sautee' && 'text-muted-foreground/60',
                  )}
                >
                  <span
                    className={cn(
                      'inline-flex size-5 shrink-0 items-center justify-center rounded-full',
                      active ? 'text-white' : 'border border-border bg-background text-muted-foreground',
                    )}
                    style={active ? { backgroundColor: accent } : undefined}
                  >
                    <Icone className="size-3" strokeWidth={3} aria-hidden />
                  </span>
                  <span className="hidden sm:inline">{e.libelle}</span>
                  <span className="sm:hidden">{e.libelleCourt}</span>
                  <span className="sr-only"> — {LIBELLE_STATUT[e.statut]}</span>
                </span>
                <span className="flex min-h-6 items-center gap-2 pl-7 text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                  {nonAtteinte ? (
                    '—'
                  ) : (
                    <>
                      {e.date && <span>{formatDate(e.date)}</span>}
                      {e.cible && (
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          aria-label={libelleAccessible(e.cible)}
                          onClick={() => e.cible && ouvrir(e.cible)}
                        >
                          <Eye data-icon="inline-start" aria-hidden />
                          {e.cible.libelle}
                        </Button>
                      )}
                      {!e.date && !e.cible && <span aria-hidden>&nbsp;</span>}
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
