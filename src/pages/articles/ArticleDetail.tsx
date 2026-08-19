import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, Card, ErrorState, Field, FieldGrid, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { getArticle } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { formatCurrency } from '../../lib/format';

export default function ArticleDetail() {
  const { id } = useParams();
  const { data: a, loading, error } = useApi(() => getArticle(id!), [id]);
  const navigate = useNavigate();

  if (loading) return <PageShell title="Article"><LoadingState /></PageShell>;
  if (error) return <PageShell title="Article"><ErrorState message={error} /></PageShell>;
  if (!a) {
    return (
      <PageShell title="Article introuvable" crumbs={[{ label: 'Tranches', to: '/tranches' }]}>
        <p>Cet article n'existe pas.</p>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={a.code || 'Article'}
      crumbs={[
        { label: 'Tranches', to: '/tranches' },
        ...(a.trancheId ? [{ label: 'Tranche', to: `/tranches/${a.trancheId}` }] : []),
        { label: a.code || '' },
      ]}
    >
      <Button variant="outline" size="sm" className="mb-3" onClick={() => navigate(-1)}>
        <ArrowLeft data-icon="inline-start" /> Retour
      </Button>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h1 className="text-[21px] font-semibold tracking-tight text-foreground">{a.code}</h1>
        <Badge tone={a.statut === 'DISPONIBLE' ? 'success' : 'neutral'}>{a.statut === 'DISPONIBLE' ? 'Disponible' : 'Occupé'}</Badge>
      </div>

      <div className="flex flex-col gap-3">
        <Card title="Détails">
          <FieldGrid>
            <Field label="Description" value={a.description} />
            <Field label="Adresse" value={a.adresse} />
            <Field label="Type" value={a.type} />
            <Field label="Catégorie" value={a.categorie} />
            <Field label="Superficie" value={a.area ? `${a.area} m²` : undefined} />
            <Field label="Prix de vente" value={a.salePrice ? formatCurrency(a.salePrice) : undefined} />
            <Field label="Prix de vente commercial" value={a.comSalePrice ? formatCurrency(a.comSalePrice) : undefined} />
            <Field label="Titre foncier" value={a.titreFoncier} />
          </FieldGrid>
        </Card>

        {a.sousLots && a.sousLots.length > 0 && (
          <Card title={`Sous-lots (${a.sousLots.length})`}>
            <div className="flex flex-col gap-2">
              {a.sousLots.map((s) => (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-md border border-border px-3 py-2 text-[13px]">
                  <span className="font-medium text-foreground">{s.code}</span>
                  <span className="text-muted-foreground">{s.description}</span>
                  <span className="font-medium tabular-nums text-foreground">{formatCurrency(s.salePrice)}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
