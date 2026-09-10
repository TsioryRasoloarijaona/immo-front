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
  /** Rendered as the page's `<h1>` — the only one on any page. Several detail
   * pages used to render a second `<h1>` for the record's name (client,
   * article, tranche…), which gave every one of them two competing top-level
   * headings in the accessibility tree; those are `<h2>` now. Anything a page
   * renders below this is h2 or deeper. */
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
      {/* `py-2` et non plus `py-2.5 md:py-3` : l'en-tête ne porte plus qu'une
          ligne de texte. Sa hauteur est désormais plancherée par les boutons
          d'action à droite (`size-sm`, 32px), pas par le texte — descendre le
          padding plus bas ne gagnerait donc rien et collerait les boutons au
          filet. C'est aussi pourquoi la puce d'icône reste à `size-7` : à 28px
          elle passe sous ce plancher et ne coûte aucune hauteur. */}
      <header className="sticky top-0 z-5 flex shrink-0 items-center justify-between gap-4 border-b border-border bg-background/88 px-4 py-2 backdrop-blur-sm md:px-7">
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
          {/* Le titre est **présent mais invisible quand un fil d'Ariane le
              relaie**. Une page sans `h1` casse la navigation par titres des
              lecteurs d'écran et laisse le document sans plan ; le fil
              d'Ariane, lui, est un `nav`/`ol` et ne remplace pas un titre.
              D'où le `sr-only` : une seule ligne à l'écran, et le nom de la
              page toujours annoncé — son dernier segment le redit
              visuellement. Ne pas « nettoyer » ce sr-only.

              Le repli n'est pas décoratif : les retours anticipés de
              chargement et d'erreur montent `<PageShell title="…">` **sans
              crumbs** (voir ProjetsList, TranchesList, Dashboard et les pages
              de détail). Sans ce repli, leur en-tête serait entièrement vide
              pendant le chargement — un bandeau avec une puce d'icône et rien
              d'autre. */}
          <div className="flex min-w-0 items-center">
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
                          /* Dernier segment = la page courante. En graisse
                             moyenne et en couleur pleine, il tient le rôle
                             d'ancre visuelle que le gros titre occupait. */
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
