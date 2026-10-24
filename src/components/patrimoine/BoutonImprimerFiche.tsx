import { Printer } from 'lucide-react';
import { Button } from '../ui/button';
import { ouvrirBlobDansOnglet } from '../../lib/api';
import { fichePdf } from '../../lib/apiFichesPdf';
import { useToast } from '../../lib/toastContext';
import { errorMessage } from '../../lib/useApi';
import type { RessourceFichePdf } from '../../types';

/** Ouvre le PDF de la fiche dans un nouvel onglet ; ouvert pour tout compte qui voit la fiche. */
export default function BoutonImprimerFiche({ ressource, id }: Readonly<{ ressource: RessourceFichePdf; id: string }>) {
  const showToast = useToast();
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={() => void ouvrirBlobDansOnglet(() => fichePdf(ressource, id)).catch((err: unknown) => showToast({ texte: errorMessage(err), variante: 'erreur' }))}
    >
      <Printer data-icon="inline-start" /> Imprimer
    </Button>
  );
}
