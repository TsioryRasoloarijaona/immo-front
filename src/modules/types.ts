import type { ComponentType, ReactNode, SVGProps } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { estAdministrateur } from '../lib/roles';
import type { ArbreModule } from './arbre';

export type Utilisateur = Parameters<typeof estAdministrateur>[0];

export interface EntreeMenu {
  to: string;
  libelle: string;
  Icone: LucideIcon;
  couleur?: string;
  /** Préfixe qui rend l'entrée active, `to` par défaut. */
  actif?: string;
  exact?: boolean;
  tooltip?: string;
  visible?: (user: Utilisateur) => boolean;
}

/** Déclaration d'un module : `src/modules/<module>/routes.tsx`, ramassée par `registre.ts`. */
export interface ModuleApp {
  slug: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Rang dans le sélecteur de modules et ordre de détection du module d'un chemin. */
  ordre: number;
  path: string;
  adminOnly?: boolean;
  /** Menu remplacé par un message pour qui n'est pas administrateur. */
  reserveAdmin?: boolean;
  /** Débuts de chemin du module ; `/` ne vaut que pour lui-même. */
  prefixes: string[];
  routes: { path: string; element: ReactNode }[];
  arbre?: ArbreModule;
  Menu?: ComponentType<{ pathname: string }>;
}
