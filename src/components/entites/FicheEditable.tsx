import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import PageShell from '../PageShell';
import ActionAdmin from '../patrimoine/ActionAdmin';
import BoutonImprimerFiche from '../patrimoine/BoutonImprimerFiche';
import FicheSections from '../patrimoine/FicheSections';
import PiedSaisie from '../patrimoine/PiedSaisie';
import SectionsSaisie, { type ListesChoix } from '../patrimoine/SectionsSaisie';
import LignesActionnaires from './LignesActionnaires';
import AdminGuard from '../../pages/utilisateurs/AdminGuard';
import { Card, ErrorState, Field, FieldGrid, LoadingState } from '../ui';
import { Button } from '../ui/button';
import { useConfirm } from '../../lib/confirmContext';
import { libelleTrace } from '../../lib/format';
import { lignesFil, rangeesDepuis, type ChampLigne, type LigneFil, type RangeeActionnaire } from '../../lib/lignesActionnaires';
import { brouillonDepuis, champsDe, corpsDepuis, useSaisie, type Brouillon, type SectionSaisie } from '../../lib/saisiePatrimoine';
import { useApi } from '../../lib/useApi';
import type { RessourceFichePdf } from '../../types';

type Corps = Record<string, unknown>;

interface Tracee {
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
  /** Présent : bouton « Imprimer » (PDF de la fiche) en tête. */
  ressourceFichePdf?: RessourceFichePdf;
  /** Actions d'en-tête propres à l'écran (bascule Active de l'entité). */
  actions?: (fiche: T, recharger: () => void) => ReactNode;
  pied?: (fiche: T) => ReactNode;
}

const lignesDe = (source: object | undefined, cle: string) => (source as Record<string, LigneFil[] | null> | undefined)?.[cle];

/** Fiche en lecture seule à l'ouverture, « Débloquer » / « Modifier » (Administrateur) → saisie ; `id` absent = création. */
export default function FicheEditable<T extends Tracee>({ id, config }: Readonly<{ id?: string; config: ConfigFiche<T> }>) {
  if (!id) {
    return (
      <AdminGuard title={config.titreCreation} icon={config.icon}
        crumbs={[{ label: config.libelleListe, to: config.chemin }, { label: config.titreCreation }]}>
        <Saisie config={config} />
      </AdminGuard>
    );
  }
  return <FicheExistante key={id} id={id} config={config} />;
}

function FicheExistante<T extends Tracee>({ id, config }: Readonly<{ id: string; config: ConfigFiche<T> }>) {
  const { data: fiche, error, refetch } = useApi(() => config.charger(id), [id]);
  const [edition, setEdition] = useState(false);
  const [erreurSuppression, setErreurSuppression] = useState<string | null>(null);
  const navigate = useNavigate();
  const confirm = useConfirm();
  const recharger = () => void refetch();

  async function supprimer() {
    if (!(await confirm({ title: 'Supprimer', message: config.messageSuppression, confirmLabel: 'Supprimer' }))) return;
    try {
      await config.supprimer(id);
      void navigate(config.chemin);
    } catch (err) {
      setErreurSuppression(err instanceof Error ? err.message : 'Suppression impossible.');
    }
  }

  if (error) return <PageShell title={config.libelleListe}><ErrorState message={error} /></PageShell>;
  if (!fiche) return <PageShell title={config.libelleListe}><LoadingState /></PageShell>;

  return (
    <PageShell
      title={fiche.description || fiche.code || config.libelleListe}
      crumbs={[{ label: config.libelleListe, to: config.chemin }, { label: fiche.code ?? '' }]}
      icon={config.icon}
      actions={!edition && (
        <div className="flex flex-wrap gap-2">
          {config.ressourceFichePdf && <BoutonImprimerFiche ressource={config.ressourceFichePdf} id={fiche.id} />}
          {config.actions?.(fiche, recharger)}
          <ActionAdmin onClick={() => void supprimer()} libelle="Supprimer" variant="outline" icone={<Trash2 data-icon="inline-start" />} />
          <ActionAdmin onClick={() => setEdition(true)} libelle={config.libelleEdition} icone={<Pencil data-icon="inline-start" />} />
        </div>
      )}
    >
      {erreurSuppression && <p role="alert" className="mb-3 text-label text-destructive">{erreurSuppression}</p>}
      {edition ? (
        <Saisie config={config} fiche={fiche} onAnnuler={() => setEdition(false)}
          onEnregistre={() => { setEdition(false); recharger(); }} />
      ) : (
        <div className="flex flex-col gap-3">
          <FicheSections sections={config.sections} source={fiche} />
          {config.lignes && (
            <LignesActionnaires titre={config.lignes.titre} champ={config.lignes.champ}
              rangees={rangeesDepuis(lignesDe(fiche, config.lignes.cle), config.lignes.champ)} />
          )}
          <Card title="Traçabilité">
            <FieldGrid>
              <Field label="Créé par" value={libelleTrace(fiche.creePar, fiche.creeLe)} />
              <Field label="Modifié par" value={libelleTrace(fiche.modifiePar, fiche.modifieLe)} />
            </FieldGrid>
          </Card>
          {config.pied?.(fiche)}
        </div>
      )}
    </PageShell>
  );
}

function Saisie<T extends Tracee>({ config, fiche, onAnnuler, onEnregistre }: Readonly<{
  config: ConfigFiche<T>;
  fiche?: T;
  onAnnuler?: () => void;
  onEnregistre?: () => void;
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
