import { formatCurrency, formatPercentValue } from '../../lib/format';
import { apercuTotaux, recapParTaux, type BrouillonPiece } from '../../lib/saisiePieceAchat';
import type { DocumentAchatDetailDto } from '../../types/achat';

function Ligne({ libelle, valeur, fort }: Readonly<{ libelle: string; valeur: number | null; fort?: boolean }>) {
  return (
    <>
      <dt className={fort ? 'font-semibold' : undefined}>{libelle}</dt>
      <dd className={fort ? 'text-right font-semibold' : 'text-right'}>{formatCurrency(valeur)}</dd>
    </>
  );
}

/**
 * Récap par taux et totaux de la saisie. Aperçu calculé tant que la saisie diffère de `piece` ;
 * sinon les montants de la pièce enregistrée, qui font foi.
 */
export default function TotauxSaisieAchat({ b, piece }: Readonly<{ b: BrouillonPiece; piece: DocumentAchatDetailDto | null }>) {
  const recap = recapParTaux(b.lignes);
  const apercu = b.lignes.length === 0 && b.nature === 'REFUND'
    ? { ht: b.montantHT ?? 0, tva: b.montantTVA ?? 0, ttc: (b.montantHT ?? 0) + (b.montantTVA ?? 0) }
    : apercuTotaux(b.lignes);
  const montants = piece
    ? { ht: piece.montantHT, tva: piece.montantTVA, ttc: piece.montantTTC, regul: piece.regularisation, timbre: piece.timbreFiscal, net: piece.montantAPayer }
    : { ...apercu, regul: b.montantRegul, timbre: b.timbreFiscal, net: apercu.ttc + (b.montantRegul ?? 0) + (b.timbreFiscal ?? 0) };
  return (
    <div className="flex flex-wrap items-start justify-end gap-8 text-body tabular-nums">
      {recap.length > 0 && (
        <table>
          <caption className="text-left text-micro text-muted-foreground">Récap par taux de TVA</caption>
          <thead>
            <tr className="text-micro text-muted-foreground">
              <th className="px-2 text-right font-medium">Taux</th>
              <th className="px-2 text-right font-medium">Base</th>
              <th className="px-2 text-right font-medium">TVA</th>
              <th className="px-2 text-right font-medium">Montant</th>
            </tr>
          </thead>
          <tbody>
            {recap.map((r) => (
              <tr key={r.taux}>
                <td className="px-2 text-right">{formatPercentValue(r.taux)}</td>
                <td className="px-2 text-right">{formatCurrency(r.ht)}</td>
                <td className="px-2 text-right">{formatCurrency(r.tva)}</td>
                <td className="px-2 text-right">{formatCurrency(r.ttc)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <dl className="grid grid-cols-[auto_auto] gap-x-4">
        <dt className="col-span-2 text-micro text-muted-foreground">
          {piece ? 'Montants enregistrés' : 'Totaux indicatifs (le serveur fait foi)'}
        </dt>
        <Ligne libelle="Total HT" valeur={montants.ht} />
        <Ligne libelle="Total TVA" valeur={montants.tva} />
        <Ligne libelle="Total TTC" valeur={montants.ttc} />
        <Ligne libelle="Montant régul." valeur={montants.regul} />
        <Ligne libelle="Timbre fiscal" valeur={montants.timbre} />
        <Ligne libelle="Net" valeur={montants.net} fort />
      </dl>
    </div>
  );
}
