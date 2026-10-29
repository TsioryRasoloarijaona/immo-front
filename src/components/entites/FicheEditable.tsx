import { useEffect, useState, type ReactNode, type RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import PiedSaisie from '../patrimoine/PiedSaisie';
import SectionsSaisie, { type ListesChoix } from '../patrimoine/SectionsSaisie';
import type { OngletFiche } from '../FicheShell';
import LignesActionnaires from './LignesActionnaires';
import AdminGuard from '../../pages/utilisateurs/AdminGuard';
import { Button } from '../ui/button';
import { lignesDe, lignesFil, rangeesDepuis, type ChampLigne, type RangeeActionnaire } from '../../lib/lignesActionnaires';
import { brouillonDepuis, champsDe, corpsDepuis, useSaisie, type Brouillon, type SectionSaisie } from '../../lib/saisiePatrimoine';
import type { RessourceFichePdf } from '../../types';

type Corps = Record<string, unknown>;

export interface Tracee {
  id: string;
  code?: string;
  description?: string;
  creePar?: string;
  creeLe?: string | null;
  modifiePar?: string;
  modifieLe?: string | null;
}

/** Ce que reçoit `apresChamp` pour réagir à une saisie (groupe choisi → répartition recalculée). */
export interface ContexteSaisie {
  id?: string;
  brouillon: Brouillon;
  modifier: (nom: string, valeur: string) => void;
  remplacerLignes: (lignes: RangeeActionnaire[]) => void;
}

export interface ConfigFiche<T extends Tracee> {
  /** Liste parente : `/actionnaires` ; la fiche est `<chemin>/<id>`. */
  chemin: string;
  libelleListe: string;
  titreCreation: string;
  icon: ReactNode;
  sections: SectionSaisie[];
  listes?: ListesChoix;
  /** Lignes d'actionnaires portées par la fiche, envoyées dans le même corps (`repartition`, `lignes`). */
  lignes?: { cle: 'repartition' | 'lignes'; champ: ChampLigne; titre: string };
  libelleEdition: string;
  messageSuppression: string;
  charger: (id: string) => Promise<T>;
  creer: (corps: Corps) => Promise<{ id: string }>;
  modifier: (id: string, corps: Corps) => Promise<unknown>;
  supprimer: (id: string) => Promise<void>;
  apresChamp?: (nom: string, valeur: string | boolean, contexte: ContexteSaisie) => void;
  /** Champs grisés à la création (le groupe exige l'id de l'entité pour charger la répartition). */
  verrouillesCreation?: string[];
  /** Présent : bouton « Imprimer » (PDF de la fiche) dans le ruban. */
  ressourceFichePdf?: RessourceFichePdf;
  /** Actions du ruban propres à l'écran (bascule Active de l'entité). */
  actions?: (fiche: T, recharger: () => void) => ReactNode;
  /** Onglets du bas en plus des sections et de la répartition. */
  onglets?: (fiche: T) => OngletFiche[];
}

/** Création (`/x/nouveau`) en pleine page ; la fiche d'un enregistrement existant est `FicheEditableFenetre`. */
export default function FicheEditable<T extends Tracee>({ config }: Readonly<{ config: ConfigFiche<T> }>) {
  return (
    <AdminGuard title={config.titreCreation} icon={config.icon}
      crumbs={[{ label: config.libelleListe, to: config.chemin }, { label: config.titreCreation }]}>
      <Saisie config={config} />
    </AdminGuard>
  );
}

/**
 * Formulaire de saisie (création ou modification). `declencheur` reçoit la fonction d'envoi : le bouton
 * « Enregistrer » du ruban de la fenêtre l'appelle.
 */
export function Saisie<T extends Tracee>({ config, fiche, onAnnuler, onEnregistre, declencheurRef }: Readonly<{
  config: ConfigFiche<T>;
  fiche?: T;
  onAnnuler?: () => void;
  onEnregistre?: () => void;
  declencheurRef?: RefObject<(() => void) | null>;
}>) {
  const navigate = useNavigate();
  const champs = champsDe(config.sections);
  const initial = brouillonDepuis(champs, fiche);
  const saisie = useSaisie(champs, initial);
  const lignes = config.lignes;
  const rangeesInitiales = lignes ? rangeesDepuis(lignesDe(fiche, lignes.cle), lignes.champ) : [];
  const [rangees, setRangees] = useState(rangeesInitiales);

  function changer(nom: string, valeur: string | boolean) {
    saisie.modifier(nom, valeur);
    config.apresChamp?.(nom, valeur, { id: fiche?.id, brouillon: saisie.brouillon, modifier: saisie.modifier, remplacerLignes: setRangees });
  }

  function enregistrer() {
    const corps = corpsDepuis(champs, saisie.brouillon, fiche ? initial : undefined);
    if (lignes) {
      const fil = lignesFil(rangees, lignes.champ);
      if (!fiche || JSON.stringify(fil) !== JSON.stringify(lignesFil(rangeesInitiales, lignes.champ))) corps[lignes.cle] = fil;
    }
    if (fiche) void saisie.envoyer(() => config.modifier(fiche.id, corps), () => onEnregistre?.());
    else void saisie.envoyer(() => config.creer(corps), (cree) => void navigate(`${config.chemin}/${cree.id}`));
  }

  useEffect(() => {
    if (!declencheurRef) return undefined;
    declencheurRef.current = enregistrer;
    return () => {
      declencheurRef.current = null;
    };
  });

  return (
    <div className="flex max-w-240 flex-col gap-3">
      <SectionsSaisie sections={config.sections} brouillon={saisie.brouillon} onChange={changer} listes={config.listes}
        verrouilles={fiche ? undefined : config.verrouillesCreation}
        champErreur={saisie.champErreur} messageErreur={saisie.erreur} />
      {lignes && <LignesActionnaires titre={lignes.titre} champ={lignes.champ} rangees={rangees} onChange={setRangees} />}
      <PiedSaisie erreur={saisie.erreur} envoi={saisie.envoi} onEnregistrer={enregistrer}
        libelle={fiche ? 'Enregistrer' : 'Créer'} />
      {onAnnuler && <Button type="button" variant="ghost" size="sm" className="self-end" onClick={onAnnuler}>Annuler</Button>}
    </div>
  );
}
