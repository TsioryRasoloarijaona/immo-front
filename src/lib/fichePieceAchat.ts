export type OngletPieceAchat = 'lignes' | 'ventilation' | 'bonsLivraison' | 'factures' | 'reglements' | 'avoirs' | 'historique';

const BON_DE_COMMANDE: OngletPieceAchat[] = ['lignes', 'ventilation', 'bonsLivraison', 'factures', 'reglements', 'historique'];
const FACTURE: OngletPieceAchat[] = ['lignes', 'ventilation', 'historique', 'avoirs'];
const AUTRE: OngletPieceAchat[] = ['lignes', 'ventilation', 'historique'];

/** Onglets du bas de la fiche selon la nature de la pièce (DocType). */
export function ongletsPieceAchat(nature: string | null): OngletPieceAchat[] {
  if (nature === 'ORDER') return BON_DE_COMMANDE;
  if (nature === 'INVOICE') return FACTURE;
  return AUTRE;
}
