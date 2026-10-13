import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Bell, ChevronRight, Grid2x2, Moon, PanelLeft } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { cible, coteDe, idEtape, idRepere, LARGEUR_MAQUETTE, type Cote, type LienReperes } from './reperes';

const MENU: readonly { titre: string; entrees: readonly string[] }[] = [
  { titre: 'Mon activité', entrees: ['Ma journée', 'Boîte de tri', 'Calendrier', 'Hotline'] },
  { titre: 'Pipeline', entrees: ['Pré-prospections', 'Prospections', 'Prospects'] },
  { titre: 'Dossiers', entrees: ['Offres', 'Clients', 'Dossiers de vente', 'Encaissements'] },
  { titre: 'Mon équipe', entrees: ['Distribution & équipe'] },
];

/** Position et taille de l'élément visé, en % de la maquette. */
interface Repere {
  n: number;
  cote?: Cote;
  x: number;
  y: number;
  l: number;
  h: number;
}

function lireReperes(scene: HTMLElement): Repere[] {
  const base = scene.getBoundingClientRect();
  if (base.width === 0 || base.height === 0) return [];
  return Array.from(scene.querySelectorAll<HTMLElement>('[data-repere]'), (el) => {
    const visee = (el.dataset.sous && el.querySelector(el.dataset.sous)) || el;
    const r = visee.getBoundingClientRect();
    return {
      n: Number(el.dataset.repere),
      cote: coteDe(el.dataset.cote),
      x: ((r.left - base.left) / base.width) * 100,
      y: ((r.top - base.top) / base.height) * 100,
      l: (r.width / base.width) * 100,
      h: (r.height / base.height) * 100,
    };
  });
}

function ancre(r: Repere): { x: number; y: number } {
  switch (r.cote) {
    case 'gauche':
      return { x: r.x, y: r.y + r.h / 2 };
    case 'droite':
      return { x: r.x + r.l, y: r.y + r.h / 2 };
    case 'haut':
      return { x: r.x + r.l / 2, y: r.y };
    case 'bas':
      return { x: r.x + r.l / 2, y: r.y + r.h };
    default:
      return { x: r.x, y: r.y };
  }
}

const POSITION: Record<Cote, { pastille: string; fleche: string }> = {
  gauche: { pastille: '-left-8 top-0', fleche: '-left-5 -top-px h-0.5 w-5' },
  droite: { pastille: 'left-8 top-0', fleche: 'left-0 -top-px h-0.5 w-5' },
  haut: { pastille: 'left-0 -top-8', fleche: '-left-px -top-5 h-5 w-0.5' },
  bas: { pastille: 'left-0 top-8', fleche: '-left-px top-0 h-5 w-0.5' },
};

function Marqueur({ repere, actif, onActif }: Readonly<{ repere: Repere } & LienReperes>) {
  const { n, cote } = repere;
  const point = ancre(repere);
  const enAvant = actif === n;
  return (
    <>
      {enAvant && (
        <span
          aria-hidden
          className="pointer-events-none absolute rounded-md ring-2 ring-primary ring-offset-1 ring-offset-background"
          style={{ left: `${repere.x}%`, top: `${repere.y}%`, width: `${repere.l}%`, height: `${repere.h}%` }}
        />
      )}
      <div className="pointer-events-none absolute size-0" style={{ left: `${point.x}%`, top: `${point.y}%` }}>
        {cote && (
          <span aria-hidden className={cn('absolute bg-primary', POSITION[cote].fleche)}>
            <span className="absolute inset-0 m-auto size-1.5 rounded-full bg-primary" />
          </span>
        )}
        <button
          type="button"
          id={idRepere(n)}
          aria-label={`Étape ${n}`}
          aria-describedby={idEtape(n)}
          onMouseEnter={() => onActif(n)}
          onMouseLeave={() => onActif(null)}
          onFocus={() => onActif(n)}
          onBlur={() => onActif(null)}
          onClick={() => document.getElementById(idEtape(n))?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })}
          className={cn(
            'pointer-events-auto absolute flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-micro font-semibold text-primary-foreground tabular-nums shadow-md ring-2 ring-background transition-transform sm:size-6',
            cote && POSITION[cote].pastille,
            enAvant && 'scale-125',
          )}
        >
          {n}
        </button>
      </div>
    </>
  );
}

