import type { VoisinsFiche } from '../../../lib/fenetreFiche';
import FicheEditableFenetre from './FicheEditableFenetre';
import { CONFIG_ACTIONNAIRE, CONFIG_GROUPE, useConfigEntite } from './configsEntites';

type Props = Readonly<{ id: string; voisins?: VoisinsFiche; onFermer: () => void }>;

export function FicheEntiteFenetre(props: Props) {
  const config = useConfigEntite();
  return <FicheEditableFenetre config={config} nature="Entité juridique" {...props} />;
}

export function FicheActionnaireFenetre(props: Props) {
  return <FicheEditableFenetre config={CONFIG_ACTIONNAIRE} nature="Actionnaire" {...props} />;
}

export function FicheGroupeActionnairesFenetre(props: Props) {
  return <FicheEditableFenetre config={CONFIG_GROUPE} nature="Groupe d'actionnaires" {...props} />;
}
