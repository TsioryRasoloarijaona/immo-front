import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Eye, FileText, Folder, Home, Pencil } from 'lucide-react';
import PageShell from '../../components/PageShell';
import ChampsTrace from '../../components/patrimoine/ChampsTrace';
import OngletsTransverses from '../../components/patrimoine/OngletsTransverses';
import { useAuth } from '../../lib/auth';
import { estAdministrateur } from '../../lib/roles';
import SousArticlesArticle from './SousArticlesArticle';
import { Badge, Card, EmptyState, ErrorState, Field, FieldGrid, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { getArticle, getDossier, listArticlePiecesJointes, openArticlePieceJointeFichier } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { formatCurrency, formatDate, formatMontantOptionnel, formatPercent, formatSurface, libellePrix } from '../../lib/format';
import { canonicalStatusLabel, toneForStatus } from '../../lib/dossierStatus';
import { pieceJointeTypeTone } from '../../lib/domain';
import type { ArticleDetailDto, PieceJointeDto } from '../../types';

// Lecture seule : aucun endpoint d'envoi ni de suppression pour les pièces d'un article.
function ArticlePieceJointeRow({ articleId, piece }: Readonly<{ articleId: string; piece: PieceJointeDto }>) {
  const [error, setError] = useState<string | null>(null);
  const ext = piece.extension?.replace(/^\./, '') || '';
  const filename = `${piece.description || 'document'}${ext ? '.' + ext : ''}`;

  // URL présignée servie en `inline` : une seule action « Ouvrir », cf. PieceJointeRow (DossierDetail).
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

function EnteteArticle({ a, onParent }: Readonly<{ a: ArticleDetailDto; onParent: () => void }>) {
  const libre = a.statut === 'DISPONIBLE';
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="text-hero font-semibold tracking-tight text-foreground">{a.code}</h2>
        {a.dossierId ? (
          <Badge tone={toneForStatus(canonicalStatusLabel(a.dossierStatut))}>{canonicalStatusLabel(a.dossierStatut)}</Badge>
        ) : (
          <Badge tone={libre ? 'success' : 'neutral'}>{libre ? 'Libre' : 'Occupé'}</Badge>
        )}
        {a.lotParentId && <Badge tone="neutral">Sous-article</Badge>}
      </div>
      {a.lotParentId && (
        <button
          type="button"
          onClick={onParent}
          className="mb-3 flex items-center gap-1.5 text-body text-muted-foreground hover:text-foreground hover:underline"
        >
          Fait partie de <span className="font-medium text-foreground">{a.lotParentCode || a.lotParentDescription}</span>
        </button>
      )}
    </>
  );
}

function DetailsArticle({ a }: Readonly<{ a: ArticleDetailDto }>) {
  return (
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
        <Field label="Superficie" value={a.area ? formatSurface(a.area) : undefined} />
        <Field label="Superficie sous-articles" value={a.superficieSousArticles ? formatSurface(a.superficieSousArticles) : undefined} />
        <Field label="TVA" value={a.tauxTVA != null ? formatPercent(a.tauxTVA) : undefined} />
        <Field label="Vocation" value={a.vocationLibelle} />
        <Field label="Titre foncier" value={a.titreFoncier} />
        <Field label="Titré" value={a.estTitre ? 'Oui' : 'Non'} />
        <ChampsTrace creePar={a.creePar} creeLe={a.creeLe} modifiePar={a.modifiePar} modifieLe={a.modifieLe} />
      </FieldGrid>
    </Card>
  );
}

function PrixArticle({ a }: Readonly<{ a: ArticleDetailDto }>) {
  return (
    <Card title="Prix">
      <FieldGrid>
        <Field label="Superficie provisoire" value={a.surfaceProvisoire ? formatSurface(a.surfaceProvisoire) : undefined} />
        <Field label="Prix article provisoire HT" value={formatMontantOptionnel(a.prixArticleProvisoireHT)} />
        <Field label="Prix article provisoire TTC" value={formatMontantOptionnel(a.prixArticleProvisoireTTC)} />
        <Field label="Superficie définitive" value={a.area ? formatSurface(a.area) : undefined} />
        <Field label="Prix article définitif HT" value={formatMontantOptionnel(a.prixArticleDefinitifHT)} />
        <Field label="Prix article définitif TTC" value={formatMontantOptionnel(a.prixArticleDefinitifTTC)} />
        <Field label="Prix de vente (article + sous-articles)" value={libellePrix(a.comSalePrice, a.comSalePriceFloor)} />
        <Field label="Niveaux de remise" value={`${formatPercent(a.remiseMax1 ?? 0)} / ${formatPercent(a.remiseMax2 ?? 0)}`} />
      </FieldGrid>
    </Card>
  );
}

export default function ArticleDetail() {
  const { id = '' } = useParams();
  return <FicheArticle key={id} id={id} />;
}

function FicheArticle({ id }: Readonly<{ id: string }>) {
  const { data: a, loading, error, refetch } = useApi(() => getArticle(id), [id]);
  const navigate = useNavigate();
  const admin = estAdministrateur(useAuth().user);

  const dossier = useApi(
    () => (a?.dossierId ? getDossier(a.dossierId) : Promise.resolve(null)),
    [a?.dossierId],
  );

  const pieces = useApi(() => listArticlePiecesJointes(id), [id]);

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
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft data-icon="inline-start" /> Retour
        </Button>
        {admin && (
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => navigate(`/articles/${a.id}/modifier`)}>
            <Pencil data-icon="inline-start" /> Modifier
          </Button>
        )}
      </div>

      <EnteteArticle a={a} onParent={() => navigate(`/articles/${a.lotParentId}`)} />

      <div className="flex flex-col gap-3">
        <DetailsArticle a={a} />
        <PrixArticle a={a} />

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

        <SousArticlesArticle article={a} admin={admin} onModifie={() => void refetch()} />

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

        <OngletsTransverses porteur="article" id={a.id} />
      </div>
    </PageShell>
  );
}
