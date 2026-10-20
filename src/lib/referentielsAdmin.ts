import { listChoixReferentiel } from './apiReferentielsAdmin';
import { brouillonDepuis, corpsDepuis, type Brouillon, type ChampDef, type Choix, type TypeChamp } from './saisiePatrimoine';
import { useApi } from './useApi';
import type {
  ChampReferentielDto, DescripteurReferentielDto, FamilleReferentiel, FiltresReferentiel, LigneReferentiel,
} from '../types/referentielsAdmin';

export const FAMILLES: { code: FamilleReferentiel; libelle: string }[] = [
  { code: 'ARTICLES', libelle: 'Articles' },
  { code: 'PROSPECTIONS_TERRAINS', libelle: 'Prospections de terrains' },
  { code: 'AUTRES', libelle: 'Autres' },
];

export const TOUTES = 'toutes';
export const GLOBAL = 'global';

/** Valeur du filtre tranche (toutes, global ou PKey de tranche) → paramètres de la liste. */
export function filtresTranche(valeur: string): FiltresReferentiel {
  if (valeur === TOUTES) return {};
  return valeur === GLOBAL ? { global: true } : { trancheId: valeur };
}

/** Ligne lue : `id` toujours présent côté serveur, requis par `DataGrid`. */
export type LigneAvecId = LigneReferentiel & { id: string };

const TYPES: Record<Exclude<ChampReferentielDto['type'], 'LIGNES'>, TypeChamp> = {
  TEXTE: 'texte',
  COULEUR: 'texte',
  ENTIER: 'entier',
  DECIMAL: 'montant',
  FRACTION: 'pourcent',
  BOOLEEN: 'booleen',
  REFERENCE: 'liste',
  OPERATEUR: 'liste',
};

export function defDe(champ: ChampReferentielDto): ChampDef {
  return {
    nom: champ.nom,
    libelle: champ.libelle,
    type: champ.type === 'LIGNES' ? 'texte' : TYPES[champ.type],
    obligatoire: champ.obligatoire,
  };
}

export const scalaires = (champs: ChampReferentielDto[]) => champs.filter((c) => c.type !== 'LIGNES');

/** Ligne enfant en cours de saisie ; `_cle` n'est qu'une clé React, jamais envoyée. */
export type LigneBrouillon = Brouillon & { _cle: string };

export function lignesDepuis(champ: ChampReferentielDto, source: LigneReferentiel[]): LigneBrouillon[] {
  const defs = (champ.champs ?? []).map(defDe);
  return source.map((l) => ({ ...brouillonDepuis(defs, l), _cle: crypto.randomUUID() }));
}

/** Une ligne par code protégé du descripteur : code et suppression verrouillés. */
export function estProtegee(d: DescripteurReferentielDto, ligne: LigneReferentiel): boolean {
  return typeof ligne.code === 'string' && d.codesProteges.includes(ligne.code);
}

/** Routes de choix distinctes des champs (lignes enfants comprises). */
function routesDe(champs: ChampReferentielDto[]): string[] {
  const routes = champs.flatMap((c) => [c.choix, ...routesDe(c.champs ?? [])]);
  return [...new Set(routes.filter((r): r is string => !!r))];
}

/** Valeurs permises d'un champ REFERENCE (liste de choix) ou OPERATEUR (options du descripteur). */
export function itemsDe(champ: ChampReferentielDto, choix: Record<string, Choix>): Choix {
  if (champ.options) return champ.options.map((o) => ({ label: o.libelle, value: String(o.valeur) }));
  return choix[champ.choix ?? ''] ?? [];
}

const AUCUN: Record<string, Choix> = {};

/** Listes de choix des champs, chargées ensemble ; vide tant qu'elles n'ont pas répondu. */
export function useChoixReferentiel(champs: ChampReferentielDto[]): Record<string, Choix> {
  const routes = routesDe(champs);
  const { data } = useApi(async () => {
    const listes = await Promise.all(routes.map(async (r) => {
      const items = await listChoixReferentiel(r);
      return [r, items.map((i) => ({ label: [i.code, i.description].filter(Boolean).join(' — '), value: i.id }))] as const;
    }));
    return Object.fromEntries(listes);
  }, [routes.join('|')]);
  return data ?? AUCUN;
}

/**
 * Corps d'écriture. PATCH (`initial`) : champs changés seulement, un facultatif vidé part en `null` ;
 * les lignes enfants partent en entier (le serveur les remplace).
 */
export function corpsReferentiel(
  champs: ChampReferentielDto[],
  brouillon: Brouillon,
  initial: Brouillon | undefined,
  lignes: Record<string, Brouillon[]>,
): LigneReferentiel {
  const { champsAVider = [], ...corps } = corpsDepuis(scalaires(champs).map(defDe), brouillon, initial) as
    Record<string, unknown> & { champsAVider?: string[] };
  for (const c of champs) {
    if (c.type === 'LIGNES') {
      const defs = (c.champs ?? []).map(defDe);
      corps[c.nom] = (lignes[c.nom] ?? []).map((l) => corpsDepuis(defs, l));
    } else if (champsAVider.includes(c.nom) || (!c.obligatoire && corps[c.nom] === '')) {
      corps[c.nom] = null;
    } else if (c.type === 'OPERATEUR' && typeof corps[c.nom] === 'string') {
      corps[c.nom] = Number(corps[c.nom]);
    }
  }
  return corps as LigneReferentiel;
}
