import FicheEditable from '../../components/entites/FicheEditable';
import { CONFIG_ACTIONNAIRE } from '../../components/entites/fiche/configsEntites';

/** Création d'un actionnaire (`/actionnaires/nouveau`) ; la fiche existante s'ouvre en fenêtre sur la liste. */
export default function ActionnaireDetail() {
  return <FicheEditable config={CONFIG_ACTIONNAIRE} />;
}
