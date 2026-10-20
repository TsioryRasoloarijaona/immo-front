import { Link, useParams } from 'react-router-dom';
import { FolderX } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, Card, ErrorState, Field, FieldGrid, LoadingState } from '../../components/ui';
import ActionsDesistement from '../../components/desistement/ActionsDesistement';
import MontantsDesistement from '../../components/desistement/MontantsDesistement';
import { getDesistement } from '../../lib/api';
import { ETATS_DESISTEMENT } from '../../lib/desistements';
import { formatCurrency, formatDate } from '../../lib/format';
import { useApi } from '../../lib/useApi';
import type { DesistementDto } from '../../types';

const CRUMBS = [{ label: 'Ventes' }, { label: 'Désistements', to: '/desistements' }];

function lien(chemin: string, libelle: string | null) {
  return libelle ? <Link to={chemin} className="hover:underline">{libelle}</Link> : null;
}

function Contenu({ d }: Readonly<{ d: DesistementDto }>) {
  return (
    <div className="flex flex-col gap-3 p-4">
      <Card title="Dossier">
        <FieldGrid>
          <Field label="Dossier" value={d.dossierId ? lien(`/dossiers/${d.dossierId}`, d.dossierCode ?? 'Voir le dossier') : null} />
          <Field label="Client" value={d.clientId ? lien(`/clients/${d.clientId}`, d.clientNom ?? 'Voir le client') : d.clientNom} />
          <Field label="Tranche" value={d.trancheLibelle} />
          <Field label="Article" value={d.articleCode} />
        </FieldGrid>
      </Card>
      <Card title="Montants">
        <MontantsDesistement montants={d} />
        {d.etat !== 'BROUILLON' && (
          <FieldGrid>
            <Field label="Reste à rembourser" value={<span className="font-semibold">{formatCurrency(d.resteARembourser)}</span>} />
          </FieldGrid>
        )}
      </Card>
      <Card title="Dates et motif">
        <FieldGrid>
          <Field label="Date de la demande" value={formatDate(d.dateDemande)} />
          <Field label="Date de décision" value={formatDate(d.dateDecision)} />
          <Field label="Date de validation" value={formatDate(d.dateValidation)} />
          <Field label="Date de légalisation" value={formatDate(d.dateLegalisation)} />
          <Field label="Motif" value={d.motifLibelle} />
          <Field label="Observations" value={d.observations} />
        </FieldGrid>
      </Card>
      <Card title="Paiement">
        <FieldGrid>
          <Field label="Type de règlement" value={d.typeReglementLibelle} />
          <Field label="Référence" value={d.reference} />
          <Field label="Banque" value={d.banqueNom} />
          <Field label="Contact" value={d.contactNom} />
        </FieldGrid>
      </Card>
    </div>
  );
}

export default function DesistementFiche() {
  const { id = '' } = useParams();
  const { data: d, error, refetch } = useApi(() => getDesistement(id), [id], 'desistement');
  const etat = d ? ETATS_DESISTEMENT[d.etat] : null;

  let corps = <LoadingState />;
  if (error) corps = <ErrorState message={error} />;
  else if (d) corps = <Contenu d={d} />;

  return (
    <PageShell
      title={d?.code ? `Désistement ${d.code}` : 'Désistement'}
      crumbs={[...CRUMBS, { label: d?.code ?? 'Désistement' }]}
      icon={<FolderX />}
      accent="var(--sec-dossier)"
      accentBg="var(--sec-dossier-bg)"
      entete={etat && <Badge tone={etat.tone}>{etat.libelle}</Badge>}
      actions={d && <ActionsDesistement desistement={d} onChanged={() => void refetch()} />}
    >
      {corps}
    </PageShell>
  );
}
