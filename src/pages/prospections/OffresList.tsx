import { useState } from 'react';
import { ChevronDown, ChevronRight, Download, FileText, Plus, RotateCcw, Search } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, Card, EmptyState, ErrorState, Field, FieldGrid, LoadingState, ResultsRegion } from '../../components/ui';
import DevisFormSection from '../../components/DevisFormSection';
import Modal from '../../components/Modal';
import MultiSelectDropdown from '../../components/MultiSelectDropdown';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import { DialogFooter } from '../../components/ui/dialog';
import { Field as FormField, FieldLabel } from '../../components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { creerDevis, DEFAULT_PAGE_SIZE, downloadDevisDocument, getProspection, listOffres, listProspections, listTranches, viewDevisDocument } from '../../lib/api';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { useAppData, commercialLabel } from '../../lib/appData';
import { formatCurrency, formatDate } from '../../lib/format';
import { cn } from '../../lib/utils';
import { prospectionDisplayName } from '../../lib/domain';
import type { CreerDevisRequest, DevisDto } from '../../types';

/** Presets purement client-side (aucun paramètre backend dédié) — chacun ne
 * fait que pré-remplir `dateDebut`/`dateFin`, envoyés ensuite comme une
 * plage normale. Reproduit le sélecteur "Période" de l'ancien Omran
 * (`Vente > Offres`) sans rien demander de plus au backend. */
type PeriodePreset = 'custom' | 'mois-courant' | 'mois-dernier' | 'annee-courante';

