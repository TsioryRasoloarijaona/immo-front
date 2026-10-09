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

/** Montre quel document la fiche est devenue, pas où en est la négociation. */
export default function ParcoursVente({ etapes, accent }: { etapes: EtapeParcours[]; accent: string }) {
  const { ouvrirFicheProspect, ouvrirFicheDossier } = usePreview();

  const ouvrir = (c: CibleEtapeParcours) => {
    if (c.type === 'prospect') ouvrirFicheProspect(c.id);
    else ouvrirFicheDossier(c.id);
  };

  return (
    <nav
      aria-label="Parcours de vente"
      className="max-w-full min-w-0 overflow-x-auto rounded-lg bg-muted/50 ring-1 ring-foreground/10"
    >
      <ol className="flex h-8 min-w-max items-center gap-1.5 px-2.5">
        {etapes.map((e, i) => {
          const Icone = ICONE[e.statut];
          const active = e.statut === 'faite' || e.statut === 'courante';
          const atteinte = !(e.statut === 'sautee' || e.statut === 'a-venir');
          return (
            <li
              key={e.cle}
              aria-current={e.statut === 'courante' ? 'step' : undefined}
              className="flex items-center gap-1.5"
            >
              {i > 0 && <ChevronRight aria-hidden className="size-3.5 text-muted-foreground/60" />}
              <span
                className={cn(
                  'flex items-center gap-1.5 text-body whitespace-nowrap',
                  e.statut === 'courante' && 'font-semibold text-foreground',
                  e.statut === 'faite' && 'font-medium text-foreground',
                  e.statut === 'a-venir' && 'text-muted-foreground',
                  e.statut === 'sautee' && 'text-muted-foreground/60',
                )}
              >
                <span
                  className={cn(
                    'inline-flex size-4 shrink-0 items-center justify-center rounded-full',
                    active ? 'text-white' : 'border border-border bg-background text-muted-foreground',
                  )}
                  style={active ? { backgroundColor: accent } : undefined}
                >
                  <Icone className="size-2.5" strokeWidth={3} aria-hidden />
                </span>
                <span className="hidden sm:inline">{e.libelle}</span>
                <span className="sm:hidden">{e.libelleCourt}</span>
                <span className="sr-only"> — {LIBELLE_STATUT[e.statut]}</span>
              </span>
              {atteinte && e.date && (
                <span className="text-micro whitespace-nowrap text-muted-foreground tabular-nums">{formatDate(e.date)}</span>
              )}
              {atteinte && e.cible && (
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  aria-label={libelleAccessible(e.cible)}
                  title={libelleAccessible(e.cible)}
                  className={e.cible.code ? undefined : 'px-1.5'}
                  onClick={() => e.cible && ouvrir(e.cible)}
                >
                  <Eye data-icon={e.cible.code ? 'inline-start' : undefined} aria-hidden />
                  {e.cible.code}
                </Button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
