import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import FicheOffreFenetre from '../../components/offre/fiche/FicheOffreFenetre';
import { voisinsDe } from '../../lib/fenetreFiche';
import { Badge, ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import ColumnSelector from '../../components/ColumnSelector';
import DevisFormSection from '../../components/DevisFormSection';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import { DialogFooter } from '../../components/ui/dialog';
import { Field as FormField, FieldLabel } from '../../components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import DataGrid from '../../components/DataGrid';
import PageListe from '../../components/liste/PageListe';
import EnteteListe from '../../components/liste/EnteteListe';
import PanneauFiltresCoches from '../../components/liste/PanneauFiltresCoches';
import BoiteFiltre from '../../components/liste/BoiteFiltre';
import EtatVideListe from '../../components/liste/EtatVideListe';
import BarreEtatListe from '../../components/liste/BarreEtatListe';
import BarreOutilsFlottante from '../../components/liste/BarreOutilsFlottante';
import { creerDevis, DEFAULT_PAGE_SIZE, getProspection, listOffres, listProspections } from '../../lib/api';
import { useColonnesVisibles } from '../../lib/colonnes';
import { CATALOGUE_OFFRES, COLONNES_OFFRES, detailOffre, DISPOSITION_OFFRES } from '../../lib/offres';
import { useTranchesFiltre } from '../../lib/referentiels';
import { refetchAllApis, useApi, useDebouncedValue } from '../../lib/useApi';
import { useAppData, commercialLabel } from '../../lib/appData';
import { cleFiltresFermes, useBooleenMemorise } from '../../lib/outilsListe';
import { puceSelection, puceUnique } from '../../lib/pucesFiltres';
import { debutMoisISO, finMoisISO, formatCurrency, pluriel } from '../../lib/format';
import { prospectionDisplayName } from '../../lib/domain';
import type { CreerDevisRequest, ProspectionListItemDto } from '../../types';

export default function OffresList() {
  const { commerciaux } = useAppData();
  const [filtresFermes, basculerFiltres] = useBooleenMemorise(cleFiltresFermes('offres'));

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [trancheIds, setTrancheIds] = useState<string[]>([]);
  const [commercial, setCommercial] = useState<string | null>(null);
  const [dateDebut, setDateDebut] = useState(debutMoisISO);
  const [dateFin, setDateFin] = useState(finMoisISO);
  const [page, setPage] = useState(0);
  const navigate = useNavigate();
  const { id: idOuvert } = useParams();
  const [showCreate, setShowCreate] = useState(false);

  const { data, loading, error, refetch } = useApi(
    () =>
      listOffres(
        {
          search: debouncedSearch || undefined,
          trancheId: trancheIds.length > 0 ? trancheIds : undefined,
          commercial: commercial || undefined,
          dateDebut: dateDebut ? `${dateDebut}T00:00:00` : undefined,
          dateFin: dateFin ? `${dateFin}T23:59:59` : undefined,
        },
        // Tri sur `docDate` (propriété d'entité), pas `dateDocument` (champ du DTO) : sinon 400.
        { page, size: DEFAULT_PAGE_SIZE, sort: ['docDate,desc'] },
      ),
    [debouncedSearch, trancheIds.join(','), commercial, dateDebut, dateFin, page],
    'offres',
  );
  const offres = data?.content ?? [];
  // Somme de la page chargée seulement, pas un total plein-filtre.
  const totalPageTTC = data?.sommePrixVenteTTCPage ?? 0;
  // Sélecteur local : chaque ligne porte déjà tous les montants, cocher une colonne ne refait pas la requête.
  const colonnes = useColonnesVisibles('offres', CATALOGUE_OFFRES, DISPOSITION_OFFRES);
  const grille = COLONNES_OFFRES.filter((c) => colonnes.visibles.includes(c.nom));

  const tranches = useTranchesFiltre();
  const trancheItems = tranches.data.map((t) => ({
    label: t.description || t.code || t.id,
    value: t.id,
  }));

  const commercialItems = commerciaux.map((c) => ({ label: commercialLabel(c), value: c.id }));

  function resetAndSet<T>(setter: (v: T) => void, v: T) {
    setPage(0);
    setter(v);
  }

  function periodeChangee(debut: string, fin: string) {
    setPage(0);
    setDateDebut(debut);
    setDateFin(fin);
  }

  function resetFilters() {
    setPage(0);
    setSearch('');
    setTrancheIds([]);
    setCommercial(null);
    setDateDebut(debutMoisISO());
    setDateFin(finMoisISO());
  }

  function toutesLesPeriodes() {
    periodeChangee('', '');
  }

  // Les dates se comparent au défaut (le mois courant), pas au vide.
  const hasActiveFilters =
    !!search || trancheIds.length > 0 || !!commercial || dateDebut !== debutMoisISO() || dateFin !== finMoisISO();

  const puces = [
    ...puceSelection('Entité', trancheItems, trancheIds),
    ...puceUnique(commercialItems, commercial),
    ...(search ? [`« ${search} »`] : []),
  ];
  const decompte = data ? pluriel(data.totalElements, 'offre') : undefined;
  const ouvrir = (id: string) => void navigate(`/offres/${id}`);
  const voisins = voisinsDe(offres.map((o) => o.id), idOuvert, ouvrir);

  return (
    <PageListe titre="Offres">
      <EnteteListe titre="Offres" lignes={decompte}>
        <ColumnSelector
          compact
          catalogue={colonnes.catalogueServi}
          visibles={colonnes.visibles}
          onBasculer={colonnes.basculer}
          onReinitialiser={colonnes.reinitialiser}
          estDefaut={colonnes.estDefaut}
        />
      </EnteteListe>
      {showCreate && <NouvelleOffreDialog onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); void refetch(); }} />}
      <PanneauFiltresCoches
        ferme={filtresFermes}
        onBasculer={basculerFiltres}
        puces={puces}
        periode={{ debut: dateDebut, fin: dateFin, onChange: periodeChangee }}
        recherche={{
          valeur: search,
          onChange: (v) => resetAndSet(setSearch, v),
          placeholder: 'Code, prospect, article…',
        }}
        onReinitialiser={resetFilters}
      >
        <BoiteFiltre titre="Entité" mode="multiple" items={trancheItems} valeur={trancheIds} onChange={(v) => resetAndSet(setTrancheIds, v)} />
        <BoiteFiltre titre="Commercial" mode="unique" items={commercialItems} valeur={commercial} onChange={(v) => resetAndSet(setCommercial, v)} />
      </PanneauFiltresCoches>

      <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 pt-2">
        {loading && !data && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && data && (
          <ResultsRegion loading={loading}>
            {offres.length > 0 && (
              <span className="shrink-0 text-body text-muted-foreground">
                Total (page) <span className="font-semibold tabular-nums text-(--success)">{formatCurrency(totalPageTTC)}</span>
              </span>
            )}
            {offres.length === 0 ? (
              <EtatVideListe
                filtresActifs={hasActiveFilters}
                sujet="offre"
                surMois="Aucune offre sur le mois en cours."
                onReinitialiser={resetFilters}
                onToutesPeriodes={toutesLesPeriodes}
              />
            ) : (
              <div className="min-h-0 min-w-0 flex-1 overflow-auto rounded-xl border border-border bg-card">
                <DataGrid
                  cleOrdre="offres"
                  rows={offres}
                  colonnes={grille}
                  onOuvrir={ouvrir}
                  libelleLigne={(o) => `Offre ${o.code ?? ''}`.trim()}
                  rendreDetail={detailOffre}
                />
              </div>
            )}
            <div className="shrink-0">
              <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
            </div>
          </ResultsRegion>
        )}
      </div>
      <BarreEtatListe lignes={decompte ?? '—'} selection="aucune" />
      <BarreOutilsFlottante
        cle="offres"
        ligneSelectionnee={false}
        nouveau={{ libelle: 'Nouvelle offre', onClick: () => setShowCreate(true) }}
        actions={[{ id: 'rafraichir', onClick: refetchAllApis }]}
      />
      {idOuvert && <FicheOffreFenetre key={idOuvert} id={idOuvert} voisins={voisins} onFermer={() => void navigate('/offres')} />}
    </PageListe>
  );
}

