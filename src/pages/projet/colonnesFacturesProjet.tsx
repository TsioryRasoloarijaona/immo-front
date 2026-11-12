import type { ColonneGrille } from '../../components/DataGrid';
import { Badge } from '../../components/ui';
import { libelleStatutAchat, tonStatutAchat } from '../../lib/documentsAchat';
import { formatCurrency } from '../../lib/format';
import type { DocumentAchatListItemDto } from '../../types/achat';
import { LienCellule } from './commun';

export const COLONNES_FACTURES: ColonneGrille<DocumentAchatListItemDto>[] = [
  { nom: 'code', libelle: 'Code', largeur: 8, classe: 'font-medium text-foreground' },
  { nom: 'dateDocument', libelle: 'Date', type: 'DATE', largeur: 7 },
  { nom: 'dateEcheance', libelle: 'Échéance', type: 'DATE', largeur: 7 },
  { nom: 'dateAlerte', libelle: 'Alerte', type: 'DATE', largeur: 7 },
  { nom: 'fournisseurNom', libelle: 'Fournisseur', largeur: 12 },
  { nom: 'typeLotLibelle', libelle: 'Type', largeur: 8 },
  { nom: 'categories', libelle: 'Catégorie', largeur: 8 },
  { nom: 'deviseCode', libelle: 'Devise', largeur: 5 },
  { nom: 'projetCode', libelle: 'Projet', largeur: 7 },
  { nom: 'lotCode', libelle: 'Lot', largeur: 6 },
  {
    nom: 'statutDescription',
    libelle: 'Statut',
    largeur: 10,
    valeur: libelleStatutAchat,
    rendu: (d) => <Badge tone={tonStatutAchat(d)}>{libelleStatutAchat(d)}</Badge>,
  },
  { nom: 'montantTTC', libelle: 'TTC', type: 'MONTANT', largeur: 8 },
  { nom: 'montantAPayer', libelle: 'À payer', type: 'MONTANT', largeur: 8 },
  { nom: 'montantRegle', libelle: 'Réglé', type: 'MONTANT', largeur: 8 },
  {
    nom: 'resteARegler',
    libelle: 'Reste',
    type: 'MONTANT',
    largeur: 8,
    rendu: (d) => <span className={d.resteARegler > 0 ? 'font-semibold text-destructive' : undefined}>{formatCurrency(d.resteARegler)}</span>,
  },
  {
    nom: 'decompteCode',
    libelle: 'Décompte',
    largeur: 8,
    rendu: (d) => (d.decompteId ? <LienCellule to={`/projet/decomptes/${d.decompteId}`}>{d.decompteCode ?? '—'}</LienCellule> : '—'),
  },
];

/** Onglet « Factures » d'un lot : le projet, le lot et le fournisseur sont déjà dans l'en-tête de la fiche. */
export const COLONNES_FACTURES_LOT = COLONNES_FACTURES.filter((c) => !['projetCode', 'lotCode', 'fournisseurNom', 'dateEcheance', 'dateAlerte', 'typeLotLibelle', 'categories', 'deviseCode'].includes(c.nom));
