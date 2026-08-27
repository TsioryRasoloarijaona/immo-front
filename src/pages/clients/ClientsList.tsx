import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserCheck } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui';
import Pagination from '../../components/Pagination';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { DEFAULT_PAGE_SIZE, listClients } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { formatCurrency } from '../../lib/format';

// "Clients" — a person-centric view distinct from the Dossiers list (per
// instructions/FIX-clients-and-module-switcher.md): useful once a client
// has several dossiers/tranches, to see them by person rather than by file.
// Backed by GET /api/clients (V4) — anyone who's the clientId of at least
// one dossier de vente, with À payer/Réglé/Reste totals aggregated
// server-side (ClientListItemDto). GET /api/clients/{id} returns the same
// ProspectDetailDto shape as /api/prospects/{id}, so the detail view reuses
// the existing ProspectDetail component (Général/Contacts/Prospections/
// Dossiers/Règlements/Historique already cover "toutes les fiches relatives
// à ce client") — mounted at its own /clients/:id route rather than
// redirecting into /prospects/:id, so the breadcrumb/back-link/URL stay
// under "Clients" (ProspectDetail detects the /clients prefix and adapts).
export default function ClientsList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const { data, loading, error } = useApi(
    () => listClients({ search: search || undefined }, { page, size: DEFAULT_PAGE_SIZE }),
    [search, page],
  );
  const rows = data?.content ?? [];

  function resetAndSet<T>(setter: (v: T) => void, v: T) {
    setPage(0);
    setter(v);
  }

  return (
    <PageShell
      title="Clients"
      crumbs={[{ label: 'Ventes' }, { label: 'Clients' }]}
      icon={<UserCheck />}
      accent="var(--sec-client)"
      accentBg="var(--sec-client-bg)"
    >

      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <InputGroup className="min-w-55 flex-1">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Rechercher un nom, téléphone, email…"
            value={search}
            onChange={(e) => resetAndSet(setSearch, e.target.value)}
          />
        </InputGroup>
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!loading && !error && (
        <>
          <div className="mb-2.5 text-[12.5px] text-muted-foreground">
            {(data?.totalElements ?? 0)} client{(data?.totalElements ?? 0) > 1 ? 's' : ''}
          </div>
          {rows.length === 0 ? (
            <EmptyState title="Aucun résultat" message="Ajustez votre recherche." />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <Table className="min-w-190">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Code</TableHead>
                    <TableHead>Affiché comme</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Ville</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Dossiers</TableHead>
                    <TableHead className="text-right">À payer</TableHead>
                    <TableHead className="text-right">Réglé</TableHead>
                    <TableHead className="text-right">Reste</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow
                      key={r.id}
                      tabIndex={0}
                      role="link"
                      aria-label={`Ouvrir la fiche de ${r.nomAffiche || r.code}`}
                      className="cursor-pointer"
                      onClick={() => navigate(`/clients/${r.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') navigate(`/clients/${r.id}`);
                      }}
                    >
                      <TableCell className="text-muted-foreground">{r.code || '—'}</TableCell>
                      <TableCell className="font-medium text-foreground">{r.nomAffiche || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{r.mobile || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{r.telephone || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{r.ville || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{r.email || '—'}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">{r.nbDossiers ?? '—'}</TableCell>
                      <TableCell className="text-right tabular-nums text-foreground">{formatCurrency(r.totalAPayer)}</TableCell>
                      <TableCell className="text-right tabular-nums text-(--success)">{formatCurrency(r.totalRegle)}</TableCell>
                      <TableCell className="text-right tabular-nums text-destructive">{formatCurrency(r.totalReste)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {data && (
            <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
          )}
        </>
      )}
    </PageShell>
  );
}
