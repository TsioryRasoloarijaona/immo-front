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
// Formatage monétaire et de date : porté par DataGrid via le `type` de
// colonne, plus par cet écran. Les rendus riches et le libellé canonique du
// statut vivent désormais dans DossierTable.
import { DOSSIER_STATUS_PIPELINE, DOSSIER_EXIT_STATUSES, canonicalStatusLabel, normalizeStatus } from '../../lib/dossierStatus';
import type { DossierListItemDto, PageDto } from '../../types';

const BATCH_DOC_ITEMS = (Object.entries(DOSSIER_BATCH_DOC_LABELS) as [DossierBatchDocKind, string][]).map(([value, label]) => ({ label, value }));

/** Référence stable : un `[]` neuf à chaque rendu invaliderait `dossiersParId`. */
const EMPTY: DossierListItemDto[] = [];

const STATUS_ITEMS = [...DOSSIER_STATUS_PIPELINE, ...DOSSIER_EXIT_STATUSES].map((s) => ({ label: s, value: s }));

/** `GET /api/dossiers`'s `statut` query param matches the raw `StrStatus.Code`
 * stored in the DB (confirmed real example: "CONCRETISATION", see
 * instructions/from_front.md #5 — backend repo), not the accented Title
 * Case label this checklist shows ("Concrétisation", from
 * `DOSSIER_STATUS_PIPELINE`). Sending the display label straight through
 * as the filter value silently returns 0 rows for most statuses instead of
 * an error — exactly the "a lot of empty results" symptom. Until the
 * backend accepts/normalizes the display label (or exposes the exact raw
 * codes), work around it client-side: fetch a large batch with every other
 * filter still applied server-side but `statut` omitted, then match/paginate
 * the statut filter here via `normalizeStatus` — the same accent/casing-
 * insensitive comparison `canonicalStatusLabel` already uses for display,
 * so it recognizes any raw variant regardless of the backend's actual
 * casing. `size: 500` mirrors the tranches fetch below and the real
 * dataset's ~374 dossiers (per instructions/filtres-avances.md) — revisit
 * if the portfolio grows past that. */
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
  /* Ce filtre-ci se joue sur `d.statut`, et `statut` est une colonne que
     l'utilisateur peut décocher. `?colonnes=` étant une liste close, la
     décocher ferait disparaître le champ de la réponse et le filtre ne
     matcherait plus rien — un écran vide, sans erreur. On la redemande donc,
     qu'elle soit affichée ou non. */
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

