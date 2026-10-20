import { useState } from 'react';
import { CalendarClock, Gauge, Megaphone, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../lib/auth';
import { estAdministrateur, estChefOuExempte } from '../../lib/roles';
import { useToast } from '../../lib/toastContext';
import BoutonDesistement from '../desistement/BoutonDesistement';
import CalendrierVisitesDialog from './CalendrierVisitesDialog';
import CompteursDialog from './CompteursDialog';
import InstructionDialog from './InstructionDialog';
import ReinitialiserDialog from './ReinitialiserDialog';

type Dialogue = 'instruction' | 'compteurs' | 'visite' | 'reinitialiser';

/** Barre d'actions de la fiche dossier ; boutons selon le rôle, le serveur restant seul juge (403). */
export default function ActionsFicheDossier({
  dossierId,
  commercialNom,
  onChanged,
}: Readonly<{ dossierId: string; commercialNom?: string; onChanged: () => void }>) {
  const { user } = useAuth();
  const showToast = useToast();
  const [ouvert, setOuvert] = useState<Dialogue | null>(null);
  const fermer = () => setOuvert(null);

  function termine(message: string) {
    setOuvert(null);
    showToast(message);
    onChanged();
  }

  return (
    <>
      {estChefOuExempte(user) && (
        <Button variant="outline" size="sm" onClick={() => setOuvert('instruction')}>
          <Megaphone data-icon="inline-start" /> Instruction
        </Button>
      )}
      <Button variant="outline" size="sm" onClick={() => setOuvert('visite')}>
        <CalendarClock data-icon="inline-start" /> Visite technique
      </Button>
      <Button variant="outline" size="sm" onClick={() => setOuvert('compteurs')}>
        <Gauge data-icon="inline-start" /> Compteurs
      </Button>
      <BoutonDesistement dossierId={dossierId} />
      {estAdministrateur(user) && (
        <Button variant="outline" size="sm" onClick={() => setOuvert('reinitialiser')}>
          <RotateCcw data-icon="inline-start" /> Réinitialiser
        </Button>
      )}

      {ouvert === 'instruction' && (
        <InstructionDialog
          dossierId={dossierId}
          commercialNom={commercialNom}
          onClose={fermer}
          onCreated={(mail) => termine(mail ? 'Instruction envoyée, mail parti au commercial.' : 'Instruction enregistrée (aucun mail : commercial sans email).')}
        />
      )}
      {ouvert === 'visite' && (
        <CalendrierVisitesDialog
          dossierId={dossierId}
          onClose={fermer}
          onProgrammee={(mail) => termine(mail ? 'Visite programmée, S.A.V. prévenu par mail.' : 'Visite programmée (aucun mail au S.A.V.).')}
        />
      )}
      {ouvert === 'compteurs' && (
        <CompteursDialog dossierId={dossierId} onClose={fermer} onSaved={() => termine('Compteurs enregistrés.')} />
      )}
      {ouvert === 'reinitialiser' && (
        <ReinitialiserDialog dossierId={dossierId} onClose={fermer} onDone={() => termine('Dossier réinitialisé depuis le stock.')} />
      )}
    </>
  );
}
