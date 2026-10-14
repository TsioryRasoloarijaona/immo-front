// Libellés et petites règles d'écran des sous-listes de la fiche dossier (FEATURE-vente-echeancier.md).
import type { BadgeTone } from '../types';
import type { EtatModification, Periodicite } from '../types/dossierSousListes';

export const PERIODICITE_LIBELLES: Record<Periodicite, string> = {
  MENSUELLE: 'Mensuelle',
  BIMENSUELLE: 'Bimestrielle (2 mois)',
  TRIMESTRIELLE: 'Trimestrielle',
  SEMESTRIELLE: 'Semestrielle',
  ANNUELLE: 'Annuelle',
};

export const ETAT_MODIFICATION_LIBELLES: Record<EtatModification, string> = {
  ENCOURS: 'En cours',
  REFUSE_PAR_LE_SERVICE_TECHNIQUE: 'Refusée par le service technique',
  REFUSE_PAR_LE_CLIENT: 'Refusée par le client',
  ACCEPTEE: 'Acceptée',
  REALISED: 'Réalisée',
};

export function toneEtatModification(etat: EtatModification | null | undefined): BadgeTone {
  switch (etat) {
    case 'ACCEPTEE':
      return 'info';
    case 'REALISED':
      return 'success';
    case 'REFUSE_PAR_LE_CLIENT':
    case 'REFUSE_PAR_LE_SERVICE_TECHNIQUE':
      return 'warning';
    default:
      return 'progress';
  }
}

/** Champ numérique saisi → nombre, `undefined` si vide ou illisible (virgule décimale acceptée). */
export function lireMontant(texte: string): number | undefined {
  const propre = texte.replaceAll(' ', '').replace(',', '.');
  if (propre === '') return undefined;
  const n = Number(propre);
  return Number.isFinite(n) ? n : undefined;
}

/** Montant servi à 6 décimales (decimal(26,6)) → valeur de saisie au centime ; `undefined` si absent. */
export function arrondiCentime(valeur: number | null | undefined): number | undefined {
  return valeur == null ? undefined : Math.round(valeur * 100) / 100;
}

/** `2026-11-02T00:00:00` → `2026-11-02` pour un `<input type="date">`. */
export function versChampDate(valeur: string | null | undefined): string {
  return valeur ? valeur.slice(0, 10) : '';
}

/** Écart du schéma considéré comme nul (au centime). */
export function schemaEquilibre(ecart: number | null | undefined): boolean {
  return ecart == null || Math.abs(ecart) < 0.005;
}
