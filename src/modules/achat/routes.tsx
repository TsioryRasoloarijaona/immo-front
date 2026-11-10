import { lazy } from 'react';
import { ShoppingCart } from 'lucide-react';
import type { ModuleApp } from '../types';
import { arbreAchat } from './arbre';

const DocumentsAchatList = lazy(() => import('../../pages/achat/DocumentsAchatList'));

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
    { path: '/achat/documents', element: <DocumentsAchatList /> },
    { path: '/achat/documents/:id', element: <DocumentsAchatList /> },
    { path: '/achat/fournisseurs', element: <SoldesFournisseursList /> },
  ],
};

export default achat;
