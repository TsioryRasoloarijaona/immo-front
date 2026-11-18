import type { ColonneGrille } from '../components/DataGrid';
import { moisCourt, type SeriePrevision } from './sousFenetresLot';
import type { DecaissementPrevisionDto, LotPrevisionProjetDto, PointAvancementDto, TotauxNetAPayerDto } from '../types/projet';

/** Les trois séries de l'écran, dans l'ordre OMRAN : clé des totaux / décaissements, série du graphe, libellé. */
export const SERIES_PROJET: { cle: keyof TotauxNetAPayerDto; serie: SeriePrevision; libelle: string }[] = [
  { cle: 'prevision', serie: 'estimation', libelle: 'Prévision' },
  { cle: 'previsionAjustee', serie: 'prevision', libelle: 'Prévision ajustée' },
  { cle: 'reel', serie: 'reel', libelle: 'Réel' },
];

export const LIBELLES_GRAPHE: Record<SeriePrevision, string> = { estimation: 'Prévision', prevision: 'Prévision ajustée', reel: 'Réel' };

export type LigneLotPrevision = LotPrevisionProjetDto & { id: string };
export type LigneDecaissement = DecaissementPrevisionDto & { id: string };
export type LigneAvancement = PointAvancementDto & { id: string };

const montant = (nom: keyof LotPrevisionProjetDto, libelle: string): ColonneGrille<LigneLotPrevision> => ({ nom, libelle, type: 'MONTANT', largeur: 8 });

export const COLONNES_LOTS: ColonneGrille<LigneLotPrevision>[] = [
  { nom: 'code', libelle: 'Code', largeur: 6, classe: 'font-medium text-foreground' },
  { nom: 'description', libelle: 'Description', largeur: 14 },
  { nom: 'fournisseur', libelle: 'Fournisseur', largeur: 10 },
  { nom: 'multiFournisseur', libelle: 'Multi-fournisseur', type: 'BOOLEEN', largeur: 4 },
  { nom: 'cloture', libelle: 'Clôturé', type: 'BOOLEEN', largeur: 4 },
  { nom: 'resilie', libelle: 'Résilié', type: 'BOOLEEN', largeur: 4 },
  montant('previsionNetAPayer', 'Prévision net à payer'),
  montant('previsionNetAPayerCalculee', 'Prévision calculée'),
  montant('previsionNetAPayerDifference', 'Écart prévision'),
  montant('coutPrevisionnelNetAPayer', 'Coût prévisionnel net à payer'),
  montant('coutPrevisionnelNetAPayerCalcule', 'Coût prévisionnel calculé'),
  montant('coutPrevisionnelNetAPayerDifference', 'Écart coût prévisionnel'),
  montant('positionNetAPayer', 'Position net à payer'),
  montant('positionNetAPayerCalculee', 'Position calculée'),
  montant('positionNetAPayerDifference', 'Écart position'),
  { nom: 'notes', libelle: 'Notes', largeur: 12 },
];

const libelleNature = (r: LigneDecaissement) => (r.nature === 'REEL' ? 'Réel' : 'Prévision');

export function colonnesDecaissement(avecNature: boolean): ColonneGrille<LigneDecaissement>[] {
  return [
    { nom: 'date', libelle: 'Date', type: 'DATE', largeur: 5 },
    { nom: 'lot', libelle: 'Lot', largeur: 10 },
    { nom: 'description', libelle: 'Description', largeur: 14 },
    ...(avecNature ? [{ nom: 'nature', libelle: 'Nature', largeur: 5, valeur: libelleNature, rendu: libelleNature }] : []),
    { nom: 'montant', libelle: 'Montant', type: 'MONTANT', largeur: 8 },
  ];
}

export const COLONNES_AVANCEMENT: ColonneGrille<LigneAvancement>[] = [
  { nom: 'mois', libelle: 'Mois', largeur: 5, rendu: (r) => moisCourt(r.mois) },
  { nom: 'avancement', libelle: 'Avancement', type: 'POURCENTAGE', largeur: 6, sansSomme: true },
];
