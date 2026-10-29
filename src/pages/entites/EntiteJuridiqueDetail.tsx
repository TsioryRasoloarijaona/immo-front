import FicheEditable from '../../components/entites/FicheEditable';
import { useConfigEntite } from '../../components/entites/fiche/configsEntites';

/** Création d'une entité (`/entites-juridiques/nouveau`) ; la fiche existante s'ouvre en fenêtre sur la liste. */
export default function EntiteJuridiqueDetail() {
  const config = useConfigEntite();
  return <FicheEditable config={config} />;
}
