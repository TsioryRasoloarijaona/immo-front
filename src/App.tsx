import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import RouteErrorBoundary from './components/RouteErrorBoundary';
import { ConfirmProvider } from './components/ConfirmModal';
import NotificationsProvider from './components/notifications/NotificationsProvider';
import { PreviewProvider } from './components/PreviewProvider';
import { ToastProvider } from './components/ToastProvider';
import { LoadingState } from './components/ui';
import { AppDataProvider } from './lib/AppDataProvider';
import { useAuth } from './lib/auth';
import { estCommercialTerrain } from './lib/roles';
import { AuthProvider } from './lib/AuthProvider';
import Login from './pages/auth/Login';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const MaJournee = lazy(() => import('./pages/parcours/MaJournee'));
const BoiteDeTri = lazy(() => import('./pages/parcours/BoiteDeTri'));
const Profil = lazy(() => import('./pages/profil/Profil'));
const UtilisateursList = lazy(() => import('./pages/utilisateurs/UtilisateursList'));
const ReinitialiserMotDePasse = lazy(() => import('./pages/utilisateurs/ReinitialiserMotDePasse'));
const ClesApiList = lazy(() => import('./pages/utilisateurs/ClesApiList'));
const ModelesDocumentsList = lazy(() => import('./pages/modeles/ModelesDocumentsList'));
const EditeurModele = lazy(() => import('./pages/modeles/EditeurModele'));
const PerformancesCommerciaux = lazy(() => import('./pages/kpi/PerformancesCommerciaux'));
const MesPerformances = lazy(() => import('./pages/kpi/MesPerformances'));
const MonEquipe = lazy(() => import('./pages/equipe/MonEquipe'));
const Calendrier = lazy(() => import('./pages/calendrier/Calendrier'));
const Hotline = lazy(() => import('./pages/hotline/Hotline'));
const SuiviActionsList = lazy(() => import('./pages/actions/SuiviActionsList'));
const EtatDesVentes = lazy(() => import('./pages/etatVentes/EtatDesVentes'));
const SuiviAffectations = lazy(() => import('./pages/suiviAffectations/SuiviAffectations'));
const SuiviCommerciaux = lazy(() => import('./pages/suiviCommerciaux/SuiviCommerciaux'));
const ProspectionsList = lazy(() => import('./pages/prospections/ProspectionsList'));
const PreProspectionsList = lazy(() => import('./pages/prospections/PreProspectionsList'));
const ImportPreProspections = lazy(() => import('./pages/prospections/ImportPreProspections'));
const ProspectionDetail = lazy(() => import('./pages/prospections/ProspectionDetail'));
const OffresList = lazy(() => import('./pages/prospections/OffresList'));
const OffreDetail = lazy(() => import('./pages/prospections/OffreDetail'));
const EncaissementsList = lazy(() => import('./pages/encaissements/EncaissementsList'));
const EncaissementDetail = lazy(() => import('./pages/encaissements/EncaissementDetail'));
const ImpayesList = lazy(() => import('./pages/impayes/ImpayesList'));
const ProspectsList = lazy(() => import('./pages/prospects/ProspectsList'));
const NewProspect = lazy(() => import('./pages/prospects/NewProspect'));
const ProspectDetail = lazy(() => import('./pages/prospects/ProspectDetail'));
const ClientsList = lazy(() => import('./pages/clients/ClientsList'));
const NewDossier = lazy(() => import('./pages/dossiers/NewDossier'));
const DossiersList = lazy(() => import('./pages/dossiers/DossiersList'));
const DossierDetail = lazy(() => import('./pages/dossiers/DossierDetail'));
const ProjetsList = lazy(() => import('./pages/projets/ProjetsList'));
const ProjetDetail = lazy(() => import('./pages/projets/ProjetDetail'));
const TranchesList = lazy(() => import('./pages/tranches/TranchesList'));
const TrancheDetail = lazy(() => import('./pages/tranches/TrancheDetail'));
const ArticlesList = lazy(() => import('./pages/articles/ArticlesList'));
const ArticleDetail = lazy(() => import('./pages/articles/ArticleDetail'));
const AttachementMasse = lazy(() => import('./pages/articles/AttachementMasse'));
const ProjetForm = lazy(() => import('./pages/projets/ProjetForm'));
const TrancheForm = lazy(() => import('./pages/tranches/TrancheForm'));
const ArticleForm = lazy(() => import('./pages/articles/ArticleForm'));
const EntitesJuridiquesList = lazy(() => import('./pages/entites/EntitesJuridiquesList'));
const EntiteJuridiqueDetail = lazy(() => import('./pages/entites/EntiteJuridiqueDetail'));
const ActionnairesList = lazy(() => import('./pages/entites/ActionnairesList'));
const ActionnaireDetail = lazy(() => import('./pages/entites/ActionnaireDetail'));
const GroupesActionnairesList = lazy(() => import('./pages/entites/GroupesActionnairesList'));
const GroupeActionnairesDetail = lazy(() => import('./pages/entites/GroupeActionnairesDetail'));
const NouvelOrdre = lazy(() => import('./pages/outils/virements/NouvelOrdre'));
const HistoriqueVirements = lazy(() => import('./pages/outils/virements/HistoriqueVirements'));
const BeneficiairesVirement = lazy(() => import('./pages/outils/virements/Beneficiaires'));
const SocietesVirement = lazy(() => import('./pages/outils/virements/Societes'));
const JournalVirement = lazy(() => import('./pages/outils/virements/Journal'));
const TableauDeBordSyndic = lazy(() => import('./pages/outils/syndic/TableauDeBordSyndic'));
const AppartementsSyndic = lazy(() => import('./pages/outils/syndic/AppartementsSyndic'));
const FicheAppartementSyndic = lazy(() => import('./pages/outils/syndic/FicheAppartementSyndic'));
const NouveauPaiementSyndic = lazy(() => import('./pages/outils/syndic/NouveauPaiementSyndic'));
const PaiementsSyndic = lazy(() => import('./pages/outils/syndic/PaiementsSyndic'));
const QuiDoitSyndic = lazy(() => import('./pages/outils/syndic/QuiDoitSyndic'));
const NouvelAppartementSyndic = lazy(() => import('./pages/outils/syndic/NouvelAppartementSyndic'));
const ProprietaireSyndic = lazy(() => import('./pages/outils/syndic/ProprietaireSyndic'));
const OuvrirExerciceSyndic = lazy(() => import('./pages/outils/syndic/OuvrirExerciceSyndic'));
const ReglagesSyndic = lazy(() => import('./pages/outils/syndic/ReglagesSyndic'));
const Aide = lazy(() => import('./pages/aide/Aide'));
const ComingSoon = lazy(() => import('./pages/ComingSoon'));
const NotFound = lazy(() => import('./pages/NotFound'));

