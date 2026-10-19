import { useParams } from 'react-router-dom';
import { UserRound } from 'lucide-react';
import FicheEditable, { type ConfigFiche } from '../../components/entites/FicheEditable';
import { createActionnaire, deleteActionnaire, getActionnaire, updateActionnaire } from '../../lib/apiEntites';
import { SECTIONS_ACTIONNAIRE } from '../../lib/saisieEntite';
import type { ActionnaireDto } from '../../types';

const CONFIG: ConfigFiche<ActionnaireDto> = {
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

export default function ActionnaireDetail() {
  const { id } = useParams();
  return <FicheEditable id={id} config={CONFIG} />;
}
