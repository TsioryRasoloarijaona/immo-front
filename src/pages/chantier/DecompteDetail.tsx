import { Link, useParams } from 'react-router-dom';
import { ReceiptText } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, Card, EmptyState, ErrorState, Field, FieldGrid, LoadingState } from '../../components/ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { getDecompteChantier, nullSiIntrouvable } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { formatCurrency, formatDate, formatNumber, formatPercentValue } from '../../lib/format';
import { cn } from '../../lib/utils';
import type { DecompteDetailDto } from '../../types';
import NotFound from '../NotFound';
import { BadgeStatutFacture, LigneMontant } from './chantierUi';

const NUM = 'text-right tabular-nums';

export default function DecompteDetail() {
  const { id = '' } = useParams();
  return <FicheDecompte key={id} id={id} />;
}

function FicheDecompte({ id }: Readonly<{ id: string }>) {
  const { data: d, loading, error } = useApi(() => nullSiIntrouvable(getDecompteChantier(id)), [id]);

  if (loading && !d) return <PageShell title="Décompte"><LoadingState /></PageShell>;
  if (error) return <PageShell title="Décompte"><ErrorState message={error} /></PageShell>;
  if (!d) return <NotFound />;

  return (
    <PageShell
      title={`Décompte ${d.code ?? ''}`}
      crumbs={[{ label: 'Décomptes', to: '/chantier/decomptes' }, { label: d.code ?? '' }]}
      icon={<ReceiptText />}
      accent="var(--sec-chantier-decompte)"
      accentBg="var(--sec-chantier-decompte-bg)"
    >
      <div className="flex flex-col gap-3 pt-1">
        <EnteteDecompte d={d} />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Montants d={d} />
          <FactureEtReglements d={d} />
        </div>
        <Lignes d={d} />
        <Extras d={d} />
        {d.retenues.length > 0 && <Retenues d={d} />}
      </div>
    </PageShell>
  );
}

function EnteteDecompte({ d }: Readonly<{ d: DecompteDetailDto }>) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-title font-semibold tracking-tight text-foreground">Décompte n° {d.numero ?? '—'}</h2>
        <span className="font-mono text-micro text-muted-foreground">{d.code}</span>
        <span className="text-body text-muted-foreground">du {formatDate(d.dateDocument)}</span>
        {d.dernier && <Badge tone="info">Dernier décompte</Badge>}
      </div>
      <div className="flex flex-wrap gap-x-4 text-body text-muted-foreground">
        <span>
          Lot :{' '}
          {d.lotId ? (
            <Link to={`/chantier/lots/${d.lotId}`} className="text-foreground hover:text-primary">
              {d.lotCode} {d.lotDescription}
            </Link>
          ) : (
            '—'
          )}
        </span>
        <span>
          Projet :{' '}
          {d.projetId ? (
            <Link to={`/chantier/projets/${d.projetId}`} className="text-foreground hover:text-primary">
              {d.projetCode}
            </Link>
          ) : (
            '—'
          )}
        </span>
        <span>Fournisseur : {d.fournisseurNom ?? '—'}</span>
      </div>
    </div>
  );
}

/** Ordre de l'écran OMRAN : de la période au net à payer, puis les cumuls. */
function Montants({ d }: Readonly<{ d: DecompteDetailDto }>) {
  return (
    <Card title="Montants">
      <table className="w-full text-body">
        <tbody>
          <LigneMontant libelle="Montant HT" valeur={d.montantHT} />
          <LigneMontant libelle="TVA" valeur={d.montantTVA} />
          <LigneMontant libelle="Montant TTC" valeur={d.montantTTC} />
          <LigneMontant libelle="Travaux supplémentaires" valeur={d.travauxSupplementaires} />
          <LigneMontant libelle={`Retenue de garantie (${formatPercentValue(d.tauxRetenueGarantie)})`} valeur={d.retenueGarantie} />
          <LigneMontant libelle="Avance amortie" valeur={d.avanceAmortie} />
          <LigneMontant libelle="Avance sur décompte" valeur={d.avanceSurDecompte} />
          <LigneMontant libelle="Compte prorata" valeur={d.compteProrata} />
          <LigneMontant libelle="Assurance DEC" valeur={d.assuranceDEC} />
          <LigneMontant libelle="Assurance TRC" valeur={d.assuranceTRC} />
          <LigneMontant libelle="Retenues non remboursables" valeur={d.retenuesNonRemboursables} />
          <LigneMontant libelle="Retenues remboursables" valeur={d.retenuesRemboursables} />
          <LigneMontant libelle="Fluctuations" valeur={d.fluctuations} />
          <LigneMontant libelle="Net à payer" valeur={d.netAPayer} fort separe />
          <LigneMontant libelle="Cumul TTC" valeur={d.cumulTTC} separe />
          <LigneMontant libelle="Cumul net de RG" valeur={d.cumulNetRetenueGarantie} />
        </tbody>
      </table>
    </Card>
  );
}

