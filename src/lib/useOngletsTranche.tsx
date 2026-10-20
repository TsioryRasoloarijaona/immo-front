import type { OngletFiche } from '../components/FicheShell';
import GrilleOnglet from '../components/patrimoine/GrilleOnglet';
import { getActionsCommerciales, getCategoriesBien } from './api';
import { getChoixOngletTranche, getEntitesFinalisation, getReferentielPatrimoine } from './apiPatrimoine';
import { commercialLabel, useAppData } from './appData';
import { colonnesCommissions } from './commissionsTranche';
import { formatSurface } from './format';
import { montantsFrais, somme, sourceOngletTranche, type ColonneOnglet } from './ongletsTranche';
import { useApi } from './useApi';
import type {
  EntiteFinalisationDto, LigneCommissionDto, LigneEtageDto, LigneFinalisationDto, LigneFraisDto, LignePlancherDto,
  LigneTerrainDto, ReferentielItemDto,
} from '../types';

function useChoix<T = ReferentielItemDto>(charger: () => Promise<T[]>) {
  return useApi(charger, []).data ?? [];
}

/** Catégories de nature Bâtiment des articles et des sous-articles (choix du plancher couvert). */
const categoriesBatiment = async () => (await Promise.all([getCategoriesBien(false), getCategoriesBien(true)])).flat();

const AIDE_FINALISATIONS =
  'Les deux listes déroulantes permettent de définir dans quel statut le système va appliquer les commissions de finalisation.';

/** Statuts du type de dossier choisi ; un statut d'un autre type est effacé quand le type change. */
function statutsFinalisation(entites: EntiteFinalisationDto[]) {
  const statuts = (l: LigneFinalisationDto) => entites.find((e) => e.id === l.entiteDossierId)?.statuts ?? [];
  const garder = (l: LigneFinalisationDto, id: string | null | undefined) => statuts(l).find((s) => s.id === id)?.id;
  return {
    statuts,
    normaliser: (l: LigneFinalisationDto): LigneFinalisationDto =>
      ({ ...l, statutFinalisation1Id: garder(l, l.statutFinalisation1Id), statutFinalisation2Id: garder(l, l.statutFinalisation2Id) ?? null }),
  };
}

/**
 * Onglets Terrains, Étages, Plancher couvert, Frais de vente, Finalisations et Commission vendeur de la fiche tranche.
 * `onPlancherEnregistre` : le plancher couvert de la fiche (Σ des surfaces) a changé.
 */
