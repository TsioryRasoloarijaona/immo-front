import type { Ligne } from './types';

/** Données fictives des écrans statiques : personnes inventées, référentiels réels (voir referentiels.ts). */

export const PERSONNES = [
  'Amine Berrada', 'Salma Idrissi', 'Youssef Tazi', 'Nadia Lahlou', 'Karim Benjelloun', 'Hajar El Fassi',
  'Omar Chraibi', 'Imane Skalli', 'Mehdi Alaoui', 'Sofia Bennani', 'Rachid Ouazzani', 'Lina Cherkaoui',
];
const VILLES = ['Casablanca', 'Rabat', 'Marrakech', 'Tanger', 'Fès', 'Agadir'];

const choisir = <T,>(liste: T[], i: number): T => liste[i % liste.length];
const jour = (i: number, mois = 10) => `2026-${String(mois).padStart(2, '0')}-${String(1 + ((i * 3) % 28)).padStart(2, '0')}`;
const horodatage = (i: number) => `${jour(i)}T${String(8 + (i % 10)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}:00`;

export const ROLES: Ligne[] = [
  ['Administrateur', 20, 962, 66], ['Direction Générale', 2, 763, 69], ['Responsable marketing et communication', 4, 276, 1],
  ['Assistante Commerciale', 0, 262, 0], ['Coordinatrice du projet', 1, 205, 0], ['Architecte', 2, 205, 0],
  ['Direction fonciere', 1, 139, 37], ['Commercial Chef', 14, 126, 49], ['Assistante Technique', 1, 120, 12],
  ['Directeur Technique', 4, 106, 15], ['Comptabilité', 3, 103, 3], ['Assistante direction', 3, 94, 2],
  ['Commercial', 42, 55, 3], ['Commercial Aide', 4, 51, 1], ['GRH', 1, 39, 1], ['Standardiste', 0, 29, 0],
  ['location', 2, 25, 1], ['Technicien SAV', 0, 23, 0], ['Notaire', 1, 7, 0],
].map(([code, utilisateurs, droits, rapports], i) => ({
  id: String(i + 1),
  code: String(code),
  description: String(code),
  utilisateurs: Number(utilisateurs),
  droits: Number(droits),
  rapports: Number(rapports),
  restr1: i % 3 === 0, restr2: i % 4 === 0, restr3: i % 5 === 0, restr4: false, restr5: i % 2 === 0,
  restr6: false, restr7: i % 6 === 0, restr8: false, restr9: i % 7 === 0, restr10: false,
}));

const ENTITES = ['Prospection', 'Note', 'Alerte', 'Tiers', 'Dossier de vente', 'Article'];
const ACTIONS_HISTORIQUE = ['Ajout', 'Modification', 'Suppression'];
export const HISTORIQUE: Ligne[] = Array.from({ length: 40 }, (_, i) => ({
  id: String(i + 1),
  idObjet: `${(48210 + i * 37).toString(16).toUpperCase()}-${1000 + i}`,
  date: horodatage(i),
  utilisateur: choisir(PERSONNES, i * 5),
  entite: choisir(ENTITES, i),
  libelle: `${choisir(ENTITES, i)} n° ${5900 + i}`,
  action: choisir(ACTIONS_HISTORIQUE, i * 2 + (i % 3)),
}));

export const EMAILS: Ligne[] = Array.from({ length: 25 }, (_, i) => ({
  id: String(i + 1),
  date: horodatage(i + 3),
  utilisateur: choisir(PERSONNES, i * 3),
  destinataire: `contact${i + 1}@exemple.test`,
  objet: choisir(["Confirmation de réservation", "Relance d'échéance", "Envoi de documents", "Rendez-vous de visite"], i),
  etat: i % 9 === 4 ? 'Échec' : 'Envoyé',
}));

export const SESSIONS: Ligne[] = Array.from({ length: 18 }, (_, i) => ({
  id: String(i + 1),
  utilisateur: choisir(PERSONNES, i * 7),
  debut: horodatage(i + 1),
  fin: i % 4 === 0 ? '' : horodatage(i + 2),
  poste: `POSTE-${100 + i}`,
  etat: i % 4 === 0 ? 'Ouverte' : 'Fermée',
}));

export const ACTIONS_JOURNAL: Ligne[] = Array.from({ length: 30 }, (_, i) => ({
  id: String(i + 1),
  date: horodatage(i + 5),
  utilisateur: choisir(PERSONNES, i * 5),
  action: choisir(['Appel sortant', 'Visite', 'Note', 'E-mail', 'Rappel'], i),
  objet: `Prospection n° ${5900 + i * 2}`,
}));

export const VERROUS: Ligne[] = Array.from({ length: 6 }, (_, i) => ({
  id: String(i + 1),
  entite: choisir(['Prospection', 'Dossier de vente', 'Tiers'], i),
  libelle: `${choisir(['Prospection', 'Dossier', 'Tiers'], i)} n° ${5920 + i * 11}`,
  date: horodatage(i + 9),
  utilisateur: choisir(PERSONNES, i * 5),
  etat: i % 3 === 2 ? 'Expiré' : 'Verrouillé',
}));

