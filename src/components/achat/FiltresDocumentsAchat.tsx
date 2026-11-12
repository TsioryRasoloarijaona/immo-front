import ChoixUnique from '../ChoixUnique';
import MultiSelectDropdown from '../MultiSelectDropdown';
import { Input } from '../ui/input';
import BoiteFiltre, { CLASSE_LIGNE, CadreBoiteFiltre } from '../liste/BoiteFiltre';
import PanneauFiltresCoches from '../liste/PanneauFiltresCoches';
import ChoixPeriodeAchat from './ChoixPeriodeAchat';
import type { EtatFiltresAchat, TroisEtats } from '../../lib/documentsAchat';
import { puceSelection, puceUnique } from '../../lib/pucesFiltres';
import type { VueAchat } from '../../lib/vuesAchat';
import type { ReferentielsAchatDto } from '../../types/achat';

const CLASSE_CHAMP = 'flex max-w-62.5 min-w-32.5 flex-[1_1_160px] flex-col gap-1';
const CLASSE_TITRE = 'truncate pl-0.5 text-micro font-semibold tracking-wide text-muted-foreground uppercase';
const ETATS: { valeur: TroisEtats; libelle: string }[] = [
  { valeur: 'tous', libelle: 'Tous' },
  { valeur: 'oui', libelle: 'Oui' },
  { valeur: 'non', libelle: 'Non' },
];

type Item = { value: string; label: string };

function Deroulant({ titre, items, valeur, onChange }: Readonly<{ titre: string; items: Item[]; valeur: string[]; onChange: (valeur: string[]) => void }>) {
  return (
    <div className={CLASSE_CHAMP}>
      <span className={CLASSE_TITRE}>{titre}</span>
      <MultiSelectDropdown ariaLabel={titre} placeholder="Tous" items={items} value={valeur} onChange={onChange} className="max-w-none" />
    </div>
  );
}

function BoiteTroisEtats({ titre, valeur, onChange }: Readonly<{ titre: string; valeur: TroisEtats; onChange: (valeur: TroisEtats) => void }>) {
  return (
    <CadreBoiteFiltre titre={titre}>
      {ETATS.map((e) => (
        <label key={e.valeur} className={CLASSE_LIGNE}>
          <input type="radio" name={titre} className="m-0 accent-(--brand)" checked={valeur === e.valeur} onChange={() => onChange(e.valeur)} />
          <span className="truncate">{e.libelle}</span>
        </label>
      ))}
    </CadreBoiteFiltre>
  );
}

function BoiteMontant({ etat, onChange }: Readonly<{ etat: EtatFiltresAchat; onChange: (patch: Partial<EtatFiltresAchat>) => void }>) {
  return (
    <CadreBoiteFiltre titre="Net à payer">
      <div className="flex items-center gap-2 px-1.5 pb-1 text-body text-muted-foreground">
        de
        <Input type="number" aria-label="Net à payer de" value={etat.montantDe} onChange={(e) => onChange({ montantDe: e.target.value })} />
      </div>
      <div className="flex items-center gap-2 px-1.5 text-body text-muted-foreground">
        à
        <Input type="number" aria-label="Net à payer à" value={etat.montantA} onChange={(e) => onChange({ montantA: e.target.value })} />
      </div>
    </CadreBoiteFiltre>
  );
}

/** Panneau de filtres des pièces d'achat : rien coché = tout ; Entité, Projet, Fournisseur et Lot sont des listes déroulantes. */
export default function FiltresDocumentsAchat({
  vue,
  etat,
  referentiels,
  ferme,
  onBasculer,
  onChange,
  onReinitialiser,
}: Readonly<{
  vue: VueAchat;
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
  const societes = (referentiels?.societes ?? []).map((s) => ({ value: s.id, label: s.description ?? s.code ?? '—' }));
  const modules = (referentiels?.modules ?? []).map((m) => ({ value: m.code, label: m.libelle }));
  const lots = (referentiels?.typesLot ?? []).map((t) => ({ value: t.id, label: t.libelle ?? t.code ?? '—' }));

  const puces = [
    ...puceSelection('Entité', societes, etat.societeIds),
    ...puceSelection('Module', modules, etat.modules),
    ...(vue.filtres.nature ? puceSelection('Nature', natures, etat.natures) : []),
    ...(vue.filtres.statut ? puceSelection('Statut', statuts, etat.statutIds) : []),
    ...(vue.filtres.projet ? puceSelection('Projet', projets, etat.projetIds) : []),
    ...(vue.filtres.lot ? puceSelection('Lot', lots, etat.typeLotIds) : []),
    ...puceUnique(fournisseurs, etat.fournisseurId),
    ...(etat.comptabilise === 'tous' ? [] : [`Comptabilisé : ${etat.comptabilise}`]),
    ...(etat.archive === 'tous' ? [] : [`Archivé : ${etat.archive}`]),
    ...(etat.nonSoldes ? ['Non soldées'] : []),
    ...(etat.okPourPaiement ? ['Validées seulement'] : []),
    ...(etat.search ? [`« ${etat.search} »`] : []),
  ];

  return (
    <PanneauFiltresCoches
      ferme={ferme}
      onBasculer={onBasculer}
      puces={puces}
      champs={<ChoixPeriodeAchat etat={etat} onChange={onChange} />}
      recherche={{ valeur: etat.search, onChange: (search) => onChange({ search }), placeholder: 'Code, référence, fournisseur…' }}
      onReinitialiser={onReinitialiser}
    >
      <Deroulant titre="Entité" items={societes} valeur={etat.societeIds} onChange={(societeIds) => onChange({ societeIds })} />
      <Deroulant titre="Module" items={modules} valeur={etat.modules} onChange={(m) => onChange({ modules: m })} />
      {vue.filtres.nature && <BoiteFiltre titre="Nature" mode="multiple" items={natures} valeur={etat.natures} onChange={(n) => onChange({ natures: n })} />}
      {vue.filtres.statut && <BoiteFiltre titre="Statut" mode="multiple" items={statuts} valeur={etat.statutIds} onChange={(statutIds) => onChange({ statutIds })} />}
      {vue.filtres.projet && <Deroulant titre="Projet" items={projets} valeur={etat.projetIds} onChange={(projetIds) => onChange({ projetIds })} />}
      {vue.filtres.lot && <Deroulant titre="Lot" items={lots} valeur={etat.typeLotIds} onChange={(typeLotIds) => onChange({ typeLotIds })} />}
      <div className={CLASSE_CHAMP}>
        <span className={CLASSE_TITRE}>Fournisseur</span>
        <ChoixUnique
          items={fournisseurs}
          tous="Tous"
          value={etat.fournisseurId}
          placeholder="Tous"
          largeur="w-full"
          onChange={(fournisseurId) => onChange({ fournisseurId })}
        />
      </div>
      <BoiteTroisEtats titre="Comptabilisé" valeur={etat.comptabilise} onChange={(comptabilise) => onChange({ comptabilise })} />
      <BoiteTroisEtats titre="Archivé" valeur={etat.archive} onChange={(archive) => onChange({ archive })} />
      <BoiteMontant etat={etat} onChange={onChange} />
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
