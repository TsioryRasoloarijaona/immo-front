import type { UUID } from '../types';
import type { BordereauSaisieDto, GroupeBordereauDto, GroupeSaisieDto, LigneBordereauDto, LigneSaisieDto, TotauxBordereauDto } from '../types/projet';
import { idsGroupeEtDescendants } from './sousFenetresLot';

/** Ligne en cours de saisie : `decomptee` (définitif) n'est jamais renvoyée au serveur. */
export type LigneEditee = LigneSaisieDto & { decomptee: boolean };

/** Lignes dans l'ordre de l'arbre : lignes racine, puis chaque groupe (dans l'ordre de l'arbre) avec ses lignes, récursivement. */
export function lignesEnOrdreArbre<L extends { groupeId: string | null }>(groupes: Pick<GroupeBordereauDto, 'id' | 'parentId'>[], lignes: L[]): L[] {
  const parGroupe = new Map<string | null, L[]>();
  for (const l of lignes) parGroupe.set(l.groupeId, [...(parGroupe.get(l.groupeId) ?? []), l]);
  const enfants = new Map<string | null, string[]>();
  for (const g of groupes) enfants.set(g.parentId, [...(enfants.get(g.parentId) ?? []), g.id]);
  const resultat: L[] = [...(parGroupe.get(null) ?? [])];
  const places = new Set<string>();
  const descendre = (id: string) => {
    places.add(id);
    resultat.push(...(parGroupe.get(id) ?? []));
    for (const fils of enfants.get(id) ?? []) descendre(fils);
  };
  for (const id of enfants.get(null) ?? []) descendre(id);
  for (const [groupeId, liste] of parGroupe) if (groupeId !== null && !places.has(groupeId)) resultat.push(...liste);
  return resultat;
}

export interface EtatBordereau {
  groupes: GroupeSaisieDto[];
  lignes: LigneEditee[];
}

export interface Defauts {
  tvaParDefaut: number | null;
  categorieParDefautId: UUID | null;
}

export interface Glisse {
  type: 'ligne' | 'groupe';
  id: string;
}

export type Depot = { type: 'racine' } | { type: 'groupe'; id: string; position: 'dans' | 'avant' } | { type: 'ligne'; id: string };

const rang = (n: number | null) => n ?? 0;

function trier(etat: EtatBordereau): EtatBordereau {
  return {
    groupes: [...etat.groupes].sort((a, b) => rang(a.ordre) - rang(b.ordre)),
    lignes: [...etat.lignes].sort((a, b) => rang(a.ordre) - rang(b.ordre)),
  };
}

export function etatDepuisDto(groupes: GroupeBordereauDto[], lignes: LigneBordereauDto[]): EtatBordereau {
  return trier({
    groupes: groupes.map((g) => ({ id: g.id, parentId: g.parentId, ordre: g.ordre, code: g.code, description: g.description, notes: g.notes })),
    lignes: lignes.map((l) => ({
      id: l.id,
      groupeId: l.groupeId,
      ordre: l.ordre,
      code: l.code,
      designation: l.designation,
      unite: l.unite,
      quantite: l.quantite,
      prixUnitaireHT: l.prixUnitaireHT,
      tauxTVA: l.tauxTVA,
      tauxFODEC: l.tauxFODEC,
      categorieId: l.categorieId,
      ponderation: l.ponderation,
      notes: l.notes,
      decomptee: l.decomptee,
    })),
  });
}

function composerCode(codeParent: string, n: number): string {
  return codeParent ? `${codeParent}.${n}` : `${n}`;
}

function codeDuParent(etat: EtatBordereau, parentId: string | null): string {
  return etat.groupes.find((g) => g.id === parentId)?.code ?? '';
}

function prochainRang(etat: EtatBordereau, parentId: string | null): number {
  return etat.groupes.filter((g) => g.parentId === parentId).length + etat.lignes.filter((l) => l.groupeId === parentId).length + 1;
}

