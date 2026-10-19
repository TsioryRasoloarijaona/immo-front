import type { SectionSaisie } from './saisiePatrimoine';
import type { TrancheDetailDto } from '../types';

// Libellés repris des messages du serveur : `champEnErreur` y retrouve le champ fautif.
export const SECTIONS_TRANCHE: SectionSaisie[] = [
  {
    titre: 'Identité',
    champs: [
      { nom: 'projetId', libelle: 'Programme', type: 'liste', liste: 'projets', obligatoire: true },
      { nom: 'code', libelle: 'Code', type: 'texte', obligatoire: true },
      { nom: 'description', libelle: 'Description', type: 'texte', obligatoire: true },
      { nom: 'descriptionLongue', libelle: 'Description longue', type: 'texteLong' },
      { nom: 'estEnVente', libelle: 'Visible en Vente', type: 'booleen' },
      { nom: 'estEnLocation', libelle: 'Visible en Location', type: 'booleen' },
    ],
  },
  {
    titre: 'Coordonnées',
    champs: [
      { nom: 'adresse', libelle: 'Adresse', type: 'texte' },
      { nom: 'adresse2', libelle: 'Adresse 2', type: 'texte' },
      { nom: 'adresse3', libelle: 'Adresse 3', type: 'texte' },
      { nom: 'codePostal', libelle: 'Code postal', type: 'texte' },
      { nom: 'ville', libelle: 'Ville', type: 'texte' },
      { nom: 'paysId', libelle: 'Pays', type: 'liste', liste: 'pays' },
      { nom: 'telephone', libelle: 'Téléphone', type: 'texte' },
      { nom: 'mobile', libelle: 'Mobile', type: 'texte' },
      { nom: 'fax', libelle: 'Fax', type: 'texte' },
      { nom: 'email', libelle: 'Email', type: 'texte' },
      { nom: 'siteWeb', libelle: 'Site web', type: 'texte' },
    ],
  },
  {
    titre: 'Dates',
    champs: [
      { nom: 'dateDebutTravaux', libelle: 'Début des travaux', type: 'date' },
      { nom: 'dateFinTravaux', libelle: 'Fin des travaux', type: 'date' },
      { nom: 'dateDebutCommercialisation', libelle: 'Début de commercialisation', type: 'date' },
      { nom: 'dateFinCommercialisation', libelle: 'Fin de commercialisation', type: 'date' },
      { nom: 'dateOctroiTitresFonciers', libelle: 'Octroi des T.F', type: 'date' },
      { nom: 'datePermisHabiter', libelle: "Permis d'habiter", type: 'date' },
      { nom: 'dateReception', libelle: 'Réception', type: 'date' },
      { nom: 'datePremiereRelance', libelle: '1re relance', type: 'date' },
      { nom: 'dateFinConcretisation', libelle: 'Fin de concrétisation', type: 'date' },
      { nom: 'dateDebutFinalisation', libelle: 'Début de finalisation', type: 'date' },
    ],
  },
  {
    titre: 'Règles de gestion 1',
    champs: [
      { nom: 'montantPreReservation', libelle: 'Montant pré-réservation', type: 'montant' },
      { nom: 'avanceSurMontant', libelle: 'Avance sur montant', type: 'booleen' },
      { nom: 'montantAvance', libelle: "Montant de l'avance", type: 'montant' },
      { nom: 'advancePercent', libelle: 'Concrétisation', type: 'pourcent' },
      { nom: 'fraisDossier', libelle: 'Frais de dossier', type: 'montant' },
      { nom: 'tauxPenaliteAnnulation', libelle: "Pénalité d'annulation", type: 'pourcent' },
      { nom: 'penaliteAnnulationSurPrixArticle', libelle: "Pénalité sur le prix de l'article", type: 'booleen' },
      { nom: 'penaliteTransfertArticle', libelle: 'Pénalité transfert article', type: 'montant' },
      { nom: 'penaliteTransfertTranche', libelle: 'Pénalité transfert tranche', type: 'montant' },
      { nom: 'penaliteTransfertClient', libelle: 'Pénalité transfert client', type: 'montant' },
      { nom: 'autresFrais', libelle: 'Autres frais', type: 'montant' },
      { nom: 'montantSyndic', libelle: 'Montant syndic', type: 'montant' },
      { nom: 'periodeSyndic', libelle: 'Période syndic (mois)', type: 'entier' },
    ],
  },
  {
    titre: 'Règles de gestion 2',
    champs: [
      { nom: 'delaiPremierEngagement', libelle: 'Délai 1er engagement (jours)', type: 'entier' },
      { nom: 'delaiDeuxiemeEngagement', libelle: 'Délai 2e engagement (jours)', type: 'entier' },
      { nom: 'tauxPenalitePremierEngagement', libelle: 'Pénalité 1er engagement', type: 'pourcent' },
      { nom: 'tauxPenaliteDeuxiemeEngagement', libelle: 'Pénalité 2e engagement', type: 'pourcent' },
      { nom: 'delaiSoldePaiement', libelle: 'Délai solde paiement (jours)', type: 'entier' },
      { nom: 'delaiGarantie', libelle: 'Délai de garantie', type: 'entier' },
      { nom: 'delaiGarantieSupplement', libelle: 'Supplément de garantie', type: 'entier' },
      { nom: 'codeDroitRetractation', libelle: 'Code du droit de rétractation', type: 'texte' },
      { nom: 'tribunalCommerce', libelle: 'Tribunal de commerce', type: 'texte' },
      { nom: 'delaiMinimumIntervention', libelle: "Délai minimum d'intervention", type: 'entier' },
      { nom: 'maxVisitNumber', libelle: 'Nombre maximum de visites', type: 'entier' },
      { nom: 'delaiRetractation', libelle: 'Délai de rétractation (heures)', type: 'entier' },
      { nom: 'delaiMaxEcheance', libelle: 'Délai max échéance', type: 'entier' },
      { nom: 'verifierDelaiMaxEcheance', libelle: 'Vérifier le délai max échéance', type: 'booleen' },
      { nom: 'creditPercent', libelle: 'Crédit max', type: 'pourcent' },
      { nom: 'isWithVerifCredit', libelle: 'Vérifier le crédit', type: 'booleen' },
    ],
  },
  {
    titre: 'Remises anciens clients',
    champs: [
      { nom: 'montantPreReservationRemise', libelle: 'Montant pré-réservation (remise)', type: 'montant' },
      { nom: 'advancePercentRemise', libelle: 'Concrétisation (remise)', type: 'pourcent' },
      { nom: 'advancePercentRemiseActive', libelle: 'Concrétisation remisée active', type: 'booleen' },
      { nom: 'fraisDossierRemise', libelle: 'Frais de dossier (remise)', type: 'montant' },
      { nom: 'tauxPenaliteAnnulationRemise', libelle: "Pénalité d'annulation (remise)", type: 'pourcent' },
      { nom: 'penaliteTransfertArticleRemise', libelle: 'Pénalité transfert article (remise)', type: 'montant' },
      { nom: 'penaliteTransfertTrancheRemise', libelle: 'Pénalité transfert tranche (remise)', type: 'montant' },
      { nom: 'penaliteTransfertClientRemise', libelle: 'Pénalité transfert client (remise)', type: 'montant' },
      { nom: 'autresFraisRemise', libelle: 'Autres frais (remise)', type: 'montant' },
      { nom: 'montantSyndicRemise', libelle: 'Montant syndic (remise)', type: 'montant' },
    ],
  },
  {
    titre: 'Autres',
    champs: [
      { nom: 'delaiNotaireMinutes', libelle: 'Délai notaire (minutes)', type: 'entier' },
      { nom: 'delaiToutSoldeMinutes', libelle: 'Délai tout soldé (minutes)', type: 'entier' },
      { nom: 'ecartTypeConcretisation', libelle: 'Écart type concrétisation', type: 'montant' },
      { nom: 'ecartTypeFinalisation', libelle: 'Écart type finalisation', type: 'montant' },
    ],
  },
];

/** Défauts OMRAN affichés à la création (le serveur les applique aussi aux champs absents). */
export const DEFAUTS_TRANCHE: Partial<TrancheDetailDto> = {
  estEnVente: true,
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

export const CHAMPS_REPRIS_DU_PROGRAMME = [
  'descriptionLongue', 'adresse', 'adresse2', 'adresse3', 'codePostal', 'ville', 'paysId', 'telephone', 'mobile',
  'fax', 'email', 'siteWeb', 'dateDebutTravaux', 'dateFinTravaux', 'dateDebutCommercialisation', 'dateFinCommercialisation',
];
