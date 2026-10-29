import { Play, RefreshCw, RotateCcw, Unlock, UnlockKeyhole } from 'lucide-react';
import type { ColonneGrille } from '../../../components/DataGrid';
import ArbreDroits from './ArbreDroits';
import RestrictionsRole from './RestrictionsRole';
import * as d from './donnees';
import type { ChampStatique, ConfigEcran, Ligne } from './types';

type TypeCol = ColonneGrille<Ligne>['type'];

/** Colonnes et champs de fiche partagent leurs noms : une seule déclaration `[nom, libellé, largeur, type]`. */
function colonnes(...defs: [string, string, number?, TypeCol?][]): ColonneGrille<Ligne>[] {
  return defs.map(([nom, libelle, largeur, type]) => ({ nom, libelle, largeur: largeur ?? 14, type }));
}

function champs(cols: ColonneGrille<Ligne>[], notes?: string): ChampStatique[] {
  const liste: ChampStatique[] = cols.map((c) => ({ nom: c.nom, libelle: c.libelle, type: c.type === 'BOOLEEN' ? 'case' : 'texte' }));
  return notes ? [...liste, { nom: notes, libelle: 'Notes', large: true }] : liste;
}

const LECTURE: ConfigEcran['outils'] = ['imprimer', 'exporter', 'rafraichir'];
const STANDARD: ConfigEcran['outils'] = ['nouveau', 'supprimer', 'imprimer', 'exporter', 'rafraichir'];

function ecran(base: Pick<ConfigEcran, 'titre' | 'unite' | 'nature' | 'lignes' | 'recherche' | 'titreFiche'> & Partial<ConfigEcran>, cols: ColonneGrille<Ligne>[]): ConfigEcran {
  return { colonnes: cols, champs: champs(cols), outils: LECTURE, ...base };
}

const colsRoles = colonnes(['code', 'Code', 20], ['description', 'Description', 24], ['utilisateurs', 'Utilisateurs', 8, 'NOMBRE'], ['droits', 'Droits', 8, 'NOMBRE']);
const champsRole: ChampStatique[] = [
  { nom: 'code', libelle: 'Code' },
  { nom: 'description', libelle: 'Description' },
];

const colsTiers = colonnes(['code', 'Code', 9], ['nom', 'Nom', 20], ['telephone', 'Téléphone', 12], ['mobile', 'Mobile', 12], ['email', 'E-mail', 20], ['ville', 'Ville', 10], ['nature', 'Nature', 12], ['compte', 'Compte comptable', 12]);

function ecranTiers(titre: string, unite: string, prefixe: string, nature: string, noms: string[]): ConfigEcran {
  return ecran(
    { titre, unite, nature: unite, lignes: d.tiers(prefixe, nature, noms), recherche: 'Code, nom, e-mail…', titreFiche: (l) => String(l.nom), filtres: ['ville'], outils: [...STANDARD, 'importer'] },
    colsTiers,
  );
}

const colsTaches = colonnes(['objet', 'Objet', 24], ['type', 'Type', 10], ['priorite', 'Priorité', 10], ['statut', 'Statut', 18], ['debut', 'Début prévu', 10, 'DATE'], ['echeance', 'Échéance prévue', 10, 'DATE'], ['responsable', 'Responsable', 16]);
const colsHistorique = colonnes(['idObjet', "Id de l'objet", 14], ['date', 'Date', 14, 'DATE'], ['utilisateur', 'Utilisateur', 16], ['entite', 'Entité', 14], ['libelle', 'Libellé', 20], ['action', 'Action', 12]);
const colsEmails = colonnes(['date', 'Date', 14, 'DATE'], ['utilisateur', 'Utilisateur', 16], ['destinataire', 'Destinataire', 20], ['objet', 'Objet', 24], ['etat', 'État', 10]);
const colsSessions = colonnes(['utilisateur', 'Utilisateur', 16], ['debut', 'Début', 14, 'DATE'], ['fin', 'Fin', 14, 'DATE'], ['poste', 'Poste', 12], ['etat', 'État', 10]);
const colsActions = colonnes(['date', 'Date', 14, 'DATE'], ['utilisateur', 'Utilisateur', 16], ['action', 'Action', 14], ['objet', 'Objet', 22]);
const colsVerrous = colonnes(['entite', 'Entité', 14], ['libelle', 'Libellé entité', 20], ['date', 'Date de verrouillage', 14, 'DATE'], ['utilisateur', 'Utilisateur', 16], ['etat', 'État', 10]);
const colsPieces = colonnes(['porteuse', 'Fiche porteuse', 18], ['type', 'Type', 18], ['fichier', 'Nom du fichier', 20], ['date', 'Date', 14, 'DATE'], ['utilisateur', 'Utilisateur', 16]);
const colsTdb = colonnes(['code', 'Code', 8], ['description', 'Description', 24], ['module', 'Module', 12]);
const colsEntites = colonnes(['code', 'Code', 8], ['description', 'Description', 20], ['module', 'Module', 14], ['workflow', 'Avec workflow', 10, 'BOOLEEN']);
const colsParams = colonnes(['groupe', 'Groupe', 14], ['propriete', 'Propriété', 22], ['valeur', 'Valeur', 24]);
const colsDefRapports = colonnes(['code', 'Code', 10], ['description', 'Description', 24], ['type', 'Type (module)', 14], ['roles', 'Rôles', 30]);
const colsSequences = colonnes(['code', 'Code', 18], ['anneeSysteme', 'Année système', 10, 'BOOLEEN'], ['annee', 'Année', 8], ['sequence', 'Séquence', 10, 'NOMBRE'], ['chiffres', 'Chiffres', 8, 'NOMBRE'], ['separateur', 'Séparateur', 8], ['entite', 'Entité', 22]);
const colsChampsSpec = colonnes(['entite', 'Entité', 14], ['categorie', 'Catégorie', 14], ['libelle', 'Libellé', 24], ['type', 'Type', 10], ['obligatoire', 'Obligatoire', 10, 'BOOLEEN']);

