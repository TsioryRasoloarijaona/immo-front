import { useState } from 'react';
import { CalendarRange, Download, FileText, Plus, RotateCcw, Search } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, EmptyState, ErrorState, Field, FieldGrid, LoadingState, ResultsRegion } from '../../components/ui';
import DevisFormSection from '../../components/DevisFormSection';
import Modal from '../../components/Modal';
import MultiSelectDropdown from '../../components/MultiSelectDropdown';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import { DialogFooter } from '../../components/ui/dialog';
import { Field as FormField, FieldLabel } from '../../components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import { creerDevis, DEFAULT_PAGE_SIZE, downloadDevisDocument, getProspection, listOffres, listProspections, viewDevisDocument } from '../../lib/api';
import { useTranchesFiltre } from '../../lib/referentiels';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { useAppData, commercialLabel } from '../../lib/appData';
import { formatCurrency, formatMontantOptionnel, formatPercent, formatPercentValue, jourISO } from '../../lib/format';
import { prospectionDisplayName } from '../../lib/domain';
import type { CreerDevisRequest, DevisDto, ProspectionListItemDto } from '../../types';

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
  // Pas de `onOuvrir` exprès : cette liste se consulte sans quitter la page.
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
              {offres.length > 0 && (
                <span>Total (page) <span className="font-semibold tabular-nums text-(--success)">{formatCurrency(totalPageTTC)}</span></span>
              )}
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
                  colonnes={COLONNES}
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

// Composant et non rendu inline : l'état de génération est par ligne, une fonction de cellule ne peut pas le porter.
function FicheOffreActions({ offre: o }: Readonly<{ offre: DevisDto }>) {
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
      setGenError(err instanceof Error ? err.message : 'Echec de la generation.');
    } finally {
      setGenerating(null);
    }
  }

  return (
    // Conteneur neutre : il arrête seulement le clic avant la ligne, qui ouvrirait le détail.
    <div role="presentation" className="flex flex-col items-end gap-0.5" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-5 gap-1 px-1.5 text-micro"
          disabled={!!generating || !o.prospectionId}
          title={!o.prospectionId ? 'Prospection introuvable pour cette offre' : undefined}
          onClick={() => handleGenerateFiche('view')}
        >
          <FileText className="size-3" />
          {generating === 'view' ? 'Generation...' : 'Fiche offre'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="size-5"
          disabled={!!generating || !o.prospectionId}
          title="Telecharger la fiche offre (PDF)"
          aria-label="Telecharger la fiche offre"
          onClick={() => handleGenerateFiche('download')}
        >
          <Download className="size-3" />
        </Button>
      </div>
      {genError && <span className="text-micro text-destructive">{genError}</span>}
    </div>
  );
}

const montant = formatMontantOptionnel;

