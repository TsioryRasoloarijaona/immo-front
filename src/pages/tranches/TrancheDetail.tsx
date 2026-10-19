import { useParams } from 'react-router-dom';
import { Building2, Pencil } from 'lucide-react';
import PageShell from '../../components/PageShell';
import ActionAdmin from '../../components/patrimoine/ActionAdmin';
import ArticlesTranche from '../../components/patrimoine/ArticlesTranche';
import FicheSections from '../../components/patrimoine/FicheSections';
import { Badge, Card, ErrorState, Field, FieldGrid, LoadingState } from '../../components/ui';
import { getTranche } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { libelleTrace } from '../../lib/format';
import { SECTIONS_TRANCHE } from '../../lib/saisieTranche';

export default function TrancheDetail() {
  const { id = '' } = useParams();
  return <FicheTranche key={id} id={id} />;
}

function FicheTranche({ id }: Readonly<{ id: string }>) {
  const { data: t, loading, error } = useApi(() => getTranche(id), [id]);

  if (loading) return <PageShell title="Tranche"><LoadingState /></PageShell>;
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
        <div className="flex gap-2">
          <ActionAdmin to={`/tranches/${id}/modifier`} libelle="Modifier" variant="outline" icone={<Pencil data-icon="inline-start" />} />
          <ActionAdmin to={`/articles/nouveau?trancheId=${id}`} libelle="Nouvel article" />
        </div>
      }
    >
      <div className="flex flex-col gap-3 pt-1">
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

        <ArticlesTranche trancheId={id} />
      </div>
    </PageShell>
  );
}
