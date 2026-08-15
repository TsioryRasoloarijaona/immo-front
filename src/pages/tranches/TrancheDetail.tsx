import { useMemo, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Calendar, Coins, Gift, Scale } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Card, ErrorState, Field, FieldGrid, LoadingState, TogglePill } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { useData } from '../../lib/useData';
import { cn } from '../../lib/utils';
import { formatCurrency, formatDate, formatPercent } from '../../lib/format';
import { standingClass } from '../../lib/domain';
import type { Tranche, TrancheRules } from '../../types';

type FieldFmt = 'percent' | 'currency' | 'days' | 'hours' | 'months' | 'number' | 'text' | 'toggle';

interface RuleFieldDef {
  key: keyof TrancheRules;
  label: string;
  fmt: FieldFmt;
}

interface RuleSection {
  title: string;
  desc: string;
  icon: ReactNode;
  fields: RuleFieldDef[];
}

const SECTIONS: RuleSection[] = [
  {
    title: 'Seuils financiers',
    desc: 'Acomptes, plafonds de crédit et charges de copropriété configurés pour cette tranche.',
    icon: <Coins />,
    fields: [
      { key: 'advancePercent', label: "Taux d'avance", fmt: 'percent' },
      { key: 'concretisationPercent', label: 'Taux de concrétisation', fmt: 'percent' },
      { key: 'beforeReservationAmount', label: 'Montant avant réservation', fmt: 'currency' },
      { key: 'defaultExpenseAmount', label: 'Frais par défaut', fmt: 'currency' },
      { key: 'isWithVerifCredit', label: 'Vérification crédit', fmt: 'toggle' },
      { key: 'creditPercent', label: 'Taux de crédit max', fmt: 'percent' },
      { key: 'isWithVerifMaxEcheanceDelai', label: 'Vérification délai échéance max', fmt: 'toggle' },
      { key: 'maxEcheanceDelai', label: 'Délai échéance max', fmt: 'days' },
      { key: 'syndicAmount', label: 'Charges de syndic', fmt: 'currency' },
      { key: 'syndicPeriod', label: 'Durée des charges', fmt: 'months' },
      { key: 'paymentBalanceDelay', label: 'Délai solde de paiement', fmt: 'days' },
      { key: 'warrantyDelay', label: 'Délai de garantie', fmt: 'days' },
      { key: 'warrantyDelayAdded', label: 'Délai de garantie additionnel', fmt: 'days' },
    ],
  },
  {
    title: 'Pénalités',
    desc: "Pénalités appliquées en cas d'annulation ou de transfert du dossier.",
    icon: <Scale />,
    fields: [
      { key: 'cancellationPenalityPercent', label: "Pénalité d'annulation", fmt: 'percent' },
      { key: 'cancellationPenalityBasedOnItemPrice', label: 'Basée sur le prix du bien', fmt: 'toggle' },
      { key: 'articleTransferPenality', label: "Pénalité transfert d'article", fmt: 'currency' },
      { key: 'sliceTransferPenality', label: 'Pénalité transfert de tranche', fmt: 'currency' },
      { key: 'customerTransferPenality', label: 'Pénalité transfert de client', fmt: 'currency' },
      { key: 'agreementFirstPenaltyPercent', label: 'Pénalité 1ère relance', fmt: 'percent' },
      { key: 'agreementSecondPenaltyPercent', label: 'Pénalité 2ème relance', fmt: 'percent' },
    ],
  },
  {
    title: 'Légal & planification',
    desc: 'Délais réglementaires et contraintes de visite technique.',
    icon: <Building2 />,
    fields: [
      { key: 'withdrawalDelay', label: 'Délai de rétractation', fmt: 'hours' },
      { key: 'agreementFirstDelay', label: '1ère relance titre foncier', fmt: 'days' },
      { key: 'agreementSecondDelay', label: '2ème relance titre foncier', fmt: 'days' },
      { key: 'interventionMinimumDelai', label: 'Délai minimum intervention', fmt: 'days' },
      { key: 'maxVisitNumber', label: 'Nombre de visites max', fmt: 'number' },
      { key: 'commerceTribunal', label: 'Tribunal de commerce', fmt: 'text' },
      { key: 'cancellationRightCode', label: "Code droit d'annulation", fmt: 'text' },
    ],
  },
  {
    title: 'Cadeaux & fidélité',
    desc: 'Programmes de cadeaux liés au parrainage, à la fidélité ou à l\'origine de la prospection.',
    icon: <Gift />,
    fields: [
      { key: 'isWithGiftForProposer', label: 'Cadeau parrain', fmt: 'toggle' },
      { key: 'isWithGiftForOldCustomer', label: 'Cadeau ancien client', fmt: 'toggle' },
      { key: 'isWithGiftForProspectionOrigin', label: "Cadeau selon l'origine", fmt: 'toggle' },
      { key: 'accumulatedGifts', label: 'Cadeaux cumulables', fmt: 'toggle' },
    ],
  },
];

