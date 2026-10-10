import type { Proprietaire, ProprietaireSaisi, TypeProprietaire } from './types';

export type Cle = Exclude<keyof ProprietaireSaisi, 'type'>;
/** Le formulaire d'un propriétaire, champs en texte. */
export type Valeurs = { type: TypeProprietaire } & Record<Cle, string>;

const CLES: Cle[] = ['civilite', 'nom', 'prenom', 'cin', 'nom_usage', 'societe_nom', 'societe_ice', 'societe_rc', 'representant', 'telephone'];

function remplir(type: TypeProprietaire, lire: (cle: Cle) => string): Valeurs {
  return { type, ...(Object.fromEntries(CLES.map((c) => [c, lire(c)])) as Record<Cle, string>) };
}

export const VIDE: Valeurs = remplir('PERSONNE', () => '');

export const valeursDe = (p: Proprietaire): Valeurs => remplir(p.type, (c) => p[c] ?? '');

/** Ce qu'on envoie : texte vide → null ; le service ne garde que les champs de la nature choisie. */
export function versSaisie(v: Valeurs): ProprietaireSaisi {
  return { type: v.type, ...(Object.fromEntries(CLES.map((c) => [c, v[c].trim() || null])) as Record<Cle, string | null>) };
}
