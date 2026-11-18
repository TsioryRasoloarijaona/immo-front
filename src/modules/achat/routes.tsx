import { lazy } from 'react';
import { Building2, Layers, ListTree, ShoppingCart } from 'lucide-react';
import type { ModuleApp } from '../types';
import { VUES_ACHAT } from '../../lib/vuesAchat';
import { VUES_RECETTES } from '../../lib/tresorerie';
import { arbreAchat } from './arbre';

const DocumentsAchatList = lazy(() => import('../../pages/achat/DocumentsAchatList'));
const StatutsAchatList = lazy(() => import('../../pages/achat/config/StatutsAchatList'));
const TransitionsAchatList = lazy(() => import('../../pages/achat/config/TransitionsAchatList'));
const ArticlesAchatList = lazy(() => import('../../pages/achat/config/ArticlesAchatList'));
const ReferentielAchatPage = lazy(() => import('../../pages/achat/config/ReferentielAchatPage'));

const SoldesFournisseursList = lazy(() => import('../../pages/achat/SoldesFournisseursList'));
const TvaDeductible = lazy(() => import('../../pages/achat/etats/TvaDeductible'));
const SuiviAvances = lazy(() => import('../../pages/achat/etats/SuiviAvances'));
const SuiviRetenues = lazy(() => import('../../pages/achat/etats/SuiviRetenues'));
const ListeRapports = lazy(() => import('../../pages/rapports/ListeRapports'));
const Rapport = lazy(() => import('../../pages/rapports/Rapport'));
const DecaissementsList =lazy(() => import('../../pages/tresorerie/DecaissementsList'));
const AffectationsList = lazy(() => import('../../pages/tresorerie/AffectationsList'));
const RecettesList = lazy(() => import('../../pages/tresorerie/RecettesList'));

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
    { path: '/achat/depenses/decaissements/:id?', element: <DecaissementsList key="achat" module="BUY" /> },
    { path: '/achat/depenses/affectations', element: <AffectationsList key="debit" module="BUY" sens="DEBIT" /> },
    { path: '/achat/recettes/affectations', element: <AffectationsList key="credit" module="BUY" sens="CREDIT" /> },
    ...VUES_RECETTES.map((vue) => ({ path: `/achat/recettes/${vue}`, element: <RecettesList key={vue} vue={vue} module="BUY" /> })),
    { path: '/achat/fournisseurs', element: <SoldesFournisseursList /> },
    { path: '/achat/etats/tva', element: <TvaDeductible /> },
    { path: '/achat/etats/avances', element: <SuiviAvances /> },
    { path: '/achat/etats/retenues-garantie', element: <SuiviRetenues /> },
    { path: '/achat/rapports', element: <ListeRapports module="achat" /> },
    { path: '/achat/rapports/:code', element: <Rapport module="achat" /> },
    { path: '/achat/config/statuts', element: <StatutsAchatList /> },
    { path: '/achat/config/transitions', element: <TransitionsAchatList /> },
    { path: '/achat/config/familles', element: <ReferentielAchatPage slug="familles-achat" titre="Familles" icone={<Layers />} /> },
    { path: '/achat/config/sous-familles', element: <ReferentielAchatPage slug="sous-familles-achat" titre="Sous-familles" icone={<ListTree />} /> },
    { path: '/achat/config/natures-fournisseur', element: <ReferentielAchatPage slug="natures-fournisseur" titre="Natures fournisseur" icone={<Building2 />} /> },
    { path: '/achat/config/articles', element: <ArticlesAchatList /> },
  ],
};

export default achat;
