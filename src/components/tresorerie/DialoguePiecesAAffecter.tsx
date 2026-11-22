import { useState } from 'react';
import Modal from '../Modal';
import { EmptyState, ErrorState, LoadingState } from '../ui';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { listerPiecesAAffecter } from '../../lib/apiTresorerie';
import { formatCurrency, formatDate } from '../../lib/format';
import { useApi } from '../../lib/useApi';
import type { UUID } from '../../types';
import type { LigneSaisieDecaissementDto, ModuleTresorerie, PieceAAffecterDto } from '../../types/tresorerie';

const ENTETES = ['Code', 'Date', 'Échéance', 'Description', 'Net à payer', 'Réglé', 'Reste à payer', 'Montant affecté'];

function TableauPieces({ pieces, montants, onMontant }: Readonly<{
  pieces: PieceAAffecterDto[];
  montants: Record<string, number | null>;
  onMontant: (id: UUID, montant: number | null) => void;
}>) {
  return (
    <table className="w-full text-body">
      <thead>
        <tr>{ENTETES.map((e) => <th key={e} scope="col" className="px-2 py-1 text-left font-medium">{e}</th>)}</tr>
      </thead>
      <tbody>
        {pieces.map((p) => (
          <tr key={p.id} className="border-t border-border">
            <td className="px-2 py-1">{p.code}</td>
            <td className="px-2 py-1">{formatDate(p.dateDocument)}</td>
            <td className="px-2 py-1">{formatDate(p.dateEcheance)}</td>
            <td className="px-2 py-1">{p.description}</td>
            <td className="px-2 py-1 text-right">{formatCurrency(p.netAPayer)}</td>
            <td className="px-2 py-1 text-right">{formatCurrency(p.regle)}</td>
            <td className="px-2 py-1 text-right">{formatCurrency(p.resteAPayer)}</td>
            <td className="px-2 py-1">
              <Input
                type="number"
                step="any"
                min={0}
                aria-label={`Montant affecté à ${p.code ?? 'la pièce'}`}
                className="w-28 text-right"
                value={montants[p.id] ?? ''}
                onChange={(e) => onMontant(p.id, e.target.value === '' ? null : Number(e.target.value))}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Pièces du fournisseur à régler ; « Valider » renvoie les lignes au montant saisi > 0. */
export default function DialoguePiecesAAffecter({ module, fournisseurId, societeId, reglementId, lignes, onValider, onClose }: Readonly<{
  module: ModuleTresorerie;
  fournisseurId: UUID;
  societeId: UUID;
  reglementId?: UUID;
  lignes: LigneSaisieDecaissementDto[];
  onValider: (lignes: LigneSaisieDecaissementDto[]) => void;
  onClose: () => void;
}>) {
  const pieces = useApi(
    () => listerPiecesAAffecter(module, fournisseurId, societeId, reglementId),
    [module, fournisseurId, societeId, reglementId],
  );
  const [montants, setMontants] = useState<Record<string, number | null>>(
    () => Object.fromEntries(lignes.map((l) => [l.pieceId, l.montant])),
  );

  function valider() {
    const retenues = (pieces.data ?? [])
      .map((p) => ({ pieceId: p.id, montant: montants[p.id] ?? 0 }))
      .filter((l) => l.montant > 0);
    onValider(retenues);
    onClose();
  }

  let corps = <LoadingState />;
  if (pieces.error) corps = <ErrorState message={pieces.error} />;
  else if (pieces.data?.length === 0) corps = <EmptyState title="Aucune pièce à affecter pour ce fournisseur" />;
  else if (pieces.data) {
    corps = <TableauPieces pieces={pieces.data} montants={montants} onMontant={(id, m) => setMontants((s) => ({ ...s, [id]: m }))} />;
  }

  return (
    <Modal title="Pièces à affecter" onClose={onClose} width={900}>
      <div className="flex flex-col gap-3">
        <div className="max-h-96 overflow-auto">{corps}</div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
          <Button type="button" disabled={!pieces.data?.length} onClick={valider}>Valider</Button>
        </DialogFooter>
      </div>
    </Modal>
  );
}
