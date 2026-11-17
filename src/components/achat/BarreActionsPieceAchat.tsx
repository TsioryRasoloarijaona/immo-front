import { useState } from 'react';
import { ArrowRightLeft, FilePlus2, Link2, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import DialogueAffectationBonCommande from './DialogueAffectationBonCommande';
import DialogueChangementStatutAchat from './DialogueChangementStatutAchat';
import FormulairePieceAchatFenetre from './FormulairePieceAchatFenetre';
import { oublierLecturesRecentes } from '../../lib/api';
import { supprimerPieceAchat } from '../../lib/apiAchat';
import { messageActionPieceAchat } from '../../lib/actionsPieceAchat';
import { useConfirm } from '../../lib/confirmContext';
import { intituleDocumentAchat } from '../../lib/documentsAchat';
import { refetchAllApis } from '../../lib/useApi';
import type { DocumentAchatDetailDto } from '../../types/achat';

type Dialogue = 'statut' | 'affecter' | null;

/** Boutons d'écriture d'une pièce d'achat, à placer dans une `BarreIcones` : chacun n'existe que si `actions` l'autorise. */
export default function BarreActionsPieceAchat({ piece, onChange, onFermer, onModifier, onOuvrir }: Readonly<{
  piece: DocumentAchatDetailDto;
  onChange: (piece: DocumentAchatDetailDto) => void;
  onFermer: () => void;
  onModifier: () => void;
  onOuvrir: (id: string) => void;
}>) {
  const confirmer = useConfirm();
  const [dialogue, setDialogue] = useState<Dialogue>(null);
  const [generation, setGeneration] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { transitions, peutAffecter, peutSupprimer, peutModifier, generations } = piece.actions;

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
      {peutModifier && (
        <Button type="button" variant="ghost" size="sm" onClick={onModifier}>
          <Pencil /> Modifier
        </Button>
      )}
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
      {generations.map((g) => (
        <Button key={g.natureCible} type="button" variant="ghost" size="sm" onClick={() => setGeneration(g.natureCible)}>
          <FilePlus2 /> {g.libelle}
        </Button>
      ))}
      {peutSupprimer && (
        <Button type="button" variant="destructive" size="sm" onClick={() => void supprimer()}>
          <Trash2 /> Supprimer
        </Button>
      )}
      {message && <span role="alert" className="ml-2 text-body text-destructive">{message}</span>}
      {generation && (
        <FormulairePieceAchatFenetre
          nature={generation}
          sources={[piece.id]}
          onFermer={() => setGeneration(null)}
          onEnregistre={(p, fermer) => {
            setGeneration(null);
            if (!fermer) onOuvrir(p.id);
          }}
        />
      )}
      {dialogue === 'statut' && (
        <DialogueChangementStatutAchat piece={piece} onClose={() => setDialogue(null)} onChange={onChange} onIntrouvable={setMessage} />
      )}
      {dialogue === 'affecter' && (
        <DialogueAffectationBonCommande piece={piece} onClose={() => setDialogue(null)} onChange={onChange} onIntrouvable={setMessage} />
      )}
    </>
  );
}
