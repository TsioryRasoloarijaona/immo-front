import { lazy } from 'react';
import { Folder } from 'lucide-react';
import type { ModuleApp } from '../types';
import Accueil from './Accueil';
import { arbreVente } from './arbre';

const Dashboard = lazy(() => import('../../pages/Dashboard'));
const MaJournee = lazy(() => import('../../pages/parcours/MaJournee'));
const BoiteDeTri = lazy(() => import('../../pages/parcours/BoiteDeTri'));
const Profil = lazy(() => import('../../pages/profil/Profil'));
const PerformancesCommerciaux = lazy(() => import('../../pages/kpi/PerformancesCommerciaux'));
const MesPerformances = lazy(() => import('../../pages/kpi/MesPerformances'));
const MonEquipe = lazy(() => import('../../pages/equipe/MonEquipe'));
const Calendrier = lazy(() => import('../../pages/calendrier/Calendrier'));
const Hotline = lazy(() => import('../../pages/hotline/Hotline'));
const SuiviActionsList = lazy(() => import('../../pages/actions/SuiviActionsList'));
const EtatDesVentes = lazy(() => import('../../pages/etatVentes/EtatDesVentes'));
const SuiviAffectations = lazy(() => import('../../pages/suiviAffectations/SuiviAffectations'));
const HistoriqueVentes = lazy(() => import('../../pages/historiqueVentes/HistoriqueVentes'));
const SuiviCommerciaux = lazy(() => import('../../pages/suiviCommerciaux/SuiviCommerciaux'));
const ProspectionsList = lazy(() => import('../../pages/prospections/ProspectionsList'));
const PreProspectionsList = lazy(() => import('../../pages/prospections/PreProspectionsList'));
const ImportPreProspections = lazy(() => import('../../pages/prospections/ImportPreProspections'));
const OffresList = lazy(() => import('../../pages/prospections/OffresList'));
const EncaissementsList = lazy(() => import('../../pages/encaissements/EncaissementsList'));
const ImpayesList = lazy(() => import('../../pages/impayes/ImpayesList'));
const DesistementsList = lazy(() => import('../../pages/desistements/DesistementsList'));
const ProspectsList = lazy(() => import('../../pages/prospects/ProspectsList'));
const NewProspect = lazy(() => import('../../pages/prospects/NewProspect'));
const ClientsList = lazy(() => import('../../pages/clients/ClientsList'));
const NewDossier = lazy(() => import('../../pages/dossiers/NewDossier'));
const DossiersList = lazy(() => import('../../pages/dossiers/DossiersList'));
const PlansAccueil = lazy(() => import('../../pages/tranches/PlansAccueil'));
const CommissionsList = lazy(() => import('../../pages/commissions/CommissionsList'));
const Aide = lazy(() => import('../../pages/aide/Aide'));
const ListeRapports = lazy(() => import('../../pages/rapports/ListeRapports'));
const Rapport = lazy(() => import('../../pages/rapports/Rapport'));
const SuiviPrevisions = lazy(() => import('../../pages/suiviPrevisions/SuiviPrevisions'));

const vente: ModuleApp = {
  slug: 'vente',
  label: 'Vente',
  icon: Folder,
  ordre: 1,
  path: '/prospections',
  // Le tableau de bord n'existe que pour la vente ; profil et performances suivent le menu Vente.
  prefixes: [
    '/', '/tableau-de-bord', '/profil', '/mes-performances', '/hotline', '/calendrier', '/suivi-actions',
    '/etat-des-ventes', '/suivi-commerciaux', '/suivi-affectations', '/performances', '/equipe', '/journee', '/tri',
    '/prospections', '/pre-prospections', '/prospects', '/clients', '/dossiers', '/offres', '/encaissements',
    '/impayes', '/desistements', '/aide', '/rapports', '/historique-ventes',
    '/suivi-previsions', '/commissions', '/plans',
  ],
  arbre: arbreVente,
  routes: [
    { path: '/', element: <Accueil /> },
    { path: '/tableau-de-bord', element: <Dashboard /> },
    { path: '/journee', element: <MaJournee /> },
    { path: '/tri', element: <BoiteDeTri /> },
    { path: '/profil', element: <Profil /> },
    { path: '/performances', element: <PerformancesCommerciaux /> },
    { path: '/mes-performances', element: <MesPerformances /> },
    { path: '/equipe', element: <MonEquipe /> },
    { path: '/hotline', element: <Hotline /> },
    { path: '/calendrier', element: <Calendrier /> },
    { path: '/suivi-actions', element: <SuiviActionsList /> },
    { path: '/etat-des-ventes', element: <EtatDesVentes /> },
    { path: '/suivi-commerciaux', element: <SuiviCommerciaux /> },
    { path: '/suivi-affectations', element: <SuiviAffectations /> },
    { path: '/historique-ventes', element: <HistoriqueVentes /> },
    { path: '/suivi-previsions', element: <SuiviPrevisions /> },
    // Une seule route par liste : `/prospections/:id` garde la liste montée avec la fiche ouverte en fenêtre.
    { path: '/prospections/:id?', element: <ProspectionsList /> },
    // La saisie est une boîte, pas une page : la route rend la liste avec la boîte ouverte.
    { path: '/prospections/nouveau', element: <ProspectionsList nouveau /> },
    { path: '/pre-prospections/:id?', element: <PreProspectionsList /> },
    { path: '/pre-prospections/nouveau', element: <PreProspectionsList nouveau /> },
    { path: '/pre-prospections/import', element: <ImportPreProspections /> },
    { path: '/prospections/:id/nouveau-dossier', element: <NewDossier /> },
    { path: '/offres/:id?', element: <OffresList /> },
    { path: '/encaissements/:id?', element: <EncaissementsList /> },
    { path: '/impayes', element: <ImpayesList /> },
    { path: '/desistements/:id?', element: <DesistementsList /> },
    { path: '/prospects/:id?', element: <ProspectsList /> },
    { path: '/prospects/nouveau', element: <NewProspect /> },
    { path: '/clients/:id?', element: <ClientsList /> },
    // Une seule route : `/dossiers/:id` garde la liste montée (filtres, page) avec la fiche ouverte en fenêtre.
    { path: '/dossiers/:id?', element: <DossiersList /> },
    { path: '/commissions/:trancheId?', element: <CommissionsList /> },
    { path: '/rapports', element: <ListeRapports module="vente" /> },
    { path: '/rapports/:code', element: <Rapport module="vente" /> },
    { path: '/plans', element: <PlansAccueil /> },
    { path: '/aide', element: <Aide /> },
    { path: '/aide/:slug', element: <Aide /> },
  ],
};

export default vente;
