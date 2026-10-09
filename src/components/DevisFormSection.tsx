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
import type { CreerDevisRequest } from '../types';

export default function DevisFormSection({
  defaultTrancheId,
  defaultArticleId,
  defaultProspectId,
  defaultCommercialId,
  startOpen,
  bare,
  onAdd,
}: {
  defaultTrancheId?: string;
  defaultArticleId?: string;
  defaultProspectId?: string;
  defaultCommercialId?: string;
  startOpen?: boolean;
  bare?: boolean;
  onAdd: (body: CreerDevisRequest) => Promise<void>;
}) {
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
  const [sousArticleIds, setSousArticleIds] = useState<string[]>([]);
  const [prix, setPrix] = useState('');
  const [remisePercent, setRemisePercent] = useState('');
  const [modePaiementId, setModePaiementId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
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
    if (isLibre && !prix.trim()) {
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
              onChange={(ids) => { setCategorieIds(ids); setArticleId(null); setSousArticleIds([]); }}
              items={referentielItems(categoriesRef.data)}
            />
            <MultiSelectDropdown
              label="Type"
              placeholder="Tous"
              value={typeIds}
              onChange={(ids) => { setTypeIds(ids); setArticleId(null); setSousArticleIds([]); }}
              items={referentielItems(typesRef.data)}
            />
            <label className="flex items-center gap-1.5 text-body text-muted-foreground">
              <input
                type="checkbox"
                checked={onlyDisponible}
                onChange={(e) => { setOnlyDisponible(e.target.checked); setArticleId(null); setSousArticleIds([]); }}
                className="size-3.5"
              />
              Disponibles uniquement
            </label>
          </div>

          {trancheId && (
            <div className="flex flex-col gap-1">
              <span className="text-micro font-medium text-muted-foreground">
                Article (optionnel — offre libre sans article sinon) {articles.data ? `(${articles.data.length})` : ''}
              </span>
              <ArticleResultsList
                items={articles.data ?? []}
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
                items={(sousArticles.data ?? []).map((a) => ({ label: `${a.code}${a.description ? ` — ${a.description}` : ''}`, value: a.id }))}
                disabled={(sousArticles.data ?? []).length === 0}
              />
            </>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FormField>
              <FieldLabel htmlFor="devis-prix">Prix TTC</FieldLabel>
              <Input id="devis-prix" type="number" value={prix} onChange={(e) => setPrix(e.target.value)} placeholder={isLibre ? 'Obligatoire' : 'Optionnel'} />
              <FieldDescription className="text-micro">
                {isLibre ? 'Requis — offre libre, sans article.' : 'Remplace le prix commercial de l’article.'}
              </FieldDescription>
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
              {busy ? 'Création…' : 'Créer l’offre'}
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
        <Button type="button" variant={open ? 'ghost' : 'outline'} size="sm" onClick={() => { if (open) reset(); setOpen((v) => !v); }}>
          {open ? 'Annuler' : (<><Plus data-icon="inline-start" /> Nouvelle offre</>)}
        </Button>
      }
    >
      {formFields}
    </Card>
  );
}
