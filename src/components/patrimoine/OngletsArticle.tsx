import { ArrowUpRight, Folder } from 'lucide-react';
import { Badge, ErrorState, Field, FieldGrid } from '../ui';
import { Button } from '../ui/button';
import { canonicalStatusLabel, toneForStatus } from '../../lib/dossierStatus';
import { formatCurrency, formatDate, formatPercent, formatSurface, libellePrix } from '../../lib/format';
import type { ApiState } from '../../lib/useApi';
import type { ArticleDetailDto, DossierDetailDto } from '../../types';

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
