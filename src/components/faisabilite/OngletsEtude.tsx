import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import FicheShell, { type OngletFiche } from '../FicheShell';
import FicheSections from '../patrimoine/FicheSections';
import PiecesJointesBloc from '../patrimoine/PiecesJointesBloc';
import PiedSaisie from '../patrimoine/PiedSaisie';
import SectionsSaisie from '../patrimoine/SectionsSaisie';
import ArbreBilan from './ArbreBilan';
import ChronologiePhases from './ChronologiePhases';
import GrilleTranchesEtude from './GrilleTranchesEtude';
import GrilleUnitesEtude from './GrilleUnitesEtude';
import LienProspectionEtude from './LienProspectionEtude';
import MessagesVerif from './MessagesVerif';
import OngletAnalyse from './OngletAnalyse';
import OngletDonnees from './OngletDonnees';
import OngletFinancement from './OngletFinancement';
import OngletHistorique from './OngletHistorique';
import { createEtudeFaisabilite, listTerrainsEtude, updateEtudeFaisabilite } from '../../lib/apiFaisabilite';
import { useAuth } from '../../lib/auth';
import {
  CHAMPS_ETUDE, SECTIONS_IDENTITE, SECTIONS_PHASES, SECTIONS_TERRAIN, nomsCalcules, pilotesApres, sansSuiveurs, useCalculEtude,
} from '../../lib/faisabilite';
import { ongletsTransverses } from '../../lib/ongletsTransverses';
import { useEntitesReferentiel, referentielItems } from '../../lib/referentiels';
import { estAdministrateur } from '../../lib/roles';
import { brouillonDepuis, corpsDepuis, useSaisie, type SectionSaisie } from '../../lib/saisiePatrimoine';
import { useToast } from '../../lib/toastContext';
import { useApi } from '../../lib/useApi';
import type { EtudeFaisabiliteDto, SaisieEtudeDto } from '../../types/faisabilite';

/**
 * Onglets d'une étude : un seul brouillon pour Identité, Terrain et Phases (enregistré d'un coup), aperçu serveur
 * rafraîchi à chaque saisie, grilles enregistrées chacune à part. Sans `fiche` : création (les grilles viennent ensuite).
 */
