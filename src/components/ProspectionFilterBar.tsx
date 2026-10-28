import type { ReactNode } from 'react';
import PanneauFiltresCoches from './liste/PanneauFiltresCoches';
import BoiteFiltre from './liste/BoiteFiltre';
import { puceSelection, puceUnique } from '../lib/pucesFiltres';
import type { FiltreTriple, ProspectionFilterBarState } from '../lib/domain';
import type { PeriodeSur } from '../types';

/* Le nom du filtre est le titre de la boîte ; « Tous » = aucune case cochée (`null`). */
const ARCHIVE_ITEMS: { label: string; value: ProspectionFilterBarState['archive'] }[] = [
  { label: 'Non', value: 'non' },
  { label: 'Oui', value: 'oui' },
];

const ABOUTIE_ITEMS: { label: string; value: FiltreTriple }[] = [
  { label: 'Oui', value: 'oui' },
  { label: 'Non', value: 'non' },
];

const DATES: { label: string; value: PeriodeSur }[] = [
  { label: 'Date', value: 'DATE' },
  { label: "Date d'archivage", value: 'ARCHIVAGE' },
];

const RENSEIGNEE: { label: string; value: FiltreTriple }[] = [
  { label: 'Date renseignée', value: 'oui' },
  { label: 'Date non renseignée', value: 'non' },
];

const SANS_TRANCHE = [{ label: 'Non affectés (sans tranche)', value: 'sans' }];

/** Panneau « Filtres » des deux listes de prospections (mêmes boîtes, `mode` choisit les propres à chacune). */
export default function ProspectionFilterBar({
  state,
  onChange,
  etapeItems,
  origineItems,
  commercialItems,
  trancheItems,
  mode = 'prospections',
  ferme,
  onBasculer,
  onReinitialiser,
  champs,
  boitesSup,
  pucesSup = [],
}: Readonly<{
  state: ProspectionFilterBarState;
  /** Le parent remet lui-même la page à 0 (via `set`). */
  onChange: <K extends keyof ProspectionFilterBarState>(key: K, value: ProspectionFilterBarState[K]) => void;
  etapeItems: { label: string; value: string }[];
  origineItems: { label: string; value: string }[];
  commercialItems: { label: string; value: string }[];
  trancheItems: { label: string; value: string }[];
  /** Aboutie et date visée : prospections ; « Non affectés » : pré-prospections. */
  mode?: 'prospections' | 'pre-prospections';
  ferme: boolean;
  onBasculer: () => void;
  onReinitialiser: () => void;
  /** Champs libres propres à la page (filtres avancés). */
  champs?: ReactNode;
  /** Boîtes propres à la page (projet). */
  boitesSup?: ReactNode;
  pucesSup?: string[];
}>) {
  const prospections = mode === 'prospections';

  const puces = [
    ...puceSelection('Étape', etapeItems, state.etape),
    ...puceSelection('Origine', origineItems, state.origine),
    ...puceSelection('Tranche', trancheItems, state.trancheId),
    ...(state.sansTranche ? ['Non affectés'] : []),
    ...puceSelection('Commercial', commercialItems, state.commercial),
    ...(state.archive === 'tous' ? [] : [`Archivé : ${puceUnique(ARCHIVE_ITEMS, state.archive)[0]}`]),
    ...(prospections && state.aboutie !== 'tous' ? [`Aboutie : ${puceUnique(ABOUTIE_ITEMS, state.aboutie)[0]}`] : []),
    ...pucesSup,
    ...(state.search ? [`« ${state.search} »`] : []),
  ];

  return (
    <PanneauFiltresCoches
      ferme={ferme}
      onBasculer={onBasculer}
      puces={puces}
      champDate={
        prospections
          ? { items: DATES, valeur: state.periodeSur, onChange: (v) => onChange('periodeSur', v as PeriodeSur) }
          : undefined
      }
      periode={{
        debut: state.dateDebut,
        fin: state.dateFin,
        onChange: (debut, fin) => {
          onChange('dateDebut', debut);
          onChange('dateFin', fin);
        },
      }}
      recherche={{
        valeur: state.search,
        onChange: (v) => onChange('search', v),
        placeholder: 'Nom, téléphone, CIN, code…',
      }}
      onReinitialiser={onReinitialiser}
      champs={champs}
    >
      <BoiteFiltre titre="Étape" mode="multiple" items={etapeItems} valeur={state.etape} onChange={(v) => onChange('etape', v)} />
      <BoiteFiltre titre="Origine" mode="multiple" items={origineItems} valeur={state.origine} onChange={(v) => onChange('origine', v)} />
      <BoiteFiltre titre="Tranche" mode="multiple" items={trancheItems} valeur={state.trancheId} onChange={(v) => onChange('trancheId', v)} />
      {!prospections && (
        // « Non affectés » d'OMRAN : avec des tranches cochées, les ajoute ; seule, ne garde que les lignes sans tranche.
        <BoiteFiltre
          titre="Affectation"
          mode="unique"
          items={SANS_TRANCHE}
          valeur={state.sansTranche ? 'sans' : null}
          onChange={(v) => onChange('sansTranche', v === 'sans')}
        />
      )}
      {boitesSup}
      <BoiteFiltre titre="Commercial" mode="multiple" items={commercialItems} valeur={state.commercial} onChange={(v) => onChange('commercial', v)} />
      <BoiteFiltre
        titre="Archivé"
        mode="unique"
        items={ARCHIVE_ITEMS}
        valeur={state.archive === 'tous' ? null : state.archive}
        onChange={(v) => onChange('archive', (v ?? 'tous') as ProspectionFilterBarState['archive'])}
      />
      {prospections && (
        <>
          <BoiteFiltre
            titre="Aboutie"
            mode="unique"
            items={ABOUTIE_ITEMS}
            valeur={state.aboutie === 'tous' ? null : state.aboutie}
            onChange={(v) => onChange('aboutie', (v ?? 'tous') as FiltreTriple)}
          />
          {/* Sur « Renseignée / Non renseignée », le serveur ignore les bornes de la période. */}
          <BoiteFiltre
            titre="Présence de la date"
            mode="unique"
            items={RENSEIGNEE}
            valeur={state.dateRenseignee === 'tous' ? null : state.dateRenseignee}
            onChange={(v) => onChange('dateRenseignee', (v ?? 'tous') as FiltreTriple)}
          />
        </>
      )}
    </PanneauFiltresCoches>
  );
}
