import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { ConfirmProvider } from './components/ConfirmModal';
import { PreviewProvider } from './components/PreviewProvider';
import { LoadingState } from './components/ui';
import { AppDataProvider } from './lib/appData';
import { AuthProvider, useAuth } from './lib/auth';
import Login from './pages/auth/Login';
import ChangePasswordGate from './pages/auth/ChangePasswordGate';
import CompleteProfileGate from './pages/auth/CompleteProfileGate';

// Every routed page is code-split behind React.lazy — none of them are
// needed for the first paint (auth gates above render before any route
// does), and together they were the bulk of the single ~720 kB bundle Vite
// warned about. Splitting per-route means a session only ever downloads the
// pages it actually visits, and repeat visits hit the browser cache per
// chunk instead of invalidating one monolithic bundle on every deploy.
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profil = lazy(() => import('./pages/profil/Profil'));
const UtilisateursList = lazy(() => import('./pages/utilisateurs/UtilisateursList'));
const NouvelUtilisateur = lazy(() => import('./pages/utilisateurs/NouvelUtilisateur'));
const ReinitialiserMotDePasse = lazy(() => import('./pages/utilisateurs/ReinitialiserMotDePasse'));
const Calendrier = lazy(() => import('./pages/calendrier/Calendrier'));
const Hotline = lazy(() => import('./pages/hotline/Hotline'));
const ProspectionsList = lazy(() => import('./pages/prospections/ProspectionsList'));
const PreProspectionsList = lazy(() => import('./pages/prospections/PreProspectionsList'));
const ProspectionDetail = lazy(() => import('./pages/prospections/ProspectionDetail'));
const OffresList = lazy(() => import('./pages/prospections/OffresList'));
const EncaissementsList = lazy(() => import('./pages/encaissements/EncaissementsList'));
const EncaissementDetail = lazy(() => import('./pages/encaissements/EncaissementDetail'));
const ProspectsList = lazy(() => import('./pages/prospects/ProspectsList'));
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
const ComingSoon = lazy(() => import('./pages/ComingSoon'));
const NotFound = lazy(() => import('./pages/NotFound'));

// The routed app shell — only ever mounted once a session exists and both
// onboarding gates (mustChangePassword / profileCompleted) have cleared, so
// nothing under here needs to think about auth at all (AppDataProvider's
// unconditional listCommerciaux() call, for instance, would otherwise 401
// during the brief window before login).
function AuthenticatedApp() {
  return (
    <AppDataProvider>
      <ConfirmProvider>
        <PreviewProvider>
          <Layout>
            <Suspense fallback={<LoadingState />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/profil" element={<Profil />} />
                <Route path="/utilisateurs" element={<UtilisateursList />} />
                <Route path="/utilisateurs/nouveau" element={<NouvelUtilisateur />} />
                <Route path="/utilisateurs/reinitialiser-mot-de-passe" element={<ReinitialiserMotDePasse />} />
                <Route path="/hotline" element={<Hotline />} />
                <Route path="/calendrier" element={<Calendrier />} />
                <Route path="/prospections" element={<ProspectionsList />} />
                <Route path="/pre-prospections" element={<PreProspectionsList />} />
                <Route path="/pre-prospections/:id" element={<ProspectionDetail />} />
                <Route path="/prospections/:id" element={<ProspectionDetail />} />
                <Route path="/prospections/:id/nouveau-dossier" element={<NewDossier />} />
                <Route path="/offres" element={<OffresList />} />
                <Route path="/encaissements" element={<EncaissementsList />} />
                <Route path="/encaissements/:id" element={<EncaissementDetail />} />
                <Route path="/prospects" element={<ProspectsList />} />
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
                <Route path="/bientot/:module" element={<ComingSoon />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </Layout>
        </PreviewProvider>
      </ConfirmProvider>
    </AppDataProvider>
  );
}

function AuthGate() {
  const { status, user } = useAuth();

  if (status === 'loading') {
    // Deliberately blank rather than a spinner — this resolves in one
    // GET /api/mon-compte round trip, almost always faster than a spinner
    // would even paint.
    return null;
  }
  if (status === 'unauthenticated') {
    return <Login />;
  }
  // status === 'authenticated' past this point — user is guaranteed set.
  if (user!.mustChangePassword) {
    return <ChangePasswordGate />;
  }
  if (!user!.profileCompleted) {
    return <CompleteProfileGate />;
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
