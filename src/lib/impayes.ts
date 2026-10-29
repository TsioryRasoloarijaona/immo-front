import type { ImpayeChampDate, ImpayeEchuA, ImpayesFilterParams } from './api';
import { CASCADE_VIDE, type SelectionCascade } from './cascadeTranches';

/** État des filtres de l'écran « Impayés » ; les textes sont débouncés par la page avant l'appel. */
export type FiltresImpayes = SelectionCascade & {
  echu: ImpayeEchuA;
  champDate: ImpayeChampDate;
  du: string;
  au: string;
  commercialId: string | null;
  categorieId: string | null;
  client: string;
  article: string;
  q: string;
};

export const FILTRES_IMPAYES_DEFAUT: FiltresImpayes = {
  ...CASCADE_VIDE,
  echu: 'ECHEANCE',
  champDate: 'ECHEANCE',
  du: '',
  au: '',
  commercialId: null,
  categorieId: null,
  client: '',
  article: '',
  q: '',
};

export const ECHU_ITEMS: { label: string; value: ImpayeEchuA }[] = [
  { label: 'Échu à la date d’échéance', value: 'ECHEANCE' },
  { label: 'Échu à la date de recouvrement', value: 'RECOUVREMENT' },
  { label: 'Toutes les échéances', value: 'TOUS' },
];

/** `DOCUMENT` n'est pas proposé : pour une échéance de vente, c'est la même date que `ECHEANCE`. */
export const CHAMP_DATE_IMPAYE_ITEMS: { label: string; value: ImpayeChampDate }[] = [
  { label: 'Date échéance', value: 'ECHEANCE' },
  { label: 'Date recouvrement', value: 'RECOUVREMENT' },
];

function texte(valeur: string): string | undefined {
  const t = valeur.trim();
  return t === '' ? undefined : t;
}

/** Mêmes paramètres pour la liste et l'export : le classeur reprend exactement l'écran. */
export function paramsImpayes(f: FiltresImpayes, trancheId: string[] | undefined): ImpayesFilterParams {
  const periode = f.du !== '' || f.au !== '';
  return {
    trancheId,
    echu: f.echu,
    champDate: periode ? f.champDate : undefined,
    du: f.du || undefined,
    au: f.au || undefined,
    commercialId: f.commercialId ?? undefined,
    categorieId: f.categorieId ?? undefined,
    client: texte(f.client),
    article: texte(f.article),
    q: texte(f.q),
  };
}

export function filtresImpayesActifs(f: FiltresImpayes): boolean {
  return JSON.stringify(f) !== JSON.stringify(FILTRES_IMPAYES_DEFAUT);
}
