import { useCallback } from 'react';
import { useConfirm } from '../../../lib/confirmContext';
import { useToast } from '../../../lib/toastContext';

/** Action sans effet : confirmation éventuelle, puis le toast qui rappelle que l'écran est une maquette. */
export function useActionMaquette(): (confirmation?: string) => void {
  const confirmer = useConfirm();
  const afficher = useToast();
  return useCallback(
    (confirmation) => {
      if (!confirmation) {
        afficher('Maquette : action non branchée');
        return;
      }
      void confirmer({ title: 'Confirmer', message: confirmation }).then((ok) => {
        if (ok) afficher('Maquette : action non branchée');
      });
    },
    [confirmer, afficher],
  );
}
