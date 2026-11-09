import { arrondi } from '../../../components/maquette/colonnes';
import { BORDEREAUX, FOURNISSEURS, type FamilleBordereau, type LigneBordereau } from '../../../components/maquette/communes';
import type { LigneRecap } from '../../../components/maquette/TableauRecap';
import type { Ligne } from '../../../components/maquette/types';

/** Taux du marché, identiques pour tous les lots de la maquette. */
export const TAUX = { avance: 0.1, plafondAvance: 150000, garantie: 0.1, prorata: 0.02 };

export interface DefLot {
  code: string;
  libelle: string;
  projet: string;
  tranche: string;
  type: string;
  fournisseur: string;
  statut: string;
  famille: FamilleBordereau;
  debut: string;
  fin: string;
  lignes: LigneBordereau[];
}

type TupleLot = [string, string, string, string, string, string, string, FamilleBordereau, number, string, string];

// Statuts et types : valeurs réelles d'OMRAN (PLAN-projet.md §2).
const TUPLES_LOTS: TupleLot[] = [
  ['LOT-01', 'Terrassement et gros œuvre', 'ANF-RES', 'Tranche 1', 'TRAVAUX', FOURNISSEURS[0], 'EXCECUTION', 'GO', 1, '2026-01-12', '2026-09-30'],
  ['LOT-02', 'Étanchéité et isolation', 'ANF-RES', 'Tranche 1', 'TRAVAUX', FOURNISSEURS[2], 'EXCECUTION', 'ETA', 0.6, '2026-04-06', '2026-10-30'],
  ['LOT-03', 'Gros œuvre des villas', 'PAL-VIL', 'Tranche 1', 'TRAVAUX', FOURNISSEURS[0], 'EXCECUTION', 'GO', 1.8, '2026-03-02', '2027-02-26'],
  ['LOT-04', 'Électricité courants forts', 'PAL-VIL', 'Tranche 1', 'TRAVAUX', '', 'DEPOUILLEMENT', 'GEN', 0.5, '2026-09-14', '2027-03-31'],
  ['LOT-05', 'Menuiserie aluminium', 'TAM-APP', 'Tranche 2', 'TRAVAUX', FOURNISSEURS[5], 'ADJUDICATION', 'GEN', 0.8, '2026-10-05', '2027-05-28'],
  ['LOT-06', 'Plomberie sanitaire', 'TAM-APP', 'Tranche 2', 'TRAVAUX', FOURNISSEURS[6], 'Commandes', 'GEN', 0.7, '2026-08-17', '2027-01-29'],
  ['LOT-07', 'Aménagements extérieurs', 'ANF-RES', 'Tranche 2', 'DIVERS TRAVAUX', '', "APPEL D'OFFRE", 'GEN', 0.3, '2027-01-11', '2027-06-30'],
  ['LOT-08', 'Étude géotechnique', 'TAM-APP', 'Tranche 1', 'AUTRE', '', 'ESTIMATION', 'GEN', 0.1, '2026-11-02', '2026-12-18'],
  ['LOT-09', 'Clôtures et portails', 'PAL-VIL', 'Tranche 1', 'TRAVAUX', FOURNISSEURS[1], 'En cours', 'GEN', 0.4, '2026-06-01', '2026-11-27'],
  ['LOT-10', 'Peinture intérieure', 'ANF-RES', 'Tranche 1', 'TRAVAUX', FOURNISSEURS[3], 'Commandes clôturées', 'GEN', 0.9, '2025-09-01', '2026-03-13'],
];

export const LOTS_DEF: DefLot[] = TUPLES_LOTS.map(([code, libelle, projet, tranche, type, fournisseur, statut, famille, k, debut, fin]) => ({
  code,
  libelle,
  projet,
  tranche,
  type,
  fournisseur,
  statut,
  famille,
  debut,
  fin,
  lignes: BORDEREAUX[famille].map((b) => ({ ...b, qte: Math.max(1, Math.round(b.qte * k)) })),
}));

export const montantMarche = (lot: DefLot): number => arrondi(lot.lignes.reduce((s, b) => s + b.qte * b.pu, 0));

interface Saisie {
  lot: string;
  date: string;
  ratios: number[];
  revision: number;
  extra: number;
  facture: string;
  statut: string;
}

/** Avancement cumulé par ligne de bordereau, révision de prix cumulée et travaux supplémentaires cumulés (TTC). */
const SAISIES: Saisie[] = [
  { lot: 'LOT-01', date: '2026-02-20', ratios: [0.6, 0.5, 0.2, 0, 0], revision: 0, extra: 0, facture: 'FA-2026-0412', statut: 'FACTURÉ' },
  { lot: 'LOT-01', date: '2026-04-18', ratios: [1, 1, 0.55, 0.15, 0], revision: 3800, extra: 0, facture: 'FA-2026-0587', statut: 'FACTURÉ' },
  { lot: 'LOT-01', date: '2026-06-25', ratios: [1, 1, 0.8, 0.4, 0.1], revision: 7200, extra: 18000, facture: '', statut: 'VALIDÉ' },
  { lot: 'LOT-02', date: '2026-07-08', ratios: [0.5, 0.4, 0.3], revision: 0, extra: 0, facture: 'FA-2026-0731', statut: 'FACTURÉ' },
  { lot: 'LOT-02', date: '2026-09-02', ratios: [1, 0.8, 0.7], revision: 1100, extra: 0, facture: '', statut: 'EN COURS' },
  { lot: 'LOT-03', date: '2026-06-12', ratios: [0.7, 0.4, 0.1, 0, 0], revision: 0, extra: 0, facture: 'FA-2026-0655', statut: 'FACTURÉ' },
];

