import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, LayoutGrid, Pencil, Plus, Trash2 } from 'lucide-react';
import PageShell from '../../components/PageShell';
import ChampsTrace from '../../components/patrimoine/ChampsTrace';
import { BlocFiche } from '../../components/patrimoine/FicheDeclaree';
import OngletsTransverses from '../../components/patrimoine/OngletsTransverses';
import { useAuth } from '../../lib/auth';
import { estAdministrateur } from '../../lib/roles';
import { Card, EmptyState, ErrorState, Field, LoadingState } from '../../components/ui';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import { deleteProjet, getProjet, listProjetTranches } from '../../lib/api';
import { useConfirm } from '../../lib/confirmContext';
import { useToast } from '../../lib/toastContext';
import { errorMessage, useApi } from '../../lib/useApi';
import type { ProjetDetailDto } from '../../types';
import { ADMINISTRATION, AUTRES, COORDONNEES, DELAIS, GENERAL } from './champsProjet';
import ZonesProjet from './ZonesProjet';

export default function ProjetDetail() {
  const { id = '' } = useParams();
  return <FicheProjet key={id} id={id} />;
}

function FicheProjet({ id }: Readonly<{ id: string }>) {
  const { data: projet, loading, error } = useApi(() => getProjet(id), [id]);
  const admin = estAdministrateur(useAuth().user);

  if (loading && !projet) return <PageShell title="Projet"><LoadingState /></PageShell>;
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
      <ActionsProjet projet={projet} admin={admin} />
      <div className="flex flex-col gap-3">
        <BlocFiche
          titre="Général"
          defs={GENERAL}
          fiche={projet}
          accent="var(--sec-projet)"
          suite={<Field label="Entité" value={projet.entiteLibelle || projet.entiteCode} />}
        />
        <BlocFiche titre="Délais" defs={DELAIS} fiche={projet} />
        <BlocFiche titre="Coordonnées" defs={COORDONNEES} fiche={projet} />
        <BlocFiche
          titre="Administration"
          defs={ADMINISTRATION}
          fiche={projet}
          suite={<Field label="Représentant légal (entité)" value={projet.representantLegal} />}
        />
        <BlocFiche
          titre="Autres"
          defs={AUTRES}
          fiche={projet}
          suite={<ChampsTrace creePar={projet.creePar} creeLe={projet.creeLe} modifiePar={projet.modifiePar} modifieLe={projet.modifieLe} />}
        />
        <ZonesProjet projetId={projet.id} admin={admin} />
        <TranchesProjet projetId={projet.id} />
        <OngletsTransverses porteur="projet" id={projet.id} />
      </div>
    </PageShell>
  );
}

function ActionsProjet({ projet, admin }: Readonly<{ projet: ProjetDetailDto; admin: boolean }>) {
  const navigate = useNavigate();
  const confirmer = useConfirm();
  const toast = useToast();
  const [suppression, setSuppression] = useState(false);

  async function supprimer() {
    const ok = await confirmer({
      title: 'Supprimer le programme',
      message: `Supprimer le programme « ${projet.description ?? projet.code} » ? Ses zones et habilitations seront supprimées avec lui.`,
      confirmLabel: 'Supprimer',
    });
    if (!ok) return;
    setSuppression(true);
    try {
      await deleteProjet(projet.id);
      toast({ texte: 'Programme supprimé.', variante: 'succes' });
      void navigate('/projets');
    } catch (err) {
      // 409 : le message du serveur liste ce qui bloque (tranches, articles…).
      toast({ texte: errorMessage(err), variante: 'erreur' });
    } finally {
      setSuppression(false);
    }
  }

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => void navigate('/projets')}>
        <ArrowLeft data-icon="inline-start" /> Retour à la liste
      </Button>
      {admin && (
        <>
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => void navigate(`/projets/${projet.id}/modifier`)}>
            <Pencil data-icon="inline-start" /> Modifier
          </Button>
          <Button variant="outline" size="sm" disabled={suppression} onClick={() => void supprimer()}>
            <Trash2 data-icon="inline-start" /> {suppression ? 'Suppression…' : 'Supprimer'}
          </Button>
          <Button size="sm" onClick={() => void navigate(`/tranches/nouveau?projetId=${projet.id}`)}>
            <Plus data-icon="inline-start" /> Nouvelle tranche
          </Button>
        </>
      )}
    </div>
  );
}

function TranchesProjet({ projetId }: Readonly<{ projetId: string }>) {
  const [page, setPage] = useState(0);
  const tranches = useApi(() => listProjetTranches(projetId, { page, size: 20 }), [projetId, page]);
  return (
    <Card title={`Tranches (${tranches.data?.totalElements ?? 0})`}>
      {tranches.loading && !tranches.data && <LoadingState />}
      {tranches.error && <ErrorState message={tranches.error} />}
      {!tranches.error && tranches.data && tranches.data.content.length === 0 && <EmptyState title="Aucune tranche" />}
      {!tranches.error && tranches.data && tranches.data.content.length > 0 && (
        <div className="flex flex-col gap-2">
          {tranches.data.content.map((t) => (
            <Link
              key={t.id}
              to={`/tranches/${t.id}`}
              className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg bg-muted/30 px-3 py-2 text-label no-underline hover:bg-muted"
            >
              <span className="font-medium text-foreground">{t.description}</span>
              <span className="text-muted-foreground">{t.code}</span>
              <span className="text-muted-foreground">{t.standingLibelle}</span>
              <span className="text-muted-foreground">{t.ville}</span>
            </Link>
          ))}
        </div>
      )}
      {tranches.data && (
        <Pagination page={tranches.data.page} totalPages={tranches.data.totalPages} totalElements={tranches.data.totalElements} onPageChange={setPage} />
      )}
    </Card>
  );
}
