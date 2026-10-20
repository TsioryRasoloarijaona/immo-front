import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Home, Pencil, Trash2 } from 'lucide-react';
import CadreFiche, { type VarianteFiche } from '../../components/CadreFiche';
import { usePreview } from '../../lib/previewContext';
import ActionAdmin from '../../components/patrimoine/ActionAdmin';
import FicheShell from '../../components/FicheShell';
import { SectionFiche } from '../../components/patrimoine/FicheSections';
import GrilleOnglet from '../../components/patrimoine/GrilleOnglet';
import { DossierVenteArticle, IdentiteArticle, PiecesArticle } from '../../components/patrimoine/OngletsArticle';
import SousArticlesArticle from '../../components/patrimoine/SousArticlesArticle';
import PrixArticleFiche from '../../components/patrimoine/PrixArticleFiche';
import { Badge, ErrorState, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { getArticle, getDossier, listArticlePiecesJointes } from '../../lib/api';
import { deleteArticle } from '../../lib/apiPatrimoine';
import { useConfirm } from '../../lib/confirmContext';
import { grilleContenances, sourceContenances } from '../../lib/ongletsArticle';
import { ongletsTransverses } from '../../lib/ongletsTransverses';
import { useContenances } from '../../lib/referentiels';
import { sectionsArticle, useListesFicheArticle } from '../../lib/saisieArticle';
import { useApi } from '../../lib/useApi';
import { canonicalStatusLabel, toneForStatus } from '../../lib/dossierStatus';

export default function ArticleDetail() {
  const { id = '' } = useParams();
  return <FicheArticle key={id} id={id} />;
}

/** `onFermer` : en dialogue, ferme le dialogue au lieu de quitter l'écran après une suppression. */
export function FicheArticle({
  id,
  variante = 'page',
  onFermer,
}: Readonly<{ id: string; variante?: VarianteFiche; onFermer?: () => void }>) {
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
    const oui = await confirm({
      title: "Supprimer l'article",
      message: "L'article, ses sous-articles rattachés, vues, contenances, pièces jointes et notes seront supprimés. Continuer ?",
      confirmLabel: 'Supprimer',
    });
    if (!oui) return;
    try {
      await deleteArticle(id);
      if (onFermer) onFermer();
      else void navigate('/articles');
    } catch (err) {
      setErreurSuppression(err instanceof Error ? err.message : 'Suppression impossible.');
    }
  }

  const dossier = useApi(
    () => (a?.dossierId ? getDossier(a.dossierId) : Promise.resolve(null)),
    [a?.dossierId],
  );

  const pieces = useApi(() => listArticlePiecesJointes(id), [id]);

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
        { label: 'Articles', to: '/articles' },
        ...(a.trancheId ? [{ label: a.trancheCode || a.trancheDescription || 'Tranche', to: `/tranches/${a.trancheId}` }] : []),
        { label: a.code || '' },
      ]}
      icon={<Home />}
      fullHeight
      accent="var(--sec-tranche)"
      accentBg="var(--sec-tranche-bg)"
      actions={
        <div className="flex flex-wrap gap-2">
          <ActionAdmin onClick={() => void supprimer()} libelle="Supprimer" variant="outline" icone={<Trash2 data-icon="inline-start" />} />
          <ActionAdmin to={`/articles/${a.id}/modifier`} libelle="Modifier" variant="outline" icone={<Pencil data-icon="inline-start" />} />
        </div>
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
          {
            id: 'pieces',
            libelle: 'Pièces jointes',
            compteur: pieces.data?.length ?? 0,
            contenu: <PiecesArticle articleId={a.id} pieces={pieces} />,
          },
          ...ongletsTransverses('article', a.id),
        ]}
      />
    </CadreFiche>
  );
}
