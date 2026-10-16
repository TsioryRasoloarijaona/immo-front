import { useCallback, useState } from 'react';
import { useToast } from './toastContext';
import { errorMessage } from './useApi';

/** Une écriture : bouton occupé pendant l'appel, toast de succès ou message du serveur (400 / 409) en erreur. */
export function useEcriture(): {
  occupe: boolean;
  executer: (action: () => Promise<unknown>, succes?: string) => Promise<boolean>;
} {
  const showToast = useToast();
  const [occupe, setOccupe] = useState(false);

  const executer = useCallback(
    async (action: () => Promise<unknown>, succes?: string) => {
      setOccupe(true);
      try {
        await action();
        if (succes) showToast(succes);
        return true;
      } catch (err) {
        showToast({ texte: errorMessage(err), variante: 'erreur' });
        return false;
      } finally {
        setOccupe(false);
      }
    },
    [showToast],
  );

  return { occupe, executer };
}
