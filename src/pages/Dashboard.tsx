import { Children, type ReactNode } from 'react';
import { AlertCircle, AlertTriangle, ArrowUpRight, ChevronRight, Coins, Folder, Sparkles, TrendingUp, UserCheck, UserPlus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { Badge, Card, EmptyState, ErrorState, LoadingState, StatCard } from '../components/ui';
import { usePreview } from '../lib/previewContext';
import { getDashboard, listClients, listDossiers, listPreProspections, listProspections } from '../lib/api';
import { useApi } from '../lib/useApi';
import { formatCurrency, formatDate, toApiDateTime } from '../lib/format';
import { canonicalStatusLabel, toneForStatus } from '../lib/dossierStatus';
import { etapeBadgeTone, prospectionDisplayName, PIPELINE_STAGES } from '../lib/domain';

// Étapes counted as "needs action" for the Vente actuality panel — the
// pipeline's own starting stage plus its two side-track exception states
// (see CLAUDE.md / lib/domain.tsx's PIPELINE_STAGES / isSideTrackEtape).
// Not "2 EN COURS DE TRAITEMENT" onward — those are already being worked,
// this bucket is specifically the ones nobody has picked up yet.
const A_TRAITER_ETAPES = [PIPELINE_STAGES[0], 'A RAPPELER PAR LE COMMERCIAL', 'AFFAIRES A SUIVRE'];

function nDaysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** One column of a dashboard "lane" grid — used both by the "Pipeline"
 * Kanban (four entity stages, identified by icon shape — see
 * index.css's section-identity convention: --sec-accent is one shared hue
 * across every entity, the icon is what actually distinguishes them) and by
 * "Vente — actualité" (two urgency states, which *do* get distinct
 * semantic colors — info/amber are meaningful here, not identity). Each
 * column is its own contained, tinted card (a thin accent bar on top plus a
 * subtle background) so lanes read as separate at a glance instead of one
 * continuous wall of text — the previous version relied on plain
 * side-by-side text (Vente — actualité) or a `divide-x` border too faint
 * against the dark theme to actually separate anything (Pipeline). */
function KanbanColumn({
  icon,
  title,
  subtitle,
  count,
  emptyMessage,
  viewAllTo,
  accent = 'var(--sec-accent)',
  accentBg = 'var(--sec-accent-bg)',
  countTone = 'neutral',
  children,
}: {
  icon: ReactNode;
  title: string;
  /** Small muted qualifier next to the title, e.g. "(7 derniers jours)". */
  subtitle?: string;
  count: number | undefined;
  emptyMessage: string;
  /** Shown as a "Voir tout" footer link when the real total exceeds what's
   * previewed here — every column only ever renders a handful of records. */
  viewAllTo: string;
  /** Defaults to the shared section-identity accent (Pipeline's case).
   * Pass a semantic status color (e.g. `var(--info)`/`var(--amber)`) for
   * lanes that represent an urgency state rather than an entity type. */
  accent?: string;
  accentBg?: string;
  /** 'neutral' (Pipeline — the count is just a tally, not itself a signal)
   * or 'accent' (Vente — actualité — the count *is* the urgency signal, so
   * it gets the same color as the lane). */
  countTone?: 'neutral' | 'accent';
  children: ReactNode;
}) {
  const items = Children.toArray(children).filter(Boolean);
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-(--neutral-bg)/50">
      <span aria-hidden className="block h-0.75 shrink-0" style={{ background: accent }} />
      <div className="flex items-center justify-between gap-2 border-b border-border/70 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="flex size-5.5 shrink-0 items-center justify-center rounded-md [&_svg]:size-3" style={{ color: accent, background: accentBg }}>
            {icon}
          </span>
          <span className="truncate text-body font-semibold text-foreground">{title}</span>
          {subtitle && <span className="truncate text-micro font-normal text-muted-foreground">{subtitle}</span>}
        </div>
        <span
          className="shrink-0 rounded-full px-1.75 py-0.5 text-micro font-bold tabular-nums shadow-xs"
          style={countTone === 'accent' ? { color: accent, background: accentBg } : { color: 'var(--foreground)', background: 'var(--background)' }}
        >
          {count ?? 0}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-0.5 p-1.5">
        {items.length === 0 ? (
          <p className="px-1.5 py-2 text-micro text-muted-foreground">{emptyMessage}</p>
        ) : (
          items
        )}
      </div>
      {items.length > 0 && (
        <Link
          to={viewAllTo}
          className="flex items-center justify-center gap-0.5 border-t border-border/70 py-1.5 text-micro font-medium text-muted-foreground no-underline transition-colors hover:bg-background hover:text-primary"
        >
          Voir tout
          <ChevronRight className="size-3" />
        </Link>
      )}
    </div>
  );
}

/** Shared hover-pill treatment for every Kanban row — a plain name (Pré-
 * prospection/Prospections/Clients) or the richer name+badge row (Dossier
 * de vente) both get the same rounded hover surface and truncation. */
