import FicheEditable from '../../components/entites/FicheEditable';
import { CONFIG_GROUPE } from '../../components/entites/fiche/configsEntites';

/** Création d'un groupe (`/groupes-actionnaires/nouveau`) ; la fiche existante s'ouvre en fenêtre sur la liste. */
export default function GroupeActionnairesDetail() {
  return <FicheEditable config={CONFIG_GROUPE} />;
}
