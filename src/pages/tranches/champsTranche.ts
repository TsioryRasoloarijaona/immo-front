import { extraireSaisie, type DefChamp } from '../../lib/saisiePatrimoine';
import type { TrancheDetailDto, TrancheEcritureDto } from '../../types';

type Def = DefChamp<TrancheEcritureDto>;

/* Une définition par champ, partagée par le formulaire et la fiche : sections calquées sur les onglets de la fiche
   OMRAN (Tranche.cs). Une référence (`genre: 'reference'`) se lit en fiche par son libellé (`lu`). */

export const GENERAL: Def[] = [
  { nom: 'code', libelle: 'Code', genre: 'texte', requis: true },
  { nom: 'description', libelle: 'Description', genre: 'texte', requis: true },
  { nom: 'standingId', libelle: 'Standing', genre: 'reference', lu: 'standingLibelle' },
  { nom: 'niveauTerrainId', libelle: 'Nbr. étage', genre: 'reference', lu: 'niveauTerrainLibelle' },
  { nom: 'rubriqueId', libelle: 'Rubrique', genre: 'reference', lu: 'rubriqueLibelle' },
  { nom: 'responsableSavId', libelle: 'Responsable SAV', genre: 'reference', lu: 'responsableSavLibelle' },
];

export const VISIBILITE: Def[] = [
  { nom: 'estEnVente', libelle: 'Visible dans le module Vente', genre: 'case' },
  { nom: 'estEnLocation', libelle: 'Visible dans le module Location', genre: 'case' },
  { nom: 'visibleProjet', libelle: 'Visible dans le module Projet', genre: 'case' },
  { nom: 'visibleAchat', libelle: 'Visible dans le module Achat', genre: 'case' },
  { nom: 'visibleSav', libelle: 'Visible dans le module SAV', genre: 'case' },
  { nom: 'visiblePrm', libelle: 'Visible dans le module Gestion immobilière', genre: 'case' },
  { nom: 'visibleRom', libelle: 'Visible dans le module Location-vente', genre: 'case' },
];

export const DATES: Def[] = [
  { nom: 'dateDebutTravaux', libelle: 'Lancement des travaux', genre: 'date' },
  { nom: 'dateFinTravaux', libelle: 'Fin des travaux', genre: 'date' },
  { nom: 'dateOctroiTitresFonciers', libelle: 'Octroi des T.F', genre: 'date' },
  { nom: 'datePermisHabiter', libelle: "Permis d'habiter", genre: 'date' },
  { nom: 'datePremiereRelance', libelle: '1ère relance', genre: 'date' },
  { nom: 'dateDebutCommercialisation', libelle: 'Début de commercialisation', genre: 'date' },
  { nom: 'dateFinConcretisation', libelle: 'Fin des concrétisations', genre: 'date' },
  { nom: 'dateDebutFinalisation', libelle: 'Début des finalisations', genre: 'date' },
  { nom: 'dateFinCommercialisation', libelle: 'Fin de commercialisation', genre: 'date' },
  { nom: 'dateReception', libelle: 'Réception', genre: 'date' },
];

export const COORDONNEES: Def[] = [
  { nom: 'adresse', libelle: 'Adresse', genre: 'texte', large: true },
  { nom: 'adresse2', libelle: 'Adresse (suite)', genre: 'texte' },
  { nom: 'adresse3', libelle: 'Adresse (complément)', genre: 'texte' },
  { nom: 'codePostal', libelle: 'Code postal', genre: 'texte' },
  { nom: 'ville', libelle: 'Ville', genre: 'texte' },
  { nom: 'paysId', libelle: 'Pays', genre: 'reference', lu: 'paysLibelle' },
  { nom: 'telephone', libelle: 'Téléphone', genre: 'texte' },
  { nom: 'mobile', libelle: 'Mobile', genre: 'texte' },
  { nom: 'fax', libelle: 'Fax', genre: 'texte' },
  { nom: 'email', libelle: 'Email', genre: 'texte' },
  { nom: 'siteWeb', libelle: 'Site web', genre: 'texte' },
  { nom: 'adresseSav', libelle: 'Adresse S.A.V', genre: 'texte', large: true },
];

