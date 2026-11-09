import EcranMaquette, { type EcransModule } from '../../../components/maquette/EcranMaquette';
import { configRapports, bordBilans, bordSuiviLots, bordTresorerie } from './tableaux';
import { configDecomptes, configLots } from './ecransLots';
import { configModifications, configPrevisions, configReunions } from './ecransChantier';
import { LISTES_CONFIG_PROJET, REFERENTIELS_PROJET } from './ecransConfig';
import GanttLots from './GanttLots';

const ECRANS: EcransModule = {
  listes: {
    lots: configLots,
    decomptes: configDecomptes,
    reunions: configReunions,
    modifications: configModifications,
    previsions: configPrevisions,
    rapports: configRapports,
    ...REFERENTIELS_PROJET,
    ...LISTES_CONFIG_PROJET,
  },
  tableaux: { bilans: bordBilans, tresorerie: bordTresorerie, 'suivi-lots': bordSuiviLots },
  libres: { gantt: <GanttLots /> },
};

/** Route unique `/projet/:ecran/:id?` du module Projet. */
export default function EcranProjet() {
  return <EcranMaquette base="/projet" ecrans={ECRANS} />;
}
