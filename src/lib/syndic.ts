import { BASE_VIREMENT, appel, requete } from './virements';
import type {
  Appartement,
  AppartementCree,
  Appel,
  ExerciceOuvert,
  FiltresPaiements,
  GroupeReglages,
  InfosAppartement,
  ListeExercices,
  ListePaiements,
  PaiementEnregistre,
  PeriodeSaisie,
  Phrase,
  Proprietaire,
  ProprietaireEnregistre,
  ProprietaireSaisi,
  PropositionExercice,
  ReglagesSyndic,
  SaisiePaiement,
  Situation,
  TableauDeBord,
} from '../pages/outils/syndic/types';

/** Le module syndic vit dans le même service que les virements (`/svc/virement/syndic/...`) : même passerelle,
 * mêmes rôles, mêmes erreurs (`ErreurVirement`, `corps` porte les champs en plus d'un 400 / 409). */

export const lireExercicesSyndic = () => appel<ListeExercices>('/syndic/exercices');
export const lireTableauDeBordSyndic = (exercice?: string) =>
  appel<TableauDeBord>(`/syndic/tableau-de-bord${requete({ exercice })}`);
export const listerAppartementsSyndic = (exercice?: string) =>
  appel<Appartement[]>(`/syndic/appartements${requete({ exercice })}`);
export const lireAppartementSyndic = (code: string) => appel<Appartement>(`/syndic/appartements/${encodeURIComponent(code)}`);
export const lireQuiDoit = () => appel<Appel[]>('/syndic/qui-doit');
export const listerPaiementsSyndic = (f: FiltresPaiements) => appel<ListePaiements>(`/syndic/paiements${requete({ ...f })}`);

/** Un seul appel : paiement(s), reçu et PDF dans la même transaction. 409 `confirmation_requise` sur un dépassement. */
export const enregistrerPaiementSyndic = (corps: SaisiePaiement) =>
  appel<PaiementEnregistre>('/syndic/paiements', { methode: 'POST', json: corps });

/** Tout utilisateur du syndic, motif obligatoire. `delta` en dirhams, signé ; le reçu d'origine ne change pas. */
export const corrigerPaiementSyndic = (id: string, delta: number, motif: string) =>
  appel<{ phrase: string; paiement: string; situation: Situation }>(`/syndic/paiements/${encodeURIComponent(id)}/corrections`, {
    methode: 'POST',
    json: { delta, motif },
  });

/** Tout utilisateur du syndic, motif obligatoire. Un reçu groupé s'annule en entier. */
export const annulerPaiementSyndic = (id: string, motif: string) =>
  appel<{ phrase: string; recu: string | null; annules: string[] }>(`/syndic/paiements/${encodeURIComponent(id)}/annulation`, {
    methode: 'POST',
    json: { motif },
  });

// Référentiel (GUIDE §16.6–16.9) : aucune suppression ; réglages réservés aux administrateurs (403 sinon).
const enc = encodeURIComponent;

export const creerAppartementSyndic = (code: string, numeroDossier: string) =>
  appel<AppartementCree>('/syndic/appartements', { methode: 'POST', json: { code, numero_dossier: numeroDossier || null } });
export const modifierAppartementSyndic = (code: string, infos: InfosAppartement) =>
  appel<Phrase>(`/syndic/appartements/${enc(code)}`, { methode: 'PATCH', json: infos });
export const rattacherProprietaireSyndic = (code: string, proprietaireId: string) =>
  appel<Phrase>(`/syndic/appartements/${enc(code)}/proprietaires`, { methode: 'POST', json: { proprietaire_id: proprietaireId } });
export const deplacerProprietaireSyndic = (code: string, proprietaireId: string, sens: 'monter' | 'descendre') =>
  appel<Phrase>(`/syndic/appartements/${enc(code)}/proprietaires/${enc(proprietaireId)}/deplacement`, { methode: 'POST', json: { sens } });

export const listerProprietairesSyndic = () => appel<Proprietaire[]>('/syndic/proprietaires');
export const lireProprietaireSyndic = (id: string) => appel<Proprietaire>(`/syndic/proprietaires/${enc(id)}`);
/** `appartement` : code du lot auquel le rattacher dans la foulée. */
export const creerProprietaireSyndic = (corps: ProprietaireSaisi, appartement?: string) =>
  appel<ProprietaireEnregistre>('/syndic/proprietaires', { methode: 'POST', json: { ...corps, appartement } });
export const modifierProprietaireSyndic = (id: string, corps: ProprietaireSaisi) =>
  appel<ProprietaireEnregistre>(`/syndic/proprietaires/${enc(id)}`, { methode: 'PATCH', json: corps });

/** Sans `appartement` : tous les lots actifs. Les valeurs absentes prennent les défauts du service. */
export const proposerExerciceSyndic = (p: { appartement?: string; debut?: string; duree_mois?: string; tarif_mensuel?: string }) =>
  appel<PropositionExercice>(`/syndic/exercices/proposition${requete(p)}`);
export const ouvrirExerciceSyndic = (cible: { appartement: string } | { tous: true }, periode: PeriodeSaisie) =>
  appel<ExerciceOuvert>('/syndic/exercices', { methode: 'POST', json: { ...cible, ...periode } });
export const modifierExerciceSyndic = (id: string, periode: PeriodeSaisie) =>
  appel<Phrase>(`/syndic/exercices/${enc(id)}`, { methode: 'PATCH', json: periode });

export const lireReglagesSyndic = () => appel<ReglagesSyndic>('/syndic/reglages');
export const enregistrerReglagesSyndic = (groupe: GroupeReglages, valeurs: Record<string, string>) =>
  appel<Phrase & { reglages: ReglagesSyndic }>(`/syndic/reglages/${groupe}`, { methode: 'PATCH', json: valeurs });

/** `chemin` : le `recu.pdf` rendu par le service (`/syndic/recus/REC-…/pdf`). */
export const lienPdfService = (chemin: string, telecharger = false) => `${BASE_VIREMENT}${chemin}${telecharger ? '?download=1' : ''}`;
export const lienRecuSyndic = (numero: string, telecharger = false) =>
  lienPdfService(`/syndic/recus/${encodeURIComponent(numero)}/pdf`, telecharger);
