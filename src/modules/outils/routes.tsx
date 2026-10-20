import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import { Hammer } from 'lucide-react';
import type { ModuleApp } from '../types';
import MenuOutils from './MenuOutils';

const NouvelOrdre = lazy(() => import('../../pages/outils/virements/NouvelOrdre'));
const HistoriqueVirements = lazy(() => import('../../pages/outils/virements/HistoriqueVirements'));
const BeneficiairesVirement = lazy(() => import('../../pages/outils/virements/Beneficiaires'));
const SocietesVirement = lazy(() => import('../../pages/outils/virements/Societes'));
const JournalVirement = lazy(() => import('../../pages/outils/virements/Journal'));
const TableauDeBordSyndic = lazy(() => import('../../pages/outils/syndic/TableauDeBordSyndic'));
const AppartementsSyndic = lazy(() => import('../../pages/outils/syndic/AppartementsSyndic'));
const FicheAppartementSyndic = lazy(() => import('../../pages/outils/syndic/FicheAppartementSyndic'));
const NouveauPaiementSyndic = lazy(() => import('../../pages/outils/syndic/NouveauPaiementSyndic'));
const PaiementsSyndic = lazy(() => import('../../pages/outils/syndic/PaiementsSyndic'));
const QuiDoitSyndic = lazy(() => import('../../pages/outils/syndic/QuiDoitSyndic'));
const NouvelAppartementSyndic = lazy(() => import('../../pages/outils/syndic/NouvelAppartementSyndic'));
const ProprietaireSyndic = lazy(() => import('../../pages/outils/syndic/ProprietaireSyndic'));
const OuvrirExerciceSyndic = lazy(() => import('../../pages/outils/syndic/OuvrirExerciceSyndic'));
const ReglagesSyndic = lazy(() => import('../../pages/outils/syndic/ReglagesSyndic'));

const NOUVEL_ORDRE = '/outils/virements/nouveau';

const outils: ModuleApp = {
  slug: 'outils',
  label: 'Outils',
  icon: Hammer,
  ordre: 10,
  path: NOUVEL_ORDRE,
  adminOnly: true,
  reserveAdmin: true,
  prefixes: ['/outils'],
  Menu: MenuOutils,
  routes: [
    { path: '/outils', element: <Navigate to={NOUVEL_ORDRE} replace /> },
    { path: '/outils/virements', element: <Navigate to={NOUVEL_ORDRE} replace /> },
    { path: NOUVEL_ORDRE, element: <NouvelOrdre /> },
    { path: '/outils/virements/historique', element: <HistoriqueVirements /> },
    { path: '/outils/virements/beneficiaires', element: <BeneficiairesVirement /> },
    { path: '/outils/virements/societes', element: <SocietesVirement /> },
    { path: '/outils/virements/journal', element: <JournalVirement /> },
    { path: '/outils/syndic', element: <Navigate to="/outils/syndic/tableau-de-bord" replace /> },
    { path: '/outils/syndic/tableau-de-bord', element: <TableauDeBordSyndic /> },
    { path: '/outils/syndic/appartements', element: <AppartementsSyndic /> },
    { path: '/outils/syndic/appartements/nouveau', element: <NouvelAppartementSyndic /> },
    { path: '/outils/syndic/appartements/:code', element: <FicheAppartementSyndic /> },
    { path: '/outils/syndic/proprietaires/:id', element: <ProprietaireSyndic /> },
    { path: '/outils/syndic/exercices/nouveau', element: <OuvrirExerciceSyndic /> },
    { path: '/outils/syndic/reglages', element: <ReglagesSyndic /> },
    { path: '/outils/syndic/paiement/nouveau', element: <NouveauPaiementSyndic /> },
    { path: '/outils/syndic/paiements', element: <PaiementsSyndic /> },
    { path: '/outils/syndic/qui-doit', element: <QuiDoitSyndic /> },
  ],
};

export default outils;
