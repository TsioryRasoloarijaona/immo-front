// « Mon équipe » : phrases de confirmation et listes de choix partagées par les dialogues.
import { formatNumber, jourISO, pluriel } from './format';
import type {
  ADistribuerDto,
  CommercialEquipeDto,
  RaisonNonAttribution,
  RepartitionCommercialDto,
  ResultatLotDto,
  ResultatRepartitionDto,
  UUID,
} from '../types';

const JOURS_PAR_DEFAUT = 30;

/**
 * Dates effectives (`YYYY-MM-DD`) d'une période de « Mon équipe », avec le défaut du serveur (`PeriodeEquipe` :
 * 30 jours jusqu'à aujourd'hui) : la carte « À distribuer » montre ces dates en clair, jamais un champ vide.
 */
export function periodeEffective(periode: { du: string; au: string }): { du: string; au: string } {
  const au = periode.au || jourISO(new Date());
  if (periode.du) return { du: periode.du, au };
  const [y, m, d] = au.split('-').map(Number);
  return { du: jourISO(new Date(y, m - 1, d - (JOURS_PAR_DEFAUT - 1))), au };
}

/** Compteur de la carte « À distribuer » ; `…` tant qu'il n'est pas chargé. */
export function resumeADistribuer(compte: ADistribuerDto | null | undefined, toutes: boolean): string {
  if (!compte) return '…';
  if (compte.nombre === 0) {
    return toutes ? 'Aucune en attente sur la période' : 'Aucune jamais traitée en attente sur la période';
  }
  return `${formatNumber(compte.nombre)} en attente · la plus ancienne depuis ${formatNumber(compte.agePlusAncienneJours)} j`;
}

export interface ChoixCommercial {
  label: string;
  value: string;
}

/** Seuls les commerciaux rattachés à un employé peuvent recevoir une ligne (`commercialId`). */
export function choixCommerciaux(commerciaux: readonly CommercialEquipeDto[], exclure?: UUID | null): ChoixCommercial[] {
  return commerciaux
    .filter((c) => !!c.commercialId && c.commercialId !== exclure)
    .map((c) => ({ label: c.nom ?? c.code ?? '—', value: c.commercialId as string }));
}

/** Copie de la sélection avec `id` ajouté ou retiré (pour un `setState` fonctionnel). */
export function basculer(prev: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(prev);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

export function phraseDistribution(r: ResultatLotDto): string {
  return `${pluriel(r.nombre, 'pré-prospection distribuée', 'pré-prospections distribuées')} à ${r.commercialNom ?? '—'}.`;
}

const RAISONS_NON_ATTRIBUEES: Record<RaisonNonAttribution, [string, string]> = {
  SANS_PROJET: ['sans projet', 'sans projet'],
  AUCUN_ELIGIBLE: ['sans commercial habilité', 'sans commercial habilité'],
  DEJA_ATTRIBUEE: ['déjà attribuée', 'déjà attribuées'],
};

/** « Faycal 4 · Khadija 3 · 2 sans projet » : aperçu et résultat de la répartition automatique. */
export function phraseRepartition(r: ResultatRepartitionDto): string {
  const parties = r.parCommercial.map((c) => `${c.commercialNom ?? '—'} ${c.nombre}`);
  const parRaison = new Map<RaisonNonAttribution, number>();
  for (const n of r.nonAttribuees) {
    if (n.raison) parRaison.set(n.raison, (parRaison.get(n.raison) ?? 0) + 1);
  }
  for (const [raison, nombre] of parRaison) {
    const [un, plusieurs] = RAISONS_NON_ATTRIBUEES[raison];
    parties.push(`${nombre} ${nombre > 1 ? plusieurs : un}`);
  }
  return parties.length > 0 ? parties.join(' · ') : 'Aucune ligne à répartir.';
}

/** « Répartis : Faycal 4, Khadija 3 · 2 à distribuer » (résultat d'import). */
export function phraseRepartitionImport(repartition: readonly RepartitionCommercialDto[], nonAttribuees: number): string {
  const parts: string[] = [];
  if (repartition.length > 0) {
    const noms = repartition.map((c) => `${c.commercialNom ?? '—'} ${c.nombre}`).join(', ');
    parts.push(`Répartis : ${noms}`);
  }
  if (nonAttribuees > 0) parts.push(`${nonAttribuees} à distribuer`);
  return parts.join(' · ');
}

/** Toast de création : à qui la répartition (ou la règle du créateur) a donné le lead. */
export function phraseAttributionCreation(commercialNom: string | null | undefined): string {
  return commercialNom
    ? `Pré-prospection créée et attribuée à ${commercialNom}.`
    : "Pré-prospection créée : aucun commercial habilité, elle reste à distribuer.";
}

/** « 12 prospections passées de A à B » ; plusieurs anciens commerciaux : « … passées à B ». */
export function phraseReaffectation(r: ResultatLotDto): string {
  if (r.nombre === 0) return `Rien à faire : ces prospections sont déjà à ${r.commercialNom ?? '—'}.`;
  const anciens = new Set(r.lignes.map((l) => l.ancienCommercialNom ?? 'aucun commercial'));
  const verbe = r.nombre > 1 ? 'passées' : 'passée';
  const de = anciens.size === 1 ? ` de ${[...anciens][0]}` : '';
  return `${pluriel(r.nombre, 'prospection')} ${verbe}${de} à ${r.commercialNom ?? '—'}.`;
}
