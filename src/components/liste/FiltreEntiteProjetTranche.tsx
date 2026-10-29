import BoiteFiltre from './BoiteFiltre';
import type { CascadeTranches, SelectionCascade } from '../../lib/cascadeTranches';

/** Les trois boîtes Entité → Projet → Tranche, à placer dans le `PanneauFiltresCoches` de l'écran. */
export default function FiltreEntiteProjetTranche({
  valeur,
  onChange,
  cascade,
}: Readonly<{ valeur: SelectionCascade; onChange: (v: SelectionCascade) => void; cascade: CascadeTranches }>) {
  return (
    <>
      <BoiteFiltre titre="Entité" mode="multiple" items={cascade.entites} valeur={valeur.entiteId} onChange={(v) => onChange(cascade.changer('entiteId', v))} />
      <BoiteFiltre titre="Projet" mode="multiple" items={cascade.projets} valeur={valeur.projetId} onChange={(v) => onChange(cascade.changer('projetId', v))} />
      <BoiteFiltre
        titre="Tranche"
        mode="multiple"
        coches
        items={cascade.tranches}
        valeur={valeur.trancheId}
        onChange={(v) => onChange(cascade.changer('trancheId', v))}
      />
    </>
  );
}
