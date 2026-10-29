import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import BarreIcones from './BarreIcones';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './ui/breadcrumb';

interface Crumb {
  label: string;
  to?: string;
}

export default function PageShell({
  title,
  crumbs,
  actions,
  icon,
  accent,
  accentBg,
  fullHeight = false,
  entete,
  children,
}: Readonly<{
  /** Le seul `<h1>` de la page : tout ce qu'elle rend en dessous est h2 ou plus. */
  title: string;
  crumbs?: Crumb[];
  actions?: ReactNode;
  /** Couleur via `accent`/`accentBg`, en références de variables CSS (`var(--sec-prospection)`). */
  icon?: ReactNode;
  accent?: string;
  accentBg?: string;
  /** Borne la page à la fenêtre : la liste gère elle-même son défilement. */
  fullHeight?: boolean;
  entete?: ReactNode;
  children: ReactNode;
}>) {
  return (
    <div className={cn(fullHeight && 'flex h-[calc(100svh-var(--hauteur-barre-haut,0px))] flex-col overflow-hidden md:h-[calc(100svh-1rem-var(--hauteur-barre-haut,0px))]')}>
      <header
        className={cn(
          'z-5 flex shrink-0 items-center justify-between gap-x-4 gap-y-2 border-b border-border/70 bg-background/88 px-4 py-2 backdrop-blur-sm md:px-7',
          // En pleine hauteur, le parent `overflow-hidden` devient le repère du `sticky` : le décalage de la barre du
          // haut y serait compté deux fois et l'en-tête recouvrirait la première ligne de la page.
          !fullHeight && 'sticky top-(--hauteur-barre-haut,0px)',
          entete && 'flex-wrap',
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          {icon && (
            <span
              className="flex size-7 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4"
              style={{ color: accent, background: accentBg }}
            >
              {icon}
            </span>
          )}
          {/* Ne pas retirer ce `sr-only` : sans `h1` les lecteurs d'écran perdent la
              navigation par titres. Le repli visible sert aux états chargement/erreur,
              montés sans crumbs. */}
          <div className={cn('flex min-w-0 items-center', entete && 'flex-wrap gap-x-2 gap-y-1')}>
            {crumbs && crumbs.length > 0 ? (
              <h1 className="sr-only">{title}</h1>
            ) : (
              <h1 className="truncate text-body font-medium text-foreground">{title}</h1>
            )}
            {crumbs && crumbs.length > 0 && (
              <Breadcrumb>
                <BreadcrumbList className="flex-nowrap gap-1 text-body">
                  {crumbs.map((c, i) => (
                    <span key={i} className="contents">
                      <BreadcrumbItem>
                        {c.to ? (
                          <BreadcrumbLink render={<Link to={c.to} />}>{c.label}</BreadcrumbLink>
                        ) : (
                          <BreadcrumbPage
                            className={cn(
                              'truncate text-body',
                              i === crumbs.length - 1
                                ? 'font-medium text-foreground'
                                : 'text-muted-foreground',
                            )}
                          >
                            {c.label}
                          </BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                      {i < crumbs.length - 1 && <BreadcrumbSeparator />}
                    </span>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            )}
            {entete && (
              <>
                {crumbs && crumbs.length > 0 && <ChevronRight aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />}
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">{entete}</div>
              </>
            )}
          </div>
        </div>
        <div className={cn('flex items-center gap-2', entete ? 'ml-auto max-w-full' : 'shrink-0')}>
          {actions && <BarreIcones className="flex min-w-0 flex-wrap justify-end gap-2">{actions}</BarreIcones>}
        </div>
      </header>
      <div className={cn('page', fullHeight && 'flex min-h-0 flex-col overflow-hidden')}>{children}</div>
    </div>
  );
}
