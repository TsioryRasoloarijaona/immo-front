import { lazy } from 'react';
import { Bot, FileCode2, KeyRound, Settings, Users } from 'lucide-react';
import type { ModuleApp } from '../types';

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
  menu: {
    titre: 'Administration',
    entrees: [
      { to: '/utilisateurs', libelle: 'Comptes utilisateurs', Icone: Users, exact: true },
      { to: '/utilisateurs/reinitialiser-mot-de-passe', libelle: 'Réinitialiser un mot de passe', Icone: KeyRound },
      { to: '/cles-api', libelle: "Clés d'API", tooltip: "Clés d'API — clients machine (n8n, agents)", Icone: Bot },
      { to: '/modeles-documents', libelle: 'Modèles de documents', tooltip: 'Modèles de documents — actes, lettres, fiches', Icone: FileCode2 },
    ],
  },
  routes: [
    { path: '/utilisateurs', element: <UtilisateursList /> },
    { path: '/utilisateurs/reinitialiser-mot-de-passe', element: <ReinitialiserMotDePasse /> },
    { path: '/cles-api', element: <ClesApiList /> },
    { path: '/modeles-documents', element: <ModelesDocumentsList /> },
    { path: '/modeles-documents/:id', element: <EditeurModele /> },
  ],
};

export default administration;
