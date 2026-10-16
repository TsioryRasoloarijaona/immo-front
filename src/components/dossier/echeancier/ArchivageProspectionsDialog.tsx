import { useState } from 'react';
import Modal from '../../Modal';
import { Button } from '../../ui/button';
import { DialogFooter } from '../../ui/dialog';
import { archiverProspectionsAcquereurs } from '../../../lib/apiDossierSousListes';
import { useEcriture } from '../../../lib/useEcriture';
import type { ProspectionAArchiverDto } from '../../../types/dossierSousListes';

/** « Prospection à archiver » d'OMRAN : les prospections ouvertes des nouveaux acquéreurs, toutes cochées. */
export default function ArchivageProspectionsDialog({
  dossierId,
  prospections,
  onFerme,
}: Readonly<{ dossierId: string; prospections: ProspectionAArchiverDto[]; onFerme: () => void }>) {
  const [cochees, setCochees] = useState<Set<string>>(() => new Set(prospections.map((p) => p.id)));
  const { occupe, executer } = useEcriture();

  function basculer(id: string) {
    setCochees((prec) => {
      const suivant = new Set(prec);
      if (suivant.has(id)) suivant.delete(id);
      else suivant.add(id);
      return suivant;
    });
  }

  async function archiver() {
    const ok = await executer(() => archiverProspectionsAcquereurs(dossierId, [...cochees]), 'Prospections archivées.');
    if (ok) onFerme();
  }

  return (
    <Modal title="Prospections à archiver" onClose={onFerme} width={520}>
      <p className="mb-3 text-label text-muted-foreground">
        Ces acquéreurs ont des prospections ouvertes. Les archiver avec le motif « Création dossier de vente » ?
      </p>
      <ul className="flex flex-col gap-1.5">
        {prospections.map((p) => (
          <li key={p.id}>
            <label className="flex items-center gap-2 text-label">
              <input type="checkbox" checked={cochees.has(p.id)} onChange={() => basculer(p.id)} />
              <span className="font-medium">{p.code}</span>
              <span className="truncate text-muted-foreground">{p.libelle}</span>
            </label>
          </li>
        ))}
      </ul>
      <DialogFooter className="mt-5">
        <Button type="button" variant="outline" onClick={onFerme}>Ne pas archiver</Button>
        <Button type="button" disabled={occupe || cochees.size === 0} onClick={() => void archiver()}>Archiver</Button>
      </DialogFooter>
    </Modal>
  );
}
