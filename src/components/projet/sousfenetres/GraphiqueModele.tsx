import { pointsGraphique } from '../../../lib/modeleSimulation';
import type { LigneModeleDto } from '../../../types/projet';

const L = 300;
const H = 150;
const MARGE = 8;

const x = (v: number) => MARGE + Math.min(Math.max(v, 0), 1) * (L - 2 * MARGE);
const y = (v: number) => H - MARGE - Math.min(Math.max(v, 0), 1) * (H - 2 * MARGE);

/** Deux courbes en fonction du temps écoulé : avancement des travaux (vert) et paiements cumulés (rouge). */
export default function GraphiqueModele({ lignes }: Readonly<{ lignes: LigneModeleDto[] }>) {
  const pts = pointsGraphique(lignes);
  const trace = (valeur: (p: (typeof pts)[number]) => number) => pts.map((p) => `${x(p.temps)},${y(valeur(p))}`).join(' ');
  return (
    <div className="flex flex-col gap-1">
      <svg viewBox={`0 0 ${L} ${H}`} role="img" aria-label="Avancement des travaux et des paiements en fonction du temps" className="w-full rounded-md border bg-background">
        <rect x={MARGE} y={MARGE} width={L - 2 * MARGE} height={H - 2 * MARGE} className="fill-none stroke-border" />
        <polyline points={trace((p) => p.avancement)} className="fill-none stroke-green-600" strokeWidth={2} />
        <polyline points={trace((p) => p.paiementCumule)} className="fill-none stroke-red-600" strokeWidth={2} />
      </svg>
      <div className="flex gap-4 text-micro text-muted-foreground">
        <span className="text-green-600">% d&apos;avancement des travaux</span>
        <span className="text-red-600">% d&apos;avancement des paiements</span>
      </div>
    </div>
  );
}
