import { extraireSaisie, type DefChamp } from '../../lib/saisiePatrimoine';
import type { TrancheDetailDto, TrancheEcritureDto } from '../../types';

type Def = DefChamp<TrancheEcritureDto>;

export const IDENTITE: Def[] = [
  { nom: 'code', libelle: 'Code', genre: 'texte', requis: true },
  { nom: 'description', libelle: 'Description', genre: 'texte', requis: true },
  { nom: 'descriptionLongue', libelle: 'Description détaillée', genre: 'texteLong' },
  { nom: 'estEnVente', libelle: 'Visible dans le module Vente', genre: 'case' },
  { nom: 'estEnLocation', libelle: 'Visible dans le module Location', genre: 'case' },
];

export const COORDONNEES: Def[] = [
  { nom: 'adresse', libelle: 'Adresse', genre: 'texte', large: true },
  { nom: 'adresse2', libelle: 'Adresse (suite)', genre: 'texte' },
  { nom: 'adresse3', libelle: 'Adresse (complément)', genre: 'texte' },
  { nom: 'codePostal', libelle: 'Code postal', genre: 'texte' },
  { nom: 'ville', libelle: 'Ville', genre: 'texte' },
  { nom: 'telephone', libelle: 'Téléphone', genre: 'texte' },
  { nom: 'mobile', libelle: 'Mobile', genre: 'texte' },
  { nom: 'fax', libelle: 'Fax', genre: 'texte' },
  { nom: 'email', libelle: 'Email', genre: 'texte' },
  { nom: 'siteWeb', libelle: 'Site web', genre: 'texte' },
];

export const DATES: Def[] = [
  { nom: 'dateDebutTravaux', libelle: 'Lancement des travaux', genre: 'date' },
  { nom: 'dateFinTravaux', libelle: 'Fin des travaux', genre: 'date' },
  { nom: 'dateDebutCommercialisation', libelle: 'Début de commercialisation', genre: 'date' },
  { nom: 'dateFinCommercialisation', libelle: 'Fin de commercialisation', genre: 'date' },
  { nom: 'dateOctroiTitresFonciers', libelle: 'Octroi des T.F', genre: 'date' },
  { nom: 'datePermisHabiter', libelle: "Permis d'habiter", genre: 'date' },
  { nom: 'dateReception', libelle: 'Réception', genre: 'date' },
  { nom: 'datePremiereRelance', libelle: '1ère relance', genre: 'date' },
  { nom: 'dateFinConcretisation', libelle: 'Fin des concrétisations', genre: 'date' },
  { nom: 'dateDebutFinalisation', libelle: 'Début des finalisations', genre: 'date' },
];

export const REGLES_1: Def[] = [
  { nom: 'montantPreReservation', libelle: 'Pré-réservation', genre: 'montant' },
  { nom: 'advancePercent', libelle: 'Concrétisation', genre: 'taux' },
  { nom: 'avanceSurMontant', libelle: 'Avance sur un montant fixe', genre: 'case' },
  { nom: 'montantAvance', libelle: "Montant d'avance", genre: 'montant' },
  { nom: 'fraisDossier', libelle: 'Frais de dossier', genre: 'montant' },
  { nom: 'tauxPenaliteAnnulation', libelle: "Pénalité d'annulation", genre: 'taux' },
  { nom: 'penaliteAnnulationSurPrixArticle', libelle: "Pénalité sur le prix de l'article", genre: 'case' },
  { nom: 'penaliteTransfertArticle', libelle: "Pénalité transfert d'article", genre: 'montant' },
  { nom: 'penaliteTransfertTranche', libelle: 'Pénalité transfert de tranche', genre: 'montant' },
  { nom: 'penaliteTransfertClient', libelle: 'Pénalité transfert de client', genre: 'montant' },
  { nom: 'autresFrais', libelle: 'Autres frais', genre: 'montant' },
  { nom: 'montantSyndic', libelle: 'Syndic', genre: 'montant' },
  { nom: 'periodeSyndic', libelle: 'Période du syndic (mois)', genre: 'entier' },
];

