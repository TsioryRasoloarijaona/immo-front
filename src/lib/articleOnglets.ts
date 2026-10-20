import type { BadgeTone } from '../types';
import type { OrigineDossier, ResultatAttachement } from '../types/articleOnglets';

const OCTETS_PAR_LOT = 40 * 1024 * 1024;
const FICHIERS_PAR_LOT = 100;

export const LIBELLE_ORIGINE: Record<OrigineDossier, string> = { VENTE: 'Vente', LOCATION: 'Location', SYNDIC: 'Syndic' };

export const RESULTAT_ATTACHEMENT: Record<ResultatAttachement, { libelle: string; ton: BadgeTone }> = {
  ATTACHE: { libelle: 'Attaché', ton: 'success' },
  REMPLACE: { libelle: 'Remplacé', ton: 'info' },
  CODE_INTROUVABLE: { libelle: 'Code introuvable', ton: 'amber' },
  REFUSE: { libelle: 'Refusé', ton: 'warning' },
};

/** Lots sous la limite de requête du serveur (50 Mo) ; un fichier trop gros part seul et reçoit le refus du serveur. */
export function decouperEnLots(fichiers: readonly File[]): File[][] {
  const lots: File[][] = [];
  let octets = 0;
  for (const f of fichiers) {
    const courant = lots.at(-1);
    if (courant && courant.length < FICHIERS_PAR_LOT && octets + f.size <= OCTETS_PAR_LOT) {
      courant.push(f);
      octets += f.size;
    } else {
      lots.push([f]);
      octets = f.size;
    }
  }
  return lots;
}
