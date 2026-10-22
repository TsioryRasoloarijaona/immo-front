import { lazy } from 'react';
import { Building2, Grid2x2, Home, Landmark, Layers, LayoutGrid, MapPinned, Ruler, Settings2, Trees, UserRound, UsersRound } from 'lucide-react';
import { estAdministrateur, estExempte } from '../../lib/roles';
import type { ModuleApp } from '../types';

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
const SousArticlesList = lazy(() => import('../../pages/sous-articles/SousArticlesList'));
const TerrainsList = lazy(() => import('../../pages/terrains/TerrainsList'));
const TerrainDetail = lazy(() => import('../../pages/terrains/TerrainDetail'));
const TerrainForm = lazy(() => import('../../pages/terrains/TerrainForm'));
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
const ReferentielPage = lazy(() => import('../../pages/configuration/ReferentielPage'));

const PROJET = 'var(--sec-projet)';
const TRANCHE = 'var(--sec-tranche)';

const patrimoine: ModuleApp = {
  slug: 'patrimoine',
  label: 'Patrimoine',
  icon: Building2,
  ordre: 2,
  path: '/tranches',
  prefixes: [
    '/tranches', '/articles', '/sous-articles', '/terrains', '/terrains-prospection', '/lotissements', '/projets', '/entites-juridiques',
    '/actionnaires', '/groupes-actionnaires', '/etudes-faisabilite', '/configuration',
  ],
  menu: {
    titre: 'Patrimoine',
    entrees: [
      { to: '/projets', libelle: 'Projets', Icone: LayoutGrid, couleur: PROJET },
      { to: '/tranches', libelle: 'Tranches', Icone: Building2, couleur: TRANCHE },
      { to: '/articles', libelle: 'Articles', Icone: Home, couleur: TRANCHE },
      { to: '/sous-articles', libelle: 'Sous-articles', Icone: Layers, couleur: TRANCHE },
      { to: '/terrains', libelle: 'Terrains', Icone: Trees, couleur: TRANCHE },
      { to: '/terrains-prospection', libelle: 'Prospections terrain', Icone: MapPinned, couleur: TRANCHE },
      { to: '/lotissements', libelle: 'Lotissements', Icone: Grid2x2, couleur: TRANCHE },
      { to: '/entites-juridiques', libelle: 'Entités juridiques', Icone: Landmark, couleur: PROJET, visible: estAdministrateur },
      { to: '/actionnaires', libelle: 'Actionnaires', Icone: UserRound, couleur: PROJET, visible: estAdministrateur },
      { to: '/groupes-actionnaires', libelle: "Groupes d'actionnaires", Icone: UsersRound, couleur: PROJET, visible: estAdministrateur },
      { to: '/etudes-faisabilite', libelle: 'Études de faisabilité', Icone: Ruler, couleur: PROJET, visible: estExempte },
      { to: '/configuration/referentiels', actif: '/configuration', libelle: 'Configuration', Icone: Settings2, couleur: PROJET },
    ],
  },
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
    { path: '/configuration/referentiels', element: <ReferentielPage /> },
    { path: '/configuration/referentiels/:slug', element: <ReferentielPage /> },
  ],
};

export default patrimoine;
