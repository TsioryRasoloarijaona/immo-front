import { createContext, useContext } from 'react';
import type { ChangerMotDePasseRequest, CompleterProfilRequest, ConnexionRequest, UtilisateurCourantDto } from '../types';

// Le JWT vit dans un cookie httpOnly, illisible ici : ce contexte ne garde que le profil.
// mustChangePassword / profileCompleted sont ignorés (voir FEATURE-acces-arpent-depuis-omran.md F3).
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  status: AuthStatus;
  user: UtilisateurCourantDto | null;
  /** JWT expiré, par opposition à une déconnexion volontaire : l'écran de connexion
   * n'affiche pas le même message. */
  sessionExpiree: boolean;
  login: (body: ConnexionRequest) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (body: ChangerMotDePasseRequest) => Promise<void>;
  completeProfile: (body: CompleterProfilRequest) => Promise<void>;
}

/** Fourni par `AuthProvider` (fichier à part : Fast Refresh exige un fichier de composants seuls). */
export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
