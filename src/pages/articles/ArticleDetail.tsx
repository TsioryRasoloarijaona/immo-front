import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Eye, FileText, Folder, Home } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, Card, EmptyState, ErrorState, Field, FieldGrid, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { getArticle, getDossier, listArticlePiecesJointes, openArticlePieceJointeFichier } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { formatCurrency, formatDate, formatPercent } from '../../lib/format';
import { canonicalStatusLabel, toneForStatus } from '../../lib/dossierStatus';
import { pieceJointeTypeTone } from '../../lib/domain';
import type { PieceJointeDto } from '../../types';

/** Read-only counterpart of `PieceJointeRow` in `DossierDetail.tsx` — same
 * row shape (Fichier/Déposé par/Type/Date/Actions), but no upload endpoint
 * exists for articles, so no add-row/delete affordance — and a single open
 * action rather than a view/download pair, for the reason spelled out on
 * `PieceJointeRow`. */
function ArticlePieceJointeRow({ articleId, piece }: { articleId: string; piece: PieceJointeDto }) {
  const [error, setError] = useState<string | null>(null);
  const ext = piece.extension?.replace(/^\./, '') || '';
  const filename = `${piece.description || 'document'}${ext ? `.${ext}` : ''}`;

  // Cf. PieceJointeRow (DossierDetail) : navigation vers le stockage.
  function handle() {
    setError(null);
    try {
      openArticlePieceJointeFichier(articleId, piece.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'opération.");
    }
  }

  return (
    <TableRow className="hover:bg-muted/40">
      <TableCell>
        <span className="flex min-w-0 items-center gap-2">
          <FileText className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate font-medium text-foreground">{filename}</span>
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground">{piece.creePar || '—'}</TableCell>
      <TableCell>
        {piece.type ? <Badge tone={pieceJointeTypeTone(piece.type)}>{piece.type}</Badge> : <span className="text-muted-foreground">—</span>}
      </TableCell>
      <TableCell className="text-right text-muted-foreground">{formatDate(piece.dateCreation)}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          {error && <span className="text-micro text-destructive">{error}</span>}
          <Button type="button" variant="ghost" size="sm" onClick={handle}>
            <Eye data-icon="inline-start" /> Ouvrir <ArrowUpRight data-icon="inline-end" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

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

  const pieces = useApi(() => listArticlePiecesJointes(id!), [id]);

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
        <h2 className="text-hero font-semibold tracking-tight text-foreground">{a.code}</h2>
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
          className="mb-3 flex items-center gap-1.5 text-body text-muted-foreground hover:text-foreground hover:underline"
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
            <Field label="Type présentation" value={a.presentationTypeLibelle || a.presentationTypeCode} />
            <Field label="Nature" value={a.natureLibelle} />
            <Field label="Immeuble" value={a.immeubleLibelle} />
            <Field label="Étage" value={a.etageLibelle} />
            <Field label="Superficie" value={a.area ? `${a.area} m²` : undefined} />
            <Field label="Superficie sous-articles" value={a.superficieSousArticles ? `${a.superficieSousArticles} m²` : undefined} />
            <Field label="TVA" value={a.tauxTVA != null ? formatPercent(a.tauxTVA) : undefined} />
            <Field
              label="Prix de vente"
              value={a.salePrice ? formatCurrency(a.salePrice) : a.salePriceFloor ? `${formatCurrency(a.salePriceFloor)} (plancher)` : undefined}
            />
            <Field
              label="Prix de vente commercial"
              value={a.comSalePrice ? formatCurrency(a.comSalePrice) : a.comSalePriceFloor ? `${formatCurrency(a.comSalePriceFloor)} (plancher)` : undefined}
            />
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
            {dossier.loading && <p className="text-label text-muted-foreground">Chargement…</p>}
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
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg bg-muted/30 px-3 py-2 text-label">
                  <span className="font-medium text-foreground">{s.code}</span>
                  <span className="text-muted-foreground">{s.description}</span>
                  <span className="font-medium tabular-nums text-foreground">{formatCurrency(s.salePrice)}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card title={`Pièces jointes (${pieces.data?.length ?? 0})`}>
          {pieces.loading && <LoadingState />}
          {pieces.error && <ErrorState message={pieces.error} />}
          {pieces.data && pieces.data.length === 0 && (
            <EmptyState title="Aucune pièce jointe" message="Aucun plan n'a été attaché à cet article." />
          )}
          {pieces.data && pieces.data.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Fichier</TableHead>
                    <TableHead>Déposé par</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pieces.data.map((p) => (
                    <ArticlePieceJointeRow key={p.id} articleId={a.id} piece={p} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
