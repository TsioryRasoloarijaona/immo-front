import { useEffect, useRef } from 'react';

/** Choix de la nature d'une nouvelle pièce, au-dessus de la barre d'outils ; Échap ou clic dehors ferme. */
export default function MenuNaturesAchat({ natures, onChoisir, onFermer }: Readonly<{
  natures: { code: string; libelle: string }[];
  onChoisir: (code: string) => void;
  onFermer: () => void;
}>) {
  const menu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    menu.current?.querySelector('button')?.focus();
  }, []);
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFermer();
    };
    window.addEventListener('keydown', touche);
    return () => window.removeEventListener('keydown', touche);
  }, [onFermer]);
  return (
    <>
      <button type="button" aria-label="Fermer le menu" tabIndex={-1} className="fixed inset-0 z-40 cursor-default" onClick={onFermer} />
      <div
        ref={menu}
        role="menu"
        aria-label="Nouvelle pièce"
        className="fixed bottom-20 left-1/2 z-50 flex min-w-48 -translate-x-1/2 flex-col rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg"
      >
        {natures.map((n) => (
          <button
            key={n.code}
            type="button"
            role="menuitem"
            className="rounded-md px-3 py-1.5 text-left text-body outline-none hover:bg-muted focus-visible:bg-muted"
            onClick={() => onChoisir(n.code)}
          >
            {n.libelle}
          </button>
        ))}
      </div>
    </>
  );
}
