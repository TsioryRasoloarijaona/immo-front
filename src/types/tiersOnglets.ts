import type { UUID } from '../types';

/** Onglets de lecture de la fiche tiers (`GET /api/administration/tiers/{famille}/{id}/onglets/{onglet}`). */
export type OngletTiers = 'prospections' | 'dossiers' | 'recettes' | 'depenses' | 'reglements' | 'conges' | 'historique';

export interface LienOngletTiersDto {
  ecran: 'dossier' | 'prospection' | 'encaissement';
  id: UUID;
}

export interface LigneProspectionTiersDto {
  id: UUID;
  code: string | null;
  date: string | null;
  vocation: string | null;
  tranche: string | null;
  nature: string | null;
  article: string | null;
  action: string | null;
  supportOrigine: string | null;
  dossierCode: string | null;
  archivee: boolean | null;
  notes: string | null;
  lien: LienOngletTiersDto;
}

export interface LigneDossierTiersDto {
  id: UUID;
  nature: 'Vente' | 'Location' | 'Co-acquéreur';
  code: string | null;
  description: string | null;
  date: string | null;
  statut: string | null;
  tranche: string | null;
  article: string | null;
  categorie: string | null;
  type: string | null;
  total: number | null;
  lien: LienOngletTiersDto | null;
}

export interface LigneRecetteTiersDto {
  id: UUID;
  code: string | null;
  description: string | null;
  date: string | null;
  echeance: string | null;
  reference: string | null;
  aPayer: number | null;
  notes: string | null;
}

export interface LigneDepenseTiersDto {
  id: UUID;
  code: string | null;
  description: string | null;
  date: string | null;
  echeance: string | null;
  societe: string | null;
  statut: string | null;
  montantHt: number | null;
  montantTva: number | null;
  montantTtc: number | null;
  aPayer: number | null;
  notes: string | null;
}

export interface LigneReglementTiersDto {
  id: UUID;
  date: string | null;
  reference: string | null;
  libelle: string | null;
  montant: number | null;
  mode: string | null;
  statut: string | null;
  credit: boolean | null;
  lien: LienOngletTiersDto | null;
}

/** Sans montant ni salaire (règle du spec). */
export interface LigneCongeTiersDto {
  id: UUID;
  code: string | null;
  type: string | null;
  du: string | null;
  au: string | null;
  jours: number | null;
  statut: string | null;
  notes: string | null;
}

export interface LigneHistoriqueStatutTiersDto {
  id: UUID;
  date: string | null;
  statut: string | null;
  article: string | null;
  detail: string | null;
  dossierCode: string | null;
  utilisateur: string | null;
}

export type LigneOngletTiers =
  | LigneProspectionTiersDto
  | LigneDossierTiersDto
  | LigneRecetteTiersDto
  | LigneDepenseTiersDto
  | LigneReglementTiersDto
  | LigneCongeTiersDto
  | LigneHistoriqueStatutTiersDto;
