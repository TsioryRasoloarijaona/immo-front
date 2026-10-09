import { useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

/** Seules touches qu'on laisse remonter au menu : la recherche par lettre de
 * Base UI volerait sinon chaque caractère tapé, mais sans celles-ci on ne
 * pourrait plus fermer le menu ni y naviguer au clavier. */
const TOUCHES_DU_MENU = new Set(['Escape', 'ArrowDown', 'ArrowUp', 'Enter', 'Tab']);

export default function RechercheMenu({
  ouvert,
  valeur,
  onChange,
  placeholder,
  libelle,
}: Readonly<{
  /** Requis : le popup est monté par portail, sa référence n'existe pas avant l'ouverture. */
  ouvert: boolean;
  valeur: string;
  onChange: (v: string) => void;
  placeholder: string;
  libelle: string;
}>) {
  const champRef = useRef<HTMLInputElement>(null);

  // Écouteur natif, pas `onKeyDown` React : React délègue à la racine, donc
  // l'écouteur que Base UI pose sur le popup passerait avant. Le focus est repris
  // à la frame suivante, après que le menu l'a placé sur son premier élément.
  useEffect(() => {
    if (!ouvert) return;
    let champ: HTMLInputElement | null = null;
    const auClavier = (e: KeyboardEvent) => {
      if (!TOUCHES_DU_MENU.has(e.key)) e.stopPropagation();
    };
    // Dans la frame suivante, pas dans le corps de l'effet : le popup est
    // monté par portail et sa référence n'est pas encore garnie ici.
    const frame = requestAnimationFrame(() => {
      champ = champRef.current;
      champ?.focus();
      champ?.addEventListener('keydown', auClavier);
    });
    return () => {
      cancelAnimationFrame(frame);
      champ?.removeEventListener('keydown', auClavier);
    };
  }, [ouvert]);

  return (
    /* Marges négatives : annulent le `p-1` du popup pour que la barre colle au bord. */
    <div className="sticky -top-1 z-20 -mx-1 -mt-1 mb-1 border-b border-border bg-popover px-2 pt-2 pb-1.5">
      <div className="flex items-center gap-1.5">
        <Search aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
        <input
          ref={champRef}
          type="text"
          value={valeur}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={libelle}
          className="h-6 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}
