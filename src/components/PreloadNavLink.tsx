import { NavLink, type NavLinkProps } from 'react-router-dom';
import { preloadRoute } from '../lib/routeModules';

/** `NavLink` qui précharge le chunk de sa destination au survol ou au focus.
 *
 * Les pages sont chargées en `React.lazy`, donc un clic dans le menu était un
 * départ à froid : résoudre le chunk, le télécharger, télécharger ses
 * sous-chunks, puis seulement lancer la première requête de la page. Le survol
 * précède le clic de quelques centaines de millisecondes — assez pour que
 * l'import soit déjà résolu au moment du clic.
 *
 * `onFocus` autant que `onMouseEnter` : la navigation au clavier n'a pas de
 * survol, et sans lui le préchargement ne bénéficierait qu'à la souris.
 *
 * `preloadRoute` ignore silencieusement un chemin absent de la carte, donc ce
 * composant est utilisable pour n'importe quel lien sans condition. */
export default function PreloadNavLink({ to, onMouseEnter, onFocus, ...rest }: NavLinkProps) {
  const preload = () => {
    if (typeof to === 'string') preloadRoute(to);
  };

  return (
    <NavLink
      to={to}
      // Les gestionnaires reçus sont conservés : ce composant est rendu via la
      // prop `render` de `SidebarMenuButton`, qui peut fusionner les siens.
      onMouseEnter={(e) => {
        preload();
        onMouseEnter?.(e);
      }}
      onFocus={(e) => {
        preload();
        onFocus?.(e);
      }}
      {...rest}
    />
  );
}
