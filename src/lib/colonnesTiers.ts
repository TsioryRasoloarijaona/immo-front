import { colonneLocale as colonne, type DispositionColonnes } from './colonnes';
import type { FamilleTiers } from '../types/administration';
import type { ColonneDto } from '../types';

/** Écran Tiers d'une famille : libellés, colonnes, filtre et onglets. Banques, organismes et personnels s'y ajoutent ici. */
export interface ConfigTiers {
  famille: FamilleTiers;
  titre: string;
  /** Singulier, pour « Nouveau … », « Ouvrir … » et la confirmation. */
  sujet: string;
  aucun: string;
  chemin: string;
  catalogue: ColonneDto[];
  disposition: DispositionColonnes;
  /** Filtre Nature de la liste (ignoré par le serveur pour `contacts`). */
  filtreNature: boolean;
  ongletContacts: boolean;
  /** Champs propres aux fournisseurs : note, identifiants fiscaux, comptabilité, banque. */
  champsFournisseur: boolean;
  /** Personne morale cochée sur une fiche vide. */
  moraleParDefaut: boolean;
  /** Fiche réduite : sections propres, sans bascule morale/physique ni onglet Autres. */
  ficheReduite: boolean;
  /** Champs requis d'une fiche réduite ; sans effet sur les autres fiches. */
  requis: string[];
  /** Mobile ou e-mail requis (règle 8 des fiches complètes). */
  contactRequis: boolean;
  /** Listes déroulantes à charger : clés de `CHARGEURS_LISTES` (saisieTiers). */
  listes: string[];
}

const LISTES_COMPLETES = [
  'titres', 'sexes', 'natures', 'formesSociales', 'devises', 'assujettissements', 'pays', 'banques', 'nationalites',
  'situations', 'typesPiece', 'professions', 'notes',
];
const LISTES_REDUITES = ['natures', 'pays', 'comptes', 'journaux'];

const COMMUNES: ColonneDto[] = [
  colonne('code', 'Code', 'GENERAL', 'TEXTE', true),
  colonne('description', 'Description', 'GENERAL', 'TEXTE', true),
];

const FOURNISSEURS: ColonneDto[] = [
  ...COMMUNES,
  colonne('raisonSociale', 'Raison sociale', 'GENERAL', 'TEXTE', true),
  colonne('contacts', 'Contacts', 'GENERAL', 'TEXTE', true),
  colonne('telephone', 'Téléphone', 'COORDONNEES', 'TEXTE', true),
  colonne('fax', 'Fax', 'COORDONNEES', 'TEXTE', true),
  colonne('mobile', 'Mobile', 'COORDONNEES', 'TEXTE', true),
  colonne('email', 'E-mail', 'COORDONNEES', 'TEXTE', true),
  colonne('siteWeb', 'Site web', 'COORDONNEES', 'TEXTE', true),
  colonne('adresse', 'Adresse', 'COORDONNEES', 'TEXTE', true),
  colonne('notes', 'Notes', 'AUTRES', 'TEXTE', true),
  colonne('estPrestataire', 'Est un prestataire', 'GENERAL', 'BOOLEEN', true),
  colonne('ice', 'ICE', 'AUTRES', 'TEXTE', true),
  colonne('nature', 'Nature', 'GENERAL', 'TEXTE', true),
  colonne('pays', 'Pays', 'COORDONNEES', 'TEXTE', true),
  colonne('agence', 'Agence', 'AUTRES', 'TEXTE', true),
  colonne('rib', 'RIB', 'AUTRES', 'TEXTE', true),
  colonne('iban', 'IBAN', 'AUTRES', 'TEXTE', true),
  colonne('matriculeFiscal', 'Matricule fiscal', 'AUTRES', 'TEXTE', true),
  colonne('registreCommerce', 'Registre de commerce', 'AUTRES', 'TEXTE', true),
  colonne('douane', 'Douane', 'AUTRES', 'TEXTE', true),
  colonne('codeComptable', 'Code comptable', 'AUTRES', 'TEXTE', true),
  colonne('codeComptableCollectif', 'Code comptable collectif', 'AUTRES', 'TEXTE', true),
  colonne('assujettissement', 'Assujettissement', 'AUTRES', 'TEXTE', true),
];

