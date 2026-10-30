import type { NoeudDroitDto } from '../types/roles';

const TYPE_ACTION = 'Action';

/** Structure de l'arbre à plat (ordre `Sorting`) : les descendants de `i` sont les indices `i+1` à `fins[i]` exclu. */
export interface StructureArbre {
  noeuds: NoeudDroitDto[];
  parents: number[];
  enfants: number[][];
  fins: number[];
  recherche: string[];
}

function normaliser(texte: string): string {
  return texte.normalize('NFD').replaceAll(/[̀-ͯ]/g, '').toLowerCase();
}

export function structurerArbre(noeuds: NoeudDroitDto[]): StructureArbre {
  const n = noeuds.length;
  const profondeurs = noeuds.map((x) => x.profondeur ?? 0);
  const parents: number[] = [];
  const enfants: number[][] = noeuds.map(() => []);
  const fins: number[] = noeuds.map(() => n);
  const pile: number[] = [];
  for (let i = 0; i < n; i++) {
    while (pile.length > 0 && profondeurs[pile[pile.length - 1]] >= profondeurs[i]) fins[pile.pop() ?? 0] = i;
    const parent = pile.length > 0 ? pile[pile.length - 1] : -1;
    parents.push(parent);
    if (parent >= 0) enfants[parent].push(i);
    pile.push(i);
  }
  const recherche = noeuds.map((x) => normaliser(`${x.description ?? ''} ${x.code}`));
  return { noeuds, parents, enfants, fins, recherche };
}

function cocherAncetres(s: StructureArbre, i: number, coches: Set<string>) {
  for (let p = s.parents[i]; p >= 0; p = s.parents[p]) coches.add(s.noeuds[p].code);
}

function decocherAncetres(s: StructureArbre, i: number, coches: Set<string>) {
  for (let p = s.parents[i]; p >= 0; p = s.parents[p]) {
    if (s.enfants[p].some((c) => coches.has(s.noeuds[c].code))) return;
    coches.delete(s.noeuds[p].code);
  }
}

/** Cascade d'OMRAN (`Role.cs:180-235`) : un nœud Action ne cascade jamais. */
export function basculerNoeud(s: StructureArbre, coches: ReadonlySet<string>, i: number, valeur: boolean): Set<string> {
  const suivant = new Set(coches);
  const poser = (j: number) => (valeur ? suivant.add(s.noeuds[j].code) : suivant.delete(s.noeuds[j].code));
  poser(i);
  if (s.noeuds[i].type === TYPE_ACTION) return suivant;
  for (let j = i + 1; j < s.fins[i]; j++) poser(j);
  if (valeur) cocherAncetres(s, i, suivant);
  else decocherAncetres(s, i, suivant);
  return suivant;
}

export function toutCocher(s: StructureArbre): Set<string> {
  return new Set(s.noeuds.map((x) => x.code));
}

/** « En lecture seule » : décoche les seuls nœuds Action, sans toucher aux parents. */
export function lectureSeule(s: StructureArbre, coches: ReadonlySet<string>): Set<string> {
  const suivant = new Set(coches);
  for (const x of s.noeuds) if (x.type === TYPE_ACTION) suivant.delete(x.code);
  return suivant;
}

export function memesCodes(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  return a.size === b.size && [...a].every((c) => b.has(c));
}

function indicesFiltres(s: StructureArbre, requete: string): number[] {
  const marques = new Set<number>();
  s.recherche.forEach((texte, i) => {
    if (!texte.includes(requete)) return;
    marques.add(i);
    for (let p = s.parents[i]; p >= 0; p = s.parents[p]) marques.add(p);
  });
  return [...marques].sort((a, b) => a - b);
}

/** Indices affichés : seuls les enfants des nœuds ouverts, ou les résultats de la recherche avec leurs ancêtres. */
export function indicesVisibles(s: StructureArbre, ouverts: ReadonlySet<number>, requete: string): number[] {
  const q = normaliser(requete.trim());
  if (q) return indicesFiltres(s, q);
  const visibles: number[] = [];
  for (let i = 0; i < s.noeuds.length; ) {
    visibles.push(i);
    i = ouverts.has(i) ? i + 1 : s.fins[i];
  }
  return visibles;
}
