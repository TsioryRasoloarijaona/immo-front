import { useCallback, useState } from 'react';
import {
  changerStatutDossier,
  getArticle,
  getDossier,
  getEtapesSuivantes,
  getFicheDossier,
  getMontantsDossier,
  listActionsDossier,
  listEcheances,
  listHistoriqueDossier,
  listPiecesJointes,
} from '../../../lib/api';
import { canonicalStatusLabel } from '../../../lib/dossierStatus';
import { toApiDateTime } from '../../../lib/format';
import { useToast } from '../../../lib/toastContext';
import { useApi } from '../../../lib/useApi';

/** Lectures et rechargements d'un dossier, partagés par la page / le dialogue (`FicheDossier`) et la fenêtre. */
export default function useFicheDossier(id: string) {
  const dossier = useApi(() => getDossier(id), [id], 'dossier');
  const fiche = useApi(() => getFicheDossier(id), [id], 'dossier-fiche');
  // Ne pas supprimer : `ArticleCompactPreview` lit `statut`, `tranche*`, `salePrice*`, `titreFoncier`,
  // `adresse`, absents d'`ArticleSummaryDto`. Un appel par article (N+1).
  const articles = dossier.data?.articles;
  const articleIds = (articles ?? []).map((a) => a.id).join(',');
  const articleDetails = useApi(
    () => (articles && articles.length > 0 ? Promise.all(articles.map((a) => getArticle(a.id))) : Promise.resolve([])),
    [articleIds],
    'dossier-articles',
  );
  const nextSteps = useApi(() => getEtapesSuivantes(id), [id], 'dossier-etapes');
  const montants = useApi(() => getMontantsDossier(id), [id], 'dossier-montants');
  const [echeancesPage, setEcheancesPage] = useState(0);
  const echeances = useApi(() => listEcheances(id, { page: echeancesPage, size: 20 }), [id, echeancesPage], 'dossier-echeances');
  const pieces = useApi(() => listPiecesJointes(id), [id], 'dossier-pieces');
  const [historiquePage, setHistoriquePage] = useState(0);
  const historique = useApi(() => listHistoriqueDossier(id, { page: historiquePage, size: 20 }), [id, historiquePage], 'dossier-historique');
  const actions = useApi(() => listActionsDossier(id), [id], 'dossier-actions');
  const showToast = useToast();

  // Les `refetch` de useApi sont stables : la fonction l'est aussi (dépendance d'un effet d'OngletActions).
  const relireActionsListe = actions.refetch;
  const relireFiche = fiche.refetch;
  const relireActions = useCallback(() => {
    void relireActionsListe();
    void relireFiche();
  }, [relireActionsListe, relireFiche]);

  async function relireTout() {
    await Promise.all([dossier.refetch(), fiche.refetch(), montants.refetch(), echeances.refetch(), historique.refetch(), actions.refetch()]);
  }

  async function relireEcheancier() {
    await Promise.all([echeances.refetch(), montants.refetch(), fiche.refetch()]);
  }

  // Sous-articles, acquéreurs et modifications changent prix, remise ou totaux du dossier.
  async function relireDossierEtMontants() {
    await Promise.all([dossier.refetch(), relireEcheancier()]);
  }

  // Un refus (400 champs / pièces, 403 rôle, 409 seuil) remonte à l'onglet Statut qui l'affiche en entier.
  async function changerStatut(newStatus: string, note: string, date?: string, ignorerSeuil?: boolean) {
    await changerStatutDossier(id, { statut: newStatus, note: note || undefined, date: toApiDateTime(date), ignorerSeuil });
    await Promise.all([dossier.refetch(), nextSteps.refetch(), historique.refetch(), montants.refetch(), fiche.refetch()]);
    // Une sortie libère le lot, une réactivation le réoccupe : sa disponibilité change.
    await articleDetails.refetch();
    showToast(`Statut changé : ${canonicalStatusLabel(newStatus)}.`);
  }

  return {
    dossier,
    fiche,
    articleDetails,
    nextSteps,
    montants,
    echeances,
    setEcheancesPage,
    pieces,
    historique,
    setHistoriquePage,
    actions,
    relireActions,
    relireTout,
    relireEcheancier,
    relireDossierEtMontants,
    changerStatut,
  };
}
