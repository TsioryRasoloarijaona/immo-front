import type { VentilationTrancheDto } from '../types/projetConfig';
import type { ChampDef } from './saisiePatrimoine';

export const CHAMPS_VENTILATION: ChampDef[] = [
  { nom: 'trancheId', libelle: 'Tranche', type: 'liste', obligatoire: true },
  { nom: 'taux', libelle: 'Taux (%)', type: 'pourcent', obligatoire: true },
];

/** Somme des taux (fractions), arrondie à 2 décimales comme le serveur ; plus de 1 = refus 400. */
export function totalVentilation(lignes: VentilationTrancheDto[]): number {
  return Math.round(lignes.reduce((somme, l) => somme + (l.taux ?? 0), 0) * 100) / 100;
}
