// Endpoints de FEATURE-n6-demandes-achat.md : 404 inconnue ou hors périmètre, 403 droit, 400 champ, 409 règle.
import { postMultipart, request } from './api';
import type { UUID } from '../types';
import type { BordereauSaisieDto } from '../types/projet';
import type {
  BonCommandeDemandeAchat,
  DemandeAchatFiche,
  DemandeAchatLigne,
  ExecutionTransitionDemandeAchat,
  FiltresDemandesAchat,
  FournisseurDemandeAchat,
  HistoriqueDemandeAchat,
  ImportOffreDemandeAchat,
  ModaliteDemandeAchat,
  OffreDemandeAchat,
  PrixLigneOffre,
  SaisieDemandeAchat,
  SaisieDemandeAchatLot,
  SaisieFournisseurDemandeAchat,
  TransitionDemandeAchat,
} from '../types/demandesAchat';

const DEMANDES = '/api/achat/demandes-achat';

export function getDemandesAchat(filtres: FiltresDemandesAchat = {}): Promise<DemandeAchatLigne[]> {
  return request('GET', DEMANDES, { query: { ...filtres } });
}

/** Chemin de l'export `.xlsx` (mêmes filtres que la liste). */
export function cheminExportDemandesAchat(): string {
  return `${DEMANDES}/export`;
}

export function getDemandeAchat(id: UUID): Promise<DemandeAchatFiche> {
  return request('GET', `${DEMANDES}/${id}`);
}

export function creerDemandeAchat(body: SaisieDemandeAchat): Promise<DemandeAchatFiche> {
  return request('POST', DEMANDES, { body });
}

export function modifierDemandeAchat(id: UUID, body: SaisieDemandeAchat): Promise<DemandeAchatFiche> {
  return request('PUT', `${DEMANDES}/${id}`, { body });
}

export function supprimerDemandeAchat(id: UUID): Promise<void> {
  return request('DELETE', `${DEMANDES}/${id}`);
}

export function getTransitionsDemandeAchat(id: UUID): Promise<TransitionDemandeAchat[]> {
  return request('GET', `${DEMANDES}/${id}/transitions`);
}

/** 409 : corps avec `transitionsAutorisees` ; renvoie la fiche relue. */
export function executerTransitionDemandeAchat(id: UUID, body: ExecutionTransitionDemandeAchat): Promise<DemandeAchatFiche> {
  return request('POST', `${DEMANDES}/${id}/transitions`, { body });
}

export function getHistoriqueDemandeAchat(id: UUID): Promise<HistoriqueDemandeAchat[]> {
  return request('GET', `${DEMANDES}/${id}/historique`);
}

// ------------------------------------------------------------------ N6b : onglets de la fiche

export function getFournisseursDemandeAchat(id: UUID): Promise<FournisseurDemandeAchat[]> {
  return request('GET', `${DEMANDES}/${id}/fournisseurs`);
}

export function ajouterFournisseurDemandeAchat(id: UUID, body: SaisieFournisseurDemandeAchat): Promise<FournisseurDemandeAchat> {
  return request('POST', `${DEMANDES}/${id}/fournisseurs`, { body });
}

export function modifierFournisseurDemandeAchat(
  id: UUID,
  fid: UUID,
  body: SaisieFournisseurDemandeAchat,
): Promise<FournisseurDemandeAchat> {
  return request('PUT', `${DEMANDES}/${id}/fournisseurs/${fid}`, { body });
}

export function supprimerFournisseurDemandeAchat(id: UUID, fid: UUID): Promise<void> {
  return request('DELETE', `${DEMANDES}/${id}/fournisseurs/${fid}`);
}

export function ecarterFournisseurDemandeAchat(id: UUID, fid: UUID): Promise<FournisseurDemandeAchat> {
  return request('POST', `${DEMANDES}/${id}/fournisseurs/${fid}/ecarter`);
}

export function reactiverFournisseurDemandeAchat(id: UUID, fid: UUID): Promise<FournisseurDemandeAchat> {
  return request('POST', `${DEMANDES}/${id}/fournisseurs/${fid}/reactiver`);
}

