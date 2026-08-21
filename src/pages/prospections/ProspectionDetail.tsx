import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Plus, X } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, Card, EmptyState, ErrorState, Field, FieldGrid, LoadingState } from '../../components/ui';
import CreateProspectForm, { type CreateProspectInitial } from '../../components/CreateProspectForm';
import InteractionForm from '../../components/InteractionForm';
import SearchSelect from '../../components/SearchSelect';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Field as FormField, FieldGroup, FieldLabel } from '../../components/ui/field';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { cn } from '../../lib/utils';
import { formatCurrency, formatDate } from '../../lib/format';
import {
  PIPELINE_STAGES,
  PIPELINE_STAGE_SHORT,
  etapeBadgeTone,
  isSideTrackEtape,
  pipelineStageIndex,
  prospectionDisplayName,
  interactionIcon,
} from '../../lib/domain';
import { useAppData, commercialLabel } from '../../lib/appData';
import {
  addInteraction,
  addProspectionAutreTranche,
  addProspectionCategorie,
  addProspectionProfil,
  addProspectionTypeBien,
  addProspectionVille,
  archiverProspection,
  changerEtapeProspection,
  creerDevis,
  getProspection,
  getSupportsForOrigine,
  getVillesReferentiel,
  listDevis,
  listInteractions,
  listProspectionAutresTranches,
  listProspectionCategories,
  listProspectionProfils,
  listProspectionTypesBien,
  listProspectionVilles,
  modifierProspection,
  removeProspectionAutreTranche,
  removeProspectionCategorie,
  removeProspectionProfil,
  removeProspectionTypeBien,
  removeProspectionVille,
  transformerProspection,
} from '../../lib/api';
import { useApi } from '../../lib/useApi';
import {
  referentielItems,
  useActionsCommerciales,
  useCategoriesBien,
  useEtapesProspection,
  useOriginesProspection,
  useProfilsProspection,
  useRaisonsCloture,
  useTypesBienReferentiel,
  useTypesContactProspection,
  useVocations,
} from '../../lib/referentiels';
import type { ModifierProspectionRequest } from '../../types';

type ProspectionTab = 'apercu' | 'autres' | 'devis' | 'historique';

