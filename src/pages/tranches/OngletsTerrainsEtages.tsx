import GrilleOnglet, { type ColonneOnglet } from '../../components/patrimoine/GrilleOnglet';
import { NombreCellule } from '../../components/patrimoine/CellulesOnglet';
import { colonneReference } from '../../lib/colonnesOnglet';
import {
  getReferentielPatrimoine,
  getTerrainsDisponibles,
  listEtagesTranche,
  listTerrainsTranche,
  saveEtagesTranche,
  saveTerrainsTranche,
} from '../../lib/api';
import { formatPercent, formatSurface } from '../../lib/format';
import { useApi } from '../../lib/useApi';
import type { EtageTrancheDto, TerrainTrancheDto } from '../../types';

type Terrain = Partial<TerrainTrancheDto>;
type Etage = Partial<EtageTrancheDto>;

const versTerrain = (d: TerrainTrancheDto): Terrain => ({ ...d });
const nouveauTerrain = (): Terrain => ({ ratio: 1 });
const niveauxTerrain = () => getReferentielPatrimoine('niveaux-terrain');

export function OngletTerrains({ trancheId, admin }: Readonly<{ trancheId: string; admin: boolean }>) {
  const { data: disponibles } = useApi(getTerrainsDisponibles, []);
  const colonnes: ColonneOnglet<Terrain>[] = [
    colonneReference<Terrain>({
      cle: 'terrainId',
      libelle: 'Terrain',
      items: disponibles,
      code: (l) => l.terrainCode,
      description: (l) => l.terrainDescription,
      choisir: (terrainId, t) => ({
        terrainId,
        terrainCode: t?.code,
        terrainDescription: t?.description,
        surface: disponibles?.find((x) => x.id === terrainId)?.surface,
      }),
    }),
    { cle: 'surface', libelle: 'Superficie', droite: true, lecture: (l) => formatSurface(l.surface), saisie: (l) => formatSurface(l.surface) },
    {
      cle: 'ratio',
      libelle: 'Quote-part',
      droite: true,
      lecture: (l) => formatPercent(l.ratio, 2),
      saisie: (l, changer, invalide, etiquette) => (
        <NombreCellule etiquette={etiquette} genre="taux" valeur={l.ratio} invalide={invalide} onChange={(ratio) => changer({ ratio })} />
      ),
    },
  ];
  return (
    <GrilleOnglet
      titre="Terrains"
      dep={trancheId}
      charger={() => listTerrainsTranche(trancheId)}
      versSaisie={versTerrain}
      nouvelle={nouveauTerrain}
      enregistrer={(lignes) => saveTerrainsTranche(trancheId, lignes.map((l) => ({ id: l.id, terrainId: l.terrainId, ratio: l.ratio })))}
      colonnes={colonnes}
      admin={admin}
      vide="Aucun terrain rattaché à cette tranche."
    />
  );
}

const versEtage = (d: EtageTrancheDto): Etage => ({ ...d });
const nouvelEtage = (): Etage => ({});

export function OngletEtages({ trancheId, admin }: Readonly<{ trancheId: string; admin: boolean }>) {
  const { data: niveaux } = useApi(niveauxTerrain, []);
  const colonnes: ColonneOnglet<Etage>[] = [
    colonneReference<Etage>({
      cle: 'niveauTerrainId',
      libelle: 'Nombre d’étages',
      items: niveaux,
      code: (l) => l.niveauCode,
      description: (l) => l.niveauDescription,
      choisir: (niveauTerrainId, n) => ({ niveauTerrainId, niveauCode: n?.code, niveauDescription: n?.description }),
    }),
  ];
  return (
    <GrilleOnglet
      titre="Étages"
      dep={trancheId}
      charger={() => listEtagesTranche(trancheId)}
      versSaisie={versEtage}
      nouvelle={nouvelEtage}
      enregistrer={(lignes) => saveEtagesTranche(trancheId, lignes.map((l) => ({ id: l.id, niveauTerrainId: l.niveauTerrainId })))}
      colonnes={colonnes}
      admin={admin}
      vide="Aucun niveau de construction autorisé pour cette tranche."
    />
  );
}
