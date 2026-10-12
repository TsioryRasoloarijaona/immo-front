import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Calculator, Coins, FileStack, Receipt } from 'lucide-react';
import PageShell from '../../components/PageShell';
import DataGrid from '../../components/DataGrid';
import { OngletsLigne } from '../../components/FicheShell';
import { Badge, Card, EmptyState, ErrorState, Field, FieldGrid, LoadingState, StatCard, TogglePill } from '../../components/ui';
import { Tabs, TabsContent } from '../../components/ui/tabs';
import { getLotChantier, listDecomptesLot, nullSiIntrouvable } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { formatCurrency, formatDate, formatNumber, formatPercentValue, pluriel } from '../../lib/format';
import type { LotDetailDto } from '../../types';
import NotFound from '../NotFound';
import BordereauLot from './BordereauLot';
import { BandeCartes, BarreAvancement, SqueletteGrille } from './chantierUi';
import { COLONNES_DECOMPTES_LOT } from './colonnesDecomptes';

type OngletLot = 'decomptes' | 'bordereau';

export default function LotDetail() {
  const { id = '' } = useParams();
  return <FicheLot key={id} id={id} />;
}

function FicheLot({ id }: Readonly<{ id: string }>) {
  const { data: lot, loading, error } = useApi(() => nullSiIntrouvable(getLotChantier(id)), [id]);
  const [onglet, setOnglet] = useState<OngletLot>('decomptes');

  if (loading && !lot) return <PageShell title="Lot"><LoadingState /></PageShell>;
  if (error) return <PageShell title="Lot"><ErrorState message={error} /></PageShell>;
  if (!lot) return <NotFound />;

  const crumbs = [
    { label: 'Projets', to: '/chantier/projets' },
    { label: lot.projetCode ?? 'Projet', to: lot.projetId ? `/chantier/projets/${lot.projetId}` : undefined },
    { label: lot.code ?? '' },
  ];

  return (
    <PageShell
      title={lot.description ?? lot.code ?? 'Lot'}
      crumbs={crumbs}
      icon={<FileStack />}
      accent="var(--sec-chantier-projet)"
      accentBg="var(--sec-chantier-projet-bg)"
    >
      <div className="flex flex-col gap-3 pt-1">
        <EnteteLot lot={lot} />
        <CartesLot lot={lot} />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <TauxEtOptions lot={lot} />
          <DatesLot lot={lot} />
        </div>
        <Card padded={false}>
          <Tabs value={onglet} onValueChange={(v) => setOnglet(v as OngletLot)} className="flex flex-col gap-2 p-3">
            <OngletsLigne
              onglets={[
                { id: 'decomptes', libelle: 'Décomptes', compteur: lot.nbDecomptes },
                { id: 'bordereau', libelle: 'Bordereau', compteur: lot.montantsDepuisBordereau ? undefined : 0 },
              ]}
            />
            <TabsContent value="decomptes">
              <DecomptesDuLot lotId={lot.id} />
            </TabsContent>
            <TabsContent value="bordereau">
              <BordereauLot lotId={lot.id} />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </PageShell>
  );
}

function EnteteLot({ lot }: Readonly<{ lot: LotDetailDto }>) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-title font-semibold tracking-tight text-foreground">{lot.description ?? '—'}</h2>
        <span className="font-mono text-micro text-muted-foreground">{lot.code}</span>
        {lot.statutDescription && <Badge tone="neutral">{lot.statutDescription}</Badge>}
        {lot.multiFournisseur && <Badge tone="info">Multi-fournisseur</Badge>}
        {lot.clos && <Badge tone="success">Clos</Badge>}
      </div>
      <div className="flex flex-wrap gap-x-4 text-body text-muted-foreground">
        <span>
          Projet :{' '}
          {lot.projetId ? (
            <Link to={`/chantier/projets/${lot.projetId}`} className="text-foreground hover:text-primary">
              {lot.projetCode} {lot.projetDescription}
            </Link>
          ) : (
            '—'
          )}
        </span>
        <span>Fournisseur : {lot.fournisseurNom ?? '—'}</span>
        <span>Type : {lot.typeDescription ?? '—'}</span>
        <span>Nature : {lot.entiteDescription ?? '—'}</span>
      </div>
    </div>
  );
}

function CartesLot({ lot }: Readonly<{ lot: LotDetailDto }>) {
  const origine = lot.montantsDepuisBordereau ? 'depuis le bordereau' : 'montant forfaitaire';
  return (
    <BandeCartes>
      <StatCard
        label="Estimation HT"
        value={formatCurrency(lot.estimationHT)}
        sub={lot.estimationDepuisBordereau ? 'bordereau estimatif' : 'montant forfaitaire'}
        icon={<Calculator />}
      />
      <StatCard
        label="Marché TTC"
        value={formatCurrency(lot.montantTTC)}
        sub={`HT ${formatCurrency(lot.montantHT)} · TVA ${formatCurrency(lot.montantTVA)} · ${origine}`}
        icon={<FileStack />}
      />
      <Card title="Décomptes">
        <div className="flex flex-col gap-1 text-body">
          <span className="text-foreground">
            {formatCurrency(lot.cumulDecomptesTTC)} <span className="text-muted-foreground">TTC · HT {formatCurrency(lot.cumulDecomptesHT)}</span>
          </span>
          <span className="text-muted-foreground">
            Trav. suppl. {formatCurrency(lot.cumulTravauxSupplementaires)} · RG {formatCurrency(lot.cumulRetenueGarantie)}
          </span>
          <span className="text-muted-foreground">Net à payer cumulé {formatCurrency(lot.cumulNetAPayer)}</span>
          <BarreAvancement pct={lot.avancementPct} />
        </div>
      </Card>
      <StatCard
        label="Reste à régler"
        value={formatCurrency(lot.resteARegler)}
        sub={`Facturé ${formatCurrency(lot.totalFacture)} · Réglé ${formatCurrency(lot.totalRegle)}`}
        icon={lot.resteARegler > 0 ? <Coins /> : <Receipt />}
        tone={lot.resteARegler > 0 ? 'amber' : 'success'}
      />
    </BandeCartes>
  );
}

