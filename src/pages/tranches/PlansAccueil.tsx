import { Link } from 'react-router-dom';
import { Map as IconePlan } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { listTranchesAvecPlans } from '../../lib/apiPlans';
import { pluriel } from '../../lib/format';
import { useApi } from '../../lib/useApi';

/** Entrée « Plans » du menu Vente : les tranches qui ont au moins un plan. */
export default function PlansAccueil() {
  const { data, error } = useApi(listTranchesAvecPlans, []);

  return (
    <PageShell title="Plans" crumbs={[{ label: 'Plans' }]} icon={<IconePlan />} accent="var(--sec-tranche)" accentBg="var(--sec-tranche-bg)">
      {error && <ErrorState message={error} />}
      {!error && !data && <LoadingState />}
      {!error && data?.length === 0 && <EmptyState title="Aucune tranche n'a de plan" message="Un administrateur peut importer un plan SVG depuis la tranche." />}
      {!error && data && data.length > 0 && (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((t) => (
            <li key={t.trancheId}>
              <Link
                to={`/tranches/${t.trancheId}/plans`}
                className="flex flex-col gap-0.5 rounded-lg border border-border bg-card px-4 py-3 hover:bg-muted"
              >
                <span className="text-body font-medium text-foreground">{t.description || t.code}</span>
                <span className="text-label text-muted-foreground">
                  {[t.projetCode, pluriel(t.nombrePlans, 'plan')].filter(Boolean).join(' · ')}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
