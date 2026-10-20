import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { estCommercialTerrain } from '../../lib/roles';

const Dashboard = lazy(() => import('../../pages/Dashboard'));

/** Le commercial de terrain arrive sur « Ma journée » ; les autres rôles gardent le tableau de bord. */
export default function Accueil() {
  const { user } = useAuth();
  return estCommercialTerrain(user) ? <Navigate to="/journee" replace /> : <Dashboard />;
}
