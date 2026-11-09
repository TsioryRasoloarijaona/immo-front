import { lazy } from 'react';
import { ShoppingCart } from 'lucide-react';
import type { ModuleApp } from '../types';
import { arbreAchat } from './arbre';

const EcranAchat = lazy(() => import('./maquette/EcranAchat'));

const achat: ModuleApp = {
  slug: 'achat',
  label: 'Achat',
  icon: ShoppingCart,
  ordre: 4,
  path: '/achat/consultations',
  prefixes: ['/achat/'],
  arbre: arbreAchat,
  routes: [{ path: '/achat/:ecran/:id?', element: <EcranAchat /> }],
};

export default achat;
