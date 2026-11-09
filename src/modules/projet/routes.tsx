import { lazy } from 'react';
import { HardHat } from 'lucide-react';
import type { ModuleApp } from '../types';
import { arbreProjet } from './arbre';

const LotsList = lazy(() => import('../../pages/projet/LotsList'));
const LotDetail = lazy(() => import('../../pages/projet/LotDetail'));
const DecomptesList = lazy(() => import('../../pages/projet/DecomptesList'));
const DecompteDetail = lazy(() => import('../../pages/projet/DecompteDetail'));

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
  ],
};

export default projet;
