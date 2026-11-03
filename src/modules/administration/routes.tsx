import { lazy } from 'react';
import { Settings } from 'lucide-react';
import type { ModuleApp } from '../types';
import { arbreAdministration } from './arbre';

const UtilisateursList = lazy(() => import('../../pages/utilisateurs/UtilisateursList'));
const ReinitialiserMotDePasse = lazy(() => import('../../pages/utilisateurs/ReinitialiserMotDePasse'));
const ClesApiList = lazy(() => import('../../pages/utilisateurs/ClesApiList'));
const ModelesDocumentsList = lazy(() => import('../../pages/modeles/ModelesDocumentsList'));
const EditeurModele = lazy(() => import('../../pages/modeles/EditeurModele'));
const ReferentielTachePage = lazy(() => import('../../pages/administration/ReferentielTachePage'));
const EmailHistorique = lazy(() => import('../../pages/administration/EmailHistorique'));
const SessionsList = lazy(() => import('../../pages/administration/SessionsList'));
const FichesVerrouilleesList = lazy(() => import('../../pages/administration/FichesVerrouilleesList'));
const ActionsList = lazy(() => import('../../pages/administration/ActionsList'));
const HistoriqueList = lazy(() => import('../../pages/administration/HistoriqueList'));
const RolesList = lazy(() => import('../../pages/administration/RolesList'));
const TachesList =lazy(() => import('../../pages/administration/TachesList'));
const CalendrierRendezVous = lazy(() => import('../../pages/administration/CalendrierRendezVous'));
const TiersList = lazy(() => import('../../pages/tiers/TiersList'));
const TiersFiche = lazy(() => import('../../pages/tiers/TiersFiche'));

const administration: ModuleApp = {
  slug: 'administration',
  label: 'Administration',
  icon: Settings,
  ordre: 9,
  path: '/utilisateurs',
  reserveAdmin: true,
  prefixes: ['/utilisateurs', '/cles-api', '/modeles-documents', '/administration'],
  arbre: arbreAdministration,
  routes: [
    { path: '/utilisateurs', element: <UtilisateursList /> },
    { path: '/utilisateurs/reinitialiser-mot-de-passe', element: <ReinitialiserMotDePasse /> },
    { path: '/cles-api', element: <ClesApiList /> },
    { path: '/modeles-documents', element: <ModelesDocumentsList /> },
    { path: '/modeles-documents/:id', element: <EditeurModele /> },
    { path: '/administration/type-tache', element: <ReferentielTachePage /> },
    { path: '/administration/priorite-tache', element: <ReferentielTachePage /> },
    { path: '/administration/roles/:id?', element: <RolesList /> },
    { path: '/administration/taches/:id?', element: <TachesList /> },
    { path: '/administration/calendrier/:id?', element: <CalendrierRendezVous /> },
    { path: '/administration/email-historique', element: <EmailHistorique /> },
    { path: '/administration/sessions', element: <SessionsList /> },
    { path: '/administration/fiches-verrouillees', element: <FichesVerrouilleesList /> },
    { path: '/administration/actions', element: <ActionsList /> },
    { path: '/administration/historique', element: <HistoriqueList /> },
    { path: '/administration/fournisseurs', element: <TiersList famille="fournisseurs" /> },
    { path: '/administration/fournisseurs/nouveau', element: <TiersFiche famille="fournisseurs" /> },
    { path: '/administration/fournisseurs/:id', element: <TiersFiche famille="fournisseurs" /> },
    { path: '/administration/contacts', element: <TiersList famille="contacts" /> },
    { path: '/administration/contacts/nouveau', element: <TiersFiche famille="contacts" /> },
    { path: '/administration/contacts/:id', element: <TiersFiche famille="contacts" /> },
  ],
};

export default administration;
