import { lazy } from 'react';
import { HardHat } from 'lucide-react';
import type { ModuleApp } from '../types';
import { arbreProjet } from './arbre';

const LotsList = lazy(() => import('../../pages/projet/LotsList'));
const LotDetail = lazy(() => import('../../pages/projet/LotDetail'));
const DecomptesList = lazy(() => import('../../pages/projet/DecomptesList'));
const DecompteDetail = lazy(() => import('../../pages/projet/DecompteDetail'));
const DepensesProjet = lazy(() => import('../../pages/projet/DepensesProjet'));
const DepensesProjetListe = lazy(() => import('../../pages/projet/DepensesProjetListe'));
const ReglementsProjetList = lazy(() => import('../../pages/projet/ReglementsProjetList'));
const ProjetsConfigList = lazy(() => import('../../pages/projet/config/ProjetsConfigList'));
const ReferentielTypesLotPage = lazy(() => import('../../pages/projet/config/ReferentielTypesLotPage'));
const StatutsLotList = lazy(() => import('../../pages/projet/config/StatutsLotList'));

const projet: ModuleApp = {
  slug: 'projet',
  label: 'Projet',
  icon: HardHat,
  ordre: 3,
  path: '/projet/lots',
  prefixes: ['/projet/'],
  arbre: arbreProjet,
  routes: [
    { path: '/projet/lots', element: <LotsList /> },
    { path: '/projet/lots/:id', element: <LotDetail /> },
    { path: '/projet/decomptes', element: <DecomptesList /> },
    { path: '/projet/decomptes/:id', element: <DecompteDetail /> },
    { path: '/projet/depenses', element: <DepensesProjet /> },
    { path: '/projet/depenses/factures/:id?', element: <DepensesProjetListe nature="factures" /> },
    { path: '/projet/depenses/documents-a-regler/:id?', element: <DepensesProjetListe nature="documents-a-regler" /> },
    { path: '/projet/depenses/avoirs/:id?', element: <DepensesProjetListe nature="avoirs" /> },
    { path: '/projet/depenses/impayes/:id?', element: <DepensesProjetListe nature="impayes" /> },
    { path: '/projet/depenses/reglements', element: <ReglementsProjetList /> },
    { path: '/projet/config/projets', element: <ProjetsConfigList /> },
    { path: '/projet/config/types-lot', element: <ReferentielTypesLotPage /> },
    { path: '/projet/config/statuts-lot', element: <StatutsLotList /> },
  ],
};

export default projet;
