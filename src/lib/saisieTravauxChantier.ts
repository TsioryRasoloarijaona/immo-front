import { ApiError, triggerBlobDownload } from './api';
import { formatDate, formatNumber, todayISO } from './format';
import type {
  JourTravailleEcritureDto, JourTravailleFicheDto, JourTravailleLigneDto, TypeTravauxDto,
} from '../types/travauxChantier';

export const NOUVEAU_JOUR = 'nouveau';
export const ACCES_REFUSE_TRAVAUX = "Vous n'avez pas accès aux travaux de chantier.";

/** `useApi` ne garde que le message : le 403 reçoit un texte fixe pour que la liste le reconnaisse. */
export async function lireTravaux<T>(appel: () => Promise<T>): Promise<T> {
  try {
    return await appel();
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) throw new Error(ACCES_REFUSE_TRAVAUX, { cause: err });
    throw err;
  }
}

function cellule(v: string | null): string {
  return `"${(v ?? '').replaceAll('"', '""')}"`;
}

/** Pas de route d'export côté serveur : CSV à points-virgules des lignes chargées, ouvert par Excel. */
export function exporterTravauxCsv(lignes: JourTravailleLigneDto[]): void {
  const entetes = [
    'Statut', 'Date', 'Heure début', 'Heure fin', 'Personnel', 'Nivellement', 'Type', 'Article', 'Groupe', 'Projet',
    'Nivellement code', 'Client', 'Quantité', 'Total HT',
  ];
  const corps = lignes.map((l) => [
    l.statut?.libelle ?? null, formatDate(l.date), l.heureDebut, l.heureFin, l.personnel, l.niveau, l.type, l.article, l.groupe,
    l.projet, l.niveauCode, l.client, formatNumber(l.quantite, 2), formatNumber(l.totalHT, 2),
  ]);
  const csv = [entetes, ...corps].map((l) => l.map(cellule).join(';')).join('\r\n');
  triggerBlobDownload(new Blob([String.fromCodePoint(0xfeff), csv], { type: 'text/csv;charset=utf-8' }), `travaux-chantier_${todayISO()}.csv`);
}

export type CleChamp = keyof JourTravailleEcritureDto;
export type SaisieJour = Record<CleChamp, string>;

const CLES: CleChamp[] = [
  'societeId', 'projetId', 'typeId', 'date', 'heureDebut', 'heureFin', 'employeId', 'clientId', 'niveauId', 'zoneId', 'articleId',
  'quantite', 'quantite1', 'unite', 'prixUnitaireHT', 'tva', 'unite1', 'prixUnitaireHT1', 'tva1', 'code', 'description', 'notes',
];
const NOMBRES: CleChamp[] = ['quantite', 'quantite1', 'prixUnitaireHT', 'tva', 'prixUnitaireHT1', 'tva1'];

export function saisieVide(): SaisieJour {
  return { ...(Object.fromEntries(CLES.map((c) => [c, ''])) as SaisieJour), date: todayISO(), quantite: '1', quantite1: '1' };
}

export function saisieDepuis(f: JourTravailleFicheDto): SaisieJour {
  const saisie = Object.fromEntries(CLES.map((c) => [c, String(f.valeurs[c] ?? '')])) as SaisieJour;
  return { ...saisie, date: saisie.date.slice(0, 10) };
}

/** Choisir un type recopie unités, prix et TVA dans les deux blocs (modifiables ensuite). */
export function appliquerType(s: SaisieJour, t: TypeTravauxDto | undefined): SaisieJour {
  if (!t) return s;
  const texte = (v: number | string | null) => String(v ?? '');
  return {
    ...s, typeId: t.id, unite: texte(t.unite), prixUnitaireHT: texte(t.prixUnitaireHT), tva: texte(t.tva),
    unite1: texte(t.unite1), prixUnitaireHT1: texte(t.prixUnitaireHT1), tva1: texte(t.tva1),
  };
}

function nombre(v: string): number | null {
  const n = Number(v.replace(',', '.'));
  return v.trim() === '' || Number.isNaN(n) ? null : n;
}

/** Texte vide = `null` ; les nombres sont convertis. */
export function corpsDepuis(s: SaisieJour): JourTravailleEcritureDto {
  const corps = Object.fromEntries(CLES.map((c) => [c, NOMBRES.includes(c) ? nombre(s[c]) : s[c].trim() || null]));
  return corps as unknown as JourTravailleEcritureDto;
}

/** « champ : message » (400) : le champ est repéré par son nom au début du message. */
export function erreurParChamp(message: string): { cle: CleChamp | null; texte: string } {
  const m = /^(\w+) : (.+)$/.exec(message);
  const cle = CLES.find((c) => c === m?.[1]) ?? null;
  return cle && m ? { cle, texte: m[2] } : { cle: null, texte: message };
}

const OBLIGATOIRES: [CleChamp, string][] = [
  ['societeId', "L'entité est obligatoire."], ['typeId', 'Le type est obligatoire.'], ['zoneId', 'La zone est obligatoire.'],
  ['date', 'La date est obligatoire.'], ['quantite', 'La quantité est obligatoire.'], ['quantite1', 'La quantité 1 est obligatoire.'],
];

export function erreursObligatoires(s: SaisieJour): Partial<Record<CleChamp, string>> {
  return Object.fromEntries(OBLIGATOIRES.filter(([c]) => !s[c].trim()));
}

export function modifiee(a: SaisieJour, b: SaisieJour): boolean {
  return CLES.some((c) => a[c] !== b[c]);
}
