import type { SectionSaisie } from './saisiePatrimoine';

// Fiche ENTITES JURIDIQUE de l'aide OMRAN (Identification puis onglets Coordonnées, Administration, Répartition,
// Autres) ; une seule définition pour la fiche et la saisie. « Active » se bascule par un bouton à confirmation.
export const SECTIONS_ENTITE: SectionSaisie[] = [
  {
    titre: 'Identification',
    champs: [
      { nom: 'code', libelle: 'Code', type: 'texte', obligatoire: true },
      { nom: 'description', libelle: 'Description', type: 'texte', obligatoire: true },
      { nom: 'deviseId', libelle: 'Devise', type: 'liste', liste: 'devises', obligatoire: true },
      { nom: 'identifiantFiscal', libelle: 'Matricule fiscale', type: 'texte' },
      { nom: 'registreCommerce', libelle: 'Registre du commerce', type: 'texte' },
      { nom: 'formeJuridique', libelle: 'Forme juridique', type: 'texte' },
      { nom: 'dateCreation', libelle: 'Date de création', type: 'date' },
      { nom: 'capital', libelle: 'Capital', type: 'montant' },
      { nom: 'cnss', libelle: 'CNSS', type: 'texte' },
      { nom: 'patente', libelle: 'Patente', type: 'texte' },
      { nom: 'ice', libelle: "Identifiant commun de l'entreprise", type: 'texte' },
      { nom: 'dateLiquidation', libelle: 'Date liquidation', type: 'date' },
      { nom: 'partMaison', libelle: 'Part maison', type: 'entier' },
    ],
  },
  {
    titre: 'Coordonnées',
    champs: [
      { nom: 'adresse', libelle: 'Adresse', type: 'texte' },
      { nom: 'adresse2', libelle: 'Adresse 2', type: 'texte' },
      { nom: 'adresse3', libelle: 'Adresse 3', type: 'texte' },
      { nom: 'codePostal', libelle: 'Code postal', type: 'texte' },
      { nom: 'ville', libelle: 'Ville', type: 'texte' },
      { nom: 'paysId', libelle: 'Pays', type: 'liste', liste: 'pays' },
      { nom: 'telephone', libelle: 'Téléphone', type: 'texte' },
      { nom: 'mobile', libelle: 'Mobile', type: 'texte' },
      { nom: 'fax', libelle: 'Fax', type: 'texte' },
      { nom: 'email', libelle: 'Email', type: 'texte' },
      { nom: 'siteWeb', libelle: 'Site web', type: 'texte' },
    ],
  },
  {
    titre: 'Administration',
    champs: [
      { nom: 'villeSignature', libelle: 'Courrier fait à', type: 'texte' },
      { nom: 'representantLegalId', libelle: 'Représentant légal', type: 'liste', liste: 'personnels' },
      { nom: 'signataireId', libelle: 'Courrier signataire', type: 'liste', liste: 'personnels' },
      { nom: 'responsableTechniqueId', libelle: 'Responsable technique', type: 'liste', liste: 'personnels' },
      { nom: 'responsableCommercialId', libelle: 'Responsable commercial', type: 'liste', liste: 'personnels' },
    ],
  },
  {
    titre: 'Répartition',
    champs: [
      { nom: 'groupeActionnairesId', libelle: "Groupe d'actionnaires", type: 'liste', liste: 'groupes' },
      { nom: 'nombreActionnaires', libelle: 'Nombre actionnaires', type: 'entier' },
      { nom: 'nombreParts', libelle: 'Nombre de parts (actions)', type: 'entier' },
    ],
  },
  {
    titre: 'Autres',
    champs: [{ nom: 'descriptionLongue', libelle: 'Description détaillée', type: 'texteLong' }],
  },
];

export const SECTIONS_ACTIONNAIRE: SectionSaisie[] = [
  {
    titre: 'Actionnaire',
    champs: [
      { nom: 'code', libelle: 'Code', type: 'texte', obligatoire: true },
      { nom: 'description', libelle: 'Description', type: 'texte', obligatoire: true },
      { nom: 'notes', libelle: 'Notes', type: 'texteLong' },
    ],
  },
];

export const SECTIONS_GROUPE: SectionSaisie[] = [
  {
    titre: "Groupe d'actionnaires",
    champs: [
      { nom: 'code', libelle: 'Code', type: 'texte', obligatoire: true },
      { nom: 'description', libelle: 'Description', type: 'texte', obligatoire: true },
    ],
  },
];
