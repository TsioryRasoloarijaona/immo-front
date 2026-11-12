import { useState } from 'react';
import { ArrowRightLeft, Link2, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import DialogueAffectationBonCommande from './DialogueAffectationBonCommande';
import DialogueChangementStatutAchat from './DialogueChangementStatutAchat';
import { oublierLecturesRecentes } from '../../lib/api';
import { supprimerPieceAchat } from '../../lib/apiAchat';
import { messageActionPieceAchat } from '../../lib/actionsPieceAchat';
import { useConfirm } from '../../lib/confirmContext';
import { intituleDocumentAchat } from '../../lib/documentsAchat';
import { refetchAllApis } from '../../lib/useApi';
import type { DocumentAchatDetailDto } from '../../types/achat';

type Dialogue = 'statut' | 'affecter' | null;

/** Boutons d'écriture d'une pièce d'achat, à placer dans une `BarreIcones` : chacun n'existe que si `actions` l'autorise. */
export default function BarreActionsPieceAchat({ piece, onChange, onFermer }: Readonly<{
  piece: DocumentAchatDetailDto;
  onChange: (piece: DocumentAchatDetailDto) => void;
  onFermer: () => void;
}>) {
  const confirmer = useConfirm();
  const [dialogue, setDialogue] = useState<Dialogue>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { transitions, peutAffecter, peutSupprimer } = piece.actions;

  async function supprimer() {
    const ok = await confirmer({
      title: 'Supprimer la pièce',
      message: `Supprimer la pièce ${intituleDocumentAchat(piece) || piece.code || ''} ?`,
      confirmLabel: 'Supprimer',
      cancelLabel: 'Annuler',
    });
    if (!ok) return;
    setMessage(null);
    try {
      await supprimerPieceAchat(piece.id);
      oublierLecturesRecentes();
      refetchAllApis();
      onFermer();
    } catch (err) {
      oublierLecturesRecentes();
      setMessage(messageActionPieceAchat(err));
    }
  }

  return (
    <>
      {transitions.length > 0 && (
        <Button type="button" variant="ghost" size="sm" onClick={() => { setMessage(null); setDialogue('statut'); }}>
          <ArrowRightLeft /> Changer de statut
        </Button>
      )}
      {peutAffecter && (
        <Button type="button" variant="ghost" size="sm" onClick={() => { setMessage(null); setDialogue('affecter'); }}>
          <Link2 /> Affecter à un B.C.
        </Button>
      )}
      {peutSupprimer && (
        <Button type="button" variant="destructive" size="sm" onClick={() => void supprimer()}>
          <Trash2 /> Supprimer
        </Button>
      )}
      {message && <span role="alert" className="ml-2 text-body text-destructive">{message}</span>}
      {dialogue === 'statut' && (
        <DialogueChangementStatutAchat piece={piece} onClose={() => setDialogue(null)} onChange={onChange} onIntrouvable={setMessage} />
      )}
      {dialogue === 'affecter' && (
        <DialogueAffectationBonCommande piece={piece} onClose={() => setDialogue(null)} onChange={onChange} onIntrouvable={setMessage} />
      )}
    </>
  );
}
