import type { BadgeTone } from '../types';
import type { DocumentAchatListItemDto } from '../types/achat';

export interface EtatFiltresAchat {
  natures: string[];
  statutIds: string[];
  projetIds: string[];
  fournisseurId: string | null;
  du: string;
  au: string;
  nonSoldes: boolean;
  okPourPaiement: boolean;
  search: string;
}

export const FILTRES_ACHAT_VIDES: EtatFiltresAchat = {
  natures: [],
  statutIds: [],
  projetIds: [],
  fournisseurId: null,
  du: '',
  au: '',
  nonSoldes: false,
  okPourPaiement: false,
  search: '',
};

type Statutee = Pick<DocumentAchatListItemDto, 'statutCode' | 'statutDescription' | 'okPourPaiement'>;

/** Ton du badge d'un statut : validé pour paiement = succès, annulé = alerte, clôturé = neutre, sinon en cours. */
export function tonStatutAchat(d: Statutee): BadgeTone {
  const code = (d.statutCode ?? '').toUpperCase();
  if (code.startsWith('ANNUL')) return 'warning';
  if (code.startsWith('CLOT') || code.startsWith('CLÔT')) return 'neutral';
  if (d.okPourPaiement) return 'success';
  return d.statutCode ? 'progress' : 'neutral';
}

export function libelleStatutAchat(d: Statutee): string {
  return d.statutDescription ?? d.statutCode ?? 'Sans statut';
}

/** Une nature hors liste est rendue telle quelle. */
export function libelleNatureAchat(d: Pick<DocumentAchatListItemDto, 'nature' | 'natureLibelle'>): string {
  return d.natureLibelle ?? d.nature ?? '';
}

export function intituleDocumentAchat(d: Pick<DocumentAchatListItemDto, 'code' | 'reference' | 'nature' | 'natureLibelle'>): string {
  return [libelleNatureAchat(d), d.code ?? d.reference].filter(Boolean).join(' ');
}
