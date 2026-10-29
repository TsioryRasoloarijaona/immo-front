import type { ReactNode } from 'react';
import { Badge, ErrorState, Field, FieldGrid, LoadingState } from '../../ui';
import ChampFiche, { BandeFiche } from '../../fiche/ChampFiche';
import ClasseurEntete from '../../fiche/ClasseurEntete';
import FenetreFiche from '../../fiche/FenetreFiche';
import RubanFiche from '../../fiche/RubanFiche';
import ActionsDesistement from '../ActionsDesistement';
import MontantsDesistement from '../MontantsDesistement';
import { getDesistement } from '../../../lib/api';
import { ETATS_DESISTEMENT } from '../../../lib/desistements';
import { formatCurrency, formatDate } from '../../../lib/format';
import type { VoisinsFiche } from '../../../lib/fenetreFiche';
import { refetchAllApis, useApi } from '../../../lib/useApi';
import type { DesistementDto } from '../../../types';

function CorpsDesistement({ d, onChanged }: Readonly<{ d: DesistementDto; onChanged: () => void }>) {
  return (
    <>
      <RubanFiche
        enregistrer={{ disabled: true, onClick: () => undefined, aide: 'Les champs se modifient par les boutons du ruban.' }}
        propres={[]}
        enSuite={<ActionsDesistement desistement={d} onChanged={onChanged} />}
      />
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] content-start gap-4 overflow-auto px-4 py-3">
        <BandeFiche>
          <ChampFiche libelle="N° demande" valeur={d.code} />
          <ChampFiche libelle="Date demande" valeur={formatDate(d.dateDemande)} />
          <ChampFiche libelle="N° dossier" valeur={d.dossierId ? (d.dossierCode ?? 'Voir le dossier') : null} lien={d.dossierId ? `/dossiers/${d.dossierId}` : undefined} />
          <ChampFiche libelle="Client" valeur={d.clientId ? (d.clientNom ?? 'Voir le client') : d.clientNom} lien={d.clientId ? `/clients/${d.clientId}` : undefined} />
          <ChampFiche libelle="Tranche" valeur={d.trancheLibelle} />
          <ChampFiche libelle="Article" valeur={d.articleCode} />
          <ChampFiche libelle="Motif" valeur={d.motifLibelle} />
          <ChampFiche libelle="Date décision" valeur={formatDate(d.dateDecision)} />
          <ChampFiche libelle="Date validation" valeur={formatDate(d.dateValidation)} />
          <ChampFiche libelle="Date légalisation" valeur={formatDate(d.dateLegalisation)} />
          <ChampFiche libelle="Observations" valeur={d.observations} large />
        </BandeFiche>
        <ClasseurEntete
          type="desistement"
          onglets={[
            {
              id: 'montants',
              titre: 'Montants',
              contenu: (
                <div className="flex flex-col gap-2">
                  <MontantsDesistement montants={d} />
                  {d.etat !== 'BROUILLON' && (
                    <FieldGrid>
                      <Field label="Reste à rembourser" value={<span className="font-semibold">{formatCurrency(d.resteARembourser)}</span>} />
                    </FieldGrid>
                  )}
                </div>
              ),
            },
            {
              id: 'paiement',
              titre: 'Paiement',
              contenu: (
                <FieldGrid>
                  <Field label="Type de règlement" value={d.typeReglementLibelle} />
                  <Field label="Référence" value={d.reference} />
                  <Field label="Banque" value={d.banqueNom} />
                  <Field label="Contact" value={d.contactNom} />
                </FieldGrid>
              ),
            },
          ]}
        />
      </div>
    </>
  );
}

/** Fiche du désistement en fenêtre flottante, au-dessus de la liste. */
export default function FicheDesistementFenetre({
  id,
  voisins,
  onFermer,
}: Readonly<{ id: string; voisins?: VoisinsFiche; onFermer: () => void }>) {
  const { data: d, error } = useApi(() => getDesistement(id), [id], 'desistement');
  const etat = d ? ETATS_DESISTEMENT[d.etat] : null;

  let corps: ReactNode = <LoadingState />;
  if (error) corps = <ErrorState message={error} />;
  else if (d) corps = <CorpsDesistement d={d} onChanged={refetchAllApis} />;

  return (
    <FenetreFiche
      nature="Désistement"
      titre={d?.code ?? 'Désistement'}
      badge={etat && <Badge tone={etat.tone}>{etat.libelle}</Badge>}
      voisins={voisins}
      onFermer={onFermer}
    >
      {corps}
    </FenetreFiche>
  );
}
