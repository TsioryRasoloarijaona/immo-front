import { arrondi, construire, decaler } from '../../../components/maquette/colonnes';
import { FOURNISSEURS } from '../../../components/maquette/communes';
import type { Ligne } from '../../../components/maquette/types';
import { DECOMPTES_CALCULES } from '../../projet/maquette/calcul';

/** Date « du jour » de la maquette : sert au retard des impayés. */
export const AUJOURDHUI = '2026-11-09';
const TVA = 0.2;

// Transitions réelles de BuyDocumentWorkFlow (PLAN-achat.md §2) ; les rôles sont fictifs.
export const TRANSITIONS = construire(
  ['origine', 'cible', 'role', 'usages'],
  [
    ['EN COURS', 'VALIDÉ DG', 'Directeur général', 594],
    ['EN COURS', 'VALIDE POUR PAIEMENT', 'Directeur général', 1655],
    ['EN COURS', 'VALIDE POUR PAIEMENT', 'Chef comptable', 149],
    ['EN COURS', 'VALIDE POUR PAIEMENT', 'Directeur financier', 41],
    ['EN COURS', 'VALIDE POUR PAIEMENT', 'Directeur technique', 15],
    ['EN COURS', 'DDE VALIDATION DT', 'Chef de projet', 36],
    ['DDE VALIDATION DT', 'VALIDÉ DT', 'Directeur technique', 34],
    ['VALIDÉ DT', 'VALIDÉ DG', 'Directeur général', 15],
    ['VALIDÉ DG', 'VALIDE POUR PAIEMENT', 'Chef comptable', 5],
    ['VALIDE POUR PAIEMENT', 'CLOTURÉ', 'Chef comptable', 17],
    ['EN COURS', 'ANNULATION', 'Chef comptable', 4],
  ],
);

/** Chemin d'approbation suivi par un document pour atteindre son statut courant. */
export function cheminStatut(statut: string): string[] {
  const suites: Record<string, string[]> = {
    'VALIDÉ DT': ['DDE VALIDATION DT', 'VALIDÉ DT'],
    'VALIDÉ DG': ['VALIDÉ DG'],
    'VALIDE POUR PAIEMENT': ['VALIDE POUR PAIEMENT'],
    CLOTURÉ: ['VALIDE POUR PAIEMENT', 'CLOTURÉ'],
    ANNULATION: ['ANNULATION'],
  };
  return ['EN COURS', ...(suites[statut] ?? [])];
}

// numéro, type, date, fournisseur, projet, lot, objet, HT, statut
type Def = [string, string, string, string, string, string, string, number, string];

const FACTURES_DE_DECOMPTE: Def[] = DECOMPTES_CALCULES.filter((d) => d.saisie.facture).map((d): Def => [
  d.saisie.facture,
  'FACTURE',
  decaler(d.saisie.date, 6),
  d.lot.fournisseur,
  d.lot.projet,
  d.lot.code,
  `Décompte n° ${d.numero} — ${d.lot.libelle}`,
  arrondi(d.cumul.ht - d.precedent.ht),
  d.saisie.facture === 'FA-2026-0655' ? 'VALIDÉ DG' : 'VALIDE POUR PAIEMENT',
]);

