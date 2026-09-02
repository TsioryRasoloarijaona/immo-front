import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ApiError,
  clearApiCache,
  changerMotDePasse as apiChangerMotDePasse,
  completerProfil as apiCompleterProfil,
  connexion as apiConnexion,
  deconnexion as apiDeconnexion,
  getMonCompte,
} from './api';
import type { ChangerMotDePasseRequest, CompleterProfilRequest, ConnexionRequest, UtilisateurCourantDto } from '../types';

// Session state for the V4 auth module (docs/api-docsV4.json — Authentification
// / Mon compte). The JWT itself lives in an httpOnly cookie set by the
// backend; this context only ever holds the profile/roles/onboarding-flags
// body that comes back alongside it. `status` drives what App.tsx renders:
// 'loading' (checking for an existing session on first mount) →
// 'unauthenticated' (show Login) → 'authenticated' (user is set; App.tsx
// still gates on mustChangePassword/profileCompleted before showing the app).
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  status: AuthStatus;
  user: UtilisateurCourantDto | null;
  login: (body: ConnexionRequest) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (body: ChangerMotDePasseRequest) => Promise<void>;
  completeProfile: (body: CompleterProfilRequest) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<UtilisateurCourantDto | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMonCompte()
      .then((u) => {
        if (cancelled) return;
        setUser(u);
        setStatus('authenticated');
      })
      .catch(() => {
        if (cancelled) return;
        setUser(null);
        setStatus('unauthenticated');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (body: ConnexionRequest) => {
    const u = await apiConnexion(body);
    setUser(u);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiDeconnexion();
    } catch (err) {
      // A failed logout call shouldn't trap the user in the app — the
      // cookie is cleared server-side on a best-effort basis anyway
      // (see the endpoint's own doc note); just drop local state.
      if (!(err instanceof ApiError)) throw err;
    }
    // Le cache GET de `api.ts` vit 30 s et n'est vidé que par une mutation
    // réussie : sans ce purge, un second utilisateur se connectant dans le
    // même onglet pourrait lire les réponses du précédent pendant ce délai.
    clearApiCache();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const changePassword = useCallback(async (body: ChangerMotDePasseRequest) => {
    const u = await apiChangerMotDePasse(body);
    setUser(u);
  }, []);

  const completeProfile = useCallback(async (body: CompleterProfilRequest) => {
    const u = await apiCompleterProfil(body);
    setUser(u);
  }, []);

  // Les quatre actions sont déjà stables (`useCallback` ci-dessus) — sans ce
  // `useMemo`, l'objet littéral les redéclarerait à chaque rendu et ferait
  // re-rendre tous les consommateurs de `useAuth()`, c'est-à-dire tout l'arbre.
  const value = useMemo(
    () => ({ status, user, login, logout, changePassword, completeProfile }),
    [status, user, login, logout, changePassword, completeProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
