import { useState } from 'react';
import Modal from '../../Modal';
import { EmptyState, ErrorState, LoadingState } from '../../ui';
import { Button } from '../../ui/button';
import { DialogFooter } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { listDossiers, viewFicheReservation } from '../../../lib/api';
import { canonicalStatusLabel } from '../../../lib/dossierStatus';
import { errorMessage, useApi, useDebouncedValue } from '../../../lib/useApi';

/** Fiche de réservation : on choisit un dossier de la tranche, puis sa fiche s'ouvre en PDF dans un nouvel onglet. */
export default function DialogueFicheReservation({ trancheId, onClose }: Readonly<{ trancheId: string; onClose: () => void }>) {
  const [recherche, setRecherche] = useState('');
  const [erreurPdf, setErreurPdf] = useState<string | null>(null);
  const search = useDebouncedValue(recherche.trim());
  const { data, error } = useApi(
    () => listDossiers({ trancheId: [trancheId], search: search || undefined }, { page: 0, size: 50 }),
    [trancheId, search],
  );

  function ouvrir(dossierId: string) {
    setErreurPdf(null);
    viewFicheReservation(dossierId).catch((err: unknown) => setErreurPdf(errorMessage(err)));
  }

  return (
    <Modal title="Fiche de réservation" onClose={onClose} width={720}>
      <div className="flex flex-col gap-3">
        <Input
          type="search"
          aria-label="Rechercher un dossier"
          placeholder="N° de dossier ou client"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />
        {error && <ErrorState message={error} />}
        {!error && !data && <LoadingState />}
        {!error && data?.content.length === 0 && <EmptyState title="Aucun dossier dans cette tranche" />}
        {!error && data && data.content.length > 0 && (
          <Table containerClassName="max-h-80 overflow-y-auto">
            <TableHeader>
              <TableRow>
                <TableHead>Dossier</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.content.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <button type="button" className="font-mono text-micro hover:underline" onClick={() => ouvrir(d.id)}>{d.code ?? '—'}</button>
                  </TableCell>
                  <TableCell>{d.clientNom ?? '—'}</TableCell>
                  <TableCell>{canonicalStatusLabel(d.statut)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!error && data && data.totalElements > 50 && (
          <p className="text-label text-muted-foreground">50 premiers dossiers — affinez la recherche</p>
        )}
        {erreurPdf && <p role="alert" className="text-label text-destructive">{erreurPdf}</p>}
      </div>
      <DialogFooter className="mt-4">
        <Button type="button" variant="outline" onClick={onClose}>Fermer</Button>
      </DialogFooter>
    </Modal>
  );
}
