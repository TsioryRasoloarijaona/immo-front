import { listTiers } from './apiAdministration';
import { useAuth } from './auth';
import { estAgence } from './roles';
import { useApi } from './useApi';
import type { ItemFiltre } from '../components/liste/BoiteFiltre';

/** Valeur réservée du paramètre `agence` : dossiers dont le commercial n'a aucune agence. */
export const AGENCE_SIEGE = 'siege';
const TAILLE_AGENCES = 200;

/** Une agence absente se lit « Siège ». */
export function libelleAgence(agence: string | null | undefined): string {
  return agence || 'Siège';
}

/** Choix du filtre Agence : « Siège » puis les agences ; vide pour un compte agence ou sans agence configurée. */
export function useChoixAgences(): ItemFiltre[] {
  const compteAgence = estAgence(useAuth().user);
  const agences = useApi(() => (compteAgence ? Promise.resolve(null) : listTiers('agences', { size: TAILLE_AGENCES })), [compteAgence], 'agences-filtre');
  const lignes = agences.data?.content ?? [];
  if (lignes.length === 0) return [];
  return [
    { value: AGENCE_SIEGE, label: 'Siège' },
    ...lignes.map((a) => ({ value: a.id, label: a.description || a.code || a.id })),
  ];
}
