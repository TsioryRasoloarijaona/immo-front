import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import PageShell from '../../../components/PageShell';
import { ErrorState, LoadingState } from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { useData } from '../../../lib/useData';
import { useStore } from '../../../lib/storeContext';
import {
  deriveFinancingSignal,
  financingLinesTotal,
  financingValidationState,
  generateDefaultEcheancier,
  type SyndicDefault,
} from '../../../lib/financing';
import WizardStepper from './WizardStepper';
import StepAcheteur from './StepAcheteur';
import StepLots from './StepLots';
import StepPrix from './StepPrix';
import StepEcheancier from './StepEcheancier';
import StepRecap from './StepRecap';
import { WIZARD_STEPS, priceAfterDiscount, type WizardState } from './wizardTypes';

export default function NewDossierWizard() {
  const { id } = useParams();
  const { data, loading, error } = useData();
  const { prospections, createDossierFromWizard } = useStore();
  const navigate = useNavigate();

  const [stepIndex, setStepIndex] = useState(0);
  const [state, setState] = useState<WizardState | null>(null);
  const initialized = useRef(false);

  const prospection = prospections.find((p) => p.id === id);

  // One-time seed of the wizard state from the prospection, once both the
  // store and the reference data (tranches, for the syndic default) are
  // ready. Mirrors the seeding pattern in lib/store.tsx.
  useEffect(() => {
    if (initialized.current || !prospection || !data) return;
    initialized.current = true;
    const p = prospection;
    const lots = p.article ? [p.article] : [];
    const priceBeforeDiscount = lots.reduce((sum, l) => sum + (l.salePrice || 0), 0) || p.budgetMax || 0;
    setState({
      client: p.prospect ?? {
        id: crypto.randomUUID(),
        code: '',
        name: p.displayName,
        firstName: p.displayName.split(' ')[0] ?? '',
        lastName: p.displayName.split(' ').slice(1).join(' '),
        phone: p.phone,
        mobile: '',
        email: p.email,
        address: '',
        city: '',
        idNumber: '',
        idPlace: '',
        idDate: null,
        birthDate: null,
        birthPlace: '',
        profession: '',
        isProspect: true,
        isOldCustomer: p.isOldCustomer,
        nbrChildren: 0,
        fatherName: '',
        motherName: '',
      },
      lots,
      priceBeforeDiscount,
      discount: 0,
      priceTouched: false,
      echeancier: [],
      echeancierTouched: false,
      echeancierInitialized: false,
    });
  }, [prospection, data]);

  function syndicDefault(): SyndicDefault | null {
    if (!data || !prospection) return null;
    const tranche = data.tranches.find((t) => t.id === prospection.trancheId);
    if (!tranche || !tranche.rules.syndicAmount) return null;
    return { monthlyAmount: tranche.rules.syndicAmount, months: tranche.rules.syndicPeriod };
  }

  function regenerateEcheancier(currentState: WizardState): WizardState {
    if (!prospection) return currentState;
    const signal = deriveFinancingSignal(prospection);
    const plan = generateDefaultEcheancier(priceAfterDiscount(currentState), signal, syndicDefault());
    return { ...currentState, echeancier: plan, echeancierTouched: false, echeancierInitialized: true };
  }

  if (loading) return <PageShell title="Nouveau dossier"><LoadingState /></PageShell>;
  if (error) return <PageShell title="Nouveau dossier"><ErrorState message={error} /></PageShell>;
  if (!data) return null;
  if (!prospection) {
    return (
      <PageShell title="Prospection introuvable" crumbs={[{ label: 'Prospections', to: '/prospections' }]}>
        <p>Cette prospection n'existe pas dans l'échantillon.</p>
      </PageShell>
    );
  }
  if (!state) return <PageShell title="Nouveau dossier"><LoadingState /></PageShell>;

  const target = priceAfterDiscount(state);
  const step = WIZARD_STEPS[stepIndex].key;
  const isLastStep = stepIndex === WIZARD_STEPS.length - 1;

  const canAdvance = (() => {
    switch (step) {
      case 'acheteur':
        return state.client.name.trim().length > 0;
      case 'lots':
        return state.lots.length > 0;
      case 'prix':
        return state.priceBeforeDiscount > 0;
      case 'echeancier':
        return financingValidationState(financingLinesTotal(state.echeancier), target) === 'ok';
      default:
        return true;
    }
  })();

  // Advances to the next step, generating the default échéancier on the way
  // in the first time that step is reached. Done here, as a direct response
  // to the click, rather than in a useEffect.
  function goNext() {
    if (!state) return;
    const nextIndex = Math.min(WIZARD_STEPS.length - 1, stepIndex + 1);
    if (WIZARD_STEPS[nextIndex].key === 'echeancier' && !state.echeancierInitialized) {
      setState(regenerateEcheancier(state));
    }
    setStepIndex(nextIndex);
  }

  function handleCreate() {
    if (!state) return;
    const dossierId = createDossierFromWizard(prospection!.id, {
      client: state.client,
      lots: state.lots,
      priceBeforeDiscount: state.priceBeforeDiscount,
      discount: state.discount,
      echeancier: state.echeancier,
    });
    navigate(`/dossiers/${dossierId}`);
  }

  return (
    <PageShell
      title="Nouveau dossier de vente"
      crumbs={[
        { label: 'Prospections', to: '/prospections' },
        { label: prospection.code || prospection.displayName, to: `/prospections/${prospection.id}` },
        { label: 'Nouveau dossier' },
      ]}
    >
      <div className="mb-4">
        <WizardStepper activeIndex={stepIndex} />
      </div>

      <div className="mb-6">
        {step === 'acheteur' && (
          <StepAcheteur client={state.client} onChange={(client) => setState({ ...state, client })} />
        )}
        {step === 'lots' && (
          <StepLots
            articles={data.articles}
            lots={state.lots}
            onChange={(lots) => {
              setState((prev) => {
                if (!prev) return prev;
                const next = { ...prev, lots };
                if (!prev.priceTouched) {
                  next.priceBeforeDiscount = lots.reduce((sum, l) => sum + (l.salePrice || 0), 0);
                }
                return next;
              });
            }}
          />
        )}
        {step === 'prix' && (
          <StepPrix
            state={state}
            onChange={(patch) =>
              setState({
                ...state,
                ...patch,
                priceTouched: 'priceBeforeDiscount' in patch ? true : state.priceTouched,
              })
            }
          />
        )}
        {step === 'echeancier' && (
          <StepEcheancier
            lines={state.echeancier}
            target={target}
            touched={state.echeancierTouched}
            onChange={(echeancier) => setState({ ...state, echeancier, echeancierTouched: true })}
            onRegenerate={() => setState((prev) => (prev ? regenerateEcheancier(prev) : prev))}
          />
        )}
        {step === 'recap' && <StepRecap state={state} />}
      </div>

      <div className="flex items-center justify-end border-t border-border pt-4">
        {isLastStep ? (
          <Button type="button" onClick={handleCreate}>
            <Check data-icon="inline-start" /> Créer le dossier
          </Button>
        ) : (
          <Button type="button" onClick={goNext} disabled={!canAdvance}>
            Suivant <ArrowRight data-icon="inline-end" />
          </Button>
        )}
      </div>
    </PageShell>
  );
}
