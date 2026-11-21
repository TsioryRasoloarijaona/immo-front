// Aides de la planification Gantt : arbre des tâches, dates en jours, libellés des énumérations du fil.
import type { ContrainteTache, PlanificationDetailDto, TachePlanificationDto, TypeDependance } from '../types/planification';

export const LIBELLES_DEPENDANCE: Record<TypeDependance, string> = {
  FIN_DEBUT: 'Fin → Début',
  DEBUT_DEBUT: 'Début → Début',
  FIN_FIN: 'Fin → Fin',
  DEBUT_FIN: 'Début → Fin',
};

export const LIBELLES_CONTRAINTE: Record<ContrainteTache, string> = {
  AU_PLUS_TOT: 'Au plus tôt',
  AU_PLUS_TARD: 'Au plus tard',
  FIN_PAS_AVANT: 'Fin pas avant',
  FIN_PAS_APRES: 'Fin pas après',
  DOIT_FINIR_LE: 'Doit finir le',
  DOIT_COMMENCER_LE: 'Doit commencer le',
  DEBUT_PAS_AVANT: 'Début pas avant',
  DEBUT_PAS_APRES: 'Début pas après',
};

export const MESSAGE_PLANIFICATION_ABSENTE = "Aucune planification n'est définie pour le projet en cours !";

const JOUR_MS = 86_400_000;

/** Numéro de jour (UTC) d'une date `YYYY-MM-DD…` ; null si absente. */
export function numeroJour(date: string | null | undefined): number | null {
  const m = date ? /^(\d{4})-(\d{2})-(\d{2})/.exec(date) : null;
  return m ? Math.round(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / JOUR_MS) : null;
}

export function dateDepuisJour(jour: number): Date {
  return new Date(jour * JOUR_MS);
}

/** Valeur d'un `<input type="date">` : les 10 premiers caractères d'une date ISO. */
export function valeurDate(date: string | null | undefined): string {
  return date ? date.slice(0, 10) : '';
}

export interface LigneTache {
  tache: TachePlanificationDto;
  profondeur: number;
}

/** Tâches en parcours profondeur, sœurs par rang ; une tâche dont le parent est absent devient racine. */
export function ordreArbre(taches: TachePlanificationDto[]): LigneTache[] {
  const ids = new Set(taches.map((t) => t.id));
  const enfants = new Map<string | null, TachePlanificationDto[]>();
  for (const t of taches) {
    const cle = t.parentId && ids.has(t.parentId) ? t.parentId : null;
    enfants.set(cle, [...(enfants.get(cle) ?? []), t]);
  }
  const parcourir = (parent: string | null, profondeur: number): LigneTache[] =>
    [...(enfants.get(parent) ?? [])]
      .sort((a, b) => (a.rang ?? 0) - (b.rang ?? 0))
      .flatMap((tache) => [{ tache, profondeur }, ...parcourir(tache.id, profondeur + 1)]);
  return parcourir(null, 0);
}

/** Sœurs d'une tâche (même parent), par rang, la tâche comprise. */
function soeurs(taches: TachePlanificationDto[], t: TachePlanificationDto): TachePlanificationDto[] {
  return taches.filter((x) => (x.parentId ?? null) === (t.parentId ?? null)).sort((a, b) => (a.rang ?? 0) - (b.rang ?? 0));
}

/** Identifiants des sœurs dans le nouvel ordre après avoir décalé `t` de `sens` (-1 haut, +1 bas) ; null si impossible. */
export function ordreApresDecalage(taches: TachePlanificationDto[], t: TachePlanificationDto, sens: -1 | 1): string[] | null {
  const ids = soeurs(taches, t).map((x) => x.id);
  const i = ids.indexOf(t.id);
  const j = i + sens;
  if (i < 0 || j < 0 || j >= ids.length) return null;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  return ids;
}

/** Corps d'écriture pour décaler `t` d'un niveau : `retrait` sous la sœur précédente, sinon vers le grand-parent ou la racine. */
export function nouveauParent(taches: TachePlanificationDto[], t: TachePlanificationDto, retrait: boolean): { parentId?: string; racine?: true } | null {
  if (retrait) {
    const freres = soeurs(taches, t);
    const i = freres.findIndex((x) => x.id === t.id);
    return i > 0 ? { parentId: freres[i - 1].id } : null;
  }
  const parent = taches.find((x) => x.id === t.parentId);
  if (!parent) return null;
  return parent.parentId ? { parentId: parent.parentId } : { racine: true };
}

/** `fin` est la borne exclusive : `dateFin` du serveur (début + durée), sinon début + durée. Durée 0 = jalon. */
export function plageTache(t: TachePlanificationDto): { debut: number; fin: number } | null {
  const debut = numeroJour(t.dateDebut);
  if (debut === null) return null;
  const fin = numeroJour(t.dateFin) ?? debut + (t.duree ?? 0);
  return { debut, fin: Math.max(fin, debut) };
}

export function libelleTache(t: Pick<TachePlanificationDto, 'code' | 'description'>): string {
  return `${t.code} ${t.description ?? ''}`.trim();
}

export function libelleIntervenants(d: PlanificationDetailDto, ids: string[]): string {
  return d.intervenants.filter((i) => i.id && ids.includes(i.id)).map((i) => i.code ?? i.description ?? '').join(', ');
}

export function libellePredecesseurs(taches: TachePlanificationDto[], t: TachePlanificationDto): string {
  return t.predecesseurs
    .map((p) => {
      const sigle = LIBELLES_DEPENDANCE[p.type ?? 'FIN_DEBUT'].split(' → ').map((m) => m[0]).join('');
      return `${taches.find((x) => x.id === p.tacheId)?.code ?? '?'} (${sigle})`;
    })
    .join(', ');
}
