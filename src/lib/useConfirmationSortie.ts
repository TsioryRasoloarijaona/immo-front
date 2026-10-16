import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfirm } from './confirmContext';

/**
 * Changements non enregistrés : confirmation avant de quitter. Sans routeur de données (`BrowserRouter`), pas de
 * `useBlocker` : on intercepte en capture les clics sur les liens internes, et `beforeunload` pour l'onglet.
 */
export function useConfirmationSortie(modifie: boolean): void {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const modifieRef = useRef(modifie);

  useEffect(() => {
    modifieRef.current = modifie;
  }, [modifie]);

  useEffect(() => {
    function avantDechargement(e: BeforeUnloadEvent) {
      if (!modifieRef.current) return;
      e.preventDefault();
    }

    function clic(e: MouseEvent) {
      if (!modifieRef.current || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const lien = e.target instanceof Element ? e.target.closest('a[href]') : null;
      if (!(lien instanceof HTMLAnchorElement) || lien.target === '_blank') return;
      const url = new URL(lien.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const cible = `${url.pathname}${url.search}${url.hash}`;
      if (cible === `${window.location.pathname}${window.location.search}${window.location.hash}`) return;
      e.preventDefault();
      e.stopPropagation();
      void confirm({
        title: 'Quitter sans enregistrer ?',
        message: 'Les changements du modèle depuis le dernier enregistrement seront perdus.',
        confirmLabel: 'Quitter',
      }).then((ok) => {
        if (ok) {
          modifieRef.current = false;
          void navigate(cible);
        }
      });
    }

    window.addEventListener('beforeunload', avantDechargement);
    document.addEventListener('click', clic, true);
    return () => {
      window.removeEventListener('beforeunload', avantDechargement);
      document.removeEventListener('click', clic, true);
    };
  }, [confirm, navigate]);
}
