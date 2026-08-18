import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { ConfirmProvider } from './components/ConfirmModal';
import { PreviewProvider } from './components/PreviewProvider';
import { StoreProvider } from './lib/store';
import Dashboard from './pages/Dashboard';
import ProspectionsList from './pages/prospections/ProspectionsList';
import ProspectionDetail from './pages/prospections/ProspectionDetail';
import ProspectsList from './pages/prospects/ProspectsList';
import NewDossierWizard from './pages/dossiers/wizard/NewDossierWizard';
import RendezVous from './pages/RendezVous';
import DossiersList from './pages/dossiers/DossiersList';
import DossierDetail from './pages/dossiers/DossierDetail';
import ClientsList from './pages/clients/ClientsList';
import ClientDetail from './pages/clients/ClientDetail';
import TranchesList from './pages/tranches/TranchesList';
import TrancheDetail from './pages/tranches/TrancheDetail';
import ArticlesList from './pages/articles/ArticlesList';
import ComingSoon from './pages/ComingSoon';
import NotFound from './pages/NotFound';

function App() {
  return (
    <StoreProvider>
      <ConfirmProvider>
        <PreviewProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/prospections" element={<ProspectionsList />} />
              <Route path="/prospections/:id" element={<ProspectionDetail />} />
              <Route path="/prospections/:id/nouveau-dossier" element={<NewDossierWizard />} />
              <Route path="/prospects" element={<ProspectsList />} />
              <Route path="/clients" element={<ClientsList />} />
              <Route path="/clients/:id" element={<ClientDetail />} />
              <Route path="/dossiers" element={<DossiersList />} />
              <Route path="/dossiers/:id" element={<DossierDetail />} />
              <Route path="/rendez-vous" element={<RendezVous />} />
              <Route path="/tranches" element={<TranchesList />} />
              <Route path="/tranches/:id" element={<TrancheDetail />} />
              <Route path="/articles" element={<ArticlesList />} />
              <Route path="/bientot/:module" element={<ComingSoon />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </PreviewProvider>
      </ConfirmProvider>
    </StoreProvider>
  );
}

export default App;