function RefSelect({
  id,
  value,
  onChange,
  items,
  placeholder,
  size,
}: {
  id: string;
  value: string | null;
  onChange: (v: string | null) => void;
  items: { label: string; value: string }[];
  placeholder?: string;
  size?: 'sm' | 'default';
}) {
  const allItems = [{ label: placeholder ?? '— Non renseigné —', value: '' }, ...items];
  return (
    <Select items={allItems} value={value ?? ''} onValueChange={(v) => onChange((v as string) || null)}>
      <SelectTrigger id={id} size={size}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {allItems.map((item) => (
            <SelectItem key={item.value || '__none'} value={item.value}>{item.label}</SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

/** One "add via référentiel dropdown, remove via chip ✕" section, reused for
 * villes/types-bien/profils/catégories. */
function LinkedRefSection({
  title,
  items,
  refItems,
  onAdd,
  onRemove,
}: {
  title: string;
  items: { id: string; label: string }[];
  refItems: { label: string; value: string }[];
  onAdd: (id: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Card title={title}>
      <div className="mb-3 flex flex-wrap gap-2">
        {items.length === 0 && <span className="text-[12.5px] text-muted-foreground">Aucun.</span>}
        {items.map((it) => (
          <Badge key={it.id} tone="info" className="gap-1">
            {it.label}
            <button type="button" onClick={() => onRemove(it.id)} aria-label={`Retirer ${it.label}`}>
              <X className="size-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className="w-[220px]">
          <RefSelect id={`add-${title}`} value={picked} onChange={setPicked} items={refItems} placeholder="Choisir…" size="sm" />
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!picked || busy}
          onClick={async () => {
            if (!picked) return;
            setBusy(true);
            try {
              await onAdd(picked);
              setPicked(null);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Plus data-icon="inline-start" /> Ajouter
        </Button>
      </div>
    </Card>
  );
}

export default function ProspectionDetail() {
  const { id } = useParams();
  const { data: p, loading, error, refetch } = useApi(() => getProspection(id!), [id]);
  const [interactionsPage, setInteractionsPage] = useState(0);
  const interactions = useApi(() => listInteractions(id!, { page: interactionsPage, size: 20 }), [id, interactionsPage]);
  const { commerciaux } = useAppData();
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);
  const [showCreateProspect, setShowCreateProspect] = useState(false);
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [transformCommercial, setTransformCommercial] = useState<string | null>(null);
  const [etapeId, setEtapeId] = useState<string | null>(null);
  const [showArchiver, setShowArchiver] = useState(false);
  const [raisonId, setRaisonId] = useState<string | null>(null);
  const [raisonTexte, setRaisonTexte] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<ProspectionTab>('apercu');
  const [editingInfo, setEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState<ModifierProspectionRequest | null>(null);
  const [saving, setSaving] = useState(false);

  const etapes = useEtapesProspection();
  const raisons = useRaisonsCloture();
  const origines = useOriginesProspection();
  const vocations = useVocations();
  const typesContact = useTypesContactProspection();
  const actionsCommerciales = useActionsCommerciales();
  const supports = useApi(
    () => (infoForm?.origineId ? getSupportsForOrigine(infoForm.origineId) : Promise.resolve([])),
    [infoForm?.origineId],
  );

  const villes = useApi(() => (id ? listProspectionVilles(id) : Promise.resolve([])), [id]);
  const typesBien = useApi(() => (id ? listProspectionTypesBien(id) : Promise.resolve([])), [id]);
  const profils = useApi(() => (id ? listProspectionProfils(id) : Promise.resolve([])), [id]);
  const categories = useApi(() => (id ? listProspectionCategories(id) : Promise.resolve([])), [id]);
  const autresTranches = useApi(() => (id ? listProspectionAutresTranches(id) : Promise.resolve([])), [id]);
  const [devisPage, setDevisPage] = useState(0);
  const devis = useApi(() => listDevis(id!, { page: devisPage, size: 20 }), [id, devisPage]);

  const typesBienRef = useTypesBienReferentiel();
  const categoriesRef = useCategoriesBien();
  const profilsRef = useProfilsProspection();
  const profilOptions = profilsRef.data.flatMap((cat) =>
    (cat.profils ?? []).map((pr) => ({ label: `${cat.description ?? cat.code} — ${pr.description ?? pr.code}`, value: pr.id })),
  );

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3600);
  }

  if (loading) return <PageShell title="Prospection"><LoadingState /></PageShell>;
  if (error) return <PageShell title="Prospection"><ErrorState message={error} /></PageShell>;
  if (!p) {
    return (
      <PageShell title="Prospection introuvable" crumbs={[{ label: 'Prospections', to: '/prospections' }]}>
        <p>Cette prospection n'existe pas.</p>
      </PageShell>
    );
  }

  const name = prospectionDisplayName(p);
  const createProspectInitial: CreateProspectInitial = {
    firstName: name?.trim().split(' ')[0] ?? '',
    lastName: name?.trim().split(' ').slice(1).join(' ') ?? '',
    phone: p.tempTel ?? '',
    email: p.tempEmail ?? '',
  };
  const stageIdx = pipelineStageIndex(p.etape);
  const showStepper = !p.fermee && !isSideTrackEtape(p.etape) && stageIdx >= 0;
  const isPre = !p.prospectId;
  const commercialItems = commerciaux.map((c) => ({ label: commercialLabel(c), value: c.id }));

  async function handleTransform() {
    if (!transformCommercial) return;
    setBusy(true);
    try {
      await transformerProspection(p!.id, { commercialId: transformCommercial });
      await refetch();
      showToast('Prospection transformée — commercial assigné.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Échec de l'opération.");
    } finally {
      setBusy(false);
    }
  }

  async function handleChangeEtape() {
    if (!etapeId) return;
    setBusy(true);
    try {
      await changerEtapeProspection(p!.id, { etapeId });
      setEtapeId(null);
      await refetch();
      showToast('Étape changée.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Échec de l'opération.");
    } finally {
      setBusy(false);
    }
  }

  async function handleArchiver() {
    setBusy(true);
    try {
      await archiverProspection(p!.id, { raisonId: raisonId ?? undefined, raisonTexte: raisonTexte.trim() || undefined });
      setShowArchiver(false);
      await refetch();
      showToast('Prospection clôturée.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Échec de l'opération.");
    } finally {
      setBusy(false);
    }
  }

  function startEditInfo() {
    setInfoForm({
      origineId: p!.origineId,
      origineSupportId: p!.origineSupportId,
      vocationId: p!.vocationId,
      typeContactId: p!.typeContactId,
      actionCommercialeId: p!.actionCommercialeId,
      surface: p!.surface,
      surfaceJusqua: p!.surfaceJusqua,
      prix: p!.prix,
      prixJusqua: p!.prixJusqua,
      avance: p!.avance,
      financementFondsPropres: p!.financementFondsPropres,
      financementCredit: p!.financementCredit,
      financementAutre: p!.financementAutre,
      notes: p!.notes,
    });
    setEditingInfo(true);
  }

  async function saveInfo() {
    if (!infoForm) return;
    setSaving(true);
    try {
      await modifierProspection(p!.id, infoForm);
      await refetch();
      setEditingInfo(false);
      showToast('Prospection mise à jour.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Échec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell title={name} crumbs={[{ label: 'Prospections', to: '/prospections' }, { label: p.code || name }]}>
      <Button variant="outline" size="sm" className="mb-3" onClick={() => navigate('/prospections')}>
        <ArrowLeft data-icon="inline-start" /> Retour à la liste
      </Button>

      <div className="mb-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[21px] font-semibold tracking-tight text-foreground">{name}</h1>
            {isPre && <Badge tone="amber">Pré-prospection · Non qualifiée</Badge>}
            <Badge tone={etapeBadgeTone(p.etape, p.fermee)}>{p.fermee ? 'Clôturée' : p.etape || '—'}</Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px] text-muted-foreground">
            {p.code && <>Code {p.code} · </>}
            Créée le {formatDate(p.dateDocument)} · Commercial : {p.commercialNom || '— non assigné —'}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2.5">
          <Button variant="outline" size="sm" onClick={() => setShowInteractionForm(true)}>
            Ajouter une action
          </Button>
          {isPre ? (
            <Button variant="outline" size="sm" onClick={() => setShowCreateProspect(true)}>
              + Créer prospect
            </Button>
          ) : !p.commercialId ? (
            <div className="flex items-center gap-1.5">
              <Select items={commercialItems} value={transformCommercial} onValueChange={(v) => setTransformCommercial(v as string | null)}>
                <SelectTrigger size="sm">
                  <SelectValue placeholder="Commercial…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {commercialItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handleTransform} disabled={!transformCommercial || busy}>
                Transformer
              </Button>
            </div>
          ) : (
            <Button onClick={() => navigate(`/prospections/${p.id}/nouveau-dossier`)} disabled={p.fermee}>
              Créer / ouvrir dossier
            </Button>
          )}
          {!p.fermee && !showArchiver && (
            <Button variant="ghost" size="sm" onClick={() => setShowArchiver(true)} disabled={busy} className="text-destructive">
              Clôturer
            </Button>
          )}
        </div>
      </div>

      {showArchiver && (
        <Card title="Clôturer la prospection" action={<Button variant="ghost" size="sm" onClick={() => setShowArchiver(false)}>Annuler</Button>}>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-[240px]">
              <div className="mb-1 text-[11.5px] font-medium text-muted-foreground">Raison</div>
              <RefSelect id="raison" value={raisonId} onChange={setRaisonId} items={referentielItems(raisons.data)} />
            </div>
            <div className="min-w-[240px] flex-1">
              <div className="mb-1 text-[11.5px] font-medium text-muted-foreground">Détail (optionnel)</div>
              <Input value={raisonTexte} onChange={(e) => setRaisonTexte(e.target.value)} />
            </div>
            <Button size="sm" onClick={handleArchiver} disabled={busy} className="text-destructive-foreground">
              Confirmer la clôture
            </Button>
          </div>
        </Card>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {!p.fermee && (
          <Card>
            {showStepper && (
              <div className="flex items-center">
                {PIPELINE_STAGES.map((stage, i) => (
                  <div className="flex flex-1 items-center" key={stage}>
                    <div className={cn('flex flex-col items-center', i === PIPELINE_STAGES.length - 1 ? 'flex-none' : 'flex-1')}>
                      <div
                        className={cn(
                          'flex size-[22px] shrink-0 items-center justify-center rounded-full border-2 text-[10.5px] font-bold',
                          i <= stageIdx
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-[var(--neutral-bg)] text-muted-foreground'
                        )}
                      >
                        {i + 1}
                      </div>
                      <div className="mt-1.5 text-center text-[10.5px] text-muted-foreground">{PIPELINE_STAGE_SHORT[stage]}</div>
                    </div>
                    {i < PIPELINE_STAGES.length - 1 && (
                      <div className={cn('mx-0.5 h-0.5 flex-1', i < stageIdx ? 'bg-primary' : 'bg-border')} />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className={cn('flex flex-wrap items-center gap-2.5', showStepper && 'mt-4 border-t border-border pt-4')}>
              <span className="text-[11.5px] font-medium text-muted-foreground">Changer d'étape :</span>
              <div className="w-[220px]">
                <RefSelect id="etape" value={etapeId} onChange={setEtapeId} items={referentielItems(etapes.data)} placeholder="Choisir une étape…" />
              </div>
              <Button size="sm" variant="outline" onClick={handleChangeEtape} disabled={!etapeId || busy}>
                Appliquer
              </Button>
            </div>
          </Card>
        )}

        {p.fermee && (
          <Card title="Motif de clôture">
            <FieldGrid>
              <Field label="Date de clôture" value={formatDate(p.dateFermeture)} />
              <Field label="Motif" value={p.raisonFermeture} />
            </FieldGrid>
            {p.raisonFermetureTexte && (
              <div className="mt-3.5">
                <div className="mb-1.5 text-[11.5px] font-medium text-muted-foreground">Détail</div>
                <div className="whitespace-pre-wrap rounded-md border border-border bg-background p-3 text-[13px] leading-relaxed text-foreground">
                  {p.raisonFermetureTexte}
                </div>
              </div>
            )}
          </Card>
        )}

        <Tabs value={tab} onValueChange={(v) => setTab(v as ProspectionTab)} className="gap-3">
          <TabsList>
            <TabsTrigger value="apercu">Aperçu</TabsTrigger>
            <TabsTrigger value="autres">Autres</TabsTrigger>
            <TabsTrigger value="devis">
              Devis {(devis.data?.totalElements ?? 0) > 0 && <Badge tone="neutral" className="ml-1.5">{devis.data!.totalElements}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="historique">
              Historique
              {(interactions.data?.totalElements ?? 0) > 0 && <Badge tone="neutral" className="ml-1.5">{interactions.data!.totalElements}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="apercu">
            <div className="flex flex-col gap-3">
              <Card title="Contact">
                <FieldGrid>
                  <Field label="Nom" value={p.prospectNom} />
                  {isPre && <Field label="Description (temp.)" value={p.tempDescription} />}
                  {isPre && <Field label="Téléphone (temp.)" value={p.tempTel} />}
                  {isPre && <Field label="Email (temp.)" value={p.tempEmail} />}
                </FieldGrid>
                {!p.prospectId && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Aucune fiche prospect liée — utilisez « Créer prospect » ci-dessus pour en lier une.
                  </p>
                )}
              </Card>

              <Card
                title="Détails de la recherche"
                action={
                  editingInfo ? (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingInfo(false)}>Annuler</Button>
                      <Button size="sm" onClick={saveInfo} disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={startEditInfo}>Modifier</Button>
                  )
                }
              >
                {editingInfo && infoForm ? (
                  <FieldGroup>
                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                      <FormField>
                        <FieldLabel htmlFor="f-origine">Origine</FieldLabel>
                        <RefSelect
                          id="f-origine"
                          value={infoForm.origineId ?? null}
                          onChange={(v) => setInfoForm({ ...infoForm, origineId: v ?? undefined, origineSupportId: undefined })}
                          items={origines.data.map((o) => ({ label: o.description || o.code || o.id, value: o.id }))}
                        />
                      </FormField>
                      <FormField>
                        <FieldLabel htmlFor="f-support">Support / campagne</FieldLabel>
                        <RefSelect
                          id="f-support"
                          value={infoForm.origineSupportId ?? null}
                          onChange={(v) => setInfoForm({ ...infoForm, origineSupportId: v ?? undefined })}
                          items={referentielItems(supports.data ?? [])}
                        />
                      </FormField>
                      <FormField>
                        <FieldLabel htmlFor="f-vocation">Vocation</FieldLabel>
                        <RefSelect
                          id="f-vocation"
                          value={infoForm.vocationId ?? null}
                          onChange={(v) => setInfoForm({ ...infoForm, vocationId: v ?? undefined })}
                          items={referentielItems(vocations.data)}
                        />
                      </FormField>
                      <FormField>
                        <FieldLabel htmlFor="f-typeContact">Type de contact</FieldLabel>
                        <RefSelect
                          id="f-typeContact"
                          value={infoForm.typeContactId ?? null}
                          onChange={(v) => setInfoForm({ ...infoForm, typeContactId: v ?? undefined })}
                          items={referentielItems(typesContact.data)}
                        />
                      </FormField>
                      <FormField>
                        <FieldLabel htmlFor="f-action">Action commerciale</FieldLabel>
                        <RefSelect
                          id="f-action"
                          value={infoForm.actionCommercialeId ?? null}
                          onChange={(v) => setInfoForm({ ...infoForm, actionCommercialeId: v ?? undefined })}
                          items={referentielItems(actionsCommerciales.data)}
                        />
                      </FormField>
                      <FormField>
                        <FieldLabel htmlFor="f-prix">Prix min (DH)</FieldLabel>
                        <Input id="f-prix" type="number" value={infoForm.prix ?? ''} onChange={(e) => setInfoForm({ ...infoForm, prix: Number(e.target.value) || undefined })} />
                      </FormField>
                      <FormField>
                        <FieldLabel htmlFor="f-prixJusqua">Prix max (DH)</FieldLabel>
                        <Input id="f-prixJusqua" type="number" value={infoForm.prixJusqua ?? ''} onChange={(e) => setInfoForm({ ...infoForm, prixJusqua: Number(e.target.value) || undefined })} />
                      </FormField>
                      <FormField>
                        <FieldLabel htmlFor="f-surface">Superficie min (m²)</FieldLabel>
                        <Input id="f-surface" type="number" value={infoForm.surface ?? ''} onChange={(e) => setInfoForm({ ...infoForm, surface: Number(e.target.value) || undefined })} />
                      </FormField>
                      <FormField>
                        <FieldLabel htmlFor="f-surfaceJusqua">Superficie max (m²)</FieldLabel>
                        <Input id="f-surfaceJusqua" type="number" value={infoForm.surfaceJusqua ?? ''} onChange={(e) => setInfoForm({ ...infoForm, surfaceJusqua: Number(e.target.value) || undefined })} />
                      </FormField>
                      <FormField>
                        <FieldLabel htmlFor="f-avance">Avance (DH)</FieldLabel>
                        <Input id="f-avance" type="number" value={infoForm.avance ?? ''} onChange={(e) => setInfoForm({ ...infoForm, avance: Number(e.target.value) || undefined })} />
                      </FormField>
                      <FormField>
                        <FieldLabel htmlFor="f-fondsPropres">Fonds propres (DH)</FieldLabel>
                        <Input id="f-fondsPropres" type="number" value={infoForm.financementFondsPropres ?? ''} onChange={(e) => setInfoForm({ ...infoForm, financementFondsPropres: Number(e.target.value) || undefined })} />
                      </FormField>
                      <FormField>
                        <FieldLabel htmlFor="f-credit">Crédit (DH)</FieldLabel>
                        <Input id="f-credit" type="number" value={infoForm.financementCredit ?? ''} onChange={(e) => setInfoForm({ ...infoForm, financementCredit: Number(e.target.value) || undefined })} />
                      </FormField>
                      <FormField>
                        <FieldLabel htmlFor="f-autre">Autre financement (DH)</FieldLabel>
                        <Input id="f-autre" type="number" value={infoForm.financementAutre ?? ''} onChange={(e) => setInfoForm({ ...infoForm, financementAutre: Number(e.target.value) || undefined })} />
                      </FormField>
                    </div>
                    <FormField className="mt-3.5">
                      <FieldLabel htmlFor="f-notes">Notes</FieldLabel>
                      <Textarea id="f-notes" value={infoForm.notes ?? ''} onChange={(e) => setInfoForm({ ...infoForm, notes: e.target.value })} />
                    </FormField>
                  </FieldGroup>
                ) : (
                  <>
                    <FieldGrid>
                      <Field label="Origine" value={p.origine} />
                      <Field label="Support / campagne" value={p.origineSupport} />
                      <Field label="Vocation" value={p.vocation} />
                      <Field label="Type de contact" value={p.typeContact} />
                      <Field label="Action commerciale" value={p.actionCommerciale} />
                      <Field label="Prix min" value={p.prix ? formatCurrency(p.prix) : undefined} />
                      <Field label="Prix max" value={p.prixJusqua ? formatCurrency(p.prixJusqua) : undefined} />
                      <Field label="Superficie min" value={p.surface ? `${p.surface} m²` : undefined} />
                      <Field label="Superficie max" value={p.surfaceJusqua ? `${p.surfaceJusqua} m²` : undefined} />
                      <Field label="Avance" value={p.avance ? formatCurrency(p.avance) : undefined} />
                      <Field label="Fonds propres" value={p.financementFondsPropres ? formatCurrency(p.financementFondsPropres) : undefined} />
                      <Field label="Crédit" value={p.financementCredit ? formatCurrency(p.financementCredit) : undefined} />
                      <Field label="Autre financement" value={p.financementAutre ? formatCurrency(p.financementAutre) : undefined} />
                      <Field label="Ancien client" value={p.ancienClient ? 'Oui' : 'Non'} />
                      <Field label="Proposé par" value={p.proposeurNom} />
                    </FieldGrid>
                    {p.notes && (
                      <div className="mt-3.5 border-t border-border pt-3.5">
                        <div className="mb-1.5 text-[11.5px] font-medium text-muted-foreground">Notes</div>
                        <div className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">{p.notes}</div>
                      </div>
                    )}
                  </>
                )}
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="autres">
            <div className="flex flex-col gap-3">
              <Card title="Villes recherchées">
                <div className="mb-3 flex flex-wrap gap-2">
                  {(villes.data ?? []).length === 0 && <span className="text-[12.5px] text-muted-foreground">Aucune.</span>}
                  {(villes.data ?? []).map((v) => (
                    <Badge key={v.id} tone="info" className="gap-1">
                      {v.ville}
                      <button
                        type="button"
                        aria-label={`Retirer ${v.ville}`}
                        onClick={async () => {
                          await removeProspectionVille(p.id, v.id);
                          villes.refetch();
                        }}
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="max-w-[320px]">
                  <SearchSelect
                    placeholder="Rechercher une ville…"
                    onSearch={async (q) => {
                      if (!q.trim()) return [];
                      const page = await getVillesReferentiel({ search: q }, { page: 0, size: 20 });
                      return page.content.map((v) => ({ label: v.description || v.code || v.id, value: v.id }));
                    }}
                    onSelect={async (opt) => {
                      await addProspectionVille(p.id, { villeId: opt.value });
                      villes.refetch();
                    }}
                  />
                </div>
              </Card>

              <LinkedRefSection
                title="Types de bien"
                items={(typesBien.data ?? []).map((t) => ({ id: t.id, label: t.typeBien || '' }))}
                refItems={referentielItems(typesBienRef.data)}
                onAdd={async (typeBienId) => { await addProspectionTypeBien(p.id, { typeBienId }); typesBien.refetch(); }}
                onRemove={async (itemId) => { await removeProspectionTypeBien(p.id, itemId); typesBien.refetch(); }}
              />

              <LinkedRefSection
                title="Profils"
                items={(profils.data ?? []).map((pr) => ({ id: pr.id, label: pr.profil || '' }))}
                refItems={profilOptions}
                onAdd={async (profilId) => { await addProspectionProfil(p.id, { profilId }); profils.refetch(); }}
                onRemove={async (itemId) => { await removeProspectionProfil(p.id, itemId); profils.refetch(); }}
              />

              <LinkedRefSection
                title="Catégories de bien"
                items={(categories.data ?? []).map((c) => ({ id: c.id, label: c.categorie || '' }))}
                refItems={referentielItems(categoriesRef.data)}
                onAdd={async (categorieId) => { await addProspectionCategorie(p.id, { categorieId }); categories.refetch(); }}
                onRemove={async (itemId) => { await removeProspectionCategorie(p.id, itemId); categories.refetch(); }}
              />

              <Card title="Autres tranches d'intérêt">
                <p className="mb-3 text-[12.5px] text-muted-foreground">
                  Pas de recherche par tranche disponible ici — saisissez les identifiants techniques.
                </p>
                <div className="mb-3 flex flex-col gap-2">
                  {(autresTranches.data ?? []).length === 0 && <span className="text-[12.5px] text-muted-foreground">Aucune.</span>}
                  {(autresTranches.data ?? []).map((t) => (
                    <div key={t.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-md border border-border px-3 py-2 text-[13px]">
                      <span className="font-medium text-foreground">{t.tranche || t.trancheId}</span>
                      <span className="text-muted-foreground">{t.article}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Retirer"
                        onClick={async () => {
                          await removeProspectionAutreTranche(p.id, t.id);
                          autresTranches.refetch();
                        }}
                      >
                        <X className="text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
                <AutreTrancheAddRow onAdd={async (trancheId, articleId) => { await addProspectionAutreTranche(p.id, { trancheId, articleId }); autresTranches.refetch(); }} />
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="devis">
            <Card title="Devis" action={<DevisAddButton onAdd={async (body) => { await creerDevis(p.id, body); devis.refetch(); }} />}>
              {devis.loading && <LoadingState />}
              {devis.error && <ErrorState message={devis.error} />}
              {devis.data && devis.data.content.length === 0 && <EmptyState title="Aucun devis" />}
              {devis.data && devis.data.content.length > 0 && (
                <div className="flex flex-col gap-2">
                  {devis.data.content.map((dv) => (
                    <div key={dv.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-md border border-border px-3 py-2 text-[13px]">
                      <span className="font-medium text-foreground">{dv.code}</span>
                      <span className="text-muted-foreground">{dv.tranche} {dv.article ? `· ${dv.article}` : ''}</span>
                      <span className="text-muted-foreground">{formatDate(dv.dateDocument)}</span>
                      <span className="font-medium tabular-nums text-foreground">{dv.prix ? formatCurrency(dv.prix) : '—'}</span>
                    </div>
                  ))}
                </div>
              )}
              {devis.data && (
                <Pagination page={devis.data.page} totalPages={devis.data.totalPages} totalElements={devis.data.totalElements} onPageChange={setDevisPage} />
              )}
            </Card>
          </TabsContent>

          <TabsContent value="historique">
            <Card title={`Actions (${interactions.data?.totalElements ?? 0})`}>
              {interactions.loading && <LoadingState />}
              {interactions.error && <ErrorState message={interactions.error} />}
              {interactions.data && interactions.data.content.length === 0 && (
                <p className="text-[13px] text-muted-foreground">Aucune action enregistrée pour cette prospection.</p>
              )}
              {interactions.data && interactions.data.content.length > 0 && (
                <div className="flex flex-col">
                  {interactions.data.content.map((c, i) => (
                    <div className="relative flex gap-3 pb-4.5 last:pb-0" key={c.id}>
                      <div className="flex shrink-0 flex-col items-center">
                        <div className="mt-1 size-2.5 shrink-0 rounded-full bg-primary" />
                        {i < interactions.data!.content.length - 1 && <div className="mt-1 w-0.5 flex-1 bg-border" />}
                      </div>
                      <div className="min-w-0 flex-1 pb-0.5">
                        <div className="flex flex-wrap items-center gap-1.5 text-[13px] font-semibold text-foreground">
                          <span className="inline-flex text-[var(--brand)]">{interactionIcon(c.entrante)}</span>
                          {c.actionType || (c.entrante ? 'Entrant' : 'Sortant')}
                          {c.resultat && <Badge tone={c.dateRdv ? 'success' : 'neutral'}>{c.resultat}</Badge>}
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">{formatDate(c.date)} · {c.employeNom || 'Système'}</div>
                        {c.description && <div className="mt-1 text-[12.5px] text-foreground">{c.description}</div>}
                        {(c.dateRdv || c.dateAlerte) && (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {c.dateRdv && <Badge tone="success">RDV le {formatDate(c.dateRdv)}</Badge>}
                            {c.dateAlerte && <Badge tone="warning">Alerte jusqu'au {formatDate(c.dateAlerte)}</Badge>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {interactions.data && (
                <Pagination
                  page={interactions.data.page}
                  totalPages={interactions.data.totalPages}
                  totalElements={interactions.data.totalElements}
                  onPageChange={setInteractionsPage}
                />
              )}
            </Card>
          </TabsContent>
        </Tabs>

        {p.trancheId && p.articleId && (
          <Card title="Article visé">
            <p className="text-[12.5px] text-muted-foreground">
              Lot ciblé — voir la{' '}
              <button type="button" onClick={() => navigate(`/tranches/${p.trancheId}`)} className="font-semibold text-primary hover:underline">
                tranche <ArrowUpRight className="inline size-2.5" />
              </button>.
            </p>
          </Card>
        )}
      </div>

      {showCreateProspect && (
        <CreateProspectForm
          preProspectionId={p.id}
          initial={createProspectInitial}
          onClose={() => setShowCreateProspect(false)}
          onSubmit={() => {
            refetch();
            showToast('Prospection convertie — fiche prospect créée et liée.');
          }}
        />
      )}

      {showInteractionForm && (
        <InteractionForm
          onClose={() => setShowInteractionForm(false)}
          onSubmit={async (input) => {
            await addInteraction(p!.id, input);
            interactions.refetch();
            showToast('Action enregistrée.');
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-foreground px-4.5 py-3 text-[13px] font-medium text-background shadow-lg">
          {toast}
        </div>
      )}
    </PageShell>
  );
}

function AutreTrancheAddRow({ onAdd }: { onAdd: (trancheId?: string, articleId?: string) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [trancheId, setTrancheId] = useState('');
  const [articleId, setArticleId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus data-icon="inline-start" /> Ajouter une tranche
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-end gap-2">
        <Input placeholder="UUID tranche (requis)" className="w-[200px]" value={trancheId} onChange={(e) => setTrancheId(e.target.value)} />
        <Input placeholder="UUID article (optionnel)" className="w-[200px]" value={articleId} onChange={(e) => setArticleId(e.target.value)} />
        <Button
          type="button"
          size="sm"
          disabled={busy || !trancheId.trim()}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await onAdd(trancheId.trim(), articleId.trim() || undefined);
              setOpen(false);
              setTrancheId('');
              setArticleId('');
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Échec de l\'ajout.');
            } finally {
              setBusy(false);
            }
          }}
        >
          Ajouter
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
      </div>
      {error && <p className="text-[12px] text-destructive">{error}</p>}
    </div>
  );
}

function DevisAddButton({ onAdd }: { onAdd: (body: { trancheId?: string; articleId?: string; prix?: number; notes?: string }) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [trancheId, setTrancheId] = useState('');
  const [articleId, setArticleId] = useState('');
  const [prix, setPrix] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Plus data-icon="inline-start" /> Nouveau devis
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap items-end gap-2">
        <Input placeholder="UUID tranche (requis)" className="w-[170px]" value={trancheId} onChange={(e) => setTrancheId(e.target.value)} />
        <Input placeholder="UUID article" className="w-[160px]" value={articleId} onChange={(e) => setArticleId(e.target.value)} />
        <Input type="number" placeholder="Prix" className="w-[110px]" value={prix} onChange={(e) => setPrix(e.target.value)} />
        <Input placeholder="Notes" className="w-[160px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <Button
          type="button"
          size="sm"
          disabled={busy || !trancheId.trim()}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await onAdd({
                trancheId: trancheId.trim(),
                articleId: articleId.trim() || undefined,
                prix: prix ? Number(prix) : undefined,
                notes: notes.trim() || undefined,
              });
              setOpen(false);
              setTrancheId('');
              setArticleId('');
              setPrix('');
              setNotes('');
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Échec de la création.');
            } finally {
              setBusy(false);
            }
          }}
        >
          Créer
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
      </div>
      {error && <p className="text-[12px] text-destructive">{error}</p>}
    </div>
  );
}
