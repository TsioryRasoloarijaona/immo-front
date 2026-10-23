import { API_BASE_URL, openStoredFileInTab, postMultipart, request } from './api';
import { exporterListe } from './export';
import type { PieceJointeDto, ReferentielItemDto, UUID } from '../types';
import type {
  ChampObligatoire,
  DemandeTransitionEtudeDto,
  HistoriqueStatutEtudeDto,
  StatutEtudeConfigDto,
  TransitionEtudeConfigDto,
  TransitionPossibleDto,
  ApercuTresorerieDto,
  BilanFaisabilitePrevisionsDto,
  CategorieBilanDto,
  EcheancierDemandeDto,
  FinancementFaisabiliteDto,
  RemboursementFaisabiliteDto,
  SaisiePrevisionDto,
  TresorerieFaisabiliteDto,
  EtudeFaisabiliteDto,
  EtudeFaisabiliteListeDto,
  FiltresEtudes,
  LigneTrancheEtudeDto,
  LigneUniteEtudeDto,
  SaisieEtudeDto,
  ValeursFaisabilite,
} from '../types/faisabilite';

// Études de faisabilité (FEATURE-patrimoine-faisabilite.md) : lecture Administrateur + Direction Générale (403 sinon),
// écriture Administrateur ; 400 Verif / 409 « Étude bloquée » en ProblemDetail (`ApiError.message` = `detail`).

const RACINE = '/api/etudes-faisabilite';

export function listEtudesFaisabilite(filtres: FiltresEtudes = {}): Promise<EtudeFaisabiliteListeDto[]> {
  return request('GET', RACINE, { query: { ...filtres } });
}

export function getEtudeFaisabilite(id: UUID): Promise<EtudeFaisabiliteDto> {
  return request('GET', `${RACINE}/${id}`);
}

/** Aperçu sans écriture : valeurs calculées + messages Verif dans `erreurs`. */
export function calculerEtude(body: SaisieEtudeDto): Promise<ValeursFaisabilite> {
  return request('POST', `${RACINE}/calcul`, { body, lecture: true });
}

/** Articles de nature TER visibles. */
export function listTerrainsEtude(): Promise<ReferentielItemDto[]> {
  return request('GET', `${RACINE}/choix/terrains`);
}

/** Tranches du patrimoine de la société de l'étude. */
export function listTranchesEtude(societeId: UUID): Promise<ReferentielItemDto[]> {
  return request('GET', `${RACINE}/choix/tranches`, { query: { societeId } });
}

/** 409 code pris ; 400 société inactive, terrain non TER. */
export function createEtudeFaisabilite(body: SaisieEtudeDto): Promise<EtudeFaisabiliteDto> {
  return request('POST', RACINE, { body });
}

/** 400 Verif sur les grilles enregistrées ; 409 bloquée ou code pris. */
export function updateEtudeFaisabilite(id: UUID, body: SaisieEtudeDto): Promise<EtudeFaisabiliteDto> {
  return request('PATCH', `${RACINE}/${id}`, { body });
}

/** 409 si bloquée, ou avec prévisions / financements. */
export function deleteEtudeFaisabilite(id: UUID): Promise<void> {
  return request('DELETE', `${RACINE}/${id}`);
}

/** Liste complète ; une unité retirée perd ses ventilations. */
export function remplacerUnitesEtude(id: UUID, lignes: LigneUniteEtudeDto[]): Promise<LigneUniteEtudeDto[]> {
  return request('PUT', `${RACINE}/${id}/unites`, { body: { lignes } });
}

/** Liste complète, ventilations comprises ; 409 code de tranche en double. */
export function remplacerTranchesEtude(id: UUID, lignes: LigneTrancheEtudeDto[]): Promise<LigneTrancheEtudeDto[]> {
  return request('PUT', `${RACINE}/${id}/tranches`, { body: { lignes } });
}

/** Bloquer = enregistrer : 400 Verif possible ; 409 déjà bloquée. */
export function bloquerEtude(id: UUID): Promise<EtudeFaisabiliteDto> {
  return request('POST', `${RACINE}/${id}/bloquer`);
}

export function debloquerEtude(id: UUID): Promise<EtudeFaisabiliteDto> {
  return request('POST', `${RACINE}/${id}/debloquer`);
}

// ------------------------------------------------------------------ P8b-1 (FEATURE-patrimoine-faisabilite-workflow.md §1-2)

export function listFinancementsEtude(id: UUID): Promise<FinancementFaisabiliteDto[]> {
  return request('GET', `${RACINE}/${id}/financements`);
}

/** Liste complète, remboursements imbriqués ; 400 négatif / date absente ; 409 bloquée. */
export function remplacerFinancementsEtude(id: UUID, lignes: FinancementFaisabiliteDto[]): Promise<FinancementFaisabiliteDto[]> {
  return request('PUT', `${RACINE}/${id}/financements`, { body: { lignes } });
}

/** Bouton « Générer » (Administrateur) : n'écrit rien. */
export function genererEcheancier(id: UUID, body: EcheancierDemandeDto): Promise<RemboursementFaisabiliteDto[]> {
  return request('POST', `${RACINE}/${id}/financements/echeancier`, { body, lecture: true });
}

export function getPrevisionsEtude(id: UUID): Promise<BilanFaisabilitePrevisionsDto> {
  return request('GET', `${RACINE}/${id}/previsions`);
}

