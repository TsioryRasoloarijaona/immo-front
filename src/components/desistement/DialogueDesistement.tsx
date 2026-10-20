import { useState } from 'react';
import Modal from '../Modal';
import { ErrorState, LoadingState } from '../ui';
import { ChampDate, ChampListe, ChampTexte } from '../dossier/edition/ChampsSaisie';
import FormulaireModal from './FormulaireModal';
import MontantsDesistement from './MontantsDesistement';
import { creerDesistement, simulerDesistement } from '../../lib/api';
import { toApiDateTime, todayISO } from '../../lib/format';
import { referentielItems, useMotifsDesistement } from '../../lib/referentiels';
import { useApi } from '../../lib/useApi';
import type { SimulationDesistementDto } from '../../types';

function FormulaireCreation({
  dossierId,
  simulation,
  onClose,
  onCree,
}: Readonly<{
  dossierId: string;
  simulation: SimulationDesistementDto;
  onClose: () => void;
  onCree: (id: string) => void;
}>) {
  const motifs = useMotifsDesistement();
  const [dateDemande, setDateDemande] = useState(todayISO());
  const [motifId, setMotifId] = useState('');
  const [observations, setObservations] = useState('');

  return (
    <FormulaireModal
      title="Désistement du dossier"
      libelle="Créer le désistement"
      valide={dateDemande !== ''}
      onClose={onClose}
      onSubmit={async () => {
        const cree = await creerDesistement(dossierId, {
          dateDemande: toApiDateTime(dateDemande) ?? dateDemande,
          motifId: motifId || undefined,
          observations: observations.trim() || undefined,
        });
        onCree(cree.id);
      }}
    >
      <p className="text-body text-muted-foreground">
        Montants calculés à ce jour. Ils sont figés à la validation du désistement.
      </p>
      <MontantsDesistement montants={simulation} />
      <div className="grid gap-3 sm:grid-cols-2">
        <ChampDate label="Date de la demande" value={dateDemande} onChange={setDateDemande} />
        <ChampListe
          label="Motif"
          items={referentielItems(motifs.data)}
          value={motifId}
          onChange={setMotifId}
          chargement={motifs.loading}
        />
        <ChampTexte label="Observations" value={observations} maxLength={1000} multiligne onChange={setObservations} />
      </div>
    </FormulaireModal>
  );
}

/** Création d'un désistement depuis la fiche dossier ; un statut non éligible (409) s'affiche à la place du formulaire. */
export default function DialogueDesistement({
  dossierId,
  onClose,
  onCree,
}: Readonly<{ dossierId: string; onClose: () => void; onCree: (id: string) => void }>) {
  const simulation = useApi(() => simulerDesistement(dossierId), [dossierId]);

  if (simulation.data && !simulation.error) {
    return <FormulaireCreation dossierId={dossierId} simulation={simulation.data} onClose={onClose} onCree={onCree} />;
  }
  return (
    <Modal title="Désistement du dossier" onClose={onClose}>
      {simulation.error ? <ErrorState message={simulation.error} /> : <LoadingState />}
    </Modal>
  );
}
