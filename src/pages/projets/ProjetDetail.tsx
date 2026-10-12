import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, LayoutGrid, Pencil, Plus } from 'lucide-react';
import PageShell from '../../components/PageShell';
import ChampsTrace from '../../components/patrimoine/ChampsTrace';
import { useAuth } from '../../lib/auth';
import { estAdministrateur } from '../../lib/roles';
import { Card, EmptyState, ErrorState, Field, FieldGrid, LoadingState } from '../../components/ui';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import { getProjet, listProjetTranches } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { formatDate } from '../../lib/format';

export default function ProjetDetail() {
  const { id = '' } = useParams();
  return <FicheProjet key={id} id={id} />;
}

function FicheProjet({ id }: Readonly<{ id: string }>) {
  const { data: projet, loading, error } = useApi(() => getProjet(id), [id]);
  const [tranchesPage, setTranchesPage] = useState(0);
  const tranches = useApi(() => listProjetTranches(id,{ page: tranchesPage, size: 20 }), [id, tranchesPage]);
  const navigate = useNavigate();
  const admin = estAdministrateur(useAuth().user);

  if (loading) return <PageShell title="Projet"><LoadingState /></PageShell>;
  if (error) return <PageShell title="Projet"><ErrorState message={error} /></PageShell>;
  if (!projet) {
    return (
      <PageShell title="Projet introuvable" crumbs={[{ label: 'Projets', to: '/projets' }]}>
        <p>Ce projet n'existe pas.</p>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={projet.description || projet.code || 'Projet'}
      crumbs={[{ label: 'Projets', to: '/projets' }, { label: projet.code || '' }]}
      icon={<LayoutGrid />}
      accent="var(--sec-projet)"
      accentBg="var(--sec-projet-bg)"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => navigate('/projets')}>
          <ArrowLeft data-icon="inline-start" /> Retour à la liste
        </Button>
        {admin && (
          <>
            <Button variant="outline" size="sm" className="ml-auto" onClick={() => navigate(`/projets/${projet.id}/modifier`)}>
              <Pencil data-icon="inline-start" /> Modifier
            </Button>
            <Button size="sm" onClick={() => navigate(`/tranches/nouveau?projetId=${projet.id}`)}>
              <Plus data-icon="inline-start" /> Nouvelle tranche
            </Button>
          </>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <Card title="Aperçu" accent="var(--sec-projet)">
          <FieldGrid>
            <Field label="Entité" value={projet.entiteLibelle || projet.entiteCode} />
            <Field label="Adresse" value={projet.adresse} />
            <Field label="Ville" value={projet.ville} />
            <Field label="Pays" value={projet.paysLibelle} />
            <Field label="Téléphone" value={projet.telephone} />
            <Field label="Email" value={projet.email} />
            <Field label="Début des travaux" value={formatDate(projet.dateDebutTravaux)} />
            <Field label="Fin des travaux" value={formatDate(projet.dateFinTravaux)} />
            <Field label="Début de commercialisation" value={formatDate(projet.dateDebutCommercialisation)} />
            <Field label="Fin de commercialisation" value={formatDate(projet.dateFinCommercialisation)} />
            <ChampsTrace creePar={projet.creePar} creeLe={projet.creeLe} modifiePar={projet.modifiePar} modifieLe={projet.modifieLe} />
          </FieldGrid>
        </Card>

        <Card title={`Tranches (${tranches.data?.totalElements ?? 0})`}>
          {tranches.loading && <LoadingState />}
          {tranches.error && <ErrorState message={tranches.error} />}
          {tranches.data && tranches.data.content.length === 0 && <EmptyState title="Aucune tranche" />}
          {tranches.data && tranches.data.content.length > 0 && (
            <div className="flex flex-col gap-2">
              {tranches.data.content.map((t) => (
                <Link
                  key={t.id}
                  to={`/tranches/${t.id}`}
                  className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg bg-muted/30 px-3 py-2 text-label no-underline hover:bg-muted"
                >
                  <span className="font-medium text-foreground">{t.description}</span>
                  <span className="text-muted-foreground">{t.code}</span>
                  <span className="text-muted-foreground">{t.ville}</span>
                </Link>
              ))}
            </div>
          )}
          {tranches.data && (
            <Pagination
              page={tranches.data.page}
              totalPages={tranches.data.totalPages}
              totalElements={tranches.data.totalElements}
              onPageChange={setTranchesPage}
            />
          )}
        </Card>
      </div>
    </PageShell>
  );
}
