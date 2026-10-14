import { BellDot, TriangleAlert } from 'lucide-react';
import type { DossierFicheDto } from '../../types';

/**
 * Bandeau « Ce dossier possède des pièces de règlement impayées » (OMRAN, à l'ouverture de la fiche)
 * et rappel d'instruction non lue pour son destinataire.
 */
export default function BandeauxDossier({ fiche }: Readonly<{ fiche: DossierFicheDto | null }>) {
  if (!fiche || (!fiche.aDesImpayes && !fiche.instructionNonLue)) return null;
  return (
    <div className="flex flex-col gap-1.5">
      {fiche.aDesImpayes && (
        <p role="alert" className="flex items-center gap-2 rounded-lg border border-(--warning-border) bg-(--warning-bg) px-3 py-1.5 text-body text-(--warning)">
          <TriangleAlert aria-hidden className="size-4 shrink-0" />
          Attention : ce dossier possède des pièces de règlement impayées.
        </p>
      )}
      {fiche.instructionNonLue && (
        <p role="status" className="flex items-center gap-2 rounded-lg border border-(--info-border) bg-(--info-bg) px-3 py-1.5 text-body text-(--info)">
          <BellDot aria-hidden className="size-4 shrink-0" />
          Une instruction vous attend dans l'onglet « Actions ».
        </p>
      )}
    </div>
  );
}