export const STATUTS_TACHE = ['Non commencée', 'En cours de réalisation', 'Terminée', 'Attente de résolution de problème', 'Annulée', 'Différée'];
const OBJETS_TACHE = ['Relancer le notaire', 'Préparer le compromis', 'Visite du chantier', 'Mise à jour des prix', 'Réunion commerciale', 'Envoi des appels de fonds'];
export const TACHES: Ligne[] = Array.from({ length: 24 }, (_, i) => ({
  id: String(i + 1),
  objet: `${choisir(OBJETS_TACHE, i)} (${i + 1})`,
  type: choisir(['Appel', 'Réunion', 'Visite', 'Relance', 'Rédaction'], i),
  priorite: choisir(['Basse', 'Normale', 'Haute', 'Urgente'], i * 3),
  statut: choisir(STATUTS_TACHE, i * 5),
  debut: jour(i),
  echeance: jour(i + 2),
  responsable: choisir(PERSONNES, i * 7),
  notes: 'Tâche fictive de la maquette.',
}));

export function tiers(prefixe: string, nature: string, noms: string[]): Ligne[] {
  return noms.map((nom, i) => ({
    id: String(i + 1),
    code: `${prefixe}${String(i + 1).padStart(4, '0')}`,
    nom,
    telephone: `05 22 ${String(10 + i).padStart(2, '0')} ${String(40 + i * 3).padStart(2, '0')} 00`,
    mobile: `06 61 ${String(20 + i).padStart(2, '0')} ${String(30 + i * 2).padStart(2, '0')} 00`,
    email: `${nom.toLowerCase().replace(/[^a-z]+/g, '.').replace(/\.$/, '')}@exemple.test`,
    ville: choisir(VILLES, i),
    nature,
    compte: `${prefixe === 'FOU' ? '4411' : '3421'}${String(100 + i)}`,
  }));
}

export const NOMS_TIERS = {
  fournisseurs: ['Matériaux Atlas', 'Béton du Nord', 'Sanitaire Plus', 'Électro Maroc', 'Peinture Zenith', 'Menuiserie Anfa', 'Quincaillerie Rif', 'Carrelage Souss'],
  banques: ['Banque Horizon', 'Crédit du Sahel', 'Banque Atlantique Pro', 'Maghreb Finance', 'Banque Participative Nour'],
  organismes: ['Conservation foncière (fictive)', 'Agence urbaine (fictive)', 'Direction des impôts (fictive)', 'Caisse de retraite (fictive)'],
  personnels: PERSONNES,
  contacts: ['Étude Lamrani (notaire)', 'Cabinet Sebti (architecte)', 'Bureau Kettani (géomètre)', 'Étude Berrechid (notaire)', 'Agence Mansouri (assurance)', 'Cabinet Naciri (avocat)'],
};

export const PIECES_JOINTES: Ligne[] = Array.from({ length: 24 }, (_, i) => ({
  id: String(i + 1),
  porteuse: `${choisir(['Dossier', 'Prospection', 'Tiers'], i)} n° ${5900 + i * 4}`,
  type: choisir(["Carte d'identité nationale", 'Contrat', 'Plan', 'Justificatif de domicile', 'Quittance'], i),
  fichier: `${choisir(['cin', 'contrat', 'plan', 'justificatif', 'quittance'], i)}-${i + 1}.pdf`,
  date: horodatage(i + 2),
  utilisateur: choisir(PERSONNES, i * 5),
}));

export const RAPPORTS_TDB: Ligne[] = [
  ['Prospections par origine', 'Vente'], ['Dossiers par statut', 'Vente'], ['Encaissements du mois', 'Trésorerie'],
  ['Échéances impayées', 'Vente'], ['Stock disponible', 'Patrimoine'], ['Activité des commerciaux', 'Vente'],
  ['Historique des utilisateurs', 'Administration'], ['Fiches verrouillées', 'Administration'],
].map(([description, module], i) => ({ id: String(i + 1), code: `TDB${String(i + 1).padStart(2, '0')}`, description, module }));

export const RAPPORTS_DEF: Ligne[] = RAPPORTS_TDB.map((r, i) => ({
  id: r.id,
  code: `RPT${String(i + 1).padStart(3, '0')}`,
  description: r.description,
  type: r.module,
  groupement: i % 2 === 0 ? 'Statistiques' : 'Listes',
  systeme: i % 3 === 0,
  roles: i % 2 === 0 ? 'Administrateur, Direction Générale' : 'Administrateur, Direction Générale, Commercial Chef',
}));

export const SEQUENCES: Ligne[] = [
  ['Prospection', 5949, 5, '/', 'Globale'], ['Tiers', 14503, 5, '/', 'Globale'], ['Facture fournisseur', 3018, 5, '/', 'Globale'],
  ['Dossier de vente', 379, 5, '/', 'Globale'], ['Avoir', 42, 3, '', 'Société Atlas (fictive)'], ['Reçu', 811, 3, '', 'Société Atlas (fictive)'],
  ['Facture', 275, 3, '', 'Société Atlas (fictive)'], ['Certificat RAS', 36, 3, '', 'Société Atlas (fictive)'],
].map(([code, valeur, chiffres, separateur, entite], i) => ({
  id: String(i + 1), code: String(code), anneeSysteme: true, annee: 2026, sequence: Number(valeur), chiffres: Number(chiffres), separateur: String(separateur), entite: String(entite),
}));

