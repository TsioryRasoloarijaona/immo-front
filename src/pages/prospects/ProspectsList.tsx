import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { FicheProspect } from './ProspectDetail';
import { voisinsDe } from '../../lib/fenetreFiche';
import { RotateCcw } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import ColumnSelector from '../../components/ColumnSelector';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import ProspectTable from '../../components/ProspectTable';
import EtatColonnes from '../../components/EtatColonnes';
import PageListe from '../../components/liste/PageListe';
import EnteteListe from '../../components/liste/EnteteListe';
import PanneauFiltresCoches from '../../components/liste/PanneauFiltresCoches';
import BoiteFiltre from '../../components/liste/BoiteFiltre';
import BarreEtatListe from '../../components/liste/BarreEtatListe';
import BarreOutilsFlottante from '../../components/liste/BarreOutilsFlottante';
import { DEFAULT_PAGE_SIZE, listProspects } from '../../lib/api';
import { refetchAllApis, useApi, useDebouncedValue } from '../../lib/useApi';
import { useColonnesVisibles } from '../../lib/colonnes';
import { DISPOSITION_PROSPECTS } from '../../lib/dispositions';
import { useColonnesProspects, useTierTypes } from '../../lib/referentiels';
import { cleFiltresFermes, useBooleenMemorise } from '../../lib/outilsListe';
import { puceSelection } from '../../lib/pucesFiltres';
import { useExportListe } from '../../lib/useExportListe';
import { pluriel } from '../../lib/format';

export default function ProspectsList() {
  const navigate = useNavigate();
  // `/prospects/:id` rend cette même page : la liste (filtres, page) reste montée sous la fenêtre.
  const { id: idOuvert } = useParams();
  const { search: rechercheUrl } = useLocation();
  const tierTypes = useTierTypes();
  const [filtresFermes, basculerFiltres] = useBooleenMemorise(cleFiltresFermes('prospects'));

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [type, setType] = useState<string[]>([]);
  const [page, setPage] = useState(0);

  const catalogue = useColonnesProspects();
  const colonnes = useColonnesVisibles('prospects', catalogue.data, DISPOSITION_PROSPECTS);
  const colonnesDemandees = colonnes.demandees;

  function resetAndSet<T>(setter: (v: T) => void, v: T) {
    setPage(0);
    setter(v);
  }

  function resetFilters() {
    setPage(0);
    setSearch('');
    setType([]);
  }

  const hasActiveFilters =
    !!search || type.length > 0;

  const filtresServeur = { search: debouncedSearch || undefined, type: type.length > 0 ? type : undefined };

  const { data, loading, error } = useApi(
    () =>
      listProspects(
        filtresServeur,
        { page, size: DEFAULT_PAGE_SIZE },
        { colonnes: colonnesDemandees },
      ),
    [debouncedSearch, type.join(','), page, colonnesDemandees?.join(',') ?? ''],
    'prospects',
  );
  const rows = data?.content ?? [];

  // `type` porte le *code* du type de tiers (« PRO »), pas sa `description` : filtrer sur `code`.
  const typeItems = tierTypes.data.map((t) => ({ label: t.description || t.code || t.id, value: t.code || t.id }));

  const exportListe = useExportListe('/api/prospects/export', { ...filtresServeur, colonnes: colonnes.visibles }, 'prospects');
  const puces = [...puceSelection('Type', typeItems, type), ...(search ? [`« ${search} »`] : [])];
  const decompte = data ? pluriel(data.totalElements, 'prospect') : undefined;

  const ouvrirChemin = (chemin: string) => void navigate(`${chemin}${rechercheUrl}`);
  // ‹ › : lignes de la page affichée seulement.
  const voisins = voisinsDe(rows.map((r) => r.id), idOuvert, (id) => ouvrirChemin(`/prospects/${id}`));

  const grille = (
    <EtatColonnes pret={colonnes.colonnes.length > 0} erreur={catalogue.error}>
      <ProspectTable
        rows={rows}
        colonnes={colonnes.colonnes}
        cleOrdre="prospects"
        onOuvrir={(id) => ouvrirChemin(`/prospects/${id}`)}
      />
    </EtatColonnes>
  );

  return (
    <PageListe titre="Prospects">
      <EnteteListe titre="Prospects" lignes={decompte}>
        {colonnes.catalogueServi.length > 0 && (
          <ColumnSelector
            compact
            catalogue={colonnes.catalogueServi}
            visibles={colonnes.visibles}
            onBasculer={colonnes.basculer}
            onReinitialiser={colonnes.reinitialiser}
            estDefaut={colonnes.estDefaut}
          />
        )}
      </EnteteListe>
      <PanneauFiltresCoches
        ferme={filtresFermes}
        onBasculer={basculerFiltres}
        puces={puces}
        recherche={{
          valeur: search,
          onChange: (v) => resetAndSet(setSearch, v),
          placeholder: 'Nom, téléphone, email…',
        }}
        onReinitialiser={resetFilters}
      >
        <BoiteFiltre titre="Type" mode="multiple" items={typeItems} valeur={type} onChange={(v) => resetAndSet(setType, v)} />
      </PanneauFiltresCoches>

      <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 pt-2">
        {loading && !data && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && data && (
          <ResultsRegion loading={loading}>
            {rows.length === 0 ? (
              <EmptyState
                title={hasActiveFilters ? 'Aucun résultat' : 'Rien à afficher'}
                message={
                  hasActiveFilters
                    ? 'Aucun prospect ne correspond aux filtres actifs.'
                    : "Aucun prospect n'est encore enregistré."
                }
                action={
                  hasActiveFilters ? (
                    <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
                      <RotateCcw data-icon="inline-start" /> Réinitialiser les filtres
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              /* `min-w-0` : sans lui la largeur de la table remonte la chaîne flex
                 et élargit la page au lieu de défiler. */
              <div className="min-h-0 min-w-0 flex-1 overflow-auto rounded-xl border border-border bg-card">
                {grille}
              </div>
            )}
            <div className="shrink-0">
              <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
            </div>
          </ResultsRegion>
        )}
      </div>
      {idOuvert && <FicheProspect key={idOuvert} id={idOuvert} client={false} voisins={voisins} onFermer={() => ouvrirChemin('/prospects')} />}
      <BarreEtatListe lignes={decompte ?? '—'} selection="aucune" alerte={exportListe.erreur} />
      <BarreOutilsFlottante
        cle="prospects"
        ligneSelectionnee={false}
        nouveau={{ libelle: 'Nouveau prospect', onClick: () => void navigate('/prospects/nouveau') }}
        actions={[
          { id: 'rafraichir', onClick: refetchAllApis },
          { id: 'exporter', onClick: () => void exportListe.exporter('xlsx'), disabled: exportListe.enCours },
        ]}
      />
    </PageListe>
  );
}
