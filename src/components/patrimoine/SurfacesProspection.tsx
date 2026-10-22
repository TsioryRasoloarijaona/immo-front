import { Badge } from '../ui';
import { SectionFiche } from './FicheSections';
import ZonesProspection from './ZonesProspection';
import { aplatir, SECTION_BRUT, SECTION_SUPERFICIES } from '../../lib/saisieProspectionTerrain';
import type { ProspectionTerrainDetailDto } from '../../types/prospectionsTerrain';

/** Onglet Superficies : le bloc surfaces et, pour un terrain Brut, la grille des zones (panneau « Brut » d'OMRAN). */
export default function SurfacesProspection({ prospection: p, onModifie }: Readonly<{
  prospection: ProspectionTerrainDetailDto;
  onModifie: () => void;
}>) {
  const vue = aplatir(p);
  const brut = p.estAmenage === false;
  return (
    <div className="flex flex-col gap-4">
      <Badge tone="neutral">{brut ? 'Terrain brut' : 'Terrain aménagé'}</Badge>
      <SectionFiche section={SECTION_SUPERFICIES} source={vue} />
      {brut && (
        <>
          <SectionFiche section={SECTION_BRUT} source={vue} />
          <ZonesProspection id={p.id} superficieNette={p.superficieNette} onEnregistre={onModifie} />
        </>
      )}
    </div>
  );
}
