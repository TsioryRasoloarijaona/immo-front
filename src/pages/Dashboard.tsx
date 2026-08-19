import { AlertTriangle, ArrowUpRight, Coins, Folder, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { Card, EmptyState, ErrorState, LoadingState, StatCard } from '../components/ui';
import { usePreview } from '../lib/previewContext';
import { getDashboard } from '../lib/api';
import { useApi } from '../lib/useApi';
import { formatCurrency, formatDate } from '../lib/format';

export default function Dashboard() {
  const { data: dashboard, loading, error } = useApi(() => getDashboard(), []);
  const { previewDossier } = usePreview();

  if (loading) return <PageShell title="Dashboard"><LoadingState /></PageShell>;
  if (error) return <PageShell title="Dashboard"><ErrorState message={error} /></PageShell>;
  if (!dashboard) return null;

  const statusCounts = dashboard.dossiersParEtape ?? [];
  const maxStatusCount = Math.max(1, ...statusCounts.map((s) => s.nombre ?? 0));
  const relances = dashboard.relancesEnRetard ?? [];

  return (
    <PageShell title="Dashboard" crumbs={[{ label: 'Portefeuille' }]}>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-3.5">
          <StatCard icon={<Coins />} label="Valeur du pipeline" value={formatCurrency(dashboard.valeurPipeline)} />
          <StatCard icon={<TrendingUp />} label="Panier moyen" value={formatCurrency(dashboard.panierMoyen)} />
          <StatCard
            icon={<Users />}
            label="Prospections ouvertes"
            value={String(dashboard.prospectionsOuvertes ?? 0)}
            sub={`sur ${dashboard.prospectionsTotal ?? 0} au total`}
          />
          <StatCard icon={<AlertTriangle />} label="Relances en retard" value={String(relances.length)} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
          <Card title="Dossiers par étape">
            {statusCounts.length === 0 ? (
              <EmptyState title="Aucune donnée" />
            ) : (
              <div>
                {statusCounts.map((s) => (
                  <div className="flex items-center gap-3 py-2" key={s.etape}>
                    <div className="w-[130px] shrink-0 text-[12.5px] font-medium text-foreground">{s.etape || '—'}</div>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--neutral-bg)]">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${((s.nombre ?? 0) / maxStatusCount) * 100}%` }}
                      />
                    </div>
                    <div className="w-7 shrink-0 text-right text-[12.5px] tabular-nums text-muted-foreground">{s.nombre ?? 0}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card
            title="Relances en retard"
            action={
              <Link to="/dossiers" className="text-xs font-medium text-primary hover:underline">
                Voir tout
              </Link>
            }
          >
            {relances.length === 0 ? (
              <EmptyState title="Rien en attente" message="Aucune relance en retard." />
            ) : (
              <div>
                {relances.slice(0, 8).map((r) => (
                  <button
                    type="button"
                    onClick={() => previewDossier(r.dossierId)}
                    className="flex w-full items-center gap-3 border-b border-border py-2.5 text-left last:border-b-0"
                    key={r.dossierId}
                  >
                    <span className="size-2 shrink-0 rounded-full bg-[var(--warning)]" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-foreground">{r.clientNom || 'Client'}</div>
                      <div className="truncate text-xs text-muted-foreground">Échéance {formatDate(r.dateEcheance)}</div>
                    </div>
                    <div className="shrink-0 text-[11.5px] font-semibold text-[var(--warning)]">
                      {r.joursRetard ? `${r.joursRetard} j de retard` : ''}
                    </div>
                    <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-3.5">
          <StatCard icon={<Folder />} label="Dossiers actifs" value={String(statusCounts.reduce((s, c) => s + (c.nombre ?? 0), 0))} />
        </div>
      </div>
    </PageShell>
  );
}
