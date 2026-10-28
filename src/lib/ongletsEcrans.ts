import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export interface OngletEcran {
  chemin: string;
  recherche: string;
}

const CLE = 'arpent.onglets.v1';
const MAX = 12;
export const ACCUEIL = '/';

function lire(): OngletEcran[] {
  try {
    const v: unknown = JSON.parse(sessionStorage.getItem(CLE) ?? '[]');
    if (!Array.isArray(v)) return [];
    return v.filter(
      (o): o is OngletEcran => typeof o === 'object' && o !== null && typeof (o as OngletEcran).chemin === 'string' && typeof (o as OngletEcran).recherche === 'string',
    );
  } catch {
    return [];
  }
}

function ecrire(onglets: readonly OngletEcran[]) {
  try {
    sessionStorage.setItem(CLE, JSON.stringify(onglets));
  } catch {
    // Stockage indisponible : la liste reste en mémoire.
  }
}

/** Onglet d'un chemin : l'entrée d'arbre au plus long préfixe (`/dossiers/12` → `/dossiers`), sinon le chemin lui-même. */
export function cheminOnglet(pathname: string, titres: ReadonlyMap<string, string>): string {
  if (pathname === ACCUEIL) return ACCUEIL;
  let meilleur = pathname;
  let longueur = 0;
  for (const to of titres.keys()) {
    if (to !== ACCUEIL && to.length > longueur && (pathname === to || pathname.startsWith(`${to}/`))) {
      meilleur = to;
      longueur = to.length;
    }
  }
  return meilleur;
}

export function titreOnglet(chemin: string, titres: ReadonlyMap<string, string>): string {
  const connu = titres.get(chemin);
  if (connu) return connu;
  const segment = (chemin.split('/').filter(Boolean).pop() ?? '').replaceAll('-', ' ');
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

function avecOnglet(onglets: readonly OngletEcran[], actif: OngletEcran): OngletEcran[] {
  const idx = onglets.findIndex((o) => o.chemin === actif.chemin);
  if (idx >= 0) return onglets.map((o, i) => (i === idx ? actif : o));
  const suivant = [...onglets, actif];
  if (suivant.length > MAX) suivant.splice(suivant.findIndex((o) => o.chemin !== actif.chemin), 1);
  return suivant;
}

/** Écrans ouverts de la session : naviguer vers une route l'ajoute, la fermer active le voisin (ou l'accueil). */
export function useOngletsEcrans(titres: ReadonlyMap<string, string>) {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const [onglets, setOnglets] = useState(lire);
  const [vu, setVu] = useState<string | null>(null);
  const actif = cheminOnglet(pathname, titres);

  // Ajustement pendant le rendu (pas d'effet) : chaque navigation inscrit l'écran courant.
  if (vu !== pathname + search) {
    setVu(pathname + search);
    if (actif !== ACCUEIL) {
      const suivant = avecOnglet(onglets, { chemin: actif, recherche: search });
      setOnglets(suivant);
      ecrire(suivant);
    }
  }

  function fermer(chemin: string) {
    const idx = onglets.findIndex((o) => o.chemin === chemin);
    if (idx < 0) return;
    const suivant = onglets.filter((o) => o.chemin !== chemin);
    setOnglets(suivant);
    ecrire(suivant);
    if (chemin !== actif) return;
    const voisin = suivant.at(idx) ?? suivant.at(idx - 1);
    void navigate(voisin ? voisin.chemin + voisin.recherche : ACCUEIL);
  }

  return { onglets, actif, fermer };
}
