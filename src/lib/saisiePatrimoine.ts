import { useState } from 'react';
import { champEnErreur } from './api';
import { errorMessage } from './useApi';

/** Erreur 400/409 d'une écriture patrimoine : `champ` = nom du champ du corps quand le serveur le désigne. */
export interface ErreurSaisie {
  champ: string | null;
  message: string;
}

export type GenreChamp = 'texte' | 'texteLong' | 'montant' | 'nombre' | 'entier' | 'taux' | 'date' | 'case';

export interface DefChamp<T> {
  nom: keyof T & string;
  libelle: string;
  genre: GenreChamp;
  requis?: boolean;
  /** Occupe toute la largeur de la grille. */
  large?: boolean;
  desactive?: boolean;
}

// Arrondi d'affichage : 0,07 × 100 vaut 7,000000000000001 en flottant.
const arrondir = (n: number) => Math.round(n * 1e6) / 1e6;

function versNombre(texte: string): number | undefined {
  if (texte.trim() === '') return undefined;
  const n = Number(texte.replace(',', '.'));
  return Number.isNaN(n) ? undefined : n;
}

/** Valeur DTO → texte d'un `<input>` : taux en fraction affiché en %, date ISO réduite au jour. */
export function valeurAffichee(genre: GenreChamp, valeur: unknown): string {
  if (valeur === undefined || valeur === null) return '';
  if (genre === 'date') return typeof valeur === 'string' ? valeur.slice(0, 10) : '';
  if (genre === 'taux') return typeof valeur === 'number' ? String(arrondir(valeur * 100)) : '';
  return typeof valeur === 'number' || typeof valeur === 'string' ? String(valeur) : '';
}

/** Texte saisi → valeur DTO ; un champ numérique vidé redevient absent (inchangé en PATCH). */
export function valeurSaisie(genre: GenreChamp, texte: string): unknown {
  if (genre === 'date') return texte ? `${texte}T00:00:00` : undefined;
  if (genre === 'texte' || genre === 'texteLong') return texte;
  const n = versNombre(texte);
  if (n === undefined) return undefined;
  if (genre === 'taux') return arrondir(n / 100);
  return genre === 'entier' ? Math.trunc(n) : n;
}

/** Corps d'écriture tiré d'une fiche relue : mêmes noms de champ dans le DTO de lecture et d'écriture. */
export function extraireSaisie<T>(fiche: object, defs: readonly DefChamp<T>[], base: Partial<T>): T {
  const source = fiche as Record<string, unknown>;
  const ecriture: Record<string, unknown> = { ...base };
  for (const def of defs) ecriture[def.nom] = source[def.nom] ?? undefined;
  return ecriture as T;
}

export function messageDuChamp(erreur: ErreurSaisie | null, nom: string): string | null {
  return erreur?.champ === nom ? erreur.message : null;
}

/** Soumission d'un formulaire d'écriture : état « en cours » et erreur serveur rattachée à son champ. */
export function useSoumission() {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<ErreurSaisie | null>(null);

  async function soumettre<R>(action: () => Promise<R>, apres: (resultat: R) => void): Promise<void> {
    setEnCours(true);
    setErreur(null);
    try {
      apres(await action());
    } catch (err) {
      setErreur({ champ: champEnErreur(err), message: errorMessage(err) });
    } finally {
      setEnCours(false);
    }
  }

  return { enCours, erreur, soumettre };
}
