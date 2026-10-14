import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarRange, Download, Eye, Folder, RotateCcw, Search, X } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, Card, EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import ColumnSelector from '../../components/ColumnSelector';
import MultiSelectDropdown from '../../components/MultiSelectDropdown';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import DossierTable from '../../components/DossierTable';
import BandeGroupement from '../../components/BandeGroupement';
import BoutonReajustementSuperficies from '../../components/dossier/BoutonReajustementSuperficies';
import BoutonExporter from '../../components/BoutonExporter';
import OptionsListeDossiers from '../../components/dossier/liste/OptionsListeDossiers';
import TotauxDossiers from '../../components/dossier/liste/TotauxDossiers';
import {
  DEFAULT_PAGE_SIZE,
  DOSSIER_BATCH_DOC_LABELS,
  downloadDossiersDocumentsEnLot,
  listChampsDateDossiers,
  listDossiers,
  listDossiersGroupes,
  listStatutsDossiers,
  viewDossiersDocumentsEnLot,
  type DossierBatchDocKind,
  type DossierFilterParams,
} from '../../lib/api';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { useColonnesVisibles } from '../../lib/colonnes';
import { groupesGrille, useGroupement, useLignesGroupes } from '../../lib/groupement';
import EtatColonnes from '../../components/EtatColonnes';
import { DISPOSITION_DOSSIERS } from '../../lib/dispositions';
import { useColonnesDossiers, useTranchesFiltre } from '../../lib/referentiels';
import { useAppData, commercialLabel } from '../../lib/appData';
import { debutMoisISO, finMoisISO, pluriel } from '../../lib/format';
import { canonicalStatusLabel } from '../../lib/dossierStatus';
import {
  AGREGATS_TOTAUX,
  colonnesListe,
  exigeLesSortis,
  filtreStatuts,
  optionsListe,
  optionsStatuts,
  routeDeLigne,
  uniteDeLigne,
} from '../../lib/dossierListe';
import type { DossierListItemDto } from '../../types';

const BATCH_DOC_ITEMS = (Object.entries(DOSSIER_BATCH_DOC_LABELS) as [DossierBatchDocKind, string][]).map(([value, label]) => ({ label, value }));

/** Référence stable : un `[]` neuf à chaque rendu invaliderait `dossiersParId`. */
const EMPTY: DossierListItemDto[] = [];

const TRI_LISTE = ['docDate,desc'];

const GROUPEMENT_ET_LIBRES = 'Le regroupement ne porte que sur des dossiers : retirez « Libre » du filtre de statut.';

/** Repli tant que `GET /api/dossiers/champs-date` n'a pas répondu. */
const CHAMP_DATE_DEFAUT = [{ label: 'Date réservation', value: 'RESERVATION' }];

