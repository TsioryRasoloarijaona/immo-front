import { ChevronDown, FileText, Printer } from 'lucide-react';
import { buttonVariants } from '../../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/dropdown-menu';
import { ouvrirBlobDansOnglet } from '../../../lib/api';
import { fichePdf } from '../../../lib/apiFichesPdf';
import { useAuth } from '../../../lib/auth';
import { estExempte } from '../../../lib/roles';
import { useToast } from '../../../lib/toastContext';
import { errorMessage } from '../../../lib/useApi';

export type DialogueImpression = 'relance2' | 'reservation';

/** Menu « Imprimer » de la fiche tranche ; « Relance 2 par statut » réservé à l'Administrateur et à la Direction Générale. */
export default function MenuImprimerTranche({ trancheId, onDialogue }: Readonly<{ trancheId: string; onDialogue: (d: DialogueImpression) => void }>) {
  const { user } = useAuth();
  const showToast = useToast();
  const fiche = () => void ouvrirBlobDansOnglet(() => fichePdf('tranches', trancheId))
    .catch((err: unknown) => showToast({ texte: errorMessage(err), variante: 'erreur' }));
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={buttonVariants({ variant: 'outline', size: 'sm' })}>
        <Printer data-icon="inline-start" /> Imprimer <ChevronDown className="size-3" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-56">
        <DropdownMenuItem onClick={fiche}><FileText /> Fiche de la tranche</DropdownMenuItem>
        {estExempte(user) && <DropdownMenuItem onClick={() => onDialogue('relance2')}><Printer /> Relance 2 par statut</DropdownMenuItem>}
        <DropdownMenuItem onClick={() => onDialogue('reservation')}><FileText /> Fiche de réservation</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
