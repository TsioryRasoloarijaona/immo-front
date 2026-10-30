import { ApiError } from './api';
import { toApiDateTime } from './format';
import type { BadgeTone } from '../types';
import type { StatutTacheDto, TacheDto, TacheEcritureDto } from '../types/taches';

export type CleChamp = keyof TacheEcritureDto;
export type SaisieTache = Record<CleChamp, string>;
export type ListeChoix = 'types' | 'priorites' | 'personnes' | 'modules' | 'entites' | 'projets';

export interface ChampTache {
  cle: CleChamp;
  libelle: string;
  genre: 'texte' | 'nombre' | 'date' | 'liste' | 'long';
  liste?: ListeChoix;
}

export const CHAMPS_TACHE: ChampTache[] = [
  { cle: 'description', libelle: 'Description *', genre: 'texte' },
  { cle: 'typeId', libelle: 'Type', genre: 'liste', liste: 'types' },
  { cle: 'declencheurId', libelle: 'Déclencheur', genre: 'liste', liste: 'personnes' },
  { cle: 'prioriteId', libelle: 'Priorité', genre: 'liste', liste: 'priorites' },
  { cle: 'datePrevue', libelle: 'Date prévisionnelle', genre: 'date' },
  { cle: 'dureePrevue', libelle: 'Durée prévisionnelle', genre: 'nombre' },
  { cle: 'dateFinPrevue', libelle: 'Date fin prévisionnelle', genre: 'date' },
  { cle: 'dateDebut', libelle: 'Date début', genre: 'date' },
  { cle: 'duree', libelle: 'Durée', genre: 'nombre' },
  { cle: 'dateFin', libelle: 'Date fin', genre: 'date' },
  { cle: 'moduleId', libelle: 'Module', genre: 'liste', liste: 'modules' },
  { cle: 'gestionnaireId', libelle: 'Gestionnaire', genre: 'liste', liste: 'personnes' },
  { cle: 'assigneId', libelle: 'Assignement', genre: 'liste', liste: 'personnes' },
  { cle: 'entiteId', libelle: 'Entité', genre: 'liste', liste: 'entites' },
  { cle: 'projetId', libelle: 'Projet', genre: 'liste', liste: 'projets' },
  { cle: 'notes', libelle: 'Notes', genre: 'long' },
];

const CLES_NOMBRE = new Set<CleChamp>(['dureePrevue', 'duree']);
const CLES_DATE = new Set<CleChamp>(['datePrevue', 'dateFinPrevue', 'dateDebut', 'dateFin']);

export function saisieVide(): SaisieTache {
  return Object.fromEntries(CHAMPS_TACHE.map((c) => [c.cle, ''])) as SaisieTache;
}

export function saisieDepuis(t: TacheDto): SaisieTache {
  const source = t as unknown as Record<string, string | number | null>;
  return Object.fromEntries(
    CHAMPS_TACHE.map(({ cle }) => {
      const v = source[cle];
      if (v === null) return [cle, ''];
      return [cle, CLES_DATE.has(cle) ? String(v).slice(0, 16) : String(v)];
    }),
  ) as SaisieTache;
}

/** Vide = absent : le serveur lit `null` comme « inchangé » en PATCH. */
export function corpsDepuis(s: SaisieTache): TacheEcritureDto {
  const corps: Record<string, string | number> = {};
  for (const { cle } of CHAMPS_TACHE) {
    const v = s[cle].trim();
    if (v === '') continue;
    if (CLES_NOMBRE.has(cle)) corps[cle] = Number(v);
    else corps[cle] = CLES_DATE.has(cle) ? (toApiDateTime(v) ?? v) : v;
  }
  return corps;
}

/** « champ : référence inconnue. » (400) : le champ est repéré par son nom au début du message. */
export function erreurParChamp(message: string): { cle: CleChamp | null; texte: string } {
  const m = /^(\w+) : (.+)$/.exec(message);
  const cle = CHAMPS_TACHE.find((c) => c.cle === m?.[1])?.cle ?? null;
  return cle && m ? { cle, texte: m[2] } : { cle: null, texte: message };
}

/** Message d'un 409 : statuts permis (`transitionsAutorisees` = codes) ; les autres erreurs gardent leur texte. */
export function messageTransition(err: unknown): string {
  if (!(err instanceof ApiError) || err.status !== 409) return err instanceof Error ? err.message : 'Erreur inconnue.';
  const permis = err.problem?.transitionsAutorisees;
  const liste = Array.isArray(permis) ? permis.map(String) : [];
  const suite = liste.length > 0 ? `Statuts permis : ${liste.join(', ')}.` : 'Aucun statut permis depuis ce statut.';
  return `${err.message} ${suite}`;
}

export function statutDe(statuts: StatutTacheDto[], id: string): StatutTacheDto | undefined {
  return statuts.find((s) => s.id === id);
}

/** Premier statut neutre, dernier vert, entre les deux en cours ; la teinte suit l'ordre du serveur. */
export function toneStatut(statuts: StatutTacheDto[], id: string): BadgeTone {
  const ordre = statutDe(statuts, id)?.ordre;
  const ordres = statuts.flatMap((s) => (s.ordre === null ? [] : [s.ordre]));
  if (ordre === null || ordre === undefined) return 'neutral';
  if (ordre === Math.max(...ordres)) return 'success';
  return ordre === Math.min(...ordres) ? 'neutral' : 'progress';
}

export const NOUVELLE_TACHE = 'nouveau';
