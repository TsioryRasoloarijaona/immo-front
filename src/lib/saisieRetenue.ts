import type { LigneRetenueDto, SaisieDecaissementDto, TypeRetenueDto } from '../types/tresorerie';

const auCentime = (x: number) => Math.round(x * 100) / 100;

/** Montant RS d'une base au taux donné (fraction). */
export const montantRsDe = (base: number, taux: number) => auCentime(base * taux);

/** Taux (fraction) d'un montant RS sur sa base ; 0 si base 0. */
export const tauxDe = (base: number, montantRs: number) => (base ? montantRs / base : 0);

export const netDe = (base: number, montantRs: number) => auCentime(base - montantRs);

export const lignesRetenue = (b: SaisieDecaissementDto): LigneRetenueDto[] => b.retenues ?? [];

export function totauxRas(b: SaisieDecaissementDto) {
  const montantRas = auCentime(lignesRetenue(b).reduce((s, l) => s + (l.montantRs ?? 0), 0));
  return { montantRas, tauxRas: tauxDe(b.montant, montantRas), montantNet: netDe(b.montant, montantRas) };
}

/** Base proposée pour une nouvelle ligne : montant − Σ bases existantes. */
export function baseRestante(b: SaisieDecaissementDto): number {
  return Math.max(0, auCentime(b.montant - lignesRetenue(b).reduce((s, l) => s + l.base, 0)));
}

/** Types proposés : année RAS = année de la date pièce, null ou −1 (toutes). */
export function typesProposes(types: TypeRetenueDto[], dateDocument: string | null | undefined): TypeRetenueDto[] {
  const annee = Number((dateDocument ?? new Date().toISOString()).slice(0, 4));
  return types.filter((t) => t.anneeRas === null || t.anneeRas === -1 || t.anneeRas === annee);
}
