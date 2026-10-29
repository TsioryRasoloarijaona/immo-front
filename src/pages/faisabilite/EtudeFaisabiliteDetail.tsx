import { Ruler } from 'lucide-react';
import GardeEtudes from '../../components/faisabilite/GardeEtudes';
import OngletsEtude from '../../components/faisabilite/OngletsEtude';
import AdminGuard from '../utilisateurs/AdminGuard';

const RIEN = () => Promise.resolve();

/** Création d'une étude (`/etudes-faisabilite/nouveau`) ; l'étude existante s'ouvre en fenêtre sur la liste. */
export default function EtudeFaisabiliteDetail() {
  return (
    <GardeEtudes>
      <AdminGuard title="Nouvelle étude de faisabilité" icon={<Ruler />} fullHeight
        crumbs={[{ label: 'Patrimoine' }, { label: 'Études de faisabilité', to: '/etudes-faisabilite' }, { label: 'Nouvelle étude' }]}>
        <OngletsEtude recharger={RIEN} onEnregistre={() => undefined} />
      </AdminGuard>
    </GardeEtudes>
  );
}
