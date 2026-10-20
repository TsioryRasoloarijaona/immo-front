import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import CadreFiche, { type VarianteFiche } from '../../components/CadreFiche';
import { usePreview } from '../../lib/previewContext';
import ActionsFicheArticle, { BandeauRattache } from '../../components/patrimoine/ActionsFicheArticle';
import FicheShell from '../../components/FicheShell';
import { SectionFiche } from '../../components/patrimoine/FicheSections';
import GrilleOnglet from '../../components/patrimoine/GrilleOnglet';
import OngletPlanArticle from '../../components/patrimoine/OngletPlanArticle';
import { DossierVenteArticle, IdentiteArticle } from '../../components/patrimoine/OngletsArticle';
import PiecesJointesBloc from '../../components/patrimoine/PiecesJointesBloc';
import SousArticlesArticle from '../../components/patrimoine/SousArticlesArticle';
import PrixArticleFiche from '../../components/patrimoine/PrixArticleFiche';
import { Badge, ErrorState, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { getArticle, getDossier } from '../../lib/api';
import { deleteArticle } from '../../lib/apiPatrimoine';
import { deleteSousArticle } from '../../lib/apiSousArticles';
import { useConfirm } from '../../lib/confirmContext';
import { grilleContenances, sourceContenances } from '../../lib/ongletsArticle';
import { ongletsTransverses } from '../../lib/ongletsTransverses';
import { useContenances } from '../../lib/referentiels';
import { sectionsArticle, useListesFicheArticle } from '../../lib/saisieArticle';
import { useApi } from '../../lib/useApi';
import { canonicalStatusLabel, toneForStatus } from '../../lib/dossierStatus';

/** `ecranSousArticles` : route `/sous-articles/:id`, où un sous-article rattaché est en lecture seule. */
export default function ArticleDetail({ ecranSousArticles = false }: Readonly<{ ecranSousArticles?: boolean }>) {
  const { id = '' } = useParams();
  return <FicheArticle key={id} id={id} ecranSousArticles={ecranSousArticles} />;
}

/** `onFermer` : en dialogue, ferme le dialogue au lieu de quitter l'écran après une suppression. */
export function FicheArticle({
  id,
  variante = 'page',
  onFermer,
  ecranSousArticles = false,
}: Readonly<{ id: string; variante?: VarianteFiche; onFermer?: () => void; ecranSousArticles?: boolean }>) {
  const { data: a, loading, error, refetch } = useApi(() => getArticle(id), [id]);
  const navigate = useNavigate();
  const { ouvrirFicheDossier, ouvrirFicheArticle } = usePreview();
  const ouvrirArticle = (cible: string) => (variante === 'page' ? void navigate(`/articles/${cible}`) : ouvrirFicheArticle(cible));
  const confirm = useConfirm();
  const [erreurSuppression, setErreurSuppression] = useState<string | null>(null);
  const [onglet, setOnglet] = useState('identite');
  const listes = useListesFicheArticle();
  const contenances = useContenances();

  async function supprimer() {
    const sous = a?.estSousArticle === true;
    const oui = await confirm({
      title: sous ? 'Supprimer le sous-article' : "Supprimer l'article",
      message: sous
        ? "Le sous-article, ses vues, contenances, pièces jointes et notes seront supprimés ; le prix de son article parent sera recalculé. Continuer ?"
        : "L'article, ses sous-articles rattachés, vues, contenances, pièces jointes et notes seront supprimés. Continuer ?",
      confirmLabel: 'Supprimer',
    });
    if (!oui) return;
    try {
      await (sous ? deleteSousArticle(id) : deleteArticle(id));
      if (onFermer) onFermer();
      else void navigate(sous ? '/sous-articles' : '/articles');
    } catch (err) {
      setErreurSuppression(err instanceof Error ? err.message : 'Suppression impossible.');
    }
  }

  const dossier = useApi(
    () => (a?.dossierId ? getDossier(a.dossierId) : Promise.resolve(null)),
    [a?.dossierId],
  );

  if (loading) return <CadreFiche variante={variante} title="Article"><LoadingState /></CadreFiche>;
  if (error) return <CadreFiche variante={variante} title="Article"><ErrorState message={error} /></CadreFiche>;
  if (!a) {
    return (
      <CadreFiche variante={variante} title="Article introuvable" crumbs={[{ label: 'Tranches', to: '/tranches' }]}>
        <p>Cet article n'existe pas.</p>
      </CadreFiche>
    );
  }

  const dossierId = a.dossierId;

  return (
    <CadreFiche
      variante={variante}
      title={a.code || 'Article'}
      typeFiche="Article"
      crumbs={[
        { label: 'Patrimoine' },
        a.estSousArticle ? { label: 'Sous-articles', to: '/sous-articles' } : { label: 'Articles', to: '/articles' },
        ...(a.trancheId ? [{ label: a.trancheCode || a.trancheDescription || 'Tranche', to: `/tranches/${a.trancheId}` }] : []),
        { label: a.code || '' },
      ]}
      icon={<Home />}
      fullHeight
      accent="var(--sec-tranche)"
      accentBg="var(--sec-tranche-bg)"
      actions={
        <ActionsFicheArticle article={a} ecranSousArticles={ecranSousArticles} onSupprimer={() => void supprimer()}
          onModifie={() => void refetch()} />
      }
    >
      <FicheShell
        ongletActif={onglet}
        onOngletChange={setOnglet}
        rembourrer
        identite={
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {variante === 'page' && (
              <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft data-icon="inline-start" /> Retour
              </Button>
            )}
            {variante === 'page' && <h2 className="text-title font-semibold tracking-tight text-foreground">{a.code}</h2>}
            {dossierId ? (
              <Badge tone={toneForStatus(canonicalStatusLabel(a.dossierStatut))}>{canonicalStatusLabel(a.dossierStatut)}</Badge>
            ) : (
              <Badge tone={a.statut === 'DISPONIBLE' ? 'success' : 'neutral'}>{a.statut === 'DISPONIBLE' ? 'Libre' : 'Occupé'}</Badge>
            )}
            {a.lotParentId && <Badge tone="neutral">Sous-article</Badge>}
            {a.lotParentId && (
              <button
                type="button"
                onClick={() => a.lotParentId && ouvrirArticle(a.lotParentId)}
                className="text-body text-muted-foreground hover:text-foreground hover:underline"
              >
                Fait partie de <span className="font-medium text-foreground">{a.lotParentCode || a.lotParentDescription}</span>
              </button>
            )}
            {erreurSuppression && <span role="alert" className="text-label text-destructive">{erreurSuppression}</span>}
            {ecranSousArticles && a.lotParentId && (
              <BandeauRattache code={a.lotParentCode} onOuvrirParent={() => a.lotParentId && ouvrirArticle(a.lotParentId)} />
            )}
          </div>
        }
        onglets={[
          { id: 'identite', libelle: 'Identité', contenu: <IdentiteArticle article={a} /> },
          ...sectionsArticle(a.estSousArticle === true, false).slice(1).map((section) => ({
            id: section.titre,
            libelle: section.titre,
            contenu: <SectionFiche section={section} source={a} listes={listes} />,
          })),
          { id: 'prix', libelle: 'Prix', contenu: <PrixArticleFiche article={a} /> },
          ...(dossierId
            ? [{
                id: 'dossier',
                libelle: 'Dossier de vente',
                contenu: <DossierVenteArticle dossier={dossier} onOuvrir={() => ouvrirFicheDossier(dossierId)} />,
              }]
            : []),
          {
            id: 'sous-articles',
            libelle: 'Sous-articles',
            compteur: a.sousLots?.length ?? 0,
            contenu: <SousArticlesArticle article={a} onModifie={() => void refetch()} onOuvrir={ouvrirArticle} />,
          },
          {
            id: 'contenances',
            libelle: 'Contenances',
            contenu: (
              <>
                {contenances.error && <ErrorState message={contenances.error} />}
                <GrilleOnglet source={sourceContenances(a.id, a.presentationTypeId)} nouvelle={{ nombre: 1 }}
                  {...grilleContenances(contenances.data)} />
              </>
            ),
          },
          { id: 'pieces', libelle: 'Pièces jointes', contenu: <PiecesJointesBloc porteur="articles" id={a.id} /> },
          { id: 'plan', libelle: 'Plan', contenu: <OngletPlanArticle articleId={a.id} /> },
          ...ongletsTransverses('article', a.id),
        ]}
      />
    </CadreFiche>
  );
}
