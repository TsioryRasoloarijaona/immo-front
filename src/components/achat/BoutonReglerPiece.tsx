import { useState } from 'react';
import { createPortal } from 'react-dom';
import { HandCoins } from 'lucide-react';
import FormulaireDecaissementFenetre from '../tresorerie/FormulaireDecaissementFenetre';
import { lireReferentielsDecaissement, proposerDecaissement } from '../../lib/apiTresorerie';
import { useToast } from '../../lib/toastContext';
import { errorMessage, useApi } from '../../lib/useApi';
import type { UUID } from '../../types';
import type { SaisieDecaissementDto } from '../../types/tresorerie';

/** Icône « Régler cette pièce » : ouvre un décaissement prérempli ; le refus du serveur s'affiche tel quel. */
export default function BoutonReglerPiece({ pieceId, resteARegler }: Readonly<{ pieceId: UUID; resteARegler: number }>) {
  const droits = useApi(() => lireReferentielsDecaissement('BUY'), ['BUY'], 'decaissement-ref-BUY').data?.droits;
  const showToast = useToast();
  const [proposition, setProposition] = useState<SaisieDecaissementDto | null>(null);
  const [enCours, setEnCours] = useState(false);
  if (!droits?.peutCreer || resteARegler <= 0) return null;

  async function regler() {
    setEnCours(true);
    try {
      setProposition(await proposerDecaissement(pieceId));
    } catch (err) {
      showToast({ texte: errorMessage(err), variante: 'erreur' });
    } finally {
      setEnCours(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="ml-1 inline-grid size-6 place-items-center rounded-md align-middle text-foreground hover:bg-muted disabled:opacity-45"
        aria-label="Régler cette pièce"
        title="Régler cette pièce"
        disabled={enCours}
        onClick={() => void regler()}
      >
        <HandCoins aria-hidden className="size-4" />
      </button>
      {proposition &&
        createPortal(
          <FormulaireDecaissementFenetre
            module="BUY"
            initial={proposition}
            onFermer={() => setProposition(null)}
            onCree={() => setProposition(null)}
          />,
          document.body,
        )}
    </>
  );
}
