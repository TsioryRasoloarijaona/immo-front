import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import BarreFicheLot from '../../components/projet/BarreFicheLot';
import ModaleTransitionLot from '../../components/projet/ModaleTransitionLot';
import { EmptyState } from '../../components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { ApiError } from '../../lib/api';
import { copierLot, getLot, modifierLot } from '../../lib/apiProjet';
import { MESSAGE_SANS_DROIT } from '../../lib/genresLot';
import { useChampsLot } from '../../lib/saisieLot';
import type { LotDetailDto } from '../../types/projet';
import { EtatFiche } from './commun';
import EnteteLot from './fiche-lot/EnteteLot';
import OngletAutres from './fiche-lot/OngletAutres';
import OngletDates from './fiche-lot/OngletDates';
import OngletDemandesAchat from './fiche-lot/OngletDemandesAchat';
import OngletGeneral from './fiche-lot/OngletGeneral';
import OngletOptions from './fiche-lot/OngletOptions';
import OngletReclamations from './fiche-lot/OngletReclamations';
import OngletResiliation from './fiche-lot/OngletResiliation';
import { useFiche, useReferentielsProjet } from './hooks';
import { OngletBordereau, OngletDecomptes, OngletFactures, OngletReglements } from './OngletsLot';

const MESSAGE_LECTURE_SEULE = 'Ce lot est en lecture seule dans son statut actuel.';
const REPLI_ENREGISTREMENT = "L'enregistrement a échoué.";
const A_VENIR = <EmptyState title="Onglet disponible avec le lot suivant" />;

function messageErreur(err: unknown, repli: string): string {
  return err instanceof Error ? err.message : repli;
}

function FicheLot({ lotInitial }: Readonly<{ lotInitial: LotDetailDto }>) {
  const navigate = useNavigate();
  const referentiels = useReferentielsProjet();
  const [lot, setLot] = useState(lotInitial);
  const { champs, maj, corps, modifie, reinitialiser } = useChampsLot(lot);
  const [enCours, setEnCours] = useState(false);
  const [lectureSeule, setLectureSeule] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [transition, setTransition] = useState(false);

  function adopter(nouveau: LotDetailDto) {
    setLot(nouveau);
    reinitialiser(nouveau);
    setEnCours(false);
    setLectureSeule(false);
  }

  function echec(err: unknown, repli: string) {
    setEnCours(false);
    if (err instanceof ApiError && err.status === 404) void navigate('/projet/lots');
    else if (err instanceof ApiError && err.status === 403) setMessage(MESSAGE_SANS_DROIT);
    else if (err instanceof ApiError && err.status === 409 && repli === REPLI_ENREGISTREMENT) {
      setLectureSeule(true);
      setMessage(MESSAGE_LECTURE_SEULE);
    } else setMessage(messageErreur(err, repli));
  }

  function lancer(action: Promise<LotDetailDto>, repli: string, apres: (l: LotDetailDto) => void) {
    setEnCours(true);
    setMessage(null);
    action.then(apres).catch((err: unknown) => echec(err, repli));
  }

  const recharger = () => lancer(getLot(lot.id), 'Le rechargement a échoué.', adopter);
  const enregistrer = () => lancer(modifierLot(lot.id, corps), REPLI_ENREGISTREMENT, adopter);
  const copier = () => lancer(copierLot(lot.id), 'La copie a échoué.', (copie) => void navigate(`/projet/lots/${copie.id}`));
  const onglet = { champs, maj, lectureSeule };

  return (
    <PageShell
      title={`Lot ${lot.code ?? ''}`}
      crumbs={[{ label: 'Lots', to: '/projet/lots' }, { label: lot.code ?? '…' }]}
    >
      <BarreFicheLot
        modifie={modifie && champs.description !== null}
        enCours={enCours}
        lectureSeule={lectureSeule}
        onEnregistrer={enregistrer}
        onAnnuler={recharger}
        onCopier={copier}
        onRafraichir={recharger}
        onTransition={() => setTransition(true)}
      />
      {message && <p role="alert" className="px-4 pt-2 text-body text-destructive md:px-7">{message}</p>}
      <div className="flex flex-col gap-3 p-4 md:px-7">
        <EnteteLot lot={lot} referentiels={referentiels.data} {...onglet} />
        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="demandes">Demande interne d'achat</TabsTrigger>
            <TabsTrigger value="suivi">Suivi</TabsTrigger>
            <TabsTrigger value="retenues">Retenues</TabsTrigger>
            <TabsTrigger value="dates">Dates</TabsTrigger>
            <TabsTrigger value="options">Options</TabsTrigger>
            <TabsTrigger value="resiliation">Résiliation</TabsTrigger>
            <TabsTrigger value="reclamations">Réclamations</TabsTrigger>
            <TabsTrigger value="autres">Autres</TabsTrigger>
          </TabsList>
          <TabsContent value="general"><OngletGeneral lot={lot} {...onglet} /></TabsContent>
          <TabsContent value="demandes"><OngletDemandesAchat lotId={lot.id} /></TabsContent>
          <TabsContent value="suivi">{A_VENIR}</TabsContent>
          <TabsContent value="retenues">{A_VENIR}</TabsContent>
          <TabsContent value="dates"><OngletDates {...onglet} /></TabsContent>
          <TabsContent value="options"><OngletOptions lot={lot} {...onglet} /></TabsContent>
          <TabsContent value="resiliation"><OngletResiliation {...onglet} /></TabsContent>
          <TabsContent value="reclamations"><OngletReclamations /></TabsContent>
          <TabsContent value="autres"><OngletAutres {...onglet} /></TabsContent>
        </Tabs>
        <Tabs defaultValue="decomptes">
          <TabsList>
            <TabsTrigger value="decomptes">Décomptes</TabsTrigger>
            <TabsTrigger value="factures">Factures</TabsTrigger>
            <TabsTrigger value="reglements">Règlements</TabsTrigger>
            <TabsTrigger value="bordereau">Bordereau</TabsTrigger>
          </TabsList>
          <TabsContent value="decomptes"><OngletDecomptes lotId={lot.id} /></TabsContent>
          <TabsContent value="factures"><OngletFactures lotId={lot.id} /></TabsContent>
          <TabsContent value="reglements"><OngletReglements lotId={lot.id} /></TabsContent>
          <TabsContent value="bordereau"><OngletBordereau lotId={lot.id} /></TabsContent>
        </Tabs>
      </div>
      {transition && (
        <ModaleTransitionLot
          lot={lot}
          onAnnuler={() => setTransition(false)}
          onFait={() => {
            setTransition(false);
            recharger();
          }}
          onSansDroit={() => {
            setTransition(false);
            setMessage(MESSAGE_SANS_DROIT);
          }}
          onIntrouvable={() => void navigate('/projet/lots')}
        />
      )}
    </PageShell>
  );
}

export default function LotDetail() {
  const { id = '' } = useParams();
  const etat = useFiche(() => getLot(id), id);
  return <EtatFiche key={id} etat={etat}>{(l) => <FicheLot lotInitial={l} />}</EtatFiche>;
}
