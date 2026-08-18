import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowUpRight, Clock, Coins, Folder, TrendingUp, Users } from 'lucide-react';
import PageShell from '../components/PageShell';
import { Card, EmptyState, ErrorState, LoadingState, StatCard } from '../components/ui';
import { communicationIcon, prospectionDisplayName } from '../lib/domain';
import { usePreview } from '../lib/previewContext';
import { useStore } from '../lib/storeContext';
import { useData } from '../lib/useData';
import { formatCurrency, formatDate, isPastOrToday, todayISO } from '../lib/format';
import { DOSSIER_STATUS_PIPELINE, isExitStatus } from '../lib/dossierStatus';

export default function Dashboard() {
  const { prospections, dossiers, communications, getDossierStatus, loading, error } = useStore();
  const { data: portfolio } = useData();
  const { previewProspection, previewDossier } = usePreview();

  const stats = useMemo(() => {
    if (loading) return null;

    const activeDossiers = dossiers.filter((d) => !isExitStatus(getDossierStatus(d.id).label));
    const pipelineValue = activeDossiers.reduce((sum, d) => sum + (d.price || 0), 0);

    const statusCounts = new Map<string, number>();
    for (const label of DOSSIER_STATUS_PIPELINE) statusCounts.set(label, 0);
    let cancelledCount = 0;
    let withdrawnCount = 0;
    for (const d of dossiers) {
      const status = getDossierStatus(d.id);
      if (status.label === 'Annulé') {
        cancelledCount += 1;
        continue;
      }
      if (status.label === 'Désistement') {
        withdrawnCount += 1;
        continue;
      }
      statusCounts.set(status.label, (statusCounts.get(status.label) ?? 0) + 1);
    }

    const openProspections = prospections.filter((p) => !p.isClosed);
    const today = todayISO();
    const followUpsToday = prospections
      .filter((p) => !p.isClosed && p.alertValidityDate && isPastOrToday(p.alertValidityDate))
      .sort((a, b) => (a.alertValidityDate! < b.alertValidityDate! ? -1 : 1));

    const overdueCount = followUpsToday.filter((p) => p.alertValidityDate! < today).length;

    const recentActivity = [...communications]
      .filter((c) => c.date)
      .sort((a, b) => (a.date! < b.date! ? 1 : -1))
      .slice(0, 9);

    const avgDeal = activeDossiers.length > 0 ? pipelineValue / activeDossiers.length : 0;

    return {
      pipelineValue,
      statusCounts,
      cancelledCount,
      withdrawnCount,
      openProspections,
      followUpsToday,
      overdueCount,
      recentActivity,
      avgDeal,
      activeDossiersCount: activeDossiers.length,
    };
  }, [loading, prospections, dossiers, communications, getDossierStatus]);

  if (loading) return <PageShell title="Dashboard"><LoadingState /></PageShell>;
  if (error) return <PageShell title="Dashboard"><ErrorState message={error} /></PageShell>;
  if (!stats) return null;

  const maxStatusCount = Math.max(1, ...Array.from(stats.statusCounts.values()));

  return (
    <PageShell title="Dashboard" crumbs={[{ label: 'Portefeuille' }]}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-3.5">
          <StatCard
            icon={<Coins />}
            label="Valeur du pipeline"
            value={formatCurrency(stats.pipelineValue)}
            sub={`${stats.activeDossiersCount} dossiers actifs`}
          />
          <StatCard
            icon={<TrendingUp />}
            label="Panier moyen"
            value={formatCurrency(stats.avgDeal)}
            sub="Par dossier actif"
          />
          <StatCard
            icon={<Users />}
            label="Prospections ouvertes"
            value={String(stats.openProspections.length)}
            sub={`sur ${prospections.length} au total`}
          />
          <StatCard
            icon={<AlertTriangle />}
            label="Relances en retard"
            value={String(stats.overdueCount)}
            sub={`${stats.followUpsToday.length} à traiter aujourd'hui ou avant`}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
          <Card title="Dossiers par étape">
            <div>
              {DOSSIER_STATUS_PIPELINE.map((label) => {
                const count = stats.statusCounts.get(label) ?? 0;
                return (
                  <div className="flex items-center gap-3 py-2" key={label}>
                    <div className="w-[130px] shrink-0 text-[12.5px] font-medium text-foreground">{label}</div>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--neutral-bg)]">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(count / maxStatusCount) * 100}%` }}
                      />
                    </div>
                    <div className="w-7 shrink-0 text-right text-[12.5px] tabular-nums text-muted-foreground">{count}</div>
                  </div>
                );
              })}
              {stats.cancelledCount > 0 && (
                <div className="flex items-center gap-3 py-2">
                  <div className="w-[130px] shrink-0 text-[12.5px] font-medium text-foreground">Annulé</div>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--neutral-bg)]">
                    <div
                      className="h-full rounded-full bg-[var(--warning)]"
                      style={{ width: `${(stats.cancelledCount / maxStatusCount) * 100}%` }}
                    />
                  </div>
                  <div className="w-7 shrink-0 text-right text-[12.5px] tabular-nums text-muted-foreground">{stats.cancelledCount}</div>
                </div>
              )}
              {stats.withdrawnCount > 0 && (
                <div className="flex items-center gap-3 py-2">
                  <div className="w-[130px] shrink-0 text-[12.5px] font-medium text-foreground">Désistement</div>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--neutral-bg)]">
                    <div
                      className="h-full rounded-full bg-[var(--warning)]"
                      style={{ width: `${(stats.withdrawnCount / maxStatusCount) * 100}%` }}
                    />
                  </div>
                  <div className="w-7 shrink-0 text-right text-[12.5px] tabular-nums text-muted-foreground">{stats.withdrawnCount}</div>
                </div>
              )}
            </div>
          </Card>

          <Card
            title="À relancer aujourd'hui"
            action={
              <Link to="/prospections" className="text-xs font-medium text-primary hover:underline">
                Voir tout
              </Link>
            }
          >
            {stats.followUpsToday.length === 0 ? (
              <EmptyState title="Rien en attente" message="Aucune relance due aujourd'hui ou en retard." />
            ) : (
              <div>
                {stats.followUpsToday.slice(0, 8).map((p) => (
                  <button
                    type="button"
                    onClick={() => previewProspection(p.id)}
                    className="flex w-full items-center gap-3 border-b border-border py-2.5 text-left last:border-b-0"
                    key={p.id}
                  >
                    <span className="size-2 shrink-0 rounded-full bg-[var(--warning)]" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-foreground">{prospectionDisplayName(p)}</div>
                      <div className="truncate text-xs text-muted-foreground">{p.alertMessage || 'Relance planifiée'}</div>
                    </div>
                    <div className="shrink-0 text-[11.5px] font-semibold text-[var(--warning)]">{formatDate(p.alertValidityDate)}</div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card
          title="Activité récente"
          action={<Folder className="size-[15px] text-muted-foreground" />}
        >
          {stats.recentActivity.length === 0 ? (
            <EmptyState title="Aucune activité" />
          ) : (
            <div>
              {stats.recentActivity.map((c) => {
                const onOpen = c.prospectionId
                  ? () => previewProspection(c.prospectionId!)
                  : c.folderId
                    ? () => previewDossier(c.folderId!)
                    : null;
                const body = (
                  <>
                    <div className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-[var(--brand-bg)] text-[var(--brand)] [&_svg]:size-[15px]">
                      {communicationIcon(c.actionType)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium text-foreground">
                        {c.actionType} — {c.user || 'Système'}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{formatDate(c.date)}</div>
                      {c.report && <div className="mt-1 text-[12.5px] text-foreground">{c.report}</div>}
                    </div>
                    {onOpen && <ArrowUpRight className="mt-1.5 size-3.5 shrink-0 text-muted-foreground" />}
                  </>
                );
                return onOpen ? (
                  <button
                    type="button"
                    onClick={onOpen}
                    key={c.id}
                    className="flex w-full gap-3 border-b border-border py-2.5 text-left text-inherit last:border-b-0"
                  >
                    {body}
                  </button>
                ) : (
                  <div className="flex gap-3 border-b border-border py-2.5 last:border-b-0" key={c.id}>
                    {body}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-3.5">
          <StatCard icon={<Folder />} label="Dossiers totaux" value={String(dossiers.length)} />
          <StatCard icon={<Clock />} label="Tranches" value={String(portfolio?.tranches.length ?? 0)} sub="Projets en portefeuille" />
          <StatCard icon={<Users />} label="Articles" value={String(portfolio?.articles.length ?? 0)} sub="Lots référencés" />
          <StatCard icon={<Clock />} label="Interactions" value={String(communications.length)} sub="Appels, visites, notes" />
        </div>
      </div>
    </PageShell>
  );
}
