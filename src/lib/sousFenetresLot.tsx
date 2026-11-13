import type { ColonneGrille } from '../components/DataGrid';
import { PastilleCouleur } from '../components/configuration/SelecteurCouleur';
import { BadgeStatut } from '../pages/projet/commun';
import type {
  AvanceLotDto,
  AvenantLotDto,
  AvoirLotDto,
  EcheanceRgLotDto,
  GroupeBordereauDto,
  LigneBordereauDto,
  PointPrevisionDto,
  ReceptionLotDto,
} from '../types/projet';
import { formatPercent, formatPercentValue } from './format';

export type SousFenetre = 'previsions' | 'avances' | 'bordereau' | 'avenants' | 'remboursements' | 'avoirs';

export const TITRES_SOUS_FENETRES: Record<SousFenetre, string> = {
  previsions: 'Prévisions',
  avances: 'Avances',
  bordereau: 'Bordereau estimatif',
  avenants: 'Avenants',
  remboursements: 'Remboursements',
  avoirs: 'Avoirs',
};

function statutRendu(libelle: string | null, couleur: string | null) {
  return (
    <span className="inline-flex items-center gap-1">
      {couleur && <PastilleCouleur nom={couleur} />}
      <BadgeStatut libelle={libelle} />
    </span>
  );
}

const MONTANT = 'whitespace-nowrap';

export const COLONNES_AVANCES: ColonneGrille<AvanceLotDto>[] = [
  { nom: 'code', libelle: 'Code', largeur: 8 },
  {
    nom: 'statutDescription',
    libelle: 'Statut',
    largeur: 10,
    rendu: (r) => statutRendu(r.statutDescription, r.statutCouleur),
  },
  { nom: 'date', libelle: 'Date', type: 'DATE', largeur: 7 },
  { nom: 'netAPayer', libelle: 'Net à payer', type: 'MONTANT', largeur: 9, classe: MONTANT },
  { nom: 'regle', libelle: 'Réglé', type: 'MONTANT', largeur: 9, classe: MONTANT },
  { nom: 'reste', libelle: 'Reste', type: 'MONTANT', largeur: 9, classe: MONTANT },
  { nom: 'deviseCode', libelle: 'Devise', largeur: 5 },
  { nom: 'notes', libelle: 'Notes', largeur: 16 },
];

export const COLONNES_AVOIRS: ColonneGrille<AvoirLotDto>[] = [
  { nom: 'date', libelle: 'Date', type: 'DATE', largeur: 7 },
  { nom: 'code', libelle: 'Code', largeur: 8 },
  {
    nom: 'statutDescription',
    libelle: 'Statut',
    largeur: 10,
    rendu: (r) => statutRendu(r.statutDescription, r.statutCouleur),
  },
  { nom: 'personneAContacter', libelle: 'Personne à contacter', largeur: 14 },
  { nom: 'montantHT', libelle: 'Montant HT', type: 'MONTANT', largeur: 9, classe: MONTANT },
  { nom: 'montantTVA', libelle: 'TVA', type: 'MONTANT', largeur: 9, classe: MONTANT },
  { nom: 'montantTTC', libelle: 'TTC', type: 'MONTANT', largeur: 9, classe: MONTANT },
  { nom: 'referenceBureauOrdre', libelle: 'Réf. bureau d’ordre', largeur: 10 },
];

export const COLONNES_AVENANTS: ColonneGrille<AvenantLotDto>[] = [
  { nom: 'date', libelle: 'Date', type: 'DATE', largeur: 7 },
  { nom: 'code', libelle: 'Code', largeur: 8 },
  { nom: 'description', libelle: 'Description', largeur: 20 },
  { nom: 'montantHT', libelle: 'HT', type: 'MONTANT', largeur: 9, classe: MONTANT },
  { nom: 'montantTVA', libelle: 'TVA', type: 'MONTANT', largeur: 9, classe: MONTANT },
  { nom: 'montantTTC', libelle: 'TTC', type: 'MONTANT', largeur: 9, classe: MONTANT },
  { nom: 'netAPayer', libelle: 'Net à payer', type: 'MONTANT', largeur: 9, classe: MONTANT },
  { nom: 'factureCode', libelle: 'Code facture', largeur: 10 },
];