function detailOffre(o: DevisDto) {
  const m = o.montants;
  if (!m) return <p className="text-body text-muted-foreground">Aucun detail de montants pour cette offre.</p>;
  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="mb-1.5 text-micro font-medium text-muted-foreground">Avant remise</div>
        <FieldGrid>
          <Field label="TVA" value={m.tvaRatio != null ? formatPercent(m.tvaRatio, 0) : undefined} />
          <Field label="Prix m2 HT" value={montant(m.prixM2HT)} />
          <Field label="Prix m2 TTC" value={montant(m.prixM2TTC)} />
          <Field label="Article HT" value={montant(m.prixArticleHT)} />
          <Field label="Article TTC" value={montant(m.prixArticleTTC)} />
          <Field label="Sous-articles HT" value={montant(m.prixSousArticlesHT)} />
          <Field label="Sous-articles TTC" value={montant(m.prixSousArticlesTTC)} />
          <Field label="Total HT" value={montant(m.totalHT)} />
          <Field label="Total TTC" value={montant(m.totalTTC)} />
        </FieldGrid>
      </div>

      {(m.remisePercent ?? 0) > 0 && (
        <div>
          <div className="mb-1.5 text-micro font-medium text-muted-foreground">Remise</div>
          <FieldGrid>
            <Field label="Taux" value={m.remisePercent != null ? formatPercentValue(m.remisePercent) : undefined} />
            <Field label="Remise HT" value={montant(m.remiseHT)} />
            <Field label="Remise TTC" value={montant(m.remiseTTC)} />
            <Field label="Prix m2 apres remise HT" value={montant(m.prixM2ApresRemiseHT)} />
            <Field label="Prix m2 apres remise TTC" value={montant(m.prixM2ApresRemiseTTC)} />
            <Field label="Article apres remise HT" value={montant(m.prixArticleApresRemiseHT)} />
            <Field label="Article apres remise TTC" value={montant(m.prixArticleApresRemiseTTC)} />
            <Field label="Sous-articles apres remise HT" value={montant(m.prixSousArticlesApresRemiseHT)} />
            <Field label="Sous-articles apres remise TTC" value={montant(m.prixSousArticlesApresRemiseTTC)} />
          </FieldGrid>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-border pt-2.5">
        <span className="text-micro font-medium text-muted-foreground">Prix de vente final</span>
        <span className="text-label font-semibold text-foreground">HT {montant(m.prixVenteHT) ?? '-'}</span>
        <span className="text-label font-semibold text-foreground">TTC {montant(m.prixVenteTTC) ?? '-'}</span>
      </div>

      {o.notes && <p className="whitespace-pre-wrap text-body text-foreground">{o.notes}</p>}
    </div>
  );
}

const TIRET_MUET = <span className="text-muted-foreground">-</span>;

const COLONNES: ColonneGrille<DevisDto>[] = [
  {
    nom: 'code',
    libelle: 'Code',
    largeur: 8,
    titre: (o) => o.code,
    rendu: (o) => (
      <Badge tone="progress" className="font-mono">
        {o.code ?? '-'}
      </Badge>
    ),
  },
  { nom: 'dateDocument', libelle: 'Date', type: 'DATE', largeur: 7, classe: 'text-muted-foreground' },
  {
    nom: 'trancheDescription',
    libelle: 'Tranche',
    largeur: 13,
    valeur: (o) => o.trancheDescription || o.tranche,
    titre: (o) => o.trancheDescription || o.tranche,
    rendu: (o) =>
      o.trancheDescription || o.tranche ? <Badge tone="neutral">{o.trancheDescription || o.tranche}</Badge> : TIRET_MUET,
  },
  {
    nom: 'articleDescription',
    libelle: 'Article',
    largeur: 6,
    classe: 'text-muted-foreground',
    valeur: (o) => o.articleDescription || o.article,
  },
  { nom: 'commercial', libelle: 'Commercial', largeur: 11, classe: 'text-muted-foreground', titre: (o) => o.commercial },
  { nom: 'prospect', libelle: 'Prospect', largeur: 11, classe: 'font-medium text-foreground', titre: (o) => o.prospect },
  {
    nom: 'prospectionCode',
    libelle: 'Prospection',
    largeur: 8,
    rendu: (o) => (o.prospectionCode ? <Badge tone="info">{o.prospectionCode}</Badge> : TIRET_MUET),
  },
  { nom: 'modePaiement', libelle: 'Mode de paiement', largeur: 10, classe: 'text-muted-foreground' },
  {
    nom: 'remisePercent',
    libelle: 'Remise',
    type: 'NOMBRE',
    largeur: 6,
    // La remise vit dans `montants`, pas à la racine : sans `valeur` tri et filtre seraient inertes.
    valeur: (o) => o.montants?.remisePercent ?? 0,
    rendu: (o) =>
      (o.montants?.remisePercent ?? 0) > 0 ? (
        <Badge tone="amber">{o.montants?.remisePercent} %</Badge>
      ) : (
        <span className="text-muted-foreground">0 %</span>
      ),
  },
  {
    nom: 'prixVenteTTC',
    libelle: 'Prix TTC apres remise',
    type: 'MONTANT',
    largeur: 12,
    classe: 'font-semibold text-(--success)',
    valeur: (o) => o.montants?.prixVenteTTC,
  },
  {
    nom: 'fiche',
    libelle: 'Fiche',
    largeur: 9,
    rendu: (o) => <FicheOffreActions offre={o} />,
  },
];
