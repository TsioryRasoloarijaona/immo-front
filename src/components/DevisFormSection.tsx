import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Card } from './ui';
import ArticleCompactPreview from './ArticleCompactPreview';
import ArticleResultsList from './ArticleResultsList';
import MultiSelectDropdown from './MultiSelectDropdown';
import RefSelect from './RefSelect';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Field as FormField, FieldDescription, FieldLabel } from './ui/field';
import { useApi } from '../lib/useApi';
import {
  getArticle,
  getArticlesReferentiel,
  getProjetsReferentiel,
  getSousArticlesReferentiel,
  getTranchesReferentiel,
  type ArticleReferentielFilters,
} from '../lib/api';
import { referentielItems, useCategoriesBien, useModesPaiement, useTypesBienReferentiel } from '../lib/referentiels';
import type { ArticleListItemDto, CreerDevisRequest } from '../types';

/** Valeurs d'une offre existante, pour réutiliser le formulaire en modification (`PATCH /api/devis/{id}`). */
export type ValeursEditionDevis = {
  sousArticleIds: string[];
  remisePercent?: number;
  modePaiementId?: string;
  notes?: string;
  /** Article actuel : affiché présélectionné même occupé ou hors filtre (le référentiel ne rend que les libres). */
  article?: ArticleListItemDto;
  /** Sous-articles actuels, même raison. */
  sousArticles?: ArticleListItemDto[];
};

/** Liste du référentiel complétée des éléments actuels de l'offre qu'elle ne contient pas, en tête. */
function avecActuels(items: ArticleListItemDto[], actuels: ArticleListItemDto[]): ArticleListItemDto[] {
  const absents = actuels.filter((a) => !items.some((i) => i.id === a.id));
  return absents.length > 0 ? [...absents, ...items] : items;
}

/** Textes qui changent entre création et modification : sans article, le prix n'est requis qu'à la création. */
function textesPrix(isLibre: boolean, edition: boolean) {
  if (edition) {
    return { placeholder: 'Inchangé', description: 'Vide : le prix actuel de l’offre est conservé.', requis: false };
  }
  return isLibre
    ? { placeholder: 'Obligatoire', description: 'Requis — offre libre, sans article.', requis: true }
    : { placeholder: 'Optionnel', description: 'Remplace le prix commercial de l’article.', requis: false };
}

function libelleBouton(busy: boolean, edition: boolean): string {
  if (edition) return busy ? 'Enregistrement…' : 'Enregistrer';
  return busy ? 'Création…' : 'Créer l’offre';
}

