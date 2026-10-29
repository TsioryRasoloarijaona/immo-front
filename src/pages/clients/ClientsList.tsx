import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { FicheProspect } from '../prospects/ProspectDetail';
import { voisinsDe } from '../../lib/fenetreFiche';
import { RotateCcw } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import PageListe from '../../components/liste/PageListe';
import EnteteListe from '../../components/liste/EnteteListe';
import PanneauFiltresCoches from '../../components/liste/PanneauFiltresCoches';
import BarreEtatListe from '../../components/liste/BarreEtatListe';
import BarreOutilsFlottante from '../../components/liste/BarreOutilsFlottante';
import { DEFAULT_PAGE_SIZE, listClients } from '../../lib/api';
import { refetchAllApis, useApi, useDebouncedValue } from '../../lib/useApi';
import { cleFiltresFermes, useBooleenMemorise } from '../../lib/outilsListe';
import { pluriel } from '../../lib/format';
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
  // `/clients/:id` rend cette même page : la liste (filtres, page) reste montée sous la fenêtre.
  const { id: idOuvert } = useParams();
  const { search: rechercheUrl } = useLocation();
  const [filtresFermes, basculerFiltres] = useBooleenMemorise(cleFiltresFermes('clients'));
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

  function resetFilters() {
    setPage(0);
    setSearch('');
  }

  const decompte = data ? pluriel(data.totalElements, 'client') : undefined;
  const ouvrirChemin = (chemin: string) => void navigate(`${chemin}${rechercheUrl}`);
  // ‹ › : lignes de la page affichée seulement.
  const voisins = voisinsDe(rows.map((r) => r.id), idOuvert, (id) => ouvrirChemin(`/clients/${id}`));

  return (
    <PageListe titre="Clients">
      <EnteteListe titre="Clients" lignes={decompte} />
      <PanneauFiltresCoches
        ferme={filtresFermes}
        onBasculer={basculerFiltres}
        puces={search ? [`« ${search} »`] : []}
        recherche={{
          valeur: search,
          onChange: (v) => resetAndSet(setSearch, v),
          placeholder: 'Nom, téléphone, email…',
        }}
        onReinitialiser={resetFilters}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 pt-2">
        {loading && !data && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && data && (
          <ResultsRegion loading={loading}>
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
                    <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
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
                  onOuvrir={(id) => ouvrirChemin(`/clients/${id}`)}
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
      {idOuvert && <FicheProspect key={idOuvert} id={idOuvert} client voisins={voisins} onFermer={() => ouvrirChemin('/clients')} />}
      <BarreEtatListe lignes={decompte ?? '—'} selection="aucune" />
      <BarreOutilsFlottante cle="clients" ligneSelectionnee={false} actions={[{ id: 'rafraichir', onClick: refetchAllApis }]} />
    </PageListe>
  );
}
