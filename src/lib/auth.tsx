import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  changerMotDePasse as apiChangerMotDePasse,
  completerProfil as apiCompleterProfil,
  connexion as apiConnexion,
  deconnexion as apiDeconnexion,
  clearApiCache,
  getMonCompte,
  setUnauthorizedHandler,
} from './api';
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

const AuthContext = createContext<AuthContextValue | null>(null);

function memeCompte(a: UtilisateurCourantDto | null, b: UtilisateurCourantDto): boolean {
  if (!a) return false;
  const projets = (u: UtilisateurCourantDto) => (u.projetsAutorises ?? []).map((p) => p.id).join('|');
  return (
    a.id === b.id &&
    (a.roles ?? []).join('|') === (b.roles ?? []).join('|') &&
    a.perimetreRestreint === b.perimetreRestreint &&
    projets(a) === projets(b)
  );
}

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<UtilisateurCourantDto | null>(null);
  const [sessionExpiree, setSessionExpiree] = useState(false);

  // Le statut est lu depuis des rappels non-React (l'accroche 401 d'api.ts, un
  // écouteur d'évènement) : une ref évite de les réabonner à chaque transition.
  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      // Au montage, le 401 de /api/mon-compte veut dire « personne n'est connecté »,
      // pas « session expirée ».
      if (statusRef.current !== 'authenticated') return;
      // Avant le vidage : les rechargements qu'il déclenche finiront eux aussi en 401.
      statusRef.current = 'unauthenticated';
      clearApiCache();
      setUser(null);
      setSessionExpiree(true);
      setStatus('unauthenticated');
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // L'intervalle de sondage doit rester au-dessus de CACHE_TTL_MS (api.ts) : en
  // dessous, on relirait la promesse GET en cache et l'expiration ne serait jamais vue.
  useEffect(() => {
    let dernierControle = Date.now();

    function verifier() {
      if (document.visibilityState !== 'visible') return;
      if (statusRef.current !== 'authenticated') return;
      if (Date.now() - dernierControle < 60_000) return;
      dernierControle = Date.now();
      // Échec ignoré : le 401 passe par l'accroche, une coupure réseau ne doit pas déconnecter.
      getMonCompte()
        .then((u) => setUser((prev) => (memeCompte(prev, u) ? prev : u)))
        .catch(() => {});
    }

    document.addEventListener('visibilitychange', verifier);
    window.addEventListener('focus', verifier);
    return () => {
      document.removeEventListener('visibilitychange', verifier);
      window.removeEventListener('focus', verifier);
    };
  }, []);

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
    setSessionExpiree(false);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    // Synchrone, avant l'appel : le POST vide les caches, et les 401 des
    // rechargements qui suivent ne doivent pas se lire comme une expiration.
    statusRef.current = 'unauthenticated';
    try {
      await apiDeconnexion();
    } catch {
      // Échec ignoré : l'état local est vidé quoi qu'il arrive.
    }
    // Les caches sont au niveau module et la page ne recharge pas : sans ce vidage,
    // le compte suivant verrait les données du précédent (le POST a pu échouer).
    clearApiCache();
    setUser(null);
    setSessionExpiree(false);
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

  const value = useMemo(
    () => ({ status, user, sessionExpiree, login, logout, changePassword, completeProfile }),
    [status, user, sessionExpiree, login, logout, changePassword, completeProfile],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
