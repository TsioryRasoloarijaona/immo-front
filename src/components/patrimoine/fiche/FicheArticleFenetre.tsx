import { useNavigate } from 'react-router-dom';
import ActionsFicheArticle, { BandeauRattache } from '../ActionsFicheArticle';
import { Badge } from '../../ui';
import FenetrePatrimoine from './FenetrePatrimoine';
import { bandeArticle, basArticle, enteteArticle } from './ongletsArticle';
import { useImprimer, useSuppression } from './outilsFiche';
import { getArticle, getDossier } from '../../../lib/api';
import { fichePdf } from '../../../lib/apiFichesPdf';
import { deleteArticle } from '../../../lib/apiPatrimoine';
import { deleteSousArticle } from '../../../lib/apiSousArticles';
import { canonicalStatusLabel, toneForStatus } from '../../../lib/dossierStatus';
import type { VoisinsFiche } from '../../../lib/fenetreFiche';
import { usePreview } from '../../../lib/previewContext';
import { useContenances } from '../../../lib/referentiels';
import { useListesFicheArticle } from '../../../lib/saisieArticle';
import { useApi } from '../../../lib/useApi';

/** `ecranSousArticles` : fenêtre ouverte depuis `/sous-articles`, où un sous-article rattaché est en lecture seule. */
export default function FicheArticleFenetre({
  id,
  voisins,
  onFermer,
  ecranSousArticles = false,
}: Readonly<{ id: string; voisins?: VoisinsFiche; onFermer: () => void; ecranSousArticles?: boolean }>) {
  const { data: a, loading, error, refetch } = useApi(() => getArticle(id), [id]);
  const dossier = useApi(() => (a?.dossierId ? getDossier(a.dossierId) : Promise.resolve(null)), [a?.dossierId]);
  const navigate = useNavigate();
  const { ouvrirFicheDossier } = usePreview();
  const listes = useListesFicheArticle();
  const contenances = useContenances();
  const imprimer = useImprimer(() => fichePdf('articles', id));
  const sous = a?.estSousArticle === true;
  const { erreur, supprimer } = useSuppression({
    titre: sous ? 'Supprimer le sous-article' : "Supprimer l'article",
    message: sous
      ? 'Le sous-article, ses vues, contenances, pièces jointes et notes seront supprimés ; le prix de son article parent sera recalculé. Continuer ?'
      : "L'article, ses sous-articles rattachés, vues, contenances, pièces jointes et notes seront supprimés. Continuer ?",
    action: () => (sous ? deleteSousArticle(id) : deleteArticle(id)),
    apres: onFermer,
  });
  const ouvrirArticle = (cible: string) => void navigate(`/articles/${cible}`);
  const parentId = a?.lotParentId;

  return (
    <FenetrePatrimoine
      type={ecranSousArticles ? 'sous-article' : 'article'}
      nature={ecranSousArticles ? 'Sous-article' : 'Article'}
      titre={a?.code || 'Article'}
      badge={
        a && (
          <>
            {a.dossierId ? (
              <Badge tone={toneForStatus(canonicalStatusLabel(a.dossierStatut))}>{canonicalStatusLabel(a.dossierStatut)}</Badge>
            ) : (
              <Badge tone={a.statut === 'DISPONIBLE' ? 'success' : 'neutral'}>{a.statut === 'DISPONIBLE' ? 'Libre' : 'Occupé'}</Badge>
            )}
            {parentId && <Badge tone="neutral">Sous-article</Badge>}
          </>
        )
      }
      voisins={voisins}
      onFermer={onFermer}
      etat={{ chargement: loading, erreur: error, pret: !!a, introuvable: "Cet article n'existe pas." }}
      erreur={erreur}
      bandeaux={
        a && parentId ? (
          <>
            <p className="text-body text-muted-foreground">
              Fait partie de{' '}
              <button type="button" onClick={() => ouvrirArticle(parentId)} className="font-medium text-foreground hover:underline">
                {a.lotParentCode || a.lotParentDescription}
              </button>
            </p>
            {ecranSousArticles && <BandeauRattache code={a.lotParentCode} onOuvrirParent={() => ouvrirArticle(parentId)} />}
          </>
        ) : undefined
      }
      ruban={(aller) => ({
        propres: [],
        enSuite: a && (
          <ActionsFicheArticle article={a} ecranSousArticles={ecranSousArticles} onSupprimer={() => supprimer?.onClick()} onModifie={() => void refetch()} />
        ),
        imprimer,
        piecesJointes: { onClick: () => aller('pieces') },
      })}
      bande={a && bandeArticle(a)}
      entete={a ? enteteArticle(a) : undefined}
      bas={a ? basArticle({ article: a, dossier, listes, contenances, relire: () => void refetch(), ouvrirArticle, ouvrirDossier: ouvrirFicheDossier }) : []}
    />
  );
}
