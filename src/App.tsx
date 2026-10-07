import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import RouteErrorBoundary from './components/RouteErrorBoundary';
import { ConfirmProvider } from './components/ConfirmModal';
import { PreviewProvider } from './components/PreviewProvider';
import { LoadingState } from './components/ui';
import { AppDataProvider } from './lib/appData';
import { AuthProvider, useAuth } from './lib/auth';
import Login from './pages/auth/Login';

// Every routed page is code-split behind React.lazy — none of them are
// needed for the first paint (auth gates above render before any route
// does), and together they were the bulk of the single ~720 kB bundle Vite
// warned about. Splitting per-route means a session only ever downloads the
// pages it actually visits, and repeat visits hit the browser cache per
// chunk instead of invalidating one monolithic bundle on every deploy.
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profil = lazy(() => import('./pages/profil/Profil'));
const UtilisateursList = lazy(() => import('./pages/utilisateurs/UtilisateursList'));
const ReinitialiserMotDePasse = lazy(() => import('./pages/utilisateurs/ReinitialiserMotDePasse'));
const ClesApiList = lazy(() => import('./pages/utilisateurs/ClesApiList'));
const PerformancesCommerciaux = lazy(() => import('./pages/kpi/PerformancesCommerciaux'));
const MesPerformances = lazy(() => import('./pages/kpi/MesPerformances'));
const Calendrier = lazy(() => import('./pages/calendrier/Calendrier'));
const Hotline = lazy(() => import('./pages/hotline/Hotline'));
const SuiviActionsList = lazy(() => import('./pages/actions/SuiviActionsList'));
const ProspectionsList = lazy(() => import('./pages/prospections/ProspectionsList'));
const PreProspectionsList = lazy(() => import('./pages/prospections/PreProspectionsList'));
const ImportPreProspections = lazy(() => import('./pages/prospections/ImportPreProspections'));
const ProspectionDetail = lazy(() => import('./pages/prospections/ProspectionDetail'));
const OffresList = lazy(() => import('./pages/prospections/OffresList'));
const EncaissementsList = lazy(() => import('./pages/encaissements/EncaissementsList'));
const EncaissementDetail = lazy(() => import('./pages/encaissements/EncaissementDetail'));
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
const NouvelOrdre = lazy(() => import('./pages/outils/virements/NouvelOrdre'));
const HistoriqueVirements = lazy(() => import('./pages/outils/virements/HistoriqueVirements'));
const BeneficiairesVirement = lazy(() => import('./pages/outils/virements/Beneficiaires'));
const SocietesVirement = lazy(() => import('./pages/outils/virements/Societes'));
const JournalVirement = lazy(() => import('./pages/outils/virements/Journal'));
const ComingSoon = lazy(() => import('./pages/ComingSoon'));
const NotFound = lazy(() => import('./pages/NotFound'));

