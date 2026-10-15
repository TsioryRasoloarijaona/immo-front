import { useState } from 'react';
import { CalendarRange, FileText, Plus, RotateCcw, Search } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import ColumnSelector from '../../components/ColumnSelector';
import DevisFormSection from '../../components/DevisFormSection';
import Modal from '../../components/Modal';
import MultiSelectDropdown from '../../components/MultiSelectDropdown';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import { DialogFooter } from '../../components/ui/dialog';
import { Field as FormField, FieldLabel } from '../../components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import DataGrid from '../../components/DataGrid';
import { creerDevis, DEFAULT_PAGE_SIZE, getProspection, listOffres, listProspections } from '../../lib/api';
import { useColonnesVisibles } from '../../lib/colonnes';
import { CATALOGUE_OFFRES, COLONNES_OFFRES, detailOffre, DISPOSITION_OFFRES } from '../../lib/offres';
import { useTranchesFiltre } from '../../lib/referentiels';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { useAppData, commercialLabel } from '../../lib/appData';
import { formatCurrency, jourISO } from '../../lib/format';
import { prospectionDisplayName } from '../../lib/domain';
import type { CreerDevisRequest, ProspectionListItemDto } from '../../types';

type PeriodePreset = 'custom' | 'mois-courant' | 'mois-dernier' | 'annee-courante';

const PERIODE_ITEMS: { label: string; value: PeriodePreset }[] = [
  { label: 'Toutes les périodes', value: 'custom' },
  { label: 'Le mois en cours', value: 'mois-courant' },
  { label: 'Le mois dernier', value: 'mois-dernier' },
  { label: "L'année en cours", value: 'annee-courante' },
];

const PERIODE_DEFAUT: PeriodePreset = 'mois-courant';

/* `jourISO` et non `toISOString()` : les bornes sont en heure locale, la
   conversion UTC les ferait reculer d'un jour à l'est de Greenwich. */
const isoDate = jourISO;

function rangeForPreset(preset: PeriodePreset): { dateDebut: string; dateFin: string } {
  const now = new Date();
  if (preset === 'mois-courant') {
    return {
      dateDebut: isoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
      dateFin: isoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    };
  }
  if (preset === 'mois-dernier') {
    return {
      dateDebut: isoDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
      dateFin: isoDate(new Date(now.getFullYear(), now.getMonth(), 0)),
    };
  }
  if (preset === 'annee-courante') {
    return {
      dateDebut: isoDate(new Date(now.getFullYear(), 0, 1)),
      dateFin: isoDate(new Date(now.getFullYear(), 11, 31)),
    };
  }
  return { dateDebut: '', dateFin: '' };
}

