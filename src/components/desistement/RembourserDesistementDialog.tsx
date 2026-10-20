import { useState } from 'react';
import { ChampDate, ChampListe, ChampTexte } from '../dossier/edition/ChampsSaisie';
import FormulaireModal from './FormulaireModal';
import { rembourserDesistement } from '../../lib/api';
import { formatCurrency, toApiDateTime, todayISO } from '../../lib/format';
import { referentielItems, useBanques, useTypesReglement } from '../../lib/referentiels';
import { montantSaisi } from '../../lib/repartitionReglement';
import type { DesistementDto } from '../../types';

/** Décaissement au client : plafonné au reste à rembourser (le serveur le refuse au-delà). */
export default function RembourserDesistementDialog({
  desistement: d,
  onClose,
  onDone,
}: Readonly<{ desistement: DesistementDto; onClose: () => void; onDone: () => void }>) {
  const types = useTypesReglement();
  const banques = useBanques();
  const [montant, setMontant] = useState(String(d.resteARembourser));
  const [dateEcheance, setDateEcheance] = useState(todayISO());
  const [typeId, setTypeId] = useState('');
  const [banqueId, setBanqueId] = useState('');
  const [reference, setReference] = useState('');
  const type = types.data.find((t) => t.id === typeId);
  const valeur = montantSaisi(montant);
  const valide =
    valeur !== null &&
    valeur > 0 &&
    valeur <= d.resteARembourser &&
    dateEcheance !== '' &&
    typeId !== '' &&
    (!type?.banqueObligatoire || banqueId !== '') &&
    (!type?.referenceObligatoire || reference.trim() !== '');

  return (
    <FormulaireModal
      title="Enregistrer le remboursement"
      libelle="Enregistrer"
      valide={valide}
      onClose={onClose}
      onSubmit={async () => {
        await rembourserDesistement(d.id, {
          montant: valeur ?? 0,
          dateEcheance: toApiDateTime(dateEcheance) ?? dateEcheance,
          typeId,
          banqueId: banqueId || undefined,
          reference: reference.trim() || undefined,
        });
        onDone();
      }}
    >
      <p className="text-body text-muted-foreground">
        Reste à rembourser : <span className="font-semibold text-foreground">{formatCurrency(d.resteARembourser)}</span>
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <ChampTexte label="Montant" value={montant} maxLength={20} onChange={setMontant} />
        <ChampDate label="Date d'échéance" value={dateEcheance} onChange={setDateEcheance} />
        <ChampListe
          label="Type de règlement"
          items={referentielItems(types.data)}
          value={typeId}
          onChange={setTypeId}
          chargement={types.loading}
        />
        <ChampListe
          label={type?.banqueObligatoire ? 'Banque (obligatoire)' : 'Banque'}
          items={referentielItems(banques.data)}
          value={banqueId}
          onChange={setBanqueId}
          chargement={banques.loading}
        />
        <ChampTexte
          label={type?.referenceObligatoire ? 'Référence (obligatoire)' : 'Référence'}
          value={reference}
          maxLength={100}
          onChange={setReference}
        />
      </div>
    </FormulaireModal>
  );
}