const DEFS: Def[] = [
  ...FACTURES_DE_DECOMPTE,
  ['FA-2026-0390', 'FACTURE', '2026-03-12', FOURNISSEURS[5], 'TAM-APP', '', 'Échantillons et gabarits de menuiserie', 74800, 'CLOTURÉ'],
  ['FA-2026-0402', 'FACTURE', '2026-03-30', FOURNISSEURS[2], 'ANF-RES', '', 'Essais de mise en eau (doublon)', 19600, 'ANNULATION'],
  ['FA-2026-0801', 'FACTURE', '2026-10-05', FOURNISSEURS[4], 'ANF-RES', '', 'Branchement provisoire de chantier', 48500, 'EN COURS'],
  ['FA-2026-0815', 'FACTURE', '2026-10-14', FOURNISSEURS[3], 'PAL-VIL', '', 'Béton prêt à l’emploi — livraisons de septembre', 126000, 'VALIDE POUR PAIEMENT'],
  ['FA-2026-0822', 'FACTURE', '2026-10-19', FOURNISSEURS[6], 'TAM-APP', 'LOT-06', 'Fourniture de la colonne montante', 212400, 'VALIDÉ DT'],
  ['FA-2026-0840', 'FACTURE', '2026-10-27', FOURNISSEURS[1], 'PAL-VIL', 'LOT-09', 'Terrassement des clôtures', 33200, 'EN COURS'],
  ['DV-2026-011', 'DEVIS', '2026-08-03', FOURNISSEURS[4], 'PAL-VIL', 'LOT-04', 'Courants forts — villas type A', 1180000, ''],
  ['DV-2026-012', 'DEVIS', '2026-08-05', FOURNISSEURS[0], 'PAL-VIL', 'LOT-04', 'Courants forts — villas type A', 1235000, ''],
  ['DV-2026-014', 'DEVIS', '2026-08-18', FOURNISSEURS[5], 'TAM-APP', 'LOT-05', 'Menuiserie aluminium — 64 logements', 1760000, ''],
  ['DV-2026-015', 'DEVIS', '2026-08-21', FOURNISSEURS[6], 'TAM-APP', 'LOT-06', 'Plomberie sanitaire — réseaux intérieurs', 940000, ''],
  ['BC-2026-031', 'BON DE COMMANDE', '2026-08-24', FOURNISSEURS[6], 'TAM-APP', 'LOT-06', 'Plomberie sanitaire — réseaux intérieurs', 940000, 'EN COURS'],
  ['BC-2026-034', 'BON DE COMMANDE', '2026-09-02', FOURNISSEURS[1], 'PAL-VIL', 'LOT-09', 'Clôtures et portails', 410000, 'EN COURS'],
  ['BC-2026-036', 'BON DE COMMANDE', '2026-09-15', FOURNISSEURS[3], 'PAL-VIL', '', 'Béton prêt à l’emploi — campagne T4', 560000, 'VALIDÉ DG'],
  ['BC-2026-038', 'BON DE COMMANDE', '2026-09-28', FOURNISSEURS[4], 'ANF-RES', '', 'Tableaux électriques provisoires', 88000, 'DDE VALIDATION DG'],
  ['BC-2026-040', 'BON DE COMMANDE', '2026-10-06', FOURNISSEURS[0], 'ANF-RES', '', 'Location de banches', 64000, 'ANNULATION'],
  ['BL-2022-007', 'BON DE LIVRAISON', '2022-04-11', FOURNISSEURS[3], 'ANF-RES', '', 'Livraison de ciment CPJ 45', 31400, 'VALIDÉ DG'],
  ['BL-2022-009', 'BON DE LIVRAISON', '2022-05-23', FOURNISSEURS[3], 'ANF-RES', '', 'Livraison de ciment CPJ 45', 29800, 'EN COURS'],
  ['BL-2022-012', 'BON DE LIVRAISON', '2022-06-30', FOURNISSEURS[1], 'ANF-RES', '', 'Livraison de remblai tout-venant', 18900, 'EN COURS'],
  ['AV-2026-003', 'AVOIR', '2026-04-22', FOURNISSEURS[0], 'ANF-RES', 'LOT-01', 'Avoir sur FA-2026-0412 — erreur de quantité', 9800, 'VALIDE POUR PAIEMENT'],
  ['AV-2026-005', 'AVOIR', '2026-08-09', FOURNISSEURS[2], 'ANF-RES', 'LOT-02', 'Avoir sur FA-2026-0731 — remise de fin de lot', 6200, 'EN COURS'],
  ['DR-2026-006', 'DOCUMENT À RÉGLER', '2026-01-20', FOURNISSEURS[0], 'ANF-RES', 'LOT-01', 'Avance sur marché', 150000, 'EN COURS'],
  ['DR-2026-014', 'DOCUMENT À RÉGLER', '2026-06-30', FOURNISSEURS[0], 'PAL-VIL', 'LOT-03', 'Avance sur décompte n° 1', 62000, 'EN COURS'],
];

