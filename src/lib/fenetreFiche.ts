import { useState } from 'react';

export interface VoisinsFiche {
  /** Rang (1 = première) dans la page de la liste ; 0 quand la fiche n'y figure pas. */
  position: number;
  total: number;
  precedent?: () => void;
  suivant?: () => void;
}

/** ‹ › parcourent les lignes de la page affichée ; aux bords, ou si la fiche n'y est pas, le bouton est inactif. */
export function voisinsDe(ids: string[], courant: string | undefined, ouvrir: (id: string) => void): VoisinsFiche {
  const rang = courant ? ids.indexOf(courant) : -1;
  return {
    position: rang + 1,
    total: ids.length,
    precedent: rang > 0 ? () => ouvrir(ids[rang - 1]) : undefined,
    suivant: rang >= 0 && rang < ids.length - 1 ? () => ouvrir(ids[rang + 1]) : undefined,
  };
}

export interface PositionFenetre {
  x: number;
  y: number;
}

const CLE_POSITION = 'arpent.fenetre.v1';

/** Position de la fenêtre mémorisée pour la session, `null` tant qu'elle n'a pas été déplacée. */
export function lirePosition(): PositionFenetre | null {
  try {
    const v: unknown = JSON.parse(sessionStorage.getItem(CLE_POSITION) ?? 'null');
    if (v && typeof v === 'object' && 'x' in v && 'y' in v && typeof v.x === 'number' && typeof v.y === 'number') {
      // Ramenée dans l'écran courant : un autre écran ou une fenêtre réduite ne doit pas la cacher.
      return { x: Math.min(Math.max(0, v.x), Math.max(0, window.innerWidth - 200)), y: Math.min(Math.max(0, v.y), Math.max(0, window.innerHeight - 100)) };
    }
  } catch {
    // Stockage indisponible ou valeur illisible : la fenêtre s'ouvre centrée.
  }
  return null;
}

export function ecrirePosition(p: PositionFenetre): void {
  try {
    sessionStorage.setItem(CLE_POSITION, JSON.stringify(p));
  } catch {
    // La position ne survit pas au rechargement, sans autre conséquence.
  }
}

const CLE_AGRANDIE = 'arpent.fenetre.v1.max';

/** La fiche suivante (‹ ›) remonte la fenêtre : l'état agrandi est donc gardé pour la session. */
export function useAgrandieMemorisee(): [boolean, () => void] {
  const [agrandie, setAgrandie] = useState(() => {
    try {
      return sessionStorage.getItem(CLE_AGRANDIE) === '1';
    } catch {
      return false;
    }
  });
  function basculer() {
    try {
      sessionStorage.setItem(CLE_AGRANDIE, agrandie ? '0' : '1');
    } catch {
      // État non conservé.
    }
    setAgrandie(!agrandie);
  }
  return [agrandie, basculer];
}

/** Onglet actif mémorisé par type de fiche (`arpent.fiche.v1.<type>.entete`). */
export function useOngletEnteteMemorise(type: string, ids: string[]): [string, (id: string) => void] {
  const cle = `arpent.fiche.v1.${type}.entete`;
  const [actif, setActif] = useState(() => {
    try {
      const v = localStorage.getItem(cle);
      return v && ids.includes(v) ? v : ids[0];
    } catch {
      return ids[0];
    }
  });
  function choisir(id: string) {
    setActif(id);
    try {
      localStorage.setItem(cle, id);
    } catch {
      // Préférence non conservée.
    }
  }
  return [ids.includes(actif) ? actif : ids[0], choisir];
}
