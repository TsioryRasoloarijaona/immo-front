import { Card, Field, FieldGrid } from '../../../components/ui';
import { formatCurrency, formatPercentValue } from '../../../lib/format';
import type { BlocRetenueDto, ColonneRetenueDto, SuiviLotDto } from '../../../types/projet';
import TableauMontants from './TableauMontants';

function BlocRetenue({ titre, b, libelleQuotePart }: Readonly<{ titre: string; b: BlocRetenueDto; libelleQuotePart?: string }>) {
  return (
    <Card title={titre}>
      <FieldGrid>
        <Field label="Taux" value={formatPercentValue(b.taux)} />
        {libelleQuotePart && <Field label={libelleQuotePart} value={formatCurrency(b.quotePart)} />}
        <Field label="Estimation de base" value={formatCurrency(b.estBase)} />
        <Field label="Confidentielle" value={formatCurrency(b.confidentielle)} />
        <Field label="Marché ajusté" value={formatCurrency(b.marcheAjuste)} />
      </FieldGrid>
      <div className="mt-2">
        <TableauMontants
          colonnes={['Avenant', 'Total']}
          lignes={[
            { label: 'Décompté', valeurs: [b.decompte.avenant, b.decompte.total] },
            { label: 'Facturé', valeurs: [b.facture.avenant, b.facture.total] },
          ]}
        />
      </div>
    </Card>
  );
}

const LIGNES: [keyof ColonneRetenueDto, string][] = [
  ['retenueForfaitaire', 'Retenue forfaitaire'],
  ['penaliteCompteProrata', 'Pénalité compte prorata'],
  ['penaliteRg', 'Pénalité RG'],
  ['blocageRg', 'Blocage RG'],
  ['penaliteAvance', 'Pénalité avance'],
  ['retenues', 'Retenues'],
];

export default function OngletRetenues({ suivi }: Readonly<{ suivi: SuiviLotDto }>) {
  const { retenues } = suivi;
  const lignes = LIGNES.map(([cle, label]) => ({ label, valeurs: [retenues.decompte[cle], retenues.facture[cle]] }));
  return (
    <div className="grid gap-3 xl:grid-cols-[2fr_1fr]">
      <div className="flex flex-col gap-3">
        <BlocRetenue titre="Compte prorata" b={retenues.compteProrata} />
        <BlocRetenue titre="Assurance décennale" b={retenues.assuranceDecennale} libelleQuotePart="Cote-part DEC" />
        <BlocRetenue titre="Assurance TRC" b={retenues.assuranceTrc} libelleQuotePart="Cote-part TRC" />
      </div>
      <Card title="Retenues">
        <TableauMontants colonnes={['Décompté', 'Facturé']} lignes={lignes} />
      </Card>
    </div>
  );
}