export const PARAMETRES: Ligne[] = [
  ['Société', 'Raison sociale', 'Société Atlas Immobilier (fictive)'], ['Société', 'Ville du siège', 'Casablanca'], ['Société', 'Devise', 'MAD'],
  ['Formats', 'Format de date', 'jj/mm/aaaa'], ['Formats', 'Séparateur décimal', ','], ['Formats', 'Séparateur de milliers', 'espace'],
  ['Exercice', 'Exercice en cours', '2026'], ['Exercice', 'Début de l’exercice', '01/01/2026'], ['Exercice', 'Fin de l’exercice', '31/12/2026'],
  ['TVA', 'Taux normal', '20 %'], ['TVA', 'Taux réduit', '10 %'], ['TVA', 'Taux spécial', '14 %'],
  ['Valeurs par défaut', 'Pays', 'Maroc'], ['Valeurs par défaut', 'Statut de liste à faire', 'EN COURS'], ['Valeurs par défaut', "Type de pièce d'identité", 'CIN'],
  ['Valeurs par défaut', 'Forme sociale (personne physique)', 'PH'],
].map(([groupe, propriete, valeur], i) => ({ id: String(i + 1), groupe, propriete, valeur }));

export const IMAGES: Ligne[] = ['#5d396e', '#2f6f8f', '#8a5a2b', '#3d7a4f', '#a33b52', '#6b6b7a'].map((couleur, i) => ({
  id: String(i + 1), code: `IMG${String(i + 1).padStart(2, '0')}`, description: choisir(['Logo société', 'Plan de masse', 'Façade', 'Hall', 'Cuisine', 'Piscine'], i), taille: `${12 + i * 7} Ko`, couleur,
}));

export const CHAMPS_SPECIFIQUES: Ligne[] = [
  ['Tiers', 'Identité', 'Numéro CNSS', 'Texte', false], ['Tiers', 'Identité', 'Date de naissance du conjoint', 'Date', false],
  ['Prospection', 'Marketing', 'Campagne', 'Liste', true], ['Prospection', 'Marketing', 'Budget déclaré', 'Montant', false],
  ['Dossier de vente', 'Suivi', 'Référence notaire', 'Texte', true], ['Article', 'Technique', 'Orientation', 'Liste', false],
].map(([entite, categorie, libelle, type, obligatoire], i) => ({ id: String(i + 1), entite: String(entite), categorie: String(categorie), libelle: String(libelle), type: String(type), obligatoire: Boolean(obligatoire) }));

export const STATUTS_DOSSIER = [
  'Réservation', 'Concrétisation', 'Compromis', 'Envoi au notaire', 'Crédit en cours', 'Crédit débloqué', 'Remise des clés',
  'Formalisé', 'Acte signé', 'Livré', 'Annulé', 'Désisté', 'En attente de pièces',
];
const COULEURS = ['Bleu', 'Violet', 'Orange', 'Vert', 'Gris'];

export const ENTITES_FONCTIONNELLES: Ligne[] = [
  ['DOS', 'Dossier de vente', 'Vente', true], ['TAC', 'Tâche', 'Administration', true], ['PRO', 'Prospection', 'Vente', false],
  ['ENC', 'Encaissement', 'Trésorerie', false], ['ART', 'Article', 'Patrimoine', false],
].map(([code, description, module, workflow], i) => ({ id: String(i + 1), code: String(code), description: String(description), module: String(module), workflow: Boolean(workflow), categorie: 'Standard' }));

export function statutsDe(entite: string): string[] {
  if (entite === 'Dossier de vente') return STATUTS_DOSSIER;
  return entite === 'Tâche' ? STATUTS_TACHE : [];
}

export function statutsEntite(entite: string): Ligne[] {
  return statutsDe(entite).map((libelle, i) => ({ id: String(i + 1), code: `S${String(i + 1).padStart(2, '0')}`, libelle, couleur: choisir(COULEURS, i), lectureSeule: i >= 7 && entite === 'Dossier de vente' }));
}

export function transitionsEntite(entite: string): Ligne[] {
  const s = statutsDe(entite);
  return s.slice(0, -1).map((de, i) => ({
    id: String(i + 1), de, vers: s[i + 1], commentaire: i % 3 === 2, automatique: i % 4 === 3, roles: i % 2 === 0 ? 'Administrateur, Commercial Chef' : 'Administrateur',
  }));
}

export const CHAMPS_ENTITE: Ligne[] = [
  { id: '1', nom: 'Code', libelle: 'Code', type: 'Texte' },
  { id: '2', nom: 'Description', libelle: 'Description', type: 'Texte' },
  { id: '3', nom: 'Montant', libelle: 'Montant', type: 'Montant' },
  { id: '4', nom: 'DateDebut', libelle: 'Date de début', type: 'Date' },
];
