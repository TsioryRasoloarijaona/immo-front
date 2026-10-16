import type { ComponentType } from 'react';
import MaquetteBoiteDeTri from './MaquetteBoiteDeTri';
import MaquetteCreerDossier from './MaquetteCreerDossier';
import MaquetteDistribuer from './MaquetteDistribuer';
import MaquetteEcheancier from './MaquetteEcheancier';
import MaquetteMaJournee from './MaquetteMaJournee';
import MaquetteOffre from './MaquetteOffre';
import MaquettePreProspection from './MaquettePreProspection';
import MaquetteReaffecter from './MaquetteReaffecter';
import MaquetteSuivreProspection from './MaquetteSuivreProspection';
import MaquetteTransformer from './MaquetteTransformer';
import type { LienReperes } from './reperes';

/** Maquette annotée de chaque guide illustré, par `slug` ; les autres guides restent en texte seul. */
export const MAQUETTES: Partial<Record<string, ComponentType<LienReperes>>> = {
  'ma-journee': MaquetteMaJournee,
  'boite-de-tri': MaquetteBoiteDeTri,
  'saisir-pre-prospection': MaquettePreProspection,
  'transformer-en-prospection': MaquetteTransformer,
  'suivre-prospection': MaquetteSuivreProspection,
  'offre-de-prix': MaquetteOffre,
  'creer-dossier': MaquetteCreerDossier,
  'echeancier-et-reglements': MaquetteEcheancier,
  'distribuer-leads': MaquetteDistribuer,
  'reaffecter-leads': MaquetteReaffecter,
};
