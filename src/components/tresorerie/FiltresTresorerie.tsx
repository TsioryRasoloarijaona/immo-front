import ChoixUnique from '../ChoixUnique';
import BoiteFiltre, { CLASSE_LIGNE, CadreBoiteFiltre } from '../liste/BoiteFiltre';
import PanneauFiltresCoches from '../liste/PanneauFiltresCoches';
import { cleFiltresFermes, useBooleenMemorise } from '../../lib/outilsListe';
import { puceSelection, puceUnique } from '../../lib/pucesFiltres';
import { ITEMS_DATE_TRESORERIE, ITEMS_STATUT_TRESORERIE, type EtatFiltresTresorerie } from '../../lib/tresorerie';
import { useReferentielsProjet } from '../../pages/projet/hooks';
import type { DateTresorerie } from '../../types/tresorerie';

export default function FiltresTresorerie({
  cle,
  etat,
  onChange,
  onReinitialiser,
}: Readonly<{
  cle: string;
  etat: EtatFiltresTresorerie;
  onChange: (partiel: Partial<EtatFiltresTresorerie>) => void;
  onReinitialiser: () => void;
}>) {
  const [ferme, basculer] = useBooleenMemorise(cleFiltresFermes(cle));
  const referentiels = useReferentielsProjet();
  const societes = (referentiels.data?.entites ?? []).map((s) => ({ value: s.id, label: s.libelle ?? s.code ?? '—' }));
  const projets = (referentiels.data?.projets ?? []).map((p) => ({ value: p.id, label: p.code ?? p.description ?? '—' }));

  return (
    <PanneauFiltresCoches
      ferme={ferme}
      onBasculer={basculer}
      puces={[
        ...puceUnique(societes, etat.societeId),
        ...puceSelection('Projet', projets, etat.projetIds),
        ...(etat.sansProjet ? ['Sans projet'] : []),
        ...puceSelection('Statut', ITEMS_STATUT_TRESORERIE, etat.statuts),
        ...(etat.inclureAnnules ? [] : ['Sans les annulés']),
      ]}
      champDate={{ items: ITEMS_DATE_TRESORERIE, valeur: etat.dateSur, onChange: (v) => onChange({ dateSur: v as DateTresorerie }) }}
      periode={{ debut: etat.du, fin: etat.au, onChange: (du, au) => onChange({ du, au }) }}
      recherche={{ valeur: etat.recherche, onChange: (recherche) => onChange({ recherche }), placeholder: 'Rechercher…' }}
      onReinitialiser={onReinitialiser}
      champs={
        <label className="flex items-center gap-1.5 text-body text-foreground">
          <input type="checkbox" checked={etat.inclureAnnules} onChange={(e) => onChange({ inclureAnnules: e.target.checked })} />
          Inclure les annulés
        </label>
      }
    >
      <div className="flex max-w-62.5 min-w-32.5 flex-[1_1_160px] flex-col gap-1">
        <span className="truncate pl-0.5 text-micro font-semibold tracking-wide text-muted-foreground uppercase">Société</span>
        <ChoixUnique items={societes} tous="Tous" value={etat.societeId} placeholder="Tous" largeur="w-full" onChange={(v) => onChange({ societeId: v })} />
      </div>
      <BoiteFiltre titre="Projets" mode="multiple" items={projets} valeur={etat.projetIds} onChange={(projetIds) => onChange({ projetIds })} />
      <CadreBoiteFiltre titre="Projet vide">
        <label className={CLASSE_LIGNE}>
          <input type="checkbox" className="m-0 accent-(--brand)" checked={etat.sansProjet} onChange={(e) => onChange({ sansProjet: e.target.checked })} />
          <span className="truncate">Sans projet</span>
        </label>
      </CadreBoiteFiltre>
      <BoiteFiltre titre="Statuts" mode="multiple" coches items={ITEMS_STATUT_TRESORERIE} valeur={etat.statuts} onChange={(statuts) => onChange({ statuts })} />
    </PanneauFiltresCoches>
  );
}
