// Miroir des DTO de FEATURE-patrimoine-article-onglets.md (onglets de l'article, pièces jointes du patrimoine).
import type { UUID } from '../types';

/** Segment d'URL d'un porteur de pièces jointes du patrimoine. */
export type PorteurPieces = 'articles' | 'tranches' | 'projets' | 'prospections-terrain';

export type OrigineDossier = 'VENTE' | 'LOCATION' | 'SYNDIC';

export interface ArticleDossierDto {
  origine?: OrigineDossier;
  /** PKey du dossier ; lien vers la fiche seulement pour une VENTE. */
  id?: UUID;
  code?: string;
  statut?: string | null;
  client?: string | null;
  articleCode?: string | null;
  societe?: string | null;
  tranche?: string | null;
  programme?: string | null;
  categorie?: string | null;
  type?: string | null;
  presentation?: string | null;
  /** Vente : net à payer (`MontantsDossier`) ; location et syndic : null. */
  total?: number | null;
  regle?: number | null;
  reste?: number | null;
}

/** Mêmes noms que `HistoriqueDto` (sans `workflowDescription`), plus `origine` et `client`. */
export interface ArticleHistoriqueDto {
  id: UUID;
  date?: string | null;
  /** Préfixe « TRANSFERT PRODUIT : ancien => nouveau » éventuel, puis la note. */
  description?: string | null;
  /** « Système » pour une location ou un syndic sans compte. */
  utilisateur?: string | null;
  statutDescription?: string | null;
  /** Vente seulement. */
  dossierId?: UUID | null;
  dossierCode?: string | null;
  articleCode?: string | null;
  /** Null si la ligne ne vise aucun dossier. */
  origine?: OrigineDossier | null;
  client?: string | null;
}

export type ResultatAttachement = 'ATTACHE' | 'REMPLACE' | 'CODE_INTROUVABLE' | 'REFUSE';

export interface BilanAttachementDto {
  nomFichier?: string;
  resultat?: ResultatAttachement;
  /** Motif d'un refus ou « Code article introuvable » ; null sinon. */
  message?: string | null;
  /** Pièce créée ou remplacée ; null si rien n'a été écrit. */
  pieceId?: UUID | null;
}

/** Champs facultatifs d'un dépôt (query string). `typeId` obligatoire en masse. */
export interface SaisiePieceJointe {
  description?: string;
  typeId?: UUID;
  groupe?: string;
}
