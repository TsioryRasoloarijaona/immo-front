import type { BlocCommissionDto, LigneCommissionDto, ReferentielItemDto } from '../types';
import { formatCurrency, formatPercent } from './format';
import type { ColonneOnglet } from './ongletsTranche';

/** Montant fixe (`baseSurMontant` absent = vrai), ou « x % du prix de vente TTC ». */
export function libelleBloc(bloc: BlocCommissionDto | null | undefined): string {
  if (bloc?.baseSurMontant === false) return `${formatPercent(bloc.pourcentage ?? 0, 3)} du prix de vente TTC`;
  return formatCurrency(bloc?.montant ?? 0);
}

const BLOCS: { nom: ColonneOnglet<LigneCommissionDto>['nom']; libelle: string }[] = [
  { nom: 'concretisation', libelle: 'Concrétisation' },
  { nom: 'concretisationExterne', libelle: 'Concrétisation (prestataire)' },
  { nom: 'finalisation1', libelle: 'Finalisation 1' },
  { nom: 'finalisation1Externe', libelle: 'Finalisation 1 (prestataire)' },
  { nom: 'finalisation2', libelle: 'Finalisation 2' },
  { nom: 'finalisation2Externe', libelle: 'Finalisation 2 (prestataire)' },
];

/** Colonnes de l'onglet Commission vendeur ; une clé absente (« — ») vaut pour toutes les valeurs. */
export function colonnesCommissions(choix: {
  commerciaux: ReferentielItemDto[];
  categories: ReferentielItemDto[];
  personnels: ReferentielItemDto[];
  actions: ReferentielItemDto[];
}): ColonneOnglet<LigneCommissionDto>[] {
  return [
    { nom: 'dateDebut', libelle: 'Date début', type: 'date' },
    { nom: 'dateFin', libelle: 'Date fin', type: 'date' },
    { nom: 'personnelId', libelle: 'Personnel', type: 'choix', choix: choix.personnels, facultatif: true },
    { nom: 'actionCommercialeId', libelle: 'Action commerciale', type: 'choix', choix: choix.actions, facultatif: true },
    { nom: 'commercialId', libelle: 'Commercial', type: 'choix', choix: choix.commerciaux, facultatif: true },
    { nom: 'categorieArticleId', libelle: "Catégorie d'article", type: 'choix', choix: choix.categories, facultatif: true },
    ...BLOCS.map((b) => ({ ...b, type: 'bloc' as const })),
  ];
}
