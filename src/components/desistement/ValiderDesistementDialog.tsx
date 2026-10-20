import { useState } from 'react';
import { ChampDate } from '../dossier/edition/ChampsSaisie';
import FormulaireModal from './FormulaireModal';
import { validerDesistement } from '../../lib/api';
import { legalisationRequise } from '../../lib/desistements';
import { jourSaisi } from '../../lib/editionDossier';
import { formatCurrency, toApiDateTime, todayISO } from '../../lib/format';
import type { DesistementDto } from '../../types';

/** La date de légalisation est exigée si la pénalité n'est pas nulle : le dire avant l'envoi évite un 400. */
export default function ValiderDesistementDialog({
  desistement: d,
  onClose,
  onDone,
}: Readonly<{ desistement: DesistementDto; onClose: () => void; onDone: () => void }>) {
  const [dateValidation, setDateValidation] = useState(todayISO());
  const [dateLegalisation, setDateLegalisation] = useState(jourSaisi(d.dateLegalisation));
  const exigee = legalisationRequise(d.penaliteApresRemise);

  return (
    <FormulaireModal
      title="Valider le désistement"
      libelle="Valider"
      valide={dateValidation !== '' && (!exigee || dateLegalisation !== '')}
      onClose={onClose}
      onSubmit={async () => {
        await validerDesistement(d.id, {
          dateValidation: toApiDateTime(dateValidation) ?? dateValidation,
          dateLegalisation: toApiDateTime(dateLegalisation),
        });
        onDone();
      }}
    >
      <p className="text-body text-muted-foreground">
        La validation fige les montants, génère les pièces de frais et de remboursement, puis fait passer le dossier en
        désistement et libère le lot.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <ChampDate label="Date de validation (obligatoire)" value={dateValidation} onChange={setDateValidation} />
        <ChampDate
          label={exigee ? 'Date de légalisation (obligatoire)' : 'Date de légalisation'}
          value={dateLegalisation}
          onChange={setDateLegalisation}
        />
      </div>
      {exigee && (
        <p className="text-micro text-muted-foreground">
          Pénalité de {formatCurrency(d.penaliteApresRemise)} : la légalisation est requise.
        </p>
      )}
    </FormulaireModal>
  );
}