/** Le commercial de terrain arrive sur « Ma journée » ; les autres rôles gardent le tableau de bord. */
function Accueil() {
  const { user } = useAuth();
  return estCommercialTerrain(user) ? <Navigate to="/journee" replace /> : <Dashboard />;
}

// Monté seulement une fois la session ouverte : l'appel inconditionnel de `AppDataProvider` ferait 401 avant.
function AuthenticatedApp() {
  const { pathname } = useLocation();

  return (
    <AppDataProvider>
      <ToastProvider>
      <ConfirmProvider>
        <NotificationsProvider>
        <PreviewProvider>
          <Layout>
            {/* La frontière enveloppe le Suspense, pas l’inverse : un chunk qui ne se télécharge pas démonterait
                tout l’arbre (écran blanc). Clé = chemin, pour qu’une page en échec n’emprisonne pas les suivantes. */}
            <RouteErrorBoundary resetKey={pathname}>
              <Suspense fallback={<LoadingState />}>
                <Routes>
                  <Route path="/" element={<Accueil />} />
                  <Route path="/tableau-de-bord" element={<Dashboard />} />
                  <Route path="/journee" element={<MaJournee />} />
                  <Route path="/tri" element={<BoiteDeTri />} />
                  <Route path="/profil" element={<Profil />} />
                  <Route path="/utilisateurs" element={<UtilisateursList />} />
                  <Route path="/utilisateurs/reinitialiser-mot-de-passe" element={<ReinitialiserMotDePasse />} />
                  <Route path="/cles-api" element={<ClesApiList />} />
                  <Route path="/modeles-documents" element={<ModelesDocumentsList />} />
                  <Route path="/modeles-documents/:id" element={<EditeurModele />} />
                  <Route path="/performances" element={<PerformancesCommerciaux />} />
                  <Route path="/mes-performances" element={<MesPerformances />} />
                  <Route path="/equipe" element={<MonEquipe />} />
                  <Route path="/hotline" element={<Hotline />} />
                  <Route path="/calendrier" element={<Calendrier />} />
                  <Route path="/suivi-actions" element={<SuiviActionsList />} />
                  <Route path="/etat-des-ventes" element={<EtatDesVentes />} />
                  <Route path="/suivi-commerciaux" element={<SuiviCommerciaux />} />
                  <Route path="/suivi-affectations" element={<SuiviAffectations />} />
                  <Route path="/prospections" element={<ProspectionsList />} />
                  {/* La saisie est une boîte, pas une page : la route rend la liste avec la boîte ouverte. */}
                  <Route path="/prospections/nouveau" element={<ProspectionsList nouveau />} />
                  <Route path="/pre-prospections" element={<PreProspectionsList />} />
                  {/* Les deux routes statiques avant `:id`, sinon il les capture. */}
                  <Route path="/pre-prospections/nouveau" element={<PreProspectionsList nouveau />} />
                  <Route path="/pre-prospections/import" element={<ImportPreProspections />} />
                  <Route path="/pre-prospections/:id" element={<ProspectionDetail />} />
                  <Route path="/prospections/:id" element={<ProspectionDetail />} />
                  <Route path="/prospections/:id/nouveau-dossier" element={<NewDossier />} />
                  <Route path="/offres" element={<OffresList />} />
                  <Route path="/offres/:id" element={<OffreDetail />} />
                  <Route path="/encaissements" element={<EncaissementsList />} />
                  <Route path="/encaissements/:id" element={<EncaissementDetail />} />
                  <Route path="/impayes" element={<ImpayesList />} />
                  <Route path="/prospects" element={<ProspectsList />} />
                  <Route path="/prospects/nouveau" element={<NewProspect />} />
                  <Route path="/prospects/:id" element={<ProspectDetail />} />
                  <Route path="/clients" element={<ClientsList />} />
                  <Route path="/clients/:id" element={<ProspectDetail />} />
                  <Route path="/dossiers" element={<DossiersList />} />
                  <Route path="/dossiers/:id" element={<DossierDetail />} />
                  <Route path="/projets" element={<ProjetsList />} />
                  <Route path="/projets/nouveau" element={<ProjetForm />} />
                  <Route path="/projets/:id" element={<ProjetDetail />} />
                  <Route path="/projets/:id/modifier" element={<ProjetForm />} />
                  <Route path="/tranches" element={<TranchesList />} />
                  <Route path="/tranches/nouveau" element={<TrancheForm />} />
                  <Route path="/tranches/:id" element={<TrancheDetail />} />
                  <Route path="/tranches/:id/modifier" element={<TrancheForm />} />
                  <Route path="/articles" element={<ArticlesList />} />
                  <Route path="/articles/nouveau" element={<ArticleForm />} />
                  <Route path="/articles/attachement-masse" element={<AttachementMasse />} />
                  <Route path="/articles/:id" element={<ArticleDetail />} />
                  <Route path="/articles/:id/modifier" element={<ArticleForm />} />
                  <Route path="/articles/:id/sous-articles/nouveau" element={<ArticleForm sousArticle />} />
                  <Route path="/entites-juridiques" element={<EntitesJuridiquesList />} />
                  <Route path="/entites-juridiques/nouveau" element={<EntiteJuridiqueDetail />} />
                  <Route path="/entites-juridiques/:id" element={<EntiteJuridiqueDetail />} />
                  <Route path="/actionnaires" element={<ActionnairesList />} />
                  <Route path="/actionnaires/nouveau" element={<ActionnaireDetail />} />
                  <Route path="/actionnaires/:id" element={<ActionnaireDetail />} />
                  <Route path="/groupes-actionnaires" element={<GroupesActionnairesList />} />
                  <Route path="/groupes-actionnaires/nouveau" element={<GroupeActionnairesDetail />} />
                  <Route path="/groupes-actionnaires/:id" element={<GroupeActionnairesDetail />} />
                  <Route path="/outils" element={<Navigate to="/outils/virements/nouveau" replace />} />
                  <Route path="/outils/virements" element={<Navigate to="/outils/virements/nouveau" replace />} />
                  <Route path="/outils/virements/nouveau" element={<NouvelOrdre />} />
                  <Route path="/outils/virements/historique" element={<HistoriqueVirements />} />
                  <Route path="/outils/virements/beneficiaires" element={<BeneficiairesVirement />} />
                  <Route path="/outils/virements/societes" element={<SocietesVirement />} />
                  <Route path="/outils/virements/journal" element={<JournalVirement />} />
                  <Route path="/outils/syndic" element={<Navigate to="/outils/syndic/tableau-de-bord" replace />} />
                  <Route path="/outils/syndic/tableau-de-bord" element={<TableauDeBordSyndic />} />
                  <Route path="/outils/syndic/appartements" element={<AppartementsSyndic />} />
                  <Route path="/outils/syndic/appartements/nouveau" element={<NouvelAppartementSyndic />} />
                  <Route path="/outils/syndic/appartements/:code" element={<FicheAppartementSyndic />} />
                  <Route path="/outils/syndic/proprietaires/:id" element={<ProprietaireSyndic />} />
                  <Route path="/outils/syndic/exercices/nouveau" element={<OuvrirExerciceSyndic />} />
                  <Route path="/outils/syndic/reglages" element={<ReglagesSyndic />} />
                  <Route path="/outils/syndic/paiement/nouveau" element={<NouveauPaiementSyndic />} />
                  <Route path="/outils/syndic/paiements" element={<PaiementsSyndic />} />
                  <Route path="/outils/syndic/qui-doit" element={<QuiDoitSyndic />} />
                  <Route path="/aide" element={<Aide />} />
                  <Route path="/aide/:slug" element={<Aide />} />
                  <Route path="/bientot/:module" element={<ComingSoon />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </RouteErrorBoundary>
          </Layout>
        </PreviewProvider>
        </NotificationsProvider>
      </ConfirmProvider>
      </ToastProvider>
    </AppDataProvider>
  );
}

function AuthGate() {
  const { status } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // La déconnexion ne navigue pas : sans ceci, un autre compte atterrirait sur la dernière page du précédent.
  // Ici et non dans les gestionnaires : déconnexion, expiration et 401 passent tous par le statut.
  // `replace` : la page quittée ne doit pas revenir par un retour arrière.
  useEffect(() => {
    if (status === 'unauthenticated' && pathname !== '/') {
      void navigate('/', { replace: true });
    }
  }, [status, pathname, navigate]);

  if (status === 'loading') {
    // Vide plutôt qu'un spinner : un seul aller-retour, plus rapide qu'un spinner à peindre.
    return null;
  }
  if (status === 'unauthenticated') {
    return <Login />;
  }
  return <AuthenticatedApp />;
}

function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

export default App;
