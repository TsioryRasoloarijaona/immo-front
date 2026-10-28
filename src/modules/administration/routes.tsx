import { lazy } from 'react';
import { Settings } from 'lucide-react';
import type { ModuleApp } from '../types';
import { arbreAdministration } from './arbre';

const UtilisateursList = lazy(() => import('../../pages/utilisateurs/UtilisateursList'));
const ReinitialiserMotDePasse = lazy(() => import('../../pages/utilisateurs/ReinitialiserMotDePasse'));
const ClesApiList = lazy(() => import('../../pages/utilisateurs/ClesApiList'));
const ModelesDocumentsList = lazy(() => import('../../pages/modeles/ModelesDocumentsList'));
const EditeurModele = lazy(() => import('../../pages/modeles/EditeurModele'));

const administration: ModuleApp = {
  slug: 'administration',
  label: 'Administration',
  icon: Settings,
  ordre: 9,
  path: '/utilisateurs',
  reserveAdmin: true,
  prefixes: ['/utilisateurs', '/cles-api', '/modeles-documents'],
  arbre: arbreAdministration,
  routes: [
    { path: '/utilisateurs', element: <UtilisateursList /> },
    { path: '/utilisateurs/reinitialiser-mot-de-passe', element: <ReinitialiserMotDePasse /> },
    { path: '/cles-api', element: <ClesApiList /> },
    { path: '/modeles-documents', element: <ModelesDocumentsList /> },
    { path: '/modeles-documents/:id', element: <EditeurModele /> },
  ],
};

export default administration;
