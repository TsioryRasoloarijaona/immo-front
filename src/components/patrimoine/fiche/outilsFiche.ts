import { useState } from 'react';
import { ouvrirBlobDansOnglet } from '../../../lib/api';
import { useAuth } from '../../../lib/auth';
import { useConfirm } from '../../../lib/confirmContext';
import { estAdministrateur } from '../../../lib/roles';
import { useToast } from '../../../lib/toastContext';
import { errorMessage, refetchAllApis } from '../../../lib/useApi';

/** Bouton « Imprimer » du ruban : ouvre le PDF de la fiche dans un nouvel onglet. */
export function useImprimer(charger: () => Promise<Blob>): { onClick: () => void } {
  const showToast = useToast();
  return {
    onClick: () => void ouvrirBlobDansOnglet(charger).catch((err: unknown) => showToast({ texte: errorMessage(err), variante: 'erreur' })),
  };
}

/**
 * Bouton « Supprimer » du ruban : confirmation, suppression, puis `apres` (fermeture de la fenêtre). `supprimer` est
 * absent pour un compte non Administrateur (le serveur répond 403 aux autres).
 */
export function useSuppression({
  titre,
  message,
  action,
  apres,
}: Readonly<{ titre: string; message: string; action: () => Promise<unknown>; apres: () => void }>) {
  const confirm = useConfirm();
  const { user } = useAuth();
  const [erreur, setErreur] = useState<string | null>(null);

  async function supprimer() {
    if (!(await confirm({ title: titre, message, confirmLabel: 'Supprimer' }))) return;
    setErreur(null);
    try {
      await action();
      refetchAllApis();
      apres();
    } catch (err) {
      setErreur(errorMessage(err));
    }
  }

  return { erreur, supprimer: estAdministrateur(user) ? { onClick: () => void supprimer() } : undefined };
}
