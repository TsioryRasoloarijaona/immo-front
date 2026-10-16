import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, FolderPlus } from 'lucide-react';
import { Button } from '../ui/button';
import { getProspection } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import type { FicheDevisDto } from '../../types';

const AIDE_SANS_PROSPECTION = 'Offre sans prospection : créer le dossier depuis une prospection';

/**
 * « Créer / ouvrir dossier » d'OMRAN : ouvre le dossier issu de l'offre, sinon le formulaire Nouveau dossier
 * prérempli depuis elle (rien n'est créé au clic). Même règle d'accès que « Créer un dossier » de la prospection.
 */
export default function BoutonDossierOffre({ fiche }: Readonly<{ fiche: FicheDevisDto }>) {
  const navigate = useNavigate();
  const { offre, dossierLie } = fiche;

  if (dossierLie) {
    // Dossier de location : pas de fiche dans Arpent, la barre de l'offre le nomme déjà.
    if (!dossierLie.id) return null;
    const dossierId = dossierLie.id;
    return (
      <Button size="sm" onClick={() => void navigate(`/dossiers/${dossierId}`)}>
        <ArrowUpRight data-icon="inline-start" /> Ouvrir le dossier {dossierLie.code ?? ''}
      </Button>
    );
  }

  const prospectionId = offre.prospectionId;
  if (!prospectionId) {
    return (
      <span className="flex flex-col items-end gap-0.5">
        <Button size="sm" disabled title={AIDE_SANS_PROSPECTION}>
          <FolderPlus data-icon="inline-start" /> Créer le dossier
        </Button>
        <span className="text-micro text-muted-foreground">{AIDE_SANS_PROSPECTION}</span>
      </span>
    );
  }
  return <BoutonCreer prospectionId={prospectionId} offreId={offre.id} />;
}

/** Même règle que « Créer un dossier » de la fiche prospection : désactivé si la prospection est archivée. */
function BoutonCreer({ prospectionId, offreId }: Readonly<{ prospectionId: string; offreId: string }>) {
  const navigate = useNavigate();
  const prospection = useApi(() => getProspection(prospectionId), [prospectionId]);
  const fermee = prospection.data?.fermee === true;
  return (
    <Button
      size="sm"
      disabled={fermee}
      title={fermee ? 'Prospection archivée' : undefined}
      onClick={() => void navigate(`/prospections/${prospectionId}/nouveau-dossier?offre=${encodeURIComponent(offreId)}`)}
    >
      <FolderPlus data-icon="inline-start" /> Créer le dossier
    </Button>
  );
}
