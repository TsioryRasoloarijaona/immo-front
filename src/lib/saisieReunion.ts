import { ApiError, triggerBlobDownload } from './api';
import { formatDate, todayISO } from './format';
import type { ReunionFicheDto, ReunionLigneDto, ReunionModificationDto } from '../types/reunions';

export const NOUVELLE_REUNION = 'nouveau';
export const MESSAGE_ENREGISTRER_AVANT = 'Vous devez enregistrer vos modifications avant cette opération. Voulez vous continuer ?';
export const MESSAGE_SUPPRESSION = 'Voulez-vous vraiment supprimer cet enregistrement ?';
export const ACCES_REFUSE_REUNIONS = "Vous n'avez pas accès aux réunions de chantier.";

/** Écriture d'onglet : le serveur renvoie la fiche entière, remise en état local ; `false` = échec déjà affiché. */
export type EcrireFiche = (action: () => Promise<ReunionFicheDto>, succes?: string) => Promise<boolean>;

/** `useApi` ne garde que le message : le 403 reçoit un texte fixe pour que la liste le reconnaisse. */
export async function lireReunions<T>(appel: () => Promise<T>): Promise<T> {
  try {
    return await appel();
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) throw new Error(ACCES_REFUSE_REUNIONS, { cause: err });
    throw err;
  }
}

function cellule(v: string | null): string {
  return `"${(v ?? '').replaceAll('"', '""')}"`;
}

/** Pas de route d'export côté serveur : CSV à points-virgules des lignes chargées, ouvert par Excel. */
export function exporterReunionsCsv(lignes: ReunionLigneDto[]): void {
  const entetes = ['Projet', 'Type', 'Référence P.V.', 'Date', 'Prochaine réunion', 'Surveillant', 'Note'];
  const corps = lignes.map((r) => [r.projet, r.type, r.reference, formatDate(r.date), formatDate(r.prochaineDate), r.surveillant, r.note]);
  const csv = [entetes, ...corps].map((l) => l.map(cellule).join(';')).join('\r\n');
  triggerBlobDownload(new Blob([String.fromCodePoint(0xfeff), csv], { type: 'text/csv;charset=utf-8' }), `reunions-chantier_${todayISO()}.csv`);
}

export type CleChamp = keyof ReunionModificationDto;
export type SaisieReunion = Record<CleChamp, string> & { avecProchaine: boolean };

const CLES: CleChamp[] = ['reference', 'date', 'prochaineDate', 'surveillantId', 'note'];

export function saisieVide(): SaisieReunion {
  return { reference: '', date: todayISO(), prochaineDate: '', surveillantId: '', note: '', avecProchaine: false };
}

export function saisieDepuis(r: ReunionFicheDto): SaisieReunion {
  return {
    reference: r.reference ?? '',
    date: (r.date ?? '').slice(0, 10),
    prochaineDate: (r.prochaineDate ?? '').slice(0, 10),
    surveillantId: r.surveillantId ?? '',
    note: r.note ?? '',
    avecProchaine: !!r.prochaineDate,
  };
}

/** Référence vide = générée par le serveur ; prochaine réunion décochée ou vide = absente ; note vide = `''` (efface). */
export function corpsDepuis(s: SaisieReunion): ReunionModificationDto {
  const prochaine = s.avecProchaine ? s.prochaineDate : '';
  return {
    reference: s.reference.trim(),
    date: s.date,
    prochaineDate: prochaine || null,
    surveillantId: s.surveillantId || null,
    note: s.note,
  };
}

/** « champ : message » (400) : le champ est repéré par son nom au début du message. */
export function erreurParChamp(message: string): { cle: CleChamp | null; texte: string } {
  const m = /^(\w+) : (.+)$/.exec(message);
  const cle = CLES.find((c) => c === m?.[1]) ?? null;
  return cle && m ? { cle, texte: m[2] } : { cle: null, texte: message };
}

export function erreursObligatoires(s: SaisieReunion): Partial<Record<CleChamp, string>> {
  const manque: Partial<Record<CleChamp, string>> = {};
  if (!s.date) manque.date = 'La date est obligatoire.';
  if (s.avecProchaine && !s.prochaineDate) manque.prochaineDate = 'La date de la prochaine réunion est obligatoire.';
  return manque;
}

export function modifiee(a: SaisieReunion, b: SaisieReunion): boolean {
  return [...CLES, 'avecProchaine' as const].some((c) => a[c] !== b[c]);
}
