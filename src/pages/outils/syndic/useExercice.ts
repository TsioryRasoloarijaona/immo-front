import { useState } from 'react';
import { lireExercicesSyndic } from '../../../lib/syndic';
import { useApi } from '../../../lib/useApi';

/** L'exercice choisi à l'écran : celui que l'utilisateur a pris, sinon celui que le service propose. */
export function useExercice(revision: number) {
  const api = useApi(lireExercicesSyndic, [revision]);
  const [choisi, setChoisi] = useState<string | null>(null);
  const exercice = choisi ?? api.data?.par_defaut ?? null;
  const items = (api.data?.exercices ?? []).map((e) => ({ value: e, label: `Exercice ${e}` }));
  return { exercice, setExercice: setChoisi, items, liste: api.data, error: api.error };
}
