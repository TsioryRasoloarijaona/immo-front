import { useState } from 'react';
import { ArrowUpRight, Eye, FileText, Folder } from 'lucide-react';
import { Badge, EmptyState, ErrorState, Field, FieldGrid, LoadingState } from '../ui';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { openArticlePieceJointeFichier } from '../../lib/api';
import { canonicalStatusLabel, toneForStatus } from '../../lib/dossierStatus';
import { pieceJointeTypeTone } from '../../lib/domain';
import { formatCurrency, formatDate, formatPercent, formatSurface, libellePrix } from '../../lib/format';
import type { ApiState } from '../../lib/useApi';
import type { ArticleDetailDto, DossierDetailDto, PieceJointeDto } from '../../types';

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

export function PiecesArticle({ articleId, pieces }: Readonly<{ articleId: string; pieces: ApiState<PieceJointeDto[]> }>) {
  const { data, loading, error } = pieces;
  return (
    <>
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {data?.length === 0 && <EmptyState title="Aucune pièce jointe" message="Aucun plan n'a été attaché à cet article." />}
      {data && data.length > 0 && (
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
              {data.map((p) => (
                <ArticlePieceJointeRow key={p.id} articleId={articleId} piece={p} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}

export function IdentiteArticle({ article: a }: Readonly<{ article: ArticleDetailDto }>) {
  return (
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
      <Field label="Prix de vente" value={libellePrix(a.salePrice, a.salePriceFloor)} />
      <Field label="Prix de vente commercial" value={libellePrix(a.comSalePrice, a.comSalePriceFloor)} />
    </FieldGrid>
  );
}

export function DossierVenteArticle({ dossier, onOuvrir }: Readonly<{
  dossier: ApiState<DossierDetailDto | null>;
  onOuvrir: () => void;
}>) {
  const d = dossier.data;
  return (
    <div className="flex flex-col gap-2">
      <Button type="button" variant="outline" size="sm" className="self-end" onClick={onOuvrir}>
        <Folder data-icon="inline-start" /> Ouvrir le dossier <ArrowUpRight data-icon="inline-end" />
      </Button>
      {dossier.loading && <p className="text-label text-muted-foreground">Chargement…</p>}
      {dossier.error && <ErrorState message={dossier.error} />}
      {d && (
        <FieldGrid>
          <Field label="Dossier" value={d.code} />
          <Field label="Statut" value={<Badge tone={toneForStatus(canonicalStatusLabel(d.statut))}>{canonicalStatusLabel(d.statut)}</Badge>} />
          <Field label="Client" value={d.clientNom} />
          <Field label="Commercial" value={d.commercialNom} />
          <Field label="Prix" value={d.prix ? formatCurrency(d.prix) : undefined} />
          <Field label="Total à payer" value={d.totalAPayer ? formatCurrency(d.totalAPayer) : undefined} />
          <Field label="Créé le" value={formatDate(d.dateDocument)} />
          <Field label="Probabilité de finalisation" value={d.probabiliteFinalisation !== undefined ? formatPercent(d.probabiliteFinalisation) : undefined} />
        </FieldGrid>
      )}
    </div>
  );
}
