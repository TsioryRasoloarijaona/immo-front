import type { ColonneGrille } from '../../components/DataGrid';
import type { DecompteListItemDto } from '../../types';
import { BadgeStatutFacture } from './chantierUi';

type ColDecompte = ColonneGrille<DecompteListItemDto>;

const COL_CODE: ColDecompte = { nom: 'code', libelle: 'Code', largeur: 8, classe: 'text-muted-foreground' };
const COL_NUMERO: ColDecompte = { nom: 'numero', libelle: 'N°', type: 'NOMBRE', largeur: 4, sansSomme: true, classe: 'text-muted-foreground' };
const COL_DATE: ColDecompte = { nom: 'dateDocument', libelle: 'Date', type: 'DATE', largeur: 7, classe: 'text-muted-foreground' };

const COLS_MONTANTS: ColDecompte[] = [
  { nom: 'montantHT', libelle: 'HT', type: 'MONTANT', largeur: 11, classe: 'text-muted-foreground' },
  { nom: 'montantTTC', libelle: 'TTC', type: 'MONTANT', largeur: 11, classe: 'text-foreground' },
  { nom: 'travauxSupplementaires', libelle: 'Trav. suppl.', type: 'MONTANT', largeur: 11, classe: 'text-muted-foreground' },
  { nom: 'retenueGarantie', libelle: 'RG', type: 'MONTANT', largeur: 10, classe: 'text-muted-foreground' },
  { nom: 'netAPayer', libelle: 'Net à payer', type: 'MONTANT', largeur: 11, classe: 'font-medium text-foreground' },
];

const COLS_PAIEMENT: ColDecompte[] = [
  {
    nom: 'factureCode',
    libelle: 'Facture',
    largeur: 14,
    // Tri et filtre sur « code statut », ce que la cellule affiche.
    valeur: (r) => (r.factureCode ? `${r.factureCode} ${r.factureStatutDescription ?? ''}` : null),
    rendu: (r) =>
      r.factureCode ? (
        <span className="flex items-center gap-1.5">
          <span className="text-muted-foreground">{r.factureCode}</span>
          <BadgeStatutFacture libelle={r.factureStatutDescription} />
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  { nom: 'montantRegle', libelle: 'Réglé', type: 'MONTANT', largeur: 11, classe: 'text-(--success)' },
  { nom: 'resteARegler', libelle: 'Reste', type: 'MONTANT', largeur: 11, classe: 'text-destructive' },
];

/** Onglet « Décomptes » d'un lot : le lot est implicite. */
export const COLONNES_DECOMPTES_LOT: ColDecompte[] = [
  COL_NUMERO,
  COL_CODE,
  COL_DATE,
  ...COLS_MONTANTS,
  { nom: 'cumulNetRetenueGarantie', libelle: 'Cumul net RG', type: 'MONTANT', largeur: 11, sansSomme: true, classe: 'text-muted-foreground' },
  ...COLS_PAIEMENT,
];

/** Liste globale : projet, lot et fournisseur en plus. */
export const COLONNES_DECOMPTES_GLOBAL: ColDecompte[] = [
  COL_CODE,
  COL_NUMERO,
  COL_DATE,
  { nom: 'projetCode', libelle: 'Projet', largeur: 8, classe: 'text-muted-foreground' },
  { nom: 'lotCode', libelle: 'Lot', largeur: 8, classe: 'text-muted-foreground', titre: (r) => r.lotDescription ?? undefined },
  { nom: 'fournisseurNom', libelle: 'Fournisseur', largeur: 14, classe: 'text-muted-foreground', titre: (r) => r.fournisseurNom ?? undefined },
  ...COLS_MONTANTS,
  ...COLS_PAIEMENT,
];
