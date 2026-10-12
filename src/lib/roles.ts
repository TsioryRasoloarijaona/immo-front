// Règles de rôle côté écran. Le serveur reste la seule autorité (403) ; ces
// fonctions ne décident que de ce qui s'affiche.

interface PorteurDeRoles {
  roles?: readonly string[];
}

export const ROLES_EXEMPTES: ReadonlySet<string> = new Set(['Administrateur', 'Direction Générale']);

export function estAdministrateur(user: PorteurDeRoles | null | undefined): boolean {
  return user?.roles?.includes('Administrateur') ?? false;
}

/** Accès à « Mon équipe » : Commercial Chef, Administrateur ou Direction Générale. */
export function estChefOuExempte(user: PorteurDeRoles | null | undefined): boolean {
  return (user?.roles?.includes('Commercial Chef') ?? false) || estExempte(user);
}

export function estExempte(user: PorteurDeRoles | null | undefined): boolean {
  return user?.roles?.some((r) => ROLES_EXEMPTES.has(r)) ?? false;
}
