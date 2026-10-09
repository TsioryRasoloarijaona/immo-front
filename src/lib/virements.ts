import { API_BASE_URL, signalerSessionExpiree } from './api';
import type {
  Beneficiaire,
  CreerOrdre,
  CreerOrdreGroupe,
  DossierBeneficiaire,
  FiltresOrdres,
  LigneDossier,
  LigneJournal,
  ListeOrdres,
  Meta,
  ModifierOrdre,
  Moi,
  Ordre,
  OrdreGroupeCree,
  PieceAjoutee,
  ResultatImport,
  Societe,
  SocieteSaisie,
  TypeBeneficiaire,
} from '../pages/outils/virements/types';

/** Distinct d'`api.ts` : erreurs `{ erreur }` et non ProblemDetail, aucun cache. En production, Caddy
 * (`forward_auth`) retire le préfixe `/svc/virement` et pose les en-têtes d'identité ; en développement, c'est le
 * proxy de `vite.config.ts`. */
export const BASE_VIREMENT = import.meta.env.DEV ? '/svc/virement' : `${API_BASE_URL}/svc/virement`;

/** `erreur` est le message brut du service ; `message` y ajoute ce qu'impose le code HTTP. */
export class ErreurVirement extends Error {
  status: number;
  erreur: string;
  corps: Record<string, unknown>;
  constructor(status: number, erreur: string, corps: Record<string, unknown> = {}) {
    super(messageSelonCode(status, erreur, corps));
    this.name = 'ErreurVirement';
    this.status = status;
    this.erreur = erreur;
    this.corps = corps;
  }
}

function messageSelonCode(status: number, erreur: string, corps: Record<string, unknown>): string {
  if (status === 0) return erreur;
  if (status === 403) return `Accès refusé : ${erreur}`;
  if (status === 500) {
    const ref = typeof corps.reference === 'string' ? corps.reference : null;
    return ref ? `Erreur technique du service des virements (référence ${ref}).` : 'Erreur technique du service des virements.';
  }
  if (status === 502) return `Erreur technique : ${erreur}. Rien n'a été enregistré.`;
  return erreur;
}

/** Un 403 peut signaler des droits changés en cours de session : `contexte.ts` s'abonne et relit `/moi` (sauf
 * pour un 403 venu de `/moi`). Jamais de déconnexion sur un 403. */
const ecouteursAccesRefuse = new Set<(err: ErreurVirement, chemin: string) => void>();
export function surAccesRefuse(f: (err: ErreurVirement, chemin: string) => void): () => void {
  ecouteursAccesRefuse.add(f);
  return () => ecouteursAccesRefuse.delete(f);
}

type Requete = { methode?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; json?: unknown; formulaire?: FormData };

async function lireErreur(res: Response): Promise<ErreurVirement> {
  let corps: Record<string, unknown> = {};
  try {
    const texte = await res.text();
    const lu: unknown = texte ? JSON.parse(texte) : null;
    if (lu && typeof lu === 'object' && !Array.isArray(lu)) corps = lu as Record<string, unknown>;
  } catch {
    // Corps non JSON : un 502 de Caddy quand le service est arrêté, par exemple.
  }
  return new ErreurVirement(res.status, messageErreur(corps, res.status), corps);
}

function messageErreur(corps: Record<string, unknown>, status: number): string {
  if (typeof corps.erreur === 'string') return corps.erreur;
  if (status === 502) return 'service des virements indisponible';
  return `le service a répondu ${status}`;
}

async function envoyer(chemin: string, r: Requete = {}): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(`${BASE_VIREMENT}${chemin}`, {
      method: r.methode ?? 'GET',
      headers: r.json !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: r.json !== undefined ? JSON.stringify(r.json) : r.formulaire,
      credentials: 'include',
    });
  } catch {
    throw new ErreurVirement(0, 'Impossible de joindre le service des virements. Vérifiez votre connexion.');
  }
  if (res.ok) return res;
  const err = await lireErreur(res);
  if (res.status === 401) signalerSessionExpiree();
  if (res.status === 403) ecouteursAccesRefuse.forEach((f) => f(err, chemin));
  throw err;
}

async function appel<T>(chemin: string, r?: Requete): Promise<T> {
  const res = await envoyer(chemin, r);
  if (res.status === 204) return undefined as T;
  const texte = await res.text();
  return (texte ? JSON.parse(texte) : undefined) as T;
}

function requete(params: Record<string, string | number | undefined>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') usp.set(k, String(v));
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
}

function fichier(f: File, champs: Record<string, string> = {}): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(champs)) fd.append(k, v);
  fd.append('file', f);
  return fd;
}

export const lienPdfOrdre = (id: number, telecharger = false) =>
  `${BASE_VIREMENT}/ordres/${id}/pdf${telecharger ? '?download=1' : ''}`;
