import EtatListe from '../patrimoine/EtatListe';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { getTresorerieEtude } from '../../lib/apiFaisabilite';
import { LIBELLES_TYPE_TRESORERIE } from '../../lib/financeFaisabilite';
import { formatCurrency, formatDate } from '../../lib/format';
import { useApi } from '../../lib/useApi';
import type { EtudeFaisabiliteDto, LigneTresorerieDto } from '../../types/faisabilite';

/** Lignes de trésorerie de l'étude (date, type, débit, crédit), telles que le serveur les calcule. */
export default function OngletDonnees({ fiche }: Readonly<{ fiche: EtudeFaisabiliteDto }>) {
  const etat = useApi(() => getTresorerieEtude(fiche.id, true).then((t) => t.lignes), [fiche.id]);
  return (
    <EtatListe<LigneTresorerieDto> etat={etat} vide={{ titre: 'Aucune donnée', message: 'Aucune ligne de trésorerie pour cette étude.' }}>
      {(lignes) => (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Tranche</TableHead>
              <TableHead>Débit</TableHead>
              <TableHead>Crédit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lignes.map((l, i) => (
              <TableRow key={`${l.date}-${l.type}-${i}`}>
                <TableCell>{formatDate(l.date)}</TableCell>
                <TableCell>{LIBELLES_TYPE_TRESORERIE[l.type] ?? l.type}</TableCell>
                <TableCell>{l.libelle || '—'}</TableCell>
                <TableCell>{l.trancheCode || '—'}</TableCell>
                <TableCell>{l.debit ? formatCurrency(l.debit) : ''}</TableCell>
                <TableCell>{l.credit ? formatCurrency(l.credit) : ''}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </EtatListe>
  );
}
