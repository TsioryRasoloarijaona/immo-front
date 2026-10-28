import ChampFiche, { BandeFiche } from '../../fiche/ChampFiche';
import { canonicalStatusLabel } from '../../../lib/dossierStatus';
import { formatCurrency, formatDate, formatPercent, formatSurface } from '../../../lib/format';
import type { DossierDetailDto, EnTeteFicheDto } from '../../../types';

/** Bande d'identité du dossier (lecture seule) : identité, article, prix contractuel et réservation. */
export default function BandeDossier({ dossier: d, enTete: e }: Readonly<{ dossier: DossierDetailDto; enTete?: EnTeteFicheDto }>) {
  const article = d.articles?.[0];
  const tranche = d.trancheLibelle || d.trancheCode;
  return (
    <BandeFiche>
      <ChampFiche libelle="Client" valeur={d.clientNom} lien={d.clientId ? `/clients/${d.clientId}` : undefined} />
      <ChampFiche libelle="Tranche" valeur={tranche} lien={d.trancheId ? `/tranches/${d.trancheId}` : undefined} />
      <ChampFiche libelle="Article" type="liste" valeur={article?.code} />
      <ChampFiche libelle="Catégorie" type="liste" valeur={article?.categorieLibelle || article?.categorieCode} />
      <ChampFiche libelle="Type" type="liste" valeur={article?.typeLibelle || article?.typeCode} />
      <ChampFiche libelle="Sup. (m²)" type="montant" valeur={e?.superficie ? formatSurface(e.superficie) : null} />
      <ChampFiche libelle="Statut" type="liste" valeur={canonicalStatusLabel(d.statut)} />
      <ChampFiche libelle="Prix contractuel" type="montant" valeur={formatCurrency(e?.prixContractuel)} />
      <ChampFiche libelle="Prix de vente TTC" type="montant" valeur={formatCurrency(e?.prixVenteTTC)} />
      <ChampFiche libelle="TVA" type="montant" valeur={d.tauxTVA ? formatPercent(d.tauxTVA, 2) : null} />
      <ChampFiche libelle="Réservé le" valeur={formatDate(d.dateDocument)} />
      <ChampFiche libelle="Commercial" valeur={d.commercialNom || '— non assigné —'} />
      <ChampFiche libelle="Société" valeur={d.societeCode} />
    </BandeFiche>
  );
}
