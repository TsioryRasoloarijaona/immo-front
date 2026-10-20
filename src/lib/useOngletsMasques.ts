import { useLayoutEffect, useRef, useState, type RefObject } from 'react';

/** Largeur réservée au bouton « Plus… » quand des onglets sont rognés. */
const LARGEUR_PLUS = 76;

function memeListe(a: string[], b: string[]) {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

/**
 * Ids des onglets (`[role=tab][data-onglet]`) qui ne tiennent pas dans la largeur de `ligne` ; ils restent dans le DOM
 * (invisibles) pour garder leur largeur. `cle` : change quand les libellés ou compteurs changent.
 */
export function useOngletsMasques(actif: boolean, cle: string): [RefObject<HTMLDivElement | null>, string[]] {
  const ligne = useRef<HTMLDivElement>(null);
  const [masques, setMasques] = useState<string[]>([]);
  useLayoutEffect(() => {
    const el = ligne.current;
    if (!actif || !el) return undefined;
    const mesurer = () => {
      const onglets = Array.from(el.querySelectorAll<HTMLElement>('[role="tab"][data-onglet]'));
      const droite = (o: HTMLElement) => o.offsetLeft + o.offsetWidth;
      const tient = onglets.every((o) => droite(o) <= el.clientWidth);
      const limite = tient ? el.clientWidth : el.clientWidth - LARGEUR_PLUS;
      const suivants = onglets.filter((o) => droite(o) > limite).map((o) => o.dataset.onglet ?? '');
      setMasques((prec) => (memeListe(prec, suivants) ? prec : suivants));
    };
    mesurer();
    const observateur = new ResizeObserver(mesurer);
    observateur.observe(el);
    return () => observateur.disconnect();
  }, [actif, cle]);
  return [ligne, masques];
}
