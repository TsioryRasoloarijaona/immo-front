import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Grid2x2 } from 'lucide-react';
import { cn } from '../lib/utils';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './ui/breadcrumb';
import { Separator } from './ui/separator';
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
  children,
}: {
  title: string;
  crumbs?: Crumb[];
  actions?: ReactNode;
  /** Small section-identity icon shown before the title — a lucide icon,
   * colored via `accent`/`accentBg` (pass CSS var references, e.g.
   * `var(--sec-prospection)` — see index.css's "Section-identity accents"
   * block). Optional: pages that don't pass one keep the plain title, no
   * layout shift. Color is a secondary cue only — the icon's own shape is
   * what actually identifies the entity type, so reuse of a shade across
   * unrelated icons (see index.css comment) is intentional, not a bug. */
  icon?: ReactNode;
  accent?: string;
  accentBg?: string;
  /** Pins the header in place and constrains `.page` to the remaining viewport
   * height instead of letting the document scroll — for list views that manage
   * their own internal scroll region (filters/pagination stay on screen, only
   * the table body scrolls). */
  fullHeight?: boolean;
  children: ReactNode;
}) {
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const { user } = useAuth();
  // Commercial's sidebar already lists every section it's allowed to see at
  // once (Ventes/Patrimoine/Profil, see Layout.tsx's `isCommercial`) — the
  // module-switcher launcher exists to jump between single-module views,
  // which doesn't apply here, so it's hidden rather than left as a dead-end
  // "choose a module" affordance for a role that only ever has one.
  const isCommercial = user?.roles?.includes('Commercial') ?? false;

  return (
    <div className={cn(fullHeight && 'flex h-svh flex-col overflow-hidden')}>
      <header className="sticky top-0 z-5 flex shrink-0 items-center justify-between gap-4 border-b border-border bg-background/88 px-4 py-2.5 backdrop-blur-sm md:px-7 md:py-3">
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger title="Afficher/masquer la barre latérale" />
          <Separator orientation="vertical" className="mr-1 h-5" />
          {icon && (
            <span
              className="flex size-7 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4"
              style={{ color: accent, background: accentBg }}
            >
              {icon}
            </span>
          )}
          <div className="flex min-w-0 flex-col gap-0.5">
            <h1 className="truncate text-[19px] font-semibold tracking-tight text-foreground">{title}</h1>
            {crumbs && crumbs.length > 0 && (
              <Breadcrumb>
                <BreadcrumbList className="flex-nowrap gap-1 text-xs">
                  {crumbs.map((c, i) => (
                    <span key={i} className="contents">
                      <BreadcrumbItem>
                        {c.to ? (
                          <BreadcrumbLink render={<Link to={c.to} />}>{c.label}</BreadcrumbLink>
                        ) : (
                          <BreadcrumbPage className="text-xs text-muted-foreground">{c.label}</BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                      {i < crumbs.length - 1 && <BreadcrumbSeparator />}
                    </span>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
          {actions && <Separator orientation="vertical" className="h-5" />}
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
