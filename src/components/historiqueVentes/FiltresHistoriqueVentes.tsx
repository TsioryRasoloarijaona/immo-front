import PanneauFiltresCoches from '../liste/PanneauFiltresCoches';
import BoiteFiltre from '../liste/BoiteFiltre';
import { Input } from '../ui/input';
import FiltreEntiteProjetTranche from '../liste/FiltreEntiteProjetTranche';
import { pucesCascade, type CascadeTranches } from '../../lib/cascadeTranches';
import { puceSelection, puceUnique } from '../../lib/pucesFiltres';
import type { FiltresHistorique, ModeDate } from '../../lib/historiqueVentes';

type Option = { label: string; value: string };

/** « Période » = aucune case cochée : seuls les deux modes qui ignorent les bornes sont listés. */
const MODES_DATE: Option[] = [
  { label: 'Date vide', value: 'VIDE' },
  { label: 'Date renseignée', value: 'RENSEIGNEE' },
];

/** Filtres de l'Historique des ventes : annulés et résiliés toujours inclus, pas de case pour les exclure. */
export default function FiltresHistoriqueVentes({
  filtres,
  onChange,
  onReinitialiser,
  ferme,
  onBasculer,
  options,
  cascade,
}: Readonly<{
  filtres: FiltresHistorique;
  onChange: (patch: Partial<FiltresHistorique>) => void;
  onReinitialiser: () => void;
  ferme: boolean;
  onBasculer: () => void;
  options: { statuts: Option[]; champsDate: Option[]; commerciaux: Option[] };
  cascade: CascadeTranches;
}>) {
  const unique = (valeur: string) => valeur || null;
  const puces = [
    ...pucesCascade(cascade, filtres),
    ...puceSelection('Statut', options.statuts, filtres.statuts),
    ...(filtres.modeDate === 'PERIODE' ? [] : puceUnique(MODES_DATE, filtres.modeDate)),
    ...puceUnique(options.commerciaux, unique(filtres.commercial)),
    ...(filtres.totalMin || filtres.totalMax ? [`Total ${filtres.totalMin || '…'} à ${filtres.totalMax || '…'}`] : []),
    ...(filtres.search ? [`« ${filtres.search} »`] : []),
  ];

  return (
    <PanneauFiltresCoches
      ferme={ferme}
      onBasculer={onBasculer}
      puces={puces}
      champDate={{ items: options.champsDate, valeur: filtres.champDate, onChange: (v) => onChange({ champDate: v }) }}
      periode={{ debut: filtres.dateDebut, fin: filtres.dateFin, onChange: (dateDebut, dateFin) => onChange({ dateDebut, dateFin }) }}
      recherche={{ valeur: filtres.search, onChange: (v) => onChange({ search: v }), placeholder: 'Client, co-acquéreur, article, code…' }}
      onReinitialiser={onReinitialiser}
      champs={
        <>
          <Input aria-label="Total de" placeholder="Total de" inputMode="decimal" className="w-28" value={filtres.totalMin} onChange={(e) => onChange({ totalMin: e.target.value })} />
          <Input aria-label="Total à" placeholder="à" inputMode="decimal" className="w-24" value={filtres.totalMax} onChange={(e) => onChange({ totalMax: e.target.value })} />
        </>
      }
    >
      <FiltreEntiteProjetTranche valeur={filtres} onChange={onChange} cascade={cascade} />
      <BoiteFiltre titre="Statut" mode="multiple" items={options.statuts} valeur={filtres.statuts} onChange={(v) => onChange({ statuts: v })} />
      <BoiteFiltre
        titre="Mode de date"
        mode="unique"
        items={MODES_DATE}
        valeur={filtres.modeDate === 'PERIODE' ? null : filtres.modeDate}
        onChange={(v) => onChange({ modeDate: (v ?? 'PERIODE') as ModeDate })}
      />
      <BoiteFiltre titre="Commercial" mode="unique" items={options.commerciaux} valeur={unique(filtres.commercial)} onChange={(v) => onChange({ commercial: v ?? '' })} />
    </PanneauFiltresCoches>
  );
}