export const FONCIER: Def[] = [
  { nom: 'dateMainLeveeAfh', libelle: 'Main levée AFH', genre: 'date' },
  { nom: 'dateCertificatDefinitif1', libelle: 'Certificat définitif 1', genre: 'date' },
  { nom: 'dateMainLeveeBancaire', libelle: 'Main levée bancaire', genre: 'date' },
  { nom: 'dateCertificatDefinitif2', libelle: 'Certificat définitif 2', genre: 'date' },
  { nom: 'dateDepotLotissementMunicipalite', libelle: 'Dépôt du lotissement à la municipalité', genre: 'date' },
  { nom: 'dateRetraitLotissementMunicipalite', libelle: 'Retrait du lotissement de la municipalité', genre: 'date' },
  { nom: 'dateDepotLotissementNonApprouveOtc', libelle: "Dépôt du lotissement non approuvé à l'OTC", genre: 'date' },
  { nom: 'dateReglementFraisOtc', libelle: "Règlement des frais de l'OTC", genre: 'date' },
  { nom: 'dateDepotLotissementApprouveOtc', libelle: "Dépôt du lotissement approuvé à l'OTC", genre: 'date' },
  { nom: 'dateRetraitPlansMutationOtc', libelle: "Retrait des plans de mutation de l'OTC", genre: 'date' },
  { nom: 'dateAchevementPartages', libelle: 'Achèvement des partages', genre: 'date' },
  { nom: 'dateDepotPartageCpf', libelle: 'Dépôt du dossier de partage à la CPF', genre: 'date' },
  { nom: 'datePaiementFraisPartageCpf', libelle: 'Paiement des frais de partage CPF', genre: 'date' },
  { nom: 'dateRetraitPartageCpf', libelle: 'Retrait du dossier de partage à la CPF', genre: 'date' },
  { nom: 'dateRetraitCertificatsIndividuels', libelle: 'Retrait des certificats individuels', genre: 'date' },
  { nom: 'dateVerificationCertificats', libelle: 'Vérification des certificats', genre: 'date' },
  { nom: 'dateRepartitionCharges', libelle: 'Répartition des charges', genre: 'date' },
];

export const REGLES_1: Def[] = [
  { nom: 'montantPreReservation', libelle: 'Pré-réservation', genre: 'montant' },
  { nom: 'advancePercent', libelle: 'Concrétisation', genre: 'taux' },
  { nom: 'avanceSurMontant', libelle: 'Avance sur un montant fixe', genre: 'case' },
  { nom: 'montantAvance', libelle: "Montant d'avance", genre: 'montant' },
  { nom: 'fraisDossier', libelle: 'Frais de dossier', genre: 'montant' },
  { nom: 'tauxPenaliteAnnulation', libelle: 'Pénalité de désistement', genre: 'taux' },
  { nom: 'penaliteAnnulationSurPrixArticle', libelle: 'Pénalité sur le prix de vente (sinon les encaissements)', genre: 'case' },
  { nom: 'penaliteTransfertArticle', libelle: 'Pénalité de transfert produit', genre: 'montant' },
  { nom: 'penaliteTransfertTranche', libelle: 'Pénalité de transfert tranche', genre: 'montant' },
  { nom: 'penaliteTransfertClient', libelle: 'Pénalité de transfert client', genre: 'montant' },
  { nom: 'autresFrais', libelle: 'Autres frais', genre: 'montant' },
  { nom: 'montantSyndic', libelle: 'Frais de syndic mensuel', genre: 'montant' },
  { nom: 'periodeSyndic', libelle: 'Durée du syndic (mois)', genre: 'entier' },
];

