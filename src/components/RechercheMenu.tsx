import { useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

/** Touches qu'on laisse remonter au menu depuis le champ de recherche.
 *
 * Base UI équipe ses menus d'une recherche par frappe : n'importe quelle
 * touche imprimable déplace le focus vers l'élément dont le libellé commence
 * par cette lettre. Dans un menu qui contient un champ de saisie, ce
 * comportement vole chaque caractère tapé. On arrête donc la propagation de
 * tout le reste — mais surtout pas de celles-ci, qui sont la navigation :
 * sans elles on ne pourrait plus fermer le menu ni descendre du champ vers la
 * liste au clavier. */
const TOUCHES_DU_MENU = new Set(['Escape', 'ArrowDown', 'ArrowUp', 'Enter', 'Tab']);

/** Barre de recherche collante en tête d'un menu déroulant.
 *
 * Extraite de `ColumnSelector`, où elle a été mise au point, parce qu'un second
 * menu en avait besoin — la bande de groupement, qui liste jusqu'à 35 colonnes
 * sur les encaissements. **Ce qui justifie l'extraction n'est pas le balisage
 * mais l'effet ci-dessous** : il est contre-intuitif, il a demandé une mesure
 * pour être trouvé, et deux copies auraient divergé au premier correctif. */
export default function RechercheMenu({
  ouvert,
  valeur,
  onChange,
  placeholder,
  libelle,
}: {
  /** État d'ouverture du menu parent. L'effet ne peut pas s'en passer : le
   * popup est monté par portail, sa référence n'existe pas avant. */
  ouvert: boolean;
  valeur: string;
  onChange: (v: string) => void;
  placeholder: string;
  libelle: string;
}) {
  const champRef = useRef<HTMLInputElement>(null);

  // Deux choses à l'ouverture du menu.
  //
  // 1. Reprendre le focus. Le menu le place sur son premier élément ; on le
  //    récupère à la frame suivante, une fois ce placement terminé.
  //
  // 2. Neutraliser la recherche-par-lettre de Base UI, **en natif**. Un
  //    `onKeyDown` React ne suffit pas : React délègue ses écouteurs à la
  //    racine de l'application, si bien que l'écouteur natif que Base UI pose
  //    sur le popup — un ancêtre du champ — s'exécute avant. Mesuré : une
  //    seule lettre fermait le menu. Posé sur le champ, qui est la cible de
  //    l'événement, l'écouteur passe avant tout ancêtre et `stopPropagation`
  //    fait son office.
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
    /* Marges négatives : le popup porte `p-1`, que la barre annule pour
       occuper toute sa largeur et se coller au bord haut quand la liste
       défile dessous. */
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
