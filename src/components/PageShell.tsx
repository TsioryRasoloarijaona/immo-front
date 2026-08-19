import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Grid2x2 } from 'lucide-react';
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

interface Crumb {
  label: string;
  to?: string;
}

export default function PageShell({
  title,
  crumbs,
  actions,
  children,
}: {
  title: string;
  crumbs?: Crumb[];
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [switcherOpen, setSwitcherOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-5 flex items-center justify-between gap-4 border-b border-border bg-background/88 px-4 py-2.5 backdrop-blur-sm md:px-7 md:py-3">
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger title="Afficher/masquer la barre latérale" />
          <Separator orientation="vertical" className="mr-1 h-5" />
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
        </div>
      </header>
      <div className="page">{children}</div>

      {switcherOpen && <ModuleSwitcher onClose={() => setSwitcherOpen(false)} />}
    </>
  );
}
