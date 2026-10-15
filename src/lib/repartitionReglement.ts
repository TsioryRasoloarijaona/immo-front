import { formatNumber } from './format';
import type { AffectationReglementDto, AffectationReglementRequest, EcheanceDto } from '../types';

const AFFECTATIONS_AFFICHEES = 3;

/** « AVANCE 50 000,00 · FRAIS SYNDIC 200,00 », puis « + N » au-delà de trois lignes. */
export function resumeAffectations(affectations: readonly AffectationReglementDto[]): string {
  const visibles = affectations
    .slice(0, AFFECTATIONS_AFFICHEES)
    .map((a) => `${a.echeanceLibelle ?? 'Échéance'} ${formatNumber(a.montant ?? 0, 2)}`);
  const masquees = affectations.length - AFFECTATIONS_AFFICHEES;
  return masquees > 0 ? `${visibles.join(' · ')} + ${masquees}` : visibles.join(' · ');
}

/** Montant saisi par échéance cochée (`echeanceId` → texte du champ) ; une échéance absente est décochée. */
export type Saisies = Readonly<Record<string, string>>;

// En millionièmes, l'échelle des colonnes decimal(26,6) : au centime, un reste de 1 234,567 s'arrondirait
// à 1 234,57 et le serveur, qui compare exactement, refuserait la ligne (400).
function unites(valeur: number): number {
  return Math.round(valeur * 1_000_000);
}

function depuisUnites(valeur: number): number {
  return valeur / 1_000_000;
}

/** Échéances du dossier encore dues (reste > 0), la plus ancienne d'abord. */
export function echeancesAffectables(echeances: readonly EcheanceDto[]): EcheanceDto[] {
  // `filter` rend une copie : le tableau du cache `useApi` n'est pas trié en place.
  return echeances
    .filter((e) => unites(e.reste ?? 0) > 0)
    .sort((a, b) => (a.dateEcheance ?? '').localeCompare(b.dateEcheance ?? ''));
}

/** `null` pour un champ vide ou illisible. */
export function montantSaisi(texte: string | undefined): number | null {
  if (texte === undefined || texte.trim() === '') return null;
  const valeur = Number(texte);
  return Number.isNaN(valeur) ? null : valeur;
}

/**
 * « Répartir » : tout décocher, puis remplir les échéances de la plus ancienne à la plus récente avec
 * min(reste dû, montant restant) jusqu'à épuiser le montant.
 */
export function repartir(echeances: readonly EcheanceDto[], montant: number): Saisies {
  const saisies: Record<string, string> = {};
  let restant = unites(montant);
  for (const echeance of echeances) {
    if (restant <= 0) break;
    const part = Math.min(unites(echeance.reste ?? 0), restant);
    if (part > 0) {
      saisies[echeance.id] = String(depuisUnites(part));
      restant -= part;
    }
  }
  return saisies;
}

export function totalAffecte(saisies: Saisies): number {
  return depuisUnites(Object.values(saisies).reduce((total, texte) => total + unites(montantSaisi(texte) ?? 0), 0));
}

/** Différence exacte : négative quand les lignes dépassent le montant à répartir. */
export function resteARepartir(montant: number | null, saisies: Saisies): number {
  return depuisUnites(unites(montant ?? 0) - unites(totalAffecte(saisies)));
}

/** Contrôle d'une ligne cochée, le même que le serveur : 0 < montant ≤ reste dû. */
export function erreurLigne(texte: string, reste: number | undefined): string | null {
  const valeur = montantSaisi(texte);
  if (valeur === null || unites(valeur) <= 0) return 'Montant strictement positif requis.';
  if (unites(valeur) > unites(reste ?? 0)) return 'Dépasse le reste dû.';
  return null;
}

/** Au moins une ligne, chacune valide, et Σ ≤ montant à répartir. */
export function repartitionValide(echeances: readonly EcheanceDto[], saisies: Saisies, montant: number | null): boolean {
  const ids = Object.keys(saisies);
  if (ids.length === 0 || montant === null || resteARepartir(montant, saisies) < 0) return false;
  return ids.every((id) => {
    const echeance = echeances.find((e) => e.id === id);
    return echeance !== undefined && erreurLigne(saisies[id], echeance.reste) === null;
  });
}

export function versAffectations(saisies: Saisies): AffectationReglementRequest[] {
  return Object.entries(saisies).map(([echeanceId, texte]) => ({ echeanceId, montant: montantSaisi(texte) ?? 0 }));
}
