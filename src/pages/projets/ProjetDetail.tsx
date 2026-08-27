import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, LayoutGrid } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Card, EmptyState, ErrorState, Field, FieldGrid, LoadingState } from '../../components/ui';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import { getProjet, listProjetTranches } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { formatDate } from '../../lib/format';

export default function ProjetDetail() {
  const { id } = useParams();
  const { data: projet, loading, error } = useApi(() => getProjet(id!), [id]);
  const [tranchesPage, setTranchesPage] = useState(0);
  const tranches = useApi(() => listProjetTranches(id!, { page: tranchesPage, size: 20 }), [id, tranchesPage]);
  const navigate = useNavigate();

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
      <Button variant="outline" size="sm" className="mb-3" onClick={() => navigate('/projets')}>
        <ArrowLeft data-icon="inline-start" /> Retour à la liste
      </Button>

      <div className="flex flex-col gap-3">
        <Card title="Aperçu" accent="var(--sec-projet)">
          <FieldGrid>
            <Field label="Adresse" value={projet.adresse} />
            <Field label="Ville" value={projet.ville} />
            <Field label="Téléphone" value={projet.telephone} />
            <Field label="Email" value={projet.email} />
            <Field label="Début des travaux" value={formatDate(projet.dateDebutTravaux)} />
            <Field label="Fin des travaux" value={formatDate(projet.dateFinTravaux)} />
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
                  className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-md border border-border px-3 py-2 text-[13px] no-underline hover:bg-muted"
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
