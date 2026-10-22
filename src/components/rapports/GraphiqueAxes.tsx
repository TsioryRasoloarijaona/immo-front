import { couleurSerie, graduations } from '../../lib/graphiquesRapport';
import { formatMontantCompact, formatNumber, formatPercentValue } from '../../lib/format';
import { formatCellule, versNombre } from '../../lib/rapports';
import type { ColonneRapportDto, GraphiqueRapportDto, SectionRapportDto } from '../../types/rapports';

const HAUT = 12;
const GAUCHE = 52;
const BAS_COURT = 28;
const BAS_LONG = 78;
const HAUTEUR_TRACE = 200;

function etiquetteAxe(colonne: ColonneRapportDto | undefined, v: number): string {
  if (colonne?.type === 'MONTANT') return formatMontantCompact(v);
  if (colonne?.type === 'POURCENTAGE') return formatPercentValue(v, 0);
  return formatNumber(v, 0);
}

function courte(texte: string): string {
  return texte.length > 16 ? `${texte.slice(0, 15)}…` : texte;
}

interface Trace {
  serie: ColonneRapportDto;
  couleur: string;
  categories: string[];
  valeurs: number[];
  y: (v: number) => number;
  centre: (i: number) => number;
}

function Barres({ serie, couleur, categories, valeurs, y, centre, decalage, largeur }: Readonly<Trace & { decalage: number; largeur: number }>) {
  return categories.map((cat, i) => (
    <rect key={`${cat}-${i}`} x={centre(i) + decalage} y={y(valeurs[i])} width={Math.max(largeur - 2, 2)} height={HAUT + HAUTEUR_TRACE - y(valeurs[i])} fill={couleur}>
      <title>{`${cat} · ${serie.libelle} : ${formatCellule(serie, valeurs[i])}`}</title>
    </rect>
  ));
}

function Ligne({ serie, couleur, categories, valeurs, y, centre }: Readonly<Trace>) {
  return (
    <g>
      <polyline fill="none" stroke={couleur} strokeWidth={2} points={categories.map((_, i) => `${centre(i)},${y(valeurs[i])}`).join(' ')} />
      {categories.map((cat, i) => (
        <circle key={`${cat}-${i}`} cx={centre(i)} cy={y(valeurs[i])} r={3} fill={couleur}>
          <title>{`${cat} · ${serie.libelle} : ${formatCellule(serie, valeurs[i])}`}</title>
        </circle>
      ))}
    </g>
  );
}

/** Colonnes groupées (une barre par série et par catégorie) ou lignes (une polyligne par série). */
export default function GraphiqueAxes({ section, graphique }: Readonly<{ section: SectionRapportDto; graphique: GraphiqueRapportDto }>) {
  const series = graphique.colonnesValeurs
    .map((nom) => section.colonnes.find((c) => c.nom === nom))
    .filter((c): c is ColonneRapportDto => c !== undefined);
  const colonneCat = section.colonnes.find((c) => c.nom === graphique.colonneCategorie);
  const categories = section.lignes.map((l) => (colonneCat ? formatCellule(colonneCat, l[colonneCat.nom]) : ''));
  const valeurs = series.map((s) => section.lignes.map((l) => versNombre(l[s.nom]) ?? 0));
  const { plafond, valeurs: ticks } = graduations(Math.max(0, ...valeurs.flat()));
  const incline = categories.length > 6;
  const bas = incline ? BAS_LONG : BAS_COURT;
  const pasCategorie = Math.max(series.length * 14 + 14, 36);
  const largeur = Math.max(480, GAUCHE + categories.length * pasCategorie + 8);
  const hauteur = HAUT + HAUTEUR_TRACE + bas;
  const y = (v: number) => HAUT + HAUTEUR_TRACE * (1 - v / plafond);
  const centre = (i: number) => GAUCHE + pasCategorie * (i + 0.5);
  const colonnes = graphique.type === 'COLONNES';
  const largeurBarre = (pasCategorie - 14) / Math.max(series.length, 1);

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${largeur} ${hauteur}`} width={largeur} height={hauteur} role="img" aria-label={graphique.titre} className="max-w-none text-muted-foreground">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={GAUCHE} x2={largeur - 4} y1={y(t)} y2={y(t)} stroke="currentColor" strokeOpacity={0.2} />
            <text x={GAUCHE - 6} y={y(t) + 3} textAnchor="end" fontSize={10} fill="currentColor">
              {etiquetteAxe(series[0], t)}
            </text>
          </g>
        ))}
        {categories.map((cat, i) => (
          <text
            key={`${cat}-${i}`}
            x={centre(i)}
            y={HAUT + HAUTEUR_TRACE + 14}
            textAnchor={incline ? 'end' : 'middle'}
            fontSize={10}
            fill="currentColor"
            transform={incline ? `rotate(-40 ${centre(i)} ${HAUT + HAUTEUR_TRACE + 14})` : undefined}
          >
            <title>{cat}</title>
            {courte(cat)}
          </text>
        ))}
        {series.map((s, si) => {
          const trace = { serie: s, couleur: couleurSerie(si), categories, valeurs: valeurs[si], y, centre };
          return colonnes ? (
            <g key={s.nom}>
              <Barres {...trace} decalage={si * largeurBarre - (largeurBarre * series.length) / 2} largeur={largeurBarre} />
            </g>
          ) : (
            <Ligne key={s.nom} {...trace} />
          );
        })}
      </svg>
    </div>
  );
}
