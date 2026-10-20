import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Lock, LockOpen, Ruler, Trash2 } from 'lucide-react';
import GardeEtudes from '../../components/faisabilite/GardeEtudes';
import OngletsEtude from '../../components/faisabilite/OngletsEtude';
import PageShell from '../../components/PageShell';
import ActionAdmin from '../../components/patrimoine/ActionAdmin';
import { Badge, ErrorState, LoadingState } from '../../components/ui';
import AdminGuard from '../utilisateurs/AdminGuard';
import { bloquerEtude, debloquerEtude, deleteEtudeFaisabilite, getEtudeFaisabilite } from '../../lib/apiFaisabilite';
import { useConfirm } from '../../lib/confirmContext';
import { toneStatut } from '../../lib/faisabilite';
import { useToast } from '../../lib/toastContext';
import { errorMessage, useApi } from '../../lib/useApi';

const LISTE = { label: 'Études de faisabilité', to: '/etudes-faisabilite' };
const RIEN = () => Promise.resolve();

function EtudeExistante({ id }: Readonly<{ id: string }>) {
  const { data: fiche, error, refetch } = useApi(() => getEtudeFaisabilite(id), [id]);
  const [version, setVersion] = useState(0);
  const [erreurAction, setErreurAction] = useState<string | null>(null);
  const navigate = useNavigate();
  const confirm = useConfirm();
  const showToast = useToast();

  /** Relit l'étude, puis remonte les onglets pour repartir d'un brouillon propre. */
  async function rafraichir() {
    await refetch();
    setVersion((v) => v + 1);
  }

  async function agir(action: () => Promise<unknown>, titre: string, message: string, libelle: string, reussite: string) {
    if (!(await confirm({ title: titre, message, confirmLabel: libelle }))) return;
    setErreurAction(null);
    try {
      await action();
      showToast(reussite);
    } catch (err) {
      setErreurAction(errorMessage(err));
    }
  }

  if (error) return <PageShell title="Étude de faisabilité" crumbs={[{ label: 'Patrimoine' }, LISTE]}><ErrorState message={error} /></PageShell>;
  if (!fiche) return <PageShell title="Étude de faisabilité" crumbs={[{ label: 'Patrimoine' }, LISTE]}><LoadingState /></PageShell>;

  const supprimer = () => agir(
    async () => { await deleteEtudeFaisabilite(id); void navigate(LISTE.to); },
    "Supprimer l'étude", "L'étude, ses unités de base, ses tranches et son historique seront supprimés. Continuer ?", 'Supprimer', 'Étude supprimée.',
  );
  const bascule = fiche.bloquee
    ? () => agir(async () => { await debloquerEtude(id); await rafraichir(); }, "Débloquer l'étude", "L'étude redevient modifiable. Continuer ?", 'Débloquer', 'Étude débloquée.')
    : () => agir(async () => { await bloquerEtude(id); await rafraichir(); }, "Bloquer l'étude", "Bloquer enregistre l'étude (contrôles Verif) puis la verrouille. Continuer ?", 'Bloquer', 'Étude bloquée.');

  return (
    <PageShell
      title={fiche.description || fiche.code}
      crumbs={[{ label: 'Patrimoine' }, LISTE, { label: fiche.code }]}
      icon={<Ruler />}
      fullHeight
      actions={(
        <>
          {fiche.statutLibelle && <Badge tone={toneStatut(fiche.statutCouleur)}>{fiche.statutLibelle}</Badge>}
          {fiche.bloquee && <Badge tone="neutral">Bloquée</Badge>}
          {fiche.previsionsARecalculer && <Badge tone="warning">Prévisions à recalculer (P8b)</Badge>}
          <ActionAdmin variant="outline" onClick={() => void bascule()} libelle={fiche.bloquee ? 'Débloquer' : 'Bloquer'}
            icone={fiche.bloquee ? <LockOpen data-icon="inline-start" /> : <Lock data-icon="inline-start" />} />
          <ActionAdmin variant="outline" onClick={() => void supprimer()} libelle="Supprimer" icone={<Trash2 data-icon="inline-start" />} />
        </>
      )}
    >
      <OngletsEtude key={version} fiche={fiche} recharger={refetch} onEnregistre={() => void rafraichir()}
        entete={erreurAction && <p role="alert" className="text-body text-destructive">{erreurAction}</p>} />
    </PageShell>
  );
}

export default function EtudeFaisabiliteDetail() {
  const { id } = useParams();
  return (
    <GardeEtudes>
      {id ? <EtudeExistante key={id} id={id} /> : (
        <AdminGuard title="Nouvelle étude de faisabilité" icon={<Ruler />} fullHeight
          crumbs={[{ label: 'Patrimoine' }, LISTE, { label: 'Nouvelle étude' }]}>
          <OngletsEtude recharger={RIEN} onEnregistre={() => undefined} />
        </AdminGuard>
      )}
    </GardeEtudes>
  );
}
