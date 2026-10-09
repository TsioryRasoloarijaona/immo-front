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
import {
  DEFAULT_PAGE_SIZE,
  DOSSIER_BATCH_DOC_LABELS,
  downloadDossiersDocumentsEnLot,
  listDossiers,
  listDossiersGroupes,
  viewDossiersDocumentsEnLot,
  type DossierBatchDocKind,
  type DossierChampDate,
} from '../../lib/api';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { useColonnesVisibles } from '../../lib/colonnes';
import { useGroupement, useLignesGroupes } from '../../lib/groupement';
import { DISPOSITION_DOSSIERS } from '../../lib/dispositions';
import { useColonnesDossiers, useTranchesFiltre } from '../../lib/referentiels';
import { useAppData, commercialLabel } from '../../lib/appData';
import { debutMoisISO, finMoisISO } from '../../lib/format';
import { DOSSIER_STATUS_PIPELINE, DOSSIER_EXIT_STATUSES, canonicalStatusLabel, normalizeStatus } from '../../lib/dossierStatus';
import type { DossierListItemDto, PageDto } from '../../types';

const BATCH_DOC_ITEMS = (Object.entries(DOSSIER_BATCH_DOC_LABELS) as [DossierBatchDocKind, string][]).map(([value, label]) => ({ label, value }));

/** Référence stable : un `[]` neuf à chaque rendu invaliderait `dossiersParId`. */
const EMPTY: DossierListItemDto[] = [];

const STATUS_ITEMS = [...DOSSIER_STATUS_PIPELINE, ...DOSSIER_EXIT_STATUSES].map((s) => ({ label: s, value: s }));

// `?statut=` attend le code brut `StrStatus.Code`, pas le libellé : le libellé rend 0 ligne en 200.
// Contournement : lot de 500 sans `statut`, filtré et paginé ici via `normalizeStatus`.
async function fetchDossiersWithStatusWorkaround(
  baseParams: {
    search?: string;
    trancheId?: string[];
    commercial?: string;
    champDate?: DossierChampDate;
    dateDebut?: string;
    dateFin?: string;
  },
  statuses: string[],
  page: number,
  size: number,
  colonnes: string[] | undefined,
): Promise<PageDto<DossierListItemDto>> {
  if (statuses.length === 0) {
    return listDossiers(baseParams, { page, size, sort: ['docDate,desc'] }, { colonnes });
  }
  const wanted = new Set(statuses.map((s) => normalizeStatus(s)));
  /* `?colonnes=` est une liste close : `statut` décoché disparaîtrait de la
     réponse et le filtre ne matcherait plus rien. On le redemande toujours. */
  const colonnesAvecStatut = colonnes ? [...new Set([...colonnes, 'statut'])] : undefined;
  const all = await listDossiers(
    baseParams,
    { page: 0, size: 500, sort: ['docDate,desc'] },
    { colonnes: colonnesAvecStatut },
  );
  const filtered = all.content.filter((d) => wanted.has(normalizeStatus(d.statut)));
  const start = page * size;
  return {
    content: filtered.slice(start, start + size),
    page,
    size,
    totalElements: filtered.length,
    totalPages: Math.max(1, Math.ceil(filtered.length / size)),
  };
}

// Le filtre statut se fait côté client, après le serveur ; `/groupes` renvoie des effectifs déjà
// calculés et compterait donc sur un périmètre plus large que la liste.
const GROUPEMENT_ET_STATUT =
  'Le regroupement est indisponible tant qu’un statut est filtré — le serveur compterait sur un périmètre plus large que la liste.';

const CHAMP_DATE_ITEMS: { label: string; value: DossierChampDate }[] = [
  { label: 'Date de réservation', value: 'RESERVATION' },
  { label: 'Date de concrétisation', value: 'CONCRETISATION' },
  { label: 'Date de compromis', value: 'COMPROMIS' },
  { label: "Date d'envoi au notaire", value: 'ENVOI_NOTAIRE' },
  { label: 'Date de crédit débloqué', value: 'CREDIT_DEBLOQUE' },
  { label: 'Date de minute', value: 'MINUTE' },
  { label: 'Date de remise des clés', value: 'REMISE_DES_CLES' },
  { label: 'Date de formalisation', value: 'FORMALISATION' },
  { label: "Date d'annulation", value: 'ANNULATION' },
];

