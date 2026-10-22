import { couleurSerie } from '../../lib/graphiquesRapport';
import { formatCellule } from '../../lib/rapports';
import type { GraphiqueRapportDto, SectionRapportDto } from '../../types/rapports';
import GraphiqueAxes from './GraphiqueAxes';
import GraphiqueSecteurs from './GraphiqueSecteurs';

function LegendeSeries({ section, graphique }: Readonly<{ section: SectionRapportDto; graphique: GraphiqueRapportDto }>) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-body">
      {graphique.colonnesValeurs.map((nom, i) => {
        const colonne = section.colonnes.find((c) => c.nom === nom);
        if (!colonne) return null;
        const total = section.totaux?.[nom];
        return (
          <li key={nom} className="flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-sm" style={{ background: couleurSerie(i) }} />
            {colonne.libelle}
            {total !== undefined && total !== null && <span className="tabular-nums text-muted-foreground">({formatCellule(colonne, total)})</span>}
          </li>
        );
      })}
    </ul>
  );
}

/** Graphique SVG déclaré par le descripteur de section (colonnes groupées, secteurs ou lignes). */
export default function GraphiqueRapport({ section, graphique }: Readonly<{ section: SectionRapportDto; graphique: GraphiqueRapportDto }>) {
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-label font-medium">{graphique.titre}</figcaption>
      {graphique.type === 'SECTEURS' ? (
        <GraphiqueSecteurs section={section} graphique={graphique} />
      ) : (
        <>
          <GraphiqueAxes section={section} graphique={graphique} />
          <LegendeSeries section={section} graphique={graphique} />
        </>
      )}
    </figure>
  );
}
