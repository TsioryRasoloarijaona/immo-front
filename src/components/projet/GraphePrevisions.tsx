import { formatMontantCompact, formatPercent } from '../../lib/format';
import { COULEURS_PREVISIONS as COULEURS, moisCourt, type SeriePrevision } from '../../lib/sousFenetresLot';
import type { PointPrevisionDto } from '../../types/projet';

const HAUTEUR = 220;
const MARGE = { haut: 10, bas: 28, gauche: 64, droite: 44 };
const PAS = 40;
const ECART_ETIQUETTES = 60;
const SERIES: SeriePrevision[] = ['estimation', 'prevision', 'reel'];
const AVANCEMENT: Record<SeriePrevision, (p: PointPrevisionDto) => number | null> = {
  estimation: (p) => p.avancementEstimation,
  prevision: (p) => p.avancementPrevision,
  reel: (p) => p.avancementReel,
};
const DECALAGE: Record<SeriePrevision, number> = { estimation: -1, prevision: 0, reel: 1 };

/** Tracé d'une série d'avancement ; un mois sans valeur interrompt la courbe. */
function trace(points: PointPrevisionDto[], valeur: (p: PointPrevisionDto) => number | null, x: (i: number) => number, y: (v: number) => number): string {
  let d = '';
  let enCours = false;
  points.forEach((p, i) => {
    const v = valeur(p);
    if (v === null) {
      enCours = false;
      return;
    }
    d += `${enCours ? 'L' : 'M'}${x(i)},${y(v)} `;
    enCours = true;
  });
  return d;
}

/** Barres mensuelles (montants) et courbes d'avancement (%) des trois séries ; `masquees` retire une série du graphe. */
export default function GraphePrevisions({ mois, libelles, masquees, titre }: Readonly<{
  mois: PointPrevisionDto[];
  libelles: Record<SeriePrevision, string>;
  masquees?: ReadonlySet<SeriePrevision>;
  titre: string;
}>) {
  const series = SERIES.filter((s) => !masquees?.has(s));
  const largeur = MARGE.gauche + MARGE.droite + mois.length * PAS;
  const utile = HAUTEUR - MARGE.haut - MARGE.bas;
  const maxMontant = Math.max(1, ...mois.flatMap((p) => series.map((s) => p[s])));
  const maxAv = Math.max(1, ...mois.flatMap((p) => series.map((s) => AVANCEMENT[s](p) ?? 0)));
  const yMontant = (v: number) => MARGE.haut + utile - (v / maxMontant) * utile;
  const yAv = (v: number) => MARGE.haut + utile - (v / maxAv) * utile;
  const xCentre = (i: number) => MARGE.gauche + i * PAS + PAS / 2;
  // une étiquette sur `saut` (≥ 60 px d'écart) ; première et dernière gardées, l'avant-dernière cède sa place
  const saut = Math.ceil(ECART_ETIQUETTES / PAS);
  const dernier = mois.length - 1;
  const afficherEtiquette = (i: number) => i === 0 || i === dernier || (i % saut === 0 && dernier - i >= saut);
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-wrap gap-3 text-body text-muted-foreground">
        {series.map((s) => (
          <li key={s} className="inline-flex items-center gap-1">
            <span aria-hidden className="inline-block size-2.5 rounded-sm" style={{ background: COULEURS[s] }} /> {libelles[s]}
          </li>
        ))}
        <li>Courbes : avancement (%, axe de droite)</li>
      </ul>
      <div className="overflow-x-auto">
        <svg width={largeur} height={HAUTEUR} role="img" aria-label={titre}>
          {[0, 0.5, 1].map((f) => (
            <g key={f}>
              <line x1={MARGE.gauche} x2={largeur - MARGE.droite} y1={yMontant(maxMontant * f)} y2={yMontant(maxMontant * f)} className="stroke-border" />
              <text x={MARGE.gauche - 4} y={yMontant(maxMontant * f) + 3} textAnchor="end" className="fill-muted-foreground text-[10px]">
                {formatMontantCompact(maxMontant * f)}
              </text>
              <text x={largeur - MARGE.droite + 4} y={yAv(maxAv * f) + 3} className="fill-muted-foreground text-[10px]">
                {formatPercent(maxAv * f, 0)}
              </text>
            </g>
          ))}
          {mois.map((p, i) => (
            <g key={p.mois}>
              {series.map((s) => (
                <rect
                  key={s}
                  x={xCentre(i) + DECALAGE[s] * 10 - 4.5}
                  y={yMontant(p[s])}
                  width={9}
                  height={yMontant(0) - yMontant(p[s])}
                  fill={COULEURS[s]}
                  opacity={0.85}
                />
              ))}
              {afficherEtiquette(i) && (
                <text x={xCentre(i)} y={HAUTEUR - 10} textAnchor="middle" className="fill-muted-foreground text-[10px]">
                  {moisCourt(p.mois)}
                </text>
              )}
            </g>
          ))}
          {series.map((s) => (
            <path key={s} d={trace(mois, AVANCEMENT[s], xCentre, yAv)} fill="none" stroke={COULEURS[s]} strokeWidth={1.5} strokeDasharray="4 3" />
          ))}
        </svg>
      </div>
    </div>
  );
}
