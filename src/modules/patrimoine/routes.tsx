import { lazy } from 'react';
import { Building2 } from 'lucide-react';
import type { ModuleApp } from '../types';
import { arbrePatrimoine } from './arbre';

const ProjetsList = lazy(() => import('../../pages/projets/ProjetsList'));
const ProjetDetail = lazy(() => import('../../pages/projets/ProjetDetail'));
const ProjetForm = lazy(() => import('../../pages/projets/ProjetForm'));
const TranchesList = lazy(() => import('../../pages/tranches/TranchesList'));
const TrancheDetail = lazy(() => import('../../pages/tranches/TrancheDetail'));
const TrancheForm = lazy(() => import('../../pages/tranches/TrancheForm'));
const PlansTranche = lazy(() => import('../../pages/tranches/PlansTranche'));
const ArticlesList = lazy(() => import('../../pages/articles/ArticlesList'));
const ArticleDetail = lazy(() => import('../../pages/articles/ArticleDetail'));
const ArticleForm = lazy(() => import('../../pages/articles/ArticleForm'));
const AttachementMasse = lazy(() => import('../../pages/articles/AttachementMasse'));
const ImportPatrimoine = lazy(() => import('../../pages/import/ImportPatrimoine'));
const SousArticlesList = lazy(() => import('../../pages/sous-articles/SousArticlesList'));
const TerrainsList = lazy(() => import('../../pages/terrains/TerrainsList'));
const TerrainDetail = lazy(() => import('../../pages/terrains/TerrainDetail'));
const TerrainForm = lazy(() => import('../../pages/terrains/TerrainForm'));
const LotissementDetail = lazy(() => import('../../pages/lotissements/LotissementDetail'));
const LotissementForm = lazy(() => import('../../pages/lotissements/LotissementForm'));
const ProspectionsTerrainList = lazy(() => import('../../pages/prospections-terrain/ProspectionsTerrainList'));
const ProspectionTerrainDetail = lazy(() => import('../../pages/prospections-terrain/ProspectionTerrainDetail'));
const ProspectionTerrainForm = lazy(() => import('../../pages/prospections-terrain/ProspectionTerrainForm'));
const EntitesJuridiquesList = lazy(() => import('../../pages/entites/EntitesJuridiquesList'));
const EntiteJuridiqueDetail = lazy(() => import('../../pages/entites/EntiteJuridiqueDetail'));
const ActionnairesList = lazy(() => import('../../pages/entites/ActionnairesList'));
const ActionnaireDetail = lazy(() => import('../../pages/entites/ActionnaireDetail'));
const GroupesActionnairesList = lazy(() => import('../../pages/entites/GroupesActionnairesList'));
const GroupeActionnairesDetail = lazy(() => import('../../pages/entites/GroupeActionnairesDetail'));
const EtudesFaisabiliteList = lazy(() => import('../../pages/faisabilite/EtudesFaisabiliteList'));
const EtudeFaisabiliteDetail = lazy(() => import('../../pages/faisabilite/EtudeFaisabiliteDetail'));
const ListeRapports = lazy(() => import('../../pages/rapports/ListeRapports'));
const Rapport = lazy(() => import('../../pages/rapports/Rapport'));
const ReferentielPage = lazy(() => import('../../pages/configuration/ReferentielPage'));

const patrimoine: ModuleApp = {
  slug: 'patrimoine',
  label: 'Patrimoine',
  icon: Building2,
  ordre: 2,
  path: '/tranches',
  prefixes: [
    '/tranches', '/articles', '/sous-articles', '/terrains', '/terrains-prospection', '/lotissements', '/projets', '/entites-juridiques',
    '/actionnaires', '/groupes-actionnaires', '/etudes-faisabilite', '/patrimoine-rapports', '/configuration',
  ],
  arbre: arbrePatrimoine,
  routes: [
    { path: '/projets', element: <ProjetsList /> },
    { path: '/projets/nouveau', element: <ProjetForm /> },
    { path: '/projets/:id', element: <ProjetDetail /> },
    { path: '/projets/:id/modifier', element: <ProjetForm /> },
    { path: '/tranches', element: <TranchesList /> },
    { path: '/tranches/nouveau', element: <TrancheForm /> },
    { path: '/tranches/:id', element: <TrancheDetail /> },
    { path: '/tranches/:id/modifier', element: <TrancheForm /> },
    { path: '/tranches/:id/plans', element: <PlansTranche /> },
    { path: '/articles', element: <ArticlesList /> },
    { path: '/articles/nouveau', element: <ArticleForm /> },
    { path: '/articles/attachement-masse', element: <AttachementMasse /> },
    { path: '/articles/import', element: <ImportPatrimoine /> },
    { path: '/articles/:id', element: <ArticleDetail /> },
    { path: '/articles/:id/modifier', element: <ArticleForm /> },
    { path: '/articles/:id/sous-articles/nouveau', element: <ArticleForm sousArticle /> },
    { path: '/sous-articles', element: <SousArticlesList /> },
    { path: '/sous-articles/:id', element: <ArticleDetail ecranSousArticles /> },
    { path: '/terrains', element: <TerrainsList /> },
    { path: '/terrains/nouveau', element: <TerrainForm /> },
    { path: '/terrains/:id', element: <TerrainDetail /> },
    { path: '/terrains/:id/modifier', element: <TerrainForm /> },
    { path: '/terrains/:id/sous-terrains/nouveau', element: <TerrainForm sousTerrain /> },
    { path: '/terrains-prospection', element: <ProspectionsTerrainList /> },
    { path: '/terrains-prospection/nouveau', element: <ProspectionTerrainForm /> },
    { path: '/terrains-prospection/:id', element: <ProspectionTerrainDetail /> },
    { path: '/terrains-prospection/:id/modifier', element: <ProspectionTerrainForm /> },
    { path: '/lotissements', element: <TerrainsList liste="lotissements" /> },
    { path: '/lotissements/nouveau', element: <LotissementForm /> },
    { path: '/lotissements/:id', element: <LotissementDetail /> },
    { path: '/lotissements/:id/modifier', element: <LotissementForm /> },
    { path: '/entites-juridiques', element: <EntitesJuridiquesList /> },
    { path: '/entites-juridiques/nouveau', element: <EntiteJuridiqueDetail /> },
    { path: '/entites-juridiques/:id', element: <EntiteJuridiqueDetail /> },
    { path: '/actionnaires', element: <ActionnairesList /> },
    { path: '/actionnaires/nouveau', element: <ActionnaireDetail /> },
    { path: '/actionnaires/:id', element: <ActionnaireDetail /> },
    { path: '/groupes-actionnaires', element: <GroupesActionnairesList /> },
    { path: '/groupes-actionnaires/nouveau', element: <GroupeActionnairesDetail /> },
    { path: '/groupes-actionnaires/:id', element: <GroupeActionnairesDetail /> },
    { path: '/etudes-faisabilite', element: <EtudesFaisabiliteList /> },
    { path: '/etudes-faisabilite/nouveau', element: <EtudeFaisabiliteDetail /> },
    { path: '/etudes-faisabilite/:id', element: <EtudeFaisabiliteDetail /> },
    { path: '/patrimoine-rapports', element: <ListeRapports module="patrimoine" /> },
    { path: '/patrimoine-rapports/:code', element: <Rapport module="patrimoine" /> },
    { path: '/configuration/referentiels', element: <ReferentielPage /> },
    { path: '/configuration/referentiels/:slug', element: <ReferentielPage /> },
  ],
};

export default patrimoine;
