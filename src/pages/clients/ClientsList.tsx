import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, Search, UserCheck } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import { DEFAULT_PAGE_SIZE, listClients } from '../../lib/api';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import type { ClientListItemDto } from '../../types';

const COLONNES: ColonneGrille<ClientListItemDto>[] = [
  { nom: 'nomAffiche', libelle: 'Affiché comme', largeur: 18, classe: 'font-medium text-foreground', titre: (r) => r.nomAffiche || undefined },
  { nom: 'email', libelle: 'Email', largeur: 16, classe: 'text-muted-foreground', titre: (r) => r.email || undefined },
  { nom: 'mobile', libelle: 'Mobile', largeur: 11, classe: 'tabular-nums text-muted-foreground' },
  { nom: 'telephone', libelle: 'Téléphone', largeur: 11, classe: 'tabular-nums text-muted-foreground' },
  { nom: 'ville', libelle: 'Ville', largeur: 10, classe: 'text-muted-foreground' },
  { nom: 'nbDossiers', libelle: 'Dossiers', type: 'NOMBRE', largeur: 8, classe: 'text-muted-foreground' },
  { nom: 'totalAPayer', libelle: 'À payer', type: 'MONTANT', largeur: 12, classe: 'text-foreground' },
  { nom: 'totalRegle', libelle: 'Réglé', type: 'MONTANT', largeur: 12, classe: 'text-(--success)' },
  { nom: 'totalReste', libelle: 'Reste', type: 'MONTANT', largeur: 12, classe: 'text-destructive' },
  { nom: 'code', libelle: 'Code', largeur: 10, classe: 'text-muted-foreground' },
];

export default function ClientsList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(0);

  const { data, loading, error } = useApi(
    () => listClients({ search: debouncedSearch || undefined }, { page, size: DEFAULT_PAGE_SIZE }),
    [debouncedSearch, page],
    'clients',
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
      fullHeight
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
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

        {loading && !data && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && data && (
          <ResultsRegion loading={loading}>
            <div className="shrink-0 text-body text-muted-foreground">
              {data.totalElements} client{data.totalElements > 1 ? 's' : ''}
            </div>
          {rows.length === 0 ? (
            <EmptyState
              title={search ? 'Aucun résultat' : 'Rien à afficher'}
              message={
                search
                  ? 'Aucun client ne correspond aux filtres actifs.'
                  : "Aucun client n'est encore enregistré."
              }
              action={
                search ? (
                  <Button type="button" variant="outline" size="sm" onClick={() => { setPage(0); setSearch(''); }}>
                    <RotateCcw data-icon="inline-start" /> Réinitialiser les filtres
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="min-h-0 min-w-0 flex-1 overflow-auto rounded-xl border border-border bg-card">
              <DataGrid
                cleOrdre="clients"
                rows={rows}
                colonnes={COLONNES}
                onOuvrir={(id) => navigate(`/clients/${id}`)}
                libelleLigne={(r) => `Ouvrir la fiche de ${r.nomAffiche || r.code}`}
              />
            </div>
          )}
            <div className="shrink-0">
              <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
            </div>
          </ResultsRegion>
        )}
      </div>
    </PageShell>
  );
}
