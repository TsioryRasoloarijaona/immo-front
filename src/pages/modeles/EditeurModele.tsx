import { useParams } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import { ErrorState, LoadingState } from '../../components/ui';
import EditeurModeleCharge from '../../components/modeles/EditeurModeleCharge';
import { getCatalogueChamps, getModele } from '../../lib/apiModeles';
import { useAuth } from '../../lib/auth';
import { estAdministrateur } from '../../lib/roles';
import { useApi } from '../../lib/useApi';
import AdminGuard from '../utilisateurs/AdminGuard';

const TITRE = 'Modèle de document';
const FIL = [{ label: 'Administration' }, { label: 'Modèles de documents', to: '/modeles-documents' }];

/** Charge le modèle et le catalogue de sa catégorie, puis monte l'éditeur une seule fois (clé = id). */
function Chargement({ id }: Readonly<{ id: string }>) {
  const modele = useApi(() => getModele(id), [id]);
  const categorie = modele.data?.categorie;
  const catalogue = useApi(() => (categorie ? getCatalogueChamps(categorie) : Promise.resolve(null)), [categorie]);

  const erreur = modele.error ?? catalogue.error;
  if (erreur) {
    return (
      <PageShell title={TITRE} crumbs={FIL}>
        <ErrorState message={erreur} />
      </PageShell>
    );
  }
  if (!modele.data || !catalogue.data) {
    return (
      <PageShell title={TITRE} crumbs={FIL}>
        <LoadingState />
      </PageShell>
    );
  }
  return <EditeurModeleCharge key={modele.data.id} modele={modele.data} catalogue={catalogue.data} />;
}

/** `/modeles-documents/:id` — éditeur page type Word (FEATURE-modeles-documents.md §9). */
export default function EditeurModele() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  if (!estAdministrateur(user)) {
    return <AdminGuard title={TITRE} crumbs={FIL}>{null}</AdminGuard>;
  }
  return id ? <Chargement id={id} /> : null;
}
