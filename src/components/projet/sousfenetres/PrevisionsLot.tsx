import DataGrid from '../../DataGrid';
import { getPrevisionsLot } from '../../../lib/apiProjet';
import { formatMontantCompact, formatPercent } from '../../../lib/format';
import { COLONNES_PREVISIONS, moisCourt } from '../../../lib/sousFenetresLot';
import type { PointPrevisionDto, PrevisionsLotDto } from '../../../types/projet';
import DonneesLot from './DonneesLot';

const HAUTEUR = 220;
const MARGE = { haut: 10, bas: 28, gauche: 64, droite: 44 };
const PAS = 40;
const COULEURS = { estimation: '#16a34a', prevision: '#2563eb', reel: '#dc2626' };

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

function Legende() {
  const elements: [string, string][] = [
    [COULEURS.estimation, 'Estimation de base'],
    [COULEURS.prevision, 'Prévision'],
    [COULEURS.reel, 'Réel'],
  ];
  return (
    <ul className="flex flex-wrap gap-3 text-body text-muted-foreground">
      {elements.map(([couleur, libelle]) => (
        <li key={libelle} className="inline-flex items-center gap-1">
          <span aria-hidden className="inline-block size-2.5 rounded-sm" style={{ background: couleur }} /> {libelle}
        </li>
      ))}
      <li>Courbes : avancement (%, axe de droite)</li>
    </ul>
  );
}

function Graphe({ mois }: Readonly<{ mois: PointPrevisionDto[] }>) {
  const largeur = MARGE.gauche + MARGE.droite + mois.length * PAS;
  const utile = HAUTEUR - MARGE.haut - MARGE.bas;
  const maxMontant = Math.max(1, ...mois.flatMap((p) => [p.estimation, p.prevision, p.reel]));
  const maxAv = Math.max(1, ...mois.flatMap((p) => [p.avancementEstimation ?? 0, p.avancementPrevision ?? 0, p.avancementReel ?? 0]));
  const yMontant = (v: number) => MARGE.haut + utile - (v / maxMontant) * utile;
  const yAv = (v: number) => MARGE.haut + utile - (v / maxAv) * utile;
  const xCentre = (i: number) => MARGE.gauche + i * PAS + PAS / 2;
  const barres: [keyof typeof COULEURS, number][] = [
    ['estimation', -1],
    ['prevision', 0],
    ['reel', 1],
  ];
  const courbes: [keyof typeof COULEURS, (p: PointPrevisionDto) => number | null][] = [
    ['estimation', (p) => p.avancementEstimation],
    ['prevision', (p) => p.avancementPrevision],
    ['reel', (p) => p.avancementReel],
  ];
  return (
    <div className="overflow-x-auto">
      <svg width={largeur} height={HAUTEUR} role="img" aria-label="Prévisions mensuelles du lot">
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
            {barres.map(([cle, decalage]) => (
              <rect
                key={cle}
                x={xCentre(i) + decalage * 10 - 4.5}
                y={yMontant(p[cle])}
                width={9}
                height={yMontant(0) - yMontant(p[cle])}
                fill={COULEURS[cle]}
                opacity={0.85}
              />
            ))}
            <text x={xCentre(i)} y={HAUTEUR - 10} textAnchor="middle" className="fill-muted-foreground text-[10px]">
              {moisCourt(p.mois)}
            </text>
          </g>
        ))}
        {courbes.map(([cle, valeur]) => (
          <path key={cle} d={trace(mois, valeur, xCentre, yAv)} fill="none" stroke={COULEURS[cle]} strokeWidth={1.5} strokeDasharray="4 3" />
        ))}
      </svg>
    </div>
  );
}

export default function PrevisionsLot({ lotId }: Readonly<{ lotId: string }>) {
  return (
    <DonneesLot<PrevisionsLotDto> lotId={lotId} charger={getPrevisionsLot} estVide={(d) => d.mois.length === 0} texteVide="Aucune prévision pour ce lot">
      {(d) => (
        <div className="flex flex-col gap-3">
          <Legende />
          <Graphe mois={d.mois} />
          <DataGrid rows={d.mois.map((p) => ({ ...p, id: p.mois }))} colonnes={COLONNES_PREVISIONS} cleOrdre="lot-previsions" bandeauRegroupement={false} />
        </div>
      )}
    </DonneesLot>
  );
}
