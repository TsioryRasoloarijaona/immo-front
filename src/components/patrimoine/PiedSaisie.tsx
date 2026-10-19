import { Check } from 'lucide-react';
import { Button } from '../ui/button';

/** Erreur du serveur sous le formulaire, puis le bouton d'enregistrement. */
export default function PiedSaisie({
  erreur,
  envoi,
  libelle,
  onEnregistrer,
}: Readonly<{ erreur: string | null; envoi: boolean; libelle: string; onEnregistrer: () => void }>) {
  return (
    <>
      {erreur && <p role="alert" className="text-body text-destructive">{erreur}</p>}
      <div className="flex items-center justify-end border-t border-border pt-4">
        <Button type="button" onClick={onEnregistrer} disabled={envoi}>
          <Check data-icon="inline-start" /> {envoi ? 'Enregistrement…' : libelle}
        </Button>
      </div>
    </>
  );
}
