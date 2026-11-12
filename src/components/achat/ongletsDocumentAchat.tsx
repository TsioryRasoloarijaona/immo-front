import type { ReactNode } from 'react';
import { Badge, EmptyState } from '../ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { formatCurrency, formatDate, formatDateTime, formatNumber, formatPercent, formatPercentValue } from '../../lib/format';
import type { DocumentAchatDetailDto } from '../../types/achat';

export function Grille({
  entetes,
  vide,
  titreVide = 'Aucune donnée',
  children,
}: Readonly<{ entetes: { libelle: string; droite?: boolean }[]; vide: boolean; titreVide?: string; children: ReactNode }>) {
  if (vide) return <EmptyState title={titreVide} />;
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

const ENTETES_LIGNES = [
  { libelle: 'Code' },
  { libelle: 'Désignation' },
  { libelle: 'Unité' },
  { libelle: 'Qté', droite: true },
  { libelle: 'PU HT', droite: true },
  { libelle: 'Remise %', droite: true },
  { libelle: 'FODEC %', droite: true },
  { libelle: 'TVA %', droite: true },
  { libelle: 'PU TTC', droite: true },
  { libelle: 'Total HT', droite: true },
  { libelle: 'Total TTC', droite: true },
];

export function LignesDocumentAchat({ d }: Readonly<{ d: DocumentAchatDetailDto }>) {
  return (
    <>
      <Grille entetes={ENTETES_LIGNES} vide={d.lignes.length === 0} titreVide="Aucune ligne">
        {d.lignes.map((l) => (
          <TableRow key={l.id}>
            <TableCell className="text-muted-foreground">{l.code}</TableCell>
            <TableCell>{l.designation}</TableCell>
            <TableCell className="text-muted-foreground">{l.unite}</TableCell>
            <TableCell className={DROITE}>{formatNumber(l.quantite, 2)}</TableCell>
            <TableCell className={DROITE}>{formatCurrency(l.prixUnitaireHT)}</TableCell>
            <TableCell className={DROITE}>{formatPercentValue(l.remisePourcent)}</TableCell>
            <TableCell className={DROITE}>{formatPercentValue(l.fodecPourcent)}</TableCell>
            <TableCell className={DROITE}>{formatPercentValue(l.tauxTVA)}</TableCell>
            <TableCell className={DROITE}>{formatCurrency(l.prixUnitaireTTC)}</TableCell>
            <TableCell className={DROITE}>{formatCurrency(l.totalHT)}</TableCell>
            <TableCell className={DROITE}>{formatCurrency(l.totalTTC)}</TableCell>
          </TableRow>
        ))}
      </Grille>
      {d.recapTva.length > 0 && (
        <div className="mt-2 ml-auto w-72 px-3 pb-2">
          <Grille entetes={[{ libelle: 'TVA %', droite: true }, { libelle: 'Base', droite: true }, { libelle: 'Montant', droite: true }]} vide={false}>
            {d.recapTva.map((r) => (
              <TableRow key={r.tauxTVA}>
                <TableCell className={DROITE}>{formatPercentValue(r.tauxTVA)}</TableCell>
                <TableCell className={DROITE}>{formatCurrency(r.base)}</TableCell>
                <TableCell className={DROITE}>{formatCurrency(r.montantTVA)}</TableCell>
              </TableRow>
            ))}
          </Grille>
        </div>
      )}
    </>
  );
}

export function VentilationDocumentAchat({ d }: Readonly<{ d: DocumentAchatDetailDto }>) {
  return (
    <div className="grid gap-3 p-3 md:grid-cols-2">
      <section aria-label="Par projet">
        <Grille entetes={[{ libelle: 'Taux', droite: true }, { libelle: 'Projet' }]} vide={d.ventilationProjets.length === 0} titreVide="Aucune ventilation par projet">
          {d.ventilationProjets.map((v) => (
            <TableRow key={v.projetId ?? v.projetCode}>
              <TableCell className={DROITE}>{formatPercent(v.taux)}</TableCell>
              <TableCell>{v.projetDescription ?? v.projetCode}</TableCell>
            </TableRow>
          ))}
        </Grille>
      </section>
      <section aria-label="Par catégorie">
        <Grille
          entetes={[{ libelle: 'Catégorie' }, { libelle: 'Taux', droite: true }]}
          vide={d.ventilation.length === 0}
          titreVide="Aucune ventilation par catégorie"
        >
          {d.ventilation.map((v) => (
            <TableRow key={v.categorieCode ?? v.categorieDescription}>
              <TableCell>{v.categorieDescription ?? v.categorieCode}</TableCell>
              <TableCell className={DROITE}>{formatPercent(v.taux)}</TableCell>
            </TableRow>
          ))}
        </Grille>
      </section>
    </div>
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
      entetes={[{ libelle: 'Date' }, { libelle: 'Utilisateur' }, { libelle: 'Etat' }, { libelle: 'Transition' }, { libelle: 'Note' }]}
      vide={d.historique.length === 0}
    >
      {d.historique.map((h) => (
        <TableRow key={`${h.date}-${h.statutCode}-${h.utilisateur}`}>
          <TableCell>{formatDateTime(h.date)}</TableCell>
          <TableCell className="text-muted-foreground">{h.utilisateur}</TableCell>
          <TableCell>{h.statutDescription ?? h.statutCode}</TableCell>
          <TableCell className="text-muted-foreground">{h.transition}</TableCell>
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
        <LigneMontant libelle="Total HT" valeur={d.montantHT} />
        <LigneMontant libelle="Total TVA" valeur={d.montantTVA} />
        <LigneMontant libelle="Total TTC" valeur={d.montantTTC} fort />
        <LigneMontant libelle="Régul." valeur={d.regularisation} />
        <LigneMontant libelle="Timbre" valeur={d.timbreFiscal} />
        <LigneMontant libelle="Avoirs" valeur={d.avoirsMontant} />
        <LigneMontant libelle="Net" valeur={d.montantAPayer} fort />
        <LigneMontant libelle="Réglé" valeur={d.montantRegle} />
        <LigneMontant libelle="Reste à régler" valeur={d.resteARegler} fort alerte={d.resteARegler > 0} />
      </tbody>
    </table>
  );
}
