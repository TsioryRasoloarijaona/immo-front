import { lazy } from 'react';
import { CircleCheck, HardHat, Palette, Users } from 'lucide-react';
import type { ModuleApp } from '../types';
import { VUES_RECETTES } from '../../lib/tresorerie';
import { arbreProjet } from './arbre';

const LotsList = lazy(() => import('../../pages/projet/LotsList'));
const LotDetail = lazy(() => import('../../pages/projet/LotDetail'));
const DecomptesList = lazy(() => import('../../pages/projet/DecomptesList'));
const DecompteDetail = lazy(() => import('../../pages/projet/DecompteDetail'));
const ReunionsList = lazy(() => import('../../pages/projet/ReunionsList'));
const TravauxChantierList = lazy(() => import('../../pages/projet/TravauxChantierList'));
const ModificationsProjetList = lazy(() => import('../../pages/projet/ModificationsProjetList'));
const PrevisionsProjet = lazy(() => import('../../pages/projet/PrevisionsProjet'));
const ReferentielProjetPage = lazy(() => import('../../pages/projet/config/ReferentielProjetPage'));
const DepensesProjet = lazy(() => import('../../pages/projet/DepensesProjet'));
const DepensesProjetListe = lazy(() => import('../../pages/projet/DepensesProjetListe'));
const DecaissementsList = lazy(() => import('../../pages/tresorerie/DecaissementsList'));
const AffectationsList = lazy(() => import('../../pages/tresorerie/AffectationsList'));
const RecettesList = lazy(() => import('../../pages/tresorerie/RecettesList'));
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
    { path: '/projet/previsions', element: <PrevisionsProjet /> },
    { path: '/projet/travaux-chantier/:id?', element: <TravauxChantierList /> },
    { path: '/projet/modifications/:id?', element: <ModificationsProjetList /> },
    { path: '/projet/depenses', element: <DepensesProjet /> },
    { path: '/projet/depenses/factures/:id?', element: <DepensesProjetListe nature="factures" /> },
    { path: '/projet/depenses/documents-a-regler/:id?', element: <DepensesProjetListe nature="documents-a-regler" /> },
    { path: '/projet/depenses/avoirs/:id?', element: <DepensesProjetListe nature="avoirs" /> },
    { path: '/projet/depenses/impayes/:id?', element: <DepensesProjetListe nature="impayes" /> },
    { path: '/projet/depenses/decaissements/:id?', element: <DecaissementsList module="PRJ" /> },
    { path: '/projet/depenses/affectations', element: <AffectationsList key="debit" module="PRJ" sens="DEBIT" /> },
    { path: '/projet/recettes/affectations', element: <AffectationsList key="credit" module="PRJ" sens="CREDIT" /> },
    ...VUES_RECETTES.map((vue) => ({ path: `/projet/recettes/${vue}`, element: <RecettesList key={vue} vue={vue} module="PRJ" /> })),
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
