import LienFiche from '../../LienFiche';
import { Badge, EmptyState, Field, FieldGrid } from '../../ui';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '../../ui/table';
import { formatCurrency, formatDate, formatDateTime } from '../../../lib/format';
import type { EncaissementDetailDto } from '../../../types';
import syntheseAffectations from './syntheseAffectations';

function couleurMontant(colore: boolean | undefined, fort: boolean | undefined): string {
  if (colore) return 'font-semibold text-(--warning)';
  return fort ? '' : 'text-foreground';
}

function LigneMontant({
  libelle,
  valeur,
  fort,
  alerte,
  separe,
}: Readonly<{ libelle: string; valeur: number | undefined; fort?: boolean; alerte?: boolean; separe?: boolean }>) {
  const reste = valeur ?? 0;
  const colore = alerte && Math.abs(reste) > 0.005;
  return (
    <tr className={separe ? 'border-t border-border' : undefined}>
      <th scope="row" className="py-1 pr-2 text-left text-body font-normal text-muted-foreground">
        {libelle}
      </th>
      <td
        className={['py-1 text-right tabular-nums', fort ? 'text-label font-semibold text-foreground' : 'text-body', couleurMontant(colore, fort)].join(' ')}
      >
        {formatCurrency(valeur)}
      </td>
    </tr>
  );
}

export function MontantsEncaissement({ e }: Readonly<{ e: EncaissementDetailDto }>) {
  const { affecteCompte } = syntheseAffectations(e);
  return (
    <table className="w-full text-body">
      <tbody>
        <LigneMontant libelle="Montant brut" valeur={e.montantBrut} fort />
        <LigneMontant libelle="Montant affecté" valeur={affecteCompte} />
        <LigneMontant libelle="Reste à affecter" valeur={e.montantBrutRestant} alerte />
        <LigneMontant libelle="Montant net" valeur={e.montantNet} separe />
        <LigneMontant libelle="Montant base" valeur={e.montantBase} />
      </tbody>
    </table>
  );
}

export function TracabiliteEncaissement({ e }: Readonly<{ e: EncaissementDetailDto }>) {
  return (
    <>
      <FieldGrid>
        <Field label="Remis au centre" value={e.remisAuCentre ? 'Oui' : 'Non'} />
        <Field label="Date de remise" value={formatDate(e.dateRemiseAuCentre)} />
        <Field label="Bordereau" value={e.bordereauCode} />
        <Field label="Date de bordereau" value={formatDate(e.dateBordereau)} />
      </FieldGrid>
      <div className="mt-2 border-t border-border pt-2">
        <FieldGrid>
          <Field label="Saisi par" value={e.creePar} />
          <Field label="Saisi le" value={formatDateTime(e.creeLe)} />
          <Field label="Modifié par" value={e.modifiePar} />
          <Field label="Modifié le" value={formatDateTime(e.modifieLe)} />
        </FieldGrid>
      </div>
    </>
  );
}

export function AffectationsEncaissement({ e }: Readonly<{ e: EncaissementDetailDto }>) {
  const affectations = e.affectations ?? [];
  if (affectations.length === 0) {
    return <EmptyState title="Pas encore imputé" message="Ce règlement est encaissé mais n'a été affecté à aucune échéance." />;
  }
  const dossiers = new Set(affectations.map((a) => a.dossierCode).filter(Boolean));
  const totalAffecte = affectations.reduce((s, a) => s + (a.montantAffecte ?? 0), 0);
  return (
    <>
      {dossiers.size > 1 && (
        <p className="border-b border-border px-3 py-2 text-body text-muted-foreground">
          Ce règlement solde des échéances de <strong className="text-foreground">{dossiers.size} dossiers</strong>.
        </p>
      )}
      <Table containerClassName="overflow-visible">
        <TableHeader className="sticky top-0 z-1">
          <TableRow className="hover:bg-card">
            <TableHead>Dossier</TableHead>
            <TableHead>Échéance</TableHead>
            <TableHead>Catégorie</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Affecté</TableHead>
            <TableHead className="text-right">Montant échéance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {affectations.map((a) => (
            <TableRow key={a.id}>
              <TableCell>
                {a.dossierId ? (
                  <LienFiche cible={{ type: 'dossier', id: a.dossierId }} className="text-(--info) hover:underline">
                    {a.dossierCode || 'Voir'}
                  </LienFiche>
                ) : (
                  a.dossierCode
                )}
              </TableCell>
              <TableCell className="truncate text-muted-foreground" title={a.echeanceCode}>
                {a.echeanceDescription || a.echeanceCode}
              </TableCell>
              <TableCell>{a.categorie ? <Badge tone="neutral">{a.categorie}</Badge> : null}</TableCell>
              <TableCell className="text-muted-foreground">{formatDate(a.dateEcheance)}</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(a.montantAffecte)}</TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">{formatCurrency(a.montantEcheance)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow className="hover:bg-muted/50">
            <TableCell colSpan={4} className="text-micro text-muted-foreground">
              {syntheseAffectations(e).libelleTotalAffecte}
            </TableCell>
            <TableCell className="text-right text-micro font-semibold tabular-nums">{formatCurrency(totalAffecte)}</TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    </>
  );
}
