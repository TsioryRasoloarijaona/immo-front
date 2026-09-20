import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Search } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
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
  const navigate = useNavigate();

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
    <PageShell
      title="Tranches"
      crumbs={[{ label: 'Patrimoine' }, { label: 'Tranches' }]}
      icon={<Building2 />}
      accent="var(--sec-tranche)"
      accentBg="var(--sec-tranche-bg)"
      fullHeight
    >
      {/* Redesign 20/09 : l'ancienne grille de cartes rendait cinq
          informations pour ~120px de hauteur chacune — le pire ratio
          densité/surface de l'app. Le portefeuille entier tient désormais
          dans une table à la densité de grille (24px/ligne), triée par le
          serveur, visible d'un seul regard. */}
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 pt-1">
        <div className="flex shrink-0 items-center gap-3">
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
          <span className="text-body text-muted-foreground">
            {filtered.length} tranche{filtered.length > 1 ? 's' : ''}
          </span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="Aucun résultat" />
        ) : (
          <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent [&>*:first-child]:pl-3 [&>*:last-child]:pr-3">
                  <TableHead className="text-muted-foreground">Description</TableHead>
                  <TableHead className="text-muted-foreground">Code</TableHead>
                  <TableHead className="text-muted-foreground">Projet</TableHead>
                  <TableHead className="text-muted-foreground">Ville</TableHead>
                  <TableHead className="text-muted-foreground">Livraison</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow
                    key={t.id}
                    className="cursor-pointer hover:bg-(--surface-hover) [&>*:first-child]:pl-3 [&>*:last-child]:pr-3"
                    onClick={() => navigate(`/tranches/${t.id}`)}
                  >
                    <TableCell className="max-w-[360px] truncate font-medium text-foreground" title={t.description ?? undefined}>
                      {t.description || '—'}
                    </TableCell>
                    <TableCell className="font-mono text-micro text-muted-foreground">{t.code || '—'}</TableCell>
                    <TableCell className="max-w-[240px] truncate text-muted-foreground">{projetById.get(t._projetId) || '—'}</TableCell>
                    <TableCell className="capitalize text-muted-foreground">{t.ville || '—'}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {formatDate(t.dateLivraison) === '—' ? 'non planifiée' : formatDate(t.dateLivraison)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </PageShell>
  );
}
