import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { ConfirmProvider } from './components/ConfirmModal';
import { PreviewProvider } from './components/PreviewProvider';
// Importé depuis son propre module, pas depuis `./components/ui` : ce dernier
// était l'unique import *eager* de ce fichier de 300 lignes, qu'il tirait
// entièrement (badge, card, empty, avatar, cva, tailwind-merge) dans le chunk
// d'entrée pour un composant de 24 lignes.
import { LoadingState } from './components/ui/loading-state';
import { AppDataProvider } from './lib/appData';
import { AuthProvider, useAuth } from './lib/auth';
import { ROUTE_MODULES } from './lib/routeModules';

// Les trois écrans d'authentification ne s'affichent que dans les branches
// non authentifié / mot de passe à changer / profil incomplet — mutuellement
// exclusives avec `AuthenticatedApp`. Statiquement importés, ils voyageaient
// dans le chunk d'entrée de chaque utilisateur déjà connecté.
const Login = lazy(() => import('./pages/auth/Login'));
const ChangePasswordGate = lazy(() => import('./pages/auth/ChangePasswordGate'));
const CompleteProfileGate = lazy(() => import('./pages/auth/CompleteProfileGate'));

// Every routed page is code-split behind React.lazy — none of them are
// needed for the first paint (auth gates above render before any route
// does), and together they were the bulk of the single ~720 kB bundle Vite
// warned about. Splitting per-route means a session only ever downloads the
// pages it actually visits, and repeat visits hit the browser cache per
// chunk instead of invalidating one monolithic bundle on every deploy.
const Dashboard = lazy(ROUTE_MODULES['/']);
const Profil = lazy(ROUTE_MODULES['/profil']);
const UtilisateursList = lazy(ROUTE_MODULES['/utilisateurs']);
const NouvelUtilisateur = lazy(ROUTE_MODULES['/utilisateurs/nouveau']);
const ReinitialiserMotDePasse = lazy(ROUTE_MODULES['/utilisateurs/reinitialiser-mot-de-passe']);
const Calendrier = lazy(ROUTE_MODULES['/calendrier']);
const Hotline = lazy(ROUTE_MODULES['/hotline']);
const ProspectionsList = lazy(ROUTE_MODULES['/prospections']);
const PreProspectionsList = lazy(ROUTE_MODULES['/pre-prospections']);
const ProspectionDetail = lazy(() => import('./pages/prospections/ProspectionDetail'));
const NewProspection = lazy(() => import('./pages/prospections/NewProspection'));
const OffresList = lazy(ROUTE_MODULES['/offres']);
const EncaissementsList = lazy(ROUTE_MODULES['/encaissements']);
const EncaissementDetail = lazy(() => import('./pages/encaissements/EncaissementDetail'));
const ProspectsList = lazy(ROUTE_MODULES['/prospects']);
const NewProspect = lazy(() => import('./pages/prospects/NewProspect'));
const ProspectDetail = lazy(() => import('./pages/prospects/ProspectDetail'));
const ClientsList = lazy(ROUTE_MODULES['/clients']);
const NewDossier = lazy(() => import('./pages/dossiers/NewDossier'));
const DossiersList = lazy(ROUTE_MODULES['/dossiers']);
const DossierDetail = lazy(() => import('./pages/dossiers/DossierDetail'));
const ProjetsList = lazy(ROUTE_MODULES['/projets']);
const ProjetDetail = lazy(() => import('./pages/projets/ProjetDetail'));
const TranchesList = lazy(ROUTE_MODULES['/tranches']);
const TrancheDetail = lazy(() => import('./pages/tranches/TrancheDetail'));
const ArticlesList = lazy(ROUTE_MODULES['/articles']);
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
            {/* L'ErrorBoundary est à l'intérieur du Layout : une page qui
                échoue laisse la barre latérale en place, donc l'utilisateur
                peut naviguer ailleurs sans recharger. */}
            <ErrorBoundary>
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
                <Route path="/prospections/nouveau" element={<NewProspection />} />
                <Route path="/pre-prospections" element={<PreProspectionsList />} />
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
                <Route path="/bientot/:module" element={<ComingSoon />} />
                <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
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
      {/* Les trois écrans d'authentification sont paresseux : sans ce
          `Suspense`, `AuthGate` suspendrait sans limite et l'application
          resterait blanche au lieu d'afficher la connexion. Le `fallback` est
          vide, comme l'état `loading` d'`AuthGate` — un spinner qui clignote
          le temps d'un petit chunk local est plus gênant qu'utile. */}
      <ErrorBoundary>
        <Suspense fallback={null}>
          <AuthGate />
        </Suspense>
      </ErrorBoundary>
    </AuthProvider>
  );
}

export default App;