/** Pourquoi le groupement et le filtre statut ne peuvent pas cohabiter.
 *
 * `?statut=` attend le **code brut** de `StrStatus.Code`, pas le libellé
 * affiché : re-mesuré contre le serveur, `statut=CONCRETISATION` rend 68
 * dossiers et `statut=Concrétisation` en rend **0, en HTTP 200**. Et aucune
 * normalisation ne rattrape l'écart — « Remise des clés » se code
 * `REMISE DES CLEFS`, « Annulé » se code `ANNULATION`. D'où le contournement
 * client de `fetchDossiersWithStatusWorkaround`.
 *
 * Ce contournement filtre **après** le serveur. L'endpoint `/groupes`, lui,
 * ne renvoie pas de lignes à refiltrer : il renvoie des effectifs déjà
 * calculés. Lui cacher le filtre statut donnerait des groupes comptés sur un
 * périmètre plus large que la liste — des nombres faux, présentés comme des
 * totaux. Les afficher quand même serait exactement le défaut que ce dépôt a
 * déjà corrigé une fois : un écran qui ment sans rien signaler.
 *
 * Disparaît le jour où le backend accepte le libellé (demande consignée dans
 * `docs/filtres-avances.md`), qui retirera aussi le lot de 500. */
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
  /* Par défaut le mois courant, comme toutes les listes à période (décision
     utilisateur du 28/09). Vider les deux champs rend tout l'historique. */
  const [dateDebut, setDateDebut] = useState(debutMoisISO);
  const [dateFin, setDateFin] = useState(finMoisISO);
  const [commercial, setCommercial] = useState('all');
  const [page, setPage] = useState(0);

  // Batch document generation (POST /api/dossiers/documents/{kind}) — the
  // selection lives independently of `search`/`status`/etc. below and of
  // `page`, so switching filters or pages to pick more dossiers never wipes
  // it out. `selectedLabels` keeps a friendly code/nom per id around even
  // after the row scrolls off the current filtered/paginated page, so the
  // "selected" chips still read as something meaningful.
  const [batchDocKind, setBatchDocKind] = useState<DossierBatchDocKind | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedLabels, setSelectedLabels] = useState<Record<string, string>>({});
  const [batchBusy, setBatchBusy] = useState<'view' | 'download' | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);

  const catalogue = useColonnesDossiers();
  const colonnes = useColonnesVisibles('dossiers', catalogue.data, DISPOSITION_DOSSIERS);
  // `undefined` tant que la sélection ne s'écarte pas des défauts — le hook
  // porte cette règle et la raison qui la rend portante. Sur cet écran elle
  // pèse doublement : les groupes PATRIMOINE et ORIGINE valent trois jointures
  // paresseuses par ligne, et le contournement statut charge 500 lignes.
  const colonnesDemandees = colonnes.demandees;

  /* Changer d'axe de groupement, d'ordre ou de granularité change le jeu de
     résultats : rester page 7 en passant de 38 groupes à 5 afficherait un
     écran vide sans rien qui l'explique. */
  const groupement = useGroupement(
    'dossiers',
    catalogue.data,
    useCallback(() => setPage(0), []),
  );
  const groupementBloque = status.length > 0 ? GROUPEMENT_ET_STATUT : undefined;

  /* Les filtres serveur, **mot pour mot les mêmes** pour la liste et pour les
     groupes. C'est la condition de l'invariant qui rend l'écran lisible : la
     somme des effectifs des groupes égale le total de la liste. Un filtre
     appliqué d'un seul côté le casserait en silence. */
  const filtresServeur = {
    search: debouncedSearch || undefined,
    trancheId: trancheIds.length > 0 ? trancheIds : undefined,
    commercial: commercial !== 'all' ? commercial : undefined,
    champDate: dateDebut || dateFin ? champDate : undefined,
    dateDebut: dateDebut ? `${dateDebut}T00:00:00` : undefined,
    dateFin: dateFin ? `${dateFin}T23:59:59` : undefined,
  };

  /* Une liste repliée reste **une seule** grille : les en-têtes de groupe s'y
     intercalent et chacun s'ouvre sur place. La pagination du bas numérote
     alors les groupes, et chaque groupe pagine ses propres lignes par lots. */
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
        : // Newest-first, so a just-created dossier lands on page 0. Sorts on
          // `docDate` — the actual JPA entity column — not `dateDocument` (the
          // response DTO's field name), which 400s: Pageable's `sort` validates
          // against the entity property, and OpenAPI doesn't document it.
          // `statut` itself is handled separately — see fetchDossiersWithStatusWorkaround.
          fetchDossiersWithStatusWorkaround(filtresServeur, status, page, DEFAULT_PAGE_SIZE, colonnesDemandees),
    [...clesFiltres, colonnesDemandees?.join(',') ?? '', enGroupes, groupement.cleDeps],
    'dossiers',
  );

  /* Pas de `colonnes` ici : un groupe ne porte pas de ligne. Les jointures
     PATRIMOINE/ORIGINE que la liste fait payer par ligne ne se posent donc
     pas, même en groupant *par* une de ces colonnes. Mesuré 48–114 ms. */
  const groupes = useApi(
    () =>
      enGroupes && groupement.paramsGroupes
        ? listDossiersGroupes(filtresServeur, groupement.paramsGroupes, { page, size: DEFAULT_PAGE_SIZE })
        : Promise.resolve(null),
    [...clesFiltres, enGroupes, groupement.cleDeps],
    'dossiers-groupes',
  );

  /* Les lignes d'un groupe déplié : le **même endpoint que la liste**,
     restreint par `groupeColonne`/`groupeValeur`/`granularite`. Même tri, mêmes
     colonnes demandées — une ligne doit se lire pareil dépliée ou à plat.

     La clé de remise à zéro comprend les filtres, l'axe de groupement et la
     page : dans les trois cas les groupes affichés changent, et des lignes
     déjà chargées appartiendraient à des en-têtes qui ne sont plus là. */
  const lignesGroupes = useLignesGroupes<DossierListItemDto>(
    (cle, taille) =>
      listDossiers(
        filtresServeur,
        /* Tri **déterministe**, et c'est une exigence du chargement par lots,
           pas une préférence : « en charger davantage » redemande la page 0
           avec une taille plus grande, ce qui suppose que le lot précédent en
           soit le préfixe. Mesuré sans départage, il ne l'est pas toujours —
           le groupe « 2024 » des dossiers ressortait dans un ordre différent
           d'un appel à l'autre, les dates ex æquo étant départagées par le
           plan SQL du moment. `id` tranche. */
        { page: 0, size: taille, sort: ['docDate,desc', 'id,asc'] },
        { colonnes: colonnesDemandees, depliage: groupement.depliagePour(cle) },
      ),
    `${clesFiltres.join('|')}|${groupement.cleDeps}|${colonnesDemandees?.join(',') ?? ''}`,
  );

  const data = liste.data;
  const dossiers = data?.content ?? EMPTY;
  /** La page qui pilote le décompte et la pagination — groupes ou lignes. */
  const pageAffichee = enGroupes ? groupes.data : liste.data;
  const loading = enGroupes ? groupes.loading : liste.loading;
  const error = enGroupes ? groupes.error : liste.error;
  const vide = enGroupes ? (groupes.data?.content.length ?? 0) === 0 : dossiers.length === 0;
  /** Ce qu'une case cochée peut désigner : les lignes à plat, ou celles des
   * groupes dépliés. Sans ça, cocher dans un groupe ne retrouverait pas le
   * dossier et la puce de sélection afficherait un UUID. */
  const dossiersVisibles = enGroupes ? lignesGroupes.lignesChargees : dossiers;

  /* « Tout cocher » faisait un `find` par identifiant sur la liste visible,
     soit 500 x 500 comparaisons sur le lot que cet ecran charge. */
  const dossiersParId = useMemo(
    () => new Map(dossiersVisibles.map((d) => [d.id, d])),
    [dossiersVisibles],
  );

  // Aggregate fetch (once, 16 tranches in the real portfolio per CLAUDE.md) —
  // populates the Tranche dropdown. Independent of the dossiers query above.
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

  // Drives the empty state's wording and its escape hatch — see ArticlesList.
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
                // Voir GROUPEMENT_ET_STATUT : les deux ne peuvent pas
                // coexister. Retirer le groupement maintenant vaut mieux que
                // le laisser en place, inerte, et le voir resurgir quand le
                // filtre statut sera leve.
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

        {/* Panneau d'action, pas un filtre : lui garde sa carte. */}
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
                {/* Picking a document kind leaves both action buttons
                    disabled until rows are ticked, with nothing saying why —
                    so say it, rather than showing "0 dossier sélectionné"
                    next to two dead buttons. */}
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

        {/* `pageAffichee` et non `data` : en mode groupes `data` reste nul par
            construction, si bien qu'un test sur lui rallumerait l'etat de
            chargement plein ecran a chaque changement de granularite — par
            dessus des groupes deja affiches. */}
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
            {/* `min-w-0` : voir ProspectionsList — sans lui la largeur de la
                table remonte la chaîne flex et élargit la page entière au lieu
                de faire défiler.

                La bande et le fil d'Ariane sont **hors** du test « y a-t-il des
                lignes ». Un groupe qui ne rend rien doit garder sa sortie vers
                les groupes, sinon l'écran est sans issue. */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto rounded-xl border border-border bg-card">
              <BandeGroupement etat={groupement} bloque={groupementBloque} />
              {vide ? (
                /* Sans filtre actif la liste est bornée au mois courant : un
                   résultat vide veut dire « rien ce mois-ci », pas « rien
                   d'enregistré » — d'où la sortie vers toutes les périodes. */
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
                {/* Le catalogue porte les libellés d'en-tête : sans lui il n'y
                    a pas de tableau à dessiner, seulement des lignes sans
                    colonnes. Mis en cache au niveau du module, il n'est
                    rechargé qu'une fois par session. */}
                {colonnes.colonnes.length > 0 ? (
                  <DossierTable
                    cleOrdre="dossiers"
                    /* En mode groupé la grille ne lit pas `rows` : chaque
                       groupe porte ses propres lignes. */
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
                            /* Les totaux plein périmètre, servis par
                               l'enveloppe. Sans eux, un total de bas de grille
                               ne pourrait porter que sur les groupes ouverts. */
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
                    // La gouttiere *est* le selecteur de lot quand un type de
                    // document est choisi : sans ca l'ecran aurait deux colonnes
                    // de cases, dont une decorative.
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
              {/* Une seule pagination, et elle numérote ce qui est à l'écran :
                  les groupes quand la liste est repliée, les lignes sinon. */}
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
