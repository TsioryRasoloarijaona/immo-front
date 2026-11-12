import type { BadgeTone } from '../types';
import type {
  ChampDateAchat,
  DocumentAchatListItemDto,
  FiltresDocumentsAchat,
  ModuleAchat,
  NatureDocumentAchat,
} from '../types/achat';
import { plagePeriode } from './periodes';

export type TroisEtats = 'tous' | 'oui' | 'non';

/** Tous les filtres de la liste vivent dans l'URL (liens de menu, retour de fiche). */
export interface EtatFiltresAchat {
  natures: string[];
  statutIds: string[];
  projetIds: string[];
  societeIds: string[];
  typeLotIds: string[];
  modules: string[];
  fournisseurId: string | null;
  du: string;
  au: string;
  champDate: ChampDateAchat;
  dateRenseignee: boolean;
  archive: TroisEtats;
  comptabilise: TroisEtats;
  montantDe: string;
  montantA: string;
  nonSoldes: boolean;
  okPourPaiement: boolean;
  search: string;
}

function troisEtats(valeur: string | null): TroisEtats {
  return valeur === 'oui' || valeur === 'non' ? valeur : 'tous';
}

/**
 * Sans période dans l'URL : « Le mois en cours », sauf pour un lien existant (natures, nonSoldes…) qui ouvre sur « Toutes les dates ».
 * `du=` vide dans l'URL = choix explicite de « Toutes les dates ».
 */
export function etatDepuisUrl(params: URLSearchParams, naturesVue?: NatureDocumentAchat[]): EtatFiltresAchat {
  const explicite = params.has('du') || params.has('au') || params.get('dateRenseignee') === 'true';
  const lienExistant = ['natures', 'nonSoldes', 'okPourPaiement', 'fournisseurId'].some((cle) => params.has(cle));
  const defaut = explicite || lienExistant ? { debut: '', fin: '' } : plagePeriode('mois');
  return {
    natures: naturesVue ?? params.getAll('natures'),
    statutIds: params.getAll('statutIds'),
    projetIds: params.getAll('projetIds'),
    societeIds: params.getAll('societeIds'),
    typeLotIds: params.getAll('typeLotIds'),
    modules: params.getAll('modules'),
    fournisseurId: params.get('fournisseurId'),
    du: params.get('du') ?? defaut.debut,
    au: params.get('au') ?? defaut.fin,
    champDate: params.get('champDate') === 'ECHEANCE' ? 'ECHEANCE' : 'DATE_PIECE',
    dateRenseignee: params.get('dateRenseignee') === 'true',
    archive: troisEtats(params.get('archive')),
    comptabilise: troisEtats(params.get('comptabilise')),
    montantDe: params.get('montantDe') ?? '',
    montantA: params.get('montantA') ?? '',
    nonSoldes: params.get('nonSoldes') === 'true',
    okPourPaiement: params.get('okPourPaiement') === 'true',
    search: params.get('search') ?? '',
  };
}

/** Écrit un changement de filtres dans l'URL ; `du` / `au` restent même vides (« Toutes les dates »). */
export function appliquerFiltres(params: URLSearchParams, patch: Partial<EtatFiltresAchat>): URLSearchParams {
  const suivant = new URLSearchParams(params);
  for (const [cle, valeur] of Object.entries(patch)) {
    suivant.delete(cle);
    if (Array.isArray(valeur)) valeur.forEach((v) => suivant.append(cle, v));
    else if (cle === 'du' || cle === 'au' || (valeur && valeur !== 'tous' && valeur !== 'DATE_PIECE')) suivant.set(cle, String(valeur));
  }
  return suivant;
}

function liste<T extends string>(valeurs: string[]): T[] | undefined {
  return valeurs.length > 0 ? (valeurs as T[]) : undefined;
}

function oui(valeur: TroisEtats): boolean | undefined {
  return valeur === 'tous' ? undefined : valeur === 'oui';
}

function montant(texte: string): number | undefined {
  const n = Number.parseFloat(texte);
  return Number.isNaN(n) ? undefined : n;
}

export function filtresServeur(e: EtatFiltresAchat, recherche: string): FiltresDocumentsAchat {
  return {
    natures: liste<NatureDocumentAchat>(e.natures),
    statutIds: liste(e.statutIds),
    projetIds: liste(e.projetIds),
    societeIds: liste(e.societeIds),
    typeLotIds: liste(e.typeLotIds),
    modules: liste<ModuleAchat>(e.modules),
    fournisseurId: e.fournisseurId ?? undefined,
    du: e.du || undefined,
    au: e.au || undefined,
    champDate: e.champDate,
    dateRenseignee: e.dateRenseignee || undefined,
    archive: oui(e.archive),
    comptabilise: oui(e.comptabilise),
    montantDe: montant(e.montantDe),
    montantA: montant(e.montantA),
    nonSoldes: e.nonSoldes || undefined,
    okPourPaiement: e.okPourPaiement || undefined,
    search: recherche || undefined,
  };
}

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
