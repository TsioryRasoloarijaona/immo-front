import { useState } from 'react';
import Modal from '../../Modal';
import { Button } from '../../ui/button';
import { DialogFooter } from '../../ui/dialog';
import { ChampDate } from './ChampsSaisie';
import { jourSaisi, type EditionDossier } from '../../../lib/editionDossier';
import { toApiDateTime } from '../../../lib/format';

/**
 * Date du dossier (`ComFolder.DocDate`, groupe DATES) : elle ne se vide pas et doit rester entre la date de la
 * prospection et la concrétisation (`Sale.cs:VerifDates`) ; le serveur renvoie le message d'OMRAN sinon.
 */
export default function EnTeteDialog({
  edition,
  dateDossier,
  onClose,
}: Readonly<{ edition: EditionDossier; dateDossier: string | null | undefined; onClose: () => void }>) {
  const initiale = jourSaisi(dateDossier);
  const [date, setDate] = useState(initiale);

  async function enregistrer() {
    const corps = date && date !== initiale ? { dateDossier: toApiDateTime(date) } : {};
    if (await edition.enregistrer(corps)) onClose();
  }

  return (
    <Modal title="Modifier l'en-tête du dossier" onClose={onClose} width={400}>
      <div className="flex flex-col gap-3">
        <ChampDate label="Date du dossier" value={date} onChange={setDate} />
        <p className="text-micro text-muted-foreground">
          Entre la date de la prospection et la date de concrétisation ; elle ne peut pas être vidée.
        </p>
        {edition.erreur && <p role="alert" className="text-micro text-destructive">{edition.erreur}</p>}
      </div>
      <DialogFooter className="mt-5">
        <Button type="button" variant="outline" onClick={onClose} disabled={edition.busy}>Annuler</Button>
        <Button type="button" onClick={() => void enregistrer()} disabled={edition.busy || !date}>
          {edition.busy ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </DialogFooter>
    </Modal>
  );
}
