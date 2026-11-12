import { useNavigate } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import DataGrid from '../DataGrid';
import Modal from '../Modal';
import { EmptyState, ErrorState, LoadingState } from '../ui';
import { Button } from '../ui/button';
import { getLignesPositionFournisseur } from '../../lib/apiAchat';
import { COLONNES_LIGNES_POSITION, type LignePositionFournisseur } from '../../lib/positionsFournisseurs';
import { useApi } from '../../lib/useApi';
import type { FiltresPositionsFournisseurs } from '../../types/achat';

const IMPAYES_FOURNISSEUR = '/achat/documents?natures=INVOICE&natures=DOCUMENT_TO_PAY&nonSoldes=true';

/** Fenêtre « Ligne de solde » : mouvements d'un fournisseur dans une société sur la période des filtres. */
export default function DialogueLignesPosition({ position, filtres, onClose }: Readonly<{
  position: LignePositionFournisseur;
  filtres: FiltresPositionsFournisseurs;
  onClose: () => void;
}>) {
  const navigate = useNavigate();
  const { fournisseurId, societeId } = position;
  const lignes = useApi(
    () => (fournisseurId && societeId ? getLignesPositionFournisseur(fournisseurId, societeId, filtres) : Promise.resolve([])),
    [fournisseurId, societeId, JSON.stringify(filtres)],
    'achat-position-lignes',
  );

  return (
    <Modal title={`Ligne de solde — ${position.fournisseurNom ?? 'Fournisseur'} (${position.societeCode ?? '—'})`} onClose={onClose} width="min(1400px, 95vw)" pleineHauteur>
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        {lignes.loading && !lignes.data && !lignes.error && <LoadingState />}
        {lignes.error && (
          <div className="flex flex-col items-center gap-2">
            <ErrorState message={lignes.error} />
            <Button type="button" variant="outline" size="sm" onClick={() => void lignes.refetch()}>
              <RotateCcw data-icon="inline-start" /> Réessayer
            </Button>
          </div>
        )}
        {!lignes.error && lignes.data && (
          <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-border bg-card">
            {lignes.data.length === 0 ? (
              <EmptyState title="Aucun mouvement sur la période" />
            ) : (
              // un règlement ventilé renvoie plusieurs lignes au même id : clé de ligne rendue unique
              <DataGrid cleOrdre="achat-position-lignes" rows={lignes.data.map((l, i) => ({ ...l, id: `${l.id}-${i}` }))} colonnes={COLONNES_LIGNES_POSITION} bandeauRegroupement={false} />
            )}
          </div>
        )}
        <div className="flex shrink-0 justify-end">
          <Button type="button" variant="outline" size="sm" disabled={!fournisseurId} onClick={() => void navigate(`${IMPAYES_FOURNISSEUR}&fournisseurId=${fournisseurId}`)}>
            Voir les impayés
          </Button>
        </div>
      </div>
    </Modal>
  );
}
