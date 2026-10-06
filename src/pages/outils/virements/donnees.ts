import { useSyncExternalStore } from 'react';
import type { BadgeTone } from '../../../types';

/** Générateur d'ordres de virement — **maquette statique**.
 *
 * Reprise de l'outil autonome `generateur-virement/` (Node + jsPDF) dans le
 * module Outils. Aucun endpoint n'existe encore côté `immo-crm` : tout ce qui
 * suit est une donnée fictive tenue en mémoire, partagée par les quatre écrans
 * (un ordre généré apparaît dans l'historique) et perdue au rechargement.
 *
 * Les types reprennent les champs du formulaire d'origine, nommés en
 * français, pour que le contrat backend puisse s'en inspirer — ils iront dans
 * `types.ts` quand il existera. */

export type TypeVirement = 'fournisseur' | 'salaire';
export type NatureBeneficiaire = 'fournisseur' | 'salarie';
export type StatutOrdre = 'emis' | 'paye' | 'annule';
export type PoliceDocument = 'helvetica' | 'times';
export type ModeEntete = 'logo' | 'texte' | 'aucun';

export interface Societe {
  id: string;
  nom: string;
  banque: string;
  ville: string;
  compte: string;
  signataire: string;
  /** Présélectionnée dans le formulaire « Nouvel ordre ». */
  parDefaut: boolean;
  police: PoliceDocument;
  enteteMode: ModeEntete;
  enteteTitre: string;
  enteteTaille: number;
  enteteSousTitre: string;
  enteteDroite: string;
  enteteFilet: boolean;
  objet: string;
  corpsFournisseur: string;
  ligneFournisseur: string;
  corpsSalaire: string;
  ligneSalaire: string;
  /** Second signataire, à gauche, sur les virements de salaire seulement. */
  signataireGauche: string;
  pied: string;
  cloture: boolean;
  salutationGrasse: boolean;
  societeGrasse: boolean;
  montantsGras: boolean;
  beneficiaireGras: boolean;
}

export interface Beneficiaire {
  id: string;
  nom: string;
  rib: string;
  nature: NatureBeneficiaire;
}

export interface Piece {
  code: string;
  libelle: string;
  fichier?: string;
  dateDepot?: string;
}

export interface Ordre {
  id: string;
  numero: string;
  date: string;
  societeId: string;
  type: TypeVirement;
  beneficiaireId: string;
  beneficiaire: string;
  rib: string;
  montant: number;
  reference: string;
  statut: StatutOrdre;
  /** Ordres émis ensemble dans un même courrier groupé — chacun garde son
   * numéro et son dossier de pièces. */
  groupe?: string;
  pieces: Piece[];
  autresPieces: { nom: string; dateDepot: string }[];
}

export const LIBELLE_TYPE: Record<TypeVirement, string> = {
  fournisseur: "Règlement d'un fournisseur",
  salaire: 'Salaire du personnel',
};

export const LIBELLE_NATURE: Record<NatureBeneficiaire, string> = {
  fournisseur: 'Fournisseur',
  salarie: 'Salarié',
};

export const STATUT_ORDRE: Record<StatutOrdre, { libelle: string; ton: BadgeTone }> = {
  emis: { libelle: 'Émis', ton: 'progress' },
  paye: { libelle: 'Payé', ton: 'success' },
  annule: { libelle: 'Annulé', ton: 'warning' },
};

export const STATUT_ITEMS = (Object.keys(STATUT_ORDRE) as StatutOrdre[]).map((s) => ({
  value: s,
  label: STATUT_ORDRE[s].libelle,
}));

/** Pièces à réunir par type de virement. Liste provisoire, à confirmer avec
 * la comptabilité quand le dossier passera côté serveur. */
const PIECES_REQUISES: Record<TypeVirement, { code: string; libelle: string }[]> = {
  fournisseur: [
    { code: 'ordre-signe', libelle: 'Ordre signé et cacheté' },
    { code: 'facture', libelle: 'Facture ou décompte' },
    { code: 'avis-debit', libelle: 'Avis de débit de la banque' },
  ],
  salaire: [
    { code: 'ordre-signe', libelle: 'Ordre signé par les deux parties' },
    { code: 'bulletin', libelle: 'Bulletin de paie' },
    { code: 'avis-debit', libelle: 'Avis de débit de la banque' },
  ],
};

