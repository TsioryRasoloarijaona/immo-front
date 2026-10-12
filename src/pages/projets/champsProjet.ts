import { extraireSaisie, type DefChamp } from '../../lib/saisiePatrimoine';
import type { ProjetDetailDto, ProjetEcritureDto } from '../../types';

type Def = DefChamp<ProjetEcritureDto>;

/* Une définition par champ pour le formulaire et la fiche, regroupées comme l'écran PROGRAMMES d'OMRAN. L'entité se
   saisit à part (elle déclenche le chargement des valeurs par défaut). */

export const GENERAL: Def[] = [
  { nom: 'code', libelle: 'Code', genre: 'texte', requis: true },
  { nom: 'description', libelle: 'Description', genre: 'texte', requis: true },
];

export const DELAIS: Def[] = [
  { nom: 'dateDebutTravaux', libelle: 'Lancement des travaux', genre: 'date' },
  { nom: 'dateFinTravaux', libelle: 'Fin des travaux', genre: 'date' },
  { nom: 'dateDebutCommercialisation', libelle: 'Début de commercialisation', genre: 'date' },
  { nom: 'dateFinCommercialisation', libelle: 'Fin de commercialisation', genre: 'date' },
];

export const COORDONNEES: Def[] = [
  { nom: 'adresse', libelle: 'Adresse', genre: 'texte', large: true },
  { nom: 'adresse2', libelle: 'Adresse (suite)', genre: 'texte' },
  { nom: 'adresse3', libelle: 'Adresse (complément)', genre: 'texte' },
  { nom: 'codePostal', libelle: 'Code postal', genre: 'texte' },
  { nom: 'ville', libelle: 'Ville', genre: 'texte' },
  { nom: 'paysId', libelle: 'Pays', genre: 'reference', lu: 'paysLibelle' },
  { nom: 'telephone', libelle: 'Téléphone', genre: 'texte' },
  { nom: 'fax', libelle: 'Fax', genre: 'texte' },
  { nom: 'mobile', libelle: 'Mobile', genre: 'texte' },
  { nom: 'email', libelle: 'Email', genre: 'texte' },
  { nom: 'siteWeb', libelle: 'Site web', genre: 'texte' },
];

export const ADMINISTRATION: Def[] = [
  { nom: 'villeSignature', libelle: 'Courrier fait à', genre: 'texte' },
  { nom: 'signataireId', libelle: 'Courrier signataire', genre: 'reference', lu: 'signataireLibelle' },
  { nom: 'responsableTechniqueId', libelle: 'Responsable technique', genre: 'reference', lu: 'responsableTechniqueLibelle' },
  { nom: 'responsableCommercialId', libelle: 'Responsable commercial', genre: 'reference', lu: 'responsableCommercialLibelle' },
];

export const AUTRES: Def[] = [{ nom: 'descriptionLongue', libelle: 'Description détaillée', genre: 'texteLong' }];

export const SAISIS: Def[] = [GENERAL, DELAIS, COORDONNEES, ADMINISTRATION, AUTRES].flat();

export function versEcriture(p: ProjetDetailDto): ProjetEcritureDto {
  return extraireSaisie(p, SAISIS, { entiteId: p.entiteId });
}