function renderValue(fmt: FieldFmt, value: TrancheRules[keyof TrancheRules]) {
  const empty = <span className="font-normal text-muted-foreground">—</span>;
  switch (fmt) {
    case 'percent':
      return formatPercent(value as number, 2);
    case 'currency':
      return (value as number) > 0 ? formatCurrency(value as number) : <span className="font-normal text-muted-foreground">Non défini</span>;
    case 'days':
      return (value as number) > 0 ? `${value} jours` : empty;
    case 'hours':
      return (value as number) > 0 ? `${value} h` : empty;
    case 'months':
      return (value as number) > 0 ? `${value} mois` : empty;
    case 'number':
      return (value as number) > 0 ? String(value) : empty;
    case 'toggle':
      return <TogglePill on={Boolean(value)} />;
    case 'text':
    default:
      return (value as string) || empty;
  }
}

const MODULE_FLAGS: { key: 'isForSale' | 'isForRent' | 'isForProject' | 'isForBuy' | 'isForSav'; label: string }[] = [
  { key: 'isForSale', label: 'Vente' },
  { key: 'isForRent', label: 'Location' },
  { key: 'isForProject', label: 'Projet' },
  { key: 'isForBuy', label: 'Achat' },
  { key: 'isForSav', label: 'SAV' },
];

export default function TrancheDetail() {
  const { id } = useParams();
  const { data, loading, error } = useData();
  const navigate = useNavigate();

  const tranche = useMemo(() => data?.tranches.find((t) => t.id === id), [data, id]);

  if (loading) return <PageShell title="Tranche"><LoadingState /></PageShell>;
  if (error) return <PageShell title="Tranche"><ErrorState message={error} /></PageShell>;
  if (!data) return null;
  if (!tranche) {
    return (
      <PageShell title="Tranche introuvable" crumbs={[{ label: 'Tranches', to: '/tranches' }]}>
        <p>Cette tranche n'existe pas dans l'échantillon.</p>
      </PageShell>
    );
  }

  const t: Tranche = tranche;

  return (
    <PageShell
      title={t.description}
      crumbs={[{ label: 'Tranches', to: '/tranches' }, { label: t.code }]}
    >
      <Button variant="outline" size="sm" className="mb-4" onClick={() => navigate('/tranches')}>
        <ArrowLeft data-icon="inline-start" /> Retour à la liste
      </Button>

      <div className="mb-5.5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[21px] font-semibold tracking-tight text-foreground">{t.description}</h1>
            {t.standing && (
              <span className={cn('whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold', standingClass(t.standing))}>
                {t.standing}
              </span>
            )}
          </div>
          <div className="mt-1 text-[13px] text-muted-foreground">
            {t.code} · {t.programme} · {t.city ? <span className="capitalize">{t.city}</span> : 'Ville non renseignée'}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {MODULE_FLAGS.map((m) => (
            <span
              key={m.key}
              className={cn(
                'rounded px-1.5 py-0.5 text-[10.5px] font-semibold',
                t[m.key] ? 'bg-[var(--brand-bg)] text-[var(--brand)]' : 'bg-[var(--neutral-bg)] text-muted-foreground'
              )}
            >
              {m.label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Card title="Aperçu du projet">
          <FieldGrid>
            <Field label="Adresse" value={t.address} />
            <Field label="Ville" value={t.city ? <span className="capitalize">{t.city}</span> : undefined} />
            <Field label="Surface plancher couverte" value={t.coveredFloorArea ? `${t.coveredFloorArea} m²` : undefined} />
            <Field label="Début des travaux" value={formatDate(t.workStartDate)} />
            <Field label="Fin des travaux" value={formatDate(t.workEndDate)} />
            <Field label="Début commercialisation" value={formatDate(t.marketingStartDate)} />
            <Field label="Fin commercialisation" value={formatDate(t.marketingEndDate)} />
            <Field label="Permis d'habiter" value={formatDate(t.occupancyPermitsDate)} />
            <Field label="Livraison" value={formatDate(t.deliveryDate)} />
            <Field label="Réception" value={formatDate(t.receptionDate)} />
            <Field label="Fin de concrétisation" value={formatDate(t.endDateConcretisation)} />
            <Field label="Début de finalisation" value={formatDate(t.startDateFinalisation)} />
            <Field label="1ère relance titre foncier" value={formatDate(t.revival1Date)} />
          </FieldGrid>
        </Card>

        <div>
          <div className="mb-2.5 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
            <Calendar className="size-[15px]" />
            Règles de gestion
          </div>
          {SECTIONS.map((section) => (
            <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card first:mt-0" key={section.title}>
              <div className="flex items-center gap-2.5 border-b border-border px-5 py-3.5 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-primary">
                {section.icon}
                <div>
                  <h3 className="text-[13.5px] font-semibold text-foreground">{section.title}</h3>
                  <div className="mt-px text-xs text-muted-foreground">{section.desc}</div>
                </div>
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-px bg-border">
                {section.fields.map((f) => (
                  <div className="bg-card px-5 py-3.5" key={f.key}>
                    <div className="mb-1 text-xs text-muted-foreground">{f.label}</div>
                    <div className="flex items-center gap-1.5 text-[15px] font-semibold text-foreground">{renderValue(f.fmt, t.rules[f.key])}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
