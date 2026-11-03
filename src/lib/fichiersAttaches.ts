import type { FiltresFichiersAttaches, LigneFichierAttacheDto, ObjetCleFichier } from '../types/administration';

export const TAILLE_PAGE_FICHIERS = 50;

export type EtatFichierAssocie = 'tous' | 'avec' | 'sans';

export interface EtatFiltresFichiers {
  debut: string;
  fin: string;
  modifieDebut: string;
  modifieFin: string;
  typeIds: string[];
  categories: string[];
  groupes: string[];
  fichier: EtatFichierAssocie;
  recherche: string;
}

export const FILTRES_FICHIERS_VIDES: EtatFiltresFichiers = {
  debut: '',
  fin: '',
  modifieDebut: '',
  modifieFin: '',
  typeIds: [],
  categories: [],
  groupes: [],
  fichier: 'tous',
  recherche: '',
};

/** Rien de choisi = tout : un filtre au repos n'est pas envoyé (pagination exclue, pour l'export). */
export function versFiltresFichiers(f: EtatFiltresFichiers): FiltresFichiersAttaches {
  return {
    recherche: f.recherche.trim() || undefined,
    typeIds: f.typeIds,
    categories: f.categories,
    groupes: f.groupes,
    avecFichier: f.fichier === 'tous' ? undefined : f.fichier === 'avec',
    du: f.debut || undefined,
    au: f.fin || undefined,
    modifieDu: f.modifieDebut || undefined,
    modifieAu: f.modifieFin || undefined,
  };
}

const ROUTES_OBJET: Record<ObjetCleFichier, string> = {
  dossier: '/dossiers',
  article: '/articles',
  reglement: '/encaissements',
};

/** Écran Arpent de l'objet rattaché, ou undefined (pas de lien). */
export function lienObjet(l: LigneFichierAttacheDto): string | undefined {
  return l.objetCle && l.objetId ? `${ROUTES_OBJET[l.objetCle]}/${l.objetId}` : undefined;
}
