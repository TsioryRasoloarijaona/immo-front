import { toApiDateTime } from './format';
import type { RendezVousDto, RendezVousEcritureDto } from '../types/rendezVous';

export const NOUVEAU_RENDEZ_VOUS = 'nouveau';
export const HEURE_PAR_DEFAUT = '09:00';

export type CleChamp = keyof RendezVousEcritureDto;
export type SaisieRendezVous = Record<CleChamp, string>;

const CLES: CleChamp[] = ['description', 'declencheurId', 'datePrevue', 'dureePrevue', 'dateFinPrevue', 'gestionnaireId', 'tierId', 'notes'];
const CLES_DATE = new Set<CleChamp>(['datePrevue', 'dateFinPrevue']);

export function saisieVide(datePrevue = ''): SaisieRendezVous {
  return { ...(Object.fromEntries(CLES.map((c) => [c, ''])) as SaisieRendezVous), datePrevue };
}

export function saisieDepuis(r: RendezVousDto): SaisieRendezVous {
  const source = r as unknown as Record<string, string | number | null>;
  return Object.fromEntries(
    CLES.map((cle) => {
      const v = source[cle];
      if (v === null) return [cle, ''];
      return [cle, CLES_DATE.has(cle) ? String(v).slice(0, 16) : String(v)];
    }),
  ) as SaisieRendezVous;
}

/** Vide = absent (le serveur lit `null` comme « inchangé ») ; la fin vide prend le début ; en modification, notes vides = `''` (efface). */
export function corpsDepuis(s: SaisieRendezVous, modification = false): RendezVousEcritureDto {
  const corps: Record<string, string | number> = {};
  for (const cle of CLES) {
    const v = (cle === 'dateFinPrevue' ? s.dateFinPrevue || s.datePrevue : s[cle]).trim();
    if (v === '') {
      if (modification && cle === 'notes') corps[cle] = '';
      continue;
    }
    if (cle === 'dureePrevue') corps[cle] = Number(v);
    else corps[cle] = CLES_DATE.has(cle) ? (toApiDateTime(v) ?? v) : v;
  }
  return corps;
}

/** « champ : message » (400) : le champ est repéré par son nom au début du message. */
export function erreurParChamp(message: string): { cle: CleChamp | null; texte: string } {
  const m = /^(\w+) : (.+)$/.exec(message);
  const cle = CLES.find((c) => c === m?.[1]) ?? null;
  return cle && m ? { cle, texte: m[2] } : { cle: null, texte: message };
}

/** Champs obligatoires de la fiche. */
export function erreursObligatoires(s: SaisieRendezVous): Partial<Record<CleChamp, string>> {
  const manque: Partial<Record<CleChamp, string>> = {};
  if (!s.description.trim()) manque.description = 'La description est obligatoire.';
  if (!s.datePrevue) manque.datePrevue = 'La date prévisionnelle est obligatoire.';
  if (!s.tierId) manque.tierId = 'Le tiers est obligatoire.';
  return manque;
}
