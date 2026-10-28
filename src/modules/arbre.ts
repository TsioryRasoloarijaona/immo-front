import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { Utilisateur } from './types';

export interface EntreeArbre {
  to: string;
  libelle: string;
  Icone: LucideIcon;
  couleur?: string;
  /** Préfixe qui rend l'entrée active, `to` par défaut. */
  actif?: string;
  exact?: boolean;
  visible?: (user: Utilisateur) => boolean;
  badge?: ReactNode;
}

/** Sans `titre`, les entrées forment une rangée « solo » : ni chevron ni indentation. */
export interface GroupeArbre {
  cle: string;
  titre?: string;
  entrees: EntreeArbre[];
}

export type ArbreModule = (ctx: { user: Utilisateur; terrain: boolean }) => GroupeArbre[];

export function estEntreeActive(pathname: string, e: EntreeArbre): boolean {
  if (e.exact) return pathname === e.to;
  const prefixe = e.actif ?? e.to;
  return pathname === prefixe || pathname.startsWith(`${prefixe}/`);
}