function BarreLaterale({ entree }: Readonly<{ entree: string }>) {
  return (
    <nav className="flex w-40 shrink-0 flex-col gap-3 border-r border-sidebar-border bg-sidebar px-2.5 py-3 text-sidebar-foreground">
      <span className="px-1.5 text-label font-semibold">Arpent · Vente</span>
      {MENU.map((groupe) => (
        <div key={groupe.titre} className="flex flex-col gap-0.5">
          <span className="px-1.5 text-micro font-medium text-muted-foreground">{groupe.titre}</span>
          {groupe.entrees.map((e) => (
            <span
              key={e}
              className={cn('rounded-md px-1.5 py-1 text-micro', e === entree ? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground' : 'text-foreground/80')}
            >
              {e}
            </span>
          ))}
        </div>
      ))}
    </nav>
  );
}

/**
 * Cadre commun des maquettes : écran réduit (barre latérale, fil d'Ariane, contenu statique) dessiné à
 * `LARGEUR_MAQUETTE` puis mis à l'échelle de la colonne ; les repères sont mesurés sur les éléments `cible(n)`.
 */
export default function MaquetteEcran({
  titre,
  entree,
  fil,
  repereFil,
  entete,
  actions,
  actif,
  onActif,
  onPresents,
  children,
}: Readonly<
  {
    /** Nom de l'écran, pour `aria-label`. */
    titre: string;
    /** Entrée de la barre latérale mise en évidence. */
    entree: string;
    fil: readonly string[];
    /** Étape posée sur le premier élément du fil d'Ariane. */
    repereFil?: number;
    entete?: ReactNode;
    actions?: ReactNode;
    children: ReactNode;
  } & LienReperes
>) {
  const cadre = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const [mesure, setMesure] = useState<{ echelle: number; hauteur: number; reperes: Repere[] }>({ echelle: 1, hauteur: 0, reperes: [] });

  useLayoutEffect(() => {
    const c = cadre.current;
    const s = scene.current;
    if (!c || !s) return;
    // L'observateur répond dès `observe` : la première mesure tombe avant l'affichage.
    const observateur = new ResizeObserver(() => {
      const reperes = lireReperes(s);
      setMesure({ echelle: Math.min(1, c.clientWidth / LARGEUR_MAQUETTE), hauteur: s.offsetHeight, reperes });
      onPresents?.(reperes.map((r) => r.n));
    });
    observateur.observe(c);
    observateur.observe(s);
    return () => observateur.disconnect();
  }, [onPresents]);

  return (
    <figure aria-label={`Illustration de l'écran « ${titre} »`} className="flex flex-col gap-1.5">
      {/* `overflow-x-clip` : pas de défilement horizontal, mais les pastilles du bord haut restent visibles. */}
      <div ref={cadre} className="relative w-full overflow-x-clip" style={{ height: mesure.hauteur * mesure.echelle }}>
        <div
          ref={scene}
          inert
          aria-hidden
          className="absolute top-0 left-0 flex origin-top-left overflow-hidden rounded-xl border border-border bg-background shadow-sm select-none"
          style={{ width: LARGEUR_MAQUETTE, transform: `scale(${mesure.echelle})` }}
        >
          <BarreLaterale entree={entree} />
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-2">
              <div className="flex min-w-0 items-center gap-2 text-body">
                <PanelLeft className="size-4 shrink-0 text-muted-foreground" />
                {fil.map((f, i) => (
                  <span key={f} className="flex items-center gap-1.5">
                    {i > 0 && <ChevronRight className="size-3.5 text-muted-foreground" />}
                    <span
                      {...(i === 0 && repereFil ? cible(repereFil, 'bas') : {})}
                      className={i === fil.length - 1 ? 'font-medium text-foreground' : 'text-muted-foreground'}
                    >
                      {f}
                    </span>
                  </span>
                ))}
                {entete}
              </div>
              <div className="flex shrink-0 items-center gap-2 text-muted-foreground">
                {actions}
                <Bell className="size-4" />
                <Moon className="size-4" />
                <Grid2x2 className="size-4" />
              </div>
            </div>
            <div className="flex flex-col gap-3 p-4">{children}</div>
          </div>
        </div>
        <div className="absolute inset-0">
          {mesure.reperes.map((r) => (
            <Marqueur key={r.n} repere={r} actif={actif} onActif={onActif} />
          ))}
        </div>
      </div>
      <figcaption className="text-micro text-muted-foreground">
        Écran simplifié, données fictives. Survolez une étape ou une pastille pour les relier.
      </figcaption>
    </figure>
  );
}
