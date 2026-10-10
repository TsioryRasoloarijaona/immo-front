import { BASE_VIREMENT, appel, requete } from './virements';
import type {
  Appartement,
  Appel,
  FiltresPaiements,
  ListeExercices,
  ListePaiements,
  PaiementEnregistre,
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

/** Administrateurs du service. `delta` en dirhams, signé ; le reçu d'origine ne change pas. */
export const corrigerPaiementSyndic = (id: string, delta: number, motif: string) =>
  appel<{ phrase: string; paiement: string; situation: Situation }>(`/syndic/paiements/${encodeURIComponent(id)}/corrections`, {
    methode: 'POST',
    json: { delta, motif },
  });

/** Administrateurs du service. Un reçu groupé s'annule en entier. */
export const annulerPaiementSyndic = (id: string, motif: string) =>
  appel<{ phrase: string; recu: string | null; annules: string[] }>(`/syndic/paiements/${encodeURIComponent(id)}/annulation`, {
    methode: 'POST',
    json: { motif },
  });

/** `chemin` : le `recu.pdf` rendu par le service (`/syndic/recus/REC-…/pdf`). */
export const lienPdfService = (chemin: string, telecharger = false) => `${BASE_VIREMENT}${chemin}${telecharger ? '?download=1' : ''}`;
export const lienRecuSyndic = (numero: string, telecharger = false) =>
  lienPdfService(`/syndic/recus/${encodeURIComponent(numero)}/pdf`, telecharger);
