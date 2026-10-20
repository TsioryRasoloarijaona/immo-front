import { useState } from 'react';
import { ChampDate, ChampListe, ChampTexte } from '../dossier/edition/ChampsSaisie';
import FormulaireModal from './FormulaireModal';
import { modifierDesistement } from '../../lib/api';
import { jourSaisi } from '../../lib/editionDossier';
import { toApiDateTime } from '../../lib/format';
import { referentielItems, useBanques, useMotifsDesistement, useTypesReglement } from '../../lib/referentiels';
import { montantSaisi } from '../../lib/repartitionReglement';
import type { DesistementDto } from '../../types';

/** Remise en pourcentage à l'écran, en fraction sur le fil (arrondie à 6 décimales). */
const versPourcent = (fraction: number | null) => String(Math.round((fraction ?? 0) * 1e6) / 1e4);
const versFraction = (pourcent: number) => Math.round(pourcent * 1e4) / 1e6;

/** Champs ouverts à la modification ; la remise ne l'est que sur un brouillon (409 sinon). */
export default function ModifierDesistementDialog({
  desistement: d,
  onClose,
  onDone,
}: Readonly<{ desistement: DesistementDto; onClose: () => void; onDone: () => void }>) {
  const motifs = useMotifsDesistement();
  const types = useTypesReglement();
  const banques = useBanques();
  const brouillon = d.etat === 'BROUILLON';
  const [dateDemande, setDateDemande] = useState(jourSaisi(d.dateDemande));
  const [dateDecision, setDateDecision] = useState(jourSaisi(d.dateDecision));
  const [dateLegalisation, setDateLegalisation] = useState(jourSaisi(d.dateLegalisation));
  const [motifId, setMotifId] = useState(d.motifId ?? '');
  const [observations, setObservations] = useState(d.observations ?? '');
  const [remise, setRemise] = useState(versPourcent(d.remise));
  const [typeId, setTypeId] = useState(d.typeReglementId ?? '');
  const [banqueId, setBanqueId] = useState(d.banqueId ?? '');
  const [reference, setReference] = useState(d.reference ?? '');
  const pourcent = montantSaisi(remise);

  return (
    <FormulaireModal
      title="Modifier le désistement"
      libelle="Enregistrer"
      valide={!brouillon || (pourcent !== null && pourcent >= 0 && pourcent <= 100)}
      onClose={onClose}
      onSubmit={async () => {
        await modifierDesistement(d.id, {
          dateDemande: toApiDateTime(dateDemande),
          dateDecision: toApiDateTime(dateDecision),
          dateLegalisation: toApiDateTime(dateLegalisation),
          motifId: motifId || undefined,
          observations,
          remise: brouillon && pourcent !== null ? versFraction(pourcent) : undefined,
          typeReglementId: typeId || undefined,
          banqueId: banqueId || undefined,
          reference: reference || undefined,
        });
        onDone();
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <ChampDate label="Date de la demande" value={dateDemande} onChange={setDateDemande} />
        <ChampDate label="Date de décision" value={dateDecision} onChange={setDateDecision} />
        <ChampDate label="Date de légalisation" value={dateLegalisation} onChange={setDateLegalisation} />
        <ChampListe label="Motif" items={referentielItems(motifs.data)} value={motifId} onChange={setMotifId} chargement={motifs.loading} />
        {brouillon && <ChampTexte label="Remise sur la pénalité (%)" value={remise} maxLength={8} onChange={setRemise} />}
        <ChampListe
          label="Type de règlement"
          items={referentielItems(types.data)}
          value={typeId}
          onChange={setTypeId}
          chargement={types.loading}
        />
        <ChampListe label="Banque" items={referentielItems(banques.data)} value={banqueId} onChange={setBanqueId} chargement={banques.loading} />
        <ChampTexte label="Référence" value={reference} maxLength={100} onChange={setReference} />
        <ChampTexte label="Observations" value={observations} maxLength={1000} multiligne onChange={setObservations} />
      </div>
    </FormulaireModal>
  );
}