export function piecesVides(type: TypeVirement): Piece[] {
  return PIECES_REQUISES[type].map((p) => ({ ...p }));
}

export function etatDossier(o: Ordre): { fournies: number; requises: number; complet: boolean; manquantes: string[] } {
  const manquantes = o.pieces.filter((p) => !p.fichier).map((p) => p.libelle);
  return {
    fournies: o.pieces.length - manquantes.length,
    requises: o.pieces.length,
    complet: manquantes.length === 0,
    manquantes,
  };
}

/** Un nouveau bénéficiaire ne se propose que là où il sert : un fournisseur
 * pour un règlement, un salarié pour une paie. */
export function natureDuType(type: TypeVirement): NatureBeneficiaire {
  return type === 'salaire' ? 'salarie' : 'fournisseur';
}

/* ------------------------------------------------------------------ */
/* Données fictives                                                    */
/* ------------------------------------------------------------------ */

const MODELE_COMMUN = {
  objet: 'Ordre de virements bancaires Express',
  corpsFournisseur:
    'Par le débit de notre compte n° {compte} ouvert dans vos livres au nom de la société {societe}, nous vous prions de bien vouloir effectuer le virement suivant :',
  ligneFournisseur: '{montant} DH à la Société {beneficiaire}',
  corpsSalaire:
    'Par le débit de notre compte n° {compte} ouvert au nom de la société {societe}, nous vous prions de bien vouloir virer le salaire suivant :',
  ligneSalaire: '{montant} DH à {beneficiaire}',
  enteteTaille: 22,
  enteteTitre: '',
  enteteSousTitre: '',
  enteteDroite: '',
  enteteFilet: false,
  signataireGauche: '',
  pied: '',
  cloture: true,
  salutationGrasse: false,
  societeGrasse: true,
  montantsGras: true,
  beneficiaireGras: false,
};

const SOCIETES: Societe[] = [
  {
    ...MODELE_COMMUN,
    id: 's1',
    nom: 'GHRIZA',
    banque: 'CIH BANK',
    ville: 'CASABLANCA',
    compte: '8152915221009500',
    signataire: 'M. Ali Jamal DIOURI',
    parDefaut: true,
    police: 'helvetica',
    enteteMode: 'logo',
    pied: 'ICE : 003775054000075',
  },
  {
    ...MODELE_COMMUN,
    id: 's2',
    nom: 'DIOURI ARCHI SARL',
    banque: 'ATTIJARIWAFA BANK',
    ville: 'CASABLANCA',
    compte: '0071234500019876',
    signataire: 'M. Ali Jamal DIOURI',
    parDefaut: false,
    police: 'times',
    enteteMode: 'texte',
    enteteTitre: 'DIOURI ARCHI SARL',
    enteteSousTitre: 'Siège Social : 26 Avenue Mers Sultan',
    enteteDroite: 'Tél. : 05 22 00 00 00\nICE : 001234567000089',
    enteteFilet: true,
    salutationGrasse: true,
    beneficiaireGras: true,
  },
  {
    ...MODELE_COMMUN,
    id: 's3',
    nom: 'ADMOD',
    banque: 'BMCE BANK OF AFRICA',
    ville: 'RABAT',
    compte: '0118100000234500',
    signataire: 'M. Othman DIOURI',
    parDefaut: false,
    police: 'helvetica',
    enteteMode: 'aucun',
    signataireGauche: '{beneficiaire}',
    cloture: false,
  },
];

const BENEFICIAIRES: Beneficiaire[] = [
  { id: 'b1', nom: 'SOTRAMEC SARL', rib: '230 780 4521873211004500 12', nature: 'fournisseur' },
  { id: 'b2', nom: 'BÉTON DU SOUSS', rib: '007 810 0001234567890123 45', nature: 'fournisseur' },
  { id: 'b3', nom: 'ÉLEC NORD SARL', rib: '011 780 0000112233445566 77', nature: 'fournisseur' },
  { id: 'b4', nom: 'MENUISERIE ATLAS', rib: '145 450 2111000098765432 09', nature: 'fournisseur' },
  { id: 'b5', nom: 'ALUMINIUM MODERNE', rib: '050 810 4400223344556677 31', nature: 'fournisseur' },
  { id: 'b6', nom: 'Monsieur Othman DIOURI', rib: '230 780 0000998877665544 10', nature: 'salarie' },
  { id: 'b7', nom: 'Madame Salma BENNANI', rib: '007 780 0011223344556677 88', nature: 'salarie' },
  { id: 'b8', nom: 'Monsieur Youssef AMRANI', rib: '011 810 0055667788990011 22', nature: 'salarie' },
];

