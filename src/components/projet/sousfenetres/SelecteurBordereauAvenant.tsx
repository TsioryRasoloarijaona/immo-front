import { useState } from 'react';
import { Button } from '../../ui/button';
import type { LigneBordereauDto } from '../../../types/projet';

/** Choix multiple de lignes du bordereau définitif à copier dans l'avenant (quantité 0). */
export default function SelecteurBordereauAvenant({
  lignes,
  onAjouter,
  onFermer,
}: Readonly<{ lignes: LigneBordereauDto[]; onAjouter: (choisies: LigneBordereauDto[]) => void; onFermer: () => void }>) {
  const [choix, setChoix] = useState<ReadonlySet<string>>(new Set());

  function basculer(id: string) {
    setChoix((c) => {
      const suivant = new Set(c);
      if (!suivant.delete(id)) suivant.add(id);
      return suivant;
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border p-2">
      {lignes.length === 0 ? (
        <p className="text-body text-muted-foreground">Aucune ligne dans le bordereau définitif de ce lot.</p>
      ) : (
        <ul className="max-h-48 overflow-auto text-body">
          {lignes.map((l) => (
            <li key={l.id}>
              <label className="flex cursor-pointer items-center gap-2 px-1 py-0.5 hover:bg-muted">
                <input type="checkbox" checked={choix.has(l.id)} onChange={() => basculer(l.id)} />
                <span className="w-24 shrink-0 text-muted-foreground">{l.code ?? ''}</span>
                <span>{l.designation ?? ''}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Button type="button" size="sm" disabled={choix.size === 0} onClick={() => onAjouter(lignes.filter((l) => choix.has(l.id)))}>
          Ajouter la sélection
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onFermer}>
          Fermer
        </Button>
      </div>
    </div>
  );
}
