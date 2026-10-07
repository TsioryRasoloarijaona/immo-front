import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, KeyRound, RotateCcw, Search, Users } from 'lucide-react';
import { Badge, EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import { DEFAULT_PAGE_SIZE, listUtilisateurs } from '../../lib/api';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { formatDate } from '../../lib/format';
import type { UtilisateurListItemDto } from '../../types';
import AdminGuard from './AdminGuard';
import AffecterProjetsDialog from './AffecterProjetsDialog';
import type { CompteAReinitialiser } from './ReinitialiserMotDePasse';

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

type DisabledFilter = 'all' | 'active' | 'disabled';

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

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [disabledFilter, setDisabledFilter] = useState<DisabledFilter>('all');
  const [page, setPage] = useState(0);

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
    'utilisateurs',
  );
  const rows = data?.content ?? [];

  /* Les lignes ne sont pas cliquables ici : l'écran agit par ses boutons
     « Affecter » et « Réinitialiser », il n'y a pas de fiche à ouvrir. On ne
     passe donc ni `onOuvrir` ni `libelleLigne` — DataGrid retire alors le
     curseur et le focus de ligne. */
  const colonnes = useMemo<ColonneGrille<UtilisateurListItemDto>[]>(
    () => [
      {
        nom: 'username',
        libelle: 'Identifiant',
        largeur: 14,
        classe: 'font-medium text-foreground',
        titre: (r) => r.username || undefined,
        rendu: (r) => (
          <>
            {r.username || '—'}
            {r.description && (
              <div className="truncate text-micro font-normal text-muted-foreground" title={r.description}>
                {r.description}
              </div>
            )}
            {r.dateCreation && (
              <div className="truncate text-micro font-normal text-muted-foreground">Créé le {formatDate(r.dateCreation)}</div>
            )}
          </>
        ),
      },
      { nom: 'employe', libelle: 'Employé', largeur: 13, classe: 'text-muted-foreground', valeur: employeeName, rendu: employeeName, titre: employeeName },
      { nom: 'typeEmployeLibelle', libelle: 'Type', largeur: 9, classe: 'text-muted-foreground', titre: (r) => r.typeEmployeLibelle || undefined },
      {
        nom: 'email',
        libelle: 'Contact',
        largeur: 14,
        classe: 'text-muted-foreground',
        titre: (r) => [r.email, r.mobile || r.phone].filter(Boolean).join(' · ') || undefined,
        rendu: (r) => (
          <>
            <div className="truncate">{r.email || '—'}</div>
            {(r.mobile || r.phone) && <div className="truncate text-micro">{r.mobile || r.phone}</div>}
          </>
        ),
      },
      {
        nom: 'roles',
        libelle: 'Rôles',
        largeur: 12,
        // Tri et filtre sur les rôles concaténés : taper « admin » doit
        // trouver la ligne, même si le rôle est un parmi plusieurs.
        valeur: (r) => (r.roles ?? []).join(', '),
        rendu: (r) =>
          r.roles && r.roles.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {r.roles.map((role) => (
                <Badge key={role} tone={role === 'Administrateur' ? 'amber' : 'neutral'}>
                  {role}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        nom: 'statut',
        libelle: 'Statut',
        largeur: 9,
        valeur: (r) => (r.disabled ? 'Désactivé' : 'Actif'),
        rendu: (r) => (
          <div className="flex flex-col items-start gap-1">
            <Badge tone={r.disabled ? 'neutral' : 'success'}>{r.disabled ? 'Désactivé' : 'Actif'}</Badge>
            {/* mustChangePassword/profileCompleted sont des drapeaux hérités, ignorés
                depuis FEATURE-acces-arpent-depuis-omran : seul compte l'absence
                d'accès web, qu'ouvre « Réinitialiser ». */}
            {!r.compteWebInitialise && <Badge tone="warning">Non initialisé</Badge>}
          </div>
        ),
      },
      {
        nom: 'nombreProjets',
        libelle: 'Périmètre',
        largeur: 11,
        rendu: (r) => perimetreBadge(r.nombreProjets ?? 0, r.roles),
      },
      {
        nom: 'actions',
        libelle: 'Actions',
        largeur: 18,
        rendu: (r) => (
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
              onClick={() => {
                const compte: CompteAReinitialiser = { username: r.username, description: r.description, email: r.email };
                navigate(`/utilisateurs/reinitialiser-mot-de-passe?admUserId=${r.id}`, { state: compte });
              }}
            >
              <KeyRound data-icon="inline-start" /> Réinitialiser
            </Button>
          </div>
        ),
      },
    ],
    [navigate],
  );

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
        <p className="shrink-0 text-body text-muted-foreground">
          Les comptes se créent dans Omran. Ici : ouvrir l'accès Arpent d'un compte (« Réinitialiser ») et affecter son périmètre.
        </p>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
            <InputGroup className="min-w-55 flex-1">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Recherche — identifiant, description, email…"
                value={search}
                onChange={(e) => resetAndSet(setSearch, e.target.value)}
              />
            </InputGroup>
            <Select items={DISABLED_ITEMS} value={disabledFilter} onValueChange={(v) => resetAndSet(setDisabledFilter, v as DisabledFilter)}>
              <SelectTrigger className="w-45">
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
              <div className="min-h-0 min-w-0 flex-1 overflow-auto rounded-xl border border-border bg-card">
                <DataGrid rows={rows} colonnes={colonnes} cleOrdre="utilisateurs" />
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
