import { Badge } from '../../ui';
import { formatCurrency } from '../../../lib/format';
import { schemaEquilibre } from '../../../lib/dossierSousListes';
import type { EtatSchemaDto } from '../../../types/dossierSousListes';

function Montant({ libelle, valeur }: Readonly<{ libelle: string; valeur: number | null | undefined }>) {
  return (
    <div className="flex flex-col">
      <span className="text-micro text-muted-foreground">{libelle}</span>
      <span className="text-label font-semibold tabular-nums text-foreground">{formatCurrency(valeur)}</span>
    </div>
  );
}

/** Avance / crédit / autofinancement du schéma et son écart avec le prix ; le rééquilibrage se lit ici après chaque écriture. */
export default function EtatSchemaBandeau({ etat }: Readonly<{ etat: EtatSchemaDto }>) {
  const equilibre = schemaEquilibre(etat.ecart);
  return (
    <div className="flex flex-wrap items-end gap-x-5 gap-y-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
      <Montant libelle="Prix après remise" valeur={etat.prixApresRemise} />
      <Montant libelle="Avance" valeur={etat.avance} />
      <Montant libelle="Crédit" valeur={etat.credit} />
      <Montant libelle="Autofinancement" valeur={etat.autofinancement} />
      <Montant libelle="Autofinancement restant" valeur={etat.autofinancementReste} />
      <div className="ml-auto">
        {equilibre ? (
          <Badge tone="success">Schéma équilibré</Badge>
        ) : (
          <Badge tone="amber">Écart avec le prix : {formatCurrency(etat.ecart)}</Badge>
        )}
      </div>
    </div>
  );
}
