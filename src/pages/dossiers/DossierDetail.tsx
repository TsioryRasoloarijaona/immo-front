import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Calendar, Check, Eye, Receipt, Upload, X } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, Card, Chip, ErrorState, Field, FieldGrid, LoadingState, TogglePill } from '../../components/ui';
import InteractionForm from '../../components/InteractionForm';
import DossierStatusStepper from '../../components/DossierStatusStepper';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { useStore } from '../../lib/storeContext';
import { useData } from '../../lib/useData';
import { cn } from '../../lib/utils';
import { formatCurrency, formatDate, formatPercent, isPastOrToday, todayISO } from '../../lib/format';
import { communicationIcon, resolveArticleTitleNumber, articleTypology } from '../../lib/domain';
import { categoryTotals, financingCategoryLabel, lineRemaining, lineSettled, netAPayer } from '../../lib/financing';
import type { Dossier } from '../../types';

// The full legal/administrative timeline Omran tracks per dossier — shown as
// present (with date) or pending (greyed) rather than filtered down to only
// reached milestones, so the page reflects everything the real system tracks.
// finalTitleDate/finalTitleNumber are shown separately under "Légal", not here.
const MILESTONES: { key: keyof Dossier; label: string }[] = [
  { key: 'reservationDate', label: 'Réservation' },
  { key: 'advanceDate', label: 'Avance versée' },
  { key: 'contractPrintDate', label: 'Impression du contrat' },
  { key: 'agreementDatePrevisionel', label: 'Concrétisation prévisionnelle' },
  { key: 'agreementDate', label: 'Concrétisation' },
  { key: 'agreementSavingDate', label: 'Compromis' },
  { key: 'insuranceDate', label: 'Assurance' },
  { key: 'creditApprovalDate', label: 'Crédit en cours' },
  { key: 'bankRecordDate', label: 'Dossier bancaire' },
  { key: 'creditPossessionDate', label: 'Crédit débloqué' },
  { key: 'precisionActDate', label: 'Envoi au notaire' },
  { key: 'ownershipCertificateDate', label: 'Certificat de propriété' },
  { key: 'interventionDate', label: 'Intervention technique' },
  { key: 'receptionDate', label: 'Réception' },
  { key: 'deliveryDateReal', label: 'Remise des clés' },
];

// Pièces & documents du dossier — Omran's export has no dedicated document/
// attachment table (no file storage, no PDF generation in this prototype —
// out of scope per CLAUDE.md), so "fourni" here means the real underlying
// field it stands for is populated, not that a file was uploaded. Each item
// maps to an actual field already in the data model (several overlap with
// MILESTONES above — expected: a document checklist and a progress timeline
// are two legitimate views over the same underlying dates).
const DOCUMENTS: { label: string; present: (d: Dossier) => boolean; date: (d: Dossier) => string | null }[] = [
  { label: 'CIN du client', present: (d) => Boolean(d.client?.idNumber), date: (d) => d.client?.idDate ?? null },
  { label: 'Dossier de réservation', present: (d) => Boolean(d.reservationDate), date: (d) => d.reservationDate },
  { label: "Proposition d'offre", present: (d) => Boolean(d.agreementDatePrevisionel), date: (d) => d.agreementDatePrevisionel },
  { label: 'Compromis de vente', present: (d) => Boolean(d.agreementSavingDate), date: (d) => d.agreementSavingDate },
  { label: 'Contrat imprimé', present: (d) => Boolean(d.contractPrintDate), date: (d) => d.contractPrintDate },
  { label: "Attestation d'assurance", present: (d) => Boolean(d.insuranceDate), date: (d) => d.insuranceDate },
  { label: 'Dossier bancaire', present: (d) => Boolean(d.bankRecordDate), date: (d) => d.bankRecordDate },
  { label: 'Certificat de propriété', present: (d) => Boolean(d.ownershipCertificateDate), date: (d) => d.ownershipCertificateDate },
  { label: 'Titre foncier définitif', present: (d) => Boolean(d.finalTitleDate || d.finalTitleNumber), date: (d) => d.finalTitleDate },
];

