import type { ColonneGrille } from '../DataGrid';
import type { TypeColonne } from '../../types';
import type { Ligne, Valeur } from './types';

type Col = ColonneGrille<Ligne>;

const colonne = (type: TypeColonne) => (nom: string, libelle: string, largeur = 10): Col => ({ nom, libelle, type, largeur });

export const texte = colonne('TEXTE');
export const montant = colonne('MONTANT');
export const date = colonne('DATE');
export const pct = colonne('POURCENTAGE');
export const nombre = colonne('NOMBRE');

/** Une ligne par tuple : `noms[k]` nomme la k-ième valeur ; l'identifiant est le rang, sauf colonne `id`. */
export function construire(noms: string[], tuples: Valeur[][]): Ligne[] {
  return tuples.map((valeurs, i) => {
    const ligne: Ligne = { id: String(i + 1) };
    noms.forEach((nom, k) => {
      ligne[nom] = valeurs[k];
    });
    return ligne;
  });
}

/** Décale une date ISO (AAAA-MM-JJ) d'un nombre de jours. */
export const decaler = (iso: string, jours: number): string => new Date(Date.parse(iso) + jours * 86_400_000).toISOString().slice(0, 10);

/** Arrondi à 2 décimales, partout où un montant est calculé. */
export function arrondi(v: number): number {
  return Math.round(v * 100) / 100;
}
