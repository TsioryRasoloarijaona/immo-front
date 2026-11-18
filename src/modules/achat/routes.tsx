import { lazy } from 'react';
import { Building2, Layers, ListTree, ShoppingCart } from 'lucide-react';
import type { ModuleApp } from '../types';
import { VUES_ACHAT } from '../../lib/vuesAchat';
import { arbreAchat } from './arbre';

const DocumentsAchatList = lazy(() => import('../../pages/achat/DocumentsAchatList'));
const StatutsAchatList = lazy(() => import('../../pages/achat/config/StatutsAchatList'));
const TransitionsAchatList = lazy(() => import('../../pages/achat/config/TransitionsAchatList'));
const ArticlesAchatList = lazy(() => import('../../pages/achat/config/ArticlesAchatList'));
const ReferentielAchatPage = lazy(() => import('../../pages/achat/config/ReferentielAchatPage'));

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
    { path: '/achat/config/familles', element: <ReferentielAchatPage slug="familles-achat" titre="Familles" icone={<Layers />} /> },
    { path: '/achat/config/sous-familles', element: <ReferentielAchatPage slug="sous-familles-achat" titre="Sous-familles" icone={<ListTree />} /> },
    { path: '/achat/config/natures-fournisseur', element: <ReferentielAchatPage slug="natures-fournisseur" titre="Natures fournisseur" icone={<Building2 />} /> },
    { path: '/achat/config/articles', element: <ArticlesAchatList /> },
  ],
};

export default achat;