/** Liste complète des lignes saisies ; 400 avec message OMRAN ; 409 bloquée. */
export function remplacerPrevisionsEtude(id: UUID, lignes: SaisiePrevisionDto[]): Promise<BilanFaisabilitePrevisionsDto> {
  return request('PUT', `${RACINE}/${id}/previsions`, { body: { lignes } });
}

/** Aperçu sans écriture. */
export function calculerPrevisionsEtude(id: UUID, lignes: SaisiePrevisionDto[]): Promise<BilanFaisabilitePrevisionsDto> {
  return request('POST', `${RACINE}/${id}/previsions/calcul`, { body: { lignes }, lecture: true });
}

/** Catégories sélectionnables (hors « sans prévision »). */
export function listCategoriesBilan(): Promise<CategorieBilanDto[]> {
  return request('GET', `${RACINE}/choix/categories-bilan`);
}

export function getTresorerieEtude(id: UUID, avecFinancement = true): Promise<TresorerieFaisabiliteDto> {
  return request('GET', `${RACINE}/${id}/tresorerie`, { query: { avecFinancement } });
}

/** Aperçu avec d'autres écarts-types ; 400 écart-type hors bornes. */
export function calculerTresorerieEtude(id: UUID, body: ApercuTresorerieDto): Promise<TresorerieFaisabiliteDto> {
  return request('POST', `${RACINE}/${id}/tresorerie/calcul`, { body, lecture: true });
}

// ------------------------------------------------------------------ P8b-2 (FEATURE-patrimoine-faisabilite-workflow.md §4-7)

export function listTransitionsEtude(id: UUID): Promise<TransitionPossibleDto[]> {
  return request('GET', `${RACINE}/${id}/transitions`);
}

/** 409 bloquée ou transition non permise (`problem.transitionsAutorisees`) ; 400 champs / documents / statut ; 404. */
export function executerTransitionEtude(id: UUID, body: DemandeTransitionEtudeDto): Promise<EtudeFaisabiliteDto> {
  return request('POST', `${RACINE}/${id}/transitions`, { body });
}

export function listHistoriqueEtude(id: UUID): Promise<HistoriqueStatutEtudeDto[]> {
  return request('GET', `${RACINE}/${id}/historique`);
}

export function listPiecesJointesEtude(id: UUID): Promise<PieceJointeDto[]> {
  return request('GET', `${RACINE}/${id}/pieces-jointes`);
}

/** Administrateur ; 409 bloquée ; `typeId` = type de document exigé par une transition. */
export function deposerPieceJointeEtude(id: UUID, file: File, typeId?: UUID, description?: string): Promise<PieceJointeDto> {
  return postMultipart<PieceJointeDto>(`${RACINE}/${id}/pieces-jointes`, file, { description, typeId });
}

/** Administrateur ; 409 bloquée. */
export function supprimerPieceJointeEtude(id: UUID, pieceId: UUID): Promise<void> {
  return request('DELETE', `${RACINE}/${id}/pieces-jointes/${pieceId}`);
}

export function ouvrirPieceJointeEtude(id: UUID, pieceId: UUID): void {
  openStoredFileInTab(`${API_BASE_URL}${RACINE}/${id}/pieces-jointes/${pieceId}/fichier`);
}

/** 11 feuilles, étude bloquée comprise. */
export function exporterEtude(id: UUID, code: string): Promise<void> {
  return exporterListe(`${RACINE}/${id}/export.xlsx`, {}, `etude-${code}`);
}

const CONFIG = '/api/config-faisabilite';

export function listStatutsEtudeConfig(): Promise<StatutEtudeConfigDto[]> {
  return request('GET', `${CONFIG}/statuts`);
}

/** 400 champ absent / inconnu ; 409 code pris. */
export function creerStatutEtude(body: StatutEtudeConfigDto): Promise<StatutEtudeConfigDto> {
  return request('POST', `${CONFIG}/statuts`, { body });
}

export function modifierStatutEtude(id: UUID, body: StatutEtudeConfigDto): Promise<StatutEtudeConfigDto> {
  return request('PATCH', `${CONFIG}/statuts/${id}`, { body });
}

/** 409 si porté par une étude, une transition ou l'historique. */
export function supprimerStatutEtude(id: UUID): Promise<void> {
  return request('DELETE', `${CONFIG}/statuts/${id}`);
}

export function listTransitionsEtudeConfig(): Promise<TransitionEtudeConfigDto[]> {
  return request('GET', `${CONFIG}/transitions`);
}

/** 400 « Le statut de départ et le statut d'arrivé doivent être différents! » ou référence inconnue ; 409 doublon. */
export function creerTransitionEtude(body: TransitionEtudeConfigDto): Promise<TransitionEtudeConfigDto> {
  return request('POST', `${CONFIG}/transitions`, { body });
}

export function modifierTransitionEtude(id: UUID, body: TransitionEtudeConfigDto): Promise<TransitionEtudeConfigDto> {
  return request('PATCH', `${CONFIG}/transitions/${id}`, { body });
}

export function supprimerTransitionEtude(id: UUID): Promise<void> {
  return request('DELETE', `${CONFIG}/transitions/${id}`);
}

export function listChampsObligatoiresEtude(): Promise<ChampObligatoire[]> {
  return request('GET', `${CONFIG}/champs-obligatoires`);
}

export function listTypesEtatEtude(): Promise<ReferentielItemDto[]> {
  return request('GET', `${CONFIG}/choix/types-etat`);
}
