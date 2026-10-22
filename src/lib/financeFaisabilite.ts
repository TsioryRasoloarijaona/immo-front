import type { SectionSaisie } from './saisiePatrimoine';
import type {
  CategorieBilanDto, LignePrevisionDto, MoisTresorerieDto, RemboursementFaisabiliteDto, SaisiePrevisionDto,
} from '../types/faisabilite';

// Argent des études (FEATURE-patrimoine-faisabilite-workflow.md §1-2) : aucun calcul ici, le serveur fait foi.

export const SECTIONS_CREDIT: SectionSaisie[] = [{
  titre: 'Crédit',
  champs: [
    { nom: 'description', libelle: 'Description', type: 'texte' },
    { nom: 'dateDeblocage', libelle: 'Date de déblocage', type: 'date', obligatoire: true },
    { nom: 'montant', libelle: 'Déblocage', type: 'montant' },
    { nom: 'nombreRemboursements', libelle: 'Nombre de remboursements', type: 'entier' },
    { nom: 'periodiciteMois', libelle: 'Périodicité en mois', type: 'entier' },
    { nom: 'periodeGraceMois', libelle: 'Période de grâce (mois)', type: 'entier' },
    { nom: 'tauxCharge', libelle: 'Taux de charge', type: 'pourcent' },
  ],
}];

/**
 * Saisie à deux sens du serveur : un seul des deux (taux ou intérêts) doit partir, sinon le taux gagne.
 * Modifier le taux (ou la base d'une ligne qui a un taux) laisse le serveur recalculer les intérêts.
 */
export function remboursementApres(ligne: RemboursementFaisabiliteDto, nom: keyof RemboursementFaisabiliteDto): RemboursementFaisabiliteDto {
  if (nom === 'montantInterets') return { ...ligne, tauxInteret: null };
  const recalculInterets = nom === 'tauxInteret' || (nom === 'montantBase' && ligne.tauxInteret !== null && ligne.tauxInteret !== undefined);
  return recalculInterets ? { ...ligne, montantInterets: null } : ligne;
}

/** Saisies reconstruites d'une lecture : les ancêtres purs et les lignes imposées sont rajoutés par le serveur. */
export function saisiesDepuis(lignes: LignePrevisionDto[]): SaisiePrevisionDto[] {
  const parents = new Set(lignes.map((l) => l.parentId));
  return lignes
    .filter((l) => !l.verrouillee && (l.uniteEtudeId || l.categorieReferenceId || !parents.has(l.categorieId)))
    .map((l) => ({
      categorieId: l.categorieId,
      uniteEtudeId: l.uniteEtudeId,
      categorieReferenceId: l.categorieReferenceId,
      ratio: l.ratio,
      tauxTva: l.tauxTva,
      estPourProjet: l.estPourProjet,
      dateApplication: l.dateApplication,
    }));
}

/** Lignes montrées : sans le contenu des nœuds repliés ; `principales` garde la racine et ses enfants directs. */
export function lignesVisibles(lignes: LignePrevisionDto[], repliees: ReadonlySet<string>, principales: boolean): LignePrevisionDto[] {
  const visibles: LignePrevisionDto[] = [];
  let masqueSous: number | null = null;
  for (const l of lignes) {
    if (masqueSous !== null && l.profondeur > masqueSous) continue;
    masqueSous = null;
    if (principales && l.profondeur > 1) continue;
    visibles.push(l);
    if (repliees.has(l.categorieId)) masqueSous = l.profondeur;
  }
  return visibles;
}

export function codesTranches(lignes: LignePrevisionDto[]): string[] {
  return (lignes[0]?.ventilation ?? []).map((v) => v.trancheCode ?? '—');
}

export interface CategorieIndentee extends CategorieBilanDto {
  profondeur: number;
}

/** Catégories du choix rangées en arbre (parent avant enfants, par ordre) avec leur profondeur. */
export function categoriesEnArbre(categories: CategorieBilanDto[]): CategorieIndentee[] {
  const enfants = new Map<string | null, CategorieBilanDto[]>();
  const ids = new Set(categories.map((c) => c.id));
  for (const c of categories) {
    const cle = c.parentId && ids.has(c.parentId) ? c.parentId : null;
    enfants.set(cle, [...(enfants.get(cle) ?? []), c]);
  }
  const resultat: CategorieIndentee[] = [];
  const parcourir = (parent: string | null, profondeur: number) => {
    const fils = [...(enfants.get(parent) ?? [])].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));
    for (const c of fils) {
      resultat.push({ ...c, profondeur });
      parcourir(c.id, profondeur + 1);
    }
  };
  parcourir(null, 0);
  return resultat;
}

export type CleSerie = 'concretisation' | 'finalisation' | 'depense' | 'garantie' | 'financement' | 'remboursement' | 'depenseProjet' | 'solde';

export interface SerieCourbe {
  cle: CleSerie;
  libelle: string;
  couleur: string;
}

export const SERIES: readonly SerieCourbe[] = [
  { cle: 'concretisation', libelle: 'Concrétisation', couleur: '#2563eb' },
  { cle: 'finalisation', libelle: 'Finalisation', couleur: '#0891b2' },
  { cle: 'depense', libelle: "Dépense d'exécution", couleur: '#dc2626' },
  { cle: 'garantie', libelle: 'Retenue de garantie', couleur: '#ea580c' },
  { cle: 'financement', libelle: 'Financement', couleur: '#16a34a' },
  { cle: 'remboursement', libelle: 'Remboursement', couleur: '#9333ea' },
  { cle: 'depenseProjet', libelle: 'Dépense projet', couleur: '#be185d' },
  { cle: 'solde', libelle: 'Solde', couleur: '#111827' },
];

export const valeurSerie = (m: MoisTresorerieDto, cle: CleSerie): number => m[cle] ?? 0;

export const LIBELLES_TYPE_TRESORERIE: Record<string, string> = {
  Concretisation: 'Concrétisation',
  Finalization: 'Finalisation',
  Expense: "Dépense d'exécution",
  ExpenseBackGuarantee: 'Retenue de garantie',
  Funding: 'Financement',
  Refunding: 'Remboursement',
  ProjectExpense: 'Dépense projet',
};
