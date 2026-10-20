import { Field, FieldGrid } from '../ui';
import { formatCurrency, formatSurface, libelleTrace } from '../../lib/format';
import type { ArticleDetailDto } from '../../types';

const paire = (ht?: number, ttc?: number) => `${formatCurrency(ht)} / ${formatCurrency(ttc)}`;

/** Prix provisoires et définitifs ; « prix de vente » = article + sous-articles rattachés. */
export default function PrixArticleFiche({ article: a }: Readonly<{ article: ArticleDetailDto }>) {
  return (
    <FieldGrid>
      <Field label="Prix au m² provisoire HT / TTC" value={paire(a.prixM2ProvisoireHT, a.prixM2ProvisoireTTC)} />
      <Field label="Prix au m² définitif HT / TTC" value={paire(a.prixM2DefinitifHT, a.prixM2DefinitifTTC)} />
      <Field label="Article provisoire HT / TTC" value={paire(a.prixArticleProvisoireHT, a.prixArticleProvisoireTTC)} />
      <Field label="Article définitif HT / TTC" value={paire(a.prixArticleDefinitifHT, a.prixArticleDefinitifTTC)} />
      <Field label="Prix de vente provisoire HT / TTC" value={paire(a.prixVenteProvisoireHT, a.prixVenteProvisoireTTC)} />
      <Field label="Prix de vente définitif HT / TTC" value={paire(a.prixVenteDefinitifHT, a.prixVenteDefinitifTTC)} />
      <Field label="Surface provisoire" value={a.surfaceProvisoire ? formatSurface(a.surfaceProvisoire) : undefined} />
      <Field label="Créé par" value={libelleTrace(a.creePar, a.creeLe)} />
      <Field label="Modifié par" value={libelleTrace(a.modifiePar, a.modifieLe)} />
    </FieldGrid>
  );
}