export default function DossiersList() {
  const navigate = useNavigate();
  const { commerciaux } = useAppData();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [status, setStatus] = useState<string[]>([]);
  const [trancheIds, setTrancheIds] = useState<string[]>([]);
  const [champDate, setChampDate] = useState('RESERVATION');
  const [dateDebut, setDateDebut] = useState(debutMoisISO);
  const [dateFin, setDateFin] = useState(finMoisISO);
  const [commercial, setCommercial] = useState('all');
  const [inclureSortis, setInclureSortis] = useState(false);
  const [ordreOmran, setOrdreOmran] = useState(false);
  const [page, setPage] = useState(0);

  const statutsServeur = useApi(() => listStatutsDossiers(), [], 'dossiers-statuts');
  const champsDate = useApi(() => listChampsDateDossiers(), [], 'dossiers-champs-date');
  const statusItems = optionsStatuts(statutsServeur.data ?? []);
  const champDateItems = champsDate.data?.map((c) => ({ label: c.libelle, value: c.code })) ?? CHAMP_DATE_DEFAUT;

  // `selectedLabels` garde un libellé par id même quand la ligne a quitté la page ou le filtre.
  const [batchDocKind, setBatchDocKind] = useState<DossierBatchDocKind | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedLabels, setSelectedLabels] = useState<Record<string, string>>({});
  const [batchBusy, setBatchBusy] = useState<'view' | 'download' | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);

  const catalogue = useColonnesDossiers();
  const colonnes = useColonnesVisibles('dossiers', catalogue.data, DISPOSITION_DOSSIERS);
  // Toujours explicite : les champs des icônes de ligne ne sont pas dans la sélection par défaut du serveur.
  const colonnesDemandees = colonnesListe(colonnes.demandees, catalogue.data, DISPOSITION_DOSSIERS.toujoursDemandees ?? []);

  // Changer d'axe de groupement change le jeu de résultats : retour page 0, sinon écran vide.
  const groupement = useGroupement(
    'dossiers',
    catalogue.data,
    useCallback(() => setPage(0), []),
  );
  const filtreStatut = filtreStatuts(status);
  const groupementBloque = filtreStatut.lignes === 'LIBRES' ? GROUPEMENT_ET_LIBRES : undefined;

  /* Mêmes filtres pour la liste, les groupes, les totaux et l'export : la somme des effectifs doit
     égaler le total de la liste. Le statut est filtré par le serveur, sur les codes `StrStatus`. */
  const filtresServeur: DossierFilterParams = {
    search: debouncedSearch || undefined,
    trancheId: trancheIds.length > 0 ? trancheIds : undefined,
    commercial: commercial !== 'all' ? commercial : undefined,
    champDate: dateDebut || dateFin ? champDate : undefined,
    dateDebut: dateDebut ? `${dateDebut}T00:00:00` : undefined,
    dateFin: dateFin ? `${dateFin}T23:59:59` : undefined,
    ...filtreStatut,
    ...optionsListe(inclureSortis, ordreOmran),
  };

  const enGroupes = groupement.actif && !groupementBloque;

  const clesFiltres = [
    debouncedSearch,
    status.join(','),
    trancheIds.join(','),
    champDate,
    dateDebut,
    dateFin,
    commercial,
    inclureSortis,
    ordreOmran,
    page,
  ];

  const liste = useApi(
    () =>
      enGroupes
        ? Promise.resolve(null)
        : // Tri sur `docDate` (propriété d'entité), pas `dateDocument` (champ du DTO) : sinon 400.
          listDossiers(filtresServeur, { page, size: DEFAULT_PAGE_SIZE, sort: TRI_LISTE }, { colonnes: colonnesDemandees }),
    [...clesFiltres, colonnesDemandees?.join(',') ?? '', enGroupes, groupement.cleDeps],
    'dossiers',
  );

  // Σ en tête : `totaux` de `/groupes` porte sur tout le résultat filtré, pas sur la page.
  const totaux = useApi(
    () =>
      filtreStatut.lignes === 'LIBRES'
        ? Promise.resolve(null)
        : listDossiersGroupes(
            filtresServeur,
            { groupBy: 'statut', agregats: [...AGREGATS_TOTAUX], inclureSansValeur: true },
            { page: 0, size: 1 },
          ),
    [...clesFiltres.slice(0, -1)],
    'dossiers-totaux',
  );

  const groupes = useApi(
    () =>
      enGroupes && groupement.paramsGroupes
        ? listDossiersGroupes(filtresServeur, groupement.paramsGroupes, { page, size: DEFAULT_PAGE_SIZE })
        : Promise.resolve(null),
    [...clesFiltres, enGroupes, groupement.cleDeps],
    'dossiers-groupes',
  );

  const lignesGroupes = useLignesGroupes<DossierListItemDto>(
    (cle, taille) =>
      listDossiers(
        filtresServeur,
        /* `id,asc` départage les dates ex æquo : « en charger davantage » redemande
           la page 0 plus grande et suppose que le lot précédent en soit le préfixe. */
        { page: 0, size: taille, sort: ['docDate,desc', 'id,asc'] },
        { colonnes: colonnesDemandees, depliage: groupement.depliagePour(cle) },
      ),
    `${clesFiltres.join('|')}|${groupement.cleDeps}|${colonnesDemandees?.join(',') ?? ''}`,
  );

  const data = liste.data;
  const dossiers = data?.content ?? EMPTY;
  const pageAffichee = enGroupes ? groupes.data : liste.data;
  const loading = enGroupes ? groupes.loading : liste.loading;
  const error = enGroupes ? groupes.error : liste.error;
  const vide = enGroupes ? (groupes.data?.content.length ?? 0) === 0 : dossiers.length === 0;
  // Inclut les lignes des groupes dépliés : sinon cocher dans un groupe ne retrouverait pas le dossier.
  const dossiersVisibles = enGroupes ? lignesGroupes.lignesChargees : dossiers;

  const dossiersParId = useMemo(
    () => new Map(dossiersVisibles.map((d) => [d.id, d])),
    [dossiersVisibles],
  );

  const tranches = useTranchesFiltre();
  const trancheItems = tranches.data.map((t) => ({
    label: t.description || t.code || t.id,
    value: t.id,
  }));

  function resetAndSet<T>(setter: (v: T) => void, v: T) {
    setPage(0);
    setter(v);
  }

  function resetFilters() {
    setPage(0);
    groupement.reinitialiser();
    setSearch('');
    setStatus([]);
    setTrancheIds([]);
    setChampDate('RESERVATION');
    setDateDebut(debutMoisISO());
    setDateFin(finMoisISO());
    setCommercial('all');
    setInclureSortis(false);
    setOrdreOmran(false);
  }

  function toutesLesPeriodes() {
    setPage(0);
    setDateDebut('');
    setDateFin('');
  }

  // Les dates se comparent au défaut (le mois courant), pas au vide.
  const hasActiveFilters =
    !!search || status.length > 0 || trancheIds.length > 0 || champDate !== 'RESERVATION' || dateDebut !== debutMoisISO() || dateFin !== finMoisISO() || commercial !== 'all' || inclureSortis;

  const paramsExport = { ...filtresServeur, colonnes: colonnes.visibles, sort: TRI_LISTE };
  const uniteLigne = uniteDeLigne(filtreStatut.lignes);

  const commercialItems = [
    { label: 'Tous les commerciaux', value: 'all' },
    ...commerciaux.map((c) => ({ label: commercialLabel(c), value: c.id })),
  ];

  function toggleSelected(d: DossierListItemDto) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(d.id)) next.delete(d.id);
      else next.add(d.id);
      return next;
    });
    setSelectedLabels((prev) => ({ ...prev, [d.id]: d.code || d.clientNom || d.id }));
  }

  function removeSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
    setSelectedLabels({});
    setBatchError(null);
  }

  async function handleBatchDocument(action: 'view' | 'download') {
    if (!batchDocKind || selectedIds.size === 0) return;
    setBatchBusy(action);
    setBatchError(null);
    try {
      const ids = Array.from(selectedIds);
      if (action === 'view') await viewDossiersDocumentsEnLot(batchDocKind, ids);
      else await downloadDossiersDocumentsEnLot(batchDocKind, ids, `${batchDocKind}-lot.pdf`);
    } catch (err) {
      setBatchError(err instanceof Error ? err.message : "Échec de l'opération.");
    } finally {
      setBatchBusy(null);
    }
  }

  return (
    <PageShell
      title="Dossiers de vente"
      crumbs={[{ label: 'Ventes' }, { label: 'Dossiers' }]}
      fullHeight
      icon={<Folder />}
      accent="var(--sec-dossier)"
      accentBg="var(--sec-dossier-bg)"
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="flex shrink-0 flex-wrap items-center gap-2">
            <InputGroup className="min-w-55 flex-1">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Recherche — client, CIN, mobile, co-acquéreur, article, code…"
                value={search}
                onChange={(e) => resetAndSet(setSearch, e.target.value)}
              />
            </InputGroup>
            <MultiSelectDropdown
              label="Statut"
              placeholder="Tous les statuts"
              value={status}
              onChange={(v) => resetAndSet(setStatus, v)}
              items={statusItems}
            />
            <MultiSelectDropdown
              label="Tranche"
              placeholder="Toutes"
              value={trancheIds}
              onChange={(v) => resetAndSet(setTrancheIds, v)}
              items={trancheItems}
            />
            <div className="flex items-center gap-1.5">
              <Select
                items={champDateItems}
                value={champDate}
                onValueChange={(v) => {
                  // Date d'annulation : seuls les sortis la portent, on coche « Inclure annulés / désistés ».
                  setInclureSortis((avant) => avant || exigeLesSortis(v as string));
                  resetAndSet(setChampDate, v as string);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {champDateItems.map((item) => (
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
                  onChange={(e) => resetAndSet(setDateDebut, e.target.value)}
                />
              </InputGroup>
              <InputGroup className="w-32.5">
                <InputGroupInput
                  type="date"
                  aria-label="Au"
                  value={dateFin}
                  onChange={(e) => resetAndSet(setDateFin, e.target.value)}
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
            <OptionsListeDossiers
              inclureSortis={inclureSortis}
              onInclureSortis={(v) => resetAndSet(setInclureSortis, v)}
              ordreOmran={ordreOmran}
              onOrdreOmran={(v) => resetAndSet(setOrdreOmran, v)}
            />
            <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
              <RotateCcw data-icon="inline-start" /> Réinitialiser
            </Button>
            <BoutonExporter chemin="/api/dossiers/export" params={paramsExport} nomListe="dossiers" />
            <BoutonReajustementSuperficies />
        </div>

        <Card padded={false} className="shrink-0">
          <div className="flex flex-wrap items-center gap-2.5 p-3">
            <Select
              items={BATCH_DOC_ITEMS}
              value={batchDocKind}
              onValueChange={(v) => setBatchDocKind((v) || null)}
            >
              <SelectTrigger className="w-65">
                <SelectValue placeholder="Générer un document…" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {BATCH_DOC_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {batchDocKind && (
              <>
                <span className="text-body text-muted-foreground">
                  {selectedIds.size === 0 ? (
                    <>Cochez les dossiers à inclure dans le document.</>
                  ) : (
                    <>
                      {selectedIds.size} dossier{selectedIds.size > 1 ? 's' : ''} sélectionné{selectedIds.size > 1 ? 's' : ''}
                    </>
                  )}
                </span>
                <Button type="button" variant="outline" size="sm" disabled={selectedIds.size === 0 || !!batchBusy} onClick={() => handleBatchDocument('view')}>
                  <Eye data-icon="inline-start" /> {batchBusy === 'view' ? 'Ouverture…' : 'Voir'}
                </Button>
                <Button type="button" size="sm" disabled={selectedIds.size === 0 || !!batchBusy} onClick={() => handleBatchDocument('download')}>
                  <Download data-icon="inline-start" /> {batchBusy === 'download' ? 'Téléchargement…' : 'Télécharger'}
                </Button>
                {selectedIds.size > 0 && (
                  <Button type="button" variant="ghost" size="sm" onClick={clearSelection}>
                    Vider la sélection
                  </Button>
                )}
                {batchError && <span className="text-body text-destructive">{batchError}</span>}
              </>
            )}
          </div>
          {batchDocKind && selectedIds.size > 0 && (
            <div className="flex flex-wrap gap-1.5 border-t border-border p-3 pt-2.5">
              {Array.from(selectedIds).map((id) => (
                <Badge key={id} tone="info" className="gap-1">
                  {selectedLabels[id] || id}
                  <button type="button" aria-label="Retirer de la sélection" onClick={() => removeSelected(id)}>
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </Card>

        {/* `pageAffichee` et non `data` : en mode groupes `data` reste nul, le
            chargement plein écran se rallumerait par-dessus les groupes. */}
        {loading && !pageAffichee && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && pageAffichee && (
          <ResultsRegion loading={loading}>
            <div className="flex shrink-0 items-center justify-between gap-3">
              <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
                <span className="text-body text-muted-foreground">
                  {pluriel(pageAffichee.totalElements, enGroupes ? 'groupe' : uniteLigne)}
                </span>
                <TotauxDossiers totaux={totaux.data} />
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
            {/* `min-w-0` : sans lui la largeur de la table remonte la chaîne flex et
                élargit la page. La bande reste hors du test « vide » : sinon sans issue. */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto rounded-xl border border-border bg-card">
              <BandeGroupement etat={groupement} bloque={groupementBloque} />
              {vide ? (
                <EmptyState
                  title={hasActiveFilters ? 'Aucun résultat' : 'Rien ce mois-ci'}
                  message={
                    hasActiveFilters
                      ? 'Aucun dossier de vente ne correspond aux filtres actifs.'
                      : 'Aucun dossier de vente réservé sur le mois en cours.'
                  }
                  action={
                    hasActiveFilters ? (
                      <Button type="button" variant="outline" size="sm" onClick={() => resetFilters()}>
                        <RotateCcw data-icon="inline-start" /> Réinitialiser les filtres
                      </Button>
                    ) : (
                      <Button type="button" variant="outline" size="sm" onClick={toutesLesPeriodes}>
                        <CalendarRange data-icon="inline-start" /> Toutes les périodes
                      </Button>
                    )
                  }
                />
              ) : (
                <EtatColonnes pret={colonnes.colonnes.length > 0} erreur={catalogue.error}>
                  <DossierTable
                    cleOrdre="dossiers"
                    rows={enGroupes ? [] : dossiers}
                    colonnes={colonnes.colonnes}
                    // `enGroupes` et non `groupement.actif` : un filtre de statut bloque le groupement.
                    groupes={groupesGrille(groupement, groupes.data, lignesGroupes, { statut: canonicalStatusLabel }, enGroupes)}
                    onOuvrir={(id) => navigate(routeDeLigne(dossiersParId.get(id), id))}
                    onOuvrirProspection={(prospectionId) => navigate(`/prospections/${prospectionId}`)}
                    bandeauRegroupement={false}
                    selection={
                      batchDocKind
                        ? {
                            ids: selectedIds,
                            onToggle: (id) => {
                              const d = dossiersParId.get(id);
                              // Un lot libre n'a pas de dossier : aucun document à générer.
                              if (d && !d.libre) toggleSelected(d);
                            },
                            onToggleAll: (tous) => {
                              const ids = tous.filter((id) => !dossiersParId.get(id)?.libre);
                              setSelectedIds(new Set(ids));
                              setSelectedLabels((prev) => {
                                const next = { ...prev };
                                for (const id of ids) {
                                  const d = dossiersParId.get(id);
                                  if (d) next[id] = d.code || d.clientNom || d.id;
                                }
                                return next;
                              });
                            },
                          }
                        : undefined
                    }
                  />
                </EtatColonnes>
              )}
            </div>
            <div className="shrink-0">
              <Pagination
                page={pageAffichee.page}
                totalPages={pageAffichee.totalPages}
                totalElements={pageAffichee.totalElements}
                onPageChange={setPage}
              />
            </div>
          </ResultsRegion>
        )}
      </div>
    </PageShell>
  );
}
