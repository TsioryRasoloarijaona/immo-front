import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Search } from 'lucide-react';
import PageShell from '../../components/PageShell';
import ColumnSelector from '../../components/ColumnSelector';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import EtatColonnes from '../../components/EtatColonnes';
import Pagination from '../../components/Pagination';
import { EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { DEFAULT_PAGE_SIZE, listTranches } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { poidsColonne, useColonnesVisibles } from '../../lib/colonnes';
import { DISPOSITION_TRANCHES } from '../../lib/dispositions';
import { formatNumber, formatPercent } from '../../lib/format';
import { useColonnesTranches } from '../../lib/referentiels';
import { estAdministrateur } from '../../lib/roles';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import type { ColonneDto, TrancheListItemDto } from '../../types';

const CLASSES: Record<string, string> = {
  description: 'font-medium text-foreground',
  code: 'font-mono text-micro text-muted-foreground',
};

const enPourcentage = (v: unknown) => formatPercent(typeof v === 'number' ? v : null, 2);

/** Catalogue serveur → grille ; un TAUX (fraction) s'affiche et se totalise en pourcentage. */
function versGrille(c: ColonneDto): ColonneGrille<TrancheListItemDto> {
  const base = {
    nom: c.nom,
    libelle: c.libelle,
    largeur: poidsColonne(c.nom, DISPOSITION_TRANCHES.poids),
    classe: CLASSES[c.nom] ?? 'text-muted-foreground',
  };
  if (c.type !== 'TAUX') return { ...base, type: c.type };
  return {
    ...base,
    type: 'NOMBRE',
    sansSomme: true,
    formatValeur: enPourcentage,
    rendu: (r) => enPourcentage((r as unknown as Record<string, unknown>)[c.nom]),
  };
}

export default function TranchesList() {
  const navigate = useNavigate();
  const admin = estAdministrateur(useAuth().user);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(0);

  const catalogue = useColonnesTranches();
  const colonnes = useColonnesVisibles('tranches', catalogue.data, DISPOSITION_TRANCHES);
  const demandees = colonnes.demandees;
  const grille = useMemo(() => colonnes.colonnes.map(versGrille), [colonnes.colonnes]);

  const { data, loading, error } = useApi(
    () => listTranches({ search: debouncedSearch || undefined }, { page, size: DEFAULT_PAGE_SIZE }, { colonnes: demandees }),
    [debouncedSearch, page, demandees?.join(',') ?? ''],
    'tranches',
  );
  const rows = data?.content ?? [];

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
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <InputGroup className="min-w-55 max-w-md flex-1">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Rechercher — code, libellé, ville, programme, entité…"
              value={search}
              onChange={(e) => {
                setPage(0);
                setSearch(e.target.value);
              }}
            />
          </InputGroup>
        </div>

        {loading && !data && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && data && (
          <ResultsRegion loading={loading}>
            <div className="flex shrink-0 items-center justify-between gap-3">
              <div className="text-body text-muted-foreground">
                {formatNumber(data.totalElements)} tranche{data.totalElements > 1 ? 's' : ''}
              </div>
              {colonnes.catalogueServi.length > 0 && (
                <ColumnSelector
                  catalogue={colonnes.catalogueServi}
                  visibles={colonnes.visibles}
                  onBasculer={colonnes.basculer}
                  onReinitialiser={colonnes.reinitialiser}
                  estDefaut={colonnes.estDefaut}
                />
              )}
            </div>
            {rows.length === 0 ? (
              <EmptyState
                title={search ? 'Aucun résultat' : 'Rien à afficher'}
                message={search ? 'Aucune tranche ne correspond à la recherche.' : "Aucune tranche n'est encore enregistrée."}
              />
            ) : (
              <div className="min-h-0 min-w-0 flex-1 overflow-auto rounded-xl border border-border bg-card">
                <EtatColonnes pret={grille.length > 0} erreur={catalogue.error}>
                  <DataGrid
                    cleOrdre="tranches"
                    rows={rows}
                    colonnes={grille}
                    onOuvrir={(id) => navigate(`/tranches/${id}`)}
                    libelleLigne={(t) => `Ouvrir la tranche ${t.description || t.code || t.id}`}
                  />
                </EtatColonnes>
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