export default function DevisFormSection({
  defaultTrancheId,
  defaultArticleId,
  defaultProspectId,
  defaultCommercialId,
  edition,
  startOpen,
  bare,
  onAdd,
}: Readonly<{
  defaultTrancheId?: string;
  defaultArticleId?: string;
  defaultProspectId?: string;
  defaultCommercialId?: string;
  /** Formulaire prérempli d'une offre existante : libellés et contrôle du prix adaptés. */
  edition?: ValeursEditionDevis;
  startOpen?: boolean;
  bare?: boolean;
  onAdd: (body: CreerDevisRequest) => Promise<void>;
}>) {
  const [open, setOpen] = useState((startOpen || bare) ?? false);

  const projets = useApi(() => getProjetsReferentiel(), []);
  const categoriesRef = useCategoriesBien();
  const typesRef = useTypesBienReferentiel();
  const modesPaiement = useModesPaiement();

  const [projetId, setProjetId] = useState<string | null>(null);
  const [trancheId, setTrancheId] = useState<string | null>(defaultTrancheId ?? null);
  const [categorieIds, setCategorieIds] = useState<string[]>([]);
  const [typeIds, setTypeIds] = useState<string[]>([]);
  const [onlyDisponible, setOnlyDisponible] = useState(!defaultArticleId);
  const [articleId, setArticleId] = useState<string | null>(defaultArticleId ?? null);
  const [sousArticleIds, setSousArticleIds] = useState<string[]>(edition?.sousArticleIds ?? []);
  const [prix, setPrix] = useState('');
  const [remisePercent, setRemisePercent] = useState(edition?.remisePercent ? String(edition.remisePercent) : '');
  const [modePaiementId, setModePaiementId] = useState<string | null>(edition?.modePaiementId ?? null);
  const [notes, setNotes] = useState(edition?.notes ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tranches = useApi(() => getTranchesReferentiel(projetId ?? undefined), [projetId]);
  const filters: ArticleReferentielFilters = {
    statut: onlyDisponible ? 'DISPONIBLE' : undefined,
    categorieId: categorieIds.length > 0 ? categorieIds : undefined,
    typeId: typeIds.length > 0 ? typeIds : undefined,
  };
  const articles = useApi(
    () => (trancheId ? getArticlesReferentiel(trancheId, filters) : Promise.resolve([])),
    [trancheId, onlyDisponible, categorieIds, typeIds],
  );
  const sousArticles = useApi(
    () => (articleId ? getSousArticlesReferentiel(articleId, filters) : Promise.resolve([])),
    [articleId, onlyDisponible, categorieIds, typeIds],
  );
  const selected = useApi(() => (articleId ? getArticle(articleId) : Promise.resolve(null)), [articleId]);

  const isLibre = !articleId;
  const textes = textesPrix(isLibre, !!edition);
  // L'article actuel n'appartient qu'à sa tranche ; ses sous-articles qu'à lui.
  const articleActuel = edition?.article && trancheId === (defaultTrancheId ?? null) ? [edition.article] : [];
  const articlesAffiches = avecActuels(articles.data ?? [], articleActuel);
  const sousArticlesActuels = articleId && articleId === defaultArticleId ? (edition?.sousArticles ?? []) : [];
  const sousArticlesAffiches = avecActuels(sousArticles.data ?? [], sousArticlesActuels);

  /** Un filtre vide la sélection en création ; en modification, l'article actuel reste choisi. */
  function apresFiltre() {
    if (edition) return;
    setArticleId(null);
    setSousArticleIds([]);
  }

  function reset() {
    setProjetId(null);
    setTrancheId(defaultTrancheId ?? null);
    setCategorieIds([]);
    setTypeIds([]);
    setArticleId(defaultArticleId ?? null);
    setSousArticleIds([]);
    setPrix('');
    setRemisePercent('');
    setModePaiementId(null);
    setNotes('');
    setError(null);
  }

  async function handleCreate() {
    if (!trancheId) return;
    if (textes.requis && !prix.trim()) {
      setError("Prix requis pour une offre libre (sans article).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onAdd({
        trancheId,
        articleId: articleId ?? undefined,
        sousArticleIds: sousArticleIds.length > 0 ? sousArticleIds : undefined,
        prospectId: defaultProspectId,
        commercialId: defaultCommercialId,
        modePaiementId: modePaiementId ?? undefined,
        prix: prix.trim() ? Number(prix) : undefined,
        remisePercent: remisePercent.trim() ? Number(remisePercent) : undefined,
        notes: notes.trim() || undefined,
      });
      reset();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la création de l'offre.");
    } finally {
      setBusy(false);
    }
  }

  const formFields = (
    <>
      {!open ? (
        <p className="text-body text-muted-foreground">Créez une offre de prix pour cette prospection — avec ou sans article, remise incluse.</p>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
            <RefSelect
              id="devis-projet"
              label="Projet"
              value={projetId}
              onChange={(v) => { setProjetId(v); setTrancheId(null); setArticleId(null); setSousArticleIds([]); }}
              items={referentielItems(projets.data ?? [])}
              placeholder="Tous les projets"
            />
            <RefSelect
              id="devis-tranche"
              label="Tranche"
              value={trancheId}
              onChange={(v) => { setTrancheId(v); setArticleId(null); setSousArticleIds([]); }}
              items={referentielItems(tranches.data ?? [])}
              placeholder="Choisir une tranche…"
            />
            <MultiSelectDropdown
              label="Catégorie"
              placeholder="Toutes"
              value={categorieIds}
              onChange={(ids) => { setCategorieIds(ids); apresFiltre(); }}
              items={referentielItems(categoriesRef.data)}
            />
            <MultiSelectDropdown
              label="Type"
              placeholder="Tous"
              value={typeIds}
              onChange={(ids) => { setTypeIds(ids); apresFiltre(); }}
              items={referentielItems(typesRef.data)}
            />
            <label className="flex items-center gap-1.5 text-body text-muted-foreground">
              <input
                type="checkbox"
                checked={onlyDisponible}
                onChange={(e) => { setOnlyDisponible(e.target.checked); apresFiltre(); }}
                className="size-3.5"
              />
              Disponibles uniquement
            </label>
          </div>

          {trancheId && (
            <div className="flex flex-col gap-1">
              <span className="text-micro font-medium text-muted-foreground">
                Article (optionnel — offre libre sans article sinon) {articles.data ? `(${articlesAffiches.length})` : ''}
              </span>
              <ArticleResultsList
                items={articlesAffiches}
                loading={articles.loading}
                selectedId={articleId}
                onSelect={(id) => { setArticleId(id); setSousArticleIds([]); }}
                allowNone
                noneLabel="Aucun — offre libre"
              />
            </div>
          )}

          {articleId && (
            <>
              <ArticleCompactPreview article={selected.data ?? null} loading={selected.loading} bare />
              <MultiSelectDropdown
                label="Sous-articles"
                placeholder="Aucun"
                value={sousArticleIds}
                onChange={setSousArticleIds}
                items={sousArticlesAffiches.map((a) => ({ label: [a.code, a.description].filter(Boolean).join(' — '), value: a.id }))}
                disabled={sousArticlesAffiches.length === 0}
              />
            </>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FormField>
              <FieldLabel htmlFor="devis-prix">Prix TTC</FieldLabel>
              <Input id="devis-prix" type="number" value={prix} onChange={(e) => setPrix(e.target.value)} placeholder={textes.placeholder} />
              <FieldDescription className="text-micro">{textes.description}</FieldDescription>
            </FormField>
            <FormField>
              <FieldLabel htmlFor="devis-remise">Remise (%)</FieldLabel>
              <Input id="devis-remise" type="number" value={remisePercent} onChange={(e) => setRemisePercent(e.target.value)} placeholder="0" />
            </FormField>
            <FormField>
              <FieldLabel htmlFor="devis-mode">Mode de paiement</FieldLabel>
              <RefSelect id="devis-mode" value={modePaiementId} onChange={setModePaiementId} items={referentielItems(modesPaiement.data)} placeholder="Non renseigné" size="default" />
            </FormField>
            <FormField className="sm:col-span-2 lg:col-span-1">
              <FieldLabel htmlFor="devis-notes">Notes</FieldLabel>
              <Input id="devis-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </FormField>
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" size="sm" disabled={!trancheId || busy} onClick={handleCreate}>
              {libelleBouton(busy, !!edition)}
            </Button>
            {error && <p className="text-body text-destructive">{error}</p>}
          </div>
        </div>
      )}
    </>
  );

  if (bare) return formFields;

  return (
    <Card
      title="Nouvelle offre"
      action={
        <Button type="button" variant={open ? 'ghost' : 'outline'} size="sm" onClick={() => {
          if (open) {
            reset();
          }
          setOpen((v) => !v);
        }}>
          {open ? 'Annuler' : (<><Plus data-icon="inline-start" /> Nouvelle offre</>)}
        </Button>
      }
    >
      {formFields}
    </Card>
  );
}