export default function DossiersList() {
  const navigate = useNavigate();
  const { commerciaux } = useAppData();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [status, setStatus] = useState<string[]>([]);
  const [trancheIds, setTrancheIds] = useState<string[]>([]);
  const [champDate, setChampDate] = useState<DossierChampDate>('RESERVATION');
  const [dateDebut, setDateDebut] = useState(debutMoisISO);
  const [dateFin, setDateFin] = useState(finMoisISO);
  const [commercial, setCommercial] = useState('all');
  const [page, setPage] = useState(0);

  // `selectedLabels` garde un libellé par id même quand la ligne a quitté la page ou le filtre.
  const [batchDocKind, setBatchDocKind] = useState<DossierBatchDocKind | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedLabels, setSelectedLabels] = useState<Record<string, string>>({});
  const [batchBusy, setBatchBusy] = useState<'view' | 'download' | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);

  const catalogue = useColonnesDossiers();
  const colonnes = useColonnesVisibles('dossiers', catalogue.data, DISPOSITION_DOSSIERS);
  const colonnesDemandees = colonnes.demandees;

  // Changer d'axe de groupement change le jeu de résultats : retour page 0, sinon écran vide.
  const groupement = useGroupement(
    'dossiers',
    catalogue.data,
    useCallback(() => setPage(0), []),
  );
  const groupementBloque = status.length > 0 ? GROUPEMENT_ET_STATUT : undefined;

  /* Mêmes filtres pour la liste et les groupes : la somme des effectifs doit
     égaler le total de la liste. */
  const filtresServeur = {
    search: debouncedSearch || undefined,
    trancheId: trancheIds.length > 0 ? trancheIds : undefined,
    commercial: commercial !== 'all' ? commercial : undefined,
    champDate: dateDebut || dateFin ? champDate : undefined,
    dateDebut: dateDebut ? `${dateDebut}T00:00:00` : undefined,
    dateFin: dateFin ? `${dateFin}T23:59:59` : undefined,
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
    page,
  ];

  const liste = useApi(
    () =>
      enGroupes
        ? Promise.resolve(null)
        : // Tri sur `docDate` (propriété d'entité), pas `dateDocument` (champ du DTO) :
          // `sort` est validé contre l'entité, sinon 400.
          fetchDossiersWithStatusWorkaround(filtresServeur, status, page, DEFAULT_PAGE_SIZE, colonnesDemandees),
    [...clesFiltres, colonnesDemandees?.join(',') ?? '', enGroupes, groupement.cleDeps],
    'dossiers',
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
  }

  function toutesLesPeriodes() {
    setPage(0);
    setDateDebut('');
    setDateFin('');
  }

  // Les dates se comparent au défaut (le mois courant), pas au vide.
  const hasActiveFilters =
    !!search || status.length > 0 || trancheIds.length > 0 || champDate !== 'RESERVATION' || dateDebut !== debutMoisISO() || dateFin !== finMoisISO() || commercial !== 'all';

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
                placeholder="Recherche multi-critère — client, code de dossier…"
                value={search}
                onChange={(e) => resetAndSet(setSearch, e.target.value)}
              />
            </InputGroup>
            <MultiSelectDropdown
              label="Statut"
              placeholder="Tous les statuts"
              value={status}
              onChange={(v) => {
                // Voir GROUPEMENT_ET_STATUT : groupement et filtre statut ne coexistent pas.
                if (v.length > 0) groupement.reinitialiser();
                resetAndSet(setStatus, v);
              }}
              items={STATUS_ITEMS}
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
                items={CHAMP_DATE_ITEMS}
                value={champDate}
                onValueChange={(v) => resetAndSet(setChampDate, v as DossierChampDate)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {CHAMP_DATE_ITEMS.map((item) => (
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
            <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
              <RotateCcw data-icon="inline-start" /> Réinitialiser
            </Button>
        </div>

        <Card padded={false} className="shrink-0">
          <div className="flex flex-wrap items-center gap-2.5 p-3">
            <Select
              items={BATCH_DOC_ITEMS}
              value={batchDocKind}
              onValueChange={(v) => setBatchDocKind((v as DossierBatchDocKind) || null)}
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
              <div className="text-body text-muted-foreground">
                {enGroupes
                  ? `${pageAffichee.totalElements} groupe${pageAffichee.totalElements > 1 ? 's' : ''}`
                  : `${pageAffichee.totalElements} dossier${pageAffichee.totalElements > 1 ? 's' : ''}`}
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
                <>
                {colonnes.colonnes.length > 0 ? (
                  <DossierTable
                    cleOrdre="dossiers"
                    rows={enGroupes ? [] : dossiers}
                    colonnes={colonnes.colonnes}
                    groupes={
                      enGroupes && groupement.colonneGroupee
                        ? {
                            liste: groupes.data?.content ?? [],
                            colonneLibelle: groupement.colonneGroupee.libelle,
                            libelleGroupe:
                              groupement.colonneGroupee.nom === 'statut' ? canonicalStatusLabel : undefined,
                            agregats: groupement.agregatsActifs,
                            totaux: groupes.data?.totaux ?? {},
                            nombreTotal: groupes.data?.nombreTotal ?? 0,
                            estOuvert: lignesGroupes.estOuvert,
                            etat: lignesGroupes.etat,
                            basculer: lignesGroupes.basculer,
                            chargerPlus: lignesGroupes.chargerPlus,
                            lignesChargees: lignesGroupes.lignesChargees,
                          }
                        : undefined
                    }
                    onOuvrir={(id) => navigate(`/dossiers/${id}`)}
                    onOuvrirProspection={(prospectionId) => navigate(`/prospections/${prospectionId}`)}
                    bandeauRegroupement={false}
                    selection={
                      batchDocKind
                        ? {
                            ids: selectedIds,
                            onToggle: (id) => {
                              const d = dossiersParId.get(id);
                              if (d) toggleSelected(d);
                            },
                            onToggleAll: (ids) => {
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
                ) : catalogue.error ? (
                  <ErrorState message={`Colonnes indisponibles — ${catalogue.error}`} />
                ) : (
                  <LoadingState />
                )}
                </>
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
