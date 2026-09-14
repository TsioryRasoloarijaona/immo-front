import { Ban } from 'lucide-react';
import { formatCurrency } from '../lib/format';
import { cn } from '../lib/utils';
import type { MontantsDossierDto, SyntheseMontantDto } from '../types';

/* La synthèse financière — l'onglet que le logiciel de bureau ouvre par défaut
 * sur sa fiche dossier, et la raison d'être de l'écran.
 *
 * Trois colonnes, Montant / Réglé / Reste, comme là-bas. Le rouge du reste est
 * repris tel quel : c'est le seul endroit de l'application où une couleur porte
 * une information que le commercial cherche activement — « combien reste-t-il à
 * encaisser ». Il ne la porte pas **seule** pour autant, la colonne est
 * étiquetée et les montants sont alignés.
 *
 * Ce que la version d'avant faisait mal : elle listait `parCategorie` et
 * s'arrêtait là. Or `prixVente` et `netAPayer` **ne sont pas des catégories**,
 * et les catégories ne s'additionnent pas jusqu'au prix — mesuré, un dossier
 * porte 1 046 100 DH en AVANCE pour un prix de 837 000, l'écart étant les frais
 * exclus du prix. Les empiler dans la même liste donnait une addition fausse. */

function Ligne({
  libelle,
  valeurs,
  synthese,
  detail,
}: {
  libelle: string;
  valeurs: SyntheseMontantDto | undefined;
  /** Les deux lignes de synthèse sont séparées visuellement des catégories. */
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
          // Un reste nul n'est pas une alerte : il se lit en gris, comme chez
          // Omran, qui ne met en rouge que ce qui est effectivement dû.
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
  /** Affichée sous la table, comme sur l'écran légataire. **Fraction**, pas
   * pourcentage : `1` vaut 100 %. */
  probabiliteFinalisation?: number;
}) {
  const categories = montants.parCategorie ?? [];

  return (
    <div className="flex h-full flex-col">
      {/* Un dossier sorti n'affiche pas un solde nul sans explication : la
          règle métier est que `netAPayer` se réduit à l'encaissé et que le
          reste tombe à zéro. Sans ce bandeau, un commercial lit « plus rien à
          encaisser » là où il faut lire « dossier annulé ». */}
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

            {/* Les deux lignes de synthèse, après un filet plus marqué : elles
                ne prolongent pas la liste au-dessus, elles la surplombent. */}
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
            {(probabiliteFinalisation * 100).toFixed(2)} %
          </span>
        </div>
      )}
    </div>
  );
}