const colsImages: ColonneGrille<Ligne>[] = [
  { nom: 'apercu', libelle: 'Aperçu', largeur: 6, sansSomme: true, rendu: (l) => <span className="inline-block size-4 rounded-sm align-middle" style={{ backgroundColor: String(l.couleur) }} /> },
  ...colonnes(['code', 'Code', 10], ['description', 'Description', 22], ['taille', 'Taille', 8]),
];

const onglet = (id: string, libelle: string, cols: ColonneGrille<Ligne>[], lignes: Ligne[]) => ({ id, libelle, colonnes: cols, lignes });

export const ECRANS: Record<string, ConfigEcran> = {
  roles: ecran(
    { titre: 'Rôles', unite: 'rôle', nature: 'Rôle', lignes: d.ROLES, recherche: 'Code, description…', titreFiche: (l) => String(l.code), outils: STANDARD, champs: champsRole, extra: (l) => <><RestrictionsRole ligne={l} /><ArbreDroits /></> },
    colsRoles,
  ),
  historique: ecran(
    { titre: 'Historique', unite: 'action', nature: 'Historique', lignes: d.HISTORIQUE, recherche: 'Entité ou libellé…', titreFiche: (l) => String(l.libelle), filtres: ['utilisateur', 'action'], colonneDate: 'date' },
    colsHistorique,
  ),
  'email-historique': ecran({ titre: 'EMail Historique', unite: 'e-mail', nature: 'E-mail', lignes: d.EMAILS, recherche: 'Destinataire, objet…', titreFiche: (l) => String(l.objet), filtres: ['etat'] }, colsEmails),
  sessions: ecran({ titre: 'Sessions', unite: 'session', nature: 'Session', lignes: d.SESSIONS, recherche: 'Utilisateur, poste…', titreFiche: (l) => `${l.utilisateur} — ${l.poste}`, filtres: ['etat'] }, colsSessions),
  actions: ecran({ titre: 'Actions', unite: 'action', nature: 'Action', lignes: d.ACTIONS_JOURNAL, recherche: 'Utilisateur, objet…', titreFiche: (l) => String(l.objet), filtres: ['action'] }, colsActions),
  'fiches-verrouillees': ecran(
    {
      titre: 'Fiches verrouillées', unite: 'fiche', nature: 'Fiche verrouillée', lignes: d.VERROUS, recherche: 'Entité, libellé, utilisateur…', titreFiche: (l) => String(l.libelle), filtres: ['etat'], effectifDansTitre: true,
      propres: [
        { id: 'deverrouiller', libelle: 'Déverrouiller', icone: Unlock },
        { id: 'deverrouiller-tout', libelle: 'Déverrouiller tout', icone: UnlockKeyhole, confirmation: 'Déverrouiller toutes les fiches ?' },
      ],
    },
    colsVerrous,
  ),
  taches: ecran(
    { titre: 'Tâches', unite: 'tâche', nature: 'Tâche', lignes: d.TACHES, recherche: 'Objet, responsable…', titreFiche: (l) => String(l.objet), filtres: ['type', 'priorite', 'statut'], outils: [...STANDARD, 'importer'], champs: champs(colsTaches, 'notes') },
    colsTaches,
  ),
  fournisseurs: ecranTiers('Fournisseurs', 'Fournisseur', 'FOU', 'Fournisseur de matériaux', d.NOMS_TIERS.fournisseurs),
  banques: ecranTiers('Banques', 'Banque', 'BAN', 'Banque commerciale', d.NOMS_TIERS.banques),
  organismes: ecranTiers('Organismes', 'Organisme', 'ORG', 'Organisme public', d.NOMS_TIERS.organismes),
  personnels: ecranTiers('Personnels', 'Personnel', 'EMP', 'Commercial', d.NOMS_TIERS.personnels),
  contacts: ecranTiers('Contacts', 'Contact', 'CNT', 'Notaire', d.NOMS_TIERS.contacts),
  'fichiers-attaches': ecran({ titre: 'Fichiers attachés', unite: 'fichier', nature: 'Fichier attaché', lignes: d.PIECES_JOINTES, recherche: 'Nom du fichier, fiche…', titreFiche: (l) => String(l.fichier), filtres: ['type'], outils: ['nouveau', 'supprimer', 'imprimer', 'exporter', 'rafraichir'] }, colsPieces),
  'rapports-tdb': ecran({ titre: 'Rapports', unite: 'rapport', nature: 'Rapport', lignes: d.RAPPORTS_TDB, recherche: 'Code, description…', titreFiche: (l) => String(l.description), filtres: ['module'], actionLigne: { id: 'lancer', libelle: 'Lancer', icone: Play } }, colsTdb),
  'entites-fonctionnelles': ecran(
    {
      titre: 'Entités fonctionnelles', unite: 'entité', nature: 'Entité fonctionnelle', lignes: d.ENTITES_FONCTIONNELLES, recherche: 'Code, description…', titreFiche: (l) => String(l.description), filtres: ['module'], outils: STANDARD,
      propres: [{ id: 'generer', libelle: 'Générer par défaut', icone: RefreshCw, confirmation: 'Attention, cette opération va supprimer vos données actuelles. Voulez vous continuer ?' }],
      onglets: (l) => [
        onglet('champs', 'Champs', colonnes(['nom', 'Nom', 14], ['libelle', 'Libellé', 20], ['type', 'Type', 10]), d.CHAMPS_ENTITE),
        onglet('statuts', 'Statuts', colonnes(['code', 'Code', 8], ['libelle', 'Libellé', 22], ['couleur', 'Couleur', 10], ['lectureSeule', 'Lecture seule', 10, 'BOOLEEN']), d.statutsEntite(String(l.description))),
        onglet('transitions', 'Transitions', colonnes(['de', 'De', 18], ['vers', 'À', 18], ['commentaire', 'Commentaire obligatoire', 12, 'BOOLEEN'], ['automatique', 'Passage automatique', 12, 'BOOLEEN'], ['roles', 'Rôles', 24]), d.transitionsEntite(String(l.description))),
      ],
    },
    colsEntites,
  ),
  'parametres-systeme': ecran({ titre: 'Paramètres système', unite: 'paramètre', nature: 'Paramètre', lignes: d.PARAMETRES, recherche: 'Propriété, valeur…', titreFiche: (l) => String(l.propriete), filtres: ['groupe'] }, colsParams),
  rapports: ecran({ titre: 'Rapports', unite: 'rapport', nature: 'Rapport', lignes: d.RAPPORTS_DEF, recherche: 'Code, description…', titreFiche: (l) => String(l.description), filtres: ['type'], outils: STANDARD, champs: [...champs(colsDefRapports.slice(0, 3)), { nom: 'groupement', libelle: 'Groupement' }, { nom: 'systeme', libelle: 'Système', type: 'case' }, { nom: 'roles', libelle: 'Rôles autorisés', large: true }] }, colsDefRapports),
  sequences: ecran(
    {
      titre: 'Séquences', unite: 'séquence', nature: 'Séquence', lignes: d.SEQUENCES, recherche: 'Code, entité…', titreFiche: (l) => String(l.code), outils: STANDARD,
      propres: [{ id: 'reinitialiser', libelle: 'Réinitialiser les séquences', icone: RotateCcw, confirmation: 'Réinitialiser toutes les séquences ?' }],
    },
    colsSequences,
  ),
  images: ecran({ titre: 'Images', unite: 'image', nature: 'Image', lignes: d.IMAGES, recherche: 'Code, description…', titreFiche: (l) => String(l.description), outils: STANDARD, champs: champs(colonnes(['code', 'Code'], ['description', 'Description'], ['taille', 'Taille'])) }, colsImages),
  'champs-specifiques': ecran({ titre: 'Champs spécifiques', unite: 'champ', nature: 'Champ spécifique', lignes: d.CHAMPS_SPECIFIQUES, recherche: 'Entité, libellé…', titreFiche: (l) => String(l.libelle), filtres: ['entite', 'categorie'], outils: STANDARD }, colsChampsSpec),
};