// The routed app shell — only ever mounted once a session exists (there is no
// first-login gate any more: accounts come from Omran already filled in, and
// mustChangePassword / profileCompleted are ignored), so
// nothing under here needs to think about auth at all (AppDataProvider's
// unconditional listCommerciaux() call, for instance, would otherwise 401
// during the brief window before login).
function AuthenticatedApp() {
  const { pathname } = useLocation();

  return (
    <AppDataProvider>
      <ConfirmProvider>
        <PreviewProvider>
          <Layout>
            {/* La frontière enveloppe le Suspense, et non l’inverse : un module
                de page qui ne se télécharge pas rejette la promesse que Suspense
                attendait, et sans elle l’arbre entier se démonte — écran blanc.
                La clé de réinitialisation est le chemin courant, pour qu’une page
                en échec n’emprisonne pas les suivantes. */}
            <RouteErrorBoundary resetKey={pathname}>
              <Suspense fallback={<LoadingState />}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/profil" element={<Profil />} />
                  <Route path="/utilisateurs" element={<UtilisateursList />} />
                  <Route path="/utilisateurs/reinitialiser-mot-de-passe" element={<ReinitialiserMotDePasse />} />
                  <Route path="/cles-api" element={<ClesApiList />} />
                  <Route path="/performances" element={<PerformancesCommerciaux />} />
                  <Route path="/mes-performances" element={<MesPerformances />} />
                  <Route path="/hotline" element={<Hotline />} />
                  <Route path="/calendrier" element={<Calendrier />} />
                  <Route path="/suivi-actions" element={<SuiviActionsList />} />
                  <Route path="/prospections" element={<ProspectionsList />} />
                  {/* La saisie est une boîte, pas une page : la route rend la liste avec
                      la boîte ouverte par-dessus. L'URL reste partageable et le
                      bouton Retour la ferme. */}
                  <Route path="/prospections/nouveau" element={<ProspectionsList nouveau />} />
                  <Route path="/pre-prospections" element={<PreProspectionsList />} />
                  {/* Les deux routes statiques avant `:id`, sinon il les capture. */}
                  <Route path="/pre-prospections/nouveau" element={<PreProspectionsList nouveau />} />
                  <Route path="/pre-prospections/import" element={<ImportPreProspections />} />
                  <Route path="/pre-prospections/:id" element={<ProspectionDetail />} />
                  <Route path="/prospections/:id" element={<ProspectionDetail />} />
                  <Route path="/prospections/:id/nouveau-dossier" element={<NewDossier />} />
                  <Route path="/offres" element={<OffresList />} />
                  <Route path="/encaissements" element={<EncaissementsList />} />
                  <Route path="/encaissements/:id" element={<EncaissementDetail />} />
                  <Route path="/prospects" element={<ProspectsList />} />
                  <Route path="/prospects/nouveau" element={<NewProspect />} />
                  <Route path="/prospects/:id" element={<ProspectDetail />} />
                  <Route path="/clients" element={<ClientsList />} />
                  <Route path="/clients/:id" element={<ProspectDetail />} />
                  <Route path="/dossiers" element={<DossiersList />} />
                  <Route path="/dossiers/:id" element={<DossierDetail />} />
                  <Route path="/projets" element={<ProjetsList />} />
                  <Route path="/projets/:id" element={<ProjetDetail />} />
                  <Route path="/tranches" element={<TranchesList />} />
                  <Route path="/tranches/:id" element={<TrancheDetail />} />
                  <Route path="/articles" element={<ArticlesList />} />
                  <Route path="/articles/:id" element={<ArticleDetail />} />
                  {/* Module Outils (admin) — générateur d'ordres de virement, maquette statique. */}
                  <Route path="/outils" element={<Navigate to="/outils/virements/nouveau" replace />} />
                  <Route path="/outils/virements" element={<Navigate to="/outils/virements/nouveau" replace />} />
                  <Route path="/outils/virements/nouveau" element={<NouvelOrdre />} />
                  <Route path="/outils/virements/historique" element={<HistoriqueVirements />} />
                  <Route path="/outils/virements/beneficiaires" element={<BeneficiairesVirement />} />
                  <Route path="/outils/virements/societes" element={<SocietesVirement />} />
                  <Route path="/outils/virements/journal" element={<JournalVirement />} />
                  <Route path="/bientot/:module" element={<ComingSoon />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </RouteErrorBoundary>
          </Layout>
        </PreviewProvider>
      </ConfirmProvider>
    </AppDataProvider>
  );
}

function AuthGate() {
  const { status } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // La déconnexion ne navigue pas : elle échange l'arbre React contre
  // <Login />, et le routeur reste sur l'URL de la page consultée. Sans ce
  // nettoyage, la connexion suivante y revient — et avec un autre compte on
  // atterrit sur la dernière page du précédent, à laquelle le nouvel
  // utilisateur n'a peut-être même pas accès.
  //
  // Placé ici plutôt que dans les gestionnaires de déconnexion : il y en a
  // plusieurs (le menu de Layout, l'expiration de session), et surtout la
  // session peut aussi tomber d'elle-même (401). Le statut est le seul point
  // par lequel tous ces chemins passent.
  //
  // `replace` et non `push` : la page quittée ne doit pas davantage revenir
  // d'un retour arrière juste après la reconnexion.
  useEffect(() => {
    if (status === 'unauthenticated' && pathname !== '/') {
      navigate('/', { replace: true });
    }
  }, [status, pathname, navigate]);

  if (status === 'loading') {
    // Deliberately blank rather than a spinner — this resolves in one
    // GET /api/mon-compte round trip, almost always faster than a spinner
    // would even paint.
    return null;
  }
  if (status === 'unauthenticated') {
    return <Login />;
  }
  // status === 'authenticated' past this point. Plus de portail de première
  // connexion : mustChangePassword / profileCompleted sont ignorés, l'utilisateur
  // arrive directement dans l'application (FEATURE-acces-arpent-depuis-omran.md F3).
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
