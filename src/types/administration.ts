// Miroir des DTO de FEATURE-admin-email-historique.md.
import type { UUID } from '../types';

export interface LigneEmailDto {
  id: UUID;
  date: string | null;
  utilisateur: string | null;
  expediteur: string | null;
  destinataires: string | null;
  objet: string | null;
  automatique: boolean | null;
  envoye: boolean | null;
  erreur: string | null;
  libelleObjet: string | null;
}

export interface EmailDetailDto extends LigneEmailDto {
  copie: string | null;
  copieCachee: string | null;
  corps: string | null;
  html: boolean | null;
}

// FEATURE-admin-sessions.md.
export type EtatSession = 'OUVERTE' | 'FERMEE' | 'VERROUILLEE';

export interface LigneSessionDto {
  id: UUID;
  utilisateur: string | null;
  dateOuverture: string;
  dateFermeture: string | null;
  etat: EtatSession;
  adresseIp: string | null;
  version: string | null;
}

export interface FiltresSessions {
  dateDebut?: string;
  dateFin?: string;
  utilisateur?: string;
  ip?: string;
  ouverte?: boolean;
  page?: number;
  size?: number;
}

// FEATURE-admin-fiches-verrouillees.md.
export type EtatFicheVerrouillee = 'VERROUILLEE' | 'NON_VERROUILLEE';

export interface LigneFicheVerrouilleeDto {
  id: UUID;
  entite: string | null;
  libelle: string | null;
  dateVerrouillage: string;
  utilisateur: string | null;
  etat: EtatFicheVerrouillee;
}

export interface ResultatDeverrouillageDto {
  nombre: number;
}

export interface FiltresFichesVerrouillees {
  etat?: EtatFicheVerrouillee;
  dateDebut?: string;
  dateFin?: string;
  recherche?: string;
  page?: number;
  size?: number;
}

// FEATURE-admin-actions.md.
export interface LigneActionDto {
  /** Clé de ligne seulement, `<PKey>:<ActionLabel>`. */
  id: string;
  code: string | null;
  action: string;
  description: string | null;
  creePar: string | null;
  creeLe: string | null;
  modifiePar: string | null;
  modifieLe: string | null;
}

export interface FiltresActions {
  recherche?: string;
  creationDebut?: string;
  creationFin?: string;
  modificationDebut?: string;
  modificationFin?: string;
  page?: number;
  size?: number;
}

export interface FiltresEmail {
  dateDebut?: string;
  dateFin?: string;
  texte?: string;
  utilisateur?: string;
  envoye?: boolean;
  page?: number;
  size?: number;
}

// FEATURE-admin-tiers.md
export type FamilleTiers = 'fournisseurs' | 'contacts';

export type ListeReferentielTiers = 'formes-sociales' | 'assujettissements' | 'notes';

export interface FiltresTiers {
  recherche?: string;
  /** Ignoré pour `contacts`. */
  natureId?: UUID;
  page?: number;
  size?: number;
}

export interface LigneTiersDto {
  id: UUID;
  code: string | null;
  description: string | null;
  raisonSociale: string | null;
  /** Libellés des contacts liés, séparés par « , ». */
  contacts: string | null;
  telephone: string | null;
  fax: string | null;
  mobile: string | null;
  email: string | null;
  siteWeb: string | null;
  adresse: string | null;
  notes: string | null;
  estPrestataire: boolean | null;
  ice: string | null;
  nature: string | null;
  pays: string | null;
  paysResidence: string | null;
  agence: string | null;
  rib: string | null;
  iban: string | null;
  matriculeFiscal: string | null;
  registreCommerce: string | null;
  douane: string | null;
  codeComptable: string | null;
  codeComptableCollectif: string | null;
  assujettissement: string | null;
}

/** PUT : un champ omis est vidé. Le serveur ignore `raisonSociale` d'une personne physique, `prenom` et `nom` d'une morale. */
export interface EcritureTiersRequest {
  personneMorale: boolean;
  raisonSociale?: string | null;
  prenom?: string | null;
  nom?: string | null;
  titreId?: UUID | null;
  sexeId?: UUID | null;
  natureId?: UUID | null;
  formeSocialeId: UUID | null;
  deviseId: UUID | null;
  assujettissementId?: UUID | null;
  paysId?: UUID | null;
  paysResidenceId: UUID | null;
  villeId?: UUID | null;
  ville?: string | null;
  codePostal?: string | null;
  adresse?: string | null;
  adresse2?: string | null;
  adresse3?: string | null;
  mobileIndicatif?: string | null;
  mobile?: string | null;
  telephoneIndicatif?: string | null;
  telephone?: string | null;
  telephone1Indicatif?: string | null;
  telephone1?: string | null;
  telephone2Indicatif?: string | null;
  telephone2?: string | null;
  faxIndicatif?: string | null;
  fax?: string | null;
  email?: string | null;
  siteWeb?: string | null;
  notes?: string | null;
  ice?: string | null;
  matriculeFiscal?: string | null;
  registreCommerce?: string | null;
  douane?: string | null;
  codeComptable?: string | null;
  codeComptableCollectif?: string | null;
  banqueId?: UUID | null;
  agence?: string | null;
  rib?: string | null;
  iban?: string | null;
  tauxRetenue?: number | null;
  tauxTva?: number | null;
  delaiPaiement?: number | null;
  estPrestataire?: boolean | null;
  noteId?: UUID | null;
  dateNaissance?: string | null;
  lieuNaissance?: string | null;
  situationFamilialeId?: UUID | null;
  nationaliteId?: UUID | null;
  professionId?: UUID | null;
  typePieceId?: UUID | null;
  numeroPiece?: string | null;
}

export interface FicheTiersDto extends EcritureTiersRequest {
  id: UUID;
  code: string | null;
  description: string | null;
  creePar: string | null;
  creeLe: string | null;
  modifiePar: string | null;
  modifieLe: string | null;
  nature: string | null;
  pays: string | null;
  formeSociale: string | null;
  devise: string | null;
}

export interface NatureTiersDto {
  id: UUID;
  code: string | null;
  libelle: string | null;
}

export interface LienTiersDto {
  id: UUID;
  contactId: UUID | null;
  contact: string | null;
  relationTypeId: UUID | null;
  relation: string | null;
}

export interface LienTiersRequest {
  contactId: UUID;
  relationTypeId?: UUID | null;
}
