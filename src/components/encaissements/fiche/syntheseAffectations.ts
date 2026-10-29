import { encaissementCompteDansLesTotaux } from '../../../lib/domain';
import type { EncaissementDetailDto } from '../../../types';

export default function syntheseAffectations(e: EncaissementDetailDto) {
  const annule = !encaissementCompteDansLesTotaux(e.etat);
  return {
    // Affecté du serveur (brut − restant) : 0 pour un règlement annulé, dont les affectations restent listées.
    affecteCompte: (e.montantBrut ?? 0) - (e.montantBrutRestant ?? 0),
    libelleTotalAffecte: annule ? 'Total affecté (règlement annulé : hors totaux)' : 'Total affecté',
    // Le reçu est un document du dossier : celui de la première affectation.
    dossierRecu: e.affectations?.[0]?.dossierId,
  };
}
