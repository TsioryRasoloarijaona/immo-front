import type { LigneModeleDto } from '../types/projet';

/** Ligne de modèle en saisie : temps, avancement et paiement en % (le fil porte des fractions 0–1). */
export interface LigneModeleEditee {
  cle: string;
  temps: number | null;
  avancement: number | null;
  paiement: number | null;
}

const arrondi = (v: number) => Math.round(v * 1e6) / 1e6;

let compteur = 0;
const cleSuivante = () => `m${++compteur}`;

export function lignesDepuisDto(lignes: LigneModeleDto[]): LigneModeleEditee[] {
  return lignes.map((l) => ({ cle: cleSuivante(), temps: arrondi(l.temps * 100), avancement: arrondi(l.avancement * 100), paiement: arrondi(l.paiement * 100) }));
}

export function versLignesDto(lignes: LigneModeleEditee[]): LigneModeleDto[] {
  return lignes.map((l) => ({ temps: arrondi((l.temps ?? 0) / 100), avancement: arrondi((l.avancement ?? 0) / 100), paiement: arrondi((l.paiement ?? 0) / 100) }));
}

/** Nouvelle ligne : paiement = 100 − Σ des paiements des autres lignes. */
export function ajouterLigne(lignes: LigneModeleEditee[]): LigneModeleEditee[] {
  const somme = lignes.reduce((s, l) => s + (l.paiement ?? 0), 0);
  return [...lignes, { cle: cleSuivante(), temps: null, avancement: null, paiement: arrondi(Math.max(0, 100 - somme)) }];
}

export interface PointGraphique {
  temps: number;
  avancement: number;
  paiementCumule: number;
}

/** Points du graphique (fractions 0–1), triés par temps ; le paiement est cumulé. */
export function pointsGraphique(lignes: LigneModeleDto[]): PointGraphique[] {
  let cumul = 0;
  return [...lignes]
    .sort((a, b) => a.temps - b.temps)
    .map((l) => {
      cumul += l.paiement;
      return { temps: l.temps, avancement: l.avancement, paiementCumule: cumul };
    });
}