function KanbanItemRow({ onClick, to, children }: { onClick?: () => void; to?: string; children: ReactNode }) {
  const className =
    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-body font-medium text-foreground no-underline transition-colors hover:bg-background';
  if (to) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}

export default function Dashboard() {
  const { data: dashboard, loading, error } = useApi(() => getDashboard(), []);
  const { data: prospectionsPage } = useApi(() => listProspections({ ouvertes: true }, { size: 7 }), []);
  const { data: dossiersPage } = useApi(() => listDossiers(undefined, { size: 7, sort: ['docDate,desc'] }), []);
  const { data: nouvellesPage } = useApi(
    () => listProspections({ ouvertes: true, dateDebut: toApiDateTime(nDaysAgoISO(7)) }, { size: 5, sort: ['dateDocument,desc'] }),
    [],
  );
  const { data: aTraiterPage } = useApi(
    () => listProspections({ ouvertes: true, etape: A_TRAITER_ETAPES }, { size: 5, sort: ['dateDocument,desc'] }),
    [],
  );
  // Kanban's own two columns not already covered by an existing fetch —
  // Prospections reuses `prospectionsPage` above, Dossier de vente reuses
  // `dossiersPage` below, both already fetched for their own cards.
  const { data: preProspectionsPage } = useApi(
    () => listPreProspections({ ouvertes: true }, { size: 4, sort: ['dateDocument,desc'] }),
    [],
  );
  const { data: clientsPage } = useApi(() => listClients(undefined, { size: 4 }), []);
  const { previewDossier } = usePreview();

  if (loading) return <PageShell title="Dashboard"><LoadingState /></PageShell>;
  if (error) return <PageShell title="Dashboard"><ErrorState message={error} /></PageShell>;
  if (!dashboard) return null;

  const statusCounts = dashboard.dossiersParEtape ?? [];
  const relances = dashboard.relancesEnRetard ?? [];
  // "Dossiers actifs" stat stays derived from the same aggregate the removed
  // "Dossiers par étape" breakdown used to chart — only the bar-chart card
  // itself was dropped in favor of the pipeline Kanban below, the number is
  // still meaningful on its own.
  const dossiersActifs = statusCounts.reduce((s, c) => s + (c.nombre ?? 0), 0);

  return (
    <PageShell title="Dashboard" crumbs={[{ label: 'Portefeuille' }]}>
      {/* Everything below is sized to land on one screen at a normal laptop
          viewport (~900px tall) — dense stat row, then a 3-column bank of
          panels — rather than a single tall column that forces scrolling. */}
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3">
          <StatCard icon={<Coins />} label="Valeur du pipeline" value={formatCurrency(dashboard.valeurPipeline)} tone="progress" />
          <StatCard icon={<TrendingUp />} label="Panier moyen" value={formatCurrency(dashboard.panierMoyen)} tone="info" />
          <StatCard
            icon={<Users />}
            label="Prospections ouvertes"
            value={String(dashboard.prospectionsOuvertes ?? 0)}
            sub={`sur ${dashboard.prospectionsTotal ?? 0} au total`}
            tone="info"
          />
          <StatCard icon={<Folder />} label="Dossiers actifs" value={String(dossiersActifs)} tone="success" />
          <StatCard icon={<AlertTriangle />} label="Relances en retard" value={String(relances.length)} tone="warning" />
        </div>

        <Card title="Vente — actualité" accent="var(--sec-accent)" padded={false}>
          {/* Briefly answers "what's new" and "what needs picking up" for
              the Ventes pipeline, side by side — Nouveau is prospections
              created in the last 7 days (dateDebut filter), À traiter is
              prospections still sitting in the pipeline's starting stage or
              a side-track exception state (A_TRAITER_ETAPES, see above) —
              nobody has moved them forward yet. Both are real server-side
              filtered counts (totalElements), not client-side guesses.
              Reuses the same contained-lane treatment as the Pipeline
              Kanban below (KanbanColumn), just with semantic info/amber
              accents instead of the shared identity accent — these two
              lanes are urgency states, not entity types, so distinct color
              is meaningful here. */}
          <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2">
            <KanbanColumn
              icon={<Sparkles />}
              title="Nouveau"
              subtitle="7 derniers jours"
              count={nouvellesPage?.totalElements}
              emptyMessage="Aucune nouvelle prospection."
              viewAllTo="/prospections"
              accent="var(--info)"
              accentBg="var(--info-bg)"
              countTone="accent"
            >
              {nouvellesPage?.content.slice(0, 4).map((p) => (
                <KanbanItemRow to={`/prospections/${p.id}`} key={p.id}>
                  <span className="min-w-0 flex-1 truncate">{prospectionDisplayName(p)}</span>
                  <span className="shrink-0 text-micro text-muted-foreground">{formatDate(p.dateDocument)}</span>
                </KanbanItemRow>
              ))}
            </KanbanColumn>

            <KanbanColumn
              icon={<AlertCircle />}
              title="À traiter"
              subtitle="non prises en charge"
              count={aTraiterPage?.totalElements}
              emptyMessage="Rien à traiter — pipeline à jour."
              viewAllTo="/prospections"
              accent="var(--amber)"
              accentBg="var(--amber-bg)"
              countTone="accent"
            >
              {aTraiterPage?.content.slice(0, 4).map((p) => (
                <KanbanItemRow to={`/prospections/${p.id}`} key={p.id}>
                  <span className="min-w-0 flex-1 truncate">{prospectionDisplayName(p)}</span>
                  <Badge tone={etapeBadgeTone(p.etape, p.fermee)} className="shrink-0 text-micro">
                    {p.etape || '—'}
                  </Badge>
                </KanbanItemRow>
              ))}
            </KanbanColumn>
          </div>
        </Card>

        <Card title="Pipeline" accent="var(--sec-accent)" padded={false}>
          {/* Funnel view of the whole Ventes flow, one column per stage —
              replaces the old "Dossiers par étape" bar chart (dossier
              statuses only) with the full pré-prospection → prospection →
              client → dossier journey. Each column is its own tinted card
              (see KanbanColumn) with a real server-side count (totalElements
              from the matching list endpoint) plus its most recent few
              records. There's no drag/drop — records move stage by their
              own workflow action (transformer, créer prospect, créer
              dossier), not by dragging a card here. */}
          <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 xl:grid-cols-4">
            <KanbanColumn
              icon={<UserPlus />}
              title="Pré-prospection"
              count={preProspectionsPage?.totalElements}
              emptyMessage="Aucune pré-prospection."
              viewAllTo="/pre-prospections"
            >
              {preProspectionsPage?.content.map((p) => (
                <KanbanItemRow to={`/pre-prospections/${p.id}`} key={p.id}>
                  <span className="min-w-0 truncate">{prospectionDisplayName(p)}</span>
                </KanbanItemRow>
              ))}
            </KanbanColumn>

            <KanbanColumn
              icon={<Users />}
              title="Prospections"
              count={dashboard.prospectionsOuvertes}
              emptyMessage="Aucune prospection ouverte."
              viewAllTo="/prospections"
            >
              {prospectionsPage?.content.slice(0, 4).map((p) => (
                <KanbanItemRow to={`/prospections/${p.id}`} key={p.id}>
                  <span className="min-w-0 truncate">{prospectionDisplayName(p)}</span>
                </KanbanItemRow>
              ))}
            </KanbanColumn>

            <KanbanColumn icon={<UserCheck />} title="Clients" count={clientsPage?.totalElements} emptyMessage="Aucun client." viewAllTo="/clients">
              {clientsPage?.content.map((c) => (
                <KanbanItemRow to={`/clients/${c.id}`} key={c.id}>
                  <span className="min-w-0 truncate">{c.nomAffiche || '—'}</span>
                </KanbanItemRow>
              ))}
            </KanbanColumn>

            <KanbanColumn icon={<Folder />} title="Dossier de vente" count={dossiersActifs} emptyMessage="Aucun dossier actif." viewAllTo="/dossiers">
              {dossiersPage?.content.slice(0, 4).map((d) => (
                <KanbanItemRow onClick={() => previewDossier(d.id)} key={d.id}>
                  <span className="min-w-0 flex-1 truncate">{d.clientNom || '—'}</span>
                  <Badge tone={toneForStatus(d.statut)} className="shrink-0 text-micro">
                    {canonicalStatusLabel(d.statut) || d.statut || '—'}
                  </Badge>
                </KanbanItemRow>
              ))}
            </KanbanColumn>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
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
                    <span className="size-1.5 shrink-0 rounded-full bg-(--warning)" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-body font-semibold text-foreground">{r.clientNom || 'Client'}</div>
                      <div className="truncate text-micro text-muted-foreground">Échéance {formatDate(r.dateEcheance)}</div>
                    </div>
                    <div className="shrink-0 text-micro font-semibold text-(--warning)">
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
                      <div className="truncate text-body font-semibold text-foreground">{prospectionDisplayName(p)}</div>
                      <div className="truncate text-micro text-muted-foreground">{p.commercialNom || '—'}</div>
                    </div>
                    <Badge tone={etapeBadgeTone(p.etape, p.fermee)} className="shrink-0 text-micro">
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
              <table className="w-full border-collapse text-body">
                <thead>
                  <tr className="border-b border-border text-left text-micro font-medium text-muted-foreground">
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
                      className="cursor-pointer border-b border-border last:border-b-0 hover:bg-(--surface-hover)"
                      onClick={() => previewDossier(d.id)}
                    >
                      <td className="px-4 py-2 font-medium text-foreground">{d.clientNom || '—'}</td>
                      <td className="px-4 py-2 text-muted-foreground">{d.commercialNom || '—'}</td>
                      <td className="px-4 py-2">
                        <Badge tone="neutral" className="text-micro">
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
