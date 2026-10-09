import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Grid2x2 } from 'lucide-react';
import { cn } from '../lib/utils';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './ui/breadcrumb';
import { SidebarTrigger } from './ui/sidebar';
import { Button } from './ui/button';
import ThemeToggle from './ThemeToggle';
import ModuleSwitcher from './ModuleSwitcher';
import { useAuth } from '../lib/auth';

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
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const { user } = useAuth();
  const isCommercial = user?.roles?.includes('Commercial') ?? false;

  return (
    <div className={cn(fullHeight && 'flex h-svh flex-col overflow-hidden md:h-[calc(100svh-1rem)]')}>
      {/* `md:rounded-t-xl` : l'en-tête épouse les coins de la feuille inset de Layout. */}
      <header
        className={cn(
          'sticky top-0 z-5 flex shrink-0 items-center justify-between gap-x-4 gap-y-2 border-b border-border/70 bg-background/88 px-4 py-2 backdrop-blur-sm md:rounded-t-xl md:px-7',
          entete && 'flex-wrap',
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <SidebarTrigger title="Afficher/masquer la barre latérale" />
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
          {actions && <div className="flex min-w-0 flex-wrap justify-end gap-2">{actions}</div>}
          <ThemeToggle />
          {!isCommercial && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setSwitcherOpen(true)}
              aria-label="Changer de module"
              title="Changer de module"
            >
              <Grid2x2 />
            </Button>
          )}
        </div>
      </header>
      <div className={cn('page', fullHeight && 'flex min-h-0 flex-col overflow-hidden')}>{children}</div>

      {!isCommercial && switcherOpen && <ModuleSwitcher onClose={() => setSwitcherOpen(false)} />}
    </div>
  );
}