function TauxEtOptions({ lot }: Readonly<{ lot: LotDetailDto }>) {
  return (
    <Card title="Taux et options">
      <FieldGrid>
        <Field label="Retenue de garantie" value={formatPercentValue(lot.tauxRetenueGarantie)} />
        <Field label="RG théorique" value={formatCurrency(lot.retenueGarantieTheorique)} />
        <Field label="Avance" value={formatPercentValue(lot.tauxAvance)} />
        <Field label="Avance théorique" value={formatCurrency(lot.avanceTheorique)} />
        <Field label="Compte prorata" value={formatPercentValue(lot.tauxCompteProrata)} />
        <Field label="Assurance DEC" value={formatPercentValue(lot.tauxAssuranceDEC)} />
        <Field label="Assurance TRC" value={formatPercentValue(lot.tauxAssuranceTRC)} />
        <Field label="TVA par défaut" value={formatPercentValue(lot.tvaDefaut)} />
        <Field label="Délai de paiement" value={lot.delaiPaiementJours ? pluriel(lot.delaiPaiementJours, 'jour') : null} />
        <Field label="Garantie" value={lot.garantieMois ? `${formatNumber(lot.garantieMois)} mois` : null} />
        <Field label="Décomposition" value={<TogglePill on={lot.avecDecomposition} onLabel="Oui" offLabel="Non" />} />
        <Field label="Restitution RG bloquée" value={<TogglePill on={lot.restitutionGarantieBloquee} onLabel="Oui" offLabel="Non" />} />
        <Field label="Montant forfaitaire TTC" value={formatCurrency(lot.montantForfaitaireTTC)} />
        <Field label="Catégorie" value={lot.categorieDescription} />
      </FieldGrid>
    </Card>
  );
}

type CleTexte = { [K in keyof LotDetailDto]: LotDetailDto[K] extends string | null ? K : never }[keyof LotDetailDto];

const DATES_LOT: { cle: CleTexte; libelle: string }[] = [
  { cle: 'dateLancementAppelOffres', libelle: "Lancement de l'appel d'offres" },
  { cle: 'dateRetraitDossiers', libelle: 'Retrait du dossier de consultation' },
  { cle: 'dateRemiseOffres', libelle: 'Échéance de remise des offres' },
  { cle: 'dateReportAppelOffres', libelle: "Report de l'appel d'offres" },
  { cle: 'dateOuverturePlis', libelle: 'Ouverture des plis' },
  { cle: 'dateReportDepouillement', libelle: 'Report du dépouillement' },
  { cle: 'dateAdjudication', libelle: 'Adjudication' },
  { cle: 'dateSignatureMarche', libelle: 'Signature du marché' },
  { cle: 'dateOrdreService', libelle: 'Ordre de service' },
  { cle: 'dateLancementTravaux', libelle: 'Lancement des travaux' },
  { cle: 'dateAchevementTravaux', libelle: 'Achèvement des travaux' },
  { cle: 'dateRecolement', libelle: 'Récolement' },
  { cle: 'dateAnnulation', libelle: 'Annulation' },
];

function DatesLot({ lot }: Readonly<{ lot: LotDetailDto }>) {
  return (
    <Card title="Dates">
      <div className="grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2">
        <Field label="Début (contractuel)" value={formatDate(lot.dateDebut)} />
        <Field label="Fin (contractuelle)" value={formatDate(lot.dateFin)} />
        <Field label="Délai contractuel" value={lot.delaiJours ? pluriel(lot.delaiJours, 'jour') : null} />
        <Field label="Début prévisionnel" value={formatDate(lot.dateDebutPrevisionnelle)} />
        <Field label="Fin prévisionnelle" value={formatDate(lot.dateFinPrevisionnelle)} />
        {DATES_LOT.map((d) => (
          <Field key={d.cle} label={d.libelle} value={formatDate(lot[d.cle])} />
        ))}
        {lot.motifAnnulation && <Field label="Motif d'annulation" value={lot.motifAnnulation} />}
      </div>
    </Card>
  );
}

function DecomptesDuLot({ lotId }: Readonly<{ lotId: string }>) {
  const navigate = useNavigate();
  const { data, loading, error } = useApi(() => listDecomptesLot(lotId), [lotId]);

  if (loading && !data) return <SqueletteGrille />;
  if (error) return <ErrorState message={error} />;
  if (!data || data.length === 0) return <EmptyState title="Aucun décompte" message="Aucun décompte n'a été saisi sur ce lot." />;
  return (
    <div className="min-w-0 overflow-auto rounded-lg border border-border">
      <DataGrid
        cleOrdre="chantier-decomptes-lot"
        rows={data}
        colonnes={COLONNES_DECOMPTES_LOT}
        onOuvrir={(id) => void navigate(`/chantier/decomptes/${id}`)}
        libelleLigne={(r) => `Ouvrir le décompte ${r.code ?? r.id}`}
      />
    </div>
  );
}
