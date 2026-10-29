import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { voisinsDe, type VoisinsFiche } from './fenetreFiche';

export interface FenetreListe {
  /** Id de la fiche ouverte (segment `:id?` de la route), absent quand seule la liste est affichée. */
  idOuvert?: string;
  ouvrir: (id: string) => void;
  fermer: () => void;
  voisins: VoisinsFiche;
}

/**
 * Liste qui reste montée sous la fenêtre de fiche : `base` = `/projets`, la fiche est `<base>/<id>` (route unique
 * `<base>/:id?`). La recherche de l'URL est conservée d'une ligne à l'autre. `ids` = lignes de la page affichée (‹ ›).
 */
export default function useFenetreListe(base: string, ids: string[]): FenetreListe {
  const { id: idOuvert } = useParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  const aller = (chemin: string) => void navigate(chemin + search);
  const ouvrir = (id: string) => aller(`${base}/${id}`);
  return { idOuvert, ouvrir, fermer: () => aller(base), voisins: voisinsDe(ids, idOuvert, ouvrir) };
}
