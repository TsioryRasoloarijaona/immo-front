import { lazy } from 'react';
import { CircleCheck, HardHat, Palette, Users } from 'lucide-react';
import type { ModuleApp } from '../types';
import { arbreProjet } from './arbre';

const LotsList = lazy(() => import('../../pages/projet/LotsList'));
const LotDetail = lazy(() => import('../../pages/projet/LotDetail'));
const DecomptesList = lazy(() => import('../../pages/projet/DecomptesList'));
const DecompteDetail = lazy(() => import('../../pages/projet/DecompteDetail'));
const ReunionsList = lazy(() => import('../../pages/projet/ReunionsList'));
const ReferentielProjetPage = lazy(() => import('../../pages/projet/config/ReferentielProjetPage'));
const DepensesProjet = lazy(() => import('../../pages/projet/DepensesProjet'));
const DepensesProjetListe = lazy(() => import('../../pages/projet/DepensesProjetListe'));
const ReglementsProjetList = lazy(() => import('../../pages/projet/ReglementsProjetList'));
const ProjetsConfigList = lazy(() => import('../../pages/projet/config/ProjetsConfigList'));
const ReferentielTypesLotPage = lazy(() => import('../../pages/projet/config/ReferentielTypesLotPage'));
const StatutsLotList = lazy(() => import('../../pages/projet/config/StatutsLotList'));
const ModelesSimulationList = lazy(() => import('../../pages/projet/config/ModelesSimulationList'));

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
    { path: '/projet/reunions/:id?', element: <ReunionsList /> },
    { path: '/projet/depenses', element: <DepensesProjet /> },
    { path: '/projet/depenses/factures/:id?', element: <DepensesProjetListe nature="factures" /> },
    { path: '/projet/depenses/documents-a-regler/:id?', element: <DepensesProjetListe nature="documents-a-regler" /> },
    { path: '/projet/depenses/avoirs/:id?', element: <DepensesProjetListe nature="avoirs" /> },
    { path: '/projet/depenses/impayes/:id?', element: <DepensesProjetListe nature="impayes" /> },
    { path: '/projet/depenses/reglements', element: <ReglementsProjetList /> },
    { path: '/projet/config/projets', element: <ProjetsConfigList /> },
    { path: '/projet/config/types-lot', element: <ReferentielTypesLotPage /> },
    { path: '/projet/config/statuts-lot', element: <StatutsLotList /> },
    { path: '/projet/config/modeles-simulation', element: <ModelesSimulationList /> },
    { path: '/projet/config/types-reunion', element: <ReferentielProjetPage slug="types-reunion" titre="Types de réunion" icone={<Users />} /> },
    { path: '/projet/config/statuts-reserves', element: <ReferentielProjetPage slug="statuts-reserves" titre="Statuts des réserves" icone={<CircleCheck />} /> },
    { path: '/projet/config/plages-couleurs', element: <ReferentielProjetPage slug="plages-couleurs" titre="Plages de couleurs" icone={<Palette />} /> },
  ],
};

export default projet;