function TimelineList({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col">{children}</div>;
}

function TimelineItem({
  done,
  system,
  last,
  title,
  meta,
}: {
  done: boolean;
  system?: boolean;
  last: boolean;
  title: React.ReactNode;
  meta: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn('relative flex gap-3 pb-4.5 last:pb-0', system && 'opacity-70')}>
      <div className="flex shrink-0 flex-col items-center">
        <div className={cn('mt-1 shrink-0 rounded-full', system ? 'size-1.5' : 'size-2.5', done ? 'bg-primary' : 'bg-border')} />
        {!last && <div className="mt-1 w-0.5 flex-1 bg-border" />}
      </div>
      <div className="min-w-0 flex-1 pb-0.5">
        <div className={cn('font-semibold text-foreground', system ? 'text-xs font-medium text-muted-foreground' : done ? 'text-[13px]' : 'text-[13px] font-medium text-muted-foreground')}>
          {title}
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">{meta}</div>
      </div>
    </div>
  );
}

export default function DossierDetail() {
  const { id } = useParams();
  const {
    dossiers,
    prospections,
    communications,
    commercials,
    loading,
    error,
    getDossierStatus,
    assignCommercial,
    setDossierStatus,
    updateDossierField,
    addInteraction,
  } = useStore();
  const { data } = useData();
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [showAllMilestones, setShowAllMilestones] = useState(false);
  // Uploaded files, session-only (never persisted, matches the rest of this
  // prototype's mock-state approach — see lib/store.tsx). Keyed by document
  // label since DOCUMENTS has no id and is per-page, not per-record.
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, { fileName: string; url: string; uploadedAt: string }>>({});
  const uploadTargetRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function triggerUpload(label: string) {
    uploadTargetRef.current = label;
    fileInputRef.current?.click();
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const label = uploadTargetRef.current;
    e.target.value = ''; // allow re-selecting the same file later
    if (!file || !label) return;
    setUploadedDocs((prev) => {
      const existing = prev[label];
      if (existing) URL.revokeObjectURL(existing.url);
      return { ...prev, [label]: { fileName: file.name, url: URL.createObjectURL(file), uploadedAt: todayISO() } };
    });
  }

  function removeUpload(label: string) {
    setUploadedDocs((prev) => {
      const existing = prev[label];
      if (!existing) return prev;
      URL.revokeObjectURL(existing.url);
      const next = { ...prev };
      delete next[label];
      return next;
    });
  }

  const dossier = useMemo(() => dossiers.find((d) => d.id === id), [dossiers, id]);

  const dossierComms = useMemo(
    () =>
      communications
        .filter((c) => c.folderId === id)
        .sort((a, b) => ((a.date ?? '') < (b.date ?? '') ? 1 : -1)),
    [communications, id],
  );

  const upcomingRdv = useMemo(() => {
    const today = todayISO();
    const list = dossierComms.filter((c) => c.appointmentDate && c.appointmentDate >= today);
    if (list.length === 0) return null;
    return [...list].sort((a, b) => (a.appointmentDate! < b.appointmentDate! ? -1 : 1))[0];
  }, [dossierComms]);

  const prospection = useMemo(
    () => (dossier?.prospectionId ? prospections.find((p) => p.id === dossier.prospectionId) : undefined),
    [prospections, dossier],
  );

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3600);
  }

  if (loading) return <PageShell title="Dossier de vente"><LoadingState /></PageShell>;
  if (error) return <PageShell title="Dossier de vente"><ErrorState message={error} /></PageShell>;
  if (!data) return null;
  if (!dossier) {
    return (
      <PageShell title="Dossier introuvable" crumbs={[{ label: 'Dossiers', to: '/dossiers' }]}>
        <p>Ce dossier n'existe pas dans l'échantillon.</p>
      </PageShell>
    );
  }

  const d = dossier;
  const status = getDossierStatus(d.id);
  const hasLegalTitle = Boolean(d.finalTitleDate || d.finalTitleNumber);
  const isCancelled = Boolean(d.cancelDate || d.cancelDescription);
  const currentUser = d.commercial || 'Vous (démo)';
  const commercialItems = [{ label: '— Non assigné —', value: null as string | null }, ...commercials.map((c) => ({ label: c, value: c }))];

  const revivals = [
    { label: 'Première relance titre foncier', value: d.revival1, validity: d.revival1ValidityDate },
    { label: 'Deuxième relance titre foncier', value: d.revival2, validity: d.revival2ValidityDate },
  ];

  // Jalons clés: 15 real milestones, most "En attente" for any given dossier
  // — showing all of them at once makes the card mostly grey noise. Collapse
  // to what's reached plus the next one up by default; the rest stay one
  // click away rather than disappearing, since the point of this list is to
  // reflect everything the real system tracks (see MILESTONES comment above).
  const lastReachedIdx = MILESTONES.reduce((acc, m, i) => (d[m.key] ? i : acc), -1);
  const collapsedCount = Math.min(MILESTONES.length, Math.max(lastReachedIdx + 2, 1));
  const visibleMilestones = showAllMilestones ? MILESTONES : MILESTONES.slice(0, collapsedCount);
  const hiddenMilestonesCount = MILESTONES.length - visibleMilestones.length;

  return (
    <PageShell
      title={d.client?.name ?? d.code}
      crumbs={[{ label: 'Dossiers', to: '/dossiers' }, { label: d.code }]}
    >
      <Button variant="outline" size="sm" className="mb-4" onClick={() => navigate('/dossiers')}>
        <ArrowLeft data-icon="inline-start" /> Retour à la liste
      </Button>

      <div className="mb-5.5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[21px] font-semibold tracking-tight text-foreground">{d.client?.name ?? d.code}</h1>
            <Badge tone={status.tone}>{status.label}</Badge>
            {d.isOldCustomer && <Badge tone="info">Ancien client</Badge>}
            {upcomingRdv && (
              <Chip>
                <Calendar />
                Prochain RDV : {formatDate(upcomingRdv.appointmentDate)}{upcomingRdv.appointmentLabel ? ` — ${upcomingRdv.appointmentLabel}` : ''}
              </Chip>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px] text-muted-foreground">
            Dossier {d.code} · Créé le {formatDate(d.date)} · Commercial :
            <Select
              items={commercialItems}
              value={d.commercial || null}
              onValueChange={(v) => assignCommercial('dossier', d.id, (v as string | null) ?? '')}
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
          <div className="min-w-[150px] rounded-xl border border-border bg-card px-4 py-2.5 shadow-sm">
            <div className="text-[12.5px] font-medium text-muted-foreground">Prix</div>
            <div className="text-[19px] font-semibold tracking-tight text-foreground">{formatCurrency(d.price)}</div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowInteractionForm(true)}>
            Ajouter un appel / une visite
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <DossierStatusStepper
          currentStatus={status.label}
          onConfirm={(newStatus, note) => {
            setDossierStatus(d.id, newStatus, note || undefined);
            showToast(`Statut changé : ${newStatus}.`);
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="flex flex-col gap-4">
          <Card title="Client">
            {d.client ? (
              <FieldGrid>
                <Field label="Nom" value={d.client.name} />
                <Field label="Téléphone" value={d.client.phone} />
                <Field label="Mobile" value={d.client.mobile} />
                <Field label="Email" value={d.client.email} />
                <Field label="Ville" value={d.client.city} />
                <Field label="Adresse" value={d.client.address} />
                <Field label="Pièce d'identité" value={d.client.idNumber} />
                <Field label="Profession" value={d.client.profession} />
              </FieldGrid>
            ) : (
              <p className="text-[13px] text-muted-foreground">Aucun client résolu pour ce dossier.</p>
            )}
            {prospection && (
              <div className="mt-3.5 border-t border-border pt-3.5">
                <Link to={`/prospections/${prospection.id}`} className="text-[12.5px] font-semibold text-primary hover:underline">
                  Voir la prospection d'origine →
                </Link>
              </div>
            )}
          </Card>

          <Card title="Article réservé">
            {d.article ? (
              <FieldGrid>
                <Field label="Code" value={d.article.code} />
                <Field label="Description" value={d.article.description} />
                <Field label="Type" value={d.article.type} />
                <Field label="Catégorie" value={d.article.category} />
                <Field label="Typologie" value={articleTypology(d.article)} />
                <Field label="Titre foncier" value={resolveArticleTitleNumber(d.article, data.articles)} />
                <Field label="Superficie" value={`${d.area || d.article.area} m²`} />
                <Field label="Superficie globale" value={d.globalArea ? `${d.globalArea} m²` : undefined} />
              </FieldGrid>
            ) : (
              <p className="text-[13px] text-muted-foreground">Aucun article lié.</p>
            )}
          </Card>

          <Card title="Détail du prix">
            <FieldGrid>
              <Field label="Coût unitaire (au m²)" value={d.unitCost ? formatCurrency(d.unitCost) : undefined} />
              <Field label="Prix bien principal" value={d.itemPrice ? formatCurrency(d.itemPrice) : undefined} />
              <Field label="Prix biens annexes" value={d.underItemsPrice ? formatCurrency(d.underItemsPrice) : undefined} />
              <Field label="Prix avant remise" value={formatCurrency(d.priceBeforeDiscount)} />
              <Field label="Remise" value={`${formatPercent(d.discount, 2)} (${formatCurrency(d.discountAmount)})`} />
              <Field label="Prix après remise" value={formatCurrency(d.priceAfterDiscount)} />
              <Field label="Prix retenu" value={formatCurrency(d.price)} />
              <Field label="TVA" value={formatPercent(d.vatRatio)} />
              <Field label="Prix HT" value={formatCurrency(d.priceHT)} />
              <Field label="Total à payer" value={formatCurrency(d.totalToPay)} />
              <Field label="Taux de commission" value={d.commissionRate ? formatPercent(d.commissionRate) : undefined} />
            </FieldGrid>
          </Card>

          <Card title="Montants">
            <FieldGrid>
              <Field label="Prix contractuel" value={d.contractualPrice != null ? formatCurrency(d.contractualPrice) : undefined} />
              <div className="min-w-0">
                <div className="mb-0.5 text-[11.5px] font-medium text-muted-foreground">Mode de paiement</div>
                {/* No confirmed référentiel for this select's values yet — free
                    text until a real dropdown capture is available. See
                    instructions/FIX-dossier-vente-corrections.md §1. */}
                <Input
                  className="h-7 text-[13.5px]"
                  value={d.paymentMethod}
                  onChange={(e) => updateDossierField(d.id, 'paymentMethod', e.target.value)}
                />
              </div>
            </FieldGrid>

            {d.echeancier && d.echeancier.length > 0 ? (
              <div className="mt-4 overflow-x-auto border-t border-border pt-4">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Catégorie</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="text-right">Réglé</TableHead>
                      <TableHead className="text-right">Reste</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryTotals(d.echeancier).map((row) => (
                      <TableRow key={row.code} className="hover:bg-transparent">
                        <TableCell className="font-medium text-foreground">{row.label}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(row.montant)}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">{formatCurrency(row.regle)}</TableCell>
                        <TableCell className={cn('text-right tabular-nums font-medium', row.reste > 0 ? 'text-foreground' : 'text-[var(--success)]')}>
                          {formatCurrency(row.reste)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="hover:bg-transparent">
                      <TableCell className="font-semibold text-foreground">Net à payer</TableCell>
                      <TableCell />
                      <TableCell />
                      <TableCell className="text-right text-[14px] font-semibold tabular-nums text-foreground">
                        {formatCurrency(netAPayer(d.echeancier))}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="mt-4 border-t border-border pt-4 text-[13px] text-muted-foreground">Aucune ligne d'échéancier pour ce dossier.</p>
            )}

            <div className="mt-4 border-t border-border pt-4">
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <div className="text-[11.5px] font-medium text-muted-foreground">Probabilité de finalisation</div>
                <div className="flex items-center gap-2.5">
                  <span className="text-[13px] font-semibold text-foreground">{formatPercent(d.probabilityOfFinalisation)}</span>
                  <Button type="button" size="sm" variant="outline" disabled title="Facturation hors scope Vente/Patrimoine pour ce prototype">
                    <Receipt data-icon="inline-start" /> Facturer la vente
                  </Button>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--neutral-bg)]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(0, Math.min(1, d.probabilityOfFinalisation)) * 100}%`,
                    background: d.probabilityOfFinalisation < 0.34 ? 'var(--warning)' : d.probabilityOfFinalisation < 0.67 ? 'var(--amber)' : 'var(--brand)',
                  }}
                />
              </div>
            </div>
          </Card>

          {d.echeancier && d.echeancier.length > 0 && (
            <Card title="Échéancier">
              <p className="mb-3 text-xs text-muted-foreground">
                Lignes de financement avec suivi de règlement — alimente le panneau Montants ci-dessus.
              </p>
              <div className="flex flex-col gap-2">
                {d.echeancier.map((l) => (
                  <div key={l.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-md border border-border px-3 py-2 text-[13px]">
                    <span className="font-medium text-foreground">{financingCategoryLabel(l.categorie)}</span>
                    <span className="text-muted-foreground">{formatDate(l.date)}</span>
                    {l.invoiceRef && <span className="text-muted-foreground">Facture {l.invoiceRef}</span>}
                    <span className="text-muted-foreground">Réglé {formatCurrency(lineSettled(l))} · Reste {formatCurrency(lineRemaining(l))}</span>
                    <span className="font-medium tabular-nums text-foreground">{formatCurrency(l.montant)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {d.additionalLots && d.additionalLots.length > 0 && (
            <Card title="Lots additionnels">
              <div className="flex flex-col gap-2">
                {d.additionalLots.map((l) => (
                  <div key={l.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-md border border-border px-3 py-2 text-[13px]">
                    <span className="font-medium text-foreground">{l.code}</span>
                    <span className="text-muted-foreground">{l.description}</span>
                    <span className="font-medium tabular-nums text-foreground">{formatCurrency(l.salePrice)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card title="Relances titre foncier">
            <div className="flex flex-col gap-3">
              {revivals.map((r) => {
                const overdue = r.validity && isPastOrToday(r.validity) && !r.value;
                const done = Boolean(r.value);
                return (
                  <div
                    key={r.label}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border px-3 py-2.5',
                      overdue ? 'border-[var(--warning-border)] bg-[var(--warning-bg)]' : 'border-border bg-background'
                    )}
                  >
                    <div
                      className={cn(
                        'flex size-[22px] shrink-0 items-center justify-center rounded-full border-2 text-[10.5px] font-bold',
                        done
                          ? 'border-primary bg-primary text-primary-foreground'
                          : overdue
                            ? 'border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning)]'
                            : 'border-border bg-[var(--neutral-bg)] text-muted-foreground'
                      )}
                    >
                      {done ? <Check className="size-3" /> : overdue ? <AlertTriangle className="size-[11px]" /> : ''}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-foreground">{r.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {done ? `Effectuée le ${formatDate(r.value)}` : r.validity ? `Échéance ${formatDate(r.validity)}${overdue ? ' — en retard' : ''}` : 'Non planifiée'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {d.notes && (
            <Card title="Notes">
              <div className="whitespace-pre-wrap rounded-md border border-border bg-background p-3 text-[13px] leading-relaxed text-foreground">
                {d.notes}
              </div>
            </Card>
          )}

          {hasLegalTitle && (
            <Card title="Légal — titre foncier définitif">
              <FieldGrid>
                <Field label="Numéro de titre foncier" value={d.finalTitleNumber} />
                <Field label="Date de formalisation" value={formatDate(d.finalTitleDate)} />
              </FieldGrid>
            </Card>
          )}

          {isCancelled && (
            <Card title="Annulation">
              <FieldGrid>
                <Field label="Date d'annulation" value={formatDate(d.cancelDate)} />
              </FieldGrid>
              {d.cancelDescription && (
                <div className="mt-3 whitespace-pre-wrap rounded-md border border-border bg-background p-3 text-[13px] leading-relaxed text-foreground">
                  {d.cancelDescription}
                </div>
              )}
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Card title="Jalons clés">
            <TimelineList>
              {visibleMilestones.map((m, i) => {
                const value = d[m.key] as string | null;
                const done = Boolean(value);
                return (
                  <TimelineItem
                    key={m.key}
                    done={done}
                    last={i === visibleMilestones.length - 1 && hiddenMilestonesCount === 0}
                    title={m.label}
                    meta={done ? formatDate(value) : 'En attente'}
                  />
                );
              })}
            </TimelineList>
            {MILESTONES.length > collapsedCount && (
              <button
                type="button"
                onClick={() => setShowAllMilestones((v) => !v)}
                className="mt-2 text-[12px] font-semibold text-primary hover:underline"
              >
                {showAllMilestones ? 'Réduire' : `+ ${hiddenMilestonesCount} autre${hiddenMilestonesCount > 1 ? 's' : ''} jalon${hiddenMilestonesCount > 1 ? 's' : ''}`}
              </button>
            )}
          </Card>

          <Card
            title={`Pièces & documents (${DOCUMENTS.filter((doc) => doc.present(d) || uploadedDocs[doc.label]).length}/${DOCUMENTS.length})`}
          >
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelected} />
            <p className="mb-3 text-xs text-muted-foreground">
              « Fourni » sans fichier joint reflète une donnée déjà présente dans le dossier — utilisez « Joindre »
              pour y attacher le scan correspondant. Les fichiers joints ici restent en mémoire de session (non
              persistés, comme le reste de ce prototype).
            </p>
            <div className="flex flex-col gap-2">
              {DOCUMENTS.map((doc) => {
                const uploaded = uploadedDocs[doc.label];
                const dataPresent = doc.present(d);
                const present = dataPresent || Boolean(uploaded);
                const date = doc.date(d);
                return (
                  <div
                    key={doc.label}
                    className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 rounded-md border border-border px-3 py-2 text-[13px]"
                  >
                    <div className="min-w-0">
                      <span className={cn('font-medium', present ? 'text-foreground' : 'text-muted-foreground')}>{doc.label}</span>
                      {uploaded ? (
                        <div className="truncate text-xs text-muted-foreground">{uploaded.fileName} · {formatDate(uploaded.uploadedAt)}</div>
                      ) : (
                        dataPresent && date && <div className="text-xs text-muted-foreground">{formatDate(date)}</div>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge tone={present ? 'success' : 'neutral'}>{present ? 'Fourni' : 'Manquant'}</Badge>
                      {uploaded ? (
                        <>
                          <Button type="button" variant="outline" size="sm" onClick={() => window.open(uploaded.url, '_blank', 'noopener')}>
                            <Eye data-icon="inline-start" /> Voir
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => removeUpload(doc.label)}
                            aria-label={`Retirer le fichier joint pour ${doc.label}`}
                            title="Retirer le fichier joint"
                          >
                            <X className="text-destructive" />
                          </Button>
                        </>
                      ) : (
                        <Button type="button" variant="outline" size="sm" onClick={() => triggerUpload(doc.label)}>
                          <Upload data-icon="inline-start" /> Joindre
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title={`Communications (${dossierComms.length})`}>
            {dossierComms.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">Aucune interaction enregistrée pour ce dossier.</p>
            ) : (
              <TimelineList>
                {dossierComms.map((c, i) => {
                  const alertOverdue = c.alertDate && isPastOrToday(c.alertDate);
                  return (
                    <TimelineItem
                      key={c.id}
                      done
                      system={c.isSystem}
                      last={i === dossierComms.length - 1}
                      title={
                        <span className="flex items-center gap-1.5">
                          {!c.isSystem && <span className="inline-flex text-[var(--brand)]">{communicationIcon(c.actionType)}</span>}
                          {c.actionType}
                        </span>
                      }
                      meta={
                        <>
                          {formatDate(c.date)} · {c.user || 'Système'}
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
                        </>
                      }
                    />
                  );
                })}
              </TimelineList>
            )}
          </Card>

          <Card title="Suivi administratif">
            <div className="mb-4 flex flex-wrap gap-2">
              <TogglePill on={d.isAccounted} onLabel="Comptabilisé" offLabel="Non comptabilisé" />
              <TogglePill on={d.isOldCustomer} onLabel="Ancien client" offLabel="Nouveau client" />
              <TogglePill on={d.isPenaltyDisabled} onLabel="Pénalité désactivée" offLabel="Pénalité active" />
              <TogglePill on={d.isConfirmedAgreementDate} onLabel="Date confirmée" offLabel="Date non confirmée" />
            </div>
            <FieldGrid>
              <Field label="Enregistré par" value={d.createdBy} />
              <Field label="Enregistré le" value={formatDate(d.createdAt)} />
              <Field label="Modifié par" value={d.updatedBy} />
              <Field label="Modifié le" value={formatDate(d.updatedAt)} />
            </FieldGrid>
          </Card>
        </div>
      </div>

      {showInteractionForm && (
        <InteractionForm
          actionTypes={data.lookups.actionMessageTypes}
          onClose={() => setShowInteractionForm(false)}
          onSubmit={(input) => {
            addInteraction({ folderId: d.id }, input, currentUser);
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
