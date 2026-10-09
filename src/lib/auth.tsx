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

// Session state for the V4 auth module (docs/api-docsV4.json — Authentification
// / Mon compte). The JWT itself lives in an httpOnly cookie set by the
// backend; this context only ever holds the profile/roles/onboarding-flags
// body that comes back alongside it. `status` drives what App.tsx renders:
// 'loading' (checking for an existing session on first mount) →
// 'unauthenticated' (show Login) → 'authenticated' (user is set; App.tsx
// shows the app directly — mustChangePassword/profileCompleted are legacy
// flags and are ignored, see FEATURE-acces-arpent-depuis-omran.md F3).
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  status: AuthStatus;
  user: UtilisateurCourantDto | null;
  /** Vrai quand la session s'est éteinte toute seule (JWT expiré) plutôt que
   * sur une déconnexion volontaire. Sert à distinguer les deux messages sur
   * l'écran de connexion : « vous avez été déconnecté » n'est pas la même
   * information que « vous êtes déconnecté ». */
  sessionExpiree: boolean;
  login: (body: ConnexionRequest) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (body: ChangerMotDePasseRequest) => Promise<void>;
  completeProfile: (body: CompleterProfilRequest) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Le sondage au retour d'onglet ne doit pas re-rendre toute l'app quand rien n'a changé. */
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

  // Expiration détectée en réaction : tout 401 hors formulaire de connexion
  // ferme la session ici, une seule fois, au lieu de laisser chaque page
  // afficher son propre message d'échec.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      // Seule une session que l'on croyait vivante peut « expirer ». Au
      // montage le statut vaut 'loading' et le 401 de /api/mon-compte veut
      // juste dire « personne n'est connecté » : le laisser passer ici
      // afficherait « session expirée » à qui vient d'ouvrir l'application.
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

  // …et vérification à la reprise. Le cas décrit est « je reviens après
  // quelques minutes » : sans cela l'écran resterait figé sur des données
  // périmées jusqu'au premier clic, qui échouerait. On ne sonde qu'au retour
  // sur l'onglet, et au plus une fois par minute, pour ne pas transformer
  // chaque alt-tab en requête.
  //
  // La minute n’est pas un chiffre rond arbitraire : les GET sont mémorisés
  // 30 s par URL dans api.ts (CACHE_TTL_MS). Sonder plus souvent relirait la
  // promesse en cache — un succès périmé — et ne toucherait jamais le réseau,
  // donc ne détecterait jamais l’expiration. Ce seuil doit rester au-dessus
  // de ce TTL.
  useEffect(() => {
    let dernierControle = Date.now();

    function verifier() {
      if (document.visibilityState !== 'visible') return;
      if (statusRef.current !== 'authenticated') return;
      if (Date.now() - dernierControle < 60_000) return;
      dernierControle = Date.now();
      // En cas d'échec on ne fait rien : un 401 est déjà traité par l'accroche
      // ci-dessus, et une coupure réseau passagère ne doit pas déconnecter.
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
      // Un échec (réseau compris) ne doit pas garder l'utilisateur connecté
      // localement : l'état est vidé quoi qu'il arrive.
    }
    // Les caches GET (api.ts) et de valeurs (apiCache) vivent au niveau module,
    // pas dans l'arbre React : la déconnexion ne rechargeant pas la page, sans
    // vidage explicite les données du compte précédent survivraient à une
    // reconnexion dans le même onglet. Le POST ci-dessus le fait déjà quand il
    // réussit — mais on déconnecte aussi quand il échoue.
    clearApiCache();
    setUser(null);
    // Déconnexion volontaire : surtout pas le message d'expiration.
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
