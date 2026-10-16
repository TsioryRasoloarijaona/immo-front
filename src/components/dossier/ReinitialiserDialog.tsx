import { useState } from 'react';
import Modal from '../Modal';
import { ErrorState, LoadingState } from '../ui';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { formatCurrency, formatPercent, formatPercentValue, formatSurface } from '../../lib/format';
import { getApercuReinitialisation, reinitialiserDossier } from '../../lib/api';
import { errorMessage, useApi } from '../../lib/useApi';
import type { EtatPrixDto } from '../../types';

const LIGNES: { libelle: string; valeur: (e: EtatPrixDto) => string }[] = [
  { libelle: 'Superficie', valeur: (e) => formatSurface(e.superficie) },
  { libelle: 'Superficie globale', valeur: (e) => formatSurface(e.superficieGlobale) },
  { libelle: 'TVA', valeur: (e) => formatPercent(e.tauxTva, 2) },
  { libelle: 'Prix du m² HT', valeur: (e) => formatCurrency(e.prixM2HT) },
  { libelle: 'Prix sous-articles HT', valeur: (e) => formatCurrency(e.prixSousArticlesHT) },
  { libelle: 'Total HT', valeur: (e) => formatCurrency(e.totalHT) },
  { libelle: 'Montant de remise HT', valeur: (e) => formatCurrency(e.remiseMontantHT) },
  { libelle: 'Remise', valeur: (e) => formatPercentValue(e.remisePourcentage) },
  { libelle: 'Prix de vente HT', valeur: (e) => formatCurrency(e.prixVenteHT) },
  { libelle: 'Prix de vente TTC', valeur: (e) => formatCurrency(e.prixVenteTTC) },
];

/** « Réinitialiser » : aperçu avant / après, puis application (Administrateur). */
export default function ReinitialiserDialog({
  dossierId,
  onClose,
  onDone,
}: Readonly<{ dossierId: string; onClose: () => void; onDone: () => void }>) {
  const apercu = useApi(() => getApercuReinitialisation(dossierId), [dossierId]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const a = apercu.data;

  async function appliquer() {
    setBusy(true);
    setError(null);
    try {
      await reinitialiserDossier(dossierId);
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Réinitialiser depuis le stock" onClose={onClose} width={560}>
      <p className="mb-3 text-body text-muted-foreground">
        Recharge la superficie, la TVA et le prix HT de l'article et des sous-articles depuis le stock, et ajoute les
        sous-articles du stock absents du dossier. Le montant
        de remise est conservé, le taux est recalculé. Le schéma de financement n'est pas modifié.
      </p>
      {apercu.error && <ErrorState message={apercu.error} />}
      {!apercu.error && !a && <LoadingState />}
      {!apercu.error && a && (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead />
              <TableHead className="text-right">Actuel</TableHead>
              <TableHead className="text-right">Après réinitialisation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {LIGNES.map((l) => {
              const avant = l.valeur(a.avant);
              const apres = l.valeur(a.apres);
              return (
                <TableRow key={l.libelle}>
                  <TableCell className="text-muted-foreground">{l.libelle}</TableCell>
                  <TableCell className="text-right tabular-nums">{avant}</TableCell>
                  <TableCell className={`text-right tabular-nums ${avant === apres ? '' : 'font-semibold text-(--warning)'}`}>{apres}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
      {a && a.sousArticlesAjoutes.length > 0 && (
        <p className="mt-3 text-body">
          Sous-articles du stock ajoutés au dossier : <span className="font-semibold">{a.sousArticlesAjoutes.join(', ')}</span>
        </p>
      )}
      {a && !a.modifie &&<p className="mt-3 text-body text-muted-foreground">Le dossier est déjà aligné sur le stock.</p>}
      {error && <p role="alert" className="mt-3 text-micro text-destructive">{error}</p>}
      <DialogFooter className="mt-5">
        <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
        <Button type="button" disabled={busy || !a?.modifie} onClick={() => void appliquer()}>
          {busy ? 'Réinitialisation…' : 'Réinitialiser'}
        </Button>
      </DialogFooter>
    </Modal>
  );
}
