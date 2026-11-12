import { useState } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';

/** Choix d'une date avec confirmation : « Recharger les lignes jusqu'à la date » (l'aperçu efface les quantités saisies) et création d'un décompte. */
export default function DialogueRecalculDecompte({
  titre,
  description,
  confirmation,
  dateInitiale,
  enCours,
  onAnnuler,
  onConfirmer,
}: Readonly<{
  titre: string;
  description: string;
  confirmation: string;
  dateInitiale: string;
  enCours: boolean;
  onAnnuler: () => void;
  onConfirmer: (date: string) => void;
}>) {
  const [date, setDate] = useState(dateInitiale);
  return (
    <Dialog open onOpenChange={(ouvert) => !ouvert && onAnnuler()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titre}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 text-body">
          Date
          <Input type="date" aria-label="Date" className="w-40" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onAnnuler}>
            Annuler
          </Button>
          <Button type="button" disabled={enCours || !date} onClick={() => onConfirmer(date)}>
            {confirmation}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