export const REGLES_2: Def[] = [
  { nom: 'delaiPremierEngagement', libelle: '1er engagement (jours)', genre: 'entier' },
  { nom: 'delaiDeuxiemeEngagement', libelle: '2ème engagement (jours)', genre: 'entier' },
  { nom: 'tauxPenalitePremierEngagement', libelle: 'Pénalité 1er engagement', genre: 'taux' },
  { nom: 'tauxPenaliteDeuxiemeEngagement', libelle: 'Pénalité 2ème engagement', genre: 'taux' },
  { nom: 'delaiSoldePaiement', libelle: 'Solde du paiement (jours)', genre: 'entier' },
  { nom: 'delaiGarantie', libelle: 'Garantie (jours)', genre: 'entier' },
  { nom: 'delaiGarantieSupplement', libelle: 'Garantie additionnelle (jours)', genre: 'entier' },
  { nom: 'codeDroitRetractation', libelle: 'Code du droit de rétractation', genre: 'texte' },
  { nom: 'tribunalCommerce', libelle: 'Tribunal de commerce', genre: 'texte' },
  { nom: 'delaiMinimumIntervention', libelle: 'Intervention minimum (jours)', genre: 'entier' },
  { nom: 'maxVisitNumber', libelle: 'Visites maximum', genre: 'entier' },
  { nom: 'delaiRetractation', libelle: 'Rétractation (heures)', genre: 'entier' },
  { nom: 'delaiMaxEcheance', libelle: 'Échéance maximum (jours)', genre: 'entier' },
  { nom: 'verifierDelaiMaxEcheance', libelle: "Contrôler l'échéance maximum", genre: 'case' },
  { nom: 'creditPercent', libelle: 'Crédit maximum', genre: 'taux' },
  { nom: 'isWithVerifCredit', libelle: 'Contrôler le crédit maximum', genre: 'case' },
];

export const REMISES: Def[] = [
  { nom: 'montantPreReservationRemise', libelle: 'Pré-réservation', genre: 'montant' },
  { nom: 'advancePercentRemise', libelle: 'Concrétisation', genre: 'taux' },
  { nom: 'advancePercentRemiseActive', libelle: 'Concrétisation anciens clients active', genre: 'case' },
  { nom: 'fraisDossierRemise', libelle: 'Frais de dossier', genre: 'montant' },
  { nom: 'tauxPenaliteAnnulationRemise', libelle: "Pénalité d'annulation", genre: 'taux' },
  { nom: 'penaliteTransfertArticleRemise', libelle: "Pénalité transfert d'article", genre: 'montant' },
  { nom: 'penaliteTransfertTrancheRemise', libelle: 'Pénalité transfert de tranche', genre: 'montant' },
  { nom: 'penaliteTransfertClientRemise', libelle: 'Pénalité transfert de client', genre: 'montant' },
  { nom: 'autresFraisRemise', libelle: 'Autres frais', genre: 'montant' },
  { nom: 'montantSyndicRemise', libelle: 'Syndic', genre: 'montant' },
];

export const AUTRES: Def[] = [
  { nom: 'delaiNotaireMinutes', libelle: 'Délai notaire (minutes)', genre: 'entier' },
  { nom: 'delaiToutSoldeMinutes', libelle: 'Délai tout soldé (minutes)', genre: 'entier' },
  { nom: 'ecartTypeConcretisation', libelle: 'Écart-type concrétisations', genre: 'nombre' },
  { nom: 'ecartTypeFinalisation', libelle: 'Écart-type finalisations', genre: 'nombre' },
];

/** Valeurs initiales d'OMRAN, affichées pour être vues ; le serveur les applique de toute façon. */
export const DEFAUTS_CREATION: TrancheEcritureDto = {
  estEnVente: true,
  estEnLocation: false,
  penaliteAnnulationSurPrixArticle: true,
  delaiPremierEngagement: 60,
  delaiDeuxiemeEngagement: 30,
  delaiRetractation: 48,
  delaiMinimumIntervention: 2,
  maxVisitNumber: 4,
  delaiNotaireMinutes: 60,
  delaiToutSoldeMinutes: 30,
  ecartTypeConcretisation: 5,
  ecartTypeFinalisation: 3,
};

const SAISIS = [IDENTITE, COORDONNEES, DATES, REGLES_1, REGLES_2, REMISES, AUTRES].flat();

export function versEcriture(t: TrancheDetailDto): TrancheEcritureDto {
  return extraireSaisie(t, SAISIS, { projetId: t.projetId, paysId: t.paysId });
}
