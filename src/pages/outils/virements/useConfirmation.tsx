import { useCallback, useRef, useState, type ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog';

export interface DemandeConfirmation {
  titre: string;
  message: ReactNode;
  confirmer: string;
  annuler?: string;
  /** Bouton rouge pour toute suppression ; la garde de saisie protégée ne l'est pas. */
  danger?: boolean;
}

/** Pas le `useConfirm` global (monté à la racine, jamais rouge) : le nœud rendu se place dans la fenêtre qui
 * demande, pour qu'Échap ne ferme que la fenêtre du dessus. */
export function useConfirmation(): [ReactNode, (d: DemandeConfirmation) => Promise<boolean>] {
  const [demande, setDemande] = useState<DemandeConfirmation | null>(null);
  const resoudre = useRef<((ok: boolean) => void) | null>(null);

  const demander = useCallback((d: DemandeConfirmation) => {
    resoudre.current?.(false);
    setDemande(d);
    return new Promise<boolean>((r) => {
      resoudre.current = r;
    });
  }, []);

  function repondre(ok: boolean) {
    setDemande(null);
    resoudre.current?.(ok);
    resoudre.current = null;
  }

  const noeud = (
    <AlertDialog open={demande !== null} onOpenChange={(ouvert) => !ouvert && repondre(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{demande?.titre}</AlertDialogTitle>
          <AlertDialogDescription>{demande?.message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => repondre(false)}>{demande?.annuler ?? 'Annuler'}</AlertDialogCancel>
          <AlertDialogAction variant={demande?.danger ? 'destructive' : 'default'} onClick={() => repondre(true)}>
            {demande?.confirmer}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return [noeud, demander];
}
