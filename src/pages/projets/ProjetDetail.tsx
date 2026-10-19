import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, LayoutGrid, Pencil, Trash2 } from 'lucide-react';
import PageShell from '../../components/PageShell';
import ActionAdmin from '../../components/patrimoine/ActionAdmin';
import FicheSections from '../../components/patrimoine/FicheSections';
import ZonesProjet from '../../components/patrimoine/ZonesProjet';
import { Card, EmptyState, ErrorState, Field, FieldGrid, LoadingState } from '../../components/ui';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import { getProjet, listProjetTranches } from '../../lib/api';
import { deleteProjet } from '../../lib/apiPatrimoine';
import { useConfirm } from '../../lib/confirmContext';
import { useApi } from '../../lib/useApi';
import { libelleTrace } from '../../lib/format';
import { SECTIONS_PROJET } from '../../lib/saisieProjet';

export default function ProjetDetail() {
  const { id = '' } = useParams();
  return <FicheProjet key={id} id={id} />;
}

function FicheProjet({ id }: Readonly<{ id: string }>) {
  const { data: projet, loading, error } = useApi(() => getProjet(id), [id]);
  const [tranchesPage, setTranchesPage] = useState(0);
  const tranches = useApi(() => listProjetTranches(id,{ page: tranchesPage, size: 20 }), [id, tranchesPage]);
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [erreurSuppression, setErreurSuppression] = useState<string | null>(null);

  async function supprimer() {
    const oui = await confirm({
      title: 'Supprimer le programme',
      message: 'Le programme, ses zones et ses habilitations seront supprimés. Continuer ?',
      confirmLabel: 'Supprimer',
    });
    if (!oui) return;
    try {
      await deleteProjet(id);
      void navigate('/projets');
    } catch (err) {
      setErreurSuppression(err instanceof Error ? err.message : 'Suppression impossible.');
    }
  }

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
      actions={
        <div className="flex gap-2">
          <ActionAdmin onClick={() => void supprimer()} libelle="Supprimer" variant="outline" icone={<Trash2 data-icon="inline-start" />} />
          <ActionAdmin to={`/projets/${id}/modifier`} libelle="Modifier" variant="outline" icone={<Pencil data-icon="inline-start" />} />
          <ActionAdmin to={`/tranches/nouveau?projetId=${id}`} libelle="Nouvelle tranche" />
        </div>
      }
    >
      <Button variant="outline" size="sm" className="mb-3" onClick={() => navigate('/projets')}>
        <ArrowLeft data-icon="inline-start" /> Retour à la liste
      </Button>
      {erreurSuppression && <p className="mb-3 text-label text-destructive">{erreurSuppression}</p>}

      <div className="flex flex-col gap-3">
        <FicheSections sections={SECTIONS_PROJET} source={projet} />

        <Card title="Traçabilité">
          <FieldGrid>
            <Field label="Créé par" value={libelleTrace(projet.creePar, projet.creeLe)} />
            <Field label="Modifié par" value={libelleTrace(projet.modifiePar, projet.modifieLe)} />
          </FieldGrid>
        </Card>

        <ZonesProjet projetId={id} />

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
