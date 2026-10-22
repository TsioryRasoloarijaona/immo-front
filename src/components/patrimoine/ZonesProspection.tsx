import { useMemo } from 'react';
import GrilleOnglet from './GrilleOnglet';
import { formatSurface } from '../../lib/format';
import { somme } from '../../lib/ongletsTranche';
import { COLONNES_ZONES, sourceZones } from '../../lib/zonesProspection';
import type { ZoneTerrainDto } from '../../types/prospectionsTerrain';

/** Grille des zones d'un terrain brut ; leur total ne dépasse pas la superficie nette (sinon 400 à l'enregistrement). */
export default function ZonesProspection({ id, superficieNette, onEnregistre }: Readonly<{
  id: string;
  superficieNette?: number | null;
  onEnregistre: () => void;
}>) {
  const source = useMemo(() => sourceZones(id), [id]);
  return (
    <GrilleOnglet<ZoneTerrainDto>
      source={source}
      colonnes={COLONNES_ZONES}
      nouvelle={{ identification: '' }}
      onEnregistre={onEnregistre}
      pied={(lignes) => (
        <p className="text-micro text-muted-foreground">
          Total des zones {formatSurface(somme(lignes, (z) => z.superficie))} — superficie nette {formatSurface(superficieNette)}
        </p>
      )}
    />
  );
}