function ordre(
  n: number,
  date: string,
  societeId: string,
  beneficiaireId: string,
  montant: number,
  statut: StatutOrdre,
  fournies: number,
  extra: Partial<Ordre> = {},
): Ordre {
  const b = BENEFICIAIRES.find((x) => x.id === beneficiaireId)!;
  const type: TypeVirement = b.nature === 'salarie' ? 'salaire' : 'fournisseur';
  const pieces = piecesVides(type).map((p, i) =>
    i < fournies ? { ...p, fichier: `${p.code}-${String(n).padStart(4, '0')}.pdf`, dateDepot: date } : p,
  );
  return {
    id: `o${n}`,
    numero: `OV-2026-${String(n).padStart(4, '0')}`,
    date,
    societeId,
    type,
    beneficiaireId,
    beneficiaire: b.nom,
    rib: b.rib,
    montant,
    reference: '',
    statut,
    pieces,
    autresPieces: [],
    ...extra,
  };
}

const ORDRES: Ordre[] = [
  ordre(41, '2026-09-02', 's1', 'b1', 185000, 'paye', 3, { reference: 'Décompte n°6' }),
  ordre(42, '2026-09-04', 's1', 'b2', 92450.5, 'paye', 3, { reference: 'Facture F-2026-118' }),
  ordre(43, '2026-09-10', 's2', 'b4', 46800, 'paye', 2),
  ordre(44, '2026-09-30', 's3', 'b6', 18500, 'paye', 3, { groupe: 'G-09', reference: 'Paie septembre' }),
  ordre(45, '2026-09-30', 's3', 'b7', 12200, 'paye', 2, { groupe: 'G-09', reference: 'Paie septembre' }),
  ordre(46, '2026-09-30', 's3', 'b8', 9800, 'paye', 3, { groupe: 'G-09', reference: 'Paie septembre' }),
  ordre(47, '2026-10-01', 's1', 'b3', 63720, 'emis', 1, { reference: 'Situation n°3' }),
  ordre(48, '2026-10-02', 's1', 'b1', 210000, 'emis', 1, { reference: 'Décompte n°7' }),
  ordre(49, '2026-10-03', 's2', 'b5', 38150, 'annule', 0, { reference: 'Erreur de RIB' }),
  ordre(50, '2026-10-05', 's1', 'b5', 38150, 'emis', 0, { reference: 'Facture A-552' }),
];

/* ------------------------------------------------------------------ */
/* Magasin en mémoire                                                  */
/* ------------------------------------------------------------------ */

export interface EtatVirements {
  societes: Societe[];
  beneficiaires: Beneficiaire[];
  ordres: Ordre[];
}

let etat: EtatVirements = { societes: SOCIETES, beneficiaires: BENEFICIAIRES, ordres: ORDRES };
const abonnes = new Set<() => void>();

function abonner(f: () => void) {
  abonnes.add(f);
  return () => abonnes.delete(f);
}

/** Lecture partagée par les quatre écrans : un ordre généré dans « Nouvel
 * ordre » est déjà dans l'historique quand on y arrive. */
export function useVirements(): EtatVirements {
  return useSyncExternalStore(abonner, () => etat);
}

export function majVirements(f: (e: EtatVirements) => EtatVirements) {
  etat = f(etat);
  abonnes.forEach((a) => a());
}

export function prochainNumero(ordres: Ordre[], decalage = 0): string {
  const max = ordres.reduce((m, o) => Math.max(m, Number(o.numero.slice(-4)) || 0), 0);
  return `OV-2026-${String(max + 1 + decalage).padStart(4, '0')}`;
}

export function nouvelId(prefixe: string): string {
  return `${prefixe}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
