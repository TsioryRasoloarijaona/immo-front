import { useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { cn } from '../lib/utils';

export interface EntreePalette {
  to: string;
  libelle: string;
  module: string;
}

const sansAccent = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

/** Palette locale (Ctrl K) : filtre les entrées du menu par libellé et navigue, sans appel d'API. */
export default function PaletteMenu({ entrees, onClose }: Readonly<{ entrees: readonly EntreePalette[]; onClose: () => void }>) {
  const navigate = useNavigate();
  const [saisie, setSaisie] = useState('');
  const [courant, setCourant] = useState(0);
  const terme = sansAccent(saisie.trim());
  const resultats = entrees.filter((e) => sansAccent(e.libelle).includes(terme));
  const choisi = Math.min(courant, Math.max(resultats.length - 1, 0));

  function aller(e: EntreePalette) {
    onClose();
    void navigate(e.to);
  }

  function surTouche(ev: KeyboardEvent<HTMLInputElement>) {
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
      ev.preventDefault();
      const pas = ev.key === 'ArrowDown' ? 1 : -1;
      setCourant((choisi + pas + resultats.length) % Math.max(resultats.length, 1));
    } else if (ev.key === 'Enter' && resultats[choisi]) {
      aller(resultats[choisi]);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="gap-2 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Rechercher partout</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={saisie}
            onChange={(ev) => {
              setSaisie(ev.target.value);
              setCourant(0);
            }}
            onKeyDown={surTouche}
            placeholder="Aller à un écran…"
            aria-label="Rechercher un écran"
            className="pl-8"
          />
        </div>
        <ul className="max-h-72 overflow-y-auto" aria-label="Écrans">
          {resultats.map((e, i) => (
            <li key={e.to}>
              <button
                type="button"
                onClick={() => aller(e)}
                onMouseEnter={() => setCourant(i)}
                className={cn(
                  'flex h-8 w-full items-center justify-between rounded-md px-2 text-left text-body',
                  i === choisi ? 'bg-(--brand-bg) text-(--brand)' : 'text-foreground',
                )}
              >
                {e.libelle}
                <span className="text-xs text-muted-foreground">{e.module}</span>
              </button>
            </li>
          ))}
          {resultats.length === 0 && <li className="px-2 py-3 text-body text-muted-foreground">Aucun écran ne correspond.</li>}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
