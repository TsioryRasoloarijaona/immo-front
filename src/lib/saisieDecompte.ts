import type { DecompteDetailDto, EnregistrerDecompteRequest, LigneDecompteRechargee } from '../types/projet';
import { extrasDemande, retenuesDemande, type ExtraSaisie, type RetenueSaisie } from './saisieExtrasDecompte';

export const CLES_CASES = ['avanceSurMontant', 'retenueGarantieSurMontant', 'assuranceDECSurMontant', 'assuranceTRCSurMontant', 'compteProrataSurMontant'] as const;

export const CLES_NOMBRES = [
  'tauxAvance', 'tauxRetenueGarantie', 'tauxAssuranceDEC', 'tauxAssuranceTRC', 'tauxCompteProrata',
  'avanceAmortie', 'retenueGarantie', 'assuranceDEC', 'assuranceTRC', 'compteProrata',
  'avanceSurDecompte', 'remboursementCompteProrata', 'fluctuations', 'regularisation', 'tauxApprovisionnement',
] as const;

export type CleCase = (typeof CLES_CASES)[number];
export type CleNombre = (typeof CLES_NOMBRES)[number];

/** Champs en cours de saisie : les nombres restent du texte tant que l'utilisateur tape. */
export interface SaisieDecompte {
  dateDocument: string;
  referenceInterne: string;
  notes: string;
  cases: Record<CleCase, boolean>;
  nombres: Record<CleNombre, string>;
}

/** Ligne de l'onglet Lignes : `id` sert de clé à la grille, `idServeur` est nul pour une ligne de l'aperçu. */
export type LigneSaisie = Omit<LigneDecompteRechargee, 'id'> & { id: string; idServeur: string | null; avancementSaisi: number | null };

export function lignesSaisies(lignes: LigneDecompteRechargee[]): LigneSaisie[] {
  return lignes.map((l, i) => ({ ...l, id: l.id ?? `${l.ligneMarcheId ?? 'ligne'}-${i}`, idServeur: l.id, avancementSaisi: null }));
}

export function saisieDepuis(d: DecompteDetailDto): SaisieDecompte {
  const cases = Object.fromEntries(CLES_CASES.map((c) => [c, d[c]])) as Record<CleCase, boolean>;
  const nombres = Object.fromEntries(CLES_NOMBRES.map((n) => [n, d[n] === null ? '' : String(d[n])])) as Record<CleNombre, string>;
  return { dateDocument: d.dateDocument ?? '', referenceInterne: d.referenceInterne ?? '', notes: d.notes ?? '', cases, nombres };
}

function versNombre(texte: string): number | null {
  const n = Number(texte.replace(',', '.'));
  return texte.trim() === '' || Number.isNaN(n) ? null : n;
}

/** `extras` / `retenues` : null tant que l'utilisateur n'a pas touché à la liste (le serveur garde l'existant). */
export function demandeDepuis(s: SaisieDecompte, lignes: LigneSaisie[], extras: ExtraSaisie[] | null = null, retenues: RetenueSaisie[] | null = null): EnregistrerDecompteRequest {
  const nombres = Object.fromEntries(CLES_NOMBRES.map((n) => [n, versNombre(s.nombres[n])]));
  return {
    dateDocument: s.dateDocument || null,
    referenceInterne: s.referenceInterne,
    notes: s.notes,
    ...s.cases,
    ...nombres,
    extras: extras && extrasDemande(extras),
    retenues: retenues && retenuesDemande(retenues),
    lignes: lignes.length === 0 ? undefined : lignes.map((l) => ({ id: l.idServeur, ligneMarcheId: l.ligneMarcheId, quantiteSaisie: l.avancementSaisi === null ? l.quantiteSaisie : null, avancement: l.avancementSaisi, coefficient: l.coefficient })),
  };
}
