import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { listProjets, listProjetTranches } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { formatDate } from '../../lib/format';
import type { TrancheListItemDto } from '../../types';

// No flat "/api/tranches" list endpoint exists — tranches only come back
// nested under a projet (GET /api/projets/{id}/tranches). This page
// aggregates across every projet so "Tranches" in the sidebar still shows
// the full portfolio in one place; see ProjetsList for the drill-down view.
// Both levels are fetched with a generous page size (large enough for the
// whole real-world portfolio) rather than exposing nested pagination
// controls for an aggregate view — that would be awkward UX here.
const AGGREGATE_PAGE_SIZE = 200;

export default function TranchesList() {
  const projets = useApi(() => listProjets({ page: 0, size: AGGREGATE_PAGE_SIZE }), []);
  const [search, setSearch] = useState('');

  const projetIds = useMemo(() => (projets.data?.content ?? []).map((p) => p.id), [projets.data]);
  const tranchesByProjet = useApi(
    () =>
      Promise.all(
        projetIds.map((pid) =>
          listProjetTranches(pid, { page: 0, size: AGGREGATE_PAGE_SIZE }).then((page) =>
            page.content.map((t) => ({ ...t, _projetId: pid })),
          ),
        ),
      ),
    [projetIds.join(',')],
  );

  const projetById = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of projets.data?.content ?? []) m.set(p.id, p.description || p.code || '');
    return m;
  }, [projets.data]);

  const allTranches: (TrancheListItemDto & { _projetId: string })[] = (tranchesByProjet.data ?? []).flat();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allTranches;
    return allTranches.filter((t) => `${t.description ?? ''} ${t.code ?? ''} ${t.ville ?? ''}`.toLowerCase().includes(q));
  }, [allTranches, search]);

  const loading = projets.loading || tranchesByProjet.loading;
  const error = projets.error || tranchesByProjet.error;

  if (loading) return <PageShell title="Tranches"><LoadingState /></PageShell>;
  if (error) return <PageShell title="Tranches"><ErrorState message={error} /></PageShell>;

  return (
    <PageShell title="Tranches" crumbs={[{ label: 'Patrimoine' }, { label: 'Tranches' }]}>
      <div className="mb-3">
        <InputGroup className="max-w-md">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Rechercher un projet, une ville, un code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </InputGroup>
      </div>

      <div className="mb-2.5 text-[12.5px] text-muted-foreground">{filtered.length} tranche{filtered.length > 1 ? 's' : ''}</div>

      {filtered.length === 0 ? (
        <EmptyState title="Aucun résultat" />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5">
          {filtered.map((t) => (
            <Link
              to={`/tranches/${t.id}`}
              key={t.id}
              className="block rounded-xl border border-border bg-card p-4.5 no-underline transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-px hover:border-[var(--border-strong)] hover:shadow-md"
            >
              <div className="mb-2.5">
                <div className="mb-0.5 line-clamp-2 text-[15px] font-semibold text-foreground">{t.description}</div>
                <div className="font-mono text-[11.5px] text-muted-foreground">{t.code} · {projetById.get(t._projetId)}</div>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-3.5 gap-y-1.5 border-t border-border pt-3 text-[12.5px] text-muted-foreground">
                <span>{t.ville ? <span className="capitalize">{t.ville}</span> : 'Ville non renseignée'}</span>
                <span>Livraison : {formatDate(t.dateLivraison) === '—' ? 'non planifiée' : formatDate(t.dateLivraison)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
