import { useState } from 'react';
import { Printer } from 'lucide-react';
import { ouvrirBlobDansOnglet } from '../../lib/api';
import { paiementApprouvePdf } from '../../lib/apiAchat';
import { useToast } from '../../lib/toastContext';
import { errorMessage } from '../../lib/useApi';
import type { UUID } from '../../types';

/** Icône « Paiement approuvé » : ouvre le PDF de la facture ; le refus du serveur s'affiche tel quel. */
export default function BoutonPaiementApprouve({ pieceId, imprimable = true }: Readonly<{ pieceId: UUID; imprimable?: boolean }>) {
  const showToast = useToast();
  const [enCours, setEnCours] = useState(false);
  const titre = imprimable ? 'Paiement approuvé' : 'Impression réservée aux factures';

  async function imprimer() {
    setEnCours(true);
    try {
      await ouvrirBlobDansOnglet(() => paiementApprouvePdf(pieceId));
    } catch (err) {
      showToast({ texte: errorMessage(err), variante: 'erreur' });
    } finally {
      setEnCours(false);
    }
  }

  return (
    <button
      type="button"
      className="inline-grid size-6 place-items-center rounded-md text-foreground hover:bg-muted disabled:opacity-45"
      aria-label={titre}
      title={titre}
      disabled={!imprimable || enCours}
      onClick={() => void imprimer()}
    >
      <Printer aria-hidden className="size-4" />
    </button>
  );
}
