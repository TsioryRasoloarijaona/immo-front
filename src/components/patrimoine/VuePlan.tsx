import { lazy, Suspense, useState } from 'react';
import { EmptyState, ErrorState, LoadingState } from '../ui';
import LegendePlan from './LegendePlan';
import PlanSvg from './PlanSvg';
import { listTracesPlan } from '../../lib/apiPlans';
import { actionTrace, MESSAGE_SOUS_ARTICLE, statutDeTrace, statutsPresents, useImagePlan } from '../../lib/plans';
import { usePreview } from '../../lib/previewContext';
import { useApi } from '../../lib/useApi';
import type { PlanDto, TraceDto } from '../../types/plans';

const NouvelleProspectionDialog = lazy(() => import('../../pages/prospections/NewProspection'));

/**
 * Un plan : image, tracés colorés par statut, légende filtrante. Clic sur un tracé libre → prospection pré-remplie ;
 * sur un tracé occupé → fiche du dossier en dialogue. `surlignerArticleId` estompe les autres tracés.
 */
export default function VuePlan({ plan, trancheId, surlignerArticleId }: Readonly<{
  plan: Pick<PlanDto, 'id' | 'largeur' | 'hauteur' | 'x' | 'y'>;
  trancheId: string;
  surlignerArticleId?: string;
}>) {
  const traces = useApi(() => listTracesPlan(plan.id), [plan.id]);
  const image = useImagePlan(plan.id);
  const { ouvrirFicheDossier, ouvrirFicheProspection } = usePreview();
  const [statutChoisi, setStatutChoisi] = useState<string | null>(null);
  const [prospection, setProspection] = useState<string | null>(null);
  const [refus, setRefus] = useState(false);

  function choisir(t: TraceDto) {
    const action = actionTrace(t);
    setRefus(action === 'sous-article');
    if (action === 'prospection') setProspection(t.articleId);
    else if (action === 'dossier' && t.dossierId) ouvrirFicheDossier(t.dossierId);
  }

  const estGrise = (t: TraceDto) =>
    (statutChoisi !== null && statutDeTrace(t).cle !== statutChoisi)
    || (surlignerArticleId !== undefined && t.articleId !== surlignerArticleId);

  if (traces.error) return <ErrorState message={traces.error} />;
  if (image.erreur) return <ErrorState message={image.erreur} />;
  if (!traces.data || !image.url) return <LoadingState />;
  if (traces.data.length === 0) return <EmptyState title="Aucun tracé sur ce plan" />;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5">
      <LegendePlan statuts={statutsPresents(traces.data)} choisi={statutChoisi} onChoisir={setStatutChoisi} />
      {refus && <p role="alert" className="text-label text-destructive">{MESSAGE_SOUS_ARTICLE}</p>}
      <PlanSvg image={image.url} plan={plan} traces={traces.data} estGrise={estGrise} onChoisir={choisir} />
      {prospection && (
        <Suspense fallback={null}>
          <NouvelleProspectionDialog
            trancheInitiale={trancheId}
            articleInitial={prospection}
            onClose={() => setProspection(null)}
            onCree={(p) => {
              setProspection(null);
              ouvrirFicheProspection(p.id, false);
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
