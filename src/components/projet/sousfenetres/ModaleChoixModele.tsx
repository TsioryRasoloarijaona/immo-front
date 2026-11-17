import { useState } from 'react';
import { Check, List, X } from 'lucide-react';
import { getLot, getModeleSimulation, listModelesSimulation, proposerApplicationModele } from '../../../lib/apiProjet';
import { useConfirm } from '../../../lib/confirmContext';
import { errorMessage, useApi } from '../../../lib/useApi';
import { cn } from '../../../lib/utils';
import type { PropositionPointsDto } from '../../../types/projet';
import BarreIcones from '../../BarreIcones';
import Modal from '../../Modal';
import { ErrorState, LoadingState } from '../../ui';
import { Button } from '../../ui/button';
import GraphiqueModele from './GraphiqueModele';

function Apercu({ modeleId }: Readonly<{ modeleId: string }>) {
  const { data, loading, error } = useApi(() => getModeleSimulation(modeleId), [modeleId]);
  return (
    <div className="flex-1">
      {error && <ErrorState message={error} />}
      {!error && !data && loading && <LoadingState />}
      {!error && data && <GraphiqueModele lignes={data.lignes} />}
    </div>
  );
}

function Liste({ lotId, grilleVide, onValide, onClose }: Readonly<{ lotId: string; grilleVide: boolean; onValide: (p: PropositionPointsDto) => void; onClose: () => void }>) {
  const confirm = useConfirm();
  const { data: lot, loading: chargeLot, error: erreurLot } = useApi(() => getLot(lotId), [lotId]);
  const [tous, setTous] = useState(false);
  const [choisi, setChoisi] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const categorieId = tous ? undefined : (lot?.categorieId ?? undefined);
  const { data, loading, error } = useApi(() => (lot ? listModelesSimulation(categorieId) : Promise.resolve([])), [lot?.id, categorieId]);

  async function valider(modeleId: string) {
    if (!grilleVide && !(await confirm({ title: 'Appliquer un modèle', message: 'Les prévisions actuelles seront remplacées par celles du modèle.', confirmLabel: 'Remplacer', cancelLabel: 'Annuler' }))) return;
    setEnvoi(true);
    setErreur(null);
    try {
      onValide(await proposerApplicationModele(lotId, modeleId));
    } catch (err: unknown) {
      setErreur(errorMessage(err));
      setEnvoi(false);
    }
  }

  if (erreurLot) return <ErrorState message={erreurLot} />;
  if (!lot && chargeLot) return <LoadingState />;
  return (
    <div className="flex flex-col gap-3">
      <BarreIcones className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="sm" disabled={envoi || !choisi} onClick={() => choisi && void valider(choisi)}><Check /> Valider</Button>
        <Button type="button" variant="ghost" size="sm" disabled={tous} onClick={() => setTous(true)}><List /> Voir tous les modèles</Button>
        <Button type="button" variant="ghost" size="sm" disabled={envoi} onClick={onClose}><X /> Annuler</Button>
      </BarreIcones>
      {error && <ErrorState message={error} />}
      {!error && !data && loading && <LoadingState />}
      {!error && data?.length === 0 && <p className="text-body text-muted-foreground">Il n&apos;existe aucun modèle de suivi du lot dans votre base de données</p>}
      {!error && data && data.length > 0 && (
        <div className="flex gap-3">
          <ul className="flex w-64 flex-col gap-0.5">
            {data.map((m) => (
              <li key={m.id}>
                <button type="button" onClick={() => setChoisi(m.id)} onDoubleClick={() => void valider(m.id)}
                  className={cn('w-full rounded-sm px-2 py-1 text-left text-body', choisi === m.id ? 'bg-accent font-medium' : 'hover:bg-accent/50')}>
                  {m.code} — {m.description}
                </button>
              </li>
            ))}
          </ul>
          {choisi && <Apercu modeleId={choisi} />}
        </div>
      )}
      {erreur && <p role="alert" className="text-body text-destructive">{erreur}</p>}
    </div>
  );
}

/** « Choix du modèle de suivi du lot » : modèles de la catégorie du lot, aperçu, puis proposition de grille. */
export default function ModaleChoixModele({ lotId, grilleVide, onValide, onClose }: Readonly<{ lotId: string; grilleVide: boolean; onValide: (p: PropositionPointsDto) => void; onClose: () => void }>) {
  return (
    <Modal title="Choix du modèle de suivi du lot" onClose={onClose} width={720}>
      <Liste lotId={lotId} grilleVide={grilleVide} onValide={onValide} onClose={onClose} />
    </Modal>
  );
}
