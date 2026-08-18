import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ArrowUpRight, Calendar } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, Card, Chip, ErrorState, Field, FieldGrid, LoadingState } from '../../components/ui';
import CreateProspectForm, { type CreateProspectInitial } from '../../components/CreateProspectForm';
import InteractionForm from '../../components/InteractionForm';
import { Button } from '../../components/ui/button';
import { Field as FormField, FieldLabel } from '../../components/ui/field';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useConfirm } from '../../lib/confirmContext';
import { usePreview } from '../../lib/previewContext';
import { communicationIcon } from '../../lib/domain';
import { useStore } from '../../lib/storeContext';
import { useData } from '../../lib/useData';
import { cn } from '../../lib/utils';
import { formatCurrency, formatDate, isPastOrToday, todayISO } from '../../lib/format';
import {
  PIPELINE_STAGES,
  PIPELINE_STAGE_SHORT,
  isQualificationDataComplete,
  isSideTrackNature,
  missingQualificationFields,
  natureBadgeTone,
  pipelineStageIndex,
  prospectionDisplayName,
} from '../../lib/domain';
import type { Person } from '../../types';

// The 3 detail tabs below the always-visible header/pipeline/alert block.
type ProspectionTab = 'apercu' | 'qualification' | 'historique';

export default function ProspectionDetail() {
  const { id } = useParams();
  const {
    prospections,
    dossiers,
    communications,
    commercials,
    loading,
    error,
    isQualifiedProspection,
    getDossierStatus,
    assignCommercial,
    setProspectContact,
    qualifyProspection,
    setProspectionNature,
    updateProspectionField,
    addInteraction,
  } = useStore();
  const { data } = useData();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);
  const [showCreateProspect, setShowCreateProspect] = useState(false);
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const { previewDossier } = usePreview();
  const [tab, setTab] = useState<ProspectionTab>('apercu');

  const prospection = useMemo(() => prospections.find((p) => p.id === id), [prospections, id]);

  const prospectionComms = useMemo(
    () =>
      communications
        .filter((c) => c.prospectionId === id)
        .sort((a, b) => ((a.date ?? '') < (b.date ?? '') ? 1 : -1)),
    [communications, id],
  );

  const upcomingRdv = useMemo(() => {
    const today = todayISO();
    const list = prospectionComms.filter((c) => c.appointmentDate && c.appointmentDate >= today);
    if (list.length === 0) return null;
    return [...list].sort((a, b) => (a.appointmentDate! < b.appointmentDate! ? -1 : 1))[0];
  }, [prospectionComms]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3600);
  }

  if (loading) return <PageShell title="Prospection"><LoadingState /></PageShell>;
  if (error) return <PageShell title="Prospection"><ErrorState message={error} /></PageShell>;
  if (!data) return null;
  if (!prospection) {
    return (
      <PageShell title="Prospection introuvable" crumbs={[{ label: 'Prospections', to: '/prospections' }]}>
        <p>Cette prospection n'existe pas dans l'échantillon.</p>
      </PageShell>
    );
  }

  const p = prospection;
  const linkedDossier = dossiers.find((d) => d.prospectionId === p.id);
  const name = prospectionDisplayName(p);
  // Pré-remplissage de la modale "Créer prospect" depuis les champs déjà
  // saisis sur la pré-prospection (Description/Téléphone/Email) — voir
  // CreateProspectForm.
  const createProspectInitial: CreateProspectInitial = {
    firstName: p.displayName?.trim().split(' ')[0] ?? '',
    lastName: p.displayName?.trim().split(' ').slice(1).join(' ') ?? '',
    phone: p.phone ?? '',
    email: p.email ?? '',
  };
  const overdue = !p.isClosed && p.alertValidityDate && isPastOrToday(p.alertValidityDate);
  const stageIdx = pipelineStageIndex(p.nature);
  const showStepper = !p.isClosed && !isSideTrackNature(p.nature) && stageIdx >= 0;
  const isPre = !isQualifiedProspection(p.id);
  const missing = missingQualificationFields(p);
  const actionTypes = data.lookups.actionMessageTypes;
  const currentUser = p.commercial || 'Vous (démo)';
  const commercialItems = [{ label: '— Non assigné —', value: null as string | null }, ...commercials.map((c) => ({ label: c, value: c }))];
  // Ordre : les 5 étapes du pipeline d'abord (celles affichées par la jauge
  // ci-dessous), puis les 2 valeurs hors-piste éventuelles trouvées dans le
  // référentiel réel (lookups.prospectionKinds) — jamais codées en dur, pour
  // rester fidèle aux valeurs exactes exportées d'Omran (espaces compris).
  const natureItems = [
    ...PIPELINE_STAGES,
    ...data.lookups.prospectionKinds.filter((k) => !(PIPELINE_STAGES as readonly string[]).includes(k)),
  ].map((k) => ({ label: k, value: k }));
  const originItems = [
    { label: '— Non renseignée —', value: null as string | null },
    ...data.lookups.prospectionOrigins.map((o) => ({ label: o, value: o as string | null })),
  ];
  const qualificationComplete = isQualificationDataComplete(p);

  async function handleTransform() {
    const ok = await confirm('Vous devez enregistrer vos modifications avant cette opération. Voulez-vous continuer ?');
    if (!ok) return;
    qualifyProspection(p.id);
    showToast('Prospection qualifiée — elle apparaît maintenant dans l\'onglet "Prospections".');
  }

  function handleCreateProspect(person: Person) {
    setProspectContact(p.id, person);
    showToast('Fiche prospect créée et liée à cette prospection.');
  }

  return (
    <PageShell
      title={name}
      crumbs={[{ label: 'Prospections', to: '/prospections' }, { label: p.code || name }]}
    >
      <Button variant="outline" size="sm" className="mb-4" onClick={() => navigate('/prospections')}>
        <ArrowLeft data-icon="inline-start" /> Retour à la liste
      </Button>

      {/* Always-visible summary — identity, pipeline stage and any pending
          follow-up/closing reason. Everything else lives in tabs below. */}
      <div className="mb-5.5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[21px] font-semibold tracking-tight text-foreground">{name}</h1>
            {isPre && <Badge tone="amber">Pré-prospection · Non qualifiée</Badge>}
            <Badge tone={natureBadgeTone(p.nature, p.isClosed)}>{p.isClosed ? 'Clôturée' : p.nature}</Badge>
            {p.isOldCustomer && <Badge tone="info">Ancien client</Badge>}
            {linkedDossier && <Badge tone="success">Dossier ouvert</Badge>}
            {upcomingRdv && (
              <Chip>
                <Calendar />
                Prochain RDV : {formatDate(upcomingRdv.appointmentDate)}{upcomingRdv.appointmentLabel ? ` — ${upcomingRdv.appointmentLabel}` : ''}
              </Chip>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px] text-muted-foreground">
            {p.code && <>Code {p.code} · </>}
            Créée le {formatDate(p.date)} · Commercial :
            <Select
              items={commercialItems}
              value={p.commercial || null}
              onValueChange={(v) => assignCommercial('prospection', p.id, (v as string | null) ?? '')}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {commercialItems.map((item) => (
                    <SelectItem key={item.value ?? '__none'} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2.5">
          <Button variant="outline" size="sm" onClick={() => setShowInteractionForm(true)}>
            Ajouter un appel / une visite
          </Button>
          {isPre ? (
            <>
              {!p.prospect && (
                <Button variant="outline" size="sm" onClick={() => setShowCreateProspect(true)}>
                  + Créer prospect
                </Button>
              )}
              <Button
                onClick={handleTransform}
                disabled={missing.length > 0}
                title={missing.length > 0 ? `Nécessite : ${missing.join(', ')}` : undefined}
              >
                Transformer en prospection
              </Button>
              {missing.length > 0 && (
                <p className="mt-0.5 max-w-[220px] text-right text-[11.5px] text-muted-foreground">
                  Nécessite {missing.join(' et ')} avant de pouvoir qualifier ce lead.
                </p>
              )}
            </>
          ) : (
            <Button
              onClick={() =>
                linkedDossier ? previewDossier(linkedDossier.id) : navigate(`/prospections/${p.id}/nouveau-dossier`)
              }
              disabled={p.isClosed}
            >
              Créer / ouvrir dossier
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {!p.isClosed && (
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

            {/* La jauge ci-dessus ne bouge jamais toute seule : c'est ce
                sélecteur "Nature" qui la pilote — exactement le champ
                déroulant "Nature :" éditable à tout moment sur la fiche
                Omran d'origine. Le commercial le change lui-même quand le
                lead progresse réellement (visite faite, offre envoyée…) ;
                il n'y a pas d'avancement automatique au-delà du passage
                1→2 déclenché une fois par "Transformer en prospection". */}
            <div className={cn('flex flex-wrap items-center gap-2.5', showStepper && 'mt-4 border-t border-border pt-4')}>
              <span className="text-[11.5px] font-medium text-muted-foreground">Nature (étape) :</span>
              <Select
                items={natureItems}
                value={p.nature}
                onValueChange={(v) => setProspectionNature(p.id, v as string)}
              >
                <SelectTrigger size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {natureItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <span className="text-[11.5px] text-muted-foreground">
                Changez-la vous-même à mesure que le lead avance — sauf le passage à « 3 QUALIFIÉ », déclenché
                automatiquement dès que l'onglet Qualification est rempli.
              </span>
            </div>
          </Card>
        )}

        {p.alertValidityDate && !p.isClosed && (
          <Card>
            <div className="flex items-center gap-3">
              <AlertTriangle className={cn('size-5 shrink-0', overdue ? 'text-[var(--warning)]' : 'text-[var(--brand)]')} />
              <div>
                <div className={cn('text-[13.5px] font-semibold', overdue ? 'text-[var(--warning)]' : 'text-foreground')}>
                  {overdue ? 'Relance en retard' : 'Relance planifiée'} — {formatDate(p.alertValidityDate)}
                </div>
                {p.alertMessage && <div className="mt-0.5 text-[13px] text-muted-foreground">{p.alertMessage}</div>}
              </div>
            </div>
          </Card>
        )}

        {p.isClosed && (
          <Card title="Motif de clôture">
            <FieldGrid>
              <Field label="Date de clôture" value={formatDate(p.closingDate)} />
              <Field label="Motif" value={p.closingReason} />
            </FieldGrid>
            {p.closingReasonText && (
              <div className="mt-3.5">
                <div className="mb-1.5 text-[11.5px] font-medium text-muted-foreground">Détail</div>
                <div className="whitespace-pre-wrap rounded-md border border-border bg-background p-3 text-[13px] leading-relaxed text-foreground">
                  {p.closingReasonText}
                </div>
              </div>
            )}
          </Card>
        )}

        <Tabs value={tab} onValueChange={(v) => setTab(v as ProspectionTab)} className="gap-4">
          <TabsList>
            <TabsTrigger value="apercu">Aperçu</TabsTrigger>
            <TabsTrigger value="qualification">Qualification</TabsTrigger>
            <TabsTrigger value="historique">
              Historique
              {prospectionComms.length > 0 && <Badge tone="neutral" className="ml-1.5">{prospectionComms.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="apercu">
            <div className="flex flex-col gap-4">
              {linkedDossier && (
                <Card title="Dossier de vente">
                  <FieldGrid>
                    <Field label="Code" value={linkedDossier.code} />
                    <Field label="Statut" value={getDossierStatus(linkedDossier.id).label} />
                    <Field label="Prix retenu" value={linkedDossier.price ? formatCurrency(linkedDossier.price) : undefined} />
                  </FieldGrid>
                  <div className="mt-3.5 border-t border-border pt-3.5">
                    <button
                      type="button"
                      onClick={() => previewDossier(linkedDossier.id)}
                      className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary hover:underline"
                    >
                      Voir le dossier de vente <ArrowUpRight className="size-2.5" />
                    </button>
                  </div>
                </Card>
              )}

              <Card title="Contact">
                {p.prospect ? (
                  <FieldGrid>
                    <Field label="Titre" value={p.prospect.title} />
                    <Field label="Sexe" value={p.prospect.gender} />
                    <Field label="Nom" value={p.prospect.name} />
                    <Field label="Téléphone" value={p.prospect.phone} />
                    <Field label="Mobile" value={p.prospect.mobile} />
                    <Field label="Email" value={p.prospect.email} />
                    <Field label="Ville" value={p.prospect.city} />
                    <Field label="Adresse" value={p.prospect.address} />
                    <Field label="Nationalité" value={p.prospect.nationality} />
                    <Field label="Pièce d'identité" value={p.prospect.idNumber} />
                    <Field label="Profession" value={p.prospect.profession} />
                    <Field label="Enfants" value={p.prospect.nbrChildren ? String(p.prospect.nbrChildren) : undefined} />
                  </FieldGrid>
                ) : (
                  <>
                    <FieldGrid>
                      <Field label="Nom" value={p.displayName} />
                      <Field label="Téléphone" value={p.phone} />
                      <Field label="Email" value={p.email} />
                    </FieldGrid>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Aucune fiche prospect liée — utilisez « Créer prospect » ci-dessus pour en lier une.
                    </p>
                  </>
                )}
              </Card>

              {p.article && (
                <Card title="Bien d'intérêt">
                  <FieldGrid>
                    <Field label="Code" value={p.article.code} />
                    <Field label="Description" value={p.article.description} />
                    <Field label="Type" value={p.article.type} />
                    <Field label="Catégorie" value={p.article.category} />
                    <Field label="Superficie" value={p.article.area ? `${p.article.area} m²` : undefined} />
                    <Field label="Prix de vente" value={p.article.salePrice ? formatCurrency(p.article.salePrice) : undefined} />
                  </FieldGrid>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="qualification">
            <div className="flex flex-col gap-4">
              <p className={cn('-mt-1 text-[12px]', qualificationComplete ? 'text-[var(--success)]' : 'text-muted-foreground')}>
                {qualificationComplete
                  ? 'Qualification complète — la jauge Nature (onglet ci-dessus) est passée à « 3 QUALIFIÉ » automatiquement.'
                  : 'Renseignez budget, superficie et origine ci-dessous : la jauge Nature passera automatiquement à « 3 QUALIFIÉ » dès que les trois seront réunis.'}
              </p>

              <Card title="Budget & superficie recherchés">
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                  <FormField>
                    <FieldLabel htmlFor="q-budgetMin">Budget min (DH)</FieldLabel>
                    <Input
                      id="q-budgetMin"
                      type="number"
                      min={0}
                      value={p.budgetMin || ''}
                      onChange={(e) => updateProspectionField(p.id, 'budgetMin', Number(e.target.value) || 0)}
                    />
                  </FormField>
                  <FormField>
                    <FieldLabel htmlFor="q-budgetMax">Budget max (DH)</FieldLabel>
                    <Input
                      id="q-budgetMax"
                      type="number"
                      min={0}
                      value={p.budgetMax || ''}
                      onChange={(e) => updateProspectionField(p.id, 'budgetMax', Number(e.target.value) || 0)}
                    />
                  </FormField>
                  <FormField>
                    <FieldLabel htmlFor="q-areaMin">Superficie min (m²)</FieldLabel>
                    <Input
                      id="q-areaMin"
                      type="number"
                      min={0}
                      value={p.areaMin || ''}
                      onChange={(e) => updateProspectionField(p.id, 'areaMin', Number(e.target.value) || 0)}
                    />
                  </FormField>
                  <FormField>
                    <FieldLabel htmlFor="q-areaMax">Superficie max (m²)</FieldLabel>
                    <Input
                      id="q-areaMax"
                      type="number"
                      min={0}
                      value={p.areaMax || ''}
                      onChange={(e) => updateProspectionField(p.id, 'areaMax', Number(e.target.value) || 0)}
                    />
                  </FormField>
                  <FormField>
                    <FieldLabel htmlFor="q-fundingOwnBase">Apport personnel (DH)</FieldLabel>
                    <Input
                      id="q-fundingOwnBase"
                      type="number"
                      min={0}
                      value={p.fundingOwnBase || ''}
                      onChange={(e) => updateProspectionField(p.id, 'fundingOwnBase', Number(e.target.value) || 0)}
                    />
                  </FormField>
                  <FormField>
                    <FieldLabel htmlFor="q-fundingCredit">Financement crédit (DH)</FieldLabel>
                    <Input
                      id="q-fundingCredit"
                      type="number"
                      min={0}
                      value={p.fundingCredit || ''}
                      onChange={(e) => updateProspectionField(p.id, 'fundingCredit', Number(e.target.value) || 0)}
                    />
                  </FormField>
                  <FormField>
                    <FieldLabel htmlFor="q-fundingOther">Autre financement (DH)</FieldLabel>
                    <Input
                      id="q-fundingOther"
                      type="number"
                      min={0}
                      value={p.fundingOther || ''}
                      onChange={(e) => updateProspectionField(p.id, 'fundingOther', Number(e.target.value) || 0)}
                    />
                  </FormField>
                </div>
                {(!p.budgetMax && !p.budgetMin) && p.notes && (
                  <p className="mt-3.5 text-xs text-muted-foreground">
                    Budget non structuré à l'origine pour cette fiche — voir les notes ci-dessous, ou saisissez-le ci-dessus.
                  </p>
                )}
              </Card>

              <Card title="Origine & canal marketing">
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <FormField>
                    <FieldLabel htmlFor="q-origin">Origine</FieldLabel>
                    <Select
                      items={originItems}
                      value={p.origin || null}
                      onValueChange={(v) => updateProspectionField(p.id, 'origin', (v as string | null) ?? '')}
                    >
                      <SelectTrigger id="q-origin">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {originItems.map((item) => (
                            <SelectItem key={item.value ?? '__none'} value={item.value}>{item.label}</SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField>
                    <FieldLabel htmlFor="q-support">Support / campagne</FieldLabel>
                    <Input
                      id="q-support"
                      value={p.support}
                      onChange={(e) => updateProspectionField(p.id, 'support', e.target.value)}
                    />
                  </FormField>
                </div>
                <p className="mt-3.5 text-xs text-muted-foreground">
                  Commercial assigné : {p.commercial || '— voir le sélecteur en en-tête —'}
                </p>
              </Card>

              {p.notes && (
                <Card title="Notes">
                  <div className="whitespace-pre-wrap rounded-md border border-border bg-background p-3 text-[13px] leading-relaxed text-foreground">
                    {p.notes}
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="historique">
            <div className="flex flex-col gap-4">
              <Card title={`Historique des communications (${prospectionComms.length})`}>
                {prospectionComms.length === 0 ? (
                  <p className="text-[13px] text-muted-foreground">Aucune interaction enregistrée pour cette prospection.</p>
                ) : (
                  <div className="flex flex-col">
                    {prospectionComms.map((c, i) => {
                      const alertOverdue = c.alertDate && isPastOrToday(c.alertDate) && !p.isClosed;
                      return (
                        <div className={cn('relative flex gap-3 pb-4.5 last:pb-0', c.isSystem && 'opacity-70')} key={c.id}>
                          <div className="flex shrink-0 flex-col items-center">
                            <div className={cn('mt-1 shrink-0 rounded-full bg-primary', c.isSystem ? 'size-1.5' : 'size-2.5')} />
                            {i < prospectionComms.length - 1 && <div className="mt-1 w-0.5 flex-1 bg-border" />}
                          </div>
                          <div className="min-w-0 flex-1 pb-0.5">
                            <div className={cn('flex items-center gap-1.5 font-semibold text-foreground', c.isSystem ? 'text-xs font-medium text-muted-foreground' : 'text-[13px]')}>
                              {!c.isSystem && <span className="inline-flex text-[var(--brand)]">{communicationIcon(c.actionType)}</span>}
                              {c.actionType}
                            </div>
                            <div className="mt-0.5 text-xs text-muted-foreground">{formatDate(c.date)} · {c.user || 'Système'}</div>
                            {c.report && <div className="mt-1 text-[12.5px] text-foreground">{c.report}</div>}
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {c.alertDate && (
                                <Chip warning={!!alertOverdue}>
                                  {alertOverdue && <AlertTriangle />}
                                  Relance prévue le {formatDate(c.alertDate)}
                                </Chip>
                              )}
                              {c.appointmentDate && (
                                <Chip>
                                  <Calendar />
                                  RDV {formatDate(c.appointmentDate)}{c.appointmentLabel ? ` — ${c.appointmentLabel}` : ''}
                                </Chip>
                              )}
                            </div>
                            {c.folderId && (
                              <button
                                type="button"
                                onClick={() => previewDossier(c.folderId!)}
                                className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                              >
                                Voir le dossier lié <ArrowUpRight className="size-2.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              <div className="flex flex-wrap gap-x-3.5 gap-y-1 px-1 text-[11.5px] text-muted-foreground">
                <span>Enregistrée par {p.createdBy || '—'} le {formatDate(p.createdAt)}</span>
                <span>Modifiée par {p.updatedBy || '—'} le {formatDate(p.updatedAt)}</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {showCreateProspect && (
        <CreateProspectForm
          initial={createProspectInitial}
          onClose={() => setShowCreateProspect(false)}
          onSubmit={handleCreateProspect}
        />
      )}


      {showInteractionForm && (
        <InteractionForm
          actionTypes={actionTypes}
          onClose={() => setShowInteractionForm(false)}
          onSubmit={(input) => {
            addInteraction({ prospectionId: p.id }, input, currentUser);
            showToast('Interaction enregistrée.');
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