function FactureEtReglements({ d }: Readonly<{ d: DecompteDetailDto }>) {
  const f = d.facture;
  return (
    <Card title="Facture">
      {f ? (
        <div className="flex flex-col gap-3">
          <FieldGrid>
            <Field label="Code" value={f.code} />
            <Field label="Statut" value={<BadgeStatutFacture libelle={f.statutDescription} />} />
            <Field label="Date" value={formatDate(f.dateDocument)} />
            <Field label="Échéance" value={formatDate(f.dateEcheance)} />
            <Field label="Net à payer" value={formatCurrency(f.montantAPayer)} />
            <Field label="Régularisation" value={f.regularisation ? formatCurrency(f.regularisation) : null} />
            <Field label="Réglé" value={formatCurrency(d.montantRegle)} />
            <Field label="Reste à régler" value={formatCurrency(d.resteARegler)} />
          </FieldGrid>
          <Reglements d={d} />
        </div>
      ) : (
        <EmptyState title="Décompte non facturé" />
      )}
    </Card>
  );
}

function Reglements({ d }: Readonly<{ d: DecompteDetailDto }>) {
  if (d.reglements.length === 0) return <p className="text-body text-muted-foreground">Aucun règlement sur cette facture.</p>;
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Date</TableHead>
          <TableHead>Code</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className={NUM}>Montant</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {d.reglements.map((r) => (
          <TableRow key={`${r.id}-${String(r.montant)}`} className={cn(r.annule && 'text-muted-foreground line-through')}>
            <TableCell>{formatDate(r.dateDocument)}</TableCell>
            <TableCell>{r.code ?? '—'}</TableCell>
            <TableCell>
              {r.typeDescription ?? '—'}
              {r.annule && <Badge tone="warning" className="ml-2 no-underline">Annulé</Badge>}
            </TableCell>
            <TableCell className={NUM}>{formatCurrency(r.montant)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function Lignes({ d }: Readonly<{ d: DecompteDetailDto }>) {
  return (
    <Card title="Lignes" padded={false}>
      {d.lignes.length === 0 ? (
        <EmptyState title="Aucune ligne — décompte saisi en travaux supplémentaires" />
      ) : (
        <div className="min-w-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Désignation</TableHead>
                <TableHead>Unité</TableHead>
                <TableHead className={NUM}>Qté marché</TableHead>
                <TableHead className={NUM}>PU HT</TableHead>
                <TableHead className={NUM}>Antérieure</TableHead>
                <TableHead className={NUM}>Période</TableHead>
                <TableHead className={NUM}>Cumulée</TableHead>
                <TableHead className={NUM}>HT période</TableHead>
                <TableHead className={NUM}>Avancement</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {d.lignes.map((l) => (
                <TableRow key={l.id} className={cn(!l.quantitePeriode && 'text-muted-foreground')}>
                  <TableCell className="max-w-90 truncate" title={l.designation ?? undefined}>{l.designation ?? '—'}</TableCell>
                  <TableCell>{l.unite ?? '—'}</TableCell>
                  <TableCell className={NUM}>{formatNumber(l.quantiteMarche, 2)}</TableCell>
                  <TableCell className={NUM}>{formatCurrency(l.prixUnitaireHT)}</TableCell>
                  <TableCell className={NUM}>{formatNumber(l.quantiteAnterieure, 2)}</TableCell>
                  <TableCell className={NUM}>{formatNumber(l.quantitePeriode, 2)}</TableCell>
                  <TableCell className={NUM}>{formatNumber(l.quantiteCumulee, 2)}</TableCell>
                  <TableCell className={NUM}>{formatCurrency(l.montantHTPeriode)}</TableCell>
                  <TableCell className={cn(NUM, (l.avancementLignePct ?? 0) > 100 && 'text-(--amber)')}>
                    {formatPercentValue(l.avancementLignePct)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}

function Extras({ d }: Readonly<{ d: DecompteDetailDto }>) {
  return (
    <Card title="Travaux supplémentaires" padded={false}>
      {d.extras.length === 0 ? (
        <EmptyState title="Aucun travail supplémentaire" />
      ) : (
        <div className="min-w-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Code</TableHead>
                <TableHead>Désignation</TableHead>
                <TableHead>Unité</TableHead>
                <TableHead className={NUM}>Quantité</TableHead>
                <TableHead className={NUM}>PU HT</TableHead>
                <TableHead className={NUM}>TVA</TableHead>
                <TableHead className={NUM}>HT</TableHead>
                <TableHead className={NUM}>TTC</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {d.extras.map((x) => (
                <TableRow key={x.id}>
                  <TableCell className="text-muted-foreground">{x.code ?? '—'}</TableCell>
                  <TableCell className="max-w-90 truncate" title={x.designation ?? undefined}>{x.designation ?? '—'}</TableCell>
                  <TableCell>{x.unite ?? '—'}</TableCell>
                  <TableCell className={NUM}>{formatNumber(x.quantite, 2)}</TableCell>
                  <TableCell className={NUM}>{formatCurrency(x.prixUnitaire)}</TableCell>
                  <TableCell className={NUM}>{formatPercentValue(x.tauxTVA)}</TableCell>
                  <TableCell className={NUM}>{formatCurrency(x.montantHT)}</TableCell>
                  <TableCell className={NUM}>{formatCurrency(x.montantTTC)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}

function Retenues({ d }: Readonly<{ d: DecompteDetailDto }>) {
  return (
    <Card title="Retenues">
      <table className="w-full text-body">
        <tbody>
          {d.retenues.map((r) => (
            <LigneMontant key={r.id} libelle={r.libelle ?? '—'} valeur={r.montant} />
          ))}
        </tbody>
      </table>
    </Card>
  );
}