export function getOffresDemandeAchat(id: UUID): Promise<OffreDemandeAchat[]> {
  return request('GET', `${DEMANDES}/${id}/offres`);
}

export function creerOffreDemandeAchat(id: UUID, body: { fournisseurId: UUID }): Promise<OffreDemandeAchat> {
  return request('POST', `${DEMANDES}/${id}/offres`, { body });
}

export function modifierOffreDemandeAchat(id: UUID, oid: UUID, lignes: PrixLigneOffre[]): Promise<OffreDemandeAchat> {
  return request('PUT', `${DEMANDES}/${id}/offres/${oid}`, { body: lignes });
}

export function supprimerOffreDemandeAchat(id: UUID, oid: UUID): Promise<void> {
  return request('DELETE', `${DEMANDES}/${id}/offres/${oid}`);
}

/** 409 `code = OFFRE_LA_PLUS_DISANTE` tant que `confirme` est faux sur l'offre la plus chère. */
export function selectionnerOffreDemandeAchat(id: UUID, oid: UUID, confirme = false): Promise<DemandeAchatFiche> {
  return request('POST', `${DEMANDES}/${id}/offres/${oid}/selection${confirme ? '?confirme=true' : ''}`);
}

export function importerOffreDemandeAchat(id: UUID, oid: UUID, fichier: File): Promise<ImportOffreDemandeAchat> {
  return postMultipart(`${DEMANDES}/${id}/offres/${oid}/import`, fichier);
}

/** Vide aussi le bordereau de la demande (jamais celui du lot). */
export function deselectionnerOffreDemandeAchat(id: UUID): Promise<DemandeAchatFiche> {
  return request('DELETE', `${DEMANDES}/${id}/offres/selection`);
}

/** Offres non écartées ; 409 hors phases offres / sélection. */
export function getComparaisonDemandeAchat(id: UUID): Promise<OffreDemandeAchat[]> {
  return request('GET', `${DEMANDES}/${id}/comparaison`);
}

export function getModalitesDemandeAchat(id: UUID): Promise<ModaliteDemandeAchat[]> {
  return request('GET', `${DEMANDES}/${id}/modalites`);
}

export function ajouterModaliteDemandeAchat(id: UUID, body: ModaliteDemandeAchat): Promise<ModaliteDemandeAchat> {
  return request('POST', `${DEMANDES}/${id}/modalites`, { body });
}

export function supprimerModaliteDemandeAchat(id: UUID, mid: UUID): Promise<void> {
  return request('DELETE', `${DEMANDES}/${id}/modalites/${mid}`);
}

/** Taux de TVA / FODEC en pourcentage, comme le bordereau d'un lot. */
export function getBordereauDemandeAchat(id: UUID): Promise<BordereauSaisieDto> {
  return request('GET', `${DEMANDES}/${id}/bordereau`);
}

export function enregistrerBordereauDemandeAchat(id: UUID, body: BordereauSaisieDto): Promise<BordereauSaisieDto> {
  return request('PUT', `${DEMANDES}/${id}/bordereau`, { body });
}

export function importerBordereauDemandeAchat(id: UUID, fichier: File): Promise<BordereauSaisieDto> {
  return postMultipart(`${DEMANDES}/${id}/bordereau/import`, fichier);
}

export function cheminExportBordereauDemandeAchat(id: UUID): string {
  return `${DEMANDES}/${id}/bordereau/export`;
}

export function getBonsCommandeDemandeAchat(id: UUID): Promise<BonCommandeDemandeAchat[]> {
  return request('GET', `${DEMANDES}/${id}/bons-commande`);
}

/** Nouvelle demande (201) ; 409 si le statut n'est pas de type Annulation. */
export function renouvelerDemandeAchat(id: UUID): Promise<DemandeAchatFiche> {
  return request('POST', `${DEMANDES}/${id}/renouvellement`);
}

export function creerDemandeAchatDepuisLot(lotId: UUID, body: SaisieDemandeAchatLot): Promise<DemandeAchatFiche> {
  return request('POST', `/api/projet/lots/${lotId}/demandes-achat`, { body });
}
