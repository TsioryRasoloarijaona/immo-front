import { Card, Field, FieldGrid } from '../../../components/ui';
import { formatCurrency, formatNumber } from '../../../lib/format';
import type { CleNombre, PropsOnglet } from '../../../lib/saisieLot';
import type { ColonneCoutDto, GeneralLotDto, LotDetailDto, TrioDto } from '../../../types/projet';
import { BarreAvancement } from '../commun';
import { ChampDate, ChampNombre } from './champsLot';
import TableauMontants from './TableauMontants';

const TAUX: [CleNombre, string][] = [
  ['tauxRetenueGarantiePct', 'Retenue de garantie (%)'],
  ['tauxAvancePct', 'Avance (%)'],
  ['tauxCompteProrataPct', 'Compte prorata (%)'],
  ['tauxAssuranceDECPct', 'Assurance DEC (%)'],
  ['tauxAssuranceTRCPct', 'Assurance TRC (%)'],
  ['tvaDefautPct', 'TVA par défaut (%)'],
];

const TRIO_COLONNES = ['HT', 'TVA', 'TTC'];
const trio = (t: TrioDto) => [t.ht, t.tva, t.ttc];

const COUTS: [keyof ColonneCoutDto, string][] = [
  ['bordereau', 'Bordereau'],
  ['approvisionnement', 'Approvisionnement'],
  ['depassements', 'Dépassements'],
  ['travauxSupplementaires', 'Travaux supplémentaires'],
  ['fluctuations', 'Fluctuations'],
  ['avenants', 'Avenants'],
  ['total', 'Coût total'],
];

const SOLDES: [keyof ColonneCoutDto, string][] = [
  ['retenueNonRemboursable', 'Retenue non remboursable'],
  ['remboursement', 'Remboursement'],
  ['regulation', 'Régulation'],
  ['netAPayer', 'Net à payer'],
  ['regle', 'Réglé'],
  ['reste', 'Reste'],
];

/** Montants calculés par le serveur, en lecture seule. */
function MontantsGeneral({ general }: Readonly<{ general: GeneralLotDto }>) {
  const { coutPrevisionnel: prev, coutReel: reel } = general;
  const marche: [string, TrioDto][] = [
    ['Marché', general.marche],
    ['Estimation de base', general.estimationBase],
    ['Estimation confidentielle', general.estimationConfidentielle],
    ['Modification BDPF', general.modificationBdpf],
    ['Marché ajusté', general.marcheAjuste],
  ];
  const couts = COUTS.map(([cle, label]) => ({ label, valeurs: [...trio(prev[cle] as TrioDto), ...trio(reel[cle] as TrioDto)] }));
  const soldes = SOLDES.map(([cle, label]) => ({ label, valeurs: [prev[cle] as number | null, reel[cle] as number | null] }));
  return (
    <div className="grid gap-3 xl:grid-cols-2">
      <Card title="Marché et estimations">
        <TableauMontants colonnes={TRIO_COLONNES} lignes={marche.map(([label, t]) => ({ label, valeurs: trio(t) }))} />
      </Card>
      <Card title="Coût prévisionnel et coût réel">
        <TableauMontants colonnes={['Prév. HT', 'Prév. TVA', 'Prév. TTC', 'Réel HT', 'Réel TVA', 'Réel TTC']} lignes={couts} />
        <div className="mt-3">
          <TableauMontants colonnes={['Prévisionnel', 'Réel']} lignes={soldes} />
        </div>
      </Card>
    </div>
  );
}

/** Saisie : taux, assurances, délai, estimation manuelle ; montants calculés en lecture. */
export default function OngletGeneral({ lot, champs, maj, lectureSeule }: Readonly<PropsOnglet & { lot: LotDetailDto }>) {
  const nombre = (cle: CleNombre, label: string) => (
    <ChampNombre key={cle} label={label} valeur={champs[cle]} disabled={lectureSeule} onChange={(v) => maj(cle, v)} />
  );
  return (
    <div className="flex flex-col gap-3">
      {lot.general && <MontantsGeneral general={lot.general} />}
      <div className="grid gap-3 md:grid-cols-2">
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