// Prospection d'abord : `POST /api/prospections/{id}/devis` est le seul endpoint de création.
function NouvelleOffreDialog({ onClose, onCreated }: Readonly<{ onClose: () => void; onCreated: () => void }>) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [pickedId, setPickedId] = useState<string | null>(null);

  const results = useApi(
    () => (pickedId || debouncedSearch.trim().length < 2 ? Promise.resolve(null) : listProspections({ search: debouncedSearch }, { page: 0, size: 8 })),
    [debouncedSearch, pickedId],
  );
  const picked = useApi(() => (pickedId ? getProspection(pickedId) : Promise.resolve(null)), [pickedId]);

  async function handleAdd(body: CreerDevisRequest) {
    if (!pickedId) return;
    await creerDevis(pickedId, body);
    onCreated();
  }

  return (
    <Modal title="Nouvelle offre" onClose={onClose} width={760}>
      {!pickedId ? (
        <div className="flex flex-col gap-2.5">
          <FormField>
            <FieldLabel htmlFor="offre-prospection-search">Prospection</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                id="offre-prospection-search"
                placeholder="Rechercher par nom, code…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                // eslint-disable-next-line jsx-a11y/no-autofocus -- boîte de dialogue : le focus initial y est attendu
                autoFocus
              />
            </InputGroup>
          </FormField>
          <ResultatsProspections
            recherche={search}
            chargement={results.loading}
            prospections={results.data?.content ?? []}
            onChoisir={setPickedId}
          />
          <DialogFooter className="mt-1.5">
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
          </DialogFooter>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2">
            <span className="text-body">
              <span className="font-medium text-foreground">{picked.data ? prospectionDisplayName(picked.data) : 'Chargement…'}</span>
              {picked.data?.code && <span className="text-muted-foreground"> · {picked.data.code}</span>}
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={() => setPickedId(null)}>
              Changer de prospection
            </Button>
          </div>
          {picked.data && (
            <DevisFormSection
              bare
              defaultTrancheId={picked.data.trancheId ?? undefined}
              defaultArticleId={picked.data.articleId ?? undefined}
              defaultProspectId={picked.data.prospectId ?? undefined}
              defaultCommercialId={picked.data.commercialId ?? undefined}
              onAdd={handleAdd}
            />
          )}
        </div>
      )}
    </Modal>
  );
}

