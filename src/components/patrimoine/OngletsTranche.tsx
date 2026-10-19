import { useState } from 'react';
import { Card } from '../ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import GrilleOnglet from './GrilleOnglet';
import { getCategoriesBien } from '../../lib/api';
import { getChoixOngletTranche, getReferentielPatrimoine } from '../../lib/apiPatrimoine';
import { formatSurface } from '../../lib/format';
import { montantsFrais, somme, type ColonneOnglet } from '../../lib/ongletsTranche';
import { useApi } from '../../lib/useApi';
import type { LigneEtageDto, LigneFraisDto, LignePlancherDto, LigneTerrainDto, ReferentielItemDto } from '../../types';

function useChoix(charger: () => Promise<ReferentielItemDto[]>) {
  return useApi(charger, []).data ?? [];
}

/** Catégories de nature Bâtiment des articles et des sous-articles (choix du plancher couvert). */
const categoriesBatiment = async () => (await Promise.all([getCategoriesBien(false), getCategoriesBien(true)])).flat();

/** Onglets Terrains, Étages, Plancher couvert et Frais de vente de la fiche tranche. */
export default function OngletsTranche({ trancheId, onPlancherEnregistre }: Readonly<{
  trancheId: string;
  /** Le plancher couvert de la fiche (Σ des surfaces) a changé. */
  onPlancherEnregistre: () => void;
}>) {
  const [onglet, setOnglet] = useState('terrains');
  const terrains = useChoix(() => getChoixOngletTranche('terrains-disponibles'));
  const niveaux = useChoix(() => getReferentielPatrimoine('niveaux-terrain'));
  const categories = useChoix(categoriesBatiment);
  const categoriesFrais = useChoix(() => getChoixOngletTranche('categories-frais'));

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

  return (
    <Card padded={false}>
      <Tabs value={onglet} onValueChange={(v) => setOnglet(String(v))} className="gap-0">
        <TabsList className="px-4.5">
          <TabsTrigger value="terrains">Terrains</TabsTrigger>
          <TabsTrigger value="etages">Étages</TabsTrigger>
          <TabsTrigger value="plancher">Plancher couvert</TabsTrigger>
          <TabsTrigger value="frais">Frais de vente</TabsTrigger>
        </TabsList>
        <div className="p-4.5">
          <TabsContent value="terrains">
            <GrilleOnglet trancheId={trancheId} onglet="terrains" colonnes={colonnesTerrains} nouvelle={{ ratio: 1 }} />
          </TabsContent>
          <TabsContent value="etages">
            <GrilleOnglet trancheId={trancheId} onglet="etages" colonnes={colonnesEtages} nouvelle={{}} />
          </TabsContent>
          <TabsContent value="plancher">
            <GrilleOnglet trancheId={trancheId} onglet="plancher-couvert" colonnes={colonnesPlancher} nouvelle={{ surface: 0 }}
              onEnregistre={onPlancherEnregistre}
              pied={(lignes) => (
                <p className="text-label text-muted-foreground">
                  Plancher couvert : <span className="font-medium text-foreground">{formatSurface(somme(lignes, (l) => l.surface))}</span>
                </p>
              )} />
          </TabsContent>
          <TabsContent value="frais">
            <GrilleOnglet trancheId={trancheId} onglet="frais" colonnes={colonnesFrais} normaliser={montantsFrais}
              nouvelle={{ saisiEnTTC: false, montantHT: 0, tauxTva: 0, montantTTC: 0 }} />
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
}