export function useOngletsTranche(trancheId: string, onPlancherEnregistre: () => void): OngletFiche[] {
  const terrains = useChoix(() => getChoixOngletTranche('terrains-disponibles'));
  const niveaux = useChoix(() => getReferentielPatrimoine('niveaux-terrain'));
  const categories = useChoix(categoriesBatiment);
  const categoriesFrais = useChoix(() => getChoixOngletTranche('categories-frais'));
  const entites = useChoix(getEntitesFinalisation);
  const finalisation = statutsFinalisation(entites);
  const { commerciaux } = useAppData();
  const commissions = colonnesCommissions({
    commerciaux: commerciaux.map((c) => ({ id: c.id, code: c.code, description: commercialLabel(c) })),
    categories: useChoix(() => getCategoriesBien()),
    personnels: useChoix(() => getReferentielPatrimoine('personnels')),
    actions: useChoix(getActionsCommerciales),
  });

  const colonnesTerrains: ColonneOnglet<LigneTerrainDto>[] = [
    { nom: 'terrainId', libelle: 'Terrain', type: 'choix', choix: terrains },
    { nom: 'terrainSurface', libelle: 'Superficie', type: 'surface', calcule: () => true },
    { nom: 'ratio', libelle: 'Ratio', type: 'pourcent' },
  ];
  const colonnesEtages: ColonneOnglet<LigneEtageDto>[] = [
    { nom: 'niveauTerrainId', libelle: 'Niveau', type: 'choix', choix: niveaux },
  ];
  const colonnesPlancher: ColonneOnglet<LignePlancherDto>[] = [
    { nom: 'categorieId', libelle: 'Catégorie', type: 'choix', choix: categories },
    { nom: 'surface', libelle: 'Superficie (m²)', type: 'surface' },
  ];
  const colonnesFrais: ColonneOnglet<LigneFraisDto>[] = [
    { nom: 'categorieReglementId', libelle: 'Catégorie', type: 'choix', choix: categoriesFrais },
    { nom: 'ordre', libelle: 'O.D.T.', type: 'nombre' },
    { nom: 'saisiEnTTC', libelle: 'Saisie en TTC', type: 'case' },
    { nom: 'montantHT', libelle: 'Montant HT', type: 'montant', calcule: (l) => !!l.saisiEnTTC },
    { nom: 'tauxTva', libelle: 'TVA', type: 'pourcent' },
    { nom: 'montantTTC', libelle: 'Montant TTC', type: 'montant', calcule: (l) => !l.saisiEnTTC },
    { nom: 'pourcentageDe', libelle: '% du prix', type: 'pourcent' },
  ];
  const colonnesFinalisations: ColonneOnglet<LigneFinalisationDto>[] = [
    { nom: 'entiteDossierId', libelle: 'Type de dossier', type: 'choix', choix: entites },
    { nom: 'statutFinalisation1Id', libelle: 'Statut de finalisation 1', type: 'choix', choix: finalisation.statuts },
    { nom: 'statutFinalisation2Id', libelle: 'Statut de finalisation 2', type: 'choix', choix: finalisation.statuts, facultatif: true },
  ];

  return [
    {
      id: 'terrains',
      libelle: 'Terrains',
      contenu: <GrilleOnglet<LigneTerrainDto> source={sourceOngletTranche(trancheId, 'terrains')} colonnes={colonnesTerrains} nouvelle={{ ratio: 1 }} />,
    },
    {
      id: 'etages',
      libelle: 'Étages',
      contenu: <GrilleOnglet<LigneEtageDto> source={sourceOngletTranche(trancheId, 'etages')} colonnes={colonnesEtages} nouvelle={{}} />,
    },
    {
      id: 'plancher',
      libelle: 'Plancher couvert',
      contenu: (
        <GrilleOnglet<LignePlancherDto> source={sourceOngletTranche(trancheId, 'plancher-couvert')} colonnes={colonnesPlancher} nouvelle={{ surface: 0 }}
          onEnregistre={onPlancherEnregistre}
          pied={(lignes) => (
            <p className="text-label text-muted-foreground">
              Plancher couvert : <span className="font-medium text-foreground">{formatSurface(somme(lignes, (l) => l.surface))}</span>
            </p>
          )} />
      ),
    },
    {
      id: 'frais',
      libelle: 'Frais de vente',
      contenu: (
        <GrilleOnglet<LigneFraisDto> source={sourceOngletTranche(trancheId, 'frais')} colonnes={colonnesFrais} normaliser={montantsFrais}
          nouvelle={{ saisiEnTTC: false, montantHT: 0, tauxTva: 0, montantTTC: 0 }} />
      ),
    },
    {
      id: 'finalisations',
      libelle: 'Finalisations',
      contenu: (
        <GrilleOnglet<LigneFinalisationDto> source={sourceOngletTranche(trancheId, 'finalisations')} colonnes={colonnesFinalisations} nouvelle={{}}
          normaliser={finalisation.normaliser}
          pied={() => <p className="text-label text-muted-foreground">{AIDE_FINALISATIONS}</p>} />
      ),
    },
    {
      id: 'commissions',
      libelle: 'Commission vendeur',
      contenu: <GrilleOnglet<LigneCommissionDto> source={sourceOngletTranche(trancheId, 'commissions')} colonnes={commissions} nouvelle={{}} />,
    },
  ];
}