export default function OngletsEtude({ fiche, entete, recharger, onEnregistre }: Readonly<{
  fiche?: EtudeFaisabiliteDto;
  entete?: ReactNode;
  recharger: () => Promise<void>;
  /** Après un PATCH réussi : relire l'étude et repartir d'un brouillon propre. */
  onEnregistre: () => void;
}>) {
  const navigate = useNavigate();
  const showToast = useToast();
  const { user } = useAuth();
  const admin = estAdministrateur(user);
  const lecture = !admin || fiche?.bloquee === true;
  const societes = useEntitesReferentiel();
  const terrains = useApi(() => (admin ? listTerrainsEtude() : Promise.resolve([])), [admin]);
  const [onglet, setOnglet] = useState('identite');
  const [montantsPilotes, setMontantsPilotes] = useState<string[]>([]);
  const initial = useMemo(() => brouillonDepuis(CHAMPS_ETUDE, fiche && { ...fiche, ...fiche.valeurs }), [fiche]);
  const saisie = useSaisie(CHAMPS_ETUDE, initial);
  const corpsApercu = sansSuiveurs(corpsDepuis(CHAMPS_ETUDE, saisie.brouillon), montantsPilotes);
  const calcul = useCalculEtude({ ...corpsApercu, unites: fiche?.unites, tranches: fiche?.tranches }, !lecture);

  // Brouillon intact : valeurs stockées par OMRAN (coefficient et montant peuvent y diverger), aperçu dès la première saisie.
  const intact = JSON.stringify(saisie.brouillon) === JSON.stringify(initial);
  const valeurs = fiche && intact ? fiche.valeurs : (calcul.valeurs ?? fiche?.valeurs);
  const calcules = nomsCalcules(montantsPilotes);
  const brouillon = valeurs
    ? { ...saisie.brouillon, ...brouillonDepuis(CHAMPS_ETUDE.filter((c) => calcules.has(c.nom)), valeurs) }
    : saisie.brouillon;

  function changer(nom: string, valeur: string | boolean) {
    saisie.modifier(nom, valeur);
    setMontantsPilotes((p) => pilotesApres(nom, p));
  }

  function enregistrer() {
    const corps = sansSuiveurs(corpsDepuis(CHAMPS_ETUDE, saisie.brouillon, fiche ? initial : undefined), montantsPilotes) as SaisieEtudeDto;
    if (fiche) {
      void saisie.envoyer(() => updateEtudeFaisabilite(fiche.id, corps), () => {
        showToast('Étude enregistrée.');
        onEnregistre();
      });
    } else {
      void saisie.envoyer(() => createEtudeFaisabilite(corps), (cree) => void navigate(`/etudes-faisabilite/${cree.id}`));
    }
  }

  const listes = { societes: referentielItems(societes.data), terrains: referentielItems(terrains.data ?? []) };
  const sections = (liste: SectionSaisie[]) => (fiche && lecture
    ? <FicheSections sections={liste} source={{ ...fiche, ...fiche.valeurs }} />
    : <SectionsSaisie sections={liste} brouillon={brouillon} onChange={changer} listes={listes}
      champErreur={saisie.champErreur} messageErreur={saisie.erreur} />);
  const onglets: OngletFiche[] = [
    { id: 'identite', libelle: 'Identité', contenu: <div className="flex flex-col gap-3">{sections(SECTIONS_IDENTITE)}</div> },
    { id: 'terrain', libelle: 'Terrain', contenu: <div className="flex flex-col gap-3">{fiche && <LienProspectionEtude fiche={fiche} lecture={lecture} recharger={onEnregistre} />}{sections(SECTIONS_TERRAIN)}</div> },
    {
      id: 'phases', libelle: 'Phases',
      contenu: (
        <div className="flex flex-col gap-3">
          {valeurs && <ChronologiePhases valeurs={valeurs} />}
          {sections(SECTIONS_PHASES)}
        </div>
      ),
    },
    ...(fiche ? [
      { id: 'unites', libelle: 'Unités de base', compteur: fiche.unites.length, contenu: <GrilleUnitesEtude fiche={fiche} onEnregistre={() => void recharger()} /> },
      { id: 'tranches', libelle: 'Tranches', compteur: fiche.tranches.length, contenu: <GrilleTranchesEtude fiche={fiche} onEnregistre={recharger} /> },
      { id: 'financement', libelle: 'Financement', contenu: <OngletFinancement fiche={fiche} onEnregistre={() => void recharger()} /> },
      { id: 'bilan', libelle: 'Bilan', contenu: <ArbreBilan fiche={fiche} onEnregistre={() => void recharger()} /> },
      { id: 'analyse', libelle: 'Analyse', contenu: <OngletAnalyse fiche={fiche} /> },
      { id: 'donnees', libelle: 'Données', contenu: <OngletDonnees fiche={fiche} /> },
      { id: 'historique', libelle: 'Historique', contenu: <OngletHistorique etudeId={fiche.id} version={fiche.statutId} /> },
      { id: 'pieces', libelle: 'Pièces jointes', contenu: <PiecesJointesBloc porteur="etudes-faisabilite" id={fiche.id} lecture={fiche.bloquee} /> },
      ...ongletsTransverses('etude', fiche.id),
    ] : []),
  ];

  return (
    <FicheShell
      rembourrer
      identite={<div className="flex flex-col gap-2">{entete}<MessagesVerif erreurs={calcul.valeurs?.erreurs ?? []} apercuIndisponible={calcul.erreur} /></div>}
      onglets={onglets}
      ongletActif={onglet}
      onOngletChange={setOnglet}
      barreAction={lecture ? undefined : (
        <PiedSaisie erreur={saisie.erreur} envoi={saisie.envoi} onEnregistrer={enregistrer} libelle={fiche ? 'Enregistrer' : 'Créer'} />
      )}
    />
  );
}
