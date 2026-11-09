import { lazy } from 'react';
import { HardHat } from 'lucide-react';
import type { ModuleApp } from '../types';
import { arbreProjet } from './arbre';

const EcranProjet = lazy(() => import('./maquette/EcranProjet'));

const projet: ModuleApp = {
  slug: 'projet',
  label: 'Projet',
  icon: HardHat,
  ordre: 3,
  path: '/projet/lots',
  prefixes: ['/projet/'],
  arbre: arbreProjet,
  routes: [{ path: '/projet/:ecran/:id?', element: <EcranProjet /> }],
};

export default projet;
