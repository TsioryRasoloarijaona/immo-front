import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Search } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { useStore } from '../../lib/storeContext';
import { useData } from '../../lib/useData';
import { buildClientRows } from '../../lib/clients';
import { formatCurrency } from '../../lib/format';

export default function ClientsList() {
  const { dossiers, loading: storeLoading, error } = useStore();
  const { data, loading: dataLoading } = useData();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [refreshedAt, setRefreshedAt] = useState<number | null>(null);

  const rows = useMemo(() => {
    if (!data) return [];
    return buildClientRows(dossiers, data.settlements);
  }, [dossiers, data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      `${r.displayName} ${r.code} ${r.mobile} ${r.phone} ${r.email}`.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const loading = storeLoading || dataLoading;

  if (loading) return <PageShell title="Clients"><LoadingState /></PageShell>;
  if (error) return <PageShell title="Clients"><ErrorState message={error} /></PageShell>;
  if (!data) return null;

  function handleRefresh() {
    setRefreshedAt(Date.now());
    setTimeout(() => setRefreshedAt(null), 1800);
  }

  return (
    <PageShell title="Clients" crumbs={[{ label: 'Ventes' }, { label: 'Clients' }]}>
      <p className="mb-4 max-w-[680px] text-[12.5px] text-muted-foreground">
        Vue centrée sur la personne plutôt que sur le dossier — un même client peut avoir plusieurs
        dossiers dans des tranches différentes. Le rattachement dossier ↔ tranche n'étant pas
        fiable dans cet échantillon (voir la page Articles), la colonne Tranches et son filtre ne
        sont pas activés ici pour éviter d'afficher un regroupement incorrect.
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <InputGroup className="min-w-[220px] flex-1">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Rechercher un nom, code, téléphone, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </InputGroup>
        <Button type="button" variant="outline" size="sm" onClick={handleRefresh}>
          <Clock data-icon="inline-start" />
          {refreshedAt ? 'Actualisé' : 'Rafraîchir'}
        </Button>
      </div>

      <div className="mb-2.5 text-[12.5px] text-muted-foreground">{filtered.length} client{filtered.length > 1 ? 's' : ''}</div>

      {filtered.length === 0 ? (
        <EmptyState title="Aucun résultat" message="Ajustez votre recherche." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Code</TableHead>
                <TableHead>Affiché comme</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Tél.</TableHead>
                <TableHead className="text-right">Âge</TableHead>
                <TableHead>Tranches</TableHead>
                <TableHead className="text-right">À payer</TableHead>
                <TableHead className="text-right">Réglé</TableHead>
                <TableHead className="text-right">Reste</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow
                  key={r.id}
                  tabIndex={0}
                  role="link"
                  aria-label={`Ouvrir le client ${r.displayName}`}
                  className="cursor-pointer"
                  onClick={() => navigate(`/clients/${r.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') navigate(`/clients/${r.id}`);
                  }}
                >
                  <TableCell className="text-muted-foreground">{r.code}</TableCell>
                  <TableCell className="font-medium text-foreground">
                    {r.displayName}
                    {r.dossiers.length > 1 && (
                      <Badge tone="info" className="ml-2">{r.dossiers.length} dossiers</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.mobile || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{r.phone || '—'}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.age ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">—</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(r.totalDue)}</TableCell>
                  <TableCell className="text-right tabular-nums" style={{ color: r.totalPaid > 0 ? 'var(--success)' : undefined }}>
                    {formatCurrency(r.totalPaid)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums" style={{ color: r.totalRemaining > 0 ? 'var(--warning)' : 'var(--success)' }}>
                    {formatCurrency(r.totalRemaining)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.email || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </PageShell>
  );
}
