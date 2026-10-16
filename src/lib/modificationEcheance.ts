import type { EcheanceDto, ModifierEcheanceRequest } from '../types';
import { formatCurrency, toApiDateTime } from './format';

/** Valeurs du formulaire « Modifier une échéance », en texte comme les champs de saisie. */
export interface SaisieEcheance {
  categorieId: string | null;
  montant: string;
  dateEcheance: string;
  description: string;
  exclureDuPrix: boolean;
  notes: string;
}

export function saisieDepuis(e: EcheanceDto): SaisieEcheance {
  return {
    categorieId: e.categorieId ?? null,
    montant: e.montant == null ? '' : String(e.montant),
    dateEcheance: e.dateEcheance ? e.dateEcheance.slice(0, 10) : '',
    description: e.description ?? '',
    exclureDuPrix: !!e.exclureDuPrix,
    notes: e.notes ?? '',
  };
}

/**
 * Seuls les champs changés partent : le serveur garde les absents, et un changement de catégorie
 * reprend TVA et « Exclure du prix » de la catégorie sauf si la case est envoyée.
 */
export function champsModifies(avant: SaisieEcheance, apres: SaisieEcheance): ModifierEcheanceRequest {
  const corps: ModifierEcheanceRequest = {};
  if (apres.categorieId && apres.categorieId !== avant.categorieId) corps.categorieId = apres.categorieId;
  if (apres.montant !== '' && Number(apres.montant) !== Number(avant.montant)) corps.montant = Number(apres.montant);
  if (apres.dateEcheance && apres.dateEcheance !== avant.dateEcheance) corps.dateEcheance = toApiDateTime(apres.dateEcheance);
  if (apres.description !== avant.description) corps.description = apres.description;
  if (apres.exclureDuPrix !== avant.exclureDuPrix) corps.exclureDuPrix = apres.exclureDuPrix;
  if (apres.notes !== avant.notes) corps.notes = apres.notes;
  return corps;
}

/** Le serveur accepte un montant sous le déjà réglé (comme OMRAN) : le formulaire prévient avant l'envoi. */
export function sousLeRegle(montant: string, montantRegle: number | undefined): boolean {
  return montant !== '' && Number(montant) < (montantRegle ?? 0);
}

/** Toast après modification : l'écart du schéma et un reste négatif ne bloquent pas, ils se signalent. */
export function messageModification(e: EcheanceDto): string {
  const parties = ['Échéance modifiée.'];
  if (e.ecartSchema) parties.push(`Écart avec le prix : ${formatCurrency(e.ecartSchema)}.`);
  if ((e.reste ?? 0) < 0) parties.push('Montant inférieur au déjà réglé.');
  return parties.join(' ');
}
