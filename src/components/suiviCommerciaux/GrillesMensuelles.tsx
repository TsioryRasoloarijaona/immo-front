import { useState } from 'react';
import ChoixUnique from '../ChoixUnique';
import MultiSelectDropdown from '../MultiSelectDropdown';
import { EmptyState, ErrorState, LoadingState, ResultsRegion } from '../ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { getSuiviCommerciauxMensuel } from '../../lib/api';
import { formatCurrency, formatNumber, formatPercent } from '../../lib/format';
import { useTranchesFiltre } from '../../lib/referentiels';
import { MOIS } from '../../lib/suiviCommerciaux';
import { useApi } from '../../lib/useApi';
import type { BlocMensuel, IndicateursCommercial } from '../../types';

type Item = { label: string; value: string };

/** Libellés de l'écran OMRAN « Suivi des commerciaux », à l'identique. */
type Indicateur = Exclude<keyof IndicateursCommercial, 'commercialCle' | 'commercialNom'>;

const COLONNES: { nom: Indicateur; libelle: string; format: (v: number | null) => string }[] = [
  { nom: 'nbProspections', libelle: 'Nbr. prospection', format: formatNumber },
  { nom: 'nbVisitesProspection', libelle: 'Nbr. visite de prospection', format: formatNumber },
  { nom: 'nbVisitesVente', libelle: 'Nbr. visite de vente', format: formatNumber },
  { nom: 'nbVentes', libelle: 'Nbr. vente', format: formatNumber },
  { nom: 'nbVentesIssuesProspection', libelle: 'Nbr. vente issu des prospection', format: formatNumber },
  { nom: 'prixArticles', libelle: 'Prix article', format: formatCurrency },
  { nom: 'versements', libelle: 'Versement', format: formatCurrency },
  { nom: 'perfVente', libelle: 'Perf. vente', format: (v) => formatPercent(v) },
  { nom: 'perfVisite', libelle: 'Perf. visite', format: (v) => formatPercent(v) },
  { nom: 'perfProspection', libelle: 'Perf. prospection.', format: (v) => formatPercent(v) },
  { nom: 'perfRecouvrement', libelle: 'Perf. recouv.', format: (v) => formatPercent(v) },
];

function Ligne({ l, nom, total }: Readonly<{ l: IndicateursCommercial; nom: string; total?: boolean }>) {
  return (
    <TableRow className={total ? 'bg-muted/50 font-medium' : undefined}>
      <TableCell>{nom}</TableCell>
      {COLONNES.map((c) => (
        <TableCell key={c.nom} className="text-right tabular-nums">
          {c.format(l[c.nom])}
        </TableCell>
      ))}
    </TableRow>
  );
}

function Grille({ titre, bloc }: Readonly<{ titre: string; bloc: BlocMensuel }>) {
  return (
    <section aria-label={titre} className="flex flex-col gap-2">
      <h2 className="text-body font-semibold">{titre}</h2>
      <div className="overflow-auto rounded-xl border border-border bg-card">
        {bloc.lignes.length === 0 ? (
          <EmptyState title="Aucune activité sur cette période" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Commercial</TableHead>
                {COLONNES.map((c) => (
                  <TableHead key={c.nom} className="text-right">
                    {c.libelle}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {bloc.lignes.map((l) => (
                <Ligne key={l.commercialCle ?? l.commercialNom} l={l} nom={l.commercialNom ?? '—'} />
              ))}
              <Ligne l={bloc.total} nom="Total" total />
              <Ligne l={bloc.moyenne} nom="Moyenne" total />
            </TableBody>
          </Table>
        )}
      </div>
    </section>
  );
}

const ANNEE_COURANTE = new Date().getFullYear();
const ANNEES: Item[] = Array.from({ length: 6 }, (_, i) => String(ANNEE_COURANTE - i)).map((a) => ({ label: a, value: a }));

/** Vue OMRAN mois / année ; sans tranche cochée, le serveur prend les tranches habilitées. */
export default function GrillesMensuelles({ commerciaux }: Readonly<{ commerciaux: Item[] }>) {
  const [annee, setAnnee] = useState(String(ANNEE_COURANTE));
  const [mois, setMois] = useState(String(new Date().getMonth() + 1));
  const [trancheIds, setTrancheIds] = useState<string[]>([]);
  const [commercialIds, setCommercialIds] = useState<string[]>([]);
  const tranches = useTranchesFiltre().data.map((t) => ({ label: t.description || t.code || t.id, value: t.id }));
  const mensuel = useApi(
    () => getSuiviCommerciauxMensuel({ annee: Number(annee), mois: Number(mois), trancheIds, commercialIds }),
    [annee, mois, trancheIds.join(','), commercialIds.join(',')],
    'suivi-commerciaux-mensuel',
  );
  const libelleMois = MOIS.find((m) => m.value === mois)?.label ?? mois;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <ChoixUnique items={ANNEES} value={annee} largeur="w-28" onChange={(v) => setAnnee(v ?? String(ANNEE_COURANTE))} />
        <ChoixUnique items={MOIS} value={mois} largeur="w-36" onChange={(v) => setMois(v ?? '1')} />
        <MultiSelectDropdown label="Tranche" placeholder="Habilitées" value={trancheIds} onChange={setTrancheIds} items={tranches} />
        {commerciaux.length > 0 && (
          <MultiSelectDropdown label="Commercial" placeholder="Tous" value={commercialIds} onChange={setCommercialIds} items={commerciaux} />
        )}
      </div>
      {mensuel.loading && !mensuel.data && <LoadingState />}
      {mensuel.error && <ErrorState message={mensuel.error} />}
      {!mensuel.error && mensuel.data && (
        <ResultsRegion loading={mensuel.loading} className="gap-4">
          <Grille titre={`${libelleMois} ${annee}`} bloc={mensuel.data.mois} />
          <Grille titre={`Année ${annee}`} bloc={mensuel.data.annee} />
        </ResultsRegion>
      )}
    </div>
  );
}
