import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { ConfirmProvider } from './components/ConfirmModal';
import { PreviewProvider } from './components/PreviewProvider';
import { AppDataProvider } from './lib/appData';
import { AuthProvider, useAuth } from './lib/auth';
import Login from './pages/auth/Login';
import ChangePasswordGate from './pages/auth/ChangePasswordGate';
import CompleteProfileGate from './pages/auth/CompleteProfileGate';
import Dashboard from './pages/Dashboard';
import Calendrier from './pages/calendrier/Calendrier';
import Hotline from './pages/hotline/Hotline';
import ProspectionsList from './pages/prospections/ProspectionsList';
import ProspectionDetail from './pages/prospections/ProspectionDetail';
import ProspectsList from './pages/prospects/ProspectsList';
import ProspectDetail from './pages/prospects/ProspectDetail';
import ClientsList from './pages/clients/ClientsList';
import NewDossier from './pages/dossiers/NewDossier';
import DossiersList from './pages/dossiers/DossiersList';
import DossierDetail from './pages/dossiers/DossierDetail';
import ProjetsList from './pages/projets/ProjetsList';
import ProjetDetail from './pages/projets/ProjetDetail';
import TranchesList from './pages/tranches/TranchesList';
import TrancheDetail from './pages/tranches/TrancheDetail';
import ArticleDetail from './pages/articles/ArticleDetail';
import ComingSoon from './pages/ComingSoon';
import NotFound from './pages/NotFound';

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
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/hotline" element={<Hotline />} />
              <Route path="/calendrier" element={<Calendrier />} />
              <Route path="/prospections" element={<ProspectionsList />} />
              <Route path="/prospections/:id" element={<ProspectionDetail />} />
              <Route path="/prospections/:id/nouveau-dossier" element={<NewDossier />} />
              <Route path="/prospects" element={<ProspectsList />} />
              <Route path="/prospects/:id" element={<ProspectDetail />} />
              <Route path="/clients" element={<ClientsList />} />
              <Route path="/dossiers" element={<DossiersList />} />
              <Route path="/dossiers/:id" element={<DossierDetail />} />
              <Route path="/projets" element={<ProjetsList />} />
              <Route path="/projets/:id" element={<ProjetDetail />} />
              <Route path="/tranches" element={<TranchesList />} />
              <Route path="/tranches/:id" element={<TrancheDetail />} />
              <Route path="/articles/:id" element={<ArticleDetail />} />
              <Route path="/bientot/:module" element={<ComingSoon />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
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
