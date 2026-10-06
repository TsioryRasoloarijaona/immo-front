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
  /** Bouton rouge : toute suppression (§3). La saisie protégée ne l'est pas. */
  danger?: boolean;
}

/** Confirmation intégrée, propre au module.
 *
 * Pas le `useConfirm` global : son bouton n'est jamais rouge, et il est monté
 * à la racine de l'app. Ici, le nœud rendu se place **dans** la fenêtre qui
 * demande, pour que la pile de dialogues soit imbriquée — Échap ne ferme
 * alors que la fenêtre du dessus. */
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
