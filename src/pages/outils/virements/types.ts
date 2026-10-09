/* Hors de `src/types.ts` (miroir de l'OpenAPI d'immo-crm) : ce service n'en a pas, la référence est
   `generateur-virement/src/app.js`. Les cases sont des `0 | 1` sur le fil, pas des booléens ;
   horodatages `AAAA-MM-JJ HH:MM:SS` en UTC. */

export type Bit = 0 | 1;
export type TypeVirement = 'fournisseur' | 'salaire';
export type TypeBeneficiaire = 'fournisseur' | 'salarie';
export type StatutOrdre = 'emis' | 'paye' | 'annule';
export type Police = 'helvetica' | 'times';
export type EnteteMode = 'logo' | 'texte' | 'aucun';

/** `GET /moi` — `admin` décide de ce qu'on affiche, jamais les rôles CRM. */
export interface Moi {
  id: string;
  nom: string;
  roles: string[];
  employeId: string | null;
  admin: boolean;
}

export interface TypePieceMeta {
  libelle: string;
  /** Déposée par le service lui-même (le PDF de l'ordre). */
  auto?: boolean;
  /** La pièce porte un montant comparé au montant viré. */
  montant?: boolean;
  libelle_montant?: string;
}

/** `GET /meta` — seule source des listes métier. */
export interface Meta {
  types_pieces: Record<string, TypePieceMeta>;
  dossiers: Record<string, string[]>;
  statuts: StatutOrdre[];
  types_virement: Record<string, { libelle: string; beneficiaire: string }>;
  types_beneficiaire: Record<string, string>;
  longueur_mdp_min: number;
}

export interface Beneficiaire {
  id: number;
  nom: string;
  rib: string;
  type: TypeBeneficiaire;
  created_at: string;
  updated_at: string;
}

export interface LigneDossier {
  id: number;
  nom: string;
  rib: string;
  type: TypeBeneficiaire;
  nb_ordres: number;
  total_montant: number;
  nb_incomplets: number;
  nb_complets: number;
  dossier_complet: boolean;
}

export interface SocieteSaisie {
  nom: string;
  banque: string;
  ville: string;
  compte: string;
  signataire: string;
  par_defaut: Bit;
  police: Police;
  entete_mode: EnteteMode;
  entete_titre: string | null;
  entete_sous_titre: string | null;
  entete_droite: string | null;
  entete_taille: number;
  entete_filet: Bit;
  objet: string;
  phrase_corps: string;
  phrase_ligne: string;
  phrase_corps_salaire: string;
  phrase_ligne_salaire: string;
  signataire_gauche: string | null;
  pied_page: string | null;
  avec_cloture: Bit;
  salutation_grasse: Bit;
  societe_grasse: Bit;
  montants_gras: Bit;
  beneficiaire_gras: Bit;
}

/** `GET /societes` (avec `nb_ordres`) ; les routes d'écriture rendent la
 * même ligne sans `nb_ordres`. */
export interface Societe extends SocieteSaisie {
  id: number;
  /** Clé de stockage ou `null` : ne sert qu'à savoir s'il y a un logo. */
  logo: string | null;
  created_at: string;
  updated_at: string;
  nb_ordres?: number;
}

export interface Piece {
  id: number;
  ordre_id: number;
  type: string;
  nom_fichier: string;
  chemin: string;
  mime: string;
  taille: number;
  numero_piece: string | null;
  montant: number | null;
  created_at: string;
}

export interface Ordre {
  id: number;
  numero: string;
  /** `null` : bénéficiaire supprimé — `fournisseur_nom` est la copie figée. */
  fournisseur_id: number | null;
  fournisseur_nom: string;
  rib: string;
  montant: number;
  date_virement: string;
  reference: string | null;
  statut: StatutOrdre;
  note: string | null;
  societe_id: number | null;
  societe_nom: string | null;
  type_virement: TypeVirement;
  /** Numéro du 1er ordre du lot, `null` pour un ordre seul. */
  groupe: string | null;
  created_at: string;
  updated_at: string;
  pieces: Piece[];
  a_pdf: boolean;
  types_dossier: string[];
  /** Des **libellés**, pas des codes. */
  manquants: string[];
  dossier_complet: boolean;
}

/** `GET /ordres`. Tous les totaux suivent les filtres. */
export interface ListeOrdres {
  ordres: Ordre[];
  total_montant: number;
  nb_complets: number;
  nb_incomplets: number;
  totaux_par_societe: { societe_nom: string; nb_ordres: number; total_montant: number; nb_incomplets: number }[];
}

export interface FiltresOrdres {
  q?: string;
  complet?: '0' | '1';
  groupe?: string;
}

export interface CreerOrdre {
  date_virement: string;
  reference: string;
  societe_id: number;
  type_virement: TypeVirement;
  fournisseur_nom: string;
  rib: string;
  montant: number;
}

export interface CreerOrdreGroupe {
  date_virement: string;
  reference: string;
  societe_id: number;
  type_virement: TypeVirement;
  lignes: { fournisseur_nom: string; rib: string; montant: number }[];
}

export interface OrdreGroupeCree {
  groupe: string;
  total_montant: number;
  ordres: Ordre[];
}

/** `PATCH /ordres/:id` : seuls les champs présents sont touchés. */
export type ModifierOrdre = Partial<{
  statut: StatutOrdre;
  reference: string;
  note: string;
  montant: number;
  date_virement: string;
  fournisseur_nom: string;
  rib: string;
  societe_id: number;
  type_virement: TypeVirement;
}>;

export interface PieceAjoutee {
  piece: Piece;
  ordre: Ordre;
}

export interface DossierBeneficiaire {
  fournisseur: Beneficiaire;
  ordres: Ordre[];
  par_societe: { societe_nom: string; nb_ordres: number; total_montant: number }[];
  nb_ordres: number;
  total_montant: number;
  nb_complets: number;
  nb_incomplets: number;
  dossier_complet: boolean;
  manquants: { id: number; numero: string; date_virement: string; montant: number; manquants: string[] }[];
}

/** `POST /fournisseurs/import` — clés accentuées sur le fil. */
export interface ResultatImport {
  importés: number;
  mis_a_jour: number;
  ignorés: number;
  erreurs: string[];
}

export interface LigneJournal {
  id: number;
  utilisateur_id: string | null;
  utilisateur_nom: string;
  action: string;
  cible: string | null;
  detail: string | null;
  ip: string | null;
  created_at: string;
}
