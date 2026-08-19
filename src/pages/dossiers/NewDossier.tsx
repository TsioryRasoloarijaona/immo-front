import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, RotateCcw, Search } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, Card, EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Field as FormField, FieldGroup, FieldLabel } from '../../components/ui/field';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { createDossier, getProspect, getProspection, getTranche, listProjetTranches, listProjets, listTrancheArticles } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { formatCurrency } from '../../lib/format';
import { prospectionDisplayName } from '../../lib/domain';
import { referentielItems, useCategoriesBien, useModesPaiement, useTypesBienReferentiel } from '../../lib/referentiels';
import type { ArticleListItemDto } from '../../types';

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
      if (categorieFilter && a.categorie !== categorieFilter) return false;
      if (typeFilter && a.type !== typeFilter) return false;
      if (min !== null && (a.area ?? 0) < min) return false;
      if (max !== null && (a.area ?? 0) > max) return false;
      return true;
    });
  }, [articles.data, codeFilter, categorieFilter, typeFilter, superficieMin, superficieMax]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [prix, setPrix] = useState('');
  const [priceTouched, setPriceTouched] = useState(false);
  const [notes, setNotes] = useState('');
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

  if (loading) return <PageShell title="Nouveau dossier"><LoadingState /></PageShell>;
  if (error) return <PageShell title="Nouveau dossier"><ErrorState message={error} /></PageShell>;
  if (!prospection) {
    return (
      <PageShell title="Prospection introuvable" crumbs={[{ label: 'Prospections', to: '/prospections' }]}>
        <p>Cette prospection n'existe pas.</p>
      </PageShell>
    );
  }

  function toggleArticle(articleId: string) {
    setSelectedIds((prev) => (prev.includes(articleId) ? prev.filter((x) => x !== articleId) : [...prev, articleId]));
  }

  const selectedArticles = (articles.data?.content ?? []).filter((a) => selectedIds.includes(a.id));
  // Auto-fill Prix from the sum of selected articles' prix de vente, as long
  // as the user hasn't overridden it by hand.
  const autoPrix = selectedArticles.reduce((sum, a) => sum + (a.salePrice ?? 0), 0);
  const prixValue = priceTouched ? prix : autoPrix > 0 ? String(autoPrix) : prix;

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
        notes: notes || undefined,
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
        <Card title="Sélectionner un article">
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
            <div className="max-h-[360px] overflow-y-auto rounded-md border border-border">
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
                        <TableCell className="text-muted-foreground">{a.categorie || '—'}</TableCell>
                        <TableCell className="text-muted-foreground">{a.type || '—'}</TableCell>
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

          {selectedArticles.length > 0 && (
            <div className="mt-3.5 border-t border-border pt-3.5">
              <div className="mb-1.5 text-[11.5px] font-medium text-muted-foreground">Sélection ({selectedArticles.length})</div>
              <div className="flex flex-wrap gap-2">
                {selectedArticles.map((a) => (
                  <Badge key={a.id} tone="info" className="gap-1">
                    {a.code}
                    <button type="button" onClick={() => toggleArticle(a.id)} aria-label={`Retirer ${a.code}`}>
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
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
                  <p className="mt-1 text-[11px] text-muted-foreground">Pré-rempli depuis le prix de vente des lots sélectionnés.</p>
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
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </FormField>
          </FieldGroup>
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
