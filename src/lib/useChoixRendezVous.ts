import { getReferentielPatrimoine } from './apiPatrimoine';
import { referentielItems } from './referentiels';
import { useApi } from './useApi';

export type ChoixListe = { label: string; value: string }[];

/** Personnel (déclencheur et gestionnaire des rendez-vous). */
export function useChoixPersonnes(): ChoixListe {
  const personnes = useApi(() => getReferentielPatrimoine('personnels'), [], 'rdv-personnes');
  return referentielItems(personnes.data ?? []);
}

/** Ajoute la valeur déjà portée par l'enregistrement quand la liste ne la contient pas. */
export function avecValeur(items: ChoixListe, id: string | null, libelle: string | null): ChoixListe {
  if (!id || items.some((i) => i.value === id)) return items;
  return [...items, { label: libelle ?? id, value: id }];
}
