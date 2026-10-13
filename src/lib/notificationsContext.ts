import { createContext, useContext } from 'react';
import type { NotificationDto } from '../types';

/** `non-supportee` : navigateur sans API Notification, ou contexte non sécurisé (ni https ni localhost). */
export type PermissionNavigateur = NotificationPermission | 'non-supportee';

export interface NotificationsValue {
  notifications: readonly NotificationDto[];
  nonLues: number;
  erreur: string | null;
  /** Vrai une seconde après chaque nouvelle notification reçue : la cloche bouge brièvement. */
  sonne: boolean;
  permission: PermissionNavigateur;
  demanderPermission: () => Promise<void>;
  marquerLue: (notification: NotificationDto) => Promise<void>;
  marquerToutLu: () => Promise<void>;
}

export const NotificationsContext = createContext<NotificationsValue | null>(null);

export function useNotifications(): NotificationsValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
