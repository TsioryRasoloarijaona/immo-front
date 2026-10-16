import { Badge } from '../ui';
import { avecCles } from '../../lib/cles';
import { formatCurrency } from '../../lib/format';
import type { FicheDevisDto } from '../../types';

/**
 * Schéma saisi sur l'offre (`StlQuoteDocument`) : le serveur le recopie tel quel en échéancier du dossier, à la
 * place du schéma calculé (FEATURE-offre-vers-dossier.md B3). Rien si l'offre n'en a pas.
 */
export default function SchemaDeLOffre({ fiche }: Readonly<{ fiche: FicheDevisDto | null }>) {
  if (!fiche?.schemaFinancementSaisi) return null;
  const lignes = fiche.offre.schemaFinancement ?? [];
  const total = lignes.reduce((somme, l) => somme + (l.montant ?? 0), 0);
  return (
    <div className="mb-3 flex flex-col gap-1.5 rounded-lg border border-(--info-border) bg-(--info-bg) p-3">
      <span className="text-label font-semibold text-foreground">
        Échéancier repris de l'offre {fiche.offre.code ?? ''}
      </span>
      <p className="text-micro text-muted-foreground">
        Ce schéma, saisi sur l'offre, sera enregistré tel quel comme échéancier du dossier, à la place du calcul
        ci-dessous — même si le prix est modifié.
      </p>
      {avecCles(lignes, (l) => `${l.categorie}-${l.montant}`).map(({ item: ligne, cle }) => (
        <div key={cle} className="flex items-center justify-between gap-3 text-label">
          <span className="flex items-center gap-2 text-foreground">
            {ligne.categorie}
            {ligne.exclureDuPrix && <Badge tone="neutral">Hors prix</Badge>}
          </span>
          <span className="tabular-nums text-foreground">{formatCurrency(ligne.montant ?? 0)}</span>
        </div>
      ))}
      <div className="flex items-center justify-between border-t border-border pt-1.5 text-label font-semibold">
        <span>Total</span>
        <span className="tabular-nums">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}