// règlement, facture, part du TTC de la facture affectée
const PARTS: [string, string, number][] = [
  ['RG-2026-0231', 'FA-2026-0412', 1],
  ['RG-2026-0302', 'FA-2026-0587', 0.5],
  ['RG-2026-0198', 'FA-2026-0390', 1],
  ['RG-2026-0290', 'FA-2026-0390', 0.5],
];

const REGLEMENTS_ANNULES = new Set(['RG-2026-0290']);

const ttcDe = (ht: number): number => arrondi(ht * (1 + TVA));
const ttcFacture = (numero: string): number => ttcDe(DEFS.find((d) => d[0] === numero)?.[7] ?? 0);

export const AFFECTATIONS: Ligne[] = PARTS.map(([reglement, facture, part], i) => ({ id: String(i + 1), reglement, facture, montant: arrondi(ttcFacture(facture) * part) }));

const reglePar = (numero: string): number => arrondi(AFFECTATIONS.filter((a) => a.facture === numero && !REGLEMENTS_ANNULES.has(String(a.reglement))).reduce((s, a) => s + Number(a.montant), 0));

export const DOCUMENTS: Ligne[] = DEFS.map(([numero, type, date, fournisseur, projet, lot, objet, ht, statut], i) => {
  const ttc = ttcDe(ht);
  const regle = reglePar(numero);
  return { id: String(i + 1), numero, type, date, fournisseur, projet, lot, objet, ht, tva: arrondi(ttc - ht), ttc, regle, reste: arrondi(ttc - regle), statut, echeance: decaler(date, 60) };
});

const REGLEMENTS_DEF: [string, string, string, string, string][] = [
  ['RG-2026-0231', 'VIREMENT', 'Banque Atlantique du Maroc', 'Pointé', 'FA-2026-0412'],
  ['RG-2026-0302', 'VIREMENT', 'Banque Atlantique du Maroc', 'En cours', 'FA-2026-0587'],
  ['RG-2026-0198', 'CHÈQUE', 'Banque Centrale Populaire', 'Pointé', 'FA-2026-0390'],
  ['RG-2026-0290', 'CHÈQUE', 'Banque Centrale Populaire', 'Annulé', 'FA-2026-0390'],
];

export const REGLEMENTS: Ligne[] = REGLEMENTS_DEF.map(([numero, type, banque, statut, facture], i) => {
  const doc = DOCUMENTS.find((d) => d.numero === facture) as Ligne;
  return {
    id: String(i + 1),
    numero,
    date: decaler(String(doc.date), 20),
    fournisseur: doc.fournisseur,
    type,
    banque,
    statut,
    montant: arrondi(AFFECTATIONS.filter((a) => a.reglement === numero).reduce((s, a) => s + Number(a.montant), 0)),
  };
});

const UTILISATEURS = ['Amina Kadiri', 'Omar Fassi', 'Rachid Naciri'];

export const HISTORIQUE: Ligne[] = DOCUMENTS.flatMap((d) => {
  const etapes = cheminStatut(String(d.statut));
  return etapes.slice(1).map((cible, k) => ({
    id: `${d.id}-${k + 1}`,
    document: d.numero,
    date: decaler(String(d.date), 2 * (k + 1)),
    de: etapes[k],
    a: cible,
    utilisateur: UTILISATEURS[(Number(d.id) + k) % UTILISATEURS.length],
    note: k === etapes.length - 2 ? 'Vérifié sur pièces' : '',
  }));
});
