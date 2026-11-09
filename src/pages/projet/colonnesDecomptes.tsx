import type { ColonneGrille } from '../../components/DataGrid';
import { formatCurrency } from '../../lib/format';
import type { DecompteListItemDto } from '../../types/projet';
import { BadgeStatut } from './commun';

export const COLONNES_DECOMPTES: ColonneGrille<DecompteListItemDto>[] = [
  { nom: 'code', libelle: 'Code', largeur: 7 },
  { nom: 'numero', libelle: 'N°', type: 'NOMBRE', largeur: 3 },
  { nom: 'dateDocument', libelle: 'Date', type: 'DATE', largeur: 6 },
  { nom: 'projetCode', libelle: 'Projet', largeur: 7 },
  { nom: 'lotCode', libelle: 'Lot', largeur: 7, valeur: (d) => d.lotCode ?? d.lotDescription, titre: (d) => d.lotDescription ?? undefined },
  { nom: 'fournisseurNom', libelle: 'Fournisseur', largeur: 12 },
  { nom: 'montantHT', libelle: 'HT', type: 'MONTANT', largeur: 9 },
  { nom: 'montantTTC', libelle: 'TTC', type: 'MONTANT', largeur: 9 },
  { nom: 'travauxSupplementaires', libelle: 'Extras', type: 'MONTANT', largeur: 8 },
  { nom: 'retenueGarantie', libelle: 'RG', type: 'MONTANT', largeur: 8 },
  { nom: 'netAPayer', libelle: 'Net à payer', type: 'MONTANT', largeur: 9 },
  {
    nom: 'ecartNetAPayer',
    libelle: 'Écart',
    type: 'MONTANT',
    largeur: 7,
    valeur: (d) => (d.ecartSignificatif ? d.ecartNetAPayer : null),
    rendu: (d) => (d.ecartSignificatif ? <span className="font-semibold text-destructive">{formatCurrency(d.ecartNetAPayer)}</span> : null),
  },
  {
    nom: 'factureCode',
    libelle: 'Facture',
    largeur: 10,
    rendu: (d) =>
      d.factureCode ? (
        <span className="flex items-center gap-1.5">
          {d.factureCode}
          <BadgeStatut libelle={d.factureStatutDescription ?? d.factureStatutCode} />
        </span>
      ) : null,
  },
  { nom: 'montantRegle', libelle: 'Réglé', type: 'MONTANT', largeur: 8 },
  { nom: 'resteARegler', libelle: 'Reste', type: 'MONTANT', largeur: 8 },
];
