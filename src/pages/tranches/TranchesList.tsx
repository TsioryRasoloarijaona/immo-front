import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Search } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { listTranches } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { estAdministrateur } from '../../lib/roles';
import { useApi } from '../../lib/useApi';
import { formatDate, formatNumber } from '../../lib/format';

// Une seule page couvre tout le parc (16 tranches) : la recherche reste côté écran.
const TAILLE_PAGE = 500;

export default function TranchesList() {
  const { data, loading, error } = useApi(() => listTranches(undefined, { page: 0, size: TAILLE_PAGE }), []);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const admin = estAdministrateur(useAuth().user);

  const filtered = useMemo(() => {
    const toutes = data?.content ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return toutes;
    return toutes.filter((t) => `${t.description ?? ''} ${t.code ?? ''} ${t.ville ?? ''} ${t.projetCode ?? ''}`.toLowerCase().includes(q));
  }, [data, search]);

  if (loading && !data) return <PageShell title="Tranches"><LoadingState /></PageShell>;
  if (error) return <PageShell title="Tranches"><ErrorState message={error} /></PageShell>;

  return (
    <PageShell
      title="Tranches"
      crumbs={[{ label: 'Patrimoine' }, { label: 'Tranches' }]}
      icon={<Building2 />}
      accent="var(--sec-tranche)"
      accentBg="var(--sec-tranche-bg)"
      actions={
        admin ? (
          <Button size="sm" onClick={() => void navigate('/tranches/nouveau')}>
            <Plus data-icon="inline-start" /> Nouvelle tranche
          </Button>
        ) : undefined
      }
      fullHeight
    >
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
            {formatNumber(filtered.length)} tranche{filtered.length > 1 ? 's' : ''}
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
                  <TableHead className="text-muted-foreground">Octroi des T.F</TableHead>
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
                    <TableCell className="text-muted-foreground">{t.projetCode || '—'}</TableCell>
                    <TableCell className="capitalize text-muted-foreground">{t.ville || '—'}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">{formatDate(t.dateOctroiTitresFonciers)}</TableCell>
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