const PERIODE_ITEMS: { label: string; value: PeriodePreset }[] = [
  { label: 'Toutes les périodes', value: 'custom' },
  { label: 'Le mois en cours', value: 'mois-courant' },
  { label: 'Le mois dernier', value: 'mois-dernier' },
  { label: "L'année en cours", value: 'annee-courante' },
];

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

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
  const [periode, setPeriode] = useState<PeriodePreset>('custom');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [page, setPage] = useState(0);
  // Le clic sur une ligne déplie ses montants HT/TTC sur place — pas de
  // redirection vers la fiche prospection (demande explicite : cette liste
  // doit rester consultable sans quitter la page).
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
        // Newest-first. Sorts on `docDate` — the actual JPA entity column,
        // same convention as `listDossiers` (DossiersList.tsx) — not
        // `dateDocument` (the response DTO's field name), which 400s:
        // Pageable's `sort` validates against the entity property, and
        // OpenAPI doesn't document it.
        { page, size: DEFAULT_PAGE_SIZE, sort: ['docDate,desc'] },
      ),
    [debouncedSearch, trancheIds.join(','), commercial, dateDebut, dateFin, page],
    'offres',
  );
  const offres = data?.content ?? [];
  // Somme des prix TTC de la page chargée uniquement (pas un total
  // plein-filtre) — `sommePrixVenteTTCPage`, calculée côté backend.
  const totalPageTTC = data?.sommePrixVenteTTCPage ?? 0;

  const tranches = useApi(() => listTranches(undefined, { page: 0, size: 500 }), [], 'tranches-filtre');
  const trancheItems = (tranches.data?.content ?? []).map((t) => ({
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
    setPeriode('custom');
    setDateDebut('');
    setDateFin('');
  }

  // Drives the empty state's wording and its escape hatch — see ArticlesList.
  const hasActiveFilters =
    !!search || trancheIds.length > 0 || commercial !== 'all' || periode !== 'custom' || !!dateDebut || !!dateFin;

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
        {showCreate && <NouvelleOffreDialog onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); refetch(); }} />}

        <Card padded={false} className="shrink-0">
          <div className="flex flex-wrap items-center gap-2.5 p-3">
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
        </Card>

        {loading && !data && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && data && (
          <ResultsRegion loading={loading}>
            <div className="flex shrink-0 items-center justify-between text-body text-muted-foreground">
              <span>{(data?.totalElements ?? 0)} offre{(data?.totalElements ?? 0) > 1 ? 's' : ''}</span>
              {offres.length > 0 && (
                <span>Total (page) <span className="font-semibold tabular-nums text-(--success)">{formatCurrency(totalPageTTC)}</span></span>
              )}
            </div>
            {offres.length === 0 ? (
              <EmptyState
                title={hasActiveFilters ? 'Aucun résultat' : 'Rien à afficher'}
                message={
                  hasActiveFilters
                    ? 'Aucune offre ne correspond aux filtres actifs.'
                    : "Aucune offre n'est encore enregistrée."
                }
                action={
                  hasActiveFilters ? (
                    <Button type="button" variant="outline" size="sm" onClick={() => resetFilters()}>
                      <RotateCcw data-icon="inline-start" /> Réinitialiser les filtres
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-border bg-card">
                <Table className="w-full min-w-240 table-fixed">
                  <TableHeader>
                    <TableRow className="sticky top-0 z-10 bg-card hover:bg-card">
                      <TableHead className="w-[4%]" />
                      <TableHead className="w-[8%]">Code</TableHead>
                      <TableHead className="w-[7%]">Date</TableHead>
                      <TableHead className="w-[13%]">Tranche</TableHead>
                      <TableHead className="w-[6%]">Article</TableHead>
                      <TableHead className="w-[11%]">Commercial</TableHead>
                      <TableHead className="w-[11%]">Prospect</TableHead>
                      <TableHead className="w-[8%]">Prospection</TableHead>
                      <TableHead className="w-[10%]">Mode de paiement</TableHead>
                      <TableHead className="w-[6%] text-right">Remise</TableHead>
                      <TableHead className="w-[12%] text-right">Prix TTC après remise</TableHead>
                      <TableHead className="w-[9%] text-right">Fiche</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {offres.map((o, index) => {
                      const expanded = expandedId === o.id;
                      return (
                        <OffreRows
                          key={o.id}
                          offre={o}
                          expanded={expanded}
                          striped={index % 2 === 1}
                          onToggle={() => setExpandedId(expanded ? null : o.id)}
                        />
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="shrink-0">
              {data && (
                <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
              )}
            </div>
          </ResultsRegion>
        )}
      </div>
    </PageShell>
  );
}

/** "Nouvelle offre" from the global list, in a dialog — unlike
 * `DevisFormSection`'s per-prospection usage in `ProspectionDetail.tsx`
 * (where the prospection is already known from the page's own URL),
 * creating an offer here needs a prospection picked first:
 * `POST /api/prospections/{id}/devis` is still the only creation endpoint
 * (no global `POST /api/devis`), so step one is always "which prospection
 * is this offer for". Step two reuses the exact same shared
 * `DevisFormSection` — projet→tranche→catégorie/type→article cascade,
 * sous-articles, prix, remise, mode de paiement — seeded with that
 * prospection's own tranche/article/prospect/commercial as defaults, same
 * contract as the per-prospection usage. Same `Modal` shell as every other
 * create-flow in the app (`CreateProspectForm`, `InteractionForm`). */
function NouvelleOffreDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
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
                autoFocus
              />
            </InputGroup>
          </FormField>
          {search.trim().length < 2 ? (
            <p className="text-body text-muted-foreground">Tapez au moins 2 caractères pour rechercher une prospection.</p>
          ) : results.loading ? (
            <p className="text-body text-muted-foreground">Recherche…</p>
          ) : (results.data?.content.length ?? 0) === 0 ? (
            <p className="text-body text-muted-foreground">Aucune prospection trouvée.</p>
          ) : (
            <div className="flex max-h-80 flex-col gap-1.5 overflow-y-auto">
              {results.data!.content.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-left text-body hover:bg-muted/50"
                  onClick={() => setPickedId(p.id)}
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
          )}
          <DialogFooter className="mt-1.5">
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
          </DialogFooter>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
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

/** One offer's row plus its expand-in-place detail row — clicking anywhere
 * on the row toggles the HT/TTC breakdown open below it, no navigation.
 * Same "Avant remise / Remise / Prix de vente final" grouping as the
 * per-prospection `DevisRow` (`ProspectionDetail.tsx`), reused here since
 * this list has no parent prospection page context of its own to fall back
 * on. */
function OffreRows({
  offre: o,
  expanded,
  striped,
  onToggle,
}: {
  offre: DevisDto;
  expanded: boolean;
  striped: boolean;
  onToggle: () => void;
}) {
  const m = o.montants;
  const hasRemise = (m?.remisePercent ?? 0) > 0;
  const [generating, setGenerating] = useState<'view' | 'download' | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  async function handleGenerateFiche(action: 'view' | 'download') {
    if (!o.prospectionId) return;
    setGenerating(action);
    setGenError(null);
    try {
      if (action === 'view') await viewDevisDocument(o.prospectionId, o.id);
      else await downloadDevisDocument(o.prospectionId, o.id, `offre-${o.code}.pdf`);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Échec de la génération.');
    } finally {
      setGenerating(null);
    }
  }

  return (
    <>
      <TableRow
        tabIndex={0}
        role="button"
        aria-expanded={expanded}
        aria-label={`${expanded ? 'Replier' : 'Déplier'} l'offre ${o.code}`}
        className={cn('cursor-pointer', striped && 'bg-muted/25 hover:bg-muted/40', expanded && 'bg-(--brand-bg) hover:bg-(--brand-bg)')}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); }
        }}
      >
        <TableCell>
          {expanded ? <ChevronDown className="size-4 text-(--brand)" /> : <ChevronRight className="size-4 text-muted-foreground" />}
        </TableCell>
        <TableCell className="truncate" title={o.code}>
          <Badge tone="progress" className="font-mono">{o.code ?? '—'}</Badge>
        </TableCell>
        <TableCell className="truncate text-muted-foreground">{formatDate(o.dateDocument)}</TableCell>
        <TableCell className="truncate" title={o.trancheDescription || o.tranche}>
          {(o.trancheDescription || o.tranche) ? <Badge tone="neutral">{o.trancheDescription || o.tranche}</Badge> : '—'}
        </TableCell>
        <TableCell className="truncate text-muted-foreground">{o.articleDescription || o.article || '—'}</TableCell>
        <TableCell className="truncate text-muted-foreground" title={o.commercial}>{o.commercial || '—'}</TableCell>
        <TableCell className="truncate font-medium text-foreground" title={o.prospect}>{o.prospect || '—'}</TableCell>
        <TableCell className="truncate">
          {o.prospectionCode ? <Badge tone="info">{o.prospectionCode}</Badge> : <span className="text-muted-foreground">—</span>}
        </TableCell>
        <TableCell className="truncate text-muted-foreground">{o.modePaiement || '—'}</TableCell>
        <TableCell className="text-right">
          {hasRemise ? <Badge tone="amber">{m!.remisePercent} %</Badge> : <span className="text-muted-foreground">0 %</span>}
        </TableCell>
        <TableCell className="truncate text-right font-semibold tabular-nums text-(--success)">
          {formatCurrency(m?.prixVenteTTC)}
        </TableCell>
        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-6 gap-1 px-1.5 text-body"
                disabled={!!generating || !o.prospectionId}
                title={!o.prospectionId ? 'Prospection introuvable pour cette offre' : undefined}
                onClick={() => handleGenerateFiche('view')}
              >
                <FileText className="size-3" />
                {generating === 'view' ? 'Génération…' : 'Fiche offre'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="size-6"
                disabled={!!generating || !o.prospectionId}
                title="Télécharger la fiche offre (PDF)"
                aria-label="Télécharger la fiche offre"
                onClick={() => handleGenerateFiche('download')}
              >
                <Download className="size-3" />
              </Button>
            </div>
            {genError && <span className="text-micro text-destructive">{genError}</span>}
          </div>
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={12} className="bg-muted/30 py-3">
            {!m ? (
              <p className="text-body text-muted-foreground">Aucun détail de montants pour cette offre.</p>
            ) : (
              <div className="flex flex-col gap-3">
                <div>
                  <div className="mb-1.5 text-micro font-medium text-muted-foreground">Avant remise</div>
                  <FieldGrid>
                    <Field label="TVA" value={m.tvaRatio != null ? `${Math.round(m.tvaRatio * 100)} %` : undefined} />
                    <Field label="Prix m² HT" value={m.prixM2HT != null ? formatCurrency(m.prixM2HT) : undefined} />
                    <Field label="Prix m² TTC" value={m.prixM2TTC != null ? formatCurrency(m.prixM2TTC) : undefined} />
                    <Field label="Article HT" value={m.prixArticleHT != null ? formatCurrency(m.prixArticleHT) : undefined} />
                    <Field label="Article TTC" value={m.prixArticleTTC != null ? formatCurrency(m.prixArticleTTC) : undefined} />
                    <Field label="Sous-articles HT" value={m.prixSousArticlesHT != null ? formatCurrency(m.prixSousArticlesHT) : undefined} />
                    <Field label="Sous-articles TTC" value={m.prixSousArticlesTTC != null ? formatCurrency(m.prixSousArticlesTTC) : undefined} />
                    <Field label="Total HT" value={m.totalHT != null ? formatCurrency(m.totalHT) : undefined} />
                    <Field label="Total TTC" value={m.totalTTC != null ? formatCurrency(m.totalTTC) : undefined} />
                  </FieldGrid>
                </div>

                {(m.remisePercent ?? 0) > 0 && (
                  <div>
                    <div className="mb-1.5 text-micro font-medium text-muted-foreground">Remise</div>
                    <FieldGrid>
                      <Field label="Taux" value={m.remisePercent != null ? `${m.remisePercent} %` : undefined} />
                      <Field label="Remise HT" value={m.remiseHT != null ? formatCurrency(m.remiseHT) : undefined} />
                      <Field label="Remise TTC" value={m.remiseTTC != null ? formatCurrency(m.remiseTTC) : undefined} />
                      <Field label="Prix m² après remise HT" value={m.prixM2ApresRemiseHT != null ? formatCurrency(m.prixM2ApresRemiseHT) : undefined} />
                      <Field label="Prix m² après remise TTC" value={m.prixM2ApresRemiseTTC != null ? formatCurrency(m.prixM2ApresRemiseTTC) : undefined} />
                      <Field label="Article après remise HT" value={m.prixArticleApresRemiseHT != null ? formatCurrency(m.prixArticleApresRemiseHT) : undefined} />
                      <Field label="Article après remise TTC" value={m.prixArticleApresRemiseTTC != null ? formatCurrency(m.prixArticleApresRemiseTTC) : undefined} />
                      <Field label="Sous-articles après remise HT" value={m.prixSousArticlesApresRemiseHT != null ? formatCurrency(m.prixSousArticlesApresRemiseHT) : undefined} />
                      <Field label="Sous-articles après remise TTC" value={m.prixSousArticlesApresRemiseTTC != null ? formatCurrency(m.prixSousArticlesApresRemiseTTC) : undefined} />
                    </FieldGrid>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-border pt-2.5">
                  <span className="text-micro font-medium text-muted-foreground">Prix de vente final</span>
                  <span className="text-label font-semibold text-foreground">HT {m.prixVenteHT != null ? formatCurrency(m.prixVenteHT) : '—'}</span>
                  <span className="text-label font-semibold text-foreground">TTC {m.prixVenteTTC != null ? formatCurrency(m.prixVenteTTC) : '—'}</span>
                </div>

                {o.notes && <p className="whitespace-pre-wrap text-body text-foreground">{o.notes}</p>}
              </div>
            )}
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
