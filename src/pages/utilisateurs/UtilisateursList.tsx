import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, KeyRound, RotateCcw, Search, Users } from 'lucide-react';
import { Badge, Card, EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { DEFAULT_PAGE_SIZE, listUtilisateurs } from '../../lib/api';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { useUrlEnum, useUrlPage, useUrlString } from '../../lib/useUrlState';
import { formatDate } from '../../lib/format';
import AdminGuard from './AdminGuard';
import AffecterProjetsDialog from './AffecterProjetsDialog';

const EXEMPT_ROLES = new Set(['Administrateur', 'Direction Générale']);

/** Badge for the "Périmètre" column — mirrors the exempt/unrestricted/
 * restricted read-out `AffecterProjetsDialog` itself shows, so an admin sees
 * the same story on the list row and inside the dialog. `count === 0` is
 * "unrestricted", not "broken" (FEATURE-perimetre-commercial.md §6.3) — it
 * must never be styled to look like an empty/error state. */
function perimetreBadge(count: number, roles?: string[]) {
  if (roles?.some((r) => EXEMPT_ROLES.has(r))) return <Badge tone="amber">Exempté</Badge>;
  if (count === 0) return <Badge tone="neutral">Tous les projets</Badge>;
  return <Badge tone="progress">{count} projet{count > 1 ? 's' : ''}</Badge>;
}

const DISABLED_VALUES = ['all', 'active', 'disabled'] as const;
type DisabledFilter = (typeof DISABLED_VALUES)[number];

const DISABLED_ITEMS: { label: string; value: DisabledFilter }[] = [
  { label: 'Tous les comptes', value: 'all' },
  { label: 'Actifs', value: 'active' },
  { label: 'Désactivés', value: 'disabled' },
];

function employeeName(row: { employeePrenom?: string; employeeNom?: string }): string {
  const name = [row.employeePrenom, row.employeeNom].filter(Boolean).join(' ');
  return name || '—';
}

// No `roles`/type-employé filter here — GET /api/utilisateurs only exposes
// `search` and `disabled` server-side (confirmed against docs/api-docsV4.json);
// filtering by role client-side would silently only affect the current page,
// not the real total, so it's deliberately left out.
export default function UtilisateursList() {
  const navigate = useNavigate();

  const [search, setSearch] = useUrlString('q');
  const debouncedSearch = useDebouncedValue(search);
  const [disabledFilter, setDisabledFilter] = useUrlEnum<DisabledFilter>('statut', DISABLED_VALUES, 'all');
  const [page, setPage] = useUrlPage();

  const [dialogUser, setDialogUser] = useState<{ id: string; label: string; roles?: string[] } | null>(null);

  function resetAndSet<T>(setter: (v: T) => void, v: T) {
    setPage(0);
    setter(v);
  }

  const { data, loading, error, refetch } = useApi(
    () =>
      listUtilisateurs(
        {
          search: debouncedSearch || undefined,
          disabled: disabledFilter === 'active' ? false : disabledFilter === 'disabled' ? true : undefined,
        },
        { page, size: DEFAULT_PAGE_SIZE },
      ),
    [debouncedSearch, disabledFilter, page],
  );
  const rows = data?.content ?? [];

  return (
    <AdminGuard
      title="Comptes utilisateurs"
      crumbs={[{ label: 'Administration' }, { label: 'Comptes utilisateurs' }]}
      icon={<Users />}
      accent="var(--sec-accent)"
      accentBg="var(--sec-accent-bg)"
      fullHeight
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <p className="shrink-0 max-w-180 text-body text-muted-foreground">
          Annuaire des comptes (/api/utilisateurs) — identifiant, fiche employé liée et rôles assignés.
          Réservé au rôle Administrateur.
        </p>

        <Card padded={false} className="shrink-0">
          <div className="flex flex-wrap items-center gap-2.5 p-3">
            <InputGroup className="min-w-55 flex-1">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Recherche — identifiant, description, email…" aria-label="Rechercher un utilisateur"
                value={search}
                onChange={(e) => resetAndSet(setSearch, e.target.value)}
              />
            </InputGroup>
            <Select items={DISABLED_ITEMS} value={disabledFilter} onValueChange={(v) => resetAndSet(setDisabledFilter, v as DisabledFilter)}>
              <SelectTrigger aria-label="Statut du compte" className="w-45">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {DISABLED_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {loading && !data && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && data && (
          <ResultsRegion loading={loading}>
            <div className="shrink-0 text-body text-muted-foreground">
              {(data?.totalElements ?? 0)} compte{(data?.totalElements ?? 0) > 1 ? 's' : ''}
            </div>
            {rows.length === 0 ? (
              <EmptyState
                title={!!search || disabledFilter !== 'all' ? 'Aucun résultat' : 'Rien à afficher'}
                message={
                  !!search || disabledFilter !== 'all'
                    ? 'Aucun compte ne correspond aux filtres actifs.'
                    : "Aucun compte n'est encore enregistré."
                }
                action={
                  !!search || disabledFilter !== 'all' ? (
                    <Button type="button" variant="outline" size="sm" onClick={() => { setPage(0); setSearch(''); setDisabledFilter('all'); }}>
                      <RotateCcw data-icon="inline-start" /> Réinitialiser les filtres
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-border bg-card">
                <Table className="w-full min-w-260 table-fixed">
                  <TableHeader>
                    <TableRow className="sticky top-0 z-10 bg-card hover:bg-card">
                      <TableHead className="w-[14%]">Identifiant</TableHead>
                      <TableHead className="w-[13%]">Employé</TableHead>
                      <TableHead className="w-[9%]">Type</TableHead>
                      <TableHead className="w-[14%]">Contact</TableHead>
                      <TableHead className="w-[12%]">Rôles</TableHead>
                      <TableHead className="w-[9%]">Statut</TableHead>
                      <TableHead className="w-[11%]">Périmètre</TableHead>
                      <TableHead className="w-[18%] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="truncate font-medium text-foreground" title={r.username || undefined}>
                          {r.username || '—'}
                          {r.description && <div className="truncate text-micro font-normal text-muted-foreground" title={r.description}>{r.description}</div>}
                          {r.dateCreation && <div className="truncate text-micro font-normal text-muted-foreground">Créé le {formatDate(r.dateCreation)}</div>}
                        </TableCell>
                        <TableCell className="truncate text-muted-foreground" title={employeeName(r)}>{employeeName(r)}</TableCell>
                        <TableCell className="truncate text-muted-foreground" title={r.typeEmployeLibelle || undefined}>{r.typeEmployeLibelle || '—'}</TableCell>
                        <TableCell className="truncate text-muted-foreground" title={[r.email, r.mobile || r.phone].filter(Boolean).join(' · ') || undefined}>
                          <div className="truncate">{r.email || '—'}</div>
                          {(r.mobile || r.phone) && <div className="truncate text-micro">{r.mobile || r.phone}</div>}
                        </TableCell>
                        <TableCell>
                          {r.roles && r.roles.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {r.roles.map((role) => (
                                <Badge key={role} tone={role === 'Administrateur' ? 'amber' : 'neutral'}>{role}</Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col items-start gap-1">
                            <Badge tone={r.disabled ? 'neutral' : 'success'}>{r.disabled ? 'Désactivé' : 'Actif'}</Badge>
                            {!r.compteWebInitialise && <Badge tone="warning">Non initialisé</Badge>}
                            {r.compteWebInitialise && r.mustChangePassword && <Badge tone="info">Mdp à changer</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>{perimetreBadge(r.nombreProjets ?? 0, r.roles)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setDialogUser({ id: r.id, label: r.username || employeeName(r), roles: r.roles })}
                            >
                              <Building2 data-icon="inline-start" /> Affecter
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/utilisateurs/reinitialiser-mot-de-passe?admUserId=${r.id}`)}
                            >
                              <KeyRound data-icon="inline-start" /> Réinitialiser
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="shrink-0">
              {data && (
                <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
              )}
            </div>
          </ResultsRegion>
        )}
      </div>

      {dialogUser && (
        <AffecterProjetsDialog
          user={dialogUser}
          onClose={() => setDialogUser(null)}
          onSaved={refetch}
        />
      )}
    </AdminGuard>
  );
}
