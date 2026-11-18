import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DataGrid from '../DataGrid';
import GraphePrevisions from './GraphePrevisions';
import { EmptyState } from '../ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { formatCurrency, formatPercent } from '../../lib/format';
import { COULEURS_PREVISIONS, type SeriePrevision } from '../../lib/sousFenetresLot';
import {
  COLONNES_AVANCEMENT, COLONNES_LOTS, colonnesDecaissement, LIBELLES_GRAPHE, SERIES_PROJET,
} from '../../lib/previsionsProjet';
import type { DecaissementPrevisionDto, PointAvancementDto, PrevisionsProjetDto } from '../../types/projet';

const CADRE = 'flex min-h-0 min-w-0 flex-1 flex-col overflow-auto rounded-xl border border-border bg-card';

function TotauxNetAPayer({ d, masquees, basculer }: Readonly<{
  d: PrevisionsProjetDto;
  masquees: ReadonlySet<SeriePrevision>;
  basculer: (s: SeriePrevision) => void;
}>) {
  return (
    <section aria-label="Net à payer" className="rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Net à payer</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Due à ce jour</TableHead>
            <TableHead className="text-right">Reste</TableHead>
            <TableHead className="text-right">Avancement</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {SERIES_PROJET.map(({ cle, serie, libelle }) => {
            const t = d.totaux[cle];
            return (
              <TableRow key={cle}>
                <TableCell>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={!masquees.has(serie)} onChange={() => basculer(serie)} aria-label={`Afficher ${libelle} dans le graphe`} />
                    <span aria-hidden className="inline-block size-2.5 rounded-full" style={{ background: COULEURS_PREVISIONS[serie] }} />
                    {libelle}
                  </label>
                </TableCell>
                <TableCell className="text-right tabular-nums">{t.total === null ? '' : formatCurrency(t.total)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(t.due)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(t.reste)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatPercent(t.avancement, 2)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </section>
  );
}

function OngletSerie({ cle, decaissements, avancements }: Readonly<{
  cle: string;
  decaissements: DecaissementPrevisionDto[];
  avancements: PointAvancementDto[];
}>) {
  return (
    <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
      <section aria-label="Décaissement" className={CADRE}>
        <h3 className="px-2 py-1 text-body font-medium">Décaissement</h3>
        <DataGrid
          cleOrdre={`projet-previsions-decaissement-${cle}`}
          rows={decaissements.map((l, i) => ({ ...l, id: `${l.lotId}-${l.date}-${i}` }))}
          colonnes={colonnesDecaissement(cle === 'previsionAjustee')}
          bandeauRegroupement={false}
        />
      </section>
      <section aria-label="Avancement" className={CADRE}>
        <h3 className="px-2 py-1 text-body font-medium">Avancement</h3>
        <DataGrid
          cleOrdre="projet-previsions-avancement"
          rows={avancements.map((p) => ({ ...p, id: p.mois }))}
          colonnes={COLONNES_AVANCEMENT}
          bandeauRegroupement={false}
        />
      </section>
    </div>
  );
}

/** Bloc « Net à payer » et onglets d'un projet (FEATURE-n4-previsions-chantier.md, écran 1). */
export default function PrevisionsProjetDetail({ d }: Readonly<{ d: PrevisionsProjetDto }>) {
  const navigate = useNavigate();
  const [masquees, setMasquees] = useState<ReadonlySet<SeriePrevision>>(new Set());
  const basculer = (s: SeriePrevision) =>
    setMasquees((m) => {
      const suivant = new Set(m);
      if (!suivant.delete(s)) suivant.add(s);
      return suivant;
    });
  return (
    <div className="flex flex-col gap-3">
      <TotauxNetAPayer d={d} masquees={masquees} basculer={basculer} />
      <Tabs defaultValue="graphes">
        <TabsList>
          <TabsTrigger value="graphes">Graphes</TabsTrigger>
          <TabsTrigger value="lots">Lots</TabsTrigger>
          {SERIES_PROJET.map(({ cle, libelle }) => <TabsTrigger key={cle} value={cle}>{libelle}</TabsTrigger>)}
        </TabsList>
        <TabsContent value="graphes">
          {d.mois.length === 0 ? (
            <EmptyState title="Aucune prévision pour ce projet" />
          ) : (
            <GraphePrevisions mois={d.mois} libelles={LIBELLES_GRAPHE} masquees={masquees} titre={`Prévisions mensuelles de ${d.projetDescription}`} />
          )}
        </TabsContent>
        <TabsContent value="lots">
          <div className={CADRE}>
            <DataGrid
              cleOrdre="projet-previsions-lots"
              rows={d.lots.map((l) => ({ ...l, id: l.lotId }))}
              colonnes={COLONNES_LOTS}
              onOuvrir={(id) => void navigate(`/projet/lots/${id}`)}
              libelleLigne={(l) => `Ouvrir le lot ${l.code}`}
              bandeauRegroupement={false}
            />
          </div>
        </TabsContent>
        {SERIES_PROJET.map(({ cle }) => (
          <TabsContent key={cle} value={cle}>
            <OngletSerie cle={cle} decaissements={d.decaissements[cle]} avancements={d.avancements[cle]} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
