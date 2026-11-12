import type { GenreLot } from '../types/projet';

/** Genres de marché, dans l'ordre des boutons de création d'OMRAN. */
export const GENRES_LOT: { genre: GenreLot; libelle: string; creation: string }[] = [
  { genre: 'ENTREPRENEURS', libelle: 'Entrepreneurs', creation: 'Ajouter un lot entrepreneur' },
  { genre: 'FOURNISSEURS', libelle: 'Fournisseurs', creation: 'Ajouter un lot fournisseurs' },
  { genre: 'ADMINISTRATION', libelle: 'Administration', creation: 'Ajouter un lot administration' },
  { genre: 'MAITRES_OEUVRE', libelle: "Maîtres d'œuvre", creation: "Ajouter un lot maîtres d'œuvre" },
  { genre: 'CONCESSIONNAIRES', libelle: 'Concessionnaires', creation: 'Ajouter un lot concessionnaires' },
];

/** Droit « nouveau » : Entrepreneurs seul ; les quatre autres genres partagent le droit multi-fournisseurs. */
export type DroitLot = 'entrepreneurs' | 'multi' | 'supprimer' | 'transition';

export function droitCreation(genre: GenreLot): DroitLot {
  return genre === 'ENTREPRENEURS' ? 'entrepreneurs' : 'multi';
}

export function libelleGenre(genre: GenreLot | null | undefined): string {
  return GENRES_LOT.find((g) => g.genre === genre)?.libelle ?? 'Autres';
}

export const MESSAGE_SANS_DROIT = "Vous n'avez pas le droit d'effectuer cette action.";
