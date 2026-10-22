import StatutProspection from '../components/patrimoine/StatutProspection';
import type { ColonneGrille } from '../components/DataGrid';
import { colonneLocale as colonne, grilleDepuisCatalogue, type DispositionColonnes } from './colonnes';
import { formatRatio, formatSurface } from './format';
import type { ColonneDto, ReferentielItemDto } from '../types';
import type { ProspectionTerrainListeDto } from '../types/prospectionsTerrain';

/** Colonnes de l'aide « Liste » de PROSPECTIONS TERRAIN ; le choix des colonnes est local. */
export const CATALOGUE_PROSPECTIONS_TERRAIN: ColonneDto[] = [
  colonne('code', 'Code', 'GENERAL', 'TEXTE', true),
  colonne('date', 'Date', 'GENERAL', 'DATE', true),
  colonne('description', 'Description', 'GENERAL', 'TEXTE', true),
  colonne('categorie', 'Catégorie', 'GENERAL', 'TEXTE', true),
  colonne('type', 'Type', 'GENERAL', 'TEXTE', true),
  colonne('niveau', 'Niveau', 'GENERAL', 'TEXTE', true),
  colonne('vocation', 'Vocation', 'GENERAL', 'TEXTE', true),
  colonne('ville', 'Ville', 'GENERAL', 'TEXTE', true),
  colonne('statut', 'Statut', 'GENERAL', 'TEXTE', true),
  colonne('dateValiditeStatut', 'Validité du statut', 'GENERAL', 'DATE', true),
  colonne('superficie', 'Superficie', 'PATRIMOINE', 'NOMBRE', true),
  colonne('superficieNette', 'Superficie nette', 'PATRIMOINE', 'NOMBRE', true),
  colonne('prixPropose', 'Prix proposé', 'PRIX', 'MONTANT', true),
  colonne('estArchivee', 'Archivée', 'GENERAL', 'BOOLEEN', true),
  colonne('estTransformee', 'Transformée', 'GENERAL', 'BOOLEEN', true),
  colonne('nbEtudesFaisabilite', 'Nbr. étude de fais.', 'GENERAL', 'NOMBRE', true),
  colonne('pays', 'Pays', 'GENERAL'),
  colonne('courtier', 'Courtier', 'GENERAL'),
  colonne('adresse', 'Adresse', 'GENERAL'),
  colonne('proprietaires', 'Propriétaires', 'GENERAL'),
  colonne('estAmenage', 'Aménagé', 'GENERAL', 'BOOLEEN'),
  colonne('notes', 'Notes', 'GENERAL'),
  colonne('anomalies', 'Anomalies', 'GENERAL'),
  colonne('superficieEquipements', "Superficie des voies d'aménagement", 'PATRIMOINE', 'NOMBRE'),
  colonne('coefEquipements', "Coefficient d'équipements", 'PATRIMOINE', 'NOMBRE'),
  colonne('cos', 'COS', 'PATRIMOINE', 'NOMBRE'),
  colonne('superficieCos', 'Emprise au sol', 'PATRIMOINE', 'NOMBRE'),
  colonne('cuf', 'CUF', 'PATRIMOINE', 'NOMBRE'),
  colonne('superficieCuf', 'Plancher couvert', 'PATRIMOINE', 'NOMBRE'),
  colonne('coefVendable', 'Coefficient vendable', 'PATRIMOINE', 'NOMBRE'),
  colonne('superficieVendable', 'Plancher vendable', 'PATRIMOINE', 'NOMBRE'),
  colonne('arreteAlignement', "Arrêté d'alignement", 'PATRIMOINE', 'NOMBRE'),
  colonne('hauteurMax', 'Hauteur maximale', 'PATRIMOINE', 'NOMBRE'),
  colonne('prixM2', 'Prix du m² du propriétaire', 'PRIX', 'MONTANT'),
  colonne('prix', 'Prix total du propriétaire', 'PRIX', 'MONTANT'),
  colonne('dateEnregistrement', "Date d'enregistrement", 'GENERAL', 'DATE'),
  colonne('numeroEnregistrement', "Numéro d'enregistrement", 'GENERAL'),
  colonne('lieuEnregistrement', "Lieu d'enregistrement", 'GENERAL'),
  colonne('cpfImmatriculation', 'C.P.F. immatriculation', 'GENERAL'),
  colonne('dateImmatriculation', "Date d'immatriculation", 'GENERAL', 'DATE'),
  colonne('creePar', 'Créé par', 'AUDIT'),
  colonne('creeLe', 'Créé le', 'AUDIT', 'DATE'),
  colonne('modifiePar', 'Modifié par', 'AUDIT'),
  colonne('modifieLe', 'Modifié le', 'AUDIT', 'DATE'),
];

export const DISPOSITION_PROSPECTIONS_TERRAIN: DispositionColonnes = {
  ordre: CATALOGUE_PROSPECTIONS_TERRAIN.map((c) => c.nom),
  poids: { description: 26, code: 12, statut: 14, ville: 12, categorie: 14 },
};

const libelle = (r?: ReferentielItemDto | null) => r?.description || r?.code || '';

const REFERENCES: Partial<Record<string, (p: ProspectionTerrainListeDto) => ReferentielItemDto | null | undefined>> = {
  categorie: (p) => p.categorie,
  type: (p) => p.type,
  niveau: (p) => p.niveau,
  vocation: (p) => p.vocation,
  pays: (p) => p.pays,
  ville: (p) => p.ville,
  courtier: (p) => p.courtier,
  statut: (p) => p.statut,
};

const SURFACES = new Set(['superficie', 'superficieNette', 'superficieEquipements', 'superficieCos', 'superficieCuf', 'superficieVendable']);
const COEFFICIENTS = new Set(['coefEquipements', 'cos', 'cuf', 'coefVendable']);

function cellule(nom: string): Partial<ColonneGrille<ProspectionTerrainListeDto>> {
  const reference = REFERENCES[nom];
  if (nom === 'statut') return { valeur: (p) => libelle(p.statut), rendu: (p) => <StatutProspection prospection={p} /> };
  if (reference) return { valeur: (p) => libelle(reference(p)) };
  if (SURFACES.has(nom)) return { rendu: (p) => formatSurface(p[nom as 'superficie']) };
  if (COEFFICIENTS.has(nom)) return { rendu: (p) => { const v = p[nom as 'cos']; return v == null ? '—' : formatRatio(v); } };
  return {};
}

export function grilleProspectionsTerrain(colonnes: ColonneDto[]): ColonneGrille<ProspectionTerrainListeDto>[] {
  return grilleDepuisCatalogue<ProspectionTerrainListeDto>(colonnes, DISPOSITION_PROSPECTIONS_TERRAIN.poids, 'code')
    .map((c) => ({ ...c, ...cellule(c.nom) }));
}
