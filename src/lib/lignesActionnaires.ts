import type { UUID } from '../types';

/** Répartition d'une entité (parts) ou lignes d'un groupe (pourcentage, fraction sur le fil, saisi en %). */
export type ChampLigne = 'nombreParts' | 'pourcentage';

export interface RangeeActionnaire {
  cle: string;
  actionnaireId: UUID;
  libelle: string;
  /** Texte saisi, en % pour un pourcentage. */
  saisie: string;
}

export type LigneFil ={ actionnaireId: UUID; actionnaireCode?: string | null; actionnaireLibelle?: string | null }
  & Partial<Record<ChampLigne, number>>;

const facteur = (champ: ChampLigne) => (champ === 'pourcentage' ? 100 : 1);

export function rangeesDepuis(lignes: LigneFil[] | null | undefined, champ: ChampLigne): RangeeActionnaire[] {
  return (lignes ?? []).map((l, i) => ({
    cle: `l${i}`,
    actionnaireId: l.actionnaireId,
    libelle: l.actionnaireLibelle || l.actionnaireCode || '',
    saisie: String(Math.round((l[champ] ?? 0) * facteur(champ) * 1e4) / 1e4),
  }));
}

export function valeurFil(rangee: RangeeActionnaire, champ: ChampLigne): number {
  return champ === 'pourcentage' ? Number(rangee.saisie) / 100 : Math.trunc(Number(rangee.saisie));
}

export function lignesFil(rangees: RangeeActionnaire[], champ: ChampLigne): Record<string, unknown>[] {
  return rangees.map((r) => ({ actionnaireId: r.actionnaireId, [champ]: valeurFil(r, champ) }));
}