interface Cumul {
  qtes: number[];
  ht: number;
  tva: number;
  ttc: number;
  avance: number;
  garantie: number;
  prorata: number;
  extra: number;
  revision: number;
  net: number;
}

const VIDE: Cumul = { qtes: [], ht: 0, tva: 0, ttc: 0, avance: 0, garantie: 0, prorata: 0, extra: 0, revision: 0, net: 0 };

/** Seule fonction de calcul de la maquette : cumuls au décompte, formules de PLAN-projet.md §3. */
function cumulDe(lot: DefLot, s: Saisie): Cumul {
  const qtes = lot.lignes.map((b, i) => arrondi(b.qte * s.ratios[i]));
  const ht = arrondi(qtes.reduce((somme, q, i) => somme + q * lot.lignes[i].pu, 0));
  const tva = arrondi(qtes.reduce((somme, q, i) => somme + q * lot.lignes[i].pu * lot.lignes[i].tva, 0));
  const ttc = arrondi(ht + tva);
  const avance = arrondi(Math.min(TAUX.avance * ttc, TAUX.plafondAvance));
  const garantie = arrondi(TAUX.garantie * ttc);
  const prorata = arrondi(TAUX.prorata * ttc);
  const net = arrondi(ttc - avance - garantie - prorata + s.extra + s.revision);
  return { qtes, ht, tva, ttc, avance, garantie, prorata, extra: s.extra, revision: s.revision, net };
}

export interface DecompteCalcule {
  id: string;
  numero: number;
  lot: DefLot;
  saisie: Saisie;
  cumul: Cumul;
  precedent: Cumul;
}

export const DECOMPTES_CALCULES: DecompteCalcule[] = SAISIES.map((saisie, i) => {
  const lot = LOTS_DEF.find((d) => d.code === saisie.lot) as DefLot;
  const memeLot = SAISIES.slice(0, i).filter((s) => s.lot === saisie.lot);
  const precedente = memeLot.at(-1);
  return {
    id: String(i + 1),
    numero: memeLot.length + 1,
    lot,
    saisie,
    cumul: cumulDe(lot, saisie),
    precedent: precedente ? cumulDe(lot, precedente) : VIDE,
  };
});

const decompteDe = (id: string): DecompteCalcule => DECOMPTES_CALCULES.find((d) => d.id === id) as DecompteCalcule;

export function lignesDecompte(id: string): Ligne[] {
  const { lot, cumul, precedent } = decompteDe(id);
  return lot.lignes.map((b, i) => {
    const prec = precedent.qtes.at(i) ?? 0;
    return {
      id: b.code,
      code: b.code,
      designation: b.designation,
      unite: b.unite,
      qteMarche: b.qte,
      qtePrec: prec,
      qtePeriode: arrondi(cumul.qtes[i] - prec),
      qteCum: cumul.qtes[i],
      mntPrec: arrondi(prec * b.pu),
      mntPeriode: arrondi((cumul.qtes[i] - prec) * b.pu),
      mntCum: arrondi(cumul.qtes[i] * b.pu),
    };
  });
}

const CHAMPS_RECAP: { libelle: string; cle: keyof Omit<Cumul, 'qtes'>; signe: 1 | -1 }[] = [
  { libelle: 'Montant HT des travaux', cle: 'ht', signe: 1 },
  { libelle: 'TVA', cle: 'tva', signe: 1 },
  { libelle: 'Montant TTC des travaux', cle: 'ttc', signe: 1 },
  { libelle: "Remboursement d'avance (10 %, plafonné)", cle: 'avance', signe: -1 },
  { libelle: 'Retenue de garantie (10 %)', cle: 'garantie', signe: -1 },
  { libelle: 'Compte prorata (2 %)', cle: 'prorata', signe: -1 },
  { libelle: 'Travaux supplémentaires', cle: 'extra', signe: 1 },
  { libelle: 'Révision de prix', cle: 'revision', signe: 1 },
];

/** Net à payer = TTC − avance − garantie − prorata + travaux supplémentaires + révision, sur le cumul puis sur la période. */
export function recapDecompte(id: string): LigneRecap[] {
  const { cumul, precedent } = decompteDe(id);
  const trio = (c: number, p: number) => [c, p, arrondi(c - p)];
  const lignes = CHAMPS_RECAP.map((f) => ({ libelle: f.libelle, valeurs: trio(f.signe * cumul[f.cle], f.signe * precedent[f.cle]) }));
  return [...lignes, { libelle: 'Net à payer', valeurs: trio(cumul.net, precedent.net), total: true }];
}

export const netAPayer = (d: DecompteCalcule): number => arrondi(d.cumul.net - d.precedent.net);
