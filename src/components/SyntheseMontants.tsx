import { Ban } from 'lucide-react';
import { formatCurrency, formatPercent } from '../lib/format';
import { cn } from '../lib/utils';
import type { MontantsDossierDto, SyntheseMontantDto } from '../types';

/* `prixVente` et `netAPayer` ne sont pas des catégories, et les catégories ne
 * s'additionnent pas jusqu'au prix (frais exclus) : les tenir dans deux blocs,
 * sinon la table suggère une addition fausse. */

function Ligne({
  libelle,
  valeurs,
  synthese,
  detail,
}: {
  libelle: string;
  valeurs: SyntheseMontantDto | undefined;
  synthese?: boolean;
  detail?: string;
}) {
  if (!valeurs) return null;
  const reste = valeurs.reste ?? 0;
  return (
    <tr className={cn('border-t border-border', synthese && 'bg-secondary/30')}>
      <th
        scope="row"
        className={cn(
          'py-1 pr-2 text-left text-body font-normal text-muted-foreground',
          synthese && 'font-semibold text-foreground',
        )}
      >
        {libelle}
        {detail && <span className="ml-1.5 text-micro text-muted-foreground">{detail}</span>}
      </th>
      <td className={cn('py-1 pl-2 text-right text-body tabular-nums text-foreground', synthese && 'font-semibold')}>
        {formatCurrency(valeurs.montant ?? 0)}
      </td>
      <td className="py-1 pl-2 text-right text-body tabular-nums text-(--success)">
        {formatCurrency(valeurs.regle ?? 0)}
      </td>
      <td
        className={cn(
          'py-1 pl-2 text-right text-body tabular-nums',
          reste > 0 ? 'font-medium text-(--warning)' : 'text-muted-foreground',
          synthese && 'font-semibold',
        )}
      >
        {formatCurrency(reste)}
      </td>
    </tr>
  );
}

export default function SyntheseMontants({
  montants,
  probabiliteFinalisation,
}: {
  montants: MontantsDossierDto;
  /** Fraction, pas pourcentage : `1` vaut 100 %. */
  probabiliteFinalisation?: number;
}) {
  const categories = montants.parCategorie ?? [];

  return (
    <div className="flex h-full flex-col">
      {/* Dossier sorti : le reste tombe à zéro par règle métier ; sans ce bandeau
          on lirait « plus rien à encaisser » au lieu de « dossier annulé ». */}
      {montants.dossierSorti && (
        <div className="mb-2 flex items-start gap-1.5 rounded-lg border border-destructive/40 bg-destructive/5 px-2.5 py-1.5">
          <Ban aria-hidden className="mt-0.5 size-3.5 shrink-0 text-destructive" />
          <p className="text-micro text-foreground">
            <span className="font-semibold text-destructive">Dossier sorti</span> — annulation ou désistement. Le net à
            payer se réduit à ce qui a été encaissé et son reste vaut zéro : le dossier ne reste rien devoir.
          </p>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th scope="col" className="pb-1 text-left text-micro font-medium text-muted-foreground">
                Catégorie
              </th>
              <th scope="col" className="pb-1 pl-2 text-right text-micro font-medium text-muted-foreground">
                Montant
              </th>
              <th scope="col" className="pb-1 pl-2 text-right text-micro font-medium text-muted-foreground">
                Réglé
              </th>
              <th scope="col" className="pb-1 pl-2 text-right text-micro font-medium text-muted-foreground">
                Reste
              </th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && (
              <tr className="border-t border-border">
                <td colSpan={4} className="py-2 text-body text-muted-foreground">
                  Aucun échéancier — les lignes de synthèse restent servies, avec un réglé nul.
                </td>
              </tr>
            )}
            {categories.map((c) => (
              <Ligne
                key={c.categorie}
                libelle={c.categorie || '—'}
                detail={c.nombreLignes ? `${c.nombreLignes} l.` : undefined}
                valeurs={{ montant: c.montant, regle: c.regle, reste: c.reste }}
              />
            ))}

            <tr aria-hidden>
              <td colSpan={4} className="pt-1.5" />
            </tr>
            <Ligne libelle="Prix de vente" valeurs={montants.prixVente} synthese />
            <Ligne libelle="Net à payer" valeurs={montants.netAPayer} synthese />
          </tbody>
        </table>
      </div>

      {typeof probabiliteFinalisation === 'number' && (
        <div className="mt-2 flex shrink-0 items-baseline justify-between gap-2 border-t border-border pt-2">
          <span className="text-micro font-medium text-muted-foreground">Probabilité de finalisation</span>
          {/* Fraction, pas pourcentage : `formatNumber` afficherait « 0 ». */}
          <span className="text-label font-semibold tabular-nums text-foreground">
            {formatPercent(probabiliteFinalisation, 2)}
          </span>
        </div>
      )}
    </div>
  );
}
