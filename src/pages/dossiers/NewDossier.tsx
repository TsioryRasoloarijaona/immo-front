import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Check, Pencil, RotateCcw, Search, X } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, Card, EmptyState, ErrorState, LoadingState } from '../../components/ui';
import ArticleCompactPreview from '../../components/ArticleCompactPreview';
import { Button } from '../../components/ui/button';
import { Field as FormField, FieldGroup, FieldLabel } from '../../components/ui/field';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import {
  createDossier,
  getArticle,
  getProspect,
  getProspection,
  getTranche,
  listDevis,
  listProjetTranches,
  listProjets,
  listProspectionAutresTranches,
  listTrancheArticles,
  simulerSchemaFinancement,
} from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { formatCurrency } from '../../lib/format';
import { prospectionDisplayName } from '../../lib/domain';
import { referentielItems, useCategoriesBien, useModesPaiement, useTypesBienReferentiel } from '../../lib/referentiels';
import type { ArticleDetailDto, ArticleListItemDto } from '../../types';

const EMPTY_ARTICLES = { content: [] as ArticleListItemDto[], page: 0, size: 0, totalElements: 0, totalPages: 0 };

// Single-form dossier creation — the real API's CreerDossierRequest is just
// {prospectionId, articleIds, prix, notes}, far simpler than the multi-step
// financing wizard the prototype used to have (that whole échéancier/plan de
// financement flow lived only client-side; the real dossier's échéancier
// lines are added afterwards on the dossier detail page).
export default function NewDossier() {
  const { id } = useParams();
  const { data: prospection, loading, error } = useApi(() => getProspection(id!), [id]);
  const navigate = useNavigate();

  // Tranche picker (Projet → Tranche), pre-seeded from the prospection's own
  // trancheId when it has one, but always changeable — the API only exposes
  // article search scoped to a single tranche (GET /api/tranches/{id}/articles),
  // there's no cross-tranche endpoint yet, so widening the search means
  // switching tranche here rather than a real "toutes tranches" filter.
  const seedTranche = useApi(
    () => (prospection?.trancheId ? getTranche(prospection.trancheId) : Promise.resolve(null)),
    [prospection?.trancheId],
  );
  // Overrides start unset (null = "not touched yet, fall back to the
  // prospection's seed tranche/projet") and avoid a setState-in-effect just
  // to seed initial state from an async value. '' means "explicitly
  // cleared" (e.g. after switching projet) — distinct from "untouched".
  const [projetIdOverride, setProjetIdOverride] = useState<string | null>(null);
  const [trancheIdOverride, setTrancheIdOverride] = useState<string | null>(null);
  const projetId = projetIdOverride === null ? (seedTranche.data?.projetId ?? null) : projetIdOverride || null;
  const trancheId = trancheIdOverride === null ? (seedTranche.data?.id ?? null) : trancheIdOverride || null;

  const projets = useApi(() => listProjets({ page: 0, size: 200 }), []);
  const tranches = useApi(
    () => (projetId ? listProjetTranches(projetId, { page: 0, size: 200 }) : Promise.resolve(EMPTY_ARTICLES as never)),
    [projetId],
  );

  // Server-side filter: statut (the only one /api/tranches/{id}/articles
  // supports). Everything else below (code/catégorie/type/superficie) is
  // filtered client-side over the fetched page — the endpoint doesn't take
  // those params yet.
  const [statutFilter, setStatutFilter] = useState<'DISPONIBLE' | 'OCCUPE' | 'all'>('DISPONIBLE');
  const articles = useApi(
    () =>
      trancheId
        ? listTrancheArticles(trancheId, { statut: statutFilter !== 'all' ? statutFilter : undefined }, { page: 0, size: 200 })
        : Promise.resolve(EMPTY_ARTICLES),
    [trancheId, statutFilter],
  );

  const [codeFilter, setCodeFilter] = useState('');
  const [categorieFilter, setCategorieFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [superficieMin, setSuperficieMin] = useState('');
  const [superficieMax, setSuperficieMax] = useState('');

  const categoriesRef = useCategoriesBien();
  const typesRef = useTypesBienReferentiel();
  const categorieItems = categoriesRef.data.map((c) => ({ label: c.description || c.code || c.id, value: c.description || c.code || c.id }));
  const typeItems = typesRef.data.map((t) => ({ label: t.description || t.code || t.id, value: t.description || t.code || t.id }));
  const modesPaiement = useModesPaiement();
  const modesPaiementItems = referentielItems(modesPaiement.data);

  function resetFilters() {
    setCodeFilter('');
    setCategorieFilter(null);
    setTypeFilter(null);
    setSuperficieMin('');
    setSuperficieMax('');
    setStatutFilter('DISPONIBLE');
  }

  const filteredArticles = useMemo(() => {
    const code = codeFilter.trim().toLowerCase();
    const min = superficieMin ? Number(superficieMin) : null;
    const max = superficieMax ? Number(superficieMax) : null;
    return (articles.data?.content ?? []).filter((a) => {
      if (code && !`${a.code ?? ''} ${a.description ?? ''}`.toLowerCase().includes(code)) return false;
      if (categorieFilter && a.categorieLibelle !== categorieFilter) return false;
      if (typeFilter && a.typeLibelle !== typeFilter) return false;
      if (min !== null && (a.area ?? 0) < min) return false;
      if (max !== null && (a.area ?? 0) > max) return false;
      return true;
    });
  }, [articles.data, codeFilter, categorieFilter, typeFilter, superficieMin, superficieMax]);

  // Pre-fill the article selection from everything already known on the
  // prospection: its own targeted article (`articleId`) plus every entry in
  // its "Articles associés" list (`/api/prospections/{id}/autres-tranches`)
  // — this can span several tranches, unlike the single-tranche table below,
  // so selection state is kept independent of `trancheId`/`articles`.
  // `selectedIdsOverride` stays null ("not touched yet, use the seed") until
  // the user checks/unchecks a row — same pattern as the tranche overrides
  // above — so the pre-fill never fights with manual edits.
  const associes = useApi(
    () => (prospection?.id ? listProspectionAutresTranches(prospection.id) : Promise.resolve([])),
    [prospection?.id],
  );
  const seedArticleIds = useMemo(() => {
    const ids = new Set<string>();
    if (prospection?.articleId) ids.add(prospection.articleId);
    for (const a of associes.data ?? []) {
      if (a.articleId) ids.add(a.articleId);
    }
    return Array.from(ids);
  }, [prospection, associes.data]);
  const [selectedIdsOverride, setSelectedIdsOverride] = useState<string[] | null>(null);
  const selectedIds = selectedIdsOverride ?? seedArticleIds;
  const isSelectionSeeded = selectedIdsOverride === null && seedArticleIds.length > 0;
  // The "Sélectionner un article" filters/table stay collapsed behind a
  // "Modifier" toggle once there's already a selection to show in full
  // detail above — no point re-showing the whole picker on every visit when
  // the prospection already resolved to a specific lot.
  const [editingArticles, setEditingArticles] = useState(false);

  // Full detail of every selected article, fetched by id regardless of
  // which tranche is currently browsed in the table below — pre-filled
  // selections routinely span tranches the "Sélectionner un article" table
  // isn't even showing right now.
  const selectedArticleDetails = useApi(
    () => (selectedIds.length > 0 ? Promise.all(selectedIds.map((aid) => getArticle(aid))) : Promise.resolve([])),
    [selectedIds],
  );

  // Every devis already raised on this prospection (`GET
  // /api/prospections/{id}/devis`) — the most recent one, if any, is the
  // strongest available source for Prix/Notes (it's a real quote the
  // commercial already drafted), stronger than summing selected articles'
  // list price.
  const devisQuery = useApi(
    () => (prospection?.id ? listDevis(prospection.id, { page: 0, size: 20 }) : Promise.resolve(null)),
    [prospection?.id],
  );
  const latestDevis = useMemo(() => {
    const list = devisQuery.data?.content ?? [];
    if (list.length === 0) return null;
    return [...list].sort((a, b) => (b.dateDocument ?? '').localeCompare(a.dateDocument ?? ''))[0];
  }, [devisQuery.data]);

  const [prix, setPrix] = useState('');
  const [priceTouched, setPriceTouched] = useState(false);
  const [notes, setNotes] = useState('');
  const [notesTouched, setNotesTouched] = useState(false);
  // Both required by the backend since api-docsV2 (CreerDossierRequest.cin /
  // .modePaieId) — a 400 comes back without them. Auto-filled below from the
  // prospection's linked prospect / selected articles where possible, but
  // still editable — the source data isn't always populated.
  const [cin, setCin] = useState('');
  const [cinTouched, setCinTouched] = useState(false);
  const [modePaieId, setModePaieId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Auto-fill CIN from the linked prospect's pièce d'identité, once loaded —
  // only while the user hasn't typed their own value.
  const linkedProspect = useApi(
    () => (prospection?.prospectId ? getProspect(prospection.prospectId) : Promise.resolve(null)),
    [prospection?.prospectId],
  );
  const autoCin = linkedProspect.data?.pieceIdentite?.numero ?? '';
  const cinValue = cinTouched ? cin : autoCin || cin;

  // Auto-fill Notes from the latest devis' own notes, falling back to the
  // prospection's own notes field — only while untouched.
  const autoNotes = latestDevis?.notes || prospection?.notes || '';
  const notesValue = notesTouched ? notes : autoNotes || notes;

  const selectedArticles: ArticleDetailDto[] = (selectedArticleDetails.data ?? []).filter((a): a is ArticleDetailDto => !!a);
  // Nothing to show yet → the picker has to be visible; otherwise it stays
  // tucked behind "Modifier" until asked for.
  const showPicker = editingArticles || selectedArticles.length === 0;
  // Auto-fill Prix — prefer the latest devis' own prix (an actual quote
  // already drafted for this prospection) over the sum of selected
  // articles' prix de vente, as long as the user hasn't overridden it by hand.
  const autoPrixFromArticles = selectedArticles.reduce((sum, a) => sum + (a.salePrice ?? 0), 0);
  const autoPrix = latestDevis?.montants?.prixVenteTTC || autoPrixFromArticles;
  const prixValue = priceTouched ? prix : autoPrix > 0 ? String(autoPrix) : prix;

  // Preview step — "Schéma de financement" the real `POST /api/dossiers`
  // would generate for this exact selection/prix, recomputed on every
  // article/prix change, without creating or persisting anything
  // server-side. Only called once both inputs are actually usable.
  const prixNumber = prixValue ? Number(prixValue) : undefined;
  const schemaFinancement = useApi(
    () =>
      selectedIds.length > 0 && prixNumber && prixNumber > 0
        ? simulerSchemaFinancement({ articleIds: selectedIds, prix: prixNumber })
        : Promise.resolve(null),
    [selectedIds, prixNumber],
  );

  if (loading) return <PageShell title="Nouveau dossier"><LoadingState /></PageShell>;
  if (error) return <PageShell title="Nouveau dossier"><ErrorState message={error} /></PageShell>;
  if (!prospection) {
    return (
      <PageShell title="Prospection introuvable" crumbs={[{ label: 'Prospections', to: '/prospections' }]}>
        <p>Cette prospection n'existe pas.</p>
      </PageShell>
    );
  }
  // Already converted — bounce straight to the existing dossier instead of
  // showing the creation form again (covers a stale link/back-button visit
  // to this URL after conversion, on top of ProspectionDetail's own button
  // already routing here instead of there — see `dossierId`'s comment in
  // types.ts, dormant until the backend adds the field).
  if (prospection.dossierId) {
    return <Navigate to={`/dossiers/${prospection.dossierId}`} replace />;
  }

  function toggleArticle(articleId: string) {
    setSelectedIdsOverride(selectedIds.includes(articleId) ? selectedIds.filter((x) => x !== articleId) : [...selectedIds, articleId]);
  }

  // Prix isn't required by the API schema, but leaving it out silently
  // creates a dossier with a blank Prix that can never be fixed afterwards
  // (there's no PATCH /api/dossiers/{id} to edit it post-creation) — so it's
  // enforced client-side instead of just auto-filled-and-forgotten.
  const canCreate = selectedIds.length > 0 && prixValue.trim().length > 0 && cinValue.trim().length > 0 && !!modePaieId;

  async function handleCreate() {
    if (!canCreate) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const dossier = await createDossier({
        prospectionId: prospection!.id,
        articleIds: selectedIds,
        prix: prixValue ? Number(prixValue) : undefined,
        notes: notesValue || undefined,
        cin: cinValue.trim(),
        modePaieId: modePaieId!,
      });
      navigate(`/dossiers/${dossier.id}?nouveau=1`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Échec de la création.');
    } finally {
      setSubmitting(false);
    }
  }

  const projetItems = (projets.data?.content ?? []).map((p) => ({ label: p.description || p.code || p.id, value: p.id }));
  const trancheItems = (tranches.data?.content ?? []).map((t) => ({ label: t.description || t.code || t.id, value: t.id }));
  const statutItems: { label: string; value: 'DISPONIBLE' | 'OCCUPE' | 'all' }[] = [
    { label: 'Tous', value: 'all' },
    { label: 'Disponible', value: 'DISPONIBLE' },
    { label: 'Occupé', value: 'OCCUPE' },
  ];

  return (
    <PageShell
      title="Nouveau dossier de vente"
      crumbs={[
        { label: 'Prospections', to: '/prospections' },
        { label: prospection.code || prospectionDisplayName(prospection), to: `/prospections/${prospection.id}` },
        { label: 'Nouveau dossier' },
      ]}
    >
      <div className="flex flex-col gap-3">
        <Card
          title="Sélectionner un article"
          action={
            selectedArticles.length > 0 ? (
              editingArticles ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditingArticles(false)}>
                  Terminé
                </Button>
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingArticles(true)}>
                  <Pencil data-icon="inline-start" /> Modifier
                </Button>
              )
            ) : undefined
          }
        >
          {selectedArticles.length > 0 && (
            <div className={showPicker ? 'mb-3.5 flex flex-col gap-2 border-b border-border pb-3.5' : 'flex flex-col gap-2'}>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-[11.5px] font-medium text-muted-foreground">
                  Article{selectedArticles.length > 1 ? 's' : ''} sélectionné{selectedArticles.length > 1 ? 's' : ''} ({selectedArticles.length})
                </span>
                {isSelectionSeeded && (
                  <span className="text-[11px] text-muted-foreground">— pré-rempli depuis la prospection</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {selectedArticles.map((a) => (
                  <ArticleCompactPreview
                    key={a.id}
                    article={a}
                    actions={
                      <Button type="button" variant="ghost" size="icon-sm" aria-label={`Retirer ${a.code}`} onClick={() => toggleArticle(a.id)}>
                        <X className="text-destructive" />
                      </Button>
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {showPicker && (
            <>
              <div className="mb-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <FormField>
                  <FieldLabel htmlFor="f-projet">Projet</FieldLabel>
                  <Select items={projetItems} value={projetId} onValueChange={(v) => { setProjetIdOverride((v as string) || ''); setTrancheIdOverride(''); }}>
                    <SelectTrigger id="f-projet" className="w-full">
                      <SelectValue placeholder="Choisir un projet…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {projetItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField>
                  <FieldLabel htmlFor="f-tranche">Tranche</FieldLabel>
                  <Select items={trancheItems} value={trancheId} onValueChange={(v) => setTrancheIdOverride((v as string) || '')} disabled={!projetId}>
                    <SelectTrigger id="f-tranche" className="w-full">
                      <SelectValue placeholder="Choisir une tranche…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {trancheItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField>
                  <FieldLabel htmlFor="f-code">Code</FieldLabel>
                  <Input id="f-code" placeholder="Code ou description" value={codeFilter} onChange={(e) => setCodeFilter(e.target.value)} />
                </FormField>
                <FormField>
                  <FieldLabel htmlFor="f-statut">État</FieldLabel>
                  <Select items={statutItems} value={statutFilter} onValueChange={(v) => setStatutFilter(v as 'DISPONIBLE' | 'OCCUPE' | 'all')}>
                    <SelectTrigger id="f-statut" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {statutItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField>
                  <FieldLabel htmlFor="f-categorie">Catégorie</FieldLabel>
                  <Select items={categorieItems} value={categorieFilter} onValueChange={(v) => setCategorieFilter((v as string) || null)}>
                    <SelectTrigger id="f-categorie" className="w-full">
                      <SelectValue placeholder="Toutes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {categorieItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField>
                  <FieldLabel htmlFor="f-type">Type</FieldLabel>
                  <Select items={typeItems} value={typeFilter} onValueChange={(v) => setTypeFilter((v as string) || null)}>
                    <SelectTrigger id="f-type" className="w-full">
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {typeItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField>
                  <FieldLabel htmlFor="f-superficieMin">Superficie min (m²)</FieldLabel>
                  <Input id="f-superficieMin" type="number" min={0} value={superficieMin} onChange={(e) => setSuperficieMin(e.target.value)} />
                </FormField>
                <FormField>
                  <FieldLabel htmlFor="f-superficieMax">Superficie max (m²)</FieldLabel>
                  <Input id="f-superficieMax" type="number" min={0} value={superficieMax} onChange={(e) => setSuperficieMax(e.target.value)} />
                </FormField>
              </div>

              <div className="mb-3 flex items-center justify-between gap-3 border-t border-border pt-3">
                <span className="text-[12px] text-muted-foreground">
                  {trancheId ? `${filteredArticles.length} article${filteredArticles.length > 1 ? 's' : ''} sur ${articles.data?.content.length ?? 0} chargé${(articles.data?.content.length ?? 0) > 1 ? 's' : ''}` : 'Choisissez un projet puis une tranche.'}
                </span>
                <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
                  <RotateCcw data-icon="inline-start" /> Réinitialiser
                </Button>
              </div>

              {articles.loading && <LoadingState />}
              {articles.error && <ErrorState message={articles.error} />}
              {trancheId && !articles.loading && filteredArticles.length === 0 && (
                <EmptyState title="Aucun article" message="Ajustez les filtres ci-dessus." />
              )}
              {filteredArticles.length > 0 && (
                <div className="max-h-90 overflow-y-auto rounded-md border border-border">
                  <Table>
                    <TableHeader className="sticky top-0 z-1 bg-card">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-9">
                          <Search className="size-3.5 text-muted-foreground" />
                        </TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Catégorie</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Superficie</TableHead>
                        <TableHead className="text-right">Prix de vente</TableHead>
                        <TableHead>État</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredArticles.map((a) => {
                        const checked = selectedIds.includes(a.id);
                        return (
                          <TableRow key={a.id} className="cursor-pointer" onClick={() => toggleArticle(a.id)}>
                            <TableCell>
                              <span className={`flex size-4 shrink-0 items-center justify-center rounded border ${checked ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>
                                {checked && <Check className="size-3" />}
                              </span>
                            </TableCell>
                            <TableCell className="font-medium text-foreground">{a.code}</TableCell>
                            <TableCell className="text-muted-foreground">{a.description || '—'}</TableCell>
                            <TableCell className="text-muted-foreground">{a.categorieLibelle || '—'}</TableCell>
                            <TableCell className="text-muted-foreground">{a.typeLibelle || '—'}</TableCell>
                            <TableCell className="text-right tabular-nums">{a.area ? `${a.area} m²` : '—'}</TableCell>
                            <TableCell className="text-right tabular-nums">{a.salePrice ? formatCurrency(a.salePrice) : '—'}</TableCell>
                            <TableCell>
                              <Badge tone={a.statut === 'DISPONIBLE' ? 'success' : 'neutral'}>{a.statut === 'DISPONIBLE' ? 'Disponible' : 'Occupé'}</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </Card>

        <Card title="Prix & notes">
          <FieldGroup>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <FormField>
                <FieldLabel htmlFor="prix">Prix retenu (DH) *</FieldLabel>
                <Input
                  id="prix"
                  type="number"
                  min={0}
                  step="0.01"
                  value={prixValue}
                  onChange={(e) => {
                    setPriceTouched(true);
                    setPrix(e.target.value);
                  }}
                  required
                />
                {!priceTouched && autoPrix > 0 && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {latestDevis?.montants?.prixVenteTTC
                      ? 'Pré-rempli depuis le devis existant de la prospection.'
                      : 'Pré-rempli depuis le prix de vente des lots sélectionnés.'}
                  </p>
                )}
                {!priceTouched && autoPrix === 0 && selectedIds.length > 0 && (
                  <p className="mt-1 text-[11px] text-destructive">
                    Aucun prix de vente sur les lots sélectionnés — saisissez le prix manuellement.
                  </p>
                )}
              </FormField>
              <FormField>
                <FieldLabel htmlFor="cin">CIN du client *</FieldLabel>
                <Input
                  id="cin"
                  value={cinValue}
                  onChange={(e) => {
                    setCinTouched(true);
                    setCin(e.target.value);
                  }}
                  required
                />
                {!cinTouched && autoCin && (
                  <p className="mt-1 text-[11px] text-muted-foreground">Pré-rempli depuis la pièce d'identité du prospect.</p>
                )}
              </FormField>
              <FormField>
                <FieldLabel htmlFor="modePaieId">Mode de paiement *</FieldLabel>
                <Select items={modesPaiementItems} value={modePaieId} onValueChange={(v) => setModePaieId((v as string) || null)}>
                  <SelectTrigger id="modePaieId" className="w-full">
                    <SelectValue placeholder="Choisir…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {modesPaiementItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <FormField>
              <FieldLabel htmlFor="notes">Notes</FieldLabel>
              <Textarea
                id="notes"
                value={notesValue}
                onChange={(e) => {
                  setNotesTouched(true);
                  setNotes(e.target.value);
                }}
              />
              {!notesTouched && autoNotes && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {latestDevis?.notes ? 'Pré-rempli depuis le devis existant.' : 'Pré-rempli depuis les notes de la prospection.'}
                </p>
              )}
            </FormField>
          </FieldGroup>
        </Card>

        <Card title="Schéma de financement">
          {selectedIds.length === 0 || !prixNumber || prixNumber <= 0 ? (
            <p className="text-[12.5px] text-muted-foreground">
              Sélectionnez au moins un article et un prix retenu pour voir le schéma de financement calculé par le serveur.
            </p>
          ) : (
            <>
              {schemaFinancement.loading && <LoadingState />}
              {schemaFinancement.error && <ErrorState message={schemaFinancement.error} />}
              {schemaFinancement.data && (
                <>
                  {(schemaFinancement.data.lignes ?? []).length === 0 ? (
                    <p className="text-[12.5px] text-muted-foreground">
                      Aucune ligne AUTO-FINANCEMENT/AVANCE/FRAIS SYNDIC pour la vocation de cet article.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {(schemaFinancement.data.lignes ?? []).map((ligne, i) => (
                        <div key={i} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-[13px]">
                          <span className="flex items-center gap-2 font-medium text-foreground">
                            {ligne.categorie}
                            {ligne.exclureDuPrix && <Badge tone="neutral">Hors prix</Badge>}
                          </span>
                          <span className="tabular-nums text-foreground">{formatCurrency(ligne.montant ?? 0)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                    <span className="text-[13px] font-semibold text-foreground">Total général</span>
                    <span className="text-[14px] font-semibold tabular-nums text-foreground">
                      {formatCurrency(schemaFinancement.data.totalGeneral ?? 0)}
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Aperçu calculé par le serveur — rien n'est créé ni réservé tant que le dossier n'est pas validé ci-dessous.
                  </p>
                </>
              )}
            </>
          )}
        </Card>

        {submitError && <p className="text-[12.5px] text-destructive">{submitError}</p>}

        <div className="flex items-center justify-end border-t border-border pt-4">
          <Button type="button" onClick={handleCreate} disabled={!canCreate || submitting}>
            <Check data-icon="inline-start" /> {submitting ? 'Création…' : 'Créer le dossier'}
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
