import { useState } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';
import { couleurTrace, libelleTrace } from '../../lib/plans';
import type { PlanDto, TraceDto } from '../../types/plans';

type Geometrie = Pick<PlanDto, 'largeur' | 'hauteur' | 'x' | 'y'>;

const ZOOMS = [1, 1.5, 2, 3, 4];

/**
 * Image du plan et tracés cliquables superposés, dans le repère de l'image. Les `d` sont posés en attribut par React :
 * le SVG du serveur n'est jamais injecté en HTML. `estGrise` estompe les tracés écartés par les filtres.
 */
export default function PlanSvg({ image, plan, traces, estGrise, onChoisir }: Readonly<{
  image: string;
  plan: Geometrie;
  traces: readonly TraceDto[];
  estGrise: (t: TraceDto) => boolean;
  onChoisir: (t: TraceDto) => void;
}>) {
  const [niveau, setNiveau] = useState(0);
  const largeur = plan.largeur ?? 1000;
  const hauteur = plan.hauteur ?? 1000;
  const x = plan.x ?? 0;
  const y = plan.y ?? 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex items-center gap-1">
        <Button type="button" variant="outline" size="icon-sm" aria-label="Dézoomer" disabled={niveau === 0}
          onClick={() => setNiveau((n) => n - 1)}><Minus /></Button>
        <Button type="button" variant="outline" size="icon-sm" aria-label="Zoomer" disabled={niveau === ZOOMS.length - 1}
          onClick={() => setNiveau((n) => n + 1)}><Plus /></Button>
        <Button type="button" variant="outline" size="icon-sm" aria-label="Taille d'origine" disabled={niveau === 0}
          onClick={() => setNiveau(0)}><RotateCcw /></Button>
        <span className="text-micro text-muted-foreground tabular-nums">{ZOOMS[niveau] * 100} %</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-border bg-card">
        <svg
          viewBox={`${x} ${y} ${largeur} ${hauteur}`}
          style={{ width: `${ZOOMS[niveau] * 100}%` }}
          role="group"
          aria-label="Plan de l'étage"
        >
          <image href={image} x={x} y={y} width={largeur} height={hauteur} />
          {traces.map((t) => (
            <path
              key={t.articleId}
              d={t.d ?? undefined}
              fill={couleurTrace(t)}
              fillOpacity={estGrise(t) ? 0.08 : 0.55}
              stroke={couleurTrace(t)}
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
              className="cursor-pointer outline-none hover:[fill-opacity:0.85] focus-visible:stroke-foreground"
              role="button"
              tabIndex={0}
              aria-label={libelleTrace(t)}
              onClick={() => onChoisir(t)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onChoisir(t);
                }
              }}
            >
              <title>{libelleTrace(t)}</title>
            </path>
          ))}
        </svg>
      </div>
    </div>
  );
}
