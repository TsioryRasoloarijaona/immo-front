import type { ColonneGrille } from '../components/DataGrid';
import type { SoldeFournisseurDto } from '../types/achat';

/** Une ligne de la grille : fournisseur par société, `id` composé pour la sélection. */
export type LigneSoldeFournisseur = SoldeFournisseurDto & { id: string };

export function ligneSolde(s: SoldeFournisseurDto): LigneSoldeFournisseur {
  return { ...s, id: `${s.fournisseurId ?? ''}|${s.societeCode ?? ''}` };
}

export const COLONNES_SOLDES: ColonneGrille<LigneSoldeFournisseur>[] = [
  { nom: 'fournisseurNom', libelle: 'Fournisseur', largeur: 14, classe: 'font-medium text-foreground' },
  { nom: 'societeCode', libelle: 'Société', largeur: 7 },
  { nom: 'nombrePieces', libelle: 'Pièces', type: 'NOMBRE', largeur: 5 },
  { nom: 'montantAPayer', libelle: 'À payer', type: 'MONTANT', largeur: 9 },
  { nom: 'montantRegle', libelle: 'Réglé', type: 'MONTANT', largeur: 9 },
  { nom: 'resteARegler', libelle: 'Reste', type: 'MONTANT', largeur: 9 },
  { nom: 'nombreValideesARegler', libelle: 'Validées à régler', type: 'NOMBRE', largeur: 7 },
  { nom: 'resteValideARegler', libelle: 'Reste validé', type: 'MONTANT', largeur: 9 },
  { nom: 'montantADeduire', libelle: 'À déduire', type: 'MONTANT', largeur: 9 },
];
