import type { ColonneGrille } from '../../components/DataGrid';
import { PastilleCouleur } from '../../components/configuration/SelecteurCouleur';
import { Badge } from '../../components/ui';
import { toneStatut } from '../../lib/faisabilite';
import { colonneLocale as colonne, type DispositionColonnes } from '../../lib/colonnes';
import { formatPercentValue } from '../../lib/format';
import type { TotauxServeurGrille } from '../../lib/totauxServeur';
import type { ColonneDto } from '../../types';
import type { LotListItemDto, TotauxLotsDto } from '../../types/projet';
import { BarreAvancement } from './commun';

/** Colonnes de la liste « Marchés » d'OMRAN d'abord, puis celles d'Arpent (masquées à l'ouverture). */
export const CATALOGUE_LOTS: ColonneDto[] = [
  colonne('code', 'Code', 'IDENTITE'),
  colonne('description', 'Description', 'IDENTITE'),
  colonne('fournisseurNom', 'Fournisseur', 'IDENTITE'),
  colonne('avancement', 'Avancement', 'SUIVI', 'NOMBRE'),
  colonne('statutCouleur', 'Couleur', 'SUIVI'),
  colonne('coutPrevisionnelHT', 'Coût Prév. HT', 'FINANCIER', 'MONTANT'),
  colonne('coutPrevisionnelTTC', 'Coût Prév. TTC', 'FINANCIER', 'MONTANT'),
  colonne('coutPrevisionnelNetAPayer', 'Coût Prév. Net à payer', 'FINANCIER', 'MONTANT'),
  colonne('coutPrevisionnelRegle', 'Coût Prév. Réglé', 'FINANCIER', 'MONTANT'),
  colonne('coutPrevisionnelReste', 'Coût Prév. Reste', 'FINANCIER', 'MONTANT'),
  colonne('notes', 'Autres Notes', 'IDENTITE'),
  colonne('statutDescription', 'Statut', 'SUIVI'),
  colonne('projetCode', 'Projet', 'IDENTITE'),
  colonne('typeDescription', 'Type', 'IDENTITE'),
  colonne('dateDebut', 'Début', 'DATES', 'DATE'),
  colonne('dateFin', 'Fin', 'DATES', 'DATE'),
  colonne('montantTTC', 'Marché TTC', 'FINANCIER', 'MONTANT'),
  colonne('cumulDecomptesTTC', 'Décomptes TTC', 'FINANCIER', 'MONTANT'),
  colonne('avancementPct', 'Avancement décomptes', 'SUIVI', 'NOMBRE'),
  colonne('cumulRetenueGarantie', 'RG cumulée', 'FINANCIER', 'MONTANT'),
  colonne('totalFacture', 'Facturé', 'FINANCIER', 'MONTANT'),
  colonne('totalRegle', 'Réglé (factures)', 'FINANCIER', 'MONTANT'),
  colonne('resteARegler', 'Reste (factures)', 'FINANCIER', 'MONTANT'),
];

const OUVERTURE = [
  'code', 'description', 'fournisseurNom', 'avancement', 'statutCouleur', 'coutPrevisionnelHT', 'coutPrevisionnelTTC',
  'coutPrevisionnelNetAPayer', 'coutPrevisionnelRegle', 'coutPrevisionnelReste', 'statutDescription',
];

export const DISPOSITION_LOTS: DispositionColonnes = {
  ordre: CATALOGUE_LOTS.map((c) => c.nom),
  poids: { code: 6, description: 16, fournisseurNom: 12, notes: 14, statutCouleur: 4 },
  ouverture: OUVERTURE,
};

const pourcent = (v: unknown) => formatPercentValue(typeof v === 'number' ? v : null);

const RENDUS: Record<string, Partial<ColonneGrille<LotListItemDto>>> = {
  avancement: {
    valeur: (l) => l.avancement * 100,
    rendu: (l) => <BarreAvancement pct={l.avancement * 100} />,
    formatValeur: pourcent,
  },
  avancementPct: { rendu: (l) => <BarreAvancement pct={l.avancementPct} />, formatValeur: pourcent },
  statutCouleur: { rendu: (l) => (l.statutCouleur ? <PastilleCouleur nom={l.statutCouleur} /> : null), sansSomme: true },
  statutDescription: {
    valeur: (l) => l.statutDescription ?? l.statutCode,
    rendu: (l) => {
      const libelle = l.statutDescription ?? l.statutCode;
      return libelle ? <Badge tone={toneStatut(l.statutCouleur)}>{libelle}</Badge> : null;
    },
  },
};

export function grilleLots(colonnes: ColonneDto[]): ColonneGrille<LotListItemDto>[] {
  return colonnes.map((c) => ({
    nom: c.nom,
    libelle: c.libelle,
    type: c.type,
    largeur: DISPOSITION_LOTS.poids[c.nom] ?? 9,
    ...RENDUS[c.nom],
  }));
}

const COLONNES_TOTALISEES = ['coutPrevisionnelHT', 'coutPrevisionnelTTC', 'coutPrevisionnelNetAPayer', 'coutPrevisionnelRegle', 'coutPrevisionnelReste'] as const;

/** Bande de totaux calculée par le serveur sur tout le filtre : une valeur par colonne de coût, sans menu Σ. */
export function totauxBandeLots(
  totaux: TotauxLotsDto | null,
  chargement: boolean,
  erreur: string | null,
  reessayer: () => void,
): TotauxServeurGrille {
  const valeurs: Record<string, number> = totaux ? { ...totaux } : {};
  return {
    jetons: [...COLONNES_TOTALISEES],
    fonctions: () => [],
    basculer: () => undefined,
    vider: () => undefined,
    nombreTotal: totaux?.nombreLots ?? null,
    totaux: valeurs,
    chargement,
    erreur,
    reessayer,
  };
}
