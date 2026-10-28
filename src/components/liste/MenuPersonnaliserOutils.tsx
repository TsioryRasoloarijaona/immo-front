import type { LucideIcon } from 'lucide-react';

export interface LigneMenuOutil {
  id: string;
  libelle: string;
  icone?: LucideIcon;
  raccourci?: string;
}

function Ligne({
  ligne,
  coche,
  onBasculer,
}: Readonly<{ ligne: LigneMenuOutil; coche: boolean; onBasculer: () => void }>) {
  const Icone = ligne.icone;
  return (
    <label className="flex h-7 cursor-pointer items-center gap-2 px-3 text-body text-foreground hover:bg-muted">
      <input type="checkbox" className="accent-(--brand)" checked={coche} onChange={onBasculer} />
      {Icone && <Icone aria-hidden className="size-3.5 text-muted-foreground" />}
      {ligne.libelle}
      {ligne.raccourci && <span className="ml-auto text-micro text-muted-foreground">{ligne.raccourci}</span>}
    </label>
  );
}

/** « Personnaliser » : cases des outils communs et des actions propres à l'écran, mémorisées pour cet écran. */
export default function MenuPersonnaliserOutils({
  communs,
  propres,
  choisis,
  onBasculer,
  onRetablir,
}: Readonly<{
  communs: LigneMenuOutil[];
  propres: LigneMenuOutil[];
  choisis: string[];
  onBasculer: (id: string) => void;
  onRetablir: () => void;
}>) {
  return (
    <div
      role="dialog"
      aria-label="Personnaliser la barre d'outils"
      className="absolute right-0 bottom-[calc(100%+0.5rem)] z-30 max-h-[min(440px,calc(100svh_-_200px))] w-75 overflow-auto rounded-xl border border-border bg-card py-2 shadow-lg"
    >
      <h3 className="mx-3 mt-1 mb-1 text-micro font-semibold tracking-wide text-muted-foreground uppercase">Outils communs</h3>
      {communs.map((l) => (
        <Ligne key={l.id} ligne={l} coche={choisis.includes(l.id)} onBasculer={() => onBasculer(l.id)} />
      ))}
      {propres.length > 0 && (
        <>
          <h3 className="mx-3 mt-2 mb-1 text-micro font-semibold tracking-wide text-muted-foreground uppercase">Actions de cet écran</h3>
          {propres.map((l) => (
            <Ligne key={l.id} ligne={l} coche={choisis.includes(l.id)} onBasculer={() => onBasculer(l.id)} />
          ))}
        </>
      )}
      <footer className="mt-2 flex items-center justify-between border-t border-border px-3 pt-2 text-micro text-muted-foreground">
        <span>Enregistré pour cet écran</span>
        <button type="button" className="text-body text-(--brand) hover:underline" onClick={onRetablir}>
          Rétablir
        </button>
      </footer>
    </div>
  );
}
