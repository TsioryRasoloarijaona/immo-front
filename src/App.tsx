import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import AccesReserveSiege from './components/AccesReserveSiege';
import Layout from './components/Layout';
import RouteErrorBoundary from './components/RouteErrorBoundary';
import { ConfirmProvider } from './components/ConfirmModal';
import NotificationsProvider from './components/notifications/NotificationsProvider';
import { PreviewProvider } from './components/PreviewProvider';
import { ToastProvider } from './components/ToastProvider';
import { LoadingState } from './components/ui';
import { AppDataProvider } from './lib/AppDataProvider';
import { useAuth } from './lib/auth';
import { AuthProvider } from './lib/AuthProvider';
import { estAgence } from './lib/roles';
import { MODULES_DECLARES } from './modules/registre';
import Login from './pages/auth/Login';

const ComingSoon = lazy(() => import('./pages/ComingSoon'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Monté seulement une fois la session ouverte : l'appel inconditionnel de `AppDataProvider` ferait 401 avant.
// Routes de la vente ouvertes à une agence ; toutes les autres routes rendent « Accès réservé au siège ».
const ROUTES_AGENCE: ReadonlySet<string> = new Set([
  '/', '/tableau-de-bord', '/journee', '/profil', '/calendrier', '/prospections/:id?', '/prospections/nouveau',
  '/offres/:id?', '/prospects/:id?', '/prospects/nouveau', '/clients/:id?', '/dossiers/:id?', '/plans', '/aide', '/aide/:slug',
]);

function AuthenticatedApp() {
  const { pathname } = useLocation();
  const agence = estAgence(useAuth().user);

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
                  {MODULES_DECLARES.flatMap((m) => m.routes.map((r) => ({ ...r, slug: m.slug }))).map((r) => (
                    <Route
                      key={r.path}
                      path={r.path}
                      element={agence && !(r.slug === 'vente' && ROUTES_AGENCE.has(r.path)) ? <AccesReserveSiege /> : r.element}
                    />
                  ))}
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
