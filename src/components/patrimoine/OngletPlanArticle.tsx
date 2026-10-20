import { useState } from 'react';
import VuePlan from './VuePlan';
import { EmptyState, ErrorState, LoadingState } from '../ui';
import { Button } from '../ui/button';
import { listPlansArticle } from '../../lib/apiPlans';
import { useApi } from '../../lib/useApi';

/** Onglet « Plan » de l'article : le plan de son étage, son tracé mis en évidence. */
export default function OngletPlanArticle({ articleId }: Readonly<{ articleId: string }>) {
  const { data, error } = useApi(() => listPlansArticle(articleId), [articleId]);
  const [choisi, setChoisi] = useState(0);

  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;
  if (data.length === 0) return <EmptyState title="Cet article n'est tracé sur aucun plan" />;

  const plan = data[choisi] ?? data[0];
  return (
    <div className="flex flex-col gap-2.5">
      {data.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {data.map((p, i) => (
            <Button key={p.planId} type="button" size="sm" variant={p === plan ? 'default' : 'outline'} onClick={() => setChoisi(i)}>
              {p.etageCode ?? `Plan ${i + 1}`}
            </Button>
          ))}
        </div>
      )}
      <VuePlan key={plan.planId} plan={{ id: plan.planId, ...plan }} trancheId={plan.trancheId} surlignerArticleId={articleId} />
    </div>
  );
}
