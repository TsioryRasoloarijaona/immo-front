import type { SectionSaisie } from './saisiePatrimoine';

// Sections de la fiche PROGRAMMES de l'aide OMRAN ; une seule définition pour le formulaire et la fiche.
export const SECTIONS_PROJET: SectionSaisie[] = [
  {
    titre: 'Général',
    champs: [
      { nom: 'entiteId', libelle: 'Entité', type: 'liste', liste: 'entites', obligatoire: true },
      { nom: 'code', libelle: 'Code', type: 'texte', obligatoire: true },
      { nom: 'description', libelle: 'Description', type: 'texte', obligatoire: true },
    ],
  },
  {
    titre: 'Délais',
    champs: [
      { nom: 'dateDebutTravaux', libelle: 'Début des travaux', type: 'date' },
      { nom: 'dateFinTravaux', libelle: 'Fin des travaux', type: 'date' },
      { nom: 'dateDebutCommercialisation', libelle: 'Début de commercialisation', type: 'date' },
      { nom: 'dateFinCommercialisation', libelle: 'Fin de commercialisation', type: 'date' },
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
    titre: 'Responsables',
    champs: [
      { nom: 'villeSignature', libelle: 'Ville de signature', type: 'texte' },
      { nom: 'signataireId', libelle: 'Courrier signataire', type: 'liste', liste: 'personnels' },
      { nom: 'responsableTechniqueId', libelle: 'Responsable technique', type: 'liste', liste: 'personnels' },
      { nom: 'responsableCommercialId', libelle: 'Responsable commercial', type: 'liste', liste: 'personnels' },
    ],
  },
  {
    titre: 'Autres',
    champs: [{ nom: 'descriptionLongue', libelle: 'Description longue', type: 'texteLong' }],
  },
];
