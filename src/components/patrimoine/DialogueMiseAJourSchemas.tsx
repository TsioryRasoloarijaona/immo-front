import { useState } from 'react';
import Modal from '../Modal';
import LienFiche from '../LienFiche';
import { EmptyState, ErrorState, LoadingState } from '../ui';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { getApercuSchemas, mettreAJourSchemas } from '../../lib/apiPatrimoine';
import { formatCurrency, formatDate, pluriel } from '../../lib/format';
import { useEcriture } from '../../lib/useEcriture';
import { useApi } from '../../lib/useApi';
import type { EcheanceSchemaDto, MiseAJourSchemasDto } from '../../types';

function Apercu({ echeances }: Readonly<{ echeances: EcheanceSchemaDto[] }>) {
  return (
    <Table containerClassName="max-h-96 overflow-y-auto">
      <TableHeader>
        <TableRow>
          <TableHead>Dossier</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Catégorie</TableHead>
          <TableHead>Ancienne date</TableHead>
          <TableHead>Nouvelle date</TableHead>
          <TableHead className="text-right">Reste</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {echeances.map((e) => (
          <TableRow key={e.echeanceId}>
            <TableCell><LienFiche cible={{ type: 'dossier', id: e.dossierId }} className="font-mono text-micro hover:underline">{e.dossierCode ?? '—'}</LienFiche></TableCell>
            <TableCell>{e.client ?? '—'}</TableCell>
            <TableCell>{e.categorie ?? '—'}</TableCell>
            <TableCell>{formatDate(e.ancienneDate)}</TableCell>
            <TableCell>{formatDate(e.nouvelleDate)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatCurrency(e.reste)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/**
 * « Mettre à jour les schémas de financement » (Administrateur, argent) : l'aperçu des échéances déplacées au début des
 * finalisations, puis une confirmation qui en donne le nombre, puis l'exécution (une transaction côté serveur).
 */
export default function DialogueMiseAJourSchemas({ trancheId, onClose }: Readonly<{ trancheId: string; onClose: () => void }>) {
  const { data: echeances, error } = useApi(() => getApercuSchemas(trancheId), [trancheId]);
  const { occupe, executer } = useEcriture();
  const [confirmation, setConfirmation] = useState(false);
  const [resultat, setResultat] = useState<MiseAJourSchemasDto | null>(null);

  const nombre = echeances?.length ?? 0;
  const dossiers = new Set(echeances?.map((e) => e.dossierId)).size;
  const verbe = nombre > 1 ? 'vont' : 'va';
  const message = `${pluriel(nombre, 'échéance')} de ${pluriel(dossiers, 'dossier')} ${verbe} passer au `
    + `${formatDate(echeances?.[0]?.nouvelleDate)}. Seule la date change : montants et restes sont conservés.`;

  async function executerMiseAJour() {
    await executer(async () => setResultat(await mettreAJourSchemas(trancheId)), 'Schémas de financement mis à jour.');
  }

  if (resultat) {
    return (
      <Modal title="Schémas de financement mis à jour" onClose={onClose} width={480}>
        <p className="text-body">
          {pluriel(resultat.documentsModifies, 'échéance modifiée', 'échéances modifiées')},{' '}
          {pluriel(resultat.dossiersConcernes, 'dossier concerné', 'dossiers concernés')}.
        </p>
        <DialogFooter className="mt-4"><Button type="button" onClick={onClose}>Fermer</Button></DialogFooter>
      </Modal>
    );
  }

  return (
    <Modal title="Mettre à jour les schémas de financement" onClose={onClose} width={900}>
      <div className="flex flex-col gap-3">
        <p className="text-label text-muted-foreground">
          Les échéances dont la catégorie dépend de la date d'octroi, antérieures au début des finalisations et non soldées,
          sont reportées à la date de début des finalisations.
        </p>
        {error && <ErrorState message={error} />}
        {!error && !echeances && <LoadingState />}
        {!error && echeances?.length === 0 && <EmptyState title="Aucune échéance à déplacer" />}
        {!error && echeances && echeances.length > 0 && <Apercu echeances={echeances} />}
        {confirmation && <p role="alert" className="text-label font-medium text-foreground">{message} Confirmer ?</p>}
      </div>
      <DialogFooter className="mt-4">
        <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
        {confirmation ? (
          <Button type="button" variant="destructive" disabled={occupe} onClick={() => void executerMiseAJour()}>
            Confirmer la mise à jour
          </Button>
        ) : (
          <Button type="button" disabled={nombre === 0} onClick={() => setConfirmation(true)}>Mettre à jour…</Button>
        )}
      </DialogFooter>
    </Modal>
  );
}
