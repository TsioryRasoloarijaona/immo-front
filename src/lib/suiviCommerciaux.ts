import { useState } from 'react';
import type { FiltresSuiviCommerciaux } from './api';
import { jourISO } from './format';
import type { ColonneDto, CommercialEquipeDto, GroupeDto, LigneSyntheseSuiviDto, SyntheseSuiviCommerciauxDto } from '../types';

type Item = { label: string; value: string };

export const TYPE_APPEL_SORTANT = 'Téléphone Sortant';
export const TYPE_APPEL_ENTRANT = 'Téléphone entrant';

export const TYPE_ITEMS: Item[] = [
  { label: 'Appels passés', value: TYPE_APPEL_SORTANT },
  { label: 'Appels reçus', value: TYPE_APPEL_ENTRANT },
  { label: 'Visites', value: 'Visite' },
];

/** `joint` ne vise que les appels : les visites sortent des deux choix. */
export const JOINT_ITEMS: Item[] = [
  { label: 'Appels joints', value: 'true' },
  { label: 'Appels non joints', value: 'false' },
];

export type Periode = { du: string; au: string };

export function periodeDuJour(): Periode {
  const jour = jourISO(new Date());
  return { du: jour, au: jour };
}

/** État des filtres de la liste ; `search` est débouncé par la page avant l'appel. */
export type FiltresListeSuivi = Periode & {
  commercialCle: string | null;
  type: string | null;
  joint: string | null;
  search: string;
};

export function filtresListeDefaut(periode: Periode): FiltresListeSuivi {
  return { ...periode, commercialCle: null, type: null, joint: null, search: '' };
}

/** Mêmes paramètres pour la liste, les groupes, les totaux et l'export. */
export function paramsSuivi(f: FiltresListeSuivi): FiltresSuiviCommerciaux {
  return {
    du: f.du || undefined,
    au: f.au || undefined,
    commercialCle: f.commercialCle ?? undefined,
    type: f.type ?? undefined,
    joint: f.joint === null ? undefined : f.joint === 'true',
    search: f.search.trim() || undefined,
  };
}

/** Ce qu'un clic sur une cellule de la synthèse applique à la liste ; un champ absent = pas de restriction. */
export type ChoixSyntheseSuivi = { commercialCle?: string; jour?: string; joint?: boolean; type?: string };

/** Les autres filtres de la liste sont remis à zéro : la liste compte alors exactement la cellule cliquée (R9). */
export function filtresDepuisChoix(choix: ChoixSyntheseSuivi, periode: Periode): FiltresListeSuivi {
  return {
    ...filtresListeDefaut(choix.jour ? { du: choix.jour, au: choix.jour } : periode),
    commercialCle: choix.commercialCle ?? null,
    type: choix.type ?? null,
    joint: choix.joint === undefined ? null : String(choix.joint),
  };
}

/** Période que le serveur applique à la synthèse : `au` vide = aujourd'hui, `du` vide = `au`. */
export function periodeAppliquee(p: Periode): Periode {
  const au = p.au || jourISO(new Date());
  return { du: p.du || au, au };
}

export type LigneSyntheseSuiviAffichee = {
  cle: string;
  commercial: string;
  /** `null` = ligne de total d'un commercial. */
  jour: string | null;
  niveau: 'ligne' | 'total';
  ligne: LigneSyntheseSuiviDto;
  /** `null` : la liste ne sait pas rejouer ce total (plusieurs commerciaux cochés, elle n'en filtre qu'un). */
  choix: ChoixSyntheseSuivi | null;
};

function choixDe(l: LigneSyntheseSuiviDto): ChoixSyntheseSuivi {
  return { commercialCle: l.commercialCle ?? undefined, jour: l.jour ?? undefined };
}

/** Totaux tous commerciaux : calculés sur les commerciaux cochés, que la liste doit reprendre. */
function choixTousCommerciaux(jour: string | null, commercialIds: readonly string[]): ChoixSyntheseSuivi | null {
  if (commercialIds.length > 1) return null;
  return { commercialCle: commercialIds[0], jour: jour ?? undefined };
}

/** Jours de chaque commercial suivis de son total, puis les totaux par jour et le général ; sur un seul jour,
 * les totaux par commercial et par jour répéteraient les lignes et sont omis. */
