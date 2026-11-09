import type { ReactNode } from 'react';
import { Badge, EmptyState } from '../ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { formatCurrency, formatDate, formatNumber, formatPercent, formatPercentValue } from '../../lib/format';
import type { DocumentAchatDetailDto } from '../../types/achat';

function Grille({ entetes, vide, children }: Readonly<{ entetes: { libelle: string; droite?: boolean }[]; vide: boolean; children: ReactNode }>) {
  if (vide) return <EmptyState title="Aucune donnée" />;
  return (
    <Table containerClassName="overflow-visible">
      <TableHeader className="sticky top-0 z-1">
        <TableRow className="hover:bg-card">
          {entetes.map((e) => (
            <TableHead key={e.libelle} className={e.droite ? 'text-right' : undefined}>
              {e.libelle}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>{children}</TableBody>
    </Table>
  );
}

const DROITE = 'text-right tabular-nums';

export function LignesDocumentAchat({ d }: Readonly<{ d: DocumentAchatDetailDto }>) {
  const entetes = ['Désignation', 'Unité'].map((libelle) => ({ libelle }));
  const nombres = ['Quantité', 'Prix unitaire HT', 'TVA', 'Remise'].map((libelle) => ({ libelle, droite: true }));
  return (
    <Grille entetes={[...entetes, ...nombres]} vide={d.lignes.length === 0}>
      {d.lignes.map((l) => (
        <TableRow key={l.id}>
          <TableCell>{l.designation}</TableCell>
          <TableCell className="text-muted-foreground">{l.unite}</TableCell>
          <TableCell className={DROITE}>{formatNumber(l.quantite, 2)}</TableCell>
          <TableCell className={DROITE}>{formatCurrency(l.prixUnitaireHT)}</TableCell>
          <TableCell className={DROITE}>{formatPercentValue(l.tauxTVA)}</TableCell>
          <TableCell className={DROITE}>{formatPercentValue(l.remisePourcent)}</TableCell>
        </TableRow>
      ))}
    </Grille>
  );
}

export function VentilationDocumentAchat({ d }: Readonly<{ d: DocumentAchatDetailDto }>) {
  return (
    <Grille entetes={[{ libelle: 'Catégorie' }, { libelle: 'Taux', droite: true }]} vide={d.ventilation.length === 0}>
      {d.ventilation.map((v) => (
        <TableRow key={v.categorieCode ?? v.categorieDescription}>
          <TableCell>{v.categorieDescription ?? v.categorieCode}</TableCell>
          <TableCell className={DROITE}>{formatPercent(v.taux)}</TableCell>
        </TableRow>
      ))}
    </Grille>
  );
}

export function ReglementsDocumentAchat({ d }: Readonly<{ d: DocumentAchatDetailDto }>) {
  return (
    <Grille
      entetes={[{ libelle: 'Code' }, { libelle: 'Date' }, { libelle: 'Type' }, { libelle: 'Montant', droite: true }]}
      vide={d.reglements.length === 0}
    >
      {d.reglements.map((r) => (
        <TableRow key={r.id} className={r.annule ? 'text-muted-foreground line-through' : undefined}>
          <TableCell>
            {r.code}
            {r.annule && <Badge tone="warning" className="ml-2 no-underline">Annulé</Badge>}
          </TableCell>
          <TableCell>{formatDate(r.dateDocument)}</TableCell>
          <TableCell>{r.typeDescription ?? r.typeCode}</TableCell>
          <TableCell className={DROITE}>{formatCurrency(r.montant)}</TableCell>
        </TableRow>
      ))}
    </Grille>
  );
}

export function HistoriqueDocumentAchat({ d }: Readonly<{ d: DocumentAchatDetailDto }>) {
  return (
    <Grille
      entetes={[{ libelle: 'Date' }, { libelle: 'Statut' }, { libelle: 'Utilisateur' }, { libelle: 'Note' }]}
      vide={d.historique.length === 0}
    >
      {d.historique.map((h) => (
        <TableRow key={`${h.date}-${h.statutCode}-${h.utilisateur}`}>
          <TableCell>{formatDate(h.date)}</TableCell>
          <TableCell>{h.statutDescription ?? h.statutCode}</TableCell>
          <TableCell className="text-muted-foreground">{h.utilisateur}</TableCell>
          <TableCell className="text-muted-foreground">{h.note}</TableCell>
        </TableRow>
      ))}
    </Grille>
  );
}

function LigneMontant({ libelle, valeur, fort, alerte }: Readonly<{ libelle: string; valeur: number | null; fort?: boolean; alerte?: boolean }>) {
  return (
    <tr>
      <th scope="row" className="py-1 pr-2 text-left text-body font-normal text-muted-foreground">
        {libelle}
      </th>
      <td className={`py-1 text-right tabular-nums ${fort ? 'text-label font-semibold' : 'text-body'} ${alerte ? 'text-destructive' : 'text-foreground'}`}>
        {formatCurrency(valeur)}
      </td>
    </tr>
  );
}

export function MontantsDocumentAchat({ d }: Readonly<{ d: DocumentAchatDetailDto }>) {
  return (
    <table className="w-full text-body">
      <tbody>
        <LigneMontant libelle="Montant HT" valeur={d.montantHT} />
        <LigneMontant libelle="TVA" valeur={d.montantTVA} />
        <LigneMontant libelle="Timbre fiscal" valeur={d.timbreFiscal} />
        <LigneMontant libelle="Régularisation" valeur={d.regularisation} />
        <LigneMontant libelle="Montant TTC" valeur={d.montantTTC} fort />
        <LigneMontant libelle="À payer" valeur={d.montantAPayer} fort />
        <LigneMontant libelle="Réglé" valeur={d.montantRegle} />
        <LigneMontant libelle="Reste à régler" valeur={d.resteARegler} fort alerte={d.resteARegler > 0} />
      </tbody>
    </table>
  );
}
