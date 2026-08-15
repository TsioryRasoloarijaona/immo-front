import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useData, type DataBundle } from './useData';
import { MILESTONE_FIELD_BY_STATUS, deriveInitialDossierStatus, toneForStatus, validTransitionsFrom } from './dossierStatus';
import { todayISO } from './format';
import { StoreContext, type NewInteractionInput, type StoreValue, type WizardDossierInput } from './storeContext';
import { isPreProspection } from './domain';
import type { Communication, DerivedDossierStatus, Dossier, Person, Prospection } from '../types';

// Mock/local mutation layer over the static JSON dataset. Nothing here
// persists — a refresh resets to the original export — but within a session
// this makes the pipeline actions (qualify a lead, open a dossier, advance
// its status, log an interaction) actually change what renders, reproducing
// Omran's real guarded workflow instead of a purely visual prototype.
// See instructions/FIX-mock-actions-state.md.

function newId(): string {
  return crypto.randomUUID();
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { data, loading, error } = useData();

  const [prospections, setProspections] = useState<Prospection[]>([]);
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [statusLabel, setStatusLabel] = useState<Record<string, string>>({});
  const [qualifiedIds, setQualifiedIds] = useState<Record<string, boolean>>({});
  const [seededFrom, setSeededFrom] = useState<DataBundle | null>(null);

  // One-time seed from the loaded JSON into mutable state. Done here, during
  // render (guarded so it only fires once per `data` identity), rather than
  // in a useEffect — React's documented pattern for initializing state from
  // an async-loaded value without an extra commit/flicker.
  if (data && data !== seededFrom) {
    setSeededFrom(data);
    setProspections(data.prospections);
    setDossiers(data.dossiers);
    setCommunications(data.communications);
    const labels: Record<string, string> = {};
    for (const d of data.dossiers) labels[d.id] = deriveInitialDossierStatus(d).label;
    setStatusLabel(labels);
    const qualified: Record<string, boolean> = {};
    for (const p of data.prospections) qualified[p.id] = !isPreProspection(p);
    setQualifiedIds(qualified);
  }
  const seeded = seededFrom !== null;

  const commercials = useMemo(() => {
    const set = new Set<string>();
    for (const p of prospections) if (p.commercial) set.add(p.commercial);
    for (const d of dossiers) if (d.commercial) set.add(d.commercial);
    return Array.from(set).sort();
  }, [prospections, dossiers]);

  const getDossierStatus = useCallback(
    (dossierId: string): DerivedDossierStatus => {
      const label = statusLabel[dossierId] ?? 'Réservation';
      return { label, tone: toneForStatus(label) };
    },
    [statusLabel],
  );

  const assignCommercial = useCallback((kind: 'prospection' | 'dossier', id: string, commercial: string) => {
    if (kind === 'prospection') {
      setProspections((prev) => prev.map((p) => (p.id === id ? { ...p, commercial } : p)));
    } else {
      setDossiers((prev) => prev.map((d) => (d.id === id ? { ...d, commercial } : d)));
    }
  }, []);

  const setProspectContact = useCallback((prospectionId: string, person: Person) => {
    setProspections((prev) => prev.map((p) => (p.id === prospectionId ? { ...p, prospect: person } : p)));
  }, []);

  const isQualifiedProspection = useCallback((prospectionId: string) => qualifiedIds[prospectionId] ?? false, [qualifiedIds]);

  const qualifyProspection = useCallback((prospectionId: string) => {
    setProspections((prev) =>
      prev.map((p) => (p.id === prospectionId && p.nature === '1 A TRAITER' ? { ...p, nature: '2 EN COURS DE TRAITEMENT' } : p)),
    );
    setQualifiedIds((prev) => ({ ...prev, [prospectionId]: true }));
  }, []);

  const addInteraction = useCallback(
    (target: { prospectionId?: string; folderId?: string }, input: NewInteractionInput, user: string) => {
      const now = todayISO();
      const entry: Communication = {
        id: newId(),
        date: now,
        description: `${input.actionType} du ${now}`,
        isIncoming: input.isIncoming ?? false,
        alertDate: input.alertDate ?? null,
        report: input.report,
        user,
        prospectionId: target.prospectionId ?? null,
        folderId: target.folderId ?? null,
        tierId: null,
        actionType: input.actionType,
        isUnpaid: false,
        isSystem: false,
        appointmentDate: input.appointmentDate ?? null,
        appointmentLabel: input.appointmentLabel ?? null,
      };
      setCommunications((prev) => [entry, ...prev]);
    },
    [],
  );

  const createDossierFromWizard = useCallback(
    (prospectionId: string, input: WizardDossierInput): string => {
      const p = prospections.find((x) => x.id === prospectionId);
      if (!p || !p.commercial) {
        throw new Error('Cette prospection n\'est pas encore qualifiée.');
      }
      const today = todayISO();
      const id = newId();
      const primaryLot = input.lots[0] ?? p.article ?? null;
      const additionalLots = input.lots.slice(1);
      const discountAmount = round2(input.priceBeforeDiscount * input.discount);
      const price = round2(input.priceBeforeDiscount - discountAmount);
      const area = input.lots.length > 0 ? input.lots.reduce((sum, l) => sum + (l.area || 0), 0) : primaryLot?.area ?? 0;
      const dossier: Dossier = {
        id,
        code: `NOUV-${id.slice(0, 8).toUpperCase()}`,
        date: today,
        description: `Dossier ouvert depuis la prospection ${p.code || p.id}`,
        client: input.client,
        commercial: p.commercial,
        articleId: primaryLot?.id ?? null,
        article: primaryLot,
        area,
        globalArea: area,
        unitCost: 0,
        itemPrice: input.priceBeforeDiscount,
        underItemsPrice: 0,
        priceBeforeDiscount: input.priceBeforeDiscount,
        discount: input.discount,
        discountAmount,
        priceAfterDiscount: price,
        price,
        vatRatio: 0.2,
        priceHT: price ? round2(price / 1.2) : 0,
        totalToPay: price,
        // Coincides with `price` at creation in this prototype (no separate
        // contractual-price capture in the wizard yet) but stored as its own
        // field, never re-derived — see instructions/FIX-dossier-vente-corrections.md §1.
        contractualPrice: price,
        probabilityOfFinalisation: 0.5,
        paymentMethod: 'Non défini',
        commissionRate: 0,
        reservationDate: today,
        agreementDate: null,
        agreementSavingDate: null,
        agreementDatePrevisionel: null,
        ownershipCertificateDate: null,
        receptionDate: null,
        creditApprovalDate: null,
        creditPossessionDate: null,
        advanceDate: null,
        insuranceDate: null,
        bankRecordDate: null,
        interventionDate: null,
        revival1: null,
        revival2: null,
        revival1ValidityDate: null,
        revival2ValidityDate: null,
        deliveryDateReal: null,
        precisionActDate: null,
        contractPrintDate: null,
        cancelDate: null,
        cancelDescription: '',
        finalTitleNumber: '',
        finalTitleDate: null,
        isAccounted: false,
        isOldCustomer: p.isOldCustomer,
        isPenaltyDisabled: false,
        isConfirmedAgreementDate: false,
        prospectionId: p.id,
        notes: additionalLots.length > 0 ? `Lots additionnels : ${additionalLots.map((l) => l.code).join(', ')}` : '',
        createdBy: 'Vous (démo)',
        createdAt: today,
        updatedBy: 'Vous (démo)',
        updatedAt: today,
        echeancier: input.echeancier,
        additionalLots: additionalLots.length > 0 ? additionalLots : undefined,
      };
      setDossiers((prev) => [dossier, ...prev]);
      setStatusLabel((prev) => ({ ...prev, [id]: 'Réservation' }));
      return id;
    },
    [prospections],
  );

  // Moves a dossier to an arbitrary target status — the interactive stepper
  // only ever calls this with a status in validTransitionsFrom(current), but
  // it's re-checked here too since this is the single place status actually
  // changes. See instructions/FEATURE-changement-statut.md.
  const setDossierStatus = useCallback(
    (dossierId: string, newStatus: string, note?: string) => {
      const current = statusLabel[dossierId] ?? 'Réservation';
      if (!validTransitionsFrom(current).includes(newStatus as never)) return;
      const today = todayISO();
      setStatusLabel((prev) => ({ ...prev, [dossierId]: newStatus }));

      const field = MILESTONE_FIELD_BY_STATUS[newStatus];
      setDossiers((prev) =>
        prev.map((d) => {
          if (d.id !== dossierId) return d;
          const patch: Partial<Dossier> = { updatedAt: today, updatedBy: 'Vous (démo)' };
          if (field && !d[field]) (patch as Record<string, unknown>)[field] = today;
          if (newStatus === 'Annulé') {
            patch.cancelDate = d.cancelDate ?? today;
            if (note) patch.cancelDescription = note;
          } else if (note) {
            // No dedicated field for a Désistement (or general) reason in
            // this export — logged onto the dossier's free-text notes
            // instead of inventing a schema field. See
            // instructions/FIX-dossier-vente-corrections.md §6.
            patch.notes = `[${today}] Passage à ${newStatus} : ${note}${d.notes ? `\n${d.notes}` : ''}`;
          }
          return { ...d, ...patch };
        }),
      );
    },
    [statusLabel],
  );

  const updateDossierField = useCallback(<K extends keyof Dossier>(dossierId: string, field: K, value: Dossier[K]) => {
    const today = todayISO();
    setDossiers((prev) =>
      prev.map((d) => (d.id === dossierId ? { ...d, [field]: value, updatedAt: today, updatedBy: 'Vous (démo)' } : d)),
    );
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      loading: loading || !seeded,
      error,
      prospections,
      dossiers,
      communications,
      commercials,
      getDossierStatus,
      isQualifiedProspection,
      assignCommercial,
      setProspectContact,
      qualifyProspection,
      addInteraction,
      createDossierFromWizard,
      setDossierStatus,
      updateDossierField,
    }),
    [
      loading,
      seeded,
      error,
      prospections,
      dossiers,
      communications,
      commercials,
      getDossierStatus,
      isQualifiedProspection,
      assignCommercial,
      setProspectContact,
      qualifyProspection,
      addInteraction,
      createDossierFromWizard,
      setDossierStatus,
      updateDossierField,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
