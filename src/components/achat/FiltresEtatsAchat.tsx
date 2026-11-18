import ChoixUnique from '../ChoixUnique';
import BoiteFiltre from '../liste/BoiteFiltre';
import PanneauFiltresCoches from '../liste/PanneauFiltresCoches';
import { Input } from '../ui/input';
import { getReferentielsAchat } from '../../lib/apiAchat';
import type { EtatFiltresAchat } from '../../lib/etatsAchat';
import { puceSelection } from '../../lib/pucesFiltres';
import { useApi } from '../../lib/useApi';

/** Panneau des états Achat : période, projets, société ; `textes` ajoute Tier / Projet / Lot (suivis). */
export default function FiltresEtatsAchat({ etat, textes }: Readonly<{ etat: EtatFiltresAchat; textes?: boolean }>) {
  const referentiels = useApi(() => getReferentielsAchat(), [], 'achat-referentiels');
  const societes = (referentiels.data?.societes ?? []).map((s) => ({ value: s.id, label: s.code ?? s.description ?? '—' }));
  const projets = (referentiels.data?.projets ?? []).map((p) => ({ value: p.id, label: p.code ?? p.description ?? '—' }));
  const t = etat.textes;
  const champsTexte = [
    { libelle: 'Tier', valeur: t.tiers, onChange: t.setTiers },
    { libelle: 'Projet', valeur: t.projet, onChange: t.setProjet },
    { libelle: 'Lot', valeur: t.lot, onChange: t.setLot },
  ];
  const puces = [
    ...puceSelection('Projet', projets, etat.projetIds),
    ...(etat.societe ? [societes.find((s) => s.value === etat.societe)?.label ?? etat.societe] : []),
    ...champsTexte.filter((c) => c.valeur.trim()).map((c) => `${c.libelle} « ${c.valeur.trim()} »`),
  ];

  return (
    <PanneauFiltresCoches
      ferme={etat.ferme}
      onBasculer={etat.basculer}
      puces={puces}
      periode={{ debut: etat.periode.debut, fin: etat.periode.fin, onChange: (debut, fin) => etat.setPeriode({ debut, fin }) }}
      onReinitialiser={etat.reinitialiser}
      champs={
        textes &&
        champsTexte.map((c) => (
          <Input
            key={c.libelle}
            className="w-32"
            aria-label={c.libelle}
            placeholder={`${c.libelle}…`}
            value={c.valeur}
            onChange={(e) => c.onChange(e.target.value)}
          />
        ))
      }
    >
      <BoiteFiltre titre="Projets" mode="multiple" items={projets} valeur={etat.projetIds} onChange={etat.setProjetIds} />
      <div className="flex max-w-62.5 min-w-32.5 flex-[1_1_160px] flex-col gap-1">
        <span className="truncate pl-0.5 text-micro font-semibold tracking-wide text-muted-foreground uppercase">Société</span>
        <ChoixUnique items={societes} tous="Toutes" value={etat.societe} placeholder="Toutes" largeur="w-full" onChange={etat.setSociete} />
      </div>
    </PanneauFiltresCoches>
  );
}
