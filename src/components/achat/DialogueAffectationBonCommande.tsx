import { useState } from 'react';
import Modal from '../Modal';
import SearchableSelect from '../SearchableSelect';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { Field, FieldLabel } from '../ui/field';
import { ErrorState, LoadingState } from '../ui';
import { affecterBonCommandeAchat, getDocumentsAchat } from '../../lib/apiAchat';
import { estIntrouvable, messageActionPieceAchat, relirePieceAchat } from '../../lib/actionsPieceAchat';
import { formatCurrency } from '../../lib/format';
import { useApi } from '../../lib/useApi';
import type { DocumentAchatDetailDto } from '../../types/achat';

/** BC du même fournisseur (et du même lot s'il y en a un) ; la société est recoupée côté client. */
async function listerBonsCommande(piece: DocumentAchatDetailDto) {
  const page = await getDocumentsAchat(
    { natures: ['ORDER'], fournisseurId: piece.fournisseurId ?? undefined, lotId: piece.lotId ?? undefined },
    { size: 200 },
  );
  return page.content.filter((bc) => !piece.societeCode || !bc.societeCode || bc.societeCode === piece.societeCode);
}

export default function DialogueAffectationBonCommande({ piece, onClose, onChange, onIntrouvable }: Readonly<{
  piece: DocumentAchatDetailDto;
  onClose: () => void;
  onChange: (piece: DocumentAchatDetailDto) => void;
  onIntrouvable: (message: string) => void;
}>) {
  const bons = useApi(() => listerBonsCommande(piece), [piece.id, piece.fournisseurId, piece.lotId, piece.societeCode]);
  const [bonId, setBonId] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function affecter() {
    setEnvoi(true);
    setErreur(null);
    try {
      onChange(await affecterBonCommandeAchat(piece.id, { bonCommandeId: bonId }));
      onClose();
    } catch (err) {
      if (estIntrouvable(err)) {
        onClose();
        onIntrouvable(messageActionPieceAchat(err));
      } else {
        setErreur(messageActionPieceAchat(err));
        const relue = await relirePieceAchat(piece.id);
        if (relue) onChange(relue);
      }
    } finally {
      setEnvoi(false);
    }
  }

  let liste;
  if (bons.error) liste = <ErrorState message={bons.error} />;
  else if (bons.data) {
    liste = (
      <Field>
        <FieldLabel htmlFor="bc-affectation">Bon de commande</FieldLabel>
        <SearchableSelect
          id="bc-affectation"
          value={bonId || null}
          placeholder="Choisir…"
          emptyMessage="Aucun bon de commande"
          className="w-full min-w-0"
          onValueChange={(v) => setBonId(v ?? '')}
          items={bons.data.map((bc) => ({ value: bc.id, label: `${bc.code ?? '—'} · ${formatCurrency(bc.montantTTC)}` }))}
        />
      </Field>
    );
  } else liste = <LoadingState />;

  return (
    <Modal title="Affecter à un bon de commande" onClose={onClose} width={460}>
      <div className="flex flex-col gap-3">
        {liste}
        {erreur && <p role="alert" className="text-body text-destructive">{erreur}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={envoi}>Annuler</Button>
          <Button type="button" disabled={envoi || !bonId} onClick={() => void affecter()}>Affecter</Button>
        </DialogFooter>
      </div>
    </Modal>
  );
}
