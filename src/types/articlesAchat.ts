// Miroir des DTO de FEATURE-n8-nomenclature.md (/api/achat/config/articles). Ratios tels que stockés (0,2 = 20 %).
import type { UUID } from '../types';

export interface ArticleAchatDto {
  id: UUID;
  code: string;
  description: string;
  categorieComptableId: UUID;
  categorieComptableCode: string | null;
  familleId: UUID | null;
  familleCode: string | null;
  sousFamilleId: UUID;
  sousFamilleCode: string | null;
  unite: string | null;
  prixUnitaireHT: number;
  fodec: number;
  coutLogistiqueHT: number;
  coutLogistiqueTva: number;
  coutIndirectHT: number;
  coutIndirectTva: number;
  coutFinancierHT: number;
  coutFinancierTva: number;
  prixVenteHT: number;
  venteTva: number;
  notes: string | null;
}

/** Création : fiche complète ; modification : champ absent ou null = inchangé. */
export interface ArticleAchatEcritureDto {
  code?: string | null;
  description?: string | null;
  categorieComptableId?: UUID | null;
  familleId?: UUID | null;
  sousFamilleId?: UUID | null;
  unite?: string | null;
  prixUnitaireHT?: number | null;
  fodec?: number | null;
  coutLogistiqueHT?: number | null;
  coutLogistiqueTva?: number | null;
  coutIndirectHT?: number | null;
  coutIndirectTva?: number | null;
  coutFinancierHT?: number | null;
  coutFinancierTva?: number | null;
  prixVenteHT?: number | null;
  venteTva?: number | null;
  notes?: string | null;
}

export interface ArticlesAchatDto {
  articles: ArticleAchatDto[];
  peutEcrire: boolean;
  peutSupprimer: boolean;
  peutExporter: boolean;
}

export interface SousFamilleAchatDto {
  id: UUID;
  code: string;
  description: string;
  familleId: UUID;
  familleCode: string;
  familleDescription: string;
}
