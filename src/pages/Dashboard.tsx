import { AlertTriangle, ArrowUpRight, Coins, Folder, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { Badge, Card, EmptyState, ErrorState, LoadingState, StatCard } from '../components/ui';
import { usePreview } from '../lib/previewContext';
import { getDashboard, listDossiers, listProspections } from '../lib/api';
import { useApi } from '../lib/useApi';
import { formatCurrency, formatDate } from '../lib/format';
import { etapeBadgeTone, prospectionDisplayName } from '../lib/domain';

export default function Dashboard() {
  const { data: dashboard, loading, error } = useApi(() => getDashboard(), []);
  const { data: prospectionsPage } = useApi(() => listProspections({ ouvertes: true }, { size: 7 }), []);
  const { data: dossiersPage } = useApi(() => listDossiers(undefined, { size: 7, sort: ['docDate,desc'] }), []);
  const { previewDossier } = usePreview();

  if (loading) return <PageShell title="Dashboard"><LoadingState /></PageShell>;
  if (error) return <PageShell title="Dashboard"><ErrorState message={error} /></PageShell>;
  if (!dashboard) return null;

  const statusCounts = dashboard.dossiersParEtape ?? [];
  const maxStatusCount = Math.max(1, ...statusCounts.map((s) => s.nombre ?? 0));
  const relances = dashboard.relancesEnRetard ?? [];
  const dossiersActifs = statusCounts.reduce((s, c) => s + (c.nombre ?? 0), 0);

  return (
    <PageShell title="Dashboard" crumbs={[{ label: 'Portefeuille' }]}>
      {/* Everything below is sized to land on one screen at a normal laptop
          viewport (~900px tall) — dense stat row, then a 3-column bank of
          panels — rather than a single tall column that forces scrolling. */}
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3">
          <StatCard icon={<Coins />} label="Valeur du pipeline" value={formatCurrency(dashboard.valeurPipeline)} />
          <StatCard icon={<TrendingUp />} label="Panier moyen" value={formatCurrency(dashboard.panierMoyen)} />
          <StatCard
            icon={<Users />}
            label="Prospections ouvertes"
            value={String(dashboard.prospectionsOuvertes ?? 0)}
            sub={`sur ${dashboard.prospectionsTotal ?? 0} au total`}
          />
          <StatCard icon={<Folder />} label="Dossiers actifs" value={String(dossiersActifs)} />
          <StatCard icon={<AlertTriangle />} label="Relances en retard" value={String(relances.length)} />
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          <Card title="Dossiers par étape">
            {statusCounts.length === 0 ? (
              <EmptyState title="Aucune donnée" />
            ) : (
              <div>
                {statusCounts.map((s) => (
                  <div className="flex items-center gap-2.5 py-1.5" key={s.etape}>
                    <div className="w-[110px] shrink-0 truncate text-[11.5px] font-medium text-foreground">{s.etape || '—'}</div>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--neutral-bg)]">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${((s.nombre ?? 0) / maxStatusCount) * 100}%` }}
                      />
                    </div>
                    <div className="w-6 shrink-0 text-right text-[11.5px] tabular-nums text-muted-foreground">{s.nombre ?? 0}</div>
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
                {relances.slice(0, 6).map((r) => (
                  <button
                    type="button"
                    onClick={() => previewDossier(r.dossierId)}
                    className="flex w-full items-center gap-2.5 border-b border-border py-2 text-left last:border-b-0"
                    key={r.dossierId}
                  >
                    <span className="size-1.5 shrink-0 rounded-full bg-[var(--warning)]" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12.5px] font-semibold text-foreground">{r.clientNom || 'Client'}</div>
                      <div className="truncate text-[11px] text-muted-foreground">Échéance {formatDate(r.dateEcheance)}</div>
                    </div>
                    <div className="shrink-0 text-[11px] font-semibold text-[var(--warning)]">
                      {r.joursRetard ? `${r.joursRetard} j` : ''}
                    </div>
                    <ArrowUpRight className="size-3 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card
            title="Prospections récentes"
            action={
              <Link to="/prospections" className="text-xs font-medium text-primary hover:underline">
                Voir tout
              </Link>
            }
          >
            {!prospectionsPage || prospectionsPage.content.length === 0 ? (
              <EmptyState title="Aucune prospection" />
            ) : (
              <div>
                {prospectionsPage.content.slice(0, 6).map((p) => (
                  <Link
                    to={`/prospections/${p.id}`}
                    className="flex w-full items-center gap-2.5 border-b border-border py-2 text-left no-underline last:border-b-0"
                    key={p.id}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12.5px] font-semibold text-foreground">{prospectionDisplayName(p)}</div>
                      <div className="truncate text-[11px] text-muted-foreground">{p.commercialNom || '—'}</div>
                    </div>
                    <Badge tone={etapeBadgeTone(p.etape, p.fermee)} className="shrink-0 text-[10.5px]">
                      {p.etape || '—'}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card
          title="Dossiers récents"
          action={
            <Link to="/dossiers" className="text-xs font-medium text-primary hover:underline">
              Voir tout
            </Link>
          }
          padded={false}
        >
          {!dossiersPage || dossiersPage.content.length === 0 ? (
            <EmptyState title="Aucun dossier" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12.5px]">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] font-medium text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Client</th>
                    <th className="px-4 py-2 font-medium">Commercial</th>
                    <th className="px-4 py-2 font-medium">Statut</th>
                    <th className="px-4 py-2 text-right font-medium">Prix</th>
                    <th className="px-4 py-2 text-right font-medium">Total à payer</th>
                  </tr>
                </thead>
                <tbody>
                  {dossiersPage.content.slice(0, 7).map((d) => (
                    <tr
                      key={d.id}
                      className="cursor-pointer border-b border-border last:border-b-0 hover:bg-[var(--surface-hover)]"
                      onClick={() => previewDossier(d.id)}
                    >
                      <td className="px-4 py-2 font-medium text-foreground">{d.clientNom || '—'}</td>
                      <td className="px-4 py-2 text-muted-foreground">{d.commercialNom || '—'}</td>
                      <td className="px-4 py-2">
                        <Badge tone="neutral" className="text-[10.5px]">
                          {d.statut || '—'}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-foreground">{formatCurrency(d.prix)}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">{formatCurrency(d.totalAPayer)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
