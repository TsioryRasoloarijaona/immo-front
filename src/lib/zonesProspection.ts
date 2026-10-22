import { getProspectionTerrain, saveZonesProspectionTerrain } from './apiProspectionsTerrain';
import type { ColonneOnglet, SourceLignes } from './ongletsTranche';
import type { ZoneTerrainDto } from '../types/prospectionsTerrain';

/** (coefficient, montant) : côté serveur, le coefficient gagne quand les deux sont envoyés. */
const PAIRES = [
  ['cos', 'superficieCos'], ['cuf', 'superficieCuf'], ['coefVendable', 'superficieVendable'],
  ['coefCommerce', 'superficieCommerce'], ['coefBureau', 'superficieBureau'], ['coefParking', 'superficieParking'],
] as const;

/** Seul le montant d'une paire a changé : le coefficient inchangé n'est pas renvoyé, sinon il écraserait la saisie. */
function sansCoefficientPerime(ligne: ZoneTerrainDto, initiale?: ZoneTerrainDto): ZoneTerrainDto {
  if (!initiale) return ligne;
  const envoyee = { ...ligne };
  for (const [coef, montant] of PAIRES) {
    if (envoyee[montant] !== initiale[montant] && envoyee[coef] === initiale[coef]) envoyee[coef] = null;
  }
  return envoyee;
}

/** Zones lues sur la fiche (jamais en cache), écrites par `PUT …/zones`. */
export function sourceZones(prospectionId: string): SourceLignes<ZoneTerrainDto> {
  const initiales = new Map<string, ZoneTerrainDto>();
  return {
    cle: prospectionId,
    charger: async () => {
      const zones = (await getProspectionTerrain(prospectionId)).zones ?? [];
      initiales.clear();
      for (const z of zones) if (z.id) initiales.set(z.id, z);
      return { lignes: zones };
    },
    enregistrer: (lignes) =>
      saveZonesProspectionTerrain(prospectionId, lignes.map((l) => sansCoefficientPerime(l, l.id ? initiales.get(l.id) : undefined))),
  };
}

export const COLONNES_ZONES: ColonneOnglet<ZoneTerrainDto>[] = [
  { nom: 'identification', libelle: 'Identification', type: 'texte' },
  { nom: 'superficie', libelle: 'Superficie', type: 'surface' },
  { nom: 'cos', libelle: 'COS', type: 'coefficient' },
  { nom: 'superficieCos', libelle: 'Emprise', type: 'surface' },
  { nom: 'cuf', libelle: 'CUF', type: 'coefficient' },
  { nom: 'superficieCuf', libelle: 'Plancher couvert', type: 'surface' },
  { nom: 'coefVendable', libelle: 'Coef. vendable', type: 'coefficient' },
  { nom: 'superficieVendable', libelle: 'Plancher vendable', type: 'surface' },
  { nom: 'coefCommerce', libelle: 'Coef. commerce', type: 'coefficient' },
  { nom: 'superficieCommerce', libelle: 'Commerce', type: 'surface' },
  { nom: 'coefBureau', libelle: 'Coef. bureau', type: 'coefficient' },
  { nom: 'superficieBureau', libelle: 'Bureau', type: 'surface' },
  { nom: 'superficieHabitat', libelle: 'Habitat', type: 'surface', calcule: () => true },
  { nom: 'coefParking', libelle: 'Coef. parking', type: 'coefficient' },
  { nom: 'superficieParking', libelle: 'Parking', type: 'surface' },
  { nom: 'arreteAlignement', libelle: 'Arrêté d’alignement', type: 'entier' },
  { nom: 'hauteurMax', libelle: 'Hauteur max.', type: 'entier' },
  { nom: 'notes', libelle: 'Notes', type: 'texte' },
];
