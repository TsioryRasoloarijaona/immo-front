import { Link, useParams } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, Card, Field, FieldGrid } from '../../components/ui';
import { Table, TableBody, TableCell, TableRow } from '../../components/ui/table';
import { getDecompte } from '../../lib/apiProjet';
import { formatCurrency, formatDate } from '../../lib/format';
import type { DecompteDetailDto } from '../../types/projet';
import { BadgeStatut, EtatFiche } from './commun';
import { useFiche } from './hooks';
import { TablesDecompte } from './TablesDecompte';

const AVANT_NET: [string, (d: DecompteDetailDto) => number | null][] = [
  ['Montant HT', (d) => d.montantHT],
  ['TVA', (d) => d.montantTVA],
  ['Montant TTC', (d) => d.montantTTC],
  ['Travaux supplémentaires', (d) => d.travauxSupplementaires],
  ['Retenue de garantie', (d) => d.retenueGarantie],
  ['Avance amortie', (d) => d.avanceAmortie],
  ['Avance sur décompte', (d) => d.avanceSurDecompte],
  ['Compte prorata', (d) => d.compteProrata],
  ['Assurance DEC', (d) => d.assuranceDEC],
  ['Assurance TRC', (d) => d.assuranceTRC],
  ['Retenues non remboursables', (d) => d.retenuesNonRemboursables],
  ['Retenues remboursables', (d) => d.retenuesRemboursables],
  ['Fluctuations', (d) => d.fluctuations],
];

const APRES_NET: [string, (d: DecompteDetailDto) => number | null][] = [
  ['Cumul TTC', (d) => d.cumulTTC],
  ['Cumul net de retenue de garantie', (d) => d.cumulNetRetenueGarantie],
];

function Ligne({ libelle, valeur, fort }: Readonly<{ libelle: string; valeur: number | null; fort?: boolean }>) {
  return (
    <TableRow className={fort ? 'font-semibold' : undefined}>
      <TableCell>{libelle}</TableCell>
      <TableCell className="text-right">{formatCurrency(valeur)}</TableCell>
    </TableRow>
  );
}

function Montants({ d }: Readonly<{ d: DecompteDetailDto }>) {
  return (
    <Card title="Montants" padded={false}>
      <Table>
        <TableBody>
          {AVANT_NET.map(([libelle, valeur]) => (
            <Ligne key={libelle} libelle={libelle} valeur={valeur(d)} />
          ))}
          <Ligne libelle="Net à payer" valeur={d.netAPayer} fort />
          <Ligne libelle="Net recalculé (Arpent)" valeur={d.netAPayerRecalcule} />
          {APRES_NET.map(([libelle, valeur]) => (
            <Ligne key={libelle} libelle={libelle} valeur={valeur(d)} />
          ))}
        </TableBody>
      </Table>
      {d.ecartSignificatif && (
        <div role="alert" className="m-3 flex items-center gap-2 rounded-md border border-(--warning-border) bg-(--warning-bg) px-3 py-2 text-body text-(--warning)">
          <AlertTriangle aria-hidden className="size-4 shrink-0" />
          Écart avec OMRAN : {formatCurrency(d.ecartNetAPayer)}
        </div>
      )}
    </Card>
  );
}

function CarteFacture({ d }: Readonly<{ d: DecompteDetailDto }>) {
  const f = d.facture;
  return (
    <Card title="Facture">
      {f ? (
        <FieldGrid>
          <Field label="Code" value={<Link className="underline" to={`/projet/depenses/factures/${f.id}`}>{f.code}</Link>} />
          <Field label="Statut" value={<BadgeStatut libelle={f.statutDescription ?? f.statutCode} />} />
          <Field label="Date" value={formatDate(f.dateDocument)} />
          <Field label="Échéance" value={formatDate(f.dateEcheance)} />
          <Field label="Montant HT" value={formatCurrency(f.montantHT)} />
          <Field label="Montant TTC" value={formatCurrency(f.montantTTC)} />
          <Field label="Montant à payer" value={formatCurrency(f.montantAPayer)} />
          <Field label="Régularisation" value={formatCurrency(f.regularisation)} />
          <Field label="Réglé" value={formatCurrency(d.montantRegle)} />
          <Field label="Reste à régler" value={formatCurrency(d.resteARegler)} />
        </FieldGrid>
      ) : (
        <p className="text-body text-muted-foreground">Décompte non facturé</p>
      )}
    </Card>
  );
}

function Contenu({ d }: Readonly<{ d: DecompteDetailDto }>) {
  return (
    <div className="flex flex-col gap-3 p-4 md:px-7">
      <div className="grid items-start gap-3 lg:grid-cols-2">
        <Montants d={d} />
        <div className="flex flex-col gap-3">
          <CarteFacture d={d} />
          <Card title="Informations">
            <FieldGrid>
              <Field label="Créé le" value={formatDate(d.dateCreation)} />
              <Field label="Créé par" value={d.creePar} />
              <Field label="Modifié le" value={formatDate(d.dateModification)} />
              <Field label="Modifié par" value={d.modifiePar} />
            </FieldGrid>
          </Card>
        </div>
      </div>
      <TablesDecompte reglements={d.reglements} lignes={d.lignes} extras={d.extras} retenues={d.retenues} />
    </div>
  );
}

export default function DecompteDetail() {
  const { id = '' } = useParams();
  const etat = useFiche(() => getDecompte(id), id);
  const d = etat.data;
  return (
    <PageShell
      key={id}
      title={d ? `Décompte ${d.code ?? ''}` : 'Décompte'}
      crumbs={[{ label: 'Décomptes', to: '/projet/decomptes' }, { label: d?.code ?? '…' }]}
      entete={
        d && (
          <>
            <span className="text-body text-muted-foreground">Décompte n° {d.numero ?? '—'} · {formatDate(d.dateDocument)}</span>
            <Link className="text-body underline" to={`/projet/lots/${d.lotId}`}>
              Lot {d.lotCode ?? d.lotDescription ?? ''}
            </Link>
            <span className="text-body text-muted-foreground">{[d.projetCode, d.fournisseurNom].filter(Boolean).join(' · ')}</span>
            {d.dernier && <Badge tone="info">Dernier décompte</Badge>}
          </>
        )
      }
    >
      <EtatFiche etat={etat}>{(x) => <Contenu d={x} />}</EtatFiche>
    </PageShell>
  );
}
