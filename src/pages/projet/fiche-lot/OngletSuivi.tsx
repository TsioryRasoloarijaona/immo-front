import { Card, Field, FieldGrid } from '../../../components/ui';
import { formatCurrency, formatPercentValue } from '../../../lib/format';
import { cn } from '../../../lib/utils';
import type { BlocAvanceDto, ColonneSuiviDto, RetenueGarantieDto, SuiviLotDto } from '../../../types/projet';
import TableauMontants from './TableauMontants';

const LIGNES: [keyof ColonneSuiviDto, string][] = [
  ['montantHT', 'Montant HT'],
  ['tva', 'TVA'],
  ['montantTTC', 'Montant TTC'],
  ['approTTC', 'Approvisionnement TTC'],
  ['depassementsTTC', 'Dépassements TTC'],
  ['travauxSuppTTC', 'Travaux supplémentaires TTC'],
  ['fluctuationsTTC', 'Fluctuations TTC'],
  ['totalTTC', 'Total TTC'],
  ['avenantsTTC', 'Avenants TTC'],
  ['coutTTC', 'Coût TTC'],
  ['retenues', 'Retenues'],
  ['remboursement', 'Remboursement'],
  ['regulation', 'Régulation'],
];

/** Un « reste à amortir » négatif s'affiche tel quel, en rouge. */
function Montant({ v }: Readonly<{ v: number | null }>) {
  return <span className={cn(v !== null && v < 0 && 'text-destructive')}>{formatCurrency(v)}</span>;
}

const montant = (label: string, v: number | null) => <Field key={label} label={label} value={<Montant v={v} />} />;

function AvanceMarche({ b }: Readonly<{ b: BlocAvanceDto }>) {
  return (
    <Card title="Avance sur marché">
      <FieldGrid>
        <Field label="Taux" value={formatPercentValue(b.taux)} />
        {montant('Estimation de base', b.estBase)}
        {montant('Confidentielle', b.confidentielle)}
        {montant('Marché', b.marche)}
        {montant('Validée', b.validee)}
        {montant('Réglée', b.reglee)}
        {montant('Amortie', b.amortie)}
        {montant('Reste à amortir', b.resteAAmortir)}
      </FieldGrid>
    </Card>
  );
}

function AvanceDecompte({ b }: Readonly<{ b: BlocAvanceDto }>) {
  return (
    <Card title="Avance sur décompte">
      <FieldGrid>
        {montant('Validée', b.validee)}
        {montant('Réglée', b.reglee)}
        {montant('Amortie', b.amortie)}
        {montant('Reste à amortir', b.resteAAmortir)}
      </FieldGrid>
    </Card>
  );
}

function RetenueGarantie({ r }: Readonly<{ r: RetenueGarantieDto }>) {
  return (
    <Card title="Retenue de garantie">
      <FieldGrid>
        <Field label="Taux" value={formatPercentValue(r.taux)} />
        {montant('Estimation de base', r.estBase)}
        {montant('Confidentielle', r.confidentielle)}
        {montant('Marché ajusté', r.marcheAjuste)}
        {montant('Avenants', r.avenants)}
        {montant('Factures', r.factures)}
        {montant('Retenue', r.retenue)}
        {montant('Validée', r.validee)}
        {montant('Restituée', r.restituee)}
        {montant('Reste à restituer', r.resteARestituer)}
        <Field
          label="Gestionnaire du compte prorata"
          value={<input type="checkbox" checked={r.gestionnaireCompteProrata} disabled readOnly aria-label="Gestionnaire du compte prorata" />}
        />
        {montant('À rembourser', r.aRembourser)}
        {montant('Remboursement', r.remboursement)}
      </FieldGrid>
    </Card>
  );
}

export default function OngletSuivi({ suivi }: Readonly<{ suivi: SuiviLotDto }>) {
  const { decomptes, factures, avoirs } = suivi.colonnes;
  const lignes = LIGNES.map(([cle, label]) => ({ label, valeurs: [decomptes[cle], factures[cle], avoirs[cle]] }));
  return (
    <div className="flex flex-col gap-3">
      <Card title="Suivi des décomptes, factures et avoirs">
        <TableauMontants colonnes={['Décomptes', 'Factures', 'Avoirs']} lignes={lignes} />
      </Card>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <AvanceMarche b={suivi.avanceMarche} />
        <AvanceDecompte b={suivi.avanceDecompte} />
        <RetenueGarantie r={suivi.retenueGarantie} />
      </div>
    </div>
  );
}
