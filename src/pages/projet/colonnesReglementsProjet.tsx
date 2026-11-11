import type { ColonneGrille } from '../../components/DataGrid';
import type { ReglementProjetDto } from '../../types/depensesProjet';
import { LienCellule } from './commun';

export const COLONNES_REGLEMENTS: ColonneGrille<ReglementProjetDto>[] = [
  { nom: 'dateReglement', libelle: 'Date', type: 'DATE', largeur: 7 },
  { nom: 'reglementCode', libelle: 'N° règlement', largeur: 9, classe: 'font-medium text-foreground' },
  { nom: 'typeDescription', libelle: 'Type', largeur: 9, valeur: (r) => r.typeDescription ?? r.typeCode },
  { nom: 'montant', libelle: 'Montant', type: 'MONTANT', largeur: 9, valeurSomme: (r) => (r.annule ? null : r.montant) },
  {
    nom: 'factureCode',
    libelle: 'Facture',
    largeur: 9,
    rendu: (r) => <LienCellule to={`/projet/depenses/factures/${r.factureId}`}>{r.factureCode ?? '—'}</LienCellule>,
  },
  { nom: 'fournisseurNom', libelle: 'Fournisseur', largeur: 12 },
  { nom: 'projetCode', libelle: 'Projet', largeur: 7 },
  { nom: 'lotCode', libelle: 'Lot', largeur: 6 },
  {
    nom: 'decompteCode',
    libelle: 'Décompte',
    largeur: 8,
    rendu: (r) => (r.decompteId ? <LienCellule to={`/projet/decomptes/${r.decompteId}`}>{r.decompteCode ?? '—'}</LienCellule> : '—'),
  },
];

export const COLONNES_REGLEMENTS_LOT = COLONNES_REGLEMENTS.filter((c) => !['projetCode', 'lotCode', 'fournisseurNom'].includes(c.nom));

/** Une ligne de règlement annulé est barrée et hors des sommes. */
export const classeReglement = (r: ReglementProjetDto) => (r.annule ? 'text-muted-foreground line-through' : undefined);
