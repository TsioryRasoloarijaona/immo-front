import { useState } from 'react';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { useChoixPersonnes } from '../../../lib/useChoixRendezVous';

/** Choix multiple dans le personnel ; `exclus` = contacts déjà présents. */
export default function ChoixContacts({ exclus, onAnnuler, onValider }: Readonly<{
  exclus: string[];
  onAnnuler: () => void;
  onValider: (ids: string[]) => void;
}>) {
  const personnes = useChoixPersonnes();
  const [recherche, setRecherche] = useState('');
  const [choisis, setChoisis] = useState<Set<string>>(new Set());
  const q = recherche.trim().toLowerCase();
  const visibles = personnes.filter((p) => !exclus.includes(p.value) && p.label.toLowerCase().includes(q));

  function basculer(id: string) {
    setChoisis((s) => {
      const suite = new Set(s);
      if (suite.has(id)) suite.delete(id);
      else suite.add(id);
      return suite;
    });
  }

  return (
    <Dialog open onOpenChange={(ouvert) => !ouvert && onAnnuler()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter des contacts</DialogTitle>
        </DialogHeader>
        <Input aria-label="Rechercher un contact" placeholder="Rechercher…" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
        <ul className="flex max-h-72 flex-col gap-1 overflow-auto text-body">
          {visibles.map((p) => (
            <li key={p.value}>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={choisis.has(p.value)} onChange={() => basculer(p.value)} />
                {p.label}
              </label>
            </li>
          ))}
          {visibles.length === 0 && <li className="text-muted-foreground">Aucun contact</li>}
        </ul>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onAnnuler}>Annuler</Button>
          <Button type="button" disabled={choisis.size === 0} onClick={() => onValider([...choisis])}>Ajouter</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
