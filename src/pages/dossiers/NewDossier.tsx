import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Check, Folder, RotateCcw, Search, X } from 'lucide-react';
import BoutonEdition from '../../components/BoutonEdition';
import PageShell from '../../components/PageShell';
import { Badge, Card, EmptyState, ErrorState, Field, FieldGrid, LoadingState } from '../../components/ui';
import ArticleCompactPreview from '../../components/ArticleCompactPreview';
import MentionPrixPlancher from '../../components/MentionPrixPlancher';
import { Button } from '../../components/ui/button';
import { Field as FormField, FieldGroup, FieldLabel } from '../../components/ui/field';
import { Input } from '../../components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '../../components/ui/input-group';
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
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { formatCurrency, formatPercent, formatPercentValue, formatSurface } from '../../lib/format';
import { avecCles } from '../../lib/cles';
import { aDesAnnexes, annexesAutomatiques, prixAnnexesAutomatiques } from '../../lib/annexesAutomatiques';

function libelleArticlesCharges(affiches: number, charges: number): string {
  const s = (n: number) => (n > 1 ? 's' : '');
  return `${affiches} article${s(affiches)} sur ${charges} chargé${s(charges)}`;
}
import { prospectionDisplayName } from '../../lib/domain';
import { referentielItems, useCategoriesBien, useModesPaiement, useTypesBienReferentiel } from '../../lib/referentiels';
import type { ArticleDetailDto, ArticleListItemDto, MontantsOffreDto, SchemaFinancementDto } from '../../types';

