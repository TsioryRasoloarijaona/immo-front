import { useParams } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import { Badge, Card, Field, FieldGrid } from '../../components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { getLot } from '../../lib/apiProjet';
import { formatCurrency, formatDate, formatNumber, formatPercentValue } from '../../lib/format';
import type { LotDetailDto } from '../../types/projet';
import { BarreAvancement, EtatFiche } from './commun';
import { useFiche } from './hooks';
import { OngletBordereau, OngletDecomptes, OngletFactures, OngletReglements } from './OngletsLot';

const TAUX: [string, (l: LotDetailDto) => number | null][] = [
  ['Retenue de garantie', (l) => l.tauxRetenueGarantie],
  ['Avance', (l) => l.tauxAvance],
  ['Compte prorata', (l) => l.tauxCompteProrata],
  ['Assurance DEC', (l) => l.tauxAssuranceDEC],
  ['Assurance TRC', (l) => l.tauxAssuranceTRC],
  ['TVA par défaut', (l) => l.tvaDefaut],
];

const DATES: [string, (l: LotDetailDto) => string | null][] = [
  ['Début', (l) => l.dateDebut],
  ['Fin', (l) => l.dateFin],
  ['Début prévisionnel', (l) => l.dateDebutPrevisionnelle],
  ['Fin prévisionnelle', (l) => l.dateFinPrevisionnelle],
  ["Lancement de l'appel d'offres", (l) => l.dateLancementAppelOffres],
  ['Retrait des dossiers', (l) => l.dateRetraitDossiers],
  ['Remise des offres', (l) => l.dateEcheanceRemiseOffres],
  ['Ouverture des plis', (l) => l.dateOuverturePlis],
  ['Adjudication', (l) => l.dateAdjudication],
  ['Signature du marché', (l) => l.dateSignatureMarche],
  ['Ordre de service', (l) => l.dateOrdreService],
  ['Lancement des travaux', (l) => l.dateLancementTravaux],
];

const oui = (b: boolean) => (b ? 'Oui' : 'Non');

function Resume({ lot }: Readonly<{ lot: LotDetailDto }>) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <Card title="Estimation HT">
        <FieldGrid>
          <Field label="HT" value={formatCurrency(lot.estimationHT)} />
          <Field label="TVA" value={formatCurrency(lot.estimationTVA)} />
          <Field label="TTC" value={formatCurrency(lot.estimationTTC)} />
        </FieldGrid>
      </Card>
      <Card title="Marché">
        <FieldGrid>
          <Field label="HT" value={formatCurrency(lot.montantHT)} />
          <Field label="TVA" value={formatCurrency(lot.montantTVA)} />
          <Field label="TTC" value={formatCurrency(lot.montantTTC)} />
        </FieldGrid>
        <p className="mt-2 text-micro text-muted-foreground">{lot.montantsDepuisBordereau ? 'Montants depuis le bordereau' : 'Montant forfaitaire'}</p>
      </Card>
      <Card title="Décomptes">
        <FieldGrid>
          <Field label="Nombre" value={formatNumber(lot.nbDecomptes)} />
          <Field label="Cumul HT" value={formatCurrency(lot.cumulDecomptesHT)} />
          <Field label="Cumul TTC" value={formatCurrency(lot.cumulDecomptesTTC)} />
          <Field label="Avancement" value={<BarreAvancement pct={lot.avancementPct} />} />
        </FieldGrid>
      </Card>
      <Card title="Facturation">
        <FieldGrid>
          <Field label="Facturé (décomptes)" value={formatCurrency(lot.totalFacture)} />
          <Field label="Réglé" value={formatCurrency(lot.totalRegle)} />
          <Field label="Reste à régler" value={formatCurrency(lot.resteARegler)} />
        </FieldGrid>
      </Card>
    </div>
  );
}

function Contenu({ lot }: Readonly<{ lot: LotDetailDto }>) {
  return (
    <div className="flex flex-col gap-3 p-4 md:px-7">
      <Resume lot={lot} />
      <div className="grid gap-3 md:grid-cols-2">
        <Card title="Taux et options">
          <FieldGrid>
            {TAUX.map(([libelle, valeur]) => (
              <Field key={libelle} label={libelle} value={formatPercentValue(valeur(lot))} />
            ))}
            <Field label="Délai de paiement" value={lot.delaiPaiementJours === null ? null : `${formatNumber(lot.delaiPaiementJours)} j`} />
            <Field label="Garantie" value={lot.garantieMois === null ? null : `${formatNumber(lot.garantieMois)} mois`} />
            <Field label="Restitution de garantie bloquée" value={oui(lot.restitutionGarantieBloquee)} />
            <Field label="Avec décomposition" value={oui(lot.avecDecomposition)} />
          </FieldGrid>
        </Card>
        <Card title="Dates">
          <FieldGrid>
            {DATES.map(([libelle, valeur]) => (
              <Field key={libelle} label={libelle} value={formatDate(valeur(lot))} />
            ))}
          </FieldGrid>
        </Card>
      </div>
      <Tabs defaultValue="decomptes">
        <TabsList>
          <TabsTrigger value="decomptes">Décomptes</TabsTrigger>
          <TabsTrigger value="factures">Factures</TabsTrigger>
          <TabsTrigger value="reglements">Règlements</TabsTrigger>
          <TabsTrigger value="bordereau">Bordereau</TabsTrigger>
        </TabsList>
        <TabsContent value="factures">
          <OngletFactures lotId={lot.id} />
        </TabsContent>
        <TabsContent value="reglements">
          <OngletReglements lotId={lot.id} />
        </TabsContent>
        <TabsContent value="decomptes">
          <OngletDecomptes lotId={lot.id} />
        </TabsContent>
        <TabsContent value="bordereau">
          <OngletBordereau lotId={lot.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function LotDetail() {
  const { id = '' } = useParams();
  const etat = useFiche(() => getLot(id), id);
  const lot = etat.data;
  return (
    <PageShell
      key={id}
      title={lot ? `Lot ${lot.code ?? ''}` : 'Lot'}
      crumbs={[{ label: 'Lots', to: '/projet/lots' }, { label: lot?.code ?? '…' }]}
      entete={
        lot && (
          <>
            <span className="text-body text-muted-foreground">
              {[lot.description, lot.projetCode, lot.fournisseurNom, lot.typeDescription].filter(Boolean).join(' · ')}
            </span>
            {lot.statutDescription && <Badge tone="info">{lot.statutDescription}</Badge>}
            {lot.multiFournisseur && <Badge tone="amber">Multi-fournisseur</Badge>}
            {lot.clos && <Badge tone="neutral">Clos</Badge>}
          </>
        )
      }
    >
      <EtatFiche etat={etat}>{(l) => <Contenu lot={l} />}</EtatFiche>
    </PageShell>
  );
}
