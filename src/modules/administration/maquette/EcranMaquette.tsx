import { useParams } from 'react-router-dom';
import { EmptyState } from '../../../components/ui';
import CalendrierTaches from './CalendrierTaches';
import EcranListeStatique from './EcranListeStatique';
import EcranReferentielStatique from './EcranReferentielStatique';
import { ECRANS } from './ecrans';
import { REFERENTIELS } from './referentiels';

/** Route unique `/administration/:ecran/:id?` : choisit le gabarit et la configuration de l'écran demandé. */
export default function EcranMaquette() {
  const { ecran = '' } = useParams();
  if (ecran === 'calendrier') return <CalendrierTaches />;
  if (ecran in ECRANS) return <EcranListeStatique key={ecran} config={ECRANS[ecran]} racine={ecran} />;
  if (ecran in REFERENTIELS) return <EcranReferentielStatique key={ecran} def={REFERENTIELS[ecran]} racine={ecran} />;
  return <EmptyState title="Écran introuvable" message="Cet écran de la maquette n'existe pas." />;
}
