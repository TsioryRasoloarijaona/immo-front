import { useEffect, useState } from 'react';
import { ChartGantt, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BarreIcones from '../../BarreIcones';
import Modal from '../../Modal';
import SearchableSelect from '../../SearchableSelect';
import { ErrorState, LoadingState } from '../../ui';
import { Button } from '../../ui/button';
import { ApiError, oublierLecturesRecentes } from '../../../lib/api';
import { clonerPlanificationProjet, getPlanificationProjet, listModelesPlanification, listTachesLot } from '../../../lib/apiPlanification';
import { formatDate, formatPercentValue } from '../../../lib/format';
import { MESSAGE_PLANIFICATION_ABSENTE } from '../../../lib/planification';
import { errorMessage, useApi } from '../../../lib/useApi';
import type { UUID } from '../../../types';
import type { PlanificationDetailDto } from '../../../types/planification';
import FicheTache from './FicheTache';

type Lecture = PlanificationDetailDto | { absente: string };

/** 404 `PLANIFICATION_ABSENTE` : état normal d'un projet sans planning, pas une erreur. */
async function lirePlanification(projetId: UUID): Promise<Lecture> {
  try {
    return await getPlanificationProjet(projetId);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404 && err.problem?.code === 'PLANIFICATION_ABSENTE') return { absente: err.message };
    throw err;
  }
}

function CreationDepuisModele({ projetId, message, onClose }: Readonly<{ projetId: UUID; message: string; onClose: () => void }>) {
  const navigate = useNavigate();
  const modeles = useApi(() => listModelesPlanification(), [], 'projet-config-modeles-planification');
  const [modeleId, setModeleId] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function creer() {
    if (!modeleId) return;
    setErreur(null);
    try {
      const detail = await clonerPlanificationProjet(projetId, modeleId);
      oublierLecturesRecentes();
      onClose();
      void navigate(`/projet/planification/${detail.id}`);
    } catch (err) {
      setErreur(errorMessage(err));
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-md border border-border bg-muted px-3 py-2 text-body">{message}</p>
      {modeles.error && <ErrorState message={modeles.error} />}
      <SearchableSelect label="Modèle de planification" placeholder="Choisir un modèle…" value={modeleId} onValueChange={setModeleId}
        items={(modeles.data ?? []).map((m) => ({ value: m.id, label: [m.code, m.description].filter(Boolean).join(' — ') }))} />
      <BarreIcones className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="sm" disabled={!modeleId} onClick={() => void creer()}><Copy /> Créer depuis un modèle</Button>
      </BarreIcones>
      {erreur && <p role="alert" className="text-body text-destructive">{erreur}</p>}
    </div>
  );
}

function TachesDuLot({ lotId, planification }: Readonly<{ lotId: UUID; planification: PlanificationDetailDto }>) {
  const navigate = useNavigate();
  const taches = useApi(() => listTachesLot(lotId), [lotId]);
  const [ouverte, setOuverte] = useState<string | null>(null);
  const tache = taches.data?.find((t) => t.id === ouverte);

  return (
    <div className="flex flex-col gap-3">
      <BarreIcones className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="sm" onClick={() => void navigate(`/projet/planification/${planification.id}`)}><ChartGantt /> Ouvrir le Gantt</Button>
      </BarreIcones>
      {taches.loading && !taches.data && <LoadingState />}
      {taches.error && <ErrorState message={taches.error} />}
      {!taches.error && taches.data?.length === 0 && <p className="text-body text-muted-foreground">Aucune tâche pour ce lot.</p>}
      {!taches.error && taches.data && taches.data.length > 0 && (
        <table className="w-full border-collapse text-body">
          <thead>
            <tr className="bg-muted text-left text-micro text-muted-foreground">
              {['Code', 'Description', 'Début', 'Durée', 'Fin', '% avancement'].map((e) => <th key={e} scope="col" className="px-1.5 py-1 font-medium">{e}</th>)}
            </tr>
          </thead>
          <tbody>
            {taches.data.map((t) => (
              <tr key={t.id} className="cursor-pointer border-t border-border hover:bg-muted/60" onDoubleClick={() => setOuverte(t.id)}>
                <td className="px-1.5">{t.code}</td>
                <td className="px-1.5">{t.description}</td>
                <td className="px-1.5">{formatDate(t.dateDebut)}</td>
                <td className="px-1.5 text-right">{t.duree}</td>
                <td className="px-1.5">{formatDate(t.dateFin)}</td>
                <td className="px-1.5 text-right">{formatPercentValue(t.avancement, 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {tache && <FicheTache planification={planification} tache={tache} lectureSeule onClose={() => setOuverte(null)} onEnregistre={() => setOuverte(null)} />}
    </div>
  );
}

/** Planification d'un projet : création depuis un modèle si absente ; sinon Gantt, ou tâches du lot si `lotId`. */
export default function PlanificationProjet({ projetId, lotId, onClose }: Readonly<{ projetId: UUID; lotId?: UUID; onClose: () => void }>) {
  const navigate = useNavigate();
  const lecture = useApi(() => lirePlanification(projetId), [projetId]);
  const data = lecture.data;
  const planification = data && !('absente' in data) ? data : null;

  useEffect(() => {
    if (planification && !lotId) {
      onClose();
      void navigate(`/projet/planification/${planification.id}`);
    }
  }, [planification, lotId, navigate, onClose]);

  return (
    <Modal title="Planification" onClose={onClose} width={720}>
      {lecture.loading && !data && <LoadingState />}
      {lecture.error && !data && <ErrorState message={lecture.error} />}
      {data && 'absente' in data && (
        <CreationDepuisModele projetId={projetId} message={data.absente || MESSAGE_PLANIFICATION_ABSENTE} onClose={onClose} />
      )}
      {planification && lotId && <TachesDuLot lotId={lotId} planification={planification} />}
    </Modal>
  );
}
