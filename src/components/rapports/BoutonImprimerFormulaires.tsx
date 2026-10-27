import { useState } from 'react';
import { Loader2, Printer } from 'lucide-react';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { ouvrirFormulairesBarid } from '../../lib/apiFormulairesBarid';
import type { ValeursRapport } from '../../lib/apiRapports';

/** Ouvre le PDF des formulaires Barid Al-Maghrib avec les filtres actifs ; l'erreur du serveur reste sous le bouton. */
export default function BoutonImprimerFormulaires({ valeurs, vide }: Readonly<{ valeurs: ValeursRapport; vide: boolean }>) {
  const [attente, setAttente] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function imprimer() {
    if (vide || attente) return;
    setAttente(true);
    setErreur(null);
    try {
      await ouvrirFormulairesBarid(valeurs);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Échec de l'impression.");
    } finally {
      setAttente(false);
    }
  }

  const bloque = vide || attente;
  const bouton = (
    <Button type="button" size="sm" aria-disabled={bloque} className={bloque ? 'opacity-50' : undefined} onClick={() => void imprimer()}>
      {attente ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Printer data-icon="inline-start" />}
      {attente ? 'Génération…' : 'Imprimer les formulaires (PDF)'}
    </Button>
  );

  return (
    <div className="flex flex-col items-start gap-1.5">
      {vide ? (
        <Tooltip>
          <TooltipTrigger render={bouton} />
          <TooltipContent>Aucune page à imprimer</TooltipContent>
        </Tooltip>
      ) : (
        bouton
      )}
      {erreur && (
        <p role="alert" className="text-body text-destructive">
          {erreur}
        </p>
      )}
    </div>
  );
}
