import { useEffect, useState } from 'react';
import { getImagePlan } from './apiPlans';
import { errorMessage } from './useApi';
import type { TraceDto } from '../types/plans';

export const COULEUR_NEUTRE = '#9ca3af';

export interface StatutPlan {
  cle: string;
  libelle: string;
  couleur: string;
}

/** Nom de couleur CSS du statut (`ColorName`), sinon gris ; toute valeur qui n'est pas un simple nom est écartée. */
function couleurTrace(t: Pick<TraceDto, 'couleur'>): string {
  return t.couleur && /^[A-Za-z]{3,30}$/.test(t.couleur) ? t.couleur : COULEUR_NEUTRE;
}

export function statutDeTrace(t: TraceDto): StatutPlan {
  if (t.libre) return { cle: 'libre', libelle: 'Libre', couleur: COULEUR_NEUTRE };
  return { cle: t.statutCode ?? 'occupe', libelle: t.statutLibelle ?? 'Occupé', couleur: couleurTrace(t) };
}

/** Statuts présents sur le plan, libellés triés. */
export function statutsPresents(traces: readonly TraceDto[]): StatutPlan[] {
  const parCle = new Map<string, StatutPlan>();
  for (const t of traces) {
    const s = statutDeTrace(t);
    if (!parCle.has(s.cle)) parCle.set(s.cle, s);
  }
  return [...parCle.values()].sort((a, b) => a.libelle.localeCompare(b.libelle, 'fr'));
}

export const MESSAGE_SOUS_ARTICLE = 'Vous ne pouvez pas ajouter une prospection pour un sous article';

/** Ce que fait le clic sur un tracé : libre → prospection, occupé → dossier en dialogue. */
export function actionTrace(t: TraceDto): 'prospection' | 'dossier' | 'sous-article' | null {
  if (!t.libre) return t.dossierId ? 'dossier' : null;
  return t.estSousArticle ? 'sous-article' : 'prospection';
}

export function libelleTrace(t: TraceDto): string {
  const statut = statutDeTrace(t).libelle;
  return [t.code, statut, t.client].filter(Boolean).join(' — ');
}

/** Image du plan par `fetch` + blob (cookie httpOnly) ; l'URL est libérée au changement de plan. */
export function useImagePlan(planId: string): { url: string | null; erreur: string | null } {
  const [etat, setEtat] = useState<{ planId: string; url: string | null; erreur: string | null } | null>(null);
  useEffect(() => {
    let annule = false;
    let url: string | null = null;
    getImagePlan(planId)
      .then((u) => {
        if (annule) URL.revokeObjectURL(u);
        else {
          url = u;
          setEtat({ planId, url: u, erreur: null });
        }
      })
      .catch((err: unknown) => {
        if (!annule) setEtat({ planId, url: null, erreur: errorMessage(err) });
      });
    return () => {
      annule = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [planId]);
  return etat?.planId === planId ? etat : { url: null, erreur: null };
}
