import { useMemo, useState } from 'react';
import { RotateCcw, Search } from 'lucide-react';
import BarreFiltresArticles from './BarreFiltresArticles';
import ColumnSelector from '../ColumnSelector';
import DataGrid from '../DataGrid';
import EtatColonnes from '../EtatColonnes';
import MultiSelectDropdown from '../MultiSelectDropdown';
import Pagination from '../Pagination';
import { EmptyState, ErrorState, LoadingState, ResultsRegion } from '../ui';
import { Button } from '../ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group';
import { listLignesArticles } from '../../lib/apiSousArticles';
import {
  catalogueLignesArticles, dispositionLignesArticles, grilleLignesArticles, useFiltresArticles,
} from '../../lib/articlesListe';
import { useColonnesVisibles } from '../../lib/colonnes';
import { formatNumber } from '../../lib/format';
import { usePreview } from '../../lib/previewContext';
import { useColonnesArticles, useTranchesReferentiel } from '../../lib/referentiels';
import { useApi, useDebouncedValue } from '../../lib/useApi';

/** Liste à colonnes choisies (catalogue serveur) de `/articles` et `/sous-articles` : filtres, sélecteur, grille. */
export default function ListeLignesArticles({ liste, onOuvrir }: Readonly<{
  liste: 'articles' | 'sous-articles';
  onOuvrir: (id: string) => void;
}>) {
  const sous = liste === 'sous-articles';
  const nom = sous ? 'sous-article' : 'article';
  const { ouvrirFicheDossier } = usePreview();
  const tranches = useTranchesReferentiel();
  const catalogue = useColonnesArticles();
  const disposition = useMemo(() => dispositionLignesArticles(sous), [sous]);
  const colonnes = useColonnesVisibles(liste, catalogueLignesArticles(catalogue.data, sous), disposition);
  // Toujours explicite : les défauts du serveur ne portent ni le parent ni l'indicateur « parent occupé ».
  const demandees = [...new Set(colonnes.visibles.flatMap((n) => [n, ...(disposition.dependances?.[n] ?? [])]))];

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [trancheId, setTrancheId] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const filtres = useFiltresArticles(() => setPage(0));
  const hasActiveFilters = !!search || trancheId.length > 0 || filtres.actifs;

  function resetFilters() {
    setPage(0);
    setSearch('');
    setTrancheId([]);
    filtres.reinitialiser();
  }

  const { data, loading, error } = useApi(
    () =>
      demandees.length > 0
        ? listLignesArticles(
            liste,
            { search: debouncedSearch || undefined, trancheId: trancheId.length > 0 ? trancheId : undefined, ...filtres.params, colonnes: demandees },
            { page, size: 20 },
          )
        : Promise.resolve(null),
    [liste, debouncedSearch, trancheId.join(','), filtres.cle, page, demandees.join(',')],
  );
  const grille = useMemo(() => grilleLignesArticles(colonnes.colonnes, ouvrirFicheDossier), [colonnes.colonnes, ouvrirFicheDossier]);
  const rows = data?.content ?? [];

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <BarreFiltresArticles
        filtres={filtres}
        sousArticles={sous}
        onReinitialiser={resetFilters}
        avant={
          <>
            <InputGroup className="min-w-55 flex-1">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Recherche — code, description, parent, titre foncier…"
                value={search}
                onChange={(e) => {
                  setPage(0);
                  setSearch(e.target.value);
                }}
              />
            </InputGroup>
            <MultiSelectDropdown
              label="Tranche"
              placeholder={tranches.loading ? 'Chargement…' : 'Toutes'}
              value={trancheId}
              onChange={(v) => {
                setPage(0);
                setTrancheId(v);
              }}
              items={tranches.data.map((t) => ({ label: t.description || t.code || t.id, value: t.id }))}
            />
          </>
        }
      />

      {!data && !error && !catalogue.error && <LoadingState />}
      {(error || catalogue.error) && <ErrorState message={error ?? catalogue.error ?? ''} />}
      {!error && data && (
        <ResultsRegion loading={loading}>
          <div className="flex shrink-0 items-center justify-between gap-3">
            <div className="text-body text-muted-foreground">
              {formatNumber(data.totalElements)} {nom}{data.totalElements > 1 ? 's' : ''}
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
              title={hasActiveFilters ? 'Aucun résultat' : 'Rien à afficher'}
              message={hasActiveFilters ? `Aucun ${nom} ne correspond aux filtres actifs.` : `Aucun ${nom} n'est encore enregistré.`}
              action={
                hasActiveFilters ? (
                  <Button type="button" variant="outline" size="sm" onClick={() => resetFilters()}>
                    <RotateCcw data-icon="inline-start" /> Réinitialiser les filtres
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="min-h-0 min-w-0 flex-1 overflow-auto rounded-xl border border-border bg-card">
              <EtatColonnes pret={grille.length > 0} erreur={catalogue.error}>
                <DataGrid
                  cleOrdre={liste}
                  rows={rows}
                  colonnes={grille}
                  onOuvrir={onOuvrir}
                  libelleLigne={(a) => `Ouvrir la fiche de ${a.code ?? ''}`.trim()}
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
  );
}
