import { createContext, useContext } from 'react';
import type { ArticleRef, Communication, DerivedDossierStatus, Dossier, EcheancierLine, Person, Prospection } from '../types';

export interface NewInteractionInput {
  actionType: string;
  report: string;
  alertDate?: string | null;
  appointmentDate?: string | null;
  appointmentLabel?: string | null;
  isIncoming?: boolean;
}

/** Payload assembled by the dossier creation wizard's Récapitulatif step. */
export interface WizardDossierInput {
  client: Person;
  lots: ArticleRef[];
  priceBeforeDiscount: number;
  /** Ratio 0–1, not a percentage integer. */
  discount: number;
  echeancier: EcheancierLine[];
}

export interface StoreValue {
  loading: boolean;
  error: string | null;
  prospections: Prospection[];
  dossiers: Dossier[];
  communications: Communication[];
  commercials: string[];
  getDossierStatus: (dossierId: string) => DerivedDossierStatus;
  /** True once a prospection has been explicitly qualified via "Transformer en
   * prospection" — filling prospect/commercial only enables that action, it
   * doesn't silently move the record out of the Pré-Prospections bucket. */
  isQualifiedProspection: (prospectionId: string) => boolean;
  assignCommercial: (kind: 'prospection' | 'dossier', id: string, commercial: string) => void;
  setProspectContact: (prospectionId: string, person: Person) => void;
  qualifyProspection: (prospectionId: string) => void;
  /** Sets `nature` directly — mirrors the plain editable dropdown on the real
   * Omran screen (the commercial moves the funnel-depth stage manually, e.g.
   * after a visit or a sent offer; there's no automatic advancement beyond
   * the one-time 1→2 kick in qualifyProspection). Accepts any of the 5
   * pipeline stages or the 2 side-track values from lookups.prospectionKinds. */
  setProspectionNature: (prospectionId: string, nature: string) => void;
  /** Generic field patch for the Qualification tab (budget/superficie/apport/
   * origine…). Auto-advances `nature` to "3 QUALIFIÉ" the moment the edited
   * record crosses the isQualificationDataComplete bar — see lib/store.tsx. */
  updateProspectionField: <K extends keyof Prospection>(prospectionId: string, field: K, value: Prospection[K]) => void;
  addInteraction: (target: { prospectionId?: string; folderId?: string }, input: NewInteractionInput, user: string) => void;
  /** Creates a dossier from a prospection using the full wizard payload
   * (Acheteur → Lot(s) → Prix/remise → Plan de financement steps). Returns
   * the new dossier's id. */
  createDossierFromWizard: (prospectionId: string, input: WizardDossierInput) => string;
  /** Moves a dossier to `newStatus` — the interactive stepper (see
   * DossierStatusStepper) only ever calls this with a status present in
   * validTransitionsFrom(currentStatus). Stamps the matching milestone date
   * field (MILESTONE_FIELD_BY_STATUS) when reaching a pipeline step, sets
   * cancelDate/cancelDescription for 'Annulé', and appends `note` (optional)
   * to the dossier's free-text notes for every other transition — Omran has
   * no dedicated field for a Désistement reason in this export. */
  setDossierStatus: (dossierId: string, newStatus: string, note?: string) => void;
  /** Generic field patch for the handful of Dossier fields editable inline
   * on the detail page (mode de paiement, prix contractuel…) — mirrors the
   * mock-mutation approach already used by assignCommercial. */
  updateDossierField: <K extends keyof Dossier>(dossierId: string, field: K, value: Dossier[K]) => void;
}

export const StoreContext = createContext<StoreValue | null>(null);

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
