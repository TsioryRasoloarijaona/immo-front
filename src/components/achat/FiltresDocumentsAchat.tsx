import ChoixUnique from '../ChoixUnique';
import BoiteFiltre, { CLASSE_LIGNE, CadreBoiteFiltre } from '../liste/BoiteFiltre';
import PanneauFiltresCoches from '../liste/PanneauFiltresCoches';
import type { EtatFiltresAchat } from '../../lib/documentsAchat';
import { puceSelection, puceUnique } from '../../lib/pucesFiltres';
import type { ReferentielsAchatDto } from '../../types/achat';

/** Panneau de filtres des pièces d'achat : rien coché = tout, le fournisseur est une liste déroulante. */
export default function FiltresDocumentsAchat({
  etat,
  referentiels,
  ferme,
  onBasculer,
  onChange,
  onReinitialiser,
}: Readonly<{
  etat: EtatFiltresAchat;
  referentiels: ReferentielsAchatDto | undefined;
  ferme: boolean;
  onBasculer: () => void;
  onChange: (patch: Partial<EtatFiltresAchat>) => void;
  onReinitialiser: () => void;
}>) {
  const natures = (referentiels?.natures ?? []).map((n) => ({ value: n.code, label: n.libelle }));
  const statuts = (referentiels?.statuts ?? []).map((s) => ({ value: s.id, label: s.description ?? s.code ?? '—' }));
  const projets = (referentiels?.projets ?? []).map((p) => ({ value: p.id, label: p.code ?? p.description ?? '—' }));
  const fournisseurs = (referentiels?.fournisseurs ?? []).map((f) => ({ value: f.id, label: f.nom ?? '—' }));

  const puces = [
    ...puceSelection('Nature', natures, etat.natures),
    ...puceSelection('Statut', statuts, etat.statutIds),
    ...puceSelection('Projet', projets, etat.projetIds),
    ...puceUnique(fournisseurs, etat.fournisseurId),
    ...(etat.nonSoldes ? ['Non soldées'] : []),
    ...(etat.okPourPaiement ? ['Validées seulement'] : []),
    ...(etat.search ? [`« ${etat.search} »`] : []),
  ];

  return (
    <PanneauFiltresCoches
      ferme={ferme}
      onBasculer={onBasculer}
      puces={puces}
      periode={{ debut: etat.du, fin: etat.au, onChange: (du, au) => onChange({ du, au }) }}
      recherche={{ valeur: etat.search, onChange: (search) => onChange({ search }), placeholder: 'Code, référence, fournisseur…' }}
      onReinitialiser={onReinitialiser}
    >
      <BoiteFiltre titre="Nature" mode="multiple" items={natures} valeur={etat.natures} onChange={(natures) => onChange({ natures })} />
      <BoiteFiltre titre="Statut" mode="multiple" items={statuts} valeur={etat.statutIds} onChange={(statutIds) => onChange({ statutIds })} />
      <BoiteFiltre titre="Projet" mode="multiple" items={projets} valeur={etat.projetIds} onChange={(projetIds) => onChange({ projetIds })} />
      <div className="flex max-w-62.5 min-w-32.5 flex-[1_1_160px] flex-col gap-1">
        <span className="truncate pl-0.5 text-micro font-semibold tracking-wide text-muted-foreground uppercase">Fournisseur</span>
        <ChoixUnique
          items={fournisseurs}
          tous="Tous"
          value={etat.fournisseurId}
          placeholder="Tous"
          largeur="w-full"
          onChange={(fournisseurId) => onChange({ fournisseurId })}
        />
      </div>
      <CadreBoiteFiltre titre="Options">
        <label className={CLASSE_LIGNE}>
          <input type="checkbox" className="m-0 accent-(--brand)" checked={etat.nonSoldes} onChange={(e) => onChange({ nonSoldes: e.target.checked })} />
          <span className="truncate">Non soldées</span>
        </label>
        <label className={CLASSE_LIGNE}>
          <input
            type="checkbox"
            className="m-0 accent-(--brand)"
            checked={etat.okPourPaiement}
            onChange={(e) => onChange({ okPourPaiement: e.target.checked })}
          />
          <span className="truncate">Validées seulement</span>
        </label>
      </CadreBoiteFiltre>
    </PanneauFiltresCoches>
  );
}
