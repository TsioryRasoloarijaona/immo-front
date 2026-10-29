import type { ReactNode } from 'react';
import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import MultiSelectDropdown from './MultiSelectDropdown';
import { Button } from './ui/button';
import { InputGroup, InputGroupInput } from './ui/input-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { countActiveFiltresAvances, TYPES_PROSPECTION, type FiltresAvancesState } from '../lib/domain';
import {
  referentielItems,
  useActionsCommerciales,
  usePays,
  useRaisonsCloture,
  useSupportsOrigine,
  useTypesContactProspection,
  useVocations,
} from '../lib/referentiels';

const TERNAIRE: { label: string; value: FiltresAvancesState['ancienClient'] }[] = [
  { label: 'Indifférent', value: 'all' },
  { label: 'Oui', value: 'oui' },
  { label: 'Non', value: 'non' },
];

function Ligne({ label, aide, children }: Readonly<{ label: string; aide?: string; children: ReactNode }>) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-micro font-medium text-muted-foreground">{label}</span>
      {children}
      {aide && <span className="text-micro text-muted-foreground">{aide}</span>}
    </div>
  );
}

function Section({ titre, children }: Readonly<{ titre: string; children: ReactNode }>) {
  return (
    <section className="flex flex-col gap-3 border-b border-border pb-4 last:border-b-0 last:pb-0">
      <h3 className="text-label font-semibold text-foreground">{titre}</h3>
      {children}
    </section>
  );
}

/** Réservé aux prospections : `/api/pre-prospections` n'accepte pas ces paramètres. */
export default function ProspectionFiltresAvances({
  state,
  onChange,
  onReset,
}: Readonly<{
  state: FiltresAvancesState;
  onChange: <K extends keyof FiltresAvancesState>(key: K, value: FiltresAvancesState[K]) => void;
  onReset: () => void;
}>) {
  const vocations = useVocations();
  const typesContact = useTypesContactProspection();
  const actions = useActionsCommerciales();
  const pays = usePays();
  const raisons = useRaisonsCloture();
  const supports = useSupportsOrigine();

  const actifs = countActiveFiltresAvances(state);

  function ternaire(cle: 'ancienClient' | 'avecAlerteActive', label: string) {
    return (
      <Ligne label={label}>
        <Select items={TERNAIRE} value={state[cle]} onValueChange={(v) => onChange(cle, v as FiltresAvancesState['ancienClient'])}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {TERNAIRE.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Ligne>
    );
  }

  function seuil(cle: 'inactiviteMin' | 'nbInteractionsMin' | 'nbVisitesMin', label: string, aide?: string) {
    return (
      <Ligne label={label} aide={aide}>
        <InputGroup className="w-full">
          <InputGroupInput
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Sans minimum"
            value={state[cle]}
            onChange={(e) => onChange(cle, e.target.value)}
          />
        </InputGroup>
      </Ligne>
    );
  }

  function multi(
    cle:
      | 'vocationId'
      | 'typeContactId'
      | 'actionId'
      | 'origineSupportId'
      | 'paysId'
      | 'raisonFermetureId'
      | 'typeProspection',
    label: string,
    items: { label: string; value: string }[],
    aide?: string,
  ) {
    return (
      <Ligne label={label} aide={aide}>
        <MultiSelectDropdown
          ariaLabel={label}
          placeholder="Tous"
          value={state[cle]}
          onChange={(v) => onChange(cle, v)}
          items={items}
          className="w-full max-w-none"
        />
      </Ligne>
    );
  }

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button type="button" variant="outline" size="sm">
            <SlidersHorizontal data-icon="inline-start" />
            Filtres avancés
            {actifs > 0 && (
              <span className="ml-1.5 rounded-full bg-(--brand-bg) px-1.75 text-micro font-bold text-(--brand)">{actifs}</span>
            )}
          </Button>
        }
      />
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Filtres avancés</SheetTitle>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
          <Section titre="Activité et relance">
            {seuil('inactiviteMin', 'Inactives depuis au moins (jours)')}
            {ternaire('avecAlerteActive', 'Relance active')}
            {seuil('nbInteractionsMin', 'Interactions — minimum')}
            {seuil('nbVisitesMin', 'Visites — minimum', 'Seules 20,8 % des prospections ont atteint l’étape visite.')}
            <div className="grid grid-cols-2 gap-2">
              <Ligne label="Dernier échange — du">
                <InputGroup className="w-full">
                  <InputGroupInput
                    type="date"
                    value={state.communicationDepuis}
                    onChange={(e) => onChange('communicationDepuis', e.target.value)}
                  />
                </InputGroup>
              </Ligne>
              <Ligne label="au">
                <InputGroup className="w-full">
                  <InputGroupInput
                    type="date"
                    value={state.communicationJusqua}
                    onChange={(e) => onChange('communicationJusqua', e.target.value)}
                  />
                </InputGroup>
              </Ligne>
            </div>
          </Section>

          <Section titre="Rattachement">
            {multi('vocationId', 'Vocation', referentielItems(vocations.data))}
            {multi(
              'typeProspection',
              'Type de document',
              TYPES_PROSPECTION,
              'Filtre sur le discriminant réel du logiciel de bureau, pas sur l’heuristique de cette liste — « Pré-prospection » isole les 830 lignes qui s’y trouvent malgré tout.',
            )}
          </Section>

          <Section titre="Origine et contact">
            {multi('typeContactId', 'Type de contact', referentielItems(typesContact.data))}
            {multi('origineSupportId', 'Support', referentielItems(supports.data))}
            {multi('actionId', 'Action commerciale', referentielItems(actions.data))}
            {multi('paysId', 'Pays', referentielItems(pays.data))}
          </Section>

          <Section titre="Prospect et clôture">
            {ternaire('ancienClient', 'Ancien client')}
            {multi('raisonFermetureId', 'Motif de clôture', referentielItems(raisons.data))}
          </Section>
        </div>

        <SheetFooter>
          <Button type="button" variant="outline" size="sm" onClick={onReset} disabled={actifs === 0}>
            <RotateCcw data-icon="inline-start" /> Réinitialiser
            {actifs > 0 && ` (${actifs})`}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
