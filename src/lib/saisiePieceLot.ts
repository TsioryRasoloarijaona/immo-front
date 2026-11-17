import { useState } from 'react';
import type { NaturePieceLot, PieceLotDetailDto, PieceLotModeleDto, PieceLotSaisieDto } from '../types/projet';
import { getModelePieceLot } from './apiProjet';
import { errorMessage } from './useApi';

export const TITRES_PIECE_LOT: Record<NaturePieceLot, string> = {
  MARKET_ADVANCE: 'Avance sur marché',
  WORKINGOUT_ADVANCE: 'Avance sur décompte',
  MARKET_WARRANTY: 'Remboursement de retenue de garantie',
  MARKET_PROPORTION: 'Remboursement du compte prorata',
};

export interface EtatPieceLot {
  date: string;
  echeance: string;
  montantTTC: string;
  penaliteRg: string;
  notes: string;
}

/** Pièce ouverte dans la fiche : `modele` renseigné à la création, `id` à la consultation. */
export interface PieceOuverte {
  nature: NaturePieceLot;
  id: string | null;
  modele: PieceLotModeleDto | null;
}

export function etatDepuis(source: PieceLotModeleDto | PieceLotDetailDto): EtatPieceLot {
  const penalite = 'penaliteRg' in source ? source.penaliteRg : null;
  return {
    date: source.date ?? '',
    echeance: source.echeance ?? '',
    montantTTC: source.montantTTC === null ? '' : String(source.montantTTC),
    penaliteRg: penalite === null ? '' : String(penalite),
    notes: source.notes ?? '',
  };
}

function nombreOuNull(texte: string): number | null {
  const valeur = texte.trim().replace(',', '.');
  return valeur === '' ? null : Number(valeur);
}

/** Message d'erreur de saisie, ou null si la pièce peut partir. */
export function validerPiece(etat: EtatPieceLot): string | null {
  if (!etat.date) return 'La date est obligatoire.';
  const montant = nombreOuNull(etat.montantTTC);
  if (montant === null || Number.isNaN(montant)) return 'Le montant TTC est obligatoire.';
  if (Number.isNaN(nombreOuNull(etat.penaliteRg))) return 'La pénalité est invalide.';
  return null;
}

/** La nature n'est envoyée qu'à la création ; la pénalité suit la nature de la pièce dans les deux cas. */
export function versSaisie(etat: EtatPieceLot, nature: NaturePieceLot, creation: boolean): PieceLotSaisieDto {
  const penalite = nature === 'MARKET_WARRANTY' ? nombreOuNull(etat.penaliteRg) : null;
  return {
    nature: creation ? nature : null,
    date: etat.date || null,
    echeance: etat.echeance || null,
    montantTTC: nombreOuNull(etat.montantTTC),
    notes: etat.notes || null,
    penaliteRg: penalite,
  };
}

/** Création : le modèle est lu avant d'ouvrir la fiche, un refus (409) reste affiché dans la liste. */
export function useOuverturePiece(lotId: string) {
  const [ouvert, setOuvert] = useState<PieceOuverte | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function ajouter(nature: NaturePieceLot) {
    setErreur(null);
    try {
      setOuvert({ nature, id: null, modele: await getModelePieceLot(lotId, nature) });
    } catch (err: unknown) {
      setErreur(errorMessage(err));
    }
  }

  return {
    ouvert,
    erreur,
    ajouter,
    consulter: (nature: NaturePieceLot, id: string) => setOuvert({ nature, id, modele: null }),
    fermer: () => setOuvert(null),
  };
}