export default function OffresList() {
  const { commerciaux } = useAppData();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [trancheIds, setTrancheIds] = useState<string[]>([]);
  const [commercial, setCommercial] = useState('all');
  const [periode, setPeriode] = useState<PeriodePreset>(PERIODE_DEFAUT);
  const [dateDebut, setDateDebut] = useState(() => rangeForPreset(PERIODE_DEFAUT).dateDebut);
  const [dateFin, setDateFin] = useState(() => rangeForPreset(PERIODE_DEFAUT).dateFin);
  const [page, setPage] = useState(0);
  // Pas de `onOuvrir` : la ligne déplie les montants ; le code de l'offre ouvre sa fiche.
  const [showCreate, setShowCreate] = useState(false);

  const { data, loading, error, refetch } = useApi(
    () =>
      listOffres(
        {
          search: debouncedSearch || undefined,
          trancheId: trancheIds.length > 0 ? trancheIds : undefined,
          commercial: commercial !== 'all' ? commercial : undefined,
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

  const commercialItems = [
    { label: 'Tous les commerciaux', value: 'all' },
    ...commerciaux.map((c) => ({ label: commercialLabel(c), value: c.id })),
  ];

  function resetAndSet<T>(setter: (v: T) => void, v: T) {
    setPage(0);
    setter(v);
  }

  function handlePeriodeChange(v: PeriodePreset) {
    setPage(0);
    setPeriode(v);
    const range = rangeForPreset(v);
    setDateDebut(range.dateDebut);
    setDateFin(range.dateFin);
  }

  function resetFilters() {
    setPage(0);
    setSearch('');
    setTrancheIds([]);
    setCommercial('all');
    handlePeriodeChange(PERIODE_DEFAUT);
  }

  // Saisir une date repasse le préréglage à `custom` : le comparer au défaut couvre les deux champs.
  const hasActiveFilters =
    !!search || trancheIds.length > 0 || commercial !== 'all' || periode !== PERIODE_DEFAUT;

  return (
    <PageShell
      title="Offres"
      crumbs={[{ label: 'Ventes' }, { label: 'Offres' }]}
      fullHeight
      icon={<FileText />}
      accent="var(--sec-offre)"
      accentBg="var(--sec-offre-bg)"
      actions={
        <Button type="button" size="sm" onClick={() => setShowCreate(true)}>
          <Plus data-icon="inline-start" /> Nouvelle offre
        </Button>
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        {showCreate && <NouvelleOffreDialog onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); void refetch(); }} />}

        <div className="flex shrink-0 flex-wrap items-center gap-2">
            <InputGroup className="min-w-55 flex-1">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Recherche multi-critère — code, prospect, article…"
                value={search}
                onChange={(e) => resetAndSet(setSearch, e.target.value)}
              />
            </InputGroup>
            <MultiSelectDropdown
              label="Entité"
              placeholder="Toutes"
              value={trancheIds}
              onChange={(v) => resetAndSet(setTrancheIds, v)}
              items={trancheItems}
            />
            <div className="flex items-center gap-1.5">
              <Select items={PERIODE_ITEMS} value={periode} onValueChange={(v) => handlePeriodeChange(v as PeriodePreset)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {PERIODE_ITEMS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <InputGroup className="w-32.5">
                <InputGroupInput
                  type="date"
                  aria-label="Du"
                  value={dateDebut}
                  onChange={(e) => { resetAndSet(setDateDebut, e.target.value); setPeriode('custom'); }}
                />
              </InputGroup>
              <InputGroup className="w-32.5">
                <InputGroupInput
                  type="date"
                  aria-label="Au"
                  value={dateFin}
                  onChange={(e) => { resetAndSet(setDateFin, e.target.value); setPeriode('custom'); }}
                />
              </InputGroup>
            </div>
            <Select items={commercialItems} value={commercial} onValueChange={(v) => resetAndSet(setCommercial, v as string)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {commercialItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
              <RotateCcw data-icon="inline-start" /> Réinitialiser
            </Button>
        </div>

        {loading && !data && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && data && (
          <ResultsRegion loading={loading}>
            <div className="flex shrink-0 items-center justify-between text-body text-muted-foreground">
              <span>{data.totalElements} offre{data.totalElements > 1 ? 's' : ''}</span>
              <span className="flex items-center gap-3">
                {offres.length > 0 && (
                  <span>Total (page) <span className="font-semibold tabular-nums text-(--success)">{formatCurrency(totalPageTTC)}</span></span>
                )}
                <ColumnSelector
                  catalogue={colonnes.catalogueServi}
                  visibles={colonnes.visibles}
                  onBasculer={colonnes.basculer}
                  onReinitialiser={colonnes.reinitialiser}
                  estDefaut={colonnes.estDefaut}
                />
              </span>
            </div>
            {offres.length === 0 ? (
              <EmptyState
                title={hasActiveFilters ? 'Aucun résultat' : 'Rien ce mois-ci'}
                message={
                  hasActiveFilters
                    ? 'Aucune offre ne correspond aux filtres actifs.'
                    : 'Aucune offre sur le mois en cours.'
                }
                action={
                  hasActiveFilters ? (
                    <Button type="button" variant="outline" size="sm" onClick={() => resetFilters()}>
                      <RotateCcw data-icon="inline-start" /> Réinitialiser les filtres
                    </Button>
                  ) : (
                    <Button type="button" variant="outline" size="sm" onClick={() => handlePeriodeChange('custom')}>
                      <CalendarRange data-icon="inline-start" /> Toutes les périodes
                    </Button>
                  )
                }
              />
            ) : (
              <div className="min-h-0 min-w-0 flex-1 overflow-auto rounded-xl border border-border bg-card">
                <DataGrid
                  cleOrdre="offres"
                  rows={offres}
                  colonnes={grille}
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
    </PageShell>
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

