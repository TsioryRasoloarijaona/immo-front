import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ArrowUpRight, Calendar } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, Card, Chip, ErrorState, Field, FieldGrid, LoadingState } from '../../components/ui';
import CreateProspectForm from '../../components/CreateProspectForm';
import InteractionForm from '../../components/InteractionForm';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useConfirm } from '../../lib/confirmContext';
import { communicationIcon } from '../../lib/domain';
import { useStore } from '../../lib/storeContext';
import { useData } from '../../lib/useData';
import { cn } from '../../lib/utils';
import { formatCurrency, formatDate, isPastOrToday, todayISO } from '../../lib/format';
import {
  PIPELINE_STAGES,
  PIPELINE_STAGE_SHORT,
  isSideTrackNature,
  missingQualificationFields,
  natureBadgeTone,
  pipelineStageIndex,
  prospectionDisplayName,
} from '../../lib/domain';
import type { Person } from '../../types';

export default function ProspectionDetail() {
  const { id } = useParams();
  const {
    prospections,
    communications,
    commercials,
    loading,
    error,
    isQualifiedProspection,
    assignCommercial,
    setProspectContact,
    qualifyProspection,
    addInteraction,
  } = useStore();
  const { data } = useData();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);
  const [showCreateProspect, setShowCreateProspect] = useState(false);
  const [showInteractionForm, setShowInteractionForm] = useState(false);

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
  const name = prospectionDisplayName(p);
  const overdue = !p.isClosed && p.alertValidityDate && isPastOrToday(p.alertValidityDate);
  const stageIdx = pipelineStageIndex(p.nature);
  const showStepper = !p.isClosed && !isSideTrackNature(p.nature) && stageIdx >= 0;
  const isPre = !isQualifiedProspection(p.id);
  const missing = missingQualificationFields(p);
  const actionTypes = data.lookups.actionMessageTypes;
  const currentUser = p.commercial || 'Vous (démo)';
  const commercialItems = [{ label: '— Non assigné —', value: null as string | null }, ...commercials.map((c) => ({ label: c, value: c }))];

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

      <div className="mb-5.5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[21px] font-semibold tracking-tight text-foreground">{name}</h1>
            {isPre && <Badge tone="amber">Pré-prospection · Non qualifiée</Badge>}
            <Badge tone={natureBadgeTone(p.nature, p.isClosed)}>{p.isClosed ? 'Clôturée' : p.nature}</Badge>
            {p.isOldCustomer && <Badge tone="info">Ancien client</Badge>}
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
            <Button onClick={() => navigate(`/prospections/${p.id}/nouveau-dossier`)} disabled={p.isClosed}>
              Créer / ouvrir dossier
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {showStepper && (
          <Card>
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

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
          <div className="flex flex-col gap-4">
            <Card title="Contact">
              {p.prospect ? (
                <FieldGrid>
                  <Field label="Nom" value={p.prospect.name} />
                  <Field label="Téléphone" value={p.prospect.phone} />
                  <Field label="Mobile" value={p.prospect.mobile} />
                  <Field label="Email" value={p.prospect.email} />
                  <Field label="Ville" value={p.prospect.city} />
                  <Field label="Adresse" value={p.prospect.address} />
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

            <Card title="Budget & superficie recherchés">
              <FieldGrid>
                <Field label="Budget min" value={p.budgetMin ? formatCurrency(p.budgetMin) : undefined} />
                <Field label="Budget max" value={p.budgetMax ? formatCurrency(p.budgetMax) : undefined} />
                <Field label="Superficie min" value={p.areaMin ? `${p.areaMin} m²` : undefined} />
                <Field label="Superficie max" value={p.areaMax ? `${p.areaMax} m²` : undefined} />
                <Field label="Apport personnel" value={p.fundingOwnBase ? formatCurrency(p.fundingOwnBase) : undefined} />
                <Field label="Financement crédit" value={p.fundingCredit ? formatCurrency(p.fundingCredit) : undefined} />
                <Field label="Autre financement" value={p.fundingOther ? formatCurrency(p.fundingOther) : undefined} />
              </FieldGrid>
              {(!p.budgetMax && !p.budgetMin) && p.notes && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Budget non structuré pour cette fiche — voir les notes ci-dessous.
                </p>
              )}
            </Card>

            {p.notes && (
              <Card title="Notes">
                <div className="whitespace-pre-wrap rounded-md border border-border bg-background p-3 text-[13px] leading-relaxed text-foreground">
                  {p.notes}
                </div>
              </Card>
            )}

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

            <Card title="Origine & canal marketing">
              <FieldGrid>
                <Field label="Origine" value={p.origin} />
                <Field label="Support / campagne" value={p.support} />
                <Field label="Commercial" value={p.commercial} />
              </FieldGrid>
            </Card>

            <div className="flex flex-wrap gap-x-3.5 gap-y-1 px-1 text-[11.5px] text-muted-foreground">
              <span>Enregistrée par {p.createdBy || '—'} le {formatDate(p.createdAt)}</span>
              <span>Modifiée par {p.updatedBy || '—'} le {formatDate(p.updatedAt)}</span>
            </div>
          </div>

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
                          <Link to={`/dossiers/${c.folderId}`} className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                            Voir le dossier lié <ArrowUpRight className="size-2.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {showCreateProspect && (
        <CreateProspectForm onClose={() => setShowCreateProspect(false)} onSubmit={handleCreateProspect} />
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