/** Sous-articles libres du lot que la création rattache d'office : visibles, car ils entrent dans le prix. */
function AnnexesAutomatiques({ annexes }: Readonly<{ annexes: ArticleListItemDto[] }>) {
  if (annexes.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-micro font-medium text-muted-foreground">
        Sous-articles du lot, rattachés d'office et comptés dans le prix ({annexes.length})
      </span>
      {annexes.map((a) => (
        <div key={a.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/30 px-3 py-2 text-label">
          <span className="flex items-center gap-2 font-medium text-foreground">
            {a.code}
            <Badge tone="neutral">Rattaché automatiquement</Badge>
          </span>
          <span className="flex items-center gap-3 tabular-nums text-muted-foreground">
            {a.area ? formatSurface(a.area) : '—'}
            <span className="text-foreground">{formatCurrency(a.prixSuggere ?? 0)}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

type FiltreStatut = 'DISPONIBLE' | 'OCCUPE' | 'all';

function AideRemise({ horsBornes, inhabituelle }: Readonly<{ horsBornes: boolean; inhabituelle: boolean }>) {
  if (horsBornes) return <p className="mt-1 text-micro text-destructive">La remise doit être comprise entre 0 et 100 %.</p>;
  if (inhabituelle) {
    return (
      <p className="mt-1 text-micro text-(--amber)">
        Remise inhabituelle (supérieure à 30 %) — à vérifier avant de valider.
      </p>
    );
  }
  return (
    <p className="mt-1 text-micro text-muted-foreground">
      Facultatif. Laissée vide, le prix ci-contre est le prix négocié.
    </p>
  );
}

/** Avec une remise, le prix saisi est le total avant remise, annexes comprises (règle serveur). */
function libellePrix(remiseRenseignee: boolean, avecAnnexes: boolean): string {
  if (!remiseRenseignee) return 'Prix retenu (DH) *';
  return avecAnnexes ? 'Prix total avant remise (bien + annexes) (DH) *' : 'Prix avant remise (DH) *';
}

/**
 * Taux tiré des montants de l'offre, pas de `remisePercent` (arrondi à 6 décimales en base). Non
 * arrondi : le serveur retombe ainsi sur `prixVenteTTC` au centime.
 */
function remiseDeduiteDeLOffre(montants: MontantsOffreDto | undefined): { totalTTC: number; taux: number } | null {
  const totalTTC = montants?.totalTTC;
  const prixVenteTTC = montants?.prixVenteTTC;
  if (totalTTC == null || prixVenteTTC == null || totalTTC <= 0 || prixVenteTTC >= totalTTC) return null;
  return { totalTTC, taux: ((totalTTC - prixVenteTTC) / totalTTC) * 100 };
}

/** Montants de la simulation serveur, ceux que la création enregistrera. Rien si aucune remise. */
function BlocRemise({ schema, avecAnnexes }: Readonly<{ schema: SchemaFinancementDto; avecAnnexes: boolean }>) {
  const { prixAvantRemise, montantRemise, remisePercent, prixApresRemise } = schema;
  if (montantRemise == null || prixApresRemise == null || montantRemise === 0) return null;
  // Prix négocié au-dessus du prix de référence : le serveur déduit une remise négative.
  const signe = montantRemise > 0 ? '−' : '+';
  return (
    <div className="mt-4 flex flex-col gap-1.5 border-t border-border pt-3">
      <div className="flex items-center justify-between text-body">
        <span className="text-muted-foreground">Montant de la remise ({formatPercentValue(remisePercent)})</span>
        <span className="tabular-nums text-foreground">
          {signe} {formatCurrency(Math.abs(montantRemise))}
        </span>
      </div>
      {avecAnnexes && (
        <p className="text-micro text-muted-foreground">
          Calculée sur le prix principal + annexes : {formatCurrency(prixAvantRemise)}.
        </p>
      )}
      <div className="flex items-center justify-between">
        <span className="text-label font-semibold text-foreground">Prix après remise</span>
        <span className="text-title font-semibold tabular-nums text-foreground">{formatCurrency(prixApresRemise)}</span>
      </div>
      <p className="text-micro text-muted-foreground">
        C'est ce montant qui sera dû. Les frais de syndic, issus du barème de la tranche, ne sont
        jamais remisés et s'ajoutent au schéma de financement ci-dessous.
      </p>
    </div>
  );
}

const EMPTY_ARTICLES ={ content: [] as ArticleListItemDto[], page: 0, size: 0, totalElements: 0, totalPages: 0 };

export default function NewDossier() {
  // La route `/prospections/:id/nouveau-dossier` garantit le paramètre.
  const { id = '' } = useParams();
  const { data: prospection, loading, error } = useApi(() => getProspection(id), [id]);
  const navigate = useNavigate();

  // La recherche d'articles n'existe que par tranche (`GET /api/tranches/{id}/articles`) :
  // élargir veut dire changer de tranche, pas de filtre « toutes tranches ».
  const seedTranche = useApi(
    () => (prospection?.trancheId ? getTranche(prospection.trancheId) : Promise.resolve(null)),
    [prospection?.trancheId],
  );
  // `null` = pas encore touché (repli sur la tranche de la prospection), `''` = vidé exprès.
  // Évite un setState dans un effet pour amorcer depuis une valeur asynchrone.
  const [projetIdOverride, setProjetIdOverride] = useState<string | null>(null);
  const [trancheIdOverride, setTrancheIdOverride] = useState<string | null>(null);
  const projetId = projetIdOverride === null ? (seedTranche.data?.projetId ?? null) : projetIdOverride || null;
  const trancheId = trancheIdOverride === null ? (seedTranche.data?.id ?? null) : trancheIdOverride || null;

  const projets = useApi(() => listProjets({ page: 0, size: 200 }), []);
  const tranches = useApi(
    () => (projetId ? listProjetTranches(projetId, { page: 0, size: 200 }) : Promise.resolve(EMPTY_ARTICLES as never)),
    [projetId],
  );

  // Seul `statut` est filtré côté serveur ; code, catégorie, type et superficie le sont ici,
  // l'endpoint ne les accepte pas.
  const [statutFilter, setStatutFilter] = useState<FiltreStatut>('DISPONIBLE');
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

  // La sélection pré-remplie peut couvrir plusieurs tranches : elle reste indépendante de `trancheId`.
  // `selectedIdsOverride` reste null tant que l'utilisateur n'a rien coché.
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
  const [editingArticles, setEditingArticles] = useState(false);

  const selectedArticleDetails = useApi(
    () => (selectedIds.length > 0 ? Promise.all(selectedIds.map((aid) => getArticle(aid))) : Promise.resolve([])),
    [selectedIds],
  );

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
  const [remise, setRemise] = useState('');
  const [remiseTouched, setRemiseTouched] = useState(false);
  const [priceTouched, setPriceTouched] = useState(false);
  const [notes, setNotes] = useState('');
  const [notesTouched, setNotesTouched] = useState(false);
  // `cin` et `modePaieId` sont exigés par le serveur (400 sans eux).
  const [cin, setCin] = useState('');
  const [cinTouched, setCinTouched] = useState(false);
  const [modePaieId, setModePaieId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const linkedProspect = useApi(
    () => (prospection?.prospectId ? getProspect(prospection.prospectId) : Promise.resolve(null)),
    [prospection?.prospectId],
  );
  const autoCin = linkedProspect.data?.pieceIdentite?.numero ?? '';
  const cinValue = cinTouched ? cin : autoCin || cin;

  const autoNotes = latestDevis?.notes || prospection?.notes || '';
  const notesValue = notesTouched ? notes : autoNotes || notes;

  const selectedArticles: ArticleDetailDto[] = selectedArticleDetails.data ?? [];
  const showPicker = editingArticles || selectedArticles.length === 0;
  // Le serveur rattache d'office les sous-articles libres du lot : ils entrent dans le prix proposé.
  const annexesAuto = annexesAutomatiques(selectedArticles);
  const avecAnnexes = aDesAnnexes(selectedIds.length, annexesAuto);
  // `prixSuggere` = prix commercial, ou plancher quand il vaut 0 — même calcul que le serveur.
  const autoPrixFromArticles =
    selectedArticles.reduce((sum, a) => sum + (a.prixSuggere ?? 0), 0) + prixAnnexesAutomatiques(annexesAuto);
  const prixPlancherPropose = selectedArticles.some((a) => a.prixSuggereEstPlancher);
  const remiseOffre = remiseDeduiteDeLOffre(latestDevis?.montants);
  // Taux auto seulement si le prix l'est aussi : sinon il s'appliquerait à un prix tapé à la main.
  const remiseAuto = !remiseTouched && !priceTouched ? remiseOffre : null;
  const remiseSaisie = remise.trim() === '' ? null : Number(remise.replace(',', '.'));
  const remiseNumber = remiseAuto?.taux ?? remiseSaisie;
  const remiseValue = remiseAuto ? String(Math.round(remiseAuto.taux * 100) / 100) : remise;

  // Avec une remise, `prix` est le total avant remise : depuis une offre remisée, c'est son `totalTTC`.
  const prixOffre = remiseOffre && remiseNumber !== null ? remiseOffre.totalTTC : latestDevis?.montants?.prixVenteTTC;
  const autoPrix = prixOffre || autoPrixFromArticles;
  const prixValue = !priceTouched && autoPrix > 0 ? String(autoPrix) : prix;

  // `remisePercent` est un pourcentage 0–100, pas un ratio. Avec une remise, `prix` devient le total
  // avant remise, annexes comprises.
  const remiseRenseignee = remiseNumber !== null && !Number.isNaN(remiseNumber);
  const remiseHorsBornes = remiseRenseignee && (remiseNumber < 0 || remiseNumber > 100);
  // Seuil générique : l'API n'expose aucun plafond de remise par article.
  const remiseInhabituelle = remiseRenseignee && !remiseHorsBornes && remiseNumber > 30;

  const prixNumber = prixValue ? Number(prixValue) : undefined;
  const debouncedPrixNumber = useDebouncedValue(prixNumber, 400);
  const debouncedRemise = useDebouncedValue(remiseRenseignee && !remiseHorsBornes ? remiseNumber : null, 400);
  // `avecAnnexes` vient de la requête qui a produit la réponse, pas de la sélection courante :
  // pendant le rechargement débouncé, l'ancienne réponse garde sa propre mention.
  const schemaFinancement = useApi(
    () =>
      selectedIds.length > 0 && debouncedPrixNumber && debouncedPrixNumber > 0
        ? simulerSchemaFinancement({
            articleIds: selectedIds,
            prix: debouncedPrixNumber,
            ...(debouncedRemise !== null ? { remisePercent: debouncedRemise } : {}),
          }).then((schema) => ({ schema, avecAnnexes: aDesAnnexes(selectedIds.length, schema.annexesAutomatiques) }))
        : Promise.resolve(null),
    [selectedIds, debouncedPrixNumber, debouncedRemise],
  );
  const schema = schemaFinancement.data?.schema;

  // Remise jamais recalculée ici : le serveur l'applique à principal + annexes, et la déduit
  // du prix de référence quand aucun taux n'est saisi. En erreur, rien plutôt qu'un chiffre périmé.
  const remiseServeur = schemaFinancement.error ? null : schemaFinancement.data;

  if (loading) return <PageShell title="Nouveau dossier"><LoadingState /></PageShell>;
  if (error) return <PageShell title="Nouveau dossier"><ErrorState message={error} /></PageShell>;
  if (!prospection) {
    return (
      <PageShell title="Prospection introuvable" crumbs={[{ label: 'Prospections', to: '/prospections' }]}>
        <p>Cette prospection n'existe pas.</p>
      </PageShell>
    );
  }
  // Le lien vers le dossier vit dans `activite` (vue légataire), pas au premier niveau du DTO.
  if (prospection.activite?.dossierId) {
    return <Navigate to={`/dossiers/${prospection.activite.dossierId}`} replace />;
  }

  // Hors de `handleCreate` : le narrowing de `prospection` ne traverse pas une déclaration de fonction.
  const prospectionId = prospection.id;

  function toggleArticle(articleId: string) {
    setSelectedIdsOverride(selectedIds.includes(articleId) ? selectedIds.filter((x) => x !== articleId) : [...selectedIds, articleId]);
  }

  // Prix facultatif pour l'API, mais exigé ici : pas de PATCH /api/dossiers/{id} pour le corriger ensuite.
  const canCreate =
    selectedIds.length > 0 &&
    prixValue.trim().length > 0 &&
    cinValue.trim().length > 0 &&
    !!modePaieId &&
    !remiseHorsBornes;

  async function handleCreate() {
    if (!canCreate) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const dossier = await createDossier({
        prospectionId,
        articleIds: selectedIds,
        prix: prixValue ? Number(prixValue) : undefined,
        // Omise si vide : le serveur prend alors `prix` comme prix négocié et déduit la remise
        // de l'écart avec le prix commercial.
        // `canCreate` a déjà écarté une remise hors bornes.
        ...(remiseRenseignee ? { remisePercent: remiseNumber } : {}),
        notes: notesValue || undefined,
        cin: cinValue.trim(),
        modePaieId: modePaieId,
      });
      void navigate(`/dossiers/${dossier.id}?nouveau=1`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Échec de la création.');
    } finally {
      setSubmitting(false);
    }
  }

  const projetItems = (projets.data?.content ?? []).map((p) => ({ label: p.description || p.code || p.id, value: p.id }));
  const trancheItems = (tranches.data?.content ?? []).map((t) => ({ label: t.description || t.code || t.id, value: t.id }));
  const statutItems: { label: string; value: FiltreStatut }[] = [
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
      icon={<Folder />}
      accent="var(--sec-dossier)"
      accentBg="var(--sec-dossier-bg)"
    >
      <div className="flex flex-col gap-3">
        <Card
          title="Sélectionner un article"
          action={
            selectedArticles.length > 0 ? (
              <BoutonEdition enEdition={editingArticles} onBasculer={setEditingArticles} />
            ) : undefined
          }
        >
          {selectedArticles.length > 0 && (
            <div className={showPicker ? 'mb-3.5 flex flex-col gap-2 border-b border-border pb-3.5' : 'flex flex-col gap-2'}>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-micro font-medium text-muted-foreground">
                  Article{selectedArticles.length > 1 ? 's' : ''} sélectionné{selectedArticles.length > 1 ? 's' : ''} ({selectedArticles.length})
                </span>
                {isSelectionSeeded && (
                  <span className="text-micro text-muted-foreground">— pré-rempli depuis la prospection</span>
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
              <AnnexesAutomatiques annexes={annexesAuto} />
            </div>
          )}

          {showPicker && (
            <>
              <div className="mb-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <FormField>
                  <FieldLabel htmlFor="f-projet">Projet</FieldLabel>
                  <Select items={projetItems} value={projetId} onValueChange={(v) => { setProjetIdOverride((v) || ''); setTrancheIdOverride(''); }}>
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
                  <Select items={trancheItems} value={trancheId} onValueChange={(v) => setTrancheIdOverride((v) || '')} disabled={!projetId}>
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
                  <Select items={categorieItems} value={categorieFilter} onValueChange={(v) => setCategorieFilter((v) || null)}>
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
                  <Select items={typeItems} value={typeFilter} onValueChange={(v) => setTypeFilter((v) || null)}>
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
                <span className="text-body text-muted-foreground">
                  {trancheId
                    ? libelleArticlesCharges(filteredArticles.length, articles.data?.content.length ?? 0)
                    : 'Choisissez un projet puis une tranche.'}
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
                            <TableCell className="text-right tabular-nums">{a.area ? formatSurface(a.area) : '—'}</TableCell>
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

        {/* Le détail HT/TVA n'existe que sur un devis (`MontantsOffreDto`) : jamais
            recalculé côté client quand il n'y en a pas. */}
        <Card title="Détail du prix">
          {latestDevis?.montants ? (
            <>
              <FieldGrid>
                <Field label="Prix avant TVA" value={formatCurrency(latestDevis.montants.prixVenteHT)} />
                <Field label="Prix après TVA" value={formatCurrency(latestDevis.montants.prixVenteTTC)} />
                <Field
                  label="Taux de TVA"
                  value={latestDevis.montants.tvaRatio != null ? formatPercent(latestDevis.montants.tvaRatio) : undefined}
                />
              </FieldGrid>
              <p className="mt-2 text-micro text-muted-foreground">
                Repris du devis existant sur cette prospection ({latestDevis.code}).
              </p>
            </>
          ) : (
            <p className="text-body text-muted-foreground">
              Détail HT/TVA indisponible — aucune offre (devis) n'a encore été créée sur cette prospection pour
              fournir ce calcul.
            </p>
          )}
        </Card>

        <Card title="Prix & remise">
          <FieldGroup>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <FormField>
                <FieldLabel htmlFor="prix">
                  {libellePrix(remiseRenseignee, avecAnnexes)}
                </FieldLabel>
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
                {remiseRenseignee && (
                  <p className="mt-1 text-micro text-muted-foreground">
                    Base de calcul de la remise — le prix réellement dû est affiché ci-dessous.
                  </p>
                )}
                {!priceTouched && autoPrix > 0 && (
                  <p className="mt-1 text-micro text-muted-foreground">
                    {latestDevis?.montants?.prixVenteTTC
                      ? 'Pré-rempli depuis le devis existant de la prospection.'
                      : 'Pré-rempli depuis le prix de vente des lots sélectionnés.'}
                  </p>
                )}
                {prixPlancherPropose && <MentionPrixPlancher />}
                {!priceTouched && autoPrix === 0 && selectedIds.length > 0 && (
                  <p className="mt-1 text-micro text-destructive">
                    Aucun prix de vente sur les lots sélectionnés — saisissez le prix manuellement.
                  </p>
                )}
              </FormField>
              <FormField>
                <FieldLabel htmlFor="remise">Remise commerciale</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="remise"
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    placeholder="0"
                    value={remiseValue}
                    onChange={(e) => {
                      setRemiseTouched(true);
                      setRemise(e.target.value);
                    }}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>%</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
                <AideRemise horsBornes={remiseHorsBornes} inhabituelle={remiseInhabituelle} />
                {remiseAuto && (
                  <p className="mt-1 text-micro text-muted-foreground">
                    Déduite de l'offre ({latestDevis?.code}) : son prix de vente {formatCurrency(latestDevis?.montants?.prixVenteTTC)} est retrouvé.
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
                  <p className="mt-1 text-micro text-muted-foreground">Pré-rempli depuis la pièce d'identité du prospect.</p>
                )}
              </FormField>
              <FormField>
                <FieldLabel htmlFor="modePaieId">Mode de paiement *</FieldLabel>
                <Select items={modesPaiementItems} value={modePaieId} onValueChange={(v) => setModePaieId((v) || null)}>
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
                <p className="mt-1 text-micro text-muted-foreground">
                  {latestDevis?.notes ? 'Pré-rempli depuis le devis existant.' : 'Pré-rempli depuis les notes de la prospection.'}
                </p>
              )}
            </FormField>
          </FieldGroup>
          {remiseServeur && !remiseHorsBornes && (
            <BlocRemise schema={remiseServeur.schema} avecAnnexes={remiseServeur.avecAnnexes} />
          )}
        </Card>

        <Card title="Schéma de financement">
          {selectedIds.length === 0 || !prixNumber || prixNumber <= 0 ? (
            <p className="text-body text-muted-foreground">
              Sélectionnez au moins un article et un prix retenu pour voir le schéma de financement calculé par le serveur.
            </p>
          ) : (
            <>
              {schemaFinancement.loading && <LoadingState />}
              {schemaFinancement.error && <ErrorState message={schemaFinancement.error} />}
              {schema && (
                <>
                  {latestDevis?.montants?.prixVenteTTC != null && (
                    <div className="mb-3 flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2 text-label">
                      <span className="font-medium text-foreground">Prix réel (TTC, depuis le devis)</span>
                      <span className="font-semibold tabular-nums text-foreground">{formatCurrency(latestDevis.montants.prixVenteTTC)}</span>
                    </div>
                  )}
                  {(schema.lignes ?? []).length === 0 ? (
                    <p className="text-body text-muted-foreground">
                      Aucune ligne AUTO-FINANCEMENT/AVANCE/FRAIS SYNDIC pour la vocation de cet article.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {avecCles(schema.lignes ?? [], (l) => `${l.categorie}-${l.exclureDuPrix}-${l.montant}`).map(({ item: ligne, cle }) => (
                        <div key={cle} className="flex items-center justify-between gap-3 rounded-lg bg-muted/30 px-3 py-2 text-label">
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
                    <span className="text-label font-semibold text-foreground">Total général</span>
                    <span className="text-title font-semibold tabular-nums text-foreground">
                      {formatCurrency(schema.totalGeneral ?? 0)}
                    </span>
                  </div>
                  <p className="mt-2 text-micro text-muted-foreground">
                    Aperçu calculé par le serveur — rien n'est créé ni réservé tant que le dossier n'est pas validé ci-dessous.
                  </p>
                </>
              )}
            </>
          )}
        </Card>

        {submitError && <p className="text-body text-destructive">{submitError}</p>}

        <div className="flex items-center justify-end border-t border-border pt-4">
          <Button type="button" onClick={handleCreate} disabled={!canCreate || submitting}>
            <Check data-icon="inline-start" /> {submitting ? 'Création…' : 'Créer le dossier'}
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
