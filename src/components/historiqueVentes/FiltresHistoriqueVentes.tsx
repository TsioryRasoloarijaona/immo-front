import PanneauFiltresCoches from '../liste/PanneauFiltresCoches';
import BoiteFiltre from '../liste/BoiteFiltre';
import { Input } from '../ui/input';
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
}: Readonly<{
  filtres: FiltresHistorique;
  onChange: (patch: Partial<FiltresHistorique>) => void;
  onReinitialiser: () => void;
  ferme: boolean;
  onBasculer: () => void;
  options: { societes: Option[]; projets: Option[]; tranches: Option[]; statuts: Option[]; champsDate: Option[]; commerciaux: Option[] };
}>) {
  const unique = (valeur: string) => valeur || null;
  const puces = [
    ...puceUnique(options.societes, unique(filtres.societeId)),
    ...puceUnique(options.projets, unique(filtres.projet)),
    ...puceSelection('Tranche', options.tranches, filtres.trancheIds),
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
      <BoiteFiltre titre="Société" mode="unique" items={options.societes} valeur={unique(filtres.societeId)} onChange={(v) => onChange({ societeId: v ?? '' })} />
      <BoiteFiltre titre="Projet" mode="unique" items={options.projets} valeur={unique(filtres.projet)} onChange={(v) => onChange({ projet: v ?? '' })} />
      <BoiteFiltre titre="Tranche" mode="multiple" items={options.tranches} valeur={filtres.trancheIds} onChange={(v) => onChange({ trancheIds: v })} />
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
