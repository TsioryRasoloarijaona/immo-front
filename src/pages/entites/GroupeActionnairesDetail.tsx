import { useParams } from 'react-router-dom';
import { UsersRound } from 'lucide-react';
import FicheEditable, { type ConfigFiche } from '../../components/entites/FicheEditable';
import {
  createGroupeActionnaires, deleteGroupeActionnaires, getGroupeActionnaires, updateGroupeActionnaires,
} from '../../lib/apiEntites';
import { SECTIONS_GROUPE } from '../../lib/saisieEntite';
import type { GroupeActionnairesDto } from '../../types';

const CONFIG: ConfigFiche<GroupeActionnairesDto> = {
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

export default function GroupeActionnairesDetail() {
  const { id } = useParams();
  return <FicheEditable id={id} config={CONFIG} />;
}
