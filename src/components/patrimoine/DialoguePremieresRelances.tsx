import { useState } from 'react';
import { Printer } from 'lucide-react';
import Modal from '../Modal';
import LienFiche from '../LienFiche';
import { EmptyState, ErrorState, LoadingState } from '../ui';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { ouvrirBlobDansOnglet } from '../../lib/api';
import { executerPremieresRelances, getApercuPremieresRelances, lettresPremieresRelances } from '../../lib/apiPremieresRelances';
import { formatDate, pluriel } from '../../lib/format';
import { useApi } from '../../lib/useApi';
import { useEcriture } from '../../lib/useEcriture';
import type { LigneApercuRelanceDto, ResultatPremieresRelancesDto } from '../../types/premieresRelances';

function Apercu({ lignes }: Readonly<{ lignes: LigneApercuRelanceDto[] }>) {
  return (
    <Table containerClassName="max-h-80 overflow-y-auto">
      <TableHeader>
        <TableRow>
          <TableHead>Dossier</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Article</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Échéance actuelle</TableHead>
          <TableHead>Alerte</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lignes.map((l) => (
          <TableRow key={l.dossierId}>
            <TableCell><LienFiche cible={{ type: 'dossier', id: l.dossierId }} className="font-mono text-micro hover:underline">{l.code ?? '—'}</LienFiche></TableCell>
            <TableCell>{l.client ?? '—'}</TableCell>
            <TableCell>{l.article ?? '—'}</TableCell>
            <TableCell>{l.statut ?? '—'}</TableCell>
            <TableCell>{formatDate(l.echeanceActuelle)}</TableCell>
            <TableCell>{l.alerte ? 'Oui' : 'Non'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/**
 * « Imprimer les premières relances » (Administrateur) : aperçu des dossiers et des alertes, confirmation, écriture des
 * dates et alertes (une transaction côté serveur), puis ouverture des lettres en PDF.
 */
export default function DialoguePremieresRelances({ trancheId, onClose }: Readonly<{ trancheId: string; onClose: () => void }>) {
  const { data, error } = useApi(() => getApercuPremieresRelances(trancheId), [trancheId]);
  const { occupe, executer } = useEcriture();
  const [confirmation, setConfirmation] = useState(false);
  const [resultat, setResultat] = useState<ResultatPremieresRelancesDto | null>(null);

  const ouvrirLettres = () => void executer(() => ouvrirBlobDansOnglet(() => lettresPremieresRelances(trancheId)));

  if (resultat) {
    return (
      <Modal title="Premières relances enregistrées" onClose={onClose} width={480}>
        <p className="text-body">
          {pluriel(resultat.dossiersModifies, 'dossier mis à jour', 'dossiers mis à jour')},{' '}
          {pluriel(resultat.alertesCreees, 'alerte créée', 'alertes créées')}.
        </p>
        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={onClose}>Fermer</Button>
          <Button type="button" onClick={ouvrirLettres}><Printer data-icon="inline-start" /> Ouvrir les lettres (PDF)</Button>
        </DialogFooter>
      </Modal>
    );
  }

  const message = data && `${pluriel(data.dossiers, 'dossier')} ${data.dossiers > 1 ? 'recevront' : 'recevra'} une échéance de 1re relance `
    + `au ${formatDate(data.echeance)} et ${pluriel(data.alertes, 'alerte')} ${data.alertes > 1 ? 'seront créées' : 'sera créée'}. `;

  return (
    <Modal title="Imprimer les premières relances" onClose={onClose} width={900}>
      <div className="flex flex-col gap-3">
        {error && <ErrorState message={error} />}
        {!error && !data && <LoadingState />}
        {!error && data && (
          <p className="text-label text-muted-foreground">
            Date de 1re relance {formatDate(data.dateRelance)}
            {data.premierDelai !== null && `, premier délai ${pluriel(data.premierDelai, 'jour')}`}, échéance {formatDate(data.echeance)}.
          </p>
        )}
        {!error && data?.avertissement && <p role="status" className="text-label text-foreground">{data.avertissement}</p>}
        {!error && data?.lignes.length === 0 && <EmptyState title="Aucun dossier à relancer" />}
        {!error && data && data.lignes.length > 0 && <Apercu lignes={data.lignes} />}
        {confirmation && <p role="alert" className="text-label font-medium text-foreground">{message}Confirmer ?</p>}
      </div>
      <DialogFooter className="mt-4">
        <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
        {confirmation ? (
          <Button type="button" variant="destructive" disabled={occupe}
            onClick={() => void executer(async () => setResultat(await executerPremieresRelances(trancheId)))}>
            Confirmer l'impression
          </Button>
        ) : (
          <Button type="button" disabled={!data?.dossiers} onClick={() => setConfirmation(true)}>Imprimer…</Button>
        )}
      </DialogFooter>
    </Modal>
  );
}
