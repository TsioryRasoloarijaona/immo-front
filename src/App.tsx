import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { ConfirmProvider } from './components/ConfirmModal';
import { PreviewProvider } from './components/PreviewProvider';
import { AppDataProvider } from './lib/appData';
import Dashboard from './pages/Dashboard';
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

function App() {
  return (
    <AppDataProvider>
      <ConfirmProvider>
        <PreviewProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
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

export default App;
