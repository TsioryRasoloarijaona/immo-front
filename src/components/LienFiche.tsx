import type { ComponentProps } from 'react';
import { Link } from 'react-router-dom';
import { usePreview, type FicheCible } from '../lib/previewContext';

function cheminFiche(c: FicheCible): string {
  switch (c.type) {
    case 'prospection':
      return `${c.pre ? '/pre-prospections' : '/prospections'}/${c.id}`;
    case 'dossier':
      return c.onglet ? `/dossiers/${c.id}?onglet=${c.onglet}` : `/dossiers/${c.id}`;
    case 'prospect':
      return `/prospects/${c.id}`;
    case 'article':
      return `/articles/${c.id}`;
  }
}

/** Lien vers la fiche d'une autre entité : un clic l'ouvre en dialogue empilé ; ctrl/⌘/maj-clic et clic
 * du milieu gardent le vrai `href` (nouvel onglet). Le clic ne remonte pas (lignes cliquables). */
export default function LienFiche({ cible, onClick, ...props }: Omit<ComponentProps<typeof Link>, 'to'> & { cible: FicheCible }) {
  const { ouvrirFiche } = usePreview();

  return (
    <Link
      {...props}
      to={cheminFiche(cible)}
      onClick={(e) => {
        onClick?.(e);
        e.stopPropagation();
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        ouvrirFiche(cible);
      }}
    />
  );
}
