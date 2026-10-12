import { extraireSaisie, type DefChamp } from '../../lib/saisiePatrimoine';
import type { EntiteJuridiqueDto, EntiteJuridiqueEcritureDto, LigneRepartitionEcritureDto } from '../../types';

type Def = DefChamp<EntiteJuridiqueEcritureDto>;

/* Une définition par champ pour la fiche (lecture) et l'édition, regroupées comme l'écran ENTITES JURIDIQUE d'OMRAN :
   un en-tête, puis les onglets Coordonnées, Administration, Répartition, Autres. */

export const IDENTIFICATION: Def[] = [
  { nom: 'code', libelle: 'Code', genre: 'texte', requis: true },
  { nom: 'description', libelle: 'Description', genre: 'texte', requis: true },
  { nom: 'formeJuridique', libelle: 'Forme juridique', genre: 'texte' },
  { nom: 'deviseId', libelle: 'Devise', genre: 'reference', requis: true, lu: 'deviseCode' },
  { nom: 'matriculeFiscal', libelle: 'Matricule fiscal', genre: 'texte' },
  { nom: 'registreCommerce', libelle: 'Registre du commerce', genre: 'texte' },
  { nom: 'cnss', libelle: 'N° sécurité sociale (CNSS)', genre: 'texte' },
  { nom: 'patente', libelle: 'Patente', genre: 'texte' },
  { nom: 'ice', libelle: "Identifiant commun de l'entreprise (ICE)", genre: 'texte' },
  { nom: 'capital', libelle: 'Capital', genre: 'montant' },
  { nom: 'dateCreation', libelle: 'Date de création', genre: 'date' },
  { nom: 'dateLiquidation', libelle: 'Date de liquidation', genre: 'date' },
  { nom: 'actif', libelle: 'Active', genre: 'case' },
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
  { nom: 'email', libelle: 'E-mail', genre: 'texte' },
  { nom: 'siteWeb', libelle: 'Site web', genre: 'texte' },
];

export const ADMINISTRATION: Def[] = [
  { nom: 'representantLegalId', libelle: 'Représentant légal', genre: 'reference', lu: 'representantLegalLibelle' },
  { nom: 'signataireId', libelle: 'Courrier signataire', genre: 'reference', lu: 'signataireLibelle' },
  { nom: 'villeSignature', libelle: 'Courrier fait à', genre: 'texte' },
  { nom: 'responsableTechniqueId', libelle: 'Responsable technique', genre: 'reference', lu: 'responsableTechniqueLibelle' },
  { nom: 'responsableCommercialId', libelle: 'Responsable commercial', genre: 'reference', lu: 'responsableCommercialLibelle' },
];

/** Le groupe se choisit à part : son choix propose de recharger la répartition. */
export const PARTS: Def[] = [
  { nom: 'nombreActionnaires', libelle: "Nombre d'actionnaires", genre: 'entier' },
  { nom: 'nombreParts', libelle: 'Nombre de parts (actions)', genre: 'entier' },
  { nom: 'partMaison', libelle: 'Part maison', genre: 'taux' },
];

export const AUTRES: Def[] = [{ nom: 'descriptionLongue', libelle: 'Description détaillée', genre: 'texteLong' }];

export const SAISIS: Def[] = [
  IDENTIFICATION,
  COORDONNEES,
  ADMINISTRATION,
  PARTS,
  AUTRES,
  [{ nom: 'groupeId', libelle: "Groupe d'actionnaires", genre: 'reference' } satisfies Def],
].flat();

export function lignesEcriture(e: EntiteJuridiqueDto): LigneRepartitionEcritureDto[] {
  return (e.repartition ?? []).map((l) => ({ actionnaireId: l.actionnaireId ?? undefined, nombreParts: l.nombreParts ?? 0 }));
}

export function versEcriture(e: EntiteJuridiqueDto): EntiteJuridiqueEcritureDto {
  return extraireSaisie(e, SAISIS, { repartition: lignesEcriture(e) });
}

/** Création : active, devise par défaut d'OMRAN, aucun actionnaire ni part — `Verif` passe. */
export function nouvelleEntite(deviseParDefaut: string | undefined): EntiteJuridiqueEcritureDto {
  return { actif: true, deviseId: deviseParDefaut, nombreActionnaires: 0, nombreParts: 0, repartition: [] };
}
