// Cloche : son, notification système et fusion des listes (FEATURE-repartition-notifications.md §4).
import type { NotificationDto } from '../types';
import type { PermissionNavigateur } from './notificationsContext';

export const TAILLE_PANNEAU = 20;

let audio: AudioContext | null = null;

/** Deux notes brèves en WebAudio, sans fichier ni bibliothèque. Silencieux si le navigateur bloque le son. */
export function jouerSonCloche(): void {
  try {
    audio ??= new AudioContext();
    const ctx = audio;
    const debut = ctx.currentTime;
    [880, 1320].forEach((frequence, i) => {
      const oscillateur = ctx.createOscillator();
      const volume = ctx.createGain();
      oscillateur.type = 'sine';
      oscillateur.frequency.value = frequence;
      const t = debut + i * 0.12;
      volume.gain.setValueAtTime(0.0001, t);
      volume.gain.exponentialRampToValueAtTime(0.15, t + 0.01);
      volume.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      oscillateur.connect(volume).connect(ctx.destination);
      oscillateur.start(t);
      oscillateur.stop(t + 0.2);
    });
  } catch {
    // Son refusé avant toute interaction (politique d'autoplay) : la pastille suffit.
  }
}

export function permissionNavigateur(): PermissionNavigateur {
  if (typeof window === 'undefined' || !('Notification' in window) || !window.isSecureContext) return 'non-supportee';
  return Notification.permission;
}

/** Notification système quand l'onglet n'a pas le focus ; clic = retour à l'onglet et au lien. */
export function afficherNotificationSysteme(n: NotificationDto, ouvrir: (lien: string) => void): void {
  if (permissionNavigateur() !== 'granted' || document.hasFocus()) return;
  try {
    const systeme = new Notification(n.titre, { body: n.message, tag: n.id });
    systeme.onclick = () => {
      window.focus();
      if (n.lien) ouvrir(n.lien);
      systeme.close();
    };
  } catch {
    // Certains navigateurs mobiles exigent un service worker : la cloche suffit.
  }
}

/** Ajoute en tête, sans doublon (le flux et la relecture peuvent livrer la même), limité au panneau. */
export function fusionner(liste: readonly NotificationDto[], nouvelle: NotificationDto): NotificationDto[] {
  return [nouvelle, ...liste.filter((n) => n.id !== nouvelle.id)].slice(0, TAILLE_PANNEAU);
}
