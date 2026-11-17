import type { UUID } from '../types';
import type { AvenantDetailDto, AvenantSaisieDto, LigneAvenantSaisieDto, LigneBordereauDto, RetenueAvenantDto } from '../types/projet';
import { totalTTCLigne } from './saisieBordereau';

export type CleRetenue = 'garantie' | 'prorata' | 'assuranceDEC' | 'assuranceTRC';

export const RETENUES: { cle: CleRetenue; libelle: string }[] = [
  { cle: 'garantie', libelle: 'Retenue de garantie' },
  { cle: 'prorata', libelle: 'Compte prorata' },
  { cle: 'assuranceDEC', libelle: 'Assurance DEC' },
  { cle: 'assuranceTRC', libelle: 'Assurance TRC' },
];

export interface EtatAvenant {
  date: string;
  referenceInterne: string;
  notes: string;
  retenues: Record<CleRetenue, RetenueAvenantDto>;
  lignes: LigneAvenantSaisieDto[];
}

/** Valeurs par défaut du lot : TVA, catégorie et les 4 taux de retenue (pourcentages). */
export interface DefautsAvenant {
  tauxTVA: number | null;
  categorieId: UUID | null;
  taux: Record<CleRetenue, number | null>;
}

export function etatDepuisDetail(d: AvenantDetailDto): EtatAvenant {
  return {
    date: d.date ?? '',
    referenceInterne: d.referenceInterne ?? '',
    notes: d.notes ?? '',
    retenues: { garantie: d.garantie, prorata: d.prorata, assuranceDEC: d.assuranceDEC, assuranceTRC: d.assuranceTRC },
    lignes: d.lignes.map((l) => ({
      id: l.id,
      ordre: l.ordre,
      code: l.code,
      designation: l.designation,
      unite: l.unite,
      quantite: l.quantite,
      prixUnitaireHT: l.prixUnitaireHT,
      tauxTVA: l.tauxTVA,
      tauxFODEC: l.tauxFODEC,
      categorieId: l.categorieId,
      ligneBordereauId: l.ligneBordereauId,
      notes: l.notes,
    })),
  };
}

export function etatNeuf(defauts: DefautsAvenant, aujourdhui: string): EtatAvenant {
  const retenue = (cle: CleRetenue): RetenueAvenantDto => ({ parMontant: false, taux: defauts.taux[cle], montant: null });
  return {
    date: aujourdhui,
    referenceInterne: '',
    notes: '',
    retenues: { garantie: retenue('garantie'), prorata: retenue('prorata'), assuranceDEC: retenue('assuranceDEC'), assuranceTRC: retenue('assuranceTRC') },
    lignes: [],
  };
}

export function ligneVide(rang: number, defauts: DefautsAvenant): LigneAvenantSaisieDto {
  return {
    id: crypto.randomUUID(),
    ordre: rang,
    code: null,
    designation: null,
    unite: null,
    quantite: 0,
    prixUnitaireHT: 0,
    tauxTVA: defauts.tauxTVA,
    tauxFODEC: 0,
    categorieId: defauts.categorieId,
    ligneBordereauId: null,
    notes: null,
  };
}

export function depuisBordereau(l: LigneBordereauDto, rang: number): LigneAvenantSaisieDto {
  return {
    id: crypto.randomUUID(),
    ordre: rang,
    code: l.code,
    designation: l.designation,
    unite: l.unite,
    quantite: 0,
    prixUnitaireHT: l.prixUnitaireHT,
    tauxTVA: l.tauxTVA,
    tauxFODEC: l.tauxFODEC,
    categorieId: l.categorieId,
    ligneBordereauId: l.id,
    notes: l.notes,
  };
}

/** R5 : total HT d'une ligne = qté × PU HT × (1 + FODEC). */
export function totalHTAvenant(l: Pick<LigneAvenantSaisieDto, 'quantite' | 'prixUnitaireHT' | 'tauxFODEC'>): number {
  return (l.quantite ?? 0) * (l.prixUnitaireHT ?? 0) * (1 + (l.tauxFODEC ?? 0) / 100);
}

/** Montant d'une retenue : saisi (par montant) ou taux × TTC. */
export function montantRetenue(r: RetenueAvenantDto, ttc: number): number {
  return r.parMontant ? (r.montant ?? 0) : ((r.taux ?? 0) * ttc) / 100;
}

/** Taux d'une retenue : saisi, ou montant / TTC (0 si TTC = 0). */
export function tauxRetenue(r: RetenueAvenantDto, ttc: number): number {
  if (!r.parMontant) return r.taux ?? 0;
  return ttc === 0 ? 0 : ((r.montant ?? 0) / ttc) * 100;
}

export interface TotauxAvenant {
  ht: number;
  tva: number;
  ttc: number;
  net: number;
}

export function totauxAvenant(etat: EtatAvenant): TotauxAvenant {
  const ht = etat.lignes.reduce((s, l) => s + totalHTAvenant(l), 0);
  const ttc = etat.lignes.reduce((s, l) => s + totalTTCLigne(l), 0);
  const retenues = RETENUES.reduce((s, { cle }) => s + montantRetenue(etat.retenues[cle], ttc), 0);
  return { ht, tva: ttc - ht, ttc, net: ttc - retenues };
}

/** `fige` : avenant facturé, lignes et retenues repartent telles que lues (sinon 409 « Avenant facturé »). */
export function versSaisie(etat: EtatAvenant, fige = false): AvenantSaisieDto {
  const { ttc } = totauxAvenant(etat);
  const retenue = (cle: CleRetenue): RetenueAvenantDto => {
    const r = etat.retenues[cle];
    return fige ? r : { parMontant: r.parMontant, taux: tauxRetenue(r, ttc), montant: montantRetenue(r, ttc) };
  };
  return {
    date: etat.date || null,
    referenceInterne: etat.referenceInterne || null,
    notes: etat.notes || null,
    garantie: retenue('garantie'),
    prorata: retenue('prorata'),
    assuranceDEC: retenue('assuranceDEC'),
    assuranceTRC: retenue('assuranceTRC'),
    lignes: fige ? etat.lignes : etat.lignes.map((l, i) => ({ ...l, ordre: i + 1 })),
  };
}
