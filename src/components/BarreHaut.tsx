import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleHelp, Grid2x2, Search } from 'lucide-react';
import { SidebarTrigger } from './ui/sidebar';
import { Button, buttonVariants } from './ui/button';
import OngletsEcrans from './OngletsEcrans';
import PaletteMenu, { type EntreePalette } from './PaletteMenu';
import SyncButton from './SyncButton';
import ActionsRecentes from './ActionsRecentes';
import Cloche from './notifications/Cloche';
import ThemeToggle from './ThemeToggle';
import ModuleSwitcher from './ModuleSwitcher';
import BarreIcones from './BarreIcones';
import { useAuth } from '../lib/auth';
import { estAdministrateur, estCommercialTerrain } from '../lib/roles';
import { MODULES_DECLARES } from '../modules/registre';
import type { Utilisateur } from '../modules/types';

/** Entrées d'arbre de tous les modules accessibles : sert aux titres d'onglets et à la palette. */
function entreesDesModules(user: Utilisateur): EntreePalette[] {
  const admin = estAdministrateur(user);
  const ctx = { user, terrain: estCommercialTerrain(user) };
  return MODULES_DECLARES.filter((m) => m.arbre && (!m.reserveAdmin || admin)).flatMap((m) =>
    (m.arbre?.(ctx) ?? []).flatMap((g) =>
      g.entrees.filter((e) => !e.visible || e.visible(user)).map((e) => ({ to: e.to, libelle: e.libelle, module: m.label })),
    ),
  );
}

export default function BarreHaut() {
  const { user } = useAuth();
  const [palette, setPalette] = useState(false);
  const [modules, setModules] = useState(false);
  const entrees = entreesDesModules(user);
  const titres = new Map(entrees.map((e) => [e.to, e.libelle]));

  useEffect(() => {
    const surTouche = (ev: KeyboardEvent) => {
      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') {
        ev.preventDefault();
        setPalette(true);
      }
    };
    window.addEventListener('keydown', surTouche);
    return () => window.removeEventListener('keydown', surTouche);
  }, []);

  return (
    <header className="sticky top-0 z-6 flex h-(--hauteur-barre-haut) shrink-0 items-end gap-2 border-b border-border bg-muted/50 pr-3 pl-2 md:rounded-t-xl">
      <SidebarTrigger title="Afficher/masquer la barre latérale" className="self-center" />
      <OngletsEcrans titres={titres} />
      <div className="flex-1" />
      <BarreIcones className="flex shrink-0 items-center gap-1 self-center">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setPalette(true)}
          aria-label="Rechercher partout"
          title="Rechercher partout (Ctrl K)"
        >
          <Search />
        </Button>
        <SyncButton />
        <ActionsRecentes />
        <Link to="/aide" aria-label="Aide" title="Aide" className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}>
          <CircleHelp />
        </Link>
        <Cloche />
        <ThemeToggle />
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => setModules(true)} aria-label="Changer de module" title="Changer de module">
          <Grid2x2 />
        </Button>
      </BarreIcones>
      {palette && <PaletteMenu entrees={entrees} onClose={() => setPalette(false)} />}
      {modules && <ModuleSwitcher onClose={() => setModules(false)} />}
    </header>
  );
}
