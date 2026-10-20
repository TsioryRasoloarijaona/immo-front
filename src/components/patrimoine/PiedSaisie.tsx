import { Check } from 'lucide-react';
import { Button } from '../ui/button';

/** Erreur du serveur sous le formulaire, puis le bouton d'enregistrement. */
export default function PiedSaisie({
  erreur,
  envoi,
  libelle,
  onEnregistrer,
  desactive = false,
}: Readonly<{ erreur: string | null; envoi: boolean; libelle: string; onEnregistrer: () => void; desactive?: boolean }>) {
  return (
    <>
      {erreur && <p role="alert" className="text-body text-destructive">{erreur}</p>}
      <div className="flex items-center justify-end border-t border-border pt-4">
        <Button type="button" onClick={onEnregistrer} disabled={envoi || desactive}>
          <Check data-icon="inline-start" /> {envoi ? 'Enregistrement…' : libelle}
        </Button>
      </div>
    </>
  );
}
