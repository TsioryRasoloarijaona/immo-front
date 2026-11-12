import { lazy } from 'react';
import { ShoppingCart } from 'lucide-react';
import type { ModuleApp } from '../types';
import { VUES_ACHAT } from '../../lib/vuesAchat';
import { arbreAchat } from './arbre';

const DocumentsAchatList = lazy(() => import('../../pages/achat/DocumentsAchatList'));
const StatutsAchatList = lazy(() => import('../../pages/achat/config/StatutsAchatList'));
const TransitionsAchatList = lazy(() => import('../../pages/achat/config/TransitionsAchatList'));

const SoldesFournisseursList = lazy(() => import('../../pages/achat/SoldesFournisseursList'));

const achat: ModuleApp = {
  slug: 'achat',
  label: 'Achat',
  icon: ShoppingCart,
  ordre: 4,
  path: '/achat/documents',
  prefixes: ['/achat/'],
  arbre: arbreAchat,
  routes: [
    ...VUES_ACHAT.flatMap((v) => [
      { path: v.chemin, element: <DocumentsAchatList key={v.cle} vue={v} /> },
      { path: `${v.chemin}/:id`, element: <DocumentsAchatList key={v.cle} vue={v} /> },
    ]),
    { path: '/achat/fournisseurs', element: <SoldesFournisseursList /> },
    { path: '/achat/config/statuts', element: <StatutsAchatList /> },
    { path: '/achat/config/transitions', element: <TransitionsAchatList /> },
  ],
};

export default achat;
