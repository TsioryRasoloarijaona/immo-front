import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ecrirePosition, lirePosition, useAgrandieMemorisee, type PositionFenetre, type VoisinsFiche } from '../../lib/fenetreFiche';

const BOUTON =
  'grid size-7 place-items-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-(--brand) disabled:opacity-40 disabled:hover:bg-transparent';

/** Une fenêtre, un menu ou une boîte de dialogue ouverts par-dessus gardent leur Échap. */
function autreCoucheOuverte(fenetre: HTMLElement | null): boolean {
  const dialogues = document.querySelectorAll('[role=dialog],[role=alertdialog]');
  if (Array.from(dialogues).some((d) => !d.isSameNode(fenetre))) return true;
  return document.querySelector('[role=listbox],[role=menu]') !== null;
}

/**
 * Fenêtre flottante d'une fiche : déplaçable par sa barre de titre, agrandissable, ‹ › entre lignes de la liste,
 * Échap (ou clic sur le voile) ferme. `pied` s'affiche à gauche du pied, « Ligne x sur n » à droite.
 */
export default function FenetreFiche({
  nature,
  titre,
  badge,
  voisins,
  onFermer,
  pied,
  children,
}: Readonly<{
  nature: string;
  titre: string;
  badge?: ReactNode;
  voisins?: VoisinsFiche;
  onFermer: () => void;
  pied?: ReactNode;
  children: ReactNode;
}>) {
  const fenetre = useRef<HTMLDivElement>(null);
  const croix = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState<PositionFenetre | null>(lirePosition);
  const [agrandie, basculerAgrandie] = useAgrandieMemorisee();
  const decalage = useRef<PositionFenetre | null>(null);
  const precedent = voisins?.precedent;
  const suivant = voisins?.suivant;

  // Le focus revient à l'élément (la ligne) qui avait ouvert la fenêtre.
  useEffect(() => {
    const ouvreur = document.activeElement;
    croix.current?.focus();
    return () => {
      if (ouvreur instanceof HTMLElement && ouvreur.isConnected) ouvreur.focus();
    };
  }, []);

  useEffect(() => {
    function surTouche(e: KeyboardEvent) {
      if (e.defaultPrevented) return;
      if (e.key === 'Escape') {
        if (!autreCoucheOuverte(fenetre.current)) onFermer();
      } else if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        precedent?.();
      } else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        suivant?.();
      }
    }
    // Capture : le DOM d'un menu ou d'une boîte ouverts est encore intact avant qu'elle ne se referme sur le même Échap.
    window.addEventListener('keydown', surTouche, true);
    return () => window.removeEventListener('keydown', surTouche, true);
  }, [onFermer, precedent, suivant]);

  function debutDeplacement(e: ReactPointerEvent<HTMLDivElement>) {
    if (agrandie || !fenetre.current || (e.target as HTMLElement).closest('button')) return;
    const r = fenetre.current.getBoundingClientRect();
    decalage.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function deplacement(e: ReactPointerEvent<HTMLDivElement>) {
    const d = decalage.current;
    if (!d || !fenetre.current) return;
    const { offsetWidth: l, offsetHeight: h } = fenetre.current;
    setPosition({
      x: Math.min(Math.max(0, e.clientX - d.x), Math.max(0, window.innerWidth - l)),
      y: Math.min(Math.max(0, e.clientY - d.y), Math.max(0, window.innerHeight - h)),
    });
  }

  function finDeplacement() {
    if (decalage.current && position) ecrirePosition(position);
    decalage.current = null;
  }

  const libellePosition = voisins && voisins.position > 0 ? `Ligne ${voisins.position} sur ${voisins.total}` : 'Ligne — sur —';
  const style = !agrandie && position ? { left: position.x, top: position.y } : undefined;

  return (
    <>
      <div aria-hidden className="fixed inset-0 z-40 bg-black/20" onClick={onFermer} />
      <div
        ref={fenetre}
        role="dialog"
        aria-modal="true"
        aria-label={`${nature} ${titre}`}
        style={style}
        className={cn(
          'fixed z-40 flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl',
          agrandie && 'inset-2',
          !agrandie && !position && 'top-1/2 left-1/2 h-[min(680px,calc(100dvh-40px))] w-[min(1080px,calc(100vw-48px))] -translate-x-1/2 -translate-y-1/2',
          !agrandie && position && 'h-[min(680px,calc(100dvh-40px))] w-[min(1080px,calc(100vw-48px))]',
        )}
      >
        <div
          className={cn('flex h-10 shrink-0 touch-none items-center gap-2 border-b border-border bg-muted/40 pr-2 pl-3 select-none', !agrandie && 'cursor-move')}
          onPointerDown={debutDeplacement}
          onPointerMove={deplacement}
          onPointerUp={finDeplacement}
          onPointerCancel={finDeplacement}
        >
          <span className="shrink-0 text-micro text-muted-foreground">{nature}</span>
          <h2 className="min-w-0 truncate text-label font-semibold text-foreground">{titre}</h2>
          {badge}
          <span className="flex-1" />
          <button
            type="button"
            className={BOUTON}
            aria-label="Ligne précédente"
            title={precedent ? 'Ligne précédente · Alt+←' : 'Début de la page'}
            disabled={!precedent}
            onClick={precedent}
          >
            <ChevronLeft aria-hidden className="size-4" />
          </button>
          <button
            type="button"
            className={BOUTON}
            aria-label="Ligne suivante"
            title={suivant ? 'Ligne suivante · Alt+→' : 'Fin de la page'}
            disabled={!suivant}
            onClick={suivant}
          >
            <ChevronRight aria-hidden className="size-4" />
          </button>
          <button
            type="button"
            className={BOUTON}
            aria-label={agrandie ? 'Restaurer la fenêtre' : 'Agrandir la fenêtre'}
            title={agrandie ? 'Restaurer' : 'Agrandir'}
            onClick={basculerAgrandie}
          >
            {agrandie ? <Minimize2 aria-hidden className="size-4" /> : <Maximize2 aria-hidden className="size-4" />}
          </button>
          <button ref={croix} type="button" className={BOUTON} aria-label="Fermer" title="Fermer · Échap" onClick={onFermer}>
            <X aria-hidden className="size-4" />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        <div className="flex h-7 shrink-0 items-center justify-between gap-3 border-t border-border bg-muted/40 px-3 text-micro text-muted-foreground">
          <span className="min-w-0 truncate">{pied}</span>
          <span className="shrink-0 tabular-nums">{libellePosition}</span>
        </div>
      </div>
    </>
  );
}
