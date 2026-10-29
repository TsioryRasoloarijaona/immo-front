/** Référentiels simples : valeurs réelles d'OMRAN (ADMINISTRATION-base.md §6) quand elles sont connues. */
export interface DefReferentiel {
  titre: string;
  /** Singulier de l'effectif. */
  unite: string;
  nature: string;
  /** Colonnes en plus de Code / Description. */
  extras?: { nom: string; libelle: string }[];
  /** Une ligne = [code, description, ...valeurs des colonnes en plus]. */
  lignes: string[][];
}

function codees(prefixe: string, descriptions: string[]): string[][] {
  return descriptions.map((d, i) => [`${prefixe}${String(i + 1).padStart(2, '0')}`, d]);
}

const PAYS = { nom: 'pays', libelle: 'Pays' };

export const REFERENTIELS: Record<string, DefReferentiel> = {
  pays: {
    titre: 'Pays',
    unite: 'pays',
    nature: 'Pays',
    extras: [
      { nom: 'iso', libelle: 'Code ISO' },
      { nom: 'telephone', libelle: 'Indicatif téléphonique' },
    ],
    lignes: [
      ['MAR', 'Maroc', 'MA', '+212'],
      ['FRA', 'France', 'FR', '+33'],
      ['BEL', 'Belgique', 'BE', '+32'],
      ['ITA', 'Italie', 'IT', '+39'],
      ['ESP', 'Espagne', 'ES', '+34'],
      ['CHE', 'Suisse', 'CH', '+41'],
      ['DEU', 'Allemagne', 'DE', '+49'],
      ['GBR', 'Royaume-Uni', 'GB', '+44'],
      ['USA', 'États-Unis', 'US', '+1'],
      ['CAN', 'Canada', 'CA', '+1'],
      ['TUN', 'Tunisie', 'TN', '+216'],
      ['DZA', 'Algérie', 'DZ', '+213'],
      ['EGY', 'Égypte', 'EG', '+20'],
      ['LBN', 'Liban', 'LB', '+961'],
      ['SEN', 'Sénégal', 'SN', '+221'],
      ['COD', 'Congo (RDC)', 'CD', '+243'],
      ['ARE', 'Émirats arabes unis', 'AE', '+971'],
      ['SAU', 'Arabie saoudite', 'SA', '+966'],
    ],
  },
  villes: {
    titre: 'Villes',
    unite: 'ville',
    nature: 'Ville',
    extras: [PAYS],
    lignes: [
      ['CAS', 'Casablanca', 'Maroc'],
      ['RBA', 'Rabat', 'Maroc'],
      ['MRK', 'Marrakech', 'Maroc'],
      ['TNG', 'Tanger', 'Maroc'],
      ['FES', 'Fès', 'Maroc'],
      ['AGA', 'Agadir', 'Maroc'],
      ['MEK', 'Meknès', 'Maroc'],
      ['OUJ', 'Oujda', 'Maroc'],
      ['KEN', 'Kénitra', 'Maroc'],
      ['TET', 'Tétouan', 'Maroc'],
      ['SAL', 'Salé', 'Maroc'],
      ['TEM', 'Témara', 'Maroc'],
      ['JDI', 'El Jadida', 'Maroc'],
      ['MOH', 'Mohammedia', 'Maroc'],
      ['NAD', 'Nador', 'Maroc'],
      ['PAR', 'Paris', 'France'],
      ['LYO', 'Lyon', 'France'],
      ['MRS', 'Marseille', 'France'],
      ['BRU', 'Bruxelles', 'Belgique'],
      ['GVA', 'Genève', 'Suisse'],
    ],
  },
  'statuts-listes': {
    titre: 'Statuts des listes à faire',
    unite: 'statut',
    nature: 'Statut de liste à faire',
    lignes: [
      ['EN COURS', 'En cours'],
      ['TRAITE', 'Traité'],
    ],
  },
  'types-attachements': {
    titre: 'Types des attachements',
    unite: 'type',
    nature: "Type d'attachement",
    lignes: [
      ['CIN', "Carte d'identité nationale"],
      ['PAS', 'Passeport'],
      ['TF', 'Titre foncier'],
      ['PLAN', 'Plan'],
      ['CTR', 'Contrat'],
      ['QUI', 'Quittance'],
      ['JDO', 'Justificatif de domicile'],
      ['RIB', 'Relevé d’identité bancaire'],
      ['ATT', 'Attestation'],
      ['DIV', 'Divers'],
    ],
  },
  'type-tache': {
    titre: 'Type de tâche',
    unite: 'type',
    nature: 'Type de tâche',
    lignes: [
      ['APP', 'Appel'],
      ['REU', 'Réunion'],
      ['VIS', 'Visite'],
      ['REL', 'Relance'],
      ['RED', 'Rédaction'],
    ],
  },
  'priorite-tache': {
    titre: 'Priorité de tâche',
    unite: 'priorité',
    nature: 'Priorité de tâche',
    lignes: [
      ['BAS', 'Basse'],
      ['NOR', 'Normale'],
      ['HAU', 'Haute'],
      ['URG', 'Urgente'],
    ],
  },
  sexes: {
    titre: 'Sexes',
    unite: 'sexe',
    nature: 'Sexe',
    lignes: [
      ['M', 'Masculin'],
      ['F', 'Feminin'],
      ['NC', 'Non connu'],
    ],
  },
  titres: {
    titre: 'Titres',
    unite: 'titre',
    nature: 'Titre',
    lignes: [
      ['Mlle', 'Mlle'],
      ['Mme', 'Mme'],
      ['Mr.', 'Mr.'],
    ],
  },
  'formes-sociales': {
    titre: 'Formes sociales',
    unite: 'forme sociale',
    nature: 'Forme sociale',
    lignes: [
      ['OG', 'Organisme gouvernemental'],
      ['ONG', 'ONG'],
      ['PH', 'Personne physique'],
      ['SARL', 'SARL'],
      ['SA', 'SA'],
      ['PM', 'Personne morale'],
      ['SUARL', 'SUARL'],
    ],
  },
  'types-tiers': {
    titre: 'Types',
    unite: 'type',
    nature: 'Type de tiers',
    lignes: [
      ['CLI', 'CLIENT'],
      ['PRO', 'PROSPECT'],
      ['BAN', 'BANQUE'],
      ['ORG', 'ORGANISME'],
      ['CNT', 'CONTACT'],
      ['EMP', 'EMPLOYE'],
      ['FOU', 'FOURNISSEUR'],
      ['CLIRNT', 'CLIRNT'],
      ['CLIROM', 'CLIROM'],
      ['CLIPRM', 'CLIPRM'],
      ['PRORNT', 'PRORNT'],
      ['PROROM', 'PROROM'],
      ['PROPRM', 'PROPRM'],
    ],
  },
  natures: {
    titre: 'Natures',
    unite: 'nature',
    nature: 'Nature de tiers',
    extras: [{ nom: 'type', libelle: 'Type de tiers' }],
    lignes: [
      ['CLI01', 'Client', 'CLIENT'],
      ['PRO01', 'Hors budget', 'PROSPECT'],
      ['PRO02', 'Déjà réservé', 'PROSPECT'],
      ['PRO03', 'Localisation', 'PROSPECT'],
      ['BAN01', 'Banque commerciale', 'BANQUE'],
      ['BAN02', 'Banque participative', 'BANQUE'],
      ['CNT01', 'Notaire', 'CONTACT'],
      ['CNT02', 'Architecte', 'CONTACT'],
      ['FOU01', 'Fournisseur de matériaux', 'FOURNISSEUR'],
      ['FOU02', 'Prestataire de services', 'FOURNISSEUR'],
      ['ORG01', 'Conservation foncière', 'ORGANISME'],
      ['EMP01', 'Commercial', 'EMPLOYE'],
    ],
  },
  assujettissements: {
    titre: 'Assujettissements',
    unite: 'assujettissement',
    nature: 'Assujettissement',
    lignes: [
      ['EXO', 'Exonéré'],
      ['ASS', 'Assujéti'],
      ['NAS', 'Non assujéti'],
    ],
  },
  'situations-familiales': {
    titre: 'Situations familiales',
    unite: 'situation familiale',
    nature: 'Situation familiale',
    lignes: [
      ['VEU', 'Veuf(ve)'],
      ['AUT', 'Autre'],
      ['CEL', 'Célibataire'],
      ['DIV', 'Divorcé(e)'],
      ['MAR', 'Marié(e)'],
    ],
  },
  'types-residence': {
    titre: 'Types de résidence',
    unite: 'type de résidence',
    nature: 'Type de résidence',
    lignes: [
      ['RES', 'Résident(e)'],
      ['NRE', 'Non résident(e)'],
    ],
  },
  'regimes-matrimoniaux': {
    titre: 'Régimes matrimoniaux',
    unite: 'régime',
    nature: 'Régime matrimonial',
    lignes: [
      ['SIN', 'Sans indication'],
      ['COM', 'Communauté des biens'],
      ['SEP', 'Séparation des biens'],
    ],
  },
  'types-piece-identite': {
    titre: "Types de pièce d'identité",
    unite: 'type de pièce',
    nature: "Type de pièce d'identité",
    lignes: [
      ['PAS', 'Passeport'],
      ['R.C.', 'Registre de commerce'],
      ['CIN', "Carte d'identité nationale"],
      ['CDS', 'Carte de séjour'],
    ],
  },
  nationalites: {
    titre: 'Nationalités',
    unite: 'nationalité',
    nature: 'Nationalité',
    lignes: codees('NAT', [
      'Marocaine', 'Francaise', 'Belge', 'Italienne', 'Suisse', 'Libanaise', 'Tunisienne',
      'Egyptienne', 'Canadienne', 'Américaine', 'Anglaise', 'Congolaise', 'Autre',
    ]),
  },
  professions: {
    titre: 'Professions',
    unite: 'profession',
    nature: 'Profession',
    lignes: codees('PRF', [
      'Sans', 'Etudiant', 'Salarié', 'Ouvrier', 'Ingénieur', 'Commerçant', 'Cadre',
      'Fonctionnaire', 'Médecin', 'Commercial', 'Enseignant', 'Profession libérale', 'Retraité', 'Autre',
    ]),
  },
  salaires: {
    titre: 'Salaires',
    unite: 'tranche de salaire',
    nature: 'Tranche de salaire',
    lignes: codees('SAL', [
      '0 – 10 000', '10 000 – 20 000', '20 000 – 30 000', '30 000 – 50 000',
      '50 000 – 70 000', '70 000 – 100 000', '> 100 000', 'Autre',
    ]),
  },
  'types-relation': {
    titre: 'Types de relation',
    unite: 'type de relation',
    nature: 'Type de relation',
    lignes: codees('REL', [
      'responsable juridique', 'Courrier signataire', 'Représentant légal', 'Responsable technique',
      'Responsable commercial', 'Conjoint', 'responsable comptabilité', 'Contact', 'Fils',
    ]),
  },
};
