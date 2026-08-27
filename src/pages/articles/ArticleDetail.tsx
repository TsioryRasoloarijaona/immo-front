import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Folder, Home } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, Card, ErrorState, Field, FieldGrid, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { getArticle, getDossier } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { formatCurrency, formatDate, formatPercent } from '../../lib/format';
import { canonicalStatusLabel, toneForStatus } from '../../lib/dossierStatus';

export default function ArticleDetail() {
  const { id } = useParams();
  const { data: a, loading, error } = useApi(() => getArticle(id!), [id]);
  const navigate = useNavigate();

  // "Dossier de vente" card only fetches/renders when the article is
  // actually reserved/sold (a.dossierId set via the reverse Article→Dossier
  // link on ArticleDetailDto).
  const dossier = useApi(
    () => (a?.dossierId ? getDossier(a.dossierId) : Promise.resolve(null)),
    [a?.dossierId],
  );

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
        { label: 'Patrimoine' },
        { label: 'Articles', to: '/articles' },
        ...(a.trancheId ? [{ label: a.trancheCode || a.trancheDescription || 'Tranche', to: `/tranches/${a.trancheId}` }] : []),
        { label: a.code || '' },
      ]}
      icon={<Home />}
      accent="var(--sec-tranche)"
      accentBg="var(--sec-tranche-bg)"
    >
      <Button variant="outline" size="sm" className="mb-3" onClick={() => navigate(-1)}>
        <ArrowLeft data-icon="inline-start" /> Retour
      </Button>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h1 className="text-[21px] font-semibold tracking-tight text-foreground">{a.code}</h1>
        {a.dossierId ? (
          <Badge tone={toneForStatus(canonicalStatusLabel(a.dossierStatut))}>{canonicalStatusLabel(a.dossierStatut)}</Badge>
        ) : (
          <Badge tone={a.statut === 'DISPONIBLE' ? 'success' : 'neutral'}>{a.statut === 'DISPONIBLE' ? 'Libre' : 'Occupé'}</Badge>
        )}
        {a.lotParentId && <Badge tone="neutral">Sous-article</Badge>}
      </div>

      {a.lotParentId && (
        <button
          type="button"
          onClick={() => navigate(`/articles/${a.lotParentId}`)}
          className="mb-3 flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground hover:underline"
        >
          Fait partie de <span className="font-medium text-foreground">{a.lotParentCode || a.lotParentDescription}</span>
        </button>
      )}

      <div className="flex flex-col gap-3">
        <Card title="Détails" accent="var(--sec-tranche)">
          <FieldGrid>
            <Field label="Description" value={a.description} />
            <Field label="Adresse" value={a.adresse} />
            <Field label="Tranche" value={a.trancheDescription || a.trancheCode} />
            <Field label="Type" value={a.typeLibelle} />
            <Field label="Catégorie" value={a.categorieLibelle} />
            <Field label="Superficie" value={a.area ? `${a.area} m²` : undefined} />
            <Field label="Prix de vente" value={a.salePrice ? formatCurrency(a.salePrice) : undefined} />
            <Field label="Prix de vente commercial" value={a.comSalePrice ? formatCurrency(a.comSalePrice) : undefined} />
            <Field label="Titre foncier" value={a.titreFoncier} />
          </FieldGrid>
        </Card>

        {a.dossierId && (
          <Card
            title="Dossier de vente"
            accent="var(--sec-dossier)"
            action={
              <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/dossiers/${a.dossierId}`)}>
                <Folder data-icon="inline-start" /> Ouvrir le dossier <ArrowUpRight data-icon="inline-end" />
              </Button>
            }
          >
            {dossier.loading && <p className="text-[13px] text-muted-foreground">Chargement…</p>}
            {dossier.error && <ErrorState message={dossier.error} />}
            {dossier.data && (
              <FieldGrid>
                <Field label="Dossier" value={dossier.data.code} />
                <Field label="Statut" value={<Badge tone={toneForStatus(canonicalStatusLabel(dossier.data.statut))}>{canonicalStatusLabel(dossier.data.statut)}</Badge>} />
                <Field label="Client" value={dossier.data.clientNom} />
                <Field label="Commercial" value={dossier.data.commercialNom} />
                <Field label="Prix" value={dossier.data.prix ? formatCurrency(dossier.data.prix) : undefined} />
                <Field label="Total à payer" value={dossier.data.totalAPayer ? formatCurrency(dossier.data.totalAPayer) : undefined} />
                <Field label="Créé le" value={formatDate(dossier.data.dateDocument)} />
                <Field label="Probabilité de finalisation" value={dossier.data.probabiliteFinalisation !== undefined ? formatPercent(dossier.data.probabiliteFinalisation) : undefined} />
              </FieldGrid>
            )}
          </Card>
        )}

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
