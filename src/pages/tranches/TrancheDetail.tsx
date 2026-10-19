import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Building2, CalendarClock, Pencil, Trash2, TrendingUp } from 'lucide-react';
import PageShell from '../../components/PageShell';
import ActionAdmin from '../../components/patrimoine/ActionAdmin';
import ArticlesTranche from '../../components/patrimoine/ArticlesTranche';
import DialogueMiseAJourSchemas from '../../components/patrimoine/DialogueMiseAJourSchemas';
import DialoguePrevisionsBase from '../../components/patrimoine/DialoguePrevisionsBase';
import FicheSections from '../../components/patrimoine/FicheSections';
import OngletsTranche from '../../components/patrimoine/OngletsTranche';
import OngletsTransverses from '../../components/patrimoine/OngletsTransverses';
import { Badge, Card, ErrorState, Field, FieldGrid, LoadingState } from '../../components/ui';
import { getTranche } from '../../lib/api';
import { deleteTranche } from '../../lib/apiPatrimoine';
import { useConfirm } from '../../lib/confirmContext';
import { useApi } from '../../lib/useApi';
import { libelleTrace } from '../../lib/format';
import { SECTIONS_TRANCHE } from '../../lib/saisieTranche';

export default function TrancheDetail() {
  const { id = '' } = useParams();
  return <FicheTranche key={id} id={id} />;
}

function FicheTranche({ id }: Readonly<{ id: string }>) {
  const { data: t, loading, error, refetch } = useApi(() => getTranche(id), [id]);
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [erreurSuppression, setErreurSuppression] = useState<string | null>(null);
  const [dialogue, setDialogue] = useState<'previsions' | 'schemas' | null>(null);

  async function supprimer() {
    const oui = await confirm({
      title: 'Supprimer la tranche',
      message: 'La tranche, ses onglets, ses habilitations, pièces jointes et notes seront supprimés. Continuer ?',
      confirmLabel: 'Supprimer',
    });
    if (!oui) return;
    try {
      await deleteTranche(id);
      void navigate('/tranches');
    } catch (err) {
      setErreurSuppression(err instanceof Error ? err.message : 'Suppression impossible.');
    }
  }

  // `!t` : un rechargement (plancher couvert enregistré) garde la fiche et l'onglet ouvert.
  if (loading && !t) return <PageShell title="Tranche"><LoadingState /></PageShell>;
  if (error) return <PageShell title="Tranche"><ErrorState message={error} /></PageShell>;
  if (!t) {
    return (
      <PageShell title="Tranche introuvable" crumbs={[{ label: 'Tranches', to: '/tranches' }]}>
        <p>Cette tranche n'existe pas.</p>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={t.description || t.code || 'Tranche'}
      crumbs={[{ label: 'Tranches', to: '/tranches' }, { label: t.code || '' }]}
      icon={<Building2 />}
      accent="var(--sec-tranche)"
      accentBg="var(--sec-tranche-bg)"
      actions={
        <div className="flex flex-wrap gap-2">
          <ActionAdmin onClick={() => setDialogue('previsions')} libelle="Prévisions de base" variant="outline"
            icone={<TrendingUp data-icon="inline-start" />} />
          <ActionAdmin onClick={() => setDialogue('schemas')} libelle="Mettre à jour les schémas de financement" variant="outline"
            icone={<CalendarClock data-icon="inline-start" />} />
          <ActionAdmin onClick={() => void supprimer()} libelle="Supprimer" variant="outline" icone={<Trash2 data-icon="inline-start" />} />
          <ActionAdmin to={`/tranches/${id}/modifier`} libelle="Modifier" variant="outline" icone={<Pencil data-icon="inline-start" />} />
          <ActionAdmin to={`/articles/nouveau?trancheId=${id}`} libelle="Nouvel article" />
        </div>
      }
    >
      <div className="flex flex-col gap-3 pt-1">
        {erreurSuppression && <p className="text-label text-destructive">{erreurSuppression}</p>}
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-title font-semibold tracking-tight text-foreground">{t.description}</h2>
          <span className="font-mono text-micro text-muted-foreground">{t.code}</span>
          {t.standingLibelle && <Badge tone="info">{t.standingLibelle}</Badge>}
          {t.estEnVente && <Badge tone="info">Vente</Badge>}
          {t.estEnLocation && <Badge tone="info">Location</Badge>}
        </div>

        <FicheSections sections={SECTIONS_TRANCHE} source={t} />

        <Card title="Traçabilité">
          <FieldGrid>
            <Field label="Entité" value={t.entiteCode} />
            <Field label="Créé par" value={libelleTrace(t.creePar, t.creeLe)} />
            <Field label="Modifié par" value={libelleTrace(t.modifiePar, t.modifieLe)} />
          </FieldGrid>
        </Card>

        <OngletsTranche trancheId={id} onPlancherEnregistre={() => void refetch()} />
        <ArticlesTranche trancheId={id} />
        <OngletsTransverses porteur="tranche" id={id} />
      </div>
      {dialogue === 'previsions' && <DialoguePrevisionsBase trancheId={id} onClose={() => setDialogue(null)} />}
      {dialogue === 'schemas' && <DialogueMiseAJourSchemas trancheId={id} onClose={() => setDialogue(null)} />}
    </PageShell>
  );
}
