import type { ColonneGrille } from '../../components/DataGrid';
import { formatCurrency, formatPercentValue } from '../../lib/format';
import type { TotauxServeurGrille } from '../../lib/totauxServeur';
import type { DecompteListItemDto, TotauxDecomptesDto } from '../../types/projet';
import { BadgeStatut } from './commun';

// Ordre et libellés de la grille OMRAN, puis les colonnes Arpent. Les colonnes Notes et Facture Code (masquées dans OMRAN) n'y figurent pas.
export const COLONNES_DECOMPTES: ColonneGrille<DecompteListItemDto>[] = [
  { nom: 'numero', libelle: 'O.D.T.', type: 'NOMBRE', largeur: 4 },
  { nom: 'dateDocument', libelle: 'Date', type: 'DATE', largeur: 6 },
  { nom: 'code', libelle: 'Code', largeur: 7 },
  { nom: 'lignesTTC', libelle: 'Ava. TTC', type: 'MONTANT', largeur: 9 },
  {
    nom: 'avaPct',
    libelle: 'Ava. %',
    type: 'NOMBRE',
    largeur: 6,
    rendu: (d) => (d.avaPct === null ? null : formatPercentValue(d.avaPct, 2)),
  },
  { nom: 'depassementTTC', libelle: 'Dépa. TTC', type: 'MONTANT', largeur: 9 },
  { nom: 'travauxSupplementaires', libelle: 'TraSup. TTC', type: 'MONTANT', largeur: 9 },
  { nom: 'approvisionnementAPayer', libelle: 'Appro. TTC', type: 'MONTANT', largeur: 9 },
  { nom: 'fluctuationsAPayer', libelle: 'Fluc. TTC', type: 'MONTANT', largeur: 9 },
  { nom: 'totalTTC', libelle: 'Tot. TTC', type: 'MONTANT', largeur: 9 },
  { nom: 'lotCode', libelle: 'Lot', largeur: 7, valeur: (d) => d.lotCode ?? d.lotDescription, titre: (d) => d.lotDescription ?? undefined },
  { nom: 'projetCode', libelle: 'Projet', largeur: 7 },
  { nom: 'fournisseurNom', libelle: 'Fournisseur', largeur: 12 },
  { nom: 'montantHT', libelle: 'HT', type: 'MONTANT', largeur: 9 },
  { nom: 'retenueGarantie', libelle: 'RG', type: 'MONTANT', largeur: 8 },
  { nom: 'netAPayer', libelle: 'Net', type: 'MONTANT', largeur: 9 },
  {
    nom: 'ecartNetAPayer',
    libelle: 'Écart',
    type: 'MONTANT',
    largeur: 7,
    valeur: (d) => (d.ecartSignificatif ? d.ecartNetAPayer : null),
    rendu: (d) => (d.ecartSignificatif ? <span className="font-semibold text-destructive">{formatCurrency(d.ecartNetAPayer)}</span> : null),
  },
  { nom: 'montantRegle', libelle: 'Réglé', type: 'MONTANT', largeur: 8 },
  { nom: 'resteARegler', libelle: 'Reste', type: 'MONTANT', largeur: 8 },
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
];

const COLONNES_TOTALISEES = COLONNES_DECOMPTES.filter((c) => c.type === 'MONTANT' && c.nom !== 'ecartNetAPayer').map((c) => c.nom);

/** Bande de totaux calculée par le serveur sur tout le filtre : une valeur par colonne, sans menu Σ. */
export function totauxBandeDecomptes(
  totaux: TotauxDecomptesDto | null,
  chargement: boolean,
  erreur: string | null,
  reessayer: () => void,
): TotauxServeurGrille {
  const valeurs: Record<string, number> = totaux ? { ...totaux } : {};
  return {
    jetons: COLONNES_TOTALISEES,
    fonctions: () => [],
    basculer: () => undefined,
    vider: () => undefined,
    nombreTotal: totaux?.nombre ?? null,
    totaux: valeurs,
    chargement,
    erreur,
    reessayer,
  };
}