export function ajouterLigne(etat: EtatBordereau, groupeId: string | null, defauts: Defauts): EtatBordereau {
  const n = prochainRang(etat, groupeId);
  const code = composerCode(codeDuParent(etat, groupeId), n);
  const ligne: LigneEditee = {
    id: crypto.randomUUID(),
    groupeId,
    ordre: etat.lignes.filter((l) => l.groupeId === groupeId).length + 1,
    code,
    designation: `ART ${code}`,
    unite: 'U',
    quantite: 0,
    prixUnitaireHT: 0,
    tauxTVA: defauts.tvaParDefaut,
    tauxFODEC: 0,
    categorieId: defauts.categorieParDefautId,
    ponderation: null,
    notes: null,
    decomptee: false,
  };
  return trier({ ...etat, lignes: [...etat.lignes, ligne] });
}

export function ajouterGroupe(etat: EtatBordereau, parentId: string | null): EtatBordereau {
  const n = prochainRang(etat, parentId);
  const code = composerCode(codeDuParent(etat, parentId), n);
  const groupe: GroupeSaisieDto = {
    id: crypto.randomUUID(),
    parentId,
    ordre: etat.groupes.filter((g) => g.parentId === parentId).length + 1,
    code,
    description: `GROUPE ${code}`,
    notes: null,
  };
  return trier({ ...etat, groupes: [...etat.groupes, groupe] });
}

/** Codes 1, 1.1, 1.1.1… et ordres 1..n dans l'ordre courant ; au sein d'un parent, les sous-groupes précèdent les lignes. */
export function regenererCodes(etat: EtatBordereau): EtatBordereau {
  const groupes = new Map(etat.groupes.map((g) => [g.id, { ...g }]));
  const lignes = new Map(etat.lignes.map((l) => [l.id, { ...l }]));
  const parcourir = (parentId: string | null, codeParent: string) => {
    let n = 0;
    let ordreGroupe = 0;
    for (const g of etat.groupes.filter((x) => x.parentId === parentId)) {
      const copie = groupes.get(g.id);
      if (!copie) continue;
      n += 1;
      ordreGroupe += 1;
      copie.code = composerCode(codeParent, n);
      copie.ordre = ordreGroupe;
      parcourir(g.id, copie.code);
    }
    let ordreLigne = 0;
    for (const l of etat.lignes.filter((x) => x.groupeId === parentId)) {
      const copie = lignes.get(l.id);
      if (!copie) continue;
      n += 1;
      ordreLigne += 1;
      copie.code = composerCode(codeParent, n);
      copie.ordre = ordreLigne;
    }
  };
  parcourir(null, '');
  return trier({ groupes: [...groupes.values()], lignes: [...lignes.values()] });
}

export function supprimerLigne(etat: EtatBordereau, id: string): EtatBordereau {
  return { ...etat, lignes: etat.lignes.filter((l) => l.id !== id) };
}

export function supprimerGroupe(etat: EtatBordereau, id: string): EtatBordereau {
  const ids = idsGroupeEtDescendants(etat.groupes, id);
  return { groupes: etat.groupes.filter((g) => !ids.has(g.id)), lignes: etat.lignes.filter((l) => l.groupeId === null || !ids.has(l.groupeId)) };
}

/** Le groupe ou un de ses descendants porte-t-il une ligne décomptée ? */
export function groupeContientDecomptee(etat: EtatBordereau, id: string): boolean {
  const ids = idsGroupeEtDescendants(etat.groupes, id);
  return etat.lignes.some((l) => l.decomptee && l.groupeId !== null && ids.has(l.groupeId));
}

export function appliquerCategorie(etat: EtatBordereau, groupeId: string, categorieId: UUID): EtatBordereau {
  const ids = idsGroupeEtDescendants(etat.groupes, groupeId);
  return { ...etat, lignes: etat.lignes.map((l) => (l.groupeId !== null && ids.has(l.groupeId) ? { ...l, categorieId } : l)) };
}

export function modifierLigne(etat: EtatBordereau, id: string, patch: Partial<LigneEditee>): EtatBordereau {
  return { ...etat, lignes: etat.lignes.map((l) => (l.id === id ? { ...l, ...patch } : l)) };
}

export function modifierGroupe(etat: EtatBordereau, id: string, patch: Partial<GroupeSaisieDto>): EtatBordereau {
  return { ...etat, groupes: etat.groupes.map((g) => (g.id === id ? { ...g, ...patch } : g)) };
}

/** Message de refus si un groupe n'a pas de description, sinon null. */
export function erreurGroupes(etat: EtatBordereau): string | null {
  const sans = etat.groupes.find((g) => !g.description?.trim());
  return sans ? `La description du groupe « ${sans.code ?? '—'} » est obligatoire.` : null;
}

