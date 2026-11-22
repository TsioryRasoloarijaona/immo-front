import { useMemo, useState } from 'react';
import { getProjetsPrevisions } from './apiProjet';
import { useApi } from './useApi';

export const MESSAGE_AUCUN_PROJET = 'Veuillez sélectionner au moins un projet !';

/** Projets proposés ; rien de coché = tous les projets proposés. */
export function useProjetsChoisis() {
  const liste = useApi(() => getProjetsPrevisions(), [], 'projet-tdb-projets');
  const [choix, setChoix] = useState<string[]>([]);
  const options = useMemo(() => (liste.data ?? []).map((p) => ({ value: p.id, label: p.description })), [liste.data]);
  const effectifs = choix.length > 0 ? choix : options.map((o) => o.value);
  return { liste, options, choix, setChoix, effectifs };
}

export function useReplis() {
  const [replies, setReplies] = useState<ReadonlySet<string>>(new Set());
  function bascule(cle: string) {
    setReplies((avant) => {
      const apres = new Set(avant);
      if (!apres.delete(cle)) apres.add(cle);
      return apres;
    });
  }
  return { replies, bascule };
}
