import type { RestrictionsRoleDto, RoleDto, RoleEcritureDto } from '../types/roles';

export const NOUVEAU_ROLE = 'nouveau';

export type CleRestriction = keyof RestrictionsRoleDto;
export type Restrictions = Record<CleRestriction, boolean>;

/** Libellés d'OMRAN (`Role.cs:855-918`), fautes de l'original comprises, dans l'ordre de l'écran. */
export const RESTRICTIONS: ReadonlyArray<{ cle: CleRestriction; libelle: string }> = [
  { cle: 'ajoutPiecesJointes', libelle: "Avec restriction sur l'ajout des fichiers attachées" },
  { cle: 'modificationPiecesJointes', libelle: 'Avec restriction sur la modification des fichiers attachées' },
  { cle: 'suppressionPiecesJointes', libelle: 'Avec restriction sur la suppression des fichiers attachées' },
  { cle: 'ajoutActions', libelle: "Avec restriction sur l'ajout des actions" },
  { cle: 'modificationActions', libelle: 'Avec restriction sur la modification des actions' },
  { cle: 'suppressionActions', libelle: 'Avec restriction sur la suppression des actions' },
  { cle: 'rapports', libelle: 'Avec restriction sur les éditions des rapports' },
  { cle: 'audits', libelle: 'Avec restriction sur les audits' },
  { cle: 'champsSpecifiques', libelle: 'Avec restriction sur les champs spécifiques' },
  { cle: 'sequences', libelle: 'Avec restriction sur la modification des séquences' },
];

export interface SaisieRole {
  code: string;
  description: string;
  restrictions: Restrictions;
}

/** À la création, les 10 cases sont cochées (la valeur la plus prudente). */
export function saisieDepuisRole(r: RoleDto | null): SaisieRole {
  const restrictions = Object.fromEntries(RESTRICTIONS.map(({ cle }) => [cle, r ? r.restrictions[cle] : true])) as Restrictions;
  return { code: r?.code ?? '', description: r?.description ?? '', restrictions };
}

export function saisieModifiee(a: SaisieRole, b: SaisieRole): boolean {
  return a.code !== b.code || a.description !== b.description || RESTRICTIONS.some(({ cle }) => a.restrictions[cle] !== b.restrictions[cle]);
}

/** Création : le code est envoyé ; modification : jamais (immuable). */
export function corpsRole(s: SaisieRole, creation: boolean): RoleEcritureDto {
  const corps: RoleEcritureDto = { description: s.description, restrictions: s.restrictions };
  if (creation) corps.code = s.code.trim();
  return corps;
}
