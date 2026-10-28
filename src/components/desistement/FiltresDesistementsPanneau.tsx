import PanneauFiltresCoches from '../liste/PanneauFiltresCoches';
import BoiteFiltre from '../liste/BoiteFiltre';
import { InputGroup, InputGroupInput } from '../ui/input-group';
import { puceUnique } from '../../lib/pucesFiltres';
import { PLAGES_DESISTEMENTS, type FiltresDesistements } from '../../lib/desistements';

/** Plages autres que la demande (portée par la période du panneau) : validation et légalisation. */
const PLAGES_SUP = PLAGES_DESISTEMENTS.slice(1);

/** Filtres serveur de « Désistements » ; `changer` remet la pagination à zéro côté page. */
export default function FiltresDesistementsPanneau({
  filtres,
  changer,
  reinitialiser,
  ferme,
  onBasculer,
  tranches,
}: Readonly<{
  filtres: FiltresDesistements;
  changer: <K extends keyof FiltresDesistements>(cle: K, valeur: FiltresDesistements[K]) => void;
  reinitialiser: () => void;
  ferme: boolean;
  onBasculer: () => void;
  tranches: { label: string; value: string }[];
}>) {
  const puces = [...puceUnique(tranches, filtres.trancheId), ...(filtres.q ? [`« ${filtres.q} »`] : [])];

  return (
    <PanneauFiltresCoches
      ferme={ferme}
      onBasculer={onBasculer}
      puces={puces}
      periode={{
        debut: filtres.demandeDu,
        fin: filtres.demandeAu,
        onChange: (debut, fin) => {
          changer('demandeDu', debut);
          changer('demandeAu', fin);
        },
      }}
      recherche={{
        valeur: filtres.q,
        onChange: (v) => changer('q', v),
        placeholder: 'N° de demande, dossier, client…',
      }}
      onReinitialiser={reinitialiser}
      champs={PLAGES_SUP.map((p) => (
        <div key={p.label} className="flex items-center gap-1.5">
          <span className="text-micro font-medium text-muted-foreground">{p.label}</span>
          <InputGroup className="w-32.5">
            <InputGroupInput type="date" aria-label={`${p.label} du`} value={filtres[p.du]} onChange={(e) => changer(p.du, e.target.value)} />
          </InputGroup>
          <InputGroup className="w-32.5">
            <InputGroupInput type="date" aria-label={`${p.label} au`} value={filtres[p.au]} onChange={(e) => changer(p.au, e.target.value)} />
          </InputGroup>
        </div>
      ))}
    >
      <BoiteFiltre titre="Tranche" mode="unique" items={tranches} valeur={filtres.trancheId} onChange={(v) => changer('trancheId', v)} />
    </PanneauFiltresCoches>
  );
}
