import { construire, texte } from './colonnes';
import { configListe } from './configListe';
import type { ConfigEcran } from './types';

/** Données fictives communes aux maquettes Projet et Achat : le lot et le fournisseur d'un écran se retrouvent dans l'autre. */
export const FOURNISSEURS = [
  'SOGEBAT SARL', 'Maroc Terrassement SA', 'Atlas Étanchéité SARL', 'Béton Plus SARL', 'Électro Chantier SA', 'Alu Design Maroc SARL', 'Plomberie du Littoral SARL',
];

export const SOCIETE = 'Horizon Immobilier SA';

export const PROJETS = [
  { code: 'ANF-RES', libelle: 'Résidence Anfa Horizon', tranches: ['Tranche 1', 'Tranche 2'] },
  { code: 'PAL-VIL', libelle: 'Villas de la Palmeraie', tranches: ['Tranche 1'] },
  { code: 'TAM-APP', libelle: 'Résidence Tamesna Verte', tranches: ['Tranche 1', 'Tranche 2'] },
];

export const LIGNES_FOURNISSEURS = construire(
  ['code', 'raison', 'ville', 'telephone', 'ice', 'rib'],
  [
    ['FOU-001', FOURNISSEURS[0], 'Casablanca', '05 22 40 11 20', '001234567000011', '011 780 0001234567890123 45'],
    ['FOU-002', FOURNISSEURS[1], 'Casablanca', '05 22 61 70 08', '001345678000022', '007 780 0004567890123456 12'],
    ['FOU-003', FOURNISSEURS[2], 'Rabat', '05 37 70 52 31', '001456789000033', '021 810 0007890123456789 77'],
    ['FOU-004', FOURNISSEURS[3], 'Mohammedia', '05 23 31 90 44', '001567890000044', '013 780 0002345678901234 36'],
    ['FOU-005', FOURNISSEURS[4], 'Casablanca', '05 22 99 15 63', '001678901000055', '230 780 0005678901234567 08'],
    ['FOU-006', FOURNISSEURS[5], 'Salé', '05 37 80 27 19', '001789012000066', '007 810 0008901234567890 51'],
    ['FOU-007', FOURNISSEURS[6], 'Bouskoura', '05 22 33 48 02', '001890123000077', '011 780 0003456789012345 94'],
  ],
);

export const CONFIG_FOURNISSEURS: ConfigEcran = configListe({
  titre: 'Fournisseurs',
  unite: 'fournisseur',
  nature: 'Fournisseur',
  recherche: 'Raison sociale, ville, ICE…',
  colonnes: [texte('code', 'Code', 9), texte('raison', 'Raison sociale', 20), texte('ville', 'Ville', 12), texte('telephone', 'Téléphone', 12), texte('ice', 'ICE', 14), texte('rib', 'RIB', 24)],
  lignes: LIGNES_FOURNISSEURS,
  filtres: ['ville'],
});

export interface LigneBordereau {
  code: string;
  designation: string;
  unite: string;
  qte: number;
  pu: number;
  tva: number;
}

export type FamilleBordereau = 'GO' | 'ETA' | 'GEN';

const l = (code: string, designation: string, unite: string, qte: number, pu: number): LigneBordereau => ({ code, designation, unite, qte, pu, tva: 0.2 });

export const BORDEREAUX: Record<FamilleBordereau, LigneBordereau[]> = {
  GO: [
    l('TER-01', 'Terrassements généraux', 'm3', 2400, 85),
    l('BET-01', 'Béton de propreté', 'm3', 320, 780),
    l('BAR-02', 'Béton armé en fondations', 'm3', 540, 2450),
    l('MAC-03', 'Maçonnerie en élévation', 'm2', 3200, 210),
    l('ETA-04', 'Chape et enduits', 'm2', 900, 165),
  ],
  ETA: [
    l('ETA-01', "Complexe d'étanchéité multicouche", 'm2', 1800, 165),
    l('ETA-02', 'Isolation thermique', 'm2', 1800, 95),
    l('ETA-03', 'Relevés et protections', 'ml', 620, 120),
  ],
  GEN: [
    l('GEN-01', 'Installation et préparation du chantier', 'forfait', 1, 85000),
    l('GEN-02', 'Fourniture et pose', 'u', 120, 4800),
    l('GEN-03', 'Essais et réception', 'forfait', 1, 32000),
  ],
};
