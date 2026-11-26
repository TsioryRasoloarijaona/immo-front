import type { ExtraDecompteDto, ExtraDecompteSaisie, LigneBordereauDto, RetenueDecompteDto, RetenueDecompteSaisie } from '../types/projet';

/** `id` sert de clé à la grille ; `idServeur` est nul tant que la ligne n'est pas enregistrée. */
export type ExtraSaisie = Omit<ExtraDecompteDto, 'id'> & { id: string; idServeur: string | null };
export type RetenueSaisie = Omit<RetenueDecompteDto, 'id'> & { id: string; idServeur: string | null };

export function extrasSaisis(extras: ExtraDecompteDto[]): ExtraSaisie[] {
  return extras.map((e) => ({ ...e, idServeur: e.id }));
}

export function retenuesSaisies(retenues: RetenueDecompteDto[]): RetenueSaisie[] {
  return retenues.map((r) => ({ ...r, idServeur: r.id }));
}

/** Extra du bordereau pas encore enregistrée : le serveur recopie tout sauf quantité et FODEC. */
export function recopieeDuBordereau(e: ExtraSaisie, champ: string): boolean {
  return e.idServeur === null && e.ligneMarcheId !== null && champ !== 'quantite' && champ !== 'tauxFODEC';
}

const VIDE_EXTRA = { unite: null, quantite: null, prixUnitaireHT: null, tauxTVA: null, tauxFODEC: null, montantHT: null, montantTTC: null, code: null, notes: null, categorieId: null, ligneMarcheId: null };

export function extraVide(): ExtraSaisie {
  return { ...VIDE_EXTRA, id: crypto.randomUUID(), idServeur: null, designation: '' };
}

/** Le serveur recopie les champs du bordereau (hors FODEC) ; on les préremplit pour l'affichage. */
export function extraDepuisBordereau(l: LigneBordereauDto): ExtraSaisie {
  return {
    ...VIDE_EXTRA,
    id: crypto.randomUUID(),
    idServeur: null,
    ligneMarcheId: l.id,
    code: l.code,
    designation: l.designation ?? '',
    unite: l.unite,
    quantite: 0,
    prixUnitaireHT: l.prixUnitaireHT,
    tauxTVA: l.tauxTVA,
    notes: l.notes,
    categorieId: l.categorieId,
  };
}

export function retenueVide(): RetenueSaisie {
  return { id: crypto.randomUUID(), idServeur: null, libelle: '', montant: null };
}

export function extrasDemande(extras: ExtraSaisie[]): ExtraDecompteSaisie[] {
  return extras.map((e) => ({
    id: e.idServeur,
    ligneMarcheId: e.ligneMarcheId,
    code: e.code,
    designation: e.designation,
    unite: e.unite,
    quantite: e.quantite,
    prixUnitaireHT: e.prixUnitaireHT,
    tauxTVA: e.tauxTVA,
    tauxFODEC: e.tauxFODEC,
    notes: e.notes,
    categorieId: e.categorieId,
  }));
}

export function retenuesDemande(retenues: RetenueSaisie[]): RetenueDecompteSaisie[] {
  return retenues.map((r) => ({ id: r.idServeur, libelle: r.libelle, montant: r.montant }));
}
