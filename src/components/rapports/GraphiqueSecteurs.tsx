import { cheminPart, couleurSerie } from '../../lib/graphiquesRapport';
import { formatPercentValue } from '../../lib/format';
import { formatCellule, versNombre } from '../../lib/rapports';
import type { GraphiqueRapportDto, SectionRapportDto } from '../../types/rapports';

const RAYON = 80;
const CENTRE = 90;
const DEPART = -Math.PI / 2;

/** Camembert + légende (libellé, valeur, part) : la couleur n'est jamais seule à porter l'information. */
export default function GraphiqueSecteurs({ section, graphique }: Readonly<{ section: SectionRapportDto; graphique: GraphiqueRapportDto }>) {
  const colonneCat = section.colonnes.find((c) => c.nom === graphique.colonneCategorie);
  const colonneVal = section.colonnes.find((c) => c.nom === graphique.colonnesValeurs[0]);
  const parts = section.lignes
    .map((l) => ({
      libelle: colonneCat ? formatCellule(colonneCat, l[colonneCat.nom]) : '',
      valeur: colonneVal ? (versNombre(l[colonneVal.nom]) ?? 0) : 0,
    }))
    .filter((p) => p.valeur > 0);
  const somme = parts.reduce((s, p) => s + p.valeur, 0);
  if (!colonneVal || somme === 0) return <p className="text-body text-muted-foreground">Aucune donnée à représenter.</p>;

  const secteurs = parts.map((p, i) => {
    const avant = parts.slice(0, i).reduce((s, q) => s + q.valeur, 0);
    const angle = (cumul: number) => DEPART + (cumul / somme) * 2 * Math.PI;
    return { ...p, i, part: (p.valeur / somme) * 100, debut: angle(avant), fin: angle(avant + p.valeur) };
  });

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <svg viewBox={`0 0 ${CENTRE * 2} ${CENTRE * 2}`} width={CENTRE * 2} height={CENTRE * 2} role="img" aria-label={graphique.titre} className="shrink-0">
        {secteurs.map((s) => {
          const titre = `${s.libelle} : ${formatCellule(colonneVal, s.valeur)} (${formatPercentValue(s.part, 1)})`;
          return secteurs.length === 1 ? (
            <circle key={s.i} cx={CENTRE} cy={CENTRE} r={RAYON} fill={couleurSerie(s.i)}>
              <title>{titre}</title>
            </circle>
          ) : (
            <path key={s.i} d={cheminPart(CENTRE, CENTRE, RAYON, s.debut, s.fin)} fill={couleurSerie(s.i)} stroke="var(--background)" strokeWidth={1.5}>
              <title>{titre}</title>
            </path>
          );
        })}
      </svg>
      <ul className="flex min-w-48 flex-col gap-1 text-body">
        {secteurs.map((s) => (
          <li key={s.i} className="flex items-center gap-2">
            <span aria-hidden className="size-2.5 shrink-0 rounded-sm" style={{ background: couleurSerie(s.i) }} />
            <span className="min-w-0 flex-1 truncate">{s.libelle}</span>
            <span className="tabular-nums">{formatCellule(colonneVal, s.valeur)}</span>
            <span className="w-14 text-right tabular-nums text-muted-foreground">{formatPercentValue(s.part, 1)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