export const COLONNES_ECHEANCES_RG: ColonneGrille<EcheanceRgLotDto>[] = [
  { nom: 'description', libelle: 'Description', largeur: 20 },
  { nom: 'delaiJours', libelle: 'Délai (j)', type: 'NOMBRE', largeur: 6 },
  { nom: 'echeance', libelle: 'Échéance', type: 'DATE', largeur: 8 },
  {
    nom: 'pourcentage',
    libelle: '% de remboursement',
    type: 'NOMBRE',
    largeur: 8,
    rendu: (r) => formatPercentValue(r.pourcentage),
  },
];

export const COLONNES_RECEPTIONS_RG: ColonneGrille<ReceptionLotDto>[] = [
  { nom: 'code', libelle: 'Code', largeur: 8 },
  { nom: 'dateReception', libelle: 'Date réception', type: 'DATE', largeur: 8 },
  { nom: 'demandeeParFournisseur', libelle: 'Demandée par le fournisseur', type: 'BOOLEEN', largeur: 10 },
  { nom: 'lieu', libelle: 'Lieu', largeur: 14 },
];

export const COLONNES_BORDEREAU_LIGNES: ColonneGrille<LigneBordereauDto>[] = [
  { nom: 'ordre', libelle: 'Ordre', type: 'NOMBRE', largeur: 4 },
  { nom: 'code', libelle: 'Code', largeur: 6 },
  { nom: 'designation', libelle: 'Désignation', largeur: 20 },
  { nom: 'unite', libelle: 'Unité', largeur: 4 },
  { nom: 'quantite', libelle: 'Qté', type: 'NOMBRE', largeur: 6 },
  { nom: 'prixUnitaireHT', libelle: 'PU HT', type: 'MONTANT', largeur: 9, classe: MONTANT },
  { nom: 'tauxTVA', libelle: 'TVA %', type: 'NOMBRE', largeur: 4 },
  { nom: 'ponderation', libelle: 'Pondération', type: 'NOMBRE', largeur: 6 },
  { nom: 'totalHT', libelle: 'Total HT', type: 'MONTANT', largeur: 9, classe: MONTANT },
  { nom: 'totalTTC', libelle: 'Total TTC', type: 'MONTANT', largeur: 9, classe: MONTANT },
];

export type LignePrevision = PointPrevisionDto & { id: string };

export const COLONNES_PREVISIONS: ColonneGrille<LignePrevision>[] = [
  { nom: 'mois', libelle: 'Mois', rendu: (r) => moisCourt(r.mois) },
  { nom: 'estimation', libelle: 'Estimation de base', type: 'MONTANT', classe: MONTANT },
  { nom: 'avancementEstimation', libelle: 'Avancement estimé', type: 'NOMBRE', rendu: (r) => avancement(r.avancementEstimation) },
  { nom: 'prevision', libelle: 'Prévision', type: 'MONTANT', classe: MONTANT },
  { nom: 'avancementPrevision', libelle: 'Avancement prévu', type: 'NOMBRE', rendu: (r) => avancement(r.avancementPrevision) },
  { nom: 'reel', libelle: 'Réel', type: 'MONTANT', classe: MONTANT },
  { nom: 'avancementReel', libelle: 'Avancement réel', type: 'NOMBRE', rendu: (r) => avancement(r.avancementReel) },
];

function avancement(ratio: number | null): string {
  return ratio === null ? '—' : formatPercent(ratio);
}

/** « 03/2026 » à partir du premier jour du mois (ISO). */
export function moisCourt(iso: string): string {
  return `${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

/** Identifiants du groupe et de tous ses descendants. */
export function idsGroupeEtDescendants(groupes: Pick<GroupeBordereauDto, 'id' | 'parentId'>[], racine: string): Set<string> {
  const ids = new Set<string>([racine]);
  let ajoute = true;
  while (ajoute) {
    ajoute = false;
    for (const g of groupes) {
      if (g.parentId && ids.has(g.parentId) && !ids.has(g.id)) {
        ids.add(g.id);
        ajoute = true;
      }
    }
  }
  return ids;
}