const CONTACTS: ColonneDto[] = [
  ...COMMUNES,
  colonne('contacts', 'Contacts', 'GENERAL', 'TEXTE', true),
  colonne('telephone', 'Téléphone', 'COORDONNEES', 'TEXTE', true),
  colonne('fax', 'Fax', 'COORDONNEES', 'TEXTE', true),
  colonne('mobile', 'Mobile', 'COORDONNEES', 'TEXTE', true),
  colonne('email', 'E-mail', 'COORDONNEES', 'TEXTE', true),
  colonne('adresse', 'Adresse', 'COORDONNEES', 'TEXTE', true),
  colonne('notes', 'Notes', 'AUTRES', 'TEXTE', true),
  colonne('nature', 'Nature', 'GENERAL', 'TEXTE', true),
  colonne('paysResidence', 'Pays de résidence', 'COORDONNEES', 'TEXTE', true),
];

const REDUITE: ColonneDto[] = [
  ...COMMUNES,
  colonne('nature', 'Nature', 'GENERAL', 'TEXTE', true),
  colonne('matriculeFiscal', 'Matricule fiscal', 'AUTRES', 'TEXTE', true),
  colonne('registreCommerce', 'Registre de commerce', 'AUTRES', 'TEXTE', true),
  colonne('mobile', 'Mobile', 'COORDONNEES', 'TEXTE', true),
  colonne('telephone', 'Téléphone', 'COORDONNEES', 'TEXTE', true),
  colonne('telephone1', 'Téléphone 1', 'COORDONNEES', 'TEXTE', true),
  colonne('telephone2', 'Téléphone 2', 'COORDONNEES', 'TEXTE', true),
  colonne('fax', 'Fax', 'COORDONNEES', 'TEXTE', true),
  colonne('adresse', 'Adresse', 'COORDONNEES', 'TEXTE', true),
  colonne('email', 'E-mail', 'COORDONNEES', 'TEXTE', true),
  colonne('siteWeb', 'Site web', 'COORDONNEES', 'TEXTE', true),
  colonne('contacts', 'Contacts', 'GENERAL', 'TEXTE', true),
  colonne('notes', 'Notes', 'AUTRES', 'TEXTE', true),
];

function disposition(catalogue: ColonneDto[]): DispositionColonnes {
  return {
    ordre: catalogue.map((c) => c.nom),
    poids: { code: 10, description: 24, raisonSociale: 24, contacts: 20, adresse: 24, notes: 24, email: 20, siteWeb: 18 },
  };
}

export const CONFIG_TIERS: Record<FamilleTiers, ConfigTiers> = {
  fournisseurs: {
    famille: 'fournisseurs',
    titre: 'Fournisseurs',
    sujet: 'fournisseur',
    aucun: 'Aucun fournisseur',
    chemin: '/administration/fournisseurs',
    catalogue: FOURNISSEURS,
    disposition: disposition(FOURNISSEURS),
    filtreNature: true,
    ongletContacts: true,
    champsFournisseur: true,
    moraleParDefaut: true,
    ficheReduite: false,
    requis: [],
    contactRequis: true,
    listes: LISTES_COMPLETES,
  },
  contacts: {
    famille: 'contacts',
    titre: 'Contacts',
    sujet: 'contact',
    aucun: 'Aucun contact',
    chemin: '/administration/contacts',
    catalogue: CONTACTS,
    disposition: disposition(CONTACTS),
    filtreNature: false,
    ongletContacts: false,
    champsFournisseur: false,
    moraleParDefaut: false,
    ficheReduite: false,
    requis: [],
    contactRequis: true,
    listes: LISTES_COMPLETES,
  },
  banques: {
    famille: 'banques',
    titre: 'Banques',
    sujet: 'banque',
    aucun: 'Aucune banque',
    chemin: '/administration/banques',
    catalogue: REDUITE,
    disposition: disposition(REDUITE),
    filtreNature: false,
    ongletContacts: false,
    champsFournisseur: false,
    moraleParDefaut: false,
    ficheReduite: true,
    requis: ['code', 'description', 'paysId'],
    contactRequis: false,
    listes: LISTES_REDUITES,
  },
  organismes: {
    famille: 'organismes',
    titre: 'Organismes',
    sujet: 'organisme',
    aucun: 'Aucun organisme',
    chemin: '/administration/organismes',
    catalogue: REDUITE,
    disposition: disposition(REDUITE),
    filtreNature: false,
    ongletContacts: false,
    champsFournisseur: false,
    moraleParDefaut: false,
    ficheReduite: true,
    requis: ['code', 'description', 'paysId'],
    contactRequis: false,
    listes: LISTES_REDUITES,
  },
};
