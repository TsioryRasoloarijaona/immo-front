import { useEffect, type RefObject } from 'react';

/** Classe d'une barre d'icônes seules (`index.css`) : un bouton à icône n'y affiche que son icône. */
export const ICONES_SEULES = 'icones-seules';

/**
 * Infobulle et nom accessible des boutons d'une barre `ICONES_SEULES` : leur libellé, masqué à l'écran, devient leur
 * `title` et `aria-label`. Un `title` posé par le composant est gardé ; le nôtre suit le libellé (Archiver / Désarchiver).
 */
export function useIconesSeules(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const racine = ref.current;
    if (!racine) return;
    const marquer = () => {
      for (const b of racine.querySelectorAll<HTMLElement>('button, a')) {
        const texte = b.textContent.trim();
        if (!texte || !b.querySelector('svg')) continue;
        if (!b.title || b.dataset.titreAuto === '1') {
          b.title = texte;
          b.dataset.titreAuto = '1';
        }
        if (!b.getAttribute('aria-label') || b.dataset.nomAuto === '1') {
          b.setAttribute('aria-label', texte);
          b.dataset.nomAuto = '1';
        }
      }
    };
    marquer();
    const observateur = new MutationObserver(marquer);
    observateur.observe(racine, { subtree: true, childList: true, characterData: true });
    return () => observateur.disconnect();
  }, [ref]);
}
