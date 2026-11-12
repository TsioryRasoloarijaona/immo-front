import { Card, Field, FieldGrid } from '../../../components/ui';
import { formatCurrency, formatNumber } from '../../../lib/format';
import type { CleNombre, PropsOnglet } from '../../../lib/saisieLot';
import type { LotDetailDto } from '../../../types/projet';
import { BarreAvancement } from '../commun';
import { ChampDate, ChampNombre } from './champsLot';

const TAUX: [CleNombre, string][] = [
  ['tauxRetenueGarantiePct', 'Retenue de garantie (%)'],
  ['tauxAvancePct', 'Avance (%)'],
  ['tauxCompteProrataPct', 'Compte prorata (%)'],
  ['tauxAssuranceDECPct', 'Assurance DEC (%)'],
  ['tauxAssuranceTRCPct', 'Assurance TRC (%)'],
  ['tvaDefautPct', 'TVA par défaut (%)'],
];

/** Saisie : taux, assurances, délai, estimation manuelle ; les montants calculés restent en lecture (suite au lot suivant). */
export default function OngletGeneral({ lot, champs, maj, lectureSeule }: Readonly<PropsOnglet & { lot: LotDetailDto }>) {
  const nombre = (cle: CleNombre, label: string) => (
    <ChampNombre key={cle} label={label} valeur={champs[cle]} disabled={lectureSeule} onChange={(v) => maj(cle, v)} />
  );
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Estimation">
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
      <div className="grid gap-3 md:grid-cols-2">
        <Card title="Taux et assurances">
          <FieldGrid>
            {TAUX.map(([cle, label]) => nombre(cle, label))}
            {nombre('montantAssuranceDEC', 'Montant assurance DEC')}
            {nombre('montantAssuranceTRC', 'Montant assurance TRC')}
            {nombre('delaiPaiementJours', 'Délai de paiement (jours)')}
          </FieldGrid>
        </Card>
        <Card title="Estimation manuelle">
          <FieldGrid>
            {nombre('montantForfaitaireHT', 'Montant forfaitaire HT')}
            {nombre('montantForfaitaireTTC', 'Montant forfaitaire TTC')}
            <ChampDate label="Début de base" valeur={champs.dateDebutBase} disabled={lectureSeule} onChange={(v) => maj('dateDebutBase', v)} />
            {nombre('delaiBaseJours', 'Durée de base (jours)')}
            <ChampDate label="Fin de base" valeur={champs.dateFinBase} disabled={lectureSeule} onChange={(v) => maj('dateFinBase', v)} />
          </FieldGrid>
        </Card>
      </div>
    </div>
  );
}
