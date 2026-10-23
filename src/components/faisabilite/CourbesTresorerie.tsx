import { formatDate, formatMontantCompact } from '../../lib/format';
import { valeurSerie, type SerieCourbe } from '../../lib/financeFaisabilite';
import type { MoisTresorerieDto } from '../../types/faisabilite';

const L = 720;
const H = 280;
const MARGE = { haut: 12, droite: 16, bas: 28, gauche: 64 };
const GRADUATIONS = 5;

/** Courbes mensuelles en SVG, sans bibliothèque : une polyligne par série cochée, axe des montants arrondi sur les extrêmes. */
export default function CourbesTresorerie({ mois, series }: Readonly<{ mois: MoisTresorerieDto[]; series: readonly SerieCourbe[] }>) {
  const valeurs = series.flatMap((s) => mois.map((m) => valeurSerie(m, s.cle)));
  const min = Math.min(0, ...valeurs);
  const max = Math.max(0, ...valeurs);
  const etendue = max - min || 1;
  const largeurUtile = L - MARGE.gauche - MARGE.droite;
  const hauteurUtile = H - MARGE.haut - MARGE.bas;
  const x = (i: number) => MARGE.gauche + (mois.length > 1 ? (i / (mois.length - 1)) * largeurUtile : largeurUtile / 2);
  const y = (v: number) => MARGE.haut + ((max - v) / etendue) * hauteurUtile;
  const pas = Math.max(1, Math.ceil(mois.length / 8));

  return (
    <svg viewBox={`0 0 ${L} ${H}`} role="img" aria-label="Courbes de trésorerie mensuelles" className="h-auto w-full text-muted-foreground">
      {Array.from({ length: GRADUATIONS + 1 }, (_, i) => {
        const v = min + (etendue * i) / GRADUATIONS;
        return (
          <g key={v}>
            <line x1={MARGE.gauche} x2={L - MARGE.droite} y1={y(v)} y2={y(v)} stroke="currentColor" strokeOpacity={0.2} />
            <text x={MARGE.gauche - 6} y={y(v) + 3} textAnchor="end" fontSize={10} fill="currentColor">{formatMontantCompact(v)}</text>
          </g>
        );
      })}
      <line x1={MARGE.gauche} x2={L - MARGE.droite} y1={y(0)} y2={y(0)} stroke="currentColor" strokeOpacity={0.6} />
      {mois.map((m, i) => (i % pas === 0
        ? <text key={m.mois} x={x(i)} y={H - 8} textAnchor="middle" fontSize={10} fill="currentColor">{formatDate(m.mois).slice(3)}</text>
        : null))}
      {series.map((s) => (
        <polyline key={s.cle} fill="none" stroke={s.couleur} strokeWidth={2} strokeLinejoin="round"
          points={mois.map((m, i) => `${x(i)},${y(valeurSerie(m, s.cle))}`).join(' ')}>
          <title>{s.libelle}</title>
        </polyline>
      ))}
    </svg>
  );
}