export function lignesSyntheseSuivi(
  s: SyntheseSuiviCommerciauxDto,
  plusieursJours: boolean,
  commercialIds: readonly string[],
): LigneSyntheseSuiviAffichee[] {
  const sortie: LigneSyntheseSuiviAffichee[] = [];
  for (const c of s.totaux.parCommercial) {
    const commercial = c.commercialNom ?? '—';
    for (const l of s.lignes.filter((x) => x.commercialCle === c.commercialCle)) {
      sortie.push({ cle: `${c.commercialCle}|${l.jour}`, commercial, jour: l.jour, niveau: 'ligne', ligne: l, choix: choixDe(l) });
    }
    if (plusieursJours) {
      sortie.push({ cle: `${c.commercialCle}|total`, commercial, jour: null, niveau: 'total', ligne: c, choix: choixDe(c) });
    }
  }
  if (plusieursJours) {
    for (const j of s.totaux.parJour) {
      const choix = choixTousCommerciaux(j.jour, commercialIds);
      sortie.push({ cle: `jour|${j.jour}`, commercial: 'Tous les commerciaux', jour: j.jour, niveau: 'total', ligne: j, choix });
    }
  }
  const choix = choixTousCommerciaux(null, commercialIds);
  sortie.push({ cle: 'general', commercial: 'Total général', jour: null, niveau: 'total', ligne: s.totaux.general, choix });
  return sortie;
}

/** Choix du filtre de commerciaux : l'équipe (sans les chefs, que le serveur n'y met pas), plus ceux que la
 * synthèse a montrés. Clé = employé, sinon compte, comme `commercialCle`. */
export function choixCommerciauxSuivi(
  equipe: readonly CommercialEquipeDto[] | null,
  parCommercial: readonly LigneSyntheseSuiviDto[] | undefined,
): Item[] {
  const parCle = new Map<string, string>();
  for (const c of equipe ?? []) parCle.set(c.commercialId ?? c.admUserId, c.nom ?? c.code ?? '—');
  for (const c of parCommercial ?? []) if (c.commercialCle) parCle.set(c.commercialCle, c.commercialNom ?? '—');
  return [...parCle].map(([value, label]) => ({ label, value }));
}

/** Choix cumulés au fil des réponses : filtrer la synthèse sur un commercial ne doit pas retirer les autres du menu. */
export function useChoixCumules(items: readonly Item[]): Item[] {
  const [vus, setVus] = useState<Item[]>([]);
  const nouveaux = items.filter((i) => !vus.some((v) => v.value === i.value));
  if (nouveaux.length === 0) return vus;
  const cumules = [...vus, ...nouveaux].sort((a, b) => a.label.localeCompare(b.label, 'fr'));
  setVus(cumules);
  return cumules;
}

/** La liste n'a pas de dépliage serveur : seuls se groupent les axes que ses filtres savent rejouer. */
const GROUPABLES = new Set(['jour', 'type']);

export function catalogueGroupement(catalogue: ColonneDto[]): ColonneDto[] {
  return catalogue.map((c) => (GROUPABLES.has(c.nom) ? c : { ...c, groupable: false }));
}

const deux = (n: number) => String(n).padStart(2, '0');

/** Clé serveur d'un groupe de dates : `aaaammjj`, `aaaamm` ou `aaaa` selon la granularité. */
function bornesGroupeDate(cle: number): Periode {
  if (cle >= 10_000_000) {
    const jour = `${Math.floor(cle / 10_000)}-${deux(Math.floor(cle / 100) % 100)}-${deux(cle % 100)}`;
    return { du: jour, au: jour };
  }
  if (cle >= 100_000) {
    const annee = Math.floor(cle / 100);
    const mois = cle % 100;
    return { du: `${annee}-${deux(mois)}-01`, au: jourISO(new Date(annee, mois, 0)) };
  }
  return { du: `${cle}-01-01`, au: `${cle}-12-31` };
}

const plusTard = (a: string | undefined, b: string) => (a && a > b ? a : b);
const plusTot = (a: string | undefined, b: string) => (a && a < b ? a : b);

/** Filtres de la liste restreints à un groupe, en intersection avec la période déjà filtrée. */
export function filtresDuGroupe(p: FiltresSuiviCommerciaux, colonne: string, cle: GroupeDto['cle']): FiltresSuiviCommerciaux {
  if (colonne === 'type') return { ...p, type: cle == null ? p.type : String(cle) };
  const bornes = bornesGroupeDate(Number(cle));
  return { ...p, du: plusTard(p.du, bornes.du), au: plusTot(p.au, bornes.au) };
}

export const MOIS: Item[] = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
].map((label, i) => ({ label, value: String(i + 1) }));
