import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, Search } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui';
import Pagination from '../../components/Pagination';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { DEFAULT_PAGE_SIZE, listProjets } from '../../lib/api';
import { useApi } from '../../lib/useApi';

export default function ProjetsList() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const { data, loading, error } = useApi(() => listProjets({ page, size: DEFAULT_PAGE_SIZE }), [page]);
  const navigate = useNavigate();

  const q = search.trim().toLowerCase();
  const filtered = q
    ? (data?.content ?? []).filter((p) => `${p.description ?? ''} ${p.code ?? ''} ${p.ville ?? ''}`.toLowerCase().includes(q))
    : data?.content ?? [];

  if (loading) return <PageShell title="Projets"><LoadingState /></PageShell>;
  if (error) return <PageShell title="Projets"><ErrorState message={error} /></PageShell>;

  return (
    <PageShell
      title="Projets"
      crumbs={[{ label: 'Patrimoine' }, { label: 'Projets' }]}
      icon={<LayoutGrid />}
      accent="var(--sec-projet)"
      accentBg="var(--sec-projet-bg)"
    >
      <div className="mb-3">
        <InputGroup className="max-w-md">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput placeholder="Rechercher un projet, une ville…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </InputGroup>
      </div>
      {search && (
        <p className="mb-3 text-micro text-muted-foreground">Recherche appliquée uniquement à la page chargée (l'API ne l'accepte pas encore sur cet endpoint).</p>
      )}

      {filtered.length === 0 ? (
        <EmptyState title="Aucun résultat" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Ville</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow
                  key={p.id}
                  tabIndex={0}
                  role="link"
                  className="cursor-pointer"
                  onClick={() => navigate(`/projets/${p.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') navigate(`/projets/${p.id}`);
                  }}
                >
                  <TableCell className="text-muted-foreground">{p.code}</TableCell>
                  <TableCell className="font-medium text-foreground">{p.description}</TableCell>
                  <TableCell className="text-muted-foreground capitalize">{p.ville}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {data && (
        <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
      )}
    </PageShell>
  );
}
