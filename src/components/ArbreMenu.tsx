import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from './ui/sidebar';
import { useAuth } from '../lib/auth';
import { cn } from '../lib/utils';
import { estEntreeActive, type EntreeArbre, type GroupeArbre } from '../modules/arbre';

const cleReplies = (slug: string) => `arpent.arbre.v2.${slug}.replies`;

function lireReplies(slug: string): Set<string> {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(cleReplies(slug)) ?? '[]');
    return new Set(Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

function ecrireReplies(slug: string, replies: ReadonlySet<string>) {
  try {
    localStorage.setItem(cleReplies(slug), JSON.stringify([...replies]));
  } catch {
    // Stockage indisponible (navigation privée) : l'état reste en mémoire.
  }
}

/** `replies` sans le groupe de la page courante, ou `null` s'il n'y était pas. */
function rouvrirGroupeActif(replies: ReadonlySet<string>, groupes: readonly GroupeArbre[], pathname: string): Set<string> | null {
  const actif = groupes.find((g) => g.entrees.some((e) => estEntreeActive(pathname, e)));
  if (!actif || !replies.has(actif.cle)) return null;
  const suivant = new Set(replies);
  suivant.delete(actif.cle);
  return suivant;
}

function LienArbre({ entree, pathname, guide }: Readonly<{ entree: EntreeArbre; pathname: string; guide: boolean }>) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        size="sm"
        render={<NavLink to={entree.to} end={entree.exact} />}
        isActive={estEntreeActive(pathname, entree)}
        tooltip={entree.libelle}
        className={cn(
          'h-6 gap-2 px-2 text-body',
          guide &&
            'rounded-l-none pl-2 shadow-[inset_1px_0_0_var(--border)] data-active:shadow-[inset_2px_0_0_var(--brand)] group-data-[collapsible=icon]:rounded-md group-data-[collapsible=icon]:shadow-none',
        )}
      >
        <entree.Icone style={entree.couleur ? { color: entree.couleur } : undefined} />
        <span>{entree.libelle}</span>
      </SidebarMenuButton>
      {entree.badge}
    </SidebarMenuItem>
  );
}

/**
 * Arbre du module actif : groupes ouverts par défaut, repliables et mémorisés par module ; le groupe de la page
 * courante se rouvre à chaque navigation. En barre réduite (icônes), tout reste visible.
 */
export default function ArbreMenu({ slug, groupes, pathname }: Readonly<{ slug: string; groupes: readonly GroupeArbre[]; pathname: string }>) {
  const { user } = useAuth();
  const { state, isMobile } = useSidebar();
  const visibles = groupes
    .map((g) => ({ ...g, entrees: g.entrees.filter((e) => !e.visible || e.visible(user)) }))
    .filter((g) => g.entrees.length > 0);
  const [replies, setReplies] = useState(() => {
    const lues = lireReplies(slug);
    return rouvrirGroupeActif(lues, visibles, pathname) ?? lues;
  });
  const [cheminVu, setCheminVu] = useState(pathname);

  // Ajustement pendant le rendu (pas d'effet) : à chaque navigation, rouvrir le groupe de la page.
  if (cheminVu !== pathname) {
    setCheminVu(pathname);
    const suivant = rouvrirGroupeActif(replies, visibles, pathname);
    if (suivant) {
      setReplies(suivant);
      ecrireReplies(slug, suivant);
    }
  }

  function basculer(cle: string) {
    const suivant = new Set(replies);
    if (suivant.has(cle)) suivant.delete(cle);
    else suivant.add(cle);
    setReplies(suivant);
    ecrireReplies(slug, suivant);
  }

  const icones = state === 'collapsed' && !isMobile;

  return (
    <>
      {visibles.map((g) => {
        const ouvert = icones || !replies.has(g.cle);
        return (
          <SidebarGroup key={g.cle} className="px-2 py-0.5">
            {g.titre && (
              <button
                type="button"
                aria-expanded={ouvert}
                onClick={() => basculer(g.cle)}
                className="flex h-6.5 w-full cursor-pointer items-center justify-between rounded-md px-2 text-body font-medium text-sidebar-foreground/80 outline-hidden transition-colors hover:bg-sidebar-accent/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:hidden"
              >
                {g.titre}
                <ChevronRight className={cn('size-3.5 transition-transform duration-150 ease-out', ouvert && 'rotate-90')} aria-hidden />
              </button>
            )}
            {ouvert && (
              <SidebarMenu className={cn('gap-px', g.titre && 'ml-3 group-data-[collapsible=icon]:ml-0')}>
                {g.entrees.map((e) => <LienArbre key={e.to} entree={e} pathname={pathname} guide={Boolean(g.titre)} />)}
              </SidebarMenu>
            )}
          </SidebarGroup>
        );
      })}
    </>
  );
}
