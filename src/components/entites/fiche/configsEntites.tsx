import { Landmark, Power, UserRound, UsersRound } from 'lucide-react';
import ActionAdmin from '../../patrimoine/ActionAdmin';
import ChampsSpecifiques from '../../patrimoine/ChampsSpecifiques';
import OngletAudit from '../../patrimoine/OngletAudit';
import { Badge } from '../../ui';
import type { ConfigFiche, ContexteSaisie } from '../FicheEditable';
import {
  createActionnaire, createEntiteJuridique, createGroupeActionnaires, deleteActionnaire, deleteEntiteJuridique, deleteGroupeActionnaires,
  getActionnaire, getEntiteJuridique, getGroupeActionnaires, listDevises, listGroupesActionnaires, remplacerRepartition,
  repartitionDepuisGroupe, updateActionnaire, updateEntiteJuridique, updateGroupeActionnaires,
} from '../../../lib/apiEntites';
import { useConfirm } from '../../../lib/confirmContext';
import { rangeesDepuis } from '../../../lib/lignesActionnaires';
import { referentielItems, usePays, usePersonnels } from '../../../lib/referentiels';
import { SECTIONS_ACTIONNAIRE, SECTIONS_ENTITE, SECTIONS_GROUPE } from '../../../lib/saisieEntite';
import { useToast } from '../../../lib/toastContext';
import { errorMessage, useApi } from '../../../lib/useApi';
import type { ActionnaireDto, EntiteJuridiqueDto, GroupeActionnairesDto, LigneRepartitionDto } from '../../../types';

const EFFET = 'ses programmes, tranches, articles, prospections et dossiers dans tout le CRM. Continuer ?';

export const CONFIG_ACTIONNAIRE: ConfigFiche<ActionnaireDto> = {
  chemin: '/actionnaires',
  libelleListe: 'Actionnaires',
  titreCreation: 'Nouvel actionnaire',
  icon: <UserRound />,
  sections: SECTIONS_ACTIONNAIRE,
  libelleEdition: 'Modifier',
  messageSuppression: "L'actionnaire sera supprimé. Continuer ?",
  charger: getActionnaire,
  creer: createActionnaire,
  modifier: updateActionnaire,
  supprimer: deleteActionnaire,
};

export const CONFIG_GROUPE: ConfigFiche<GroupeActionnairesDto> = {
  chemin: '/groupes-actionnaires',
  libelleListe: "Groupes d'actionnaires",
  titreCreation: "Nouveau groupe d'actionnaires",
  icon: <UsersRound />,
  sections: SECTIONS_GROUPE,
  lignes: { cle: 'lignes', champ: 'pourcentage', titre: 'Actionnaires du groupe (Σ = 100 %)' },
  libelleEdition: 'Modifier',
  messageSuppression: 'Le groupe et ses lignes seront supprimés. Continuer ?',
  charger: getGroupeActionnaires,
  creer: createGroupeActionnaires,
  modifier: updateGroupeActionnaires,
  supprimer: deleteGroupeActionnaires,
};

export function useConfigEntite(): ConfigFiche<EntiteJuridiqueDto> {
  const confirm = useConfirm();
  const showToast = useToast();
  const devises = useApi(listDevises, []);
  const groupes = useApi(listGroupesActionnaires, []);
  const pays = usePays();
  const personnels = usePersonnels();
  const signalerErreur = (err: unknown) => showToast({ texte: errorMessage(err), variante: 'erreur' });

  /** OMRAN `Company` : un groupe choisi propose de recalculer la répartition sur le nombre de parts saisi. */
  async function chargerGroupe(nom: string, valeur: string | boolean, ctx: ContexteSaisie) {
    if (nom !== 'groupeActionnairesId' || !valeur || !ctx.id) return;
    const oui = await confirm({ title: "Groupe d'actionnaires", message: 'Est ce que vous voulez charger les répartitions !!', confirmLabel: 'Charger' });
    if (!oui) return;
    const parts = String(ctx.brouillon.nombreParts);
    const lignes = await repartitionDepuisGroupe(ctx.id, String(valeur), parts === '' ? undefined : Math.trunc(Number(parts)));
    ctx.remplacerLignes(rangeesDepuis(lignes, 'nombreParts'));
    ctx.modifier('nombreActionnaires', String(lignes.length));
  }

  async function basculer(entite: EntiteJuridiqueDto, recharger: () => void) {
    const desactiver = entite.isActive === true;
    const oui = await confirm({
      title: desactiver ? "Désactiver l'entité" : "Activer l'entité",
      message: `${desactiver ? 'Désactiver cette entité masque' : 'Activer cette entité rend visibles'} ${EFFET}`,
      confirmLabel: desactiver ? 'Désactiver' : 'Activer',
    });
    if (!oui) return;
    // Toute écriture vide les caches (`request` → `clearApiCache`) : `useEntitesReferentiel` se recharge.
    await updateEntiteJuridique(entite.id, { isActive: !desactiver });
    recharger();
  }

  return {
    chemin: '/entites-juridiques',
    libelleListe: 'Entités juridiques',
    titreCreation: 'Nouvelle entité juridique',
    icon: <Landmark />,
    sections: SECTIONS_ENTITE,
    listes: {
      devises: referentielItems(devises.data ?? []),
      groupes: referentielItems(groupes.data ?? []),
      pays: referentielItems(pays.data),
      personnels: referentielItems(personnels.data),
    },
    lignes: { cle: 'repartition', champ: 'nombreParts', titre: 'Répartition des actionnaires' },
    libelleEdition: 'Débloquer',
    ressourceFichePdf: 'entites-juridiques',
    messageSuppression: "L'entité, ses compteurs, ses habilitations et sa répartition seront supprimés. Continuer ?",
    charger: getEntiteJuridique,
    creer: createEntiteJuridique,
    // Répartition seule : PUT ; avec d'autres champs, le PATCH la contrôle avec les nombres du même corps.
    modifier: (entiteId, corps) => (Object.keys(corps).length === 1 && corps.repartition
      ? remplacerRepartition(entiteId, corps.repartition as LigneRepartitionDto[])
      : updateEntiteJuridique(entiteId, corps)),
    supprimer: deleteEntiteJuridique,
    verrouillesCreation: ['groupeActionnairesId'],
    apresChamp: (nom, valeur, ctx) => void chargerGroupe(nom, valeur, ctx).catch(signalerErreur),
    actions: (entite, recharger) => (
      <>
        <Badge tone={entite.isActive ? 'success' : 'neutral'}>{entite.isActive ? 'Active' : 'Inactive'}</Badge>
        <ActionAdmin onClick={() => void basculer(entite, recharger).catch(signalerErreur)} variant="outline"
          libelle={entite.isActive ? 'Désactiver' : 'Activer'} icone={<Power data-icon="inline-start" />} />
      </>
    ),
    onglets: (entite) => [
      { id: 'champs', libelle: 'Champs spécifiques', contenu: <ChampsSpecifiques porteur="entite" id={entite.id} /> },
      { id: 'audit', libelle: 'Audit', contenu: <OngletAudit id={entite.id} /> },
    ],
  };
}