function ResultatsProspections({
  recherche,
  chargement,
  prospections,
  onChoisir,
}: Readonly<{
  recherche: string;
  chargement: boolean;
  prospections: ProspectionListItemDto[];
  onChoisir: (id: string) => void;
}>) {
  if (recherche.trim().length < 2) {
    return <p className="text-body text-muted-foreground">Tapez au moins 2 caractères pour rechercher une prospection.</p>;
  }
  if (chargement) return <p className="text-body text-muted-foreground">Recherche…</p>;
  if (prospections.length === 0) return <p className="text-body text-muted-foreground">Aucune prospection trouvée.</p>;
  return (
    <div className="flex max-h-80 flex-col gap-1.5 overflow-y-auto">
      {prospections.map((p) => (
        <button
          key={p.id}
          type="button"
          className="flex items-center justify-between gap-2 rounded-lg bg-muted/30 px-3 py-2 text-left text-body hover:bg-muted/50"
          onClick={() => onChoisir(p.id)}
        >
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-medium text-foreground">{prospectionDisplayName(p)}</span>
            <span className="truncate text-micro text-muted-foreground">
              {p.code}
              {p.etape ? ` · ${p.etape}` : ''}
            </span>
          </span>
          {p.commercialNom && <Badge tone="neutral">{p.commercialNom}</Badge>}
        </button>
      ))}
    </div>
  );
}

