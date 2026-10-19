import type { LignePrevisionDto } from '../types';
import type { ColonneOnglet } from './ongletsTranche';
import type { SectionSaisie } from './saisiePatrimoine';

/** En-tête des prévisions de base (colonnes Base* de la tranche). Écarts types : absents = 1. */
export const SECTIONS_PREVISIONS: SectionSaisie[] = [
  {
    titre: 'Stock',
    champs: [
      { nom: 'nombreArticles', libelle: "Nombre d'articles", type: 'entier' },
      { nom: 'valorisationStock', libelle: 'Valorisation du stock TTC', type: 'montant' },
      { nom: 'pourcentageConcretisation', libelle: 'Pourcentage de concrétisation', type: 'pourcent' },
    ],
  },
  {
    titre: 'Concrétisation',
    champs: [
      { nom: 'debutConcretisation', libelle: 'Date début', type: 'date' },
      { nom: 'finConcretisation', libelle: 'Date fin', type: 'date' },
      { nom: 'ecartTypeConcretisation', libelle: 'Écart type', type: 'entier' },
    ],
  },
  {
    titre: 'Finalisation',
    champs: [
      { nom: 'debutFinalisation', libelle: 'Date début', type: 'date' },
      { nom: 'finFinalisation', libelle: 'Date fin', type: 'date' },
      { nom: 'ecartTypeFinalisation', libelle: 'Écart type', type: 'entier' },
    ],
  },
];

const calcule = () => true;

/** Une ligne saisie perd ses montants : ils ne sont recalculés que par le serveur (« — » d'ici là). */
export const sansMontants = (ligne: LignePrevisionDto): LignePrevisionDto =>
  ({ ...ligne, versementConcretisation: null, versementFinalisation: null, versementTotal: null, chiffreAffaires: null });

/** Lignes mensuelles : quantités saisies, versements et chiffre d'affaires recalculés par le serveur. */
export const COLONNES_PREVISIONS: ColonneOnglet<LignePrevisionDto>[] = [
  { nom: 'annee', libelle: 'Année', type: 'entier' },
  { nom: 'mois', libelle: 'Mois', type: 'entier' },
  { nom: 'quantiteConcretisation', libelle: 'Qté concrétisation', type: 'entier' },
  { nom: 'quantiteFinalisation', libelle: 'Qté finalisation', type: 'entier' },
  { nom: 'versementConcretisation', libelle: 'Versement concrétisation', type: 'montant', calcule },
  { nom: 'versementFinalisation', libelle: 'Versement finalisation', type: 'montant', calcule },
  { nom: 'versementTotal', libelle: 'Versement total', type: 'montant', calcule },
  { nom: 'chiffreAffaires', libelle: "Chiffre d'affaires TTC", type: 'montant', calcule },
  { nom: 'notes', libelle: 'Notes', type: 'texte' },
];
