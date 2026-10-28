import type { OngletFiche } from '../../FicheShell';
import OngletAcquereurs from '../onglets/OngletAcquereurs';
import OngletActions from '../onglets/OngletActions';
import OngletArticles from '../onglets/OngletArticles';
import OngletCadeaux from '../onglets/OngletCadeaux';
import OngletDocumentsGeneres from '../onglets/OngletDocumentsGeneres';
import OngletEcheancier from '../onglets/OngletEcheancier';
import OngletHistorique from '../onglets/OngletHistorique';
import OngletModifications from '../onglets/OngletModifications';
import OngletPiecesJointes from '../onglets/OngletPiecesJointes';
import OngletStatut from '../onglets/OngletStatut';
import type { DossierDetailDto } from '../../../types';
import type useFicheDossier from './useFicheDossier';

export type DonneesFicheDossier = ReturnType<typeof useFicheDossier>;

/** Onglets à grille ou à action du dossier, communs à la page / au dialogue et à la fenêtre (chacun choisit l'ordre). */
export default function ongletsDossier(f: DonneesFicheDossier, d: DossierDetailDto, fromCreation: boolean) {
  const { fiche, echeances, actions, pieces, historique } = f;
  return {
    statut: {
      id: 'statut',
      libelle: 'Statut',
      contenu: <OngletStatut dossier={d} fiche={fiche.data} etapesSuivantes={f.nextSteps.data ?? []} erreurEtapes={f.nextSteps.error} onConfirm={f.changerStatut} />,
    },
    financier: {
      id: 'financier',
      libelle: 'Schéma de financement',
      compteur: echeances.data?.totalElements ?? 0,
      contenu: <OngletEcheancier dossier={d} echeances={echeances} onPageChange={f.setEcheancesPage} onChanged={f.relireEcheancier} fromCreation={fromCreation} />,
    },
    articles: {
      id: 'articles',
      libelle: 'Articles',
      compteur: d.articles?.length ?? 0,
      contenu: <OngletArticles dossierId={d.id} articles={d.articles} details={f.articleDetails} onChanged={f.relireDossierEtMontants} />,
    },
    acquereurs: { id: 'acquereurs', libelle: 'Acquéreurs', contenu: <OngletAcquereurs dossier={d} onChanged={f.relireDossierEtMontants} /> },
    modifications: { id: 'modifications', libelle: 'Modifications', contenu: <OngletModifications dossierId={d.id} onChanged={f.relireDossierEtMontants} /> },
    cadeaux: { id: 'cadeaux', libelle: 'Cadeaux', contenu: <OngletCadeaux dossierId={d.id} /> },
    actions: {
      id: 'actions',
      libelle: 'Actions',
      compteur: actions.data?.actions.length ?? 0,
      contenu: <OngletActions dossierId={d.id} actions={actions} onChanged={f.relireActions} />,
    },
    pieces: {
      id: 'pieces',
      libelle: 'Pièces jointes',
      compteur: pieces.data?.length ?? 0,
      contenu: <OngletPiecesJointes dossierId={d.id} pieces={pieces} />,
    },
    documents: { id: 'documents', libelle: 'Documents générés', contenu: <OngletDocumentsGeneres dossierId={d.id} code={d.code} /> },
    historique: {
      id: 'historique',
      libelle: 'Historique',
      compteur: historique.data?.totalElements ?? 0,
      contenu: <OngletHistorique historique={historique} onPageChange={f.setHistoriquePage} />,
    },
  } satisfies Record<string, OngletFiche>;
}