export const REGLES_2: Def[] = [
  { nom: 'delaiPremierEngagement', libelle: 'Attente après 1re notification T.F (jours)', genre: 'entier' },
  { nom: 'delaiDeuxiemeEngagement', libelle: 'Attente après 2e notification T.F (jours)', genre: 'entier' },
  { nom: 'tauxPenalitePremierEngagement', libelle: 'Pénalité de non finalisation', genre: 'taux' },
  { nom: 'tauxPenaliteDeuxiemeEngagement', libelle: 'Déduction après clôture', genre: 'taux' },
  { nom: 'delaiSoldePaiement', libelle: 'Mise à disposition du solde (jours)', genre: 'entier' },
  { nom: 'delaiGarantie', libelle: 'Service après-vente (mois)', genre: 'entier' },
  { nom: 'delaiGarantieSupplement', libelle: 'Service après-vente supp. (mois)', genre: 'entier' },
  { nom: 'codeDroitRetractation', libelle: 'Article légal pour la résiliation', genre: 'texte' },
  { nom: 'tribunalCommerce', libelle: 'Tribunal de commerce', genre: 'texte' },
  { nom: 'delaiMinimumIntervention', libelle: 'Délai minimum visite technique (jours)', genre: 'entier' },
  { nom: 'maxVisitNumber', libelle: 'Visites maximum par jour', genre: 'entier' },
  { nom: 'delaiRetractation', libelle: 'Rétractation (heures)', genre: 'entier' },
  { nom: 'delaiMaxEcheance', libelle: 'Échéance maximum (jours)', genre: 'entier' },
  { nom: 'verifierDelaiMaxEcheance', libelle: "Contrôler l'échéance maximum", genre: 'case' },
  { nom: 'creditPercent', libelle: 'Crédit maximum', genre: 'taux' },
  { nom: 'isWithVerifCredit', libelle: 'Contrôler le crédit maximum', genre: 'case' },
  { nom: 'cadeauParrain', libelle: 'Cadeau pour le parrain', genre: 'case' },
  { nom: 'cadeauAncienClient', libelle: 'Cadeau pour un ancien client', genre: 'case' },
  { nom: 'cadeauOrigineProspection', libelle: 'Cadeau pour une source de contact', genre: 'case' },
  { nom: 'cadeauxCumules', libelle: 'Cumul des cadeaux possible', genre: 'case' },
];

export const REMISES: Def[] = [
  { nom: 'montantPreReservationRemise', libelle: 'Remise sur la pré-réservation', genre: 'montant' },
  { nom: 'advancePercentRemise', libelle: 'Seuil de versement à la concrétisation', genre: 'taux' },
  { nom: 'advancePercentRemiseActive', libelle: 'Active', genre: 'case' },
  { nom: 'fraisDossierRemise', libelle: 'Remise sur les frais de dossier', genre: 'montant' },
  { nom: 'tauxPenaliteAnnulationRemise', libelle: 'Remise sur les pénalités de désistement', genre: 'taux' },
  { nom: 'penaliteTransfertArticleRemise', libelle: 'Remise sur le transfert produit', genre: 'montant' },
  { nom: 'penaliteTransfertTrancheRemise', libelle: 'Remise sur le transfert tranche', genre: 'montant' },
  { nom: 'penaliteTransfertClientRemise', libelle: 'Remise sur le transfert client', genre: 'montant' },
  { nom: 'autresFraisRemise', libelle: 'Remise sur autres frais', genre: 'montant' },
  { nom: 'montantSyndicRemise', libelle: 'Remise sur les frais de syndic', genre: 'montant' },
];

export const AUTRES: Def[] = [
  { nom: 'delaiNotaireMinutes', libelle: 'Envoi au notaire → date minute (jours)', genre: 'entier' },
  { nom: 'delaiToutSoldeMinutes', libelle: 'Date minute → encaissement du reste (jours)', genre: 'entier' },
  { nom: 'ecartTypeConcretisation', libelle: 'Écart-type concrétisations', genre: 'nombre' },
  { nom: 'ecartTypeFinalisation', libelle: 'Écart-type finalisations', genre: 'nombre' },
  { nom: 'tiersAutruiId', libelle: 'Tiers autrui', genre: 'reference', lu: 'tiersAutruiLibelle' },
  { nom: 'projetFacturationId', libelle: 'Projet de facturation des dépenses', genre: 'reference', lu: 'projetFacturationLibelle' },
  { nom: 'planComptableId', libelle: 'Plan comptable', genre: 'reference', lu: 'planComptableLibelle' },
  { nom: 'descriptionLongue', libelle: 'Description détaillée', genre: 'texteLong' },
];

/** Valeurs initiales d'OMRAN, affichées pour être vues ; le serveur les applique de toute façon. */
export const DEFAUTS_CREATION: TrancheEcritureDto = {
  estEnVente: true,
  estEnLocation: false,
  visibleProjet: false,
  visibleAchat: false,
  visibleSav: false,
  visiblePrm: false,
  visibleRom: false,
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

export const SAISIS: Def[] = [GENERAL, VISIBILITE, DATES, COORDONNEES, FONCIER, REGLES_1, REGLES_2, REMISES, AUTRES].flat();

export function versEcriture(t: TrancheDetailDto): TrancheEcritureDto {
  return extraireSaisie(t, SAISIS, { projetId: t.projetId });
}