/** Réinsère `deplace` parmi ses frères, avant `avantId` (ou en fin), et renumérote leurs ordres. */
function reinserer<T extends { id: string; ordre: number | null }>(freres: T[], deplace: T, avantId: string | null): T[] {
  const autres = freres.filter((f) => f.id !== deplace.id);
  const index = avantId === null ? -1 : autres.findIndex((f) => f.id === avantId);
  const place = index < 0 ? autres.length : index;
  return [...autres.slice(0, place), deplace, ...autres.slice(place)].map((f, i) => ({ ...f, ordre: i + 1 }));
}

function deplacerLigne(etat: EtatBordereau, id: string, groupeId: string | null, avantId: string | null): EtatBordereau {
  const ligne = etat.lignes.find((l) => l.id === id);
  if (!ligne) return etat;
  const deplacee = { ...ligne, groupeId };
  const freres = etat.lignes.filter((l) => l.groupeId === groupeId || l.id === id);
  const renumerotees = new Map(reinserer(freres, deplacee, avantId).map((l) => [l.id, l]));
  return trier({ ...etat, lignes: etat.lignes.map((l) => renumerotees.get(l.id) ?? l) });
}

function deplacerGroupe(etat: EtatBordereau, id: string, parentId: string | null, avantId: string | null): EtatBordereau {
  const groupe = etat.groupes.find((g) => g.id === id);
  if (!groupe || (parentId !== null && idsGroupeEtDescendants(etat.groupes, id).has(parentId))) return etat;
  const deplace = { ...groupe, parentId };
  const freres = etat.groupes.filter((g) => g.parentId === parentId || g.id === id);
  const renumerotes = new Map(reinserer(freres, deplace, avantId).map((g) => [g.id, g]));
  return trier({ ...etat, groupes: etat.groupes.map((g) => renumerotes.get(g.id) ?? g) });
}

export function deposer(etat: EtatBordereau, source: Glisse, depot: Depot): EtatBordereau {
  if (source.type === 'ligne') {
    if (depot.type === 'racine') return deplacerLigne(etat, source.id, null, null);
    if (depot.type === 'groupe') return deplacerLigne(etat, source.id, depot.id, null);
    const cible = etat.lignes.find((l) => l.id === depot.id);
    return cible ? deplacerLigne(etat, source.id, cible.groupeId, cible.id) : etat;
  }
  if (depot.type === 'racine') return deplacerGroupe(etat, source.id, null, null);
  if (depot.type !== 'groupe') return etat;
  if (depot.position === 'dans') return deplacerGroupe(etat, source.id, depot.id, null);
  const cible = etat.groupes.find((g) => g.id === depot.id);
  return cible ? deplacerGroupe(etat, source.id, cible.parentId, cible.id) : etat;
}

/** PU TTC = PU HT × (1 + FODEC) × (1 + TVA) ; taux en pourcentage. */
export function prixUnitaireTTC(l: Pick<LigneSaisieDto, 'prixUnitaireHT' | 'tauxFODEC' | 'tauxTVA'>): number {
  return (l.prixUnitaireHT ?? 0) * (1 + (l.tauxFODEC ?? 0) / 100) * (1 + (l.tauxTVA ?? 0) / 100);
}

export function totalHTLigne(l: Pick<LigneSaisieDto, 'quantite' | 'prixUnitaireHT'>): number {
  return (l.quantite ?? 0) * (l.prixUnitaireHT ?? 0);
}

export function totalTTCLigne(l: Pick<LigneSaisieDto, 'quantite' | 'prixUnitaireHT' | 'tauxFODEC' | 'tauxTVA'>): number {
  return (l.quantite ?? 0) * prixUnitaireTTC(l);
}

export function totauxEtat(lignes: LigneEditee[]): TotauxBordereauDto {
  const totalHT = lignes.reduce((s, l) => s + totalHTLigne(l), 0);
  const totalTTC = lignes.reduce((s, l) => s + totalTTCLigne(l), 0);
  return { totalHT, totalTVA: totalTTC - totalHT, totalTTC, nbLignes: lignes.length };
}

export function versSaisie(etat: EtatBordereau): BordereauSaisieDto {
  return { groupes: etat.groupes, lignes: etat.lignes.map((l) => ({ ...l, decomptee: undefined })) };
}
