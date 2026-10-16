import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  clearApiCache,
  listNotifications,
  marquerNotificationLue,
  marquerToutesNotificationsLues,
  URL_FLUX_NOTIFICATIONS,
} from '../../lib/api';
import { afficherNotificationSysteme, fusionner, jouerSonCloche, permissionNavigateur, TAILLE_PANNEAU } from '../../lib/notifications';
import { NotificationsContext, type NotificationsValue } from '../../lib/notificationsContext';
import { errorMessage, refetchAllApis } from '../../lib/useApi';
import type { EvenementNotificationDto, NotificationDto } from '../../types';

// Relecture de secours quand le flux SSE est tombé (proxy, veille du poste).
const RELECTURE_MS = 60_000;
const DUREE_SONNERIE_MS = 1_000;

/**
 * Cloche de l'application : liste et compteur du compte, flux temps réel (SSE) avec relecture de secours,
 * son et notification système à chaque nouvelle notification (FEATURE-repartition-notifications.md §4).
 */
export default function NotificationsProvider({ children }: Readonly<{ children: ReactNode }>) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [nonLues, setNonLues] = useState(0);
  const [erreur, setErreur] = useState<string | null>(null);
  const [sonne, setSonne] = useState(false);
  const [permission, setPermission] = useState(permissionNavigateur);
  const nonLuesRef = useRef(0);
  const navigateRef = useRef(navigate);
  const finSonnerie = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    navigateRef.current = navigate;
  });

  useEffect(() => () => {
    if (finSonnerie.current) clearTimeout(finSonnerie.current);
  }, []);

  const sonner = useCallback(() => {
    jouerSonCloche();
    setSonne(true);
    if (finSonnerie.current) clearTimeout(finSonnerie.current);
    finSonnerie.current = setTimeout(() => setSonne(false), DUREE_SONNERIE_MS);
    // Boîte de tri, Ma journée… relisent leurs compteurs.
    clearApiCache();
    refetchAllApis();
  }, []);

  const charger = useCallback(async () => {
    try {
      const page = await listNotifications(0, TAILLE_PANNEAU);
      setNotifications(page.notifications);
      setErreur(null);
      if (page.nonLues > nonLuesRef.current) sonner();
      nonLuesRef.current = page.nonLues;
      setNonLues(page.nonLues);
    } catch (err) {
      setErreur(errorMessage(err));
    }
  }, [sonner]);

  useEffect(() => {
    let flux: EventSource | null = null;
    const ouvrir = () => {
      flux = new EventSource(URL_FLUX_NOTIFICATIONS, { withCredentials: true });
      flux.addEventListener('notification', (e: MessageEvent<string>) => {
        const evenement = JSON.parse(e.data) as EvenementNotificationDto;
        setNotifications((liste) => fusionner(liste, evenement.notification));
        nonLuesRef.current = evenement.nonLues;
        setNonLues(evenement.nonLues);
        sonner();
        afficherNotificationSysteme(evenement.notification, (lien) => void navigateRef.current(lien));
      });
    };
    // Première lecture sans son : ce ne sont pas des nouveautés.
    void listNotifications(0, TAILLE_PANNEAU)
      .then((page) => {
        setNotifications(page.notifications);
        nonLuesRef.current = page.nonLues;
        setNonLues(page.nonLues);
      })
      .catch((err: unknown) => setErreur(errorMessage(err)));
    ouvrir();
    // EventSource se reconnecte seul ; fermé pour de bon (401, réseau), on relit et on rouvre.
    const minuteur = setInterval(() => {
      if (flux?.readyState === EventSource.OPEN) return;
      void charger();
      if (flux?.readyState === EventSource.CLOSED) ouvrir();
    }, RELECTURE_MS);
    return () => {
      clearInterval(minuteur);
      flux?.close();
    };
  }, [charger, sonner]);

  const marquerLue = useCallback(async (n: NotificationDto) => {
    if (n.lueLe) return;
    try {
      const r = await marquerNotificationLue(n.id);
      const maintenant = new Date().toISOString();
      setNotifications((liste) => liste.map((x) => (x.id === n.id ? { ...x, lueLe: maintenant } : x)));
      nonLuesRef.current = r.nonLues;
      setNonLues(r.nonLues);
    } catch (err) {
      setErreur(errorMessage(err));
    }
  }, []);

  const marquerToutLu = useCallback(async () => {
    try {
      const r = await marquerToutesNotificationsLues();
      const maintenant = new Date().toISOString();
      setNotifications((liste) => liste.map((x) => ({ ...x, lueLe: x.lueLe ?? maintenant })));
      nonLuesRef.current = r.nonLues;
      setNonLues(r.nonLues);
    } catch (err) {
      setErreur(errorMessage(err));
    }
  }, []);

  const demanderPermission = useCallback(async () => {
    if (permissionNavigateur() === 'non-supportee') return;
    setPermission(await Notification.requestPermission());
  }, []);

  const valeur = useMemo<NotificationsValue>(
    () => ({ notifications, nonLues, erreur, sonne, permission, demanderPermission, marquerLue, marquerToutLu }),
    [notifications, nonLues, erreur, sonne, permission, demanderPermission, marquerLue, marquerToutLu],
  );

  return <NotificationsContext.Provider value={valeur}>{children}</NotificationsContext.Provider>;
}
