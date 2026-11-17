import { useState } from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';
import BarreIcones from '../../BarreIcones';
import DataGrid from '../../DataGrid';
import { ErrorState } from '../../ui';
import { Button } from '../../ui/button';
import { getAvoirsLot, supprimerAvoirLot } from '../../../lib/apiProjet';
import { useConfirm } from '../../../lib/confirmContext';
import { COLONNES_AVOIRS } from '../../../lib/sousFenetresLot';
import { errorMessage, refetchAllApis } from '../../../lib/useApi';
import type { AvoirLotDto } from '../../../types/projet';
import DonneesLot from './DonneesLot';

function ListeAvoirs({ lotId, avoirs }: Readonly<{ lotId: string; avoirs: AvoirLotDto[] }>) {
  const confirm = useConfirm();
  const [choisi, setChoisi] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const ligne = avoirs.find((a) => a.id === choisi);

  async function supprimer() {
    if (!ligne || !(await confirm('Êtes-vous sûr de vouloir supprimer cet avoir ?'))) return;
    setEnCours(true);
    setErreur(null);
    try {
      await supprimerAvoirLot(lotId, ligne.id);
      setChoisi(null);
      refetchAllApis();
    } catch (err: unknown) {
      setErreur(errorMessage(err));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <BarreIcones className="flex items-center gap-1">
        {ligne?.supprimable && (
          <Button type="button" variant="ghost" size="sm" disabled={enCours} onClick={() => void supprimer()}>
            <Trash2 /> Supprimer
          </Button>
        )}
        <Button type="button" variant="ghost" size="sm" onClick={refetchAllApis}>
          <RefreshCw /> Rafraîchir
        </Button>
      </BarreIcones>
      {erreur && <ErrorState message={erreur} />}
      <DataGrid
        rows={avoirs}
        colonnes={COLONNES_AVOIRS}
        cleOrdre="lot-avoirs"
        bandeauRegroupement={false}
        selection={{
          ids: new Set(choisi ? [choisi] : []),
          onToggle: (id) => setChoisi((c) => (c === id ? null : id)),
          onToggleAll: () => setChoisi(null),
        }}
      />
    </div>
  );
}

export default function AvoirsLot({ lotId }: Readonly<{ lotId: string }>) {
  return (
    <DonneesLot<AvoirLotDto[]> lotId={lotId} charger={getAvoirsLot} estVide={(d) => d.length === 0} texteVide="Aucun avoir pour ce lot">
      {(d) => <ListeAvoirs lotId={lotId} avoirs={d} />}
    </DonneesLot>
  );
}
