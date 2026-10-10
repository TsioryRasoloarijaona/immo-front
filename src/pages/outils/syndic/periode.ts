import { montantSaisi } from './donnees';
import type { PeriodeSaisie } from './types';

/** Les trois chiffres d'un exercice, tels que tapés. */
export interface Periode {
  debut: string;
  duree: string;
  tarif: string;
}

export type PeriodeLue = { periode: PeriodeSaisie; erreur: null } | { periode: null; erreur: string };

const refus = (erreur: string): PeriodeLue => ({ periode: null, erreur });

/** Contrôle de forme avant envoi ; les règles (RM-01, RM-03, 1 à 60 mois, chevauchement) restent au service. */
export function periodeLue(p: Periode): PeriodeLue {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.debut)) return refus('La date de début n’est pas lisible.');
  const duree = Number(p.duree.trim());
  if (!Number.isInteger(duree) || duree < 1) return refus('La durée doit être un nombre de mois, entre 1 et 60.');
  const tarif = montantSaisi(p.tarif);
  if (tarif === null) return refus('Le montant par mois n’est pas lisible.');
  return { periode: { debut: p.debut, duree_mois: duree, tarif_mensuel: tarif }, erreur: null };
}

/** Un montant pour un champ de saisie : « 750,5 ». */
export const montantPourSaisie = (v: number) => String(v).replace('.', ',');