export const lienPiece = (id: number) => `${BASE_VIREMENT}/pieces/${id}/fichier`;
/** `version` contourne le cache du navigateur après un remplacement. */
export const lienLogoSociete = (id: number, version?: string) =>
  `${BASE_VIREMENT}/societes/${id}/logo${version ? `?t=${encodeURIComponent(version)}` : ''}`;
export const LIEN_LOGO_DEFAUT = `${BASE_VIREMENT}/societes/logo-defaut`;

export const lireMoi = () => appel<Moi>('/moi');
export const lireMeta = () => appel<Meta>('/meta');
export const lireJournal = (limite: number) => appel<LigneJournal[]>(`/journal${requete({ limite })}`);

export const listerBeneficiaires = () => appel<Beneficiaire[]>('/fournisseurs');
export const listerDossiers = () => appel<LigneDossier[]>('/dossiers');
export const lireDossierBeneficiaire = (id: number) => appel<DossierBeneficiaire>(`/fournisseurs/${id}/dossier`);

/** Upsert sur le nom : `cree` est faux (200 au lieu de 201) quand un nom existant a seulement vu son RIB mis à jour. */
export async function creerBeneficiaire(corps: { nom: string; rib: string; type: TypeBeneficiaire }) {
  const res = await envoyer('/fournisseurs', { methode: 'POST', json: corps });
  return { fiche: (await res.json()) as Beneficiaire, cree: res.status === 201 };
}
export const modifierBeneficiaire = (id: number, corps: { nom: string; rib: string; type: TypeBeneficiaire }) =>
  appel<Beneficiaire>(`/fournisseurs/${id}`, { methode: 'PUT', json: corps });
/** Sans `force`, 409 si le bénéficiaire a des ordres. */
export const supprimerBeneficiaire = (id: number, force = false) =>
  appel<void>(`/fournisseurs/${id}${force ? '?force=1' : ''}`, { methode: 'DELETE' });
export const importerBeneficiaires = (f: File, typeDefaut: TypeBeneficiaire) =>
  appel<ResultatImport>('/fournisseurs/import', { methode: 'POST', formulaire: fichier(f, { type_defaut: typeDefaut }) });

export const listerSocietes = () => appel<Societe[]>('/societes');
export const creerSociete = (corps: SocieteSaisie) => appel<Societe>('/societes', { methode: 'POST', json: corps });
export const modifierSociete = (id: number, corps: SocieteSaisie) =>
  appel<Societe>(`/societes/${id}`, { methode: 'PUT', json: corps });
/** Sans `force`, 409 si la société a émis des ordres ; 409 définitif pour la dernière. */
export const supprimerSociete = (id: number, force = false) =>
  appel<void>(`/societes/${id}${force ? '?force=1' : ''}`, { methode: 'DELETE' });
export const deposerLogo = (id: number, f: File) =>
  appel<Societe>(`/societes/${id}/logo`, { methode: 'POST', formulaire: fichier(f) });
export const retirerLogo = (id: number) => appel<Societe>(`/societes/${id}/logo`, { methode: 'DELETE' });

export const listerOrdres = (f: FiltresOrdres) => appel<ListeOrdres>(`/ordres${requete({ ...f })}`);
export const lireOrdre = (id: number) => appel<Ordre>(`/ordres/${id}`);
/** Un seul appel : le service construit et archive le PDF dans la même transaction. */
export const creerOrdre = (corps: CreerOrdre) => appel<Ordre>('/ordres', { methode: 'POST', json: corps });
export const creerOrdreGroupe = (corps: CreerOrdreGroupe) =>
  appel<OrdreGroupeCree>('/ordres/groupe', { methode: 'POST', json: corps });
export const modifierOrdre = (id: number, corps: ModifierOrdre) =>
  appel<Ordre>(`/ordres/${id}`, { methode: 'PATCH', json: corps });
/** `force=1` toujours : sans lui le service répond un 409 volontaire ; la confirmation est faite à l'écran avant. */
export const supprimerOrdre = (id: number) => appel<void>(`/ordres/${id}?force=1`, { methode: 'DELETE' });
export const regenererPdf = (id: number) => appel<Ordre>(`/ordres/${id}/pdf`, { methode: 'POST' });

export const ajouterPiece = (ordreId: number, f: File, type: string) =>
  appel<PieceAjoutee>(`/ordres/${ordreId}/pieces`, { methode: 'POST', formulaire: fichier(f, { type }) });
/** `null` efface le montant. Rend l'ordre décoré. */
export const modifierMontantPiece = (id: number, montant: number | null) =>
  appel<Ordre>(`/pieces/${id}`, { methode: 'PATCH', json: { montant } });
export const supprimerPiece = (id: number) => appel<Ordre>(`/pieces/${id}`, { methode: 'DELETE' });
