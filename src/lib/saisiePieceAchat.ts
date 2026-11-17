// Brouillon d'une pièce d'achat : taux en % à l'écran, en fraction sur le fil (0,2 = 20 %).
import type { UUID } from '../types';
import type { DocumentAchatDetailDto, ModelePieceAchatDto, SaisiePieceAchatRequest } from '../types/achat';

export interface LigneBrouillon {
  cle: number;
  id: UUID | null;
  code: string;
  description: string;
  unite: string;
  quantite: number | null;
  prixUnitaireHT: number | null;
  remise: number | null;
  fodec: number | null;
  tva: number | null;
  categorieId: UUID | null;
  notes: string;
  /** Ligne de bordereau recopiée d'une source ; null = ligne libre. */
  ligneBordereauId: UUID | null;
}

export interface PartBrouillon {
  cle: number;
  projetId: UUID | null;
  taux: number | null;
}

export interface BrouillonPiece {
  nature: string;
  dateDocument: string;
  dateEcheance: string;
  dateLivraisonSouhaitee: string;
  societeId: UUID | null;
  moduleId: UUID | null;
  fournisseurId: UUID | null;
  projetId: UUID | null;
  lotId: UUID | null;
  typeMarcheId: UUID | null;
  declencheurId: UUID | null;
  personneAContacter: string;
  referenceInterne: string;
  referenceBureauOrdre: string;
  notes: string;
  notes2: string;
  montantRegul: number | null;
  timbreFiscal: number | null;
  categorieId: UUID | null;
  lignes: LigneBrouillon[];
  parts: PartBrouillon[];
  /** Pièces sources d'une génération ; vide = création libre. */
  sources: UUID[];
}

let compteur = 0;
const prochaineCle = () => ++compteur;

const enPourcent = (fraction: number | null): number | null => (fraction == null ? null : Math.round(fraction * 1e8) / 1e6);
const enFraction = (pourcent: number | null): number | null => (pourcent == null ? null : pourcent / 100);

export function ligneVide(tvaPourcent: number | null): LigneBrouillon {
  return {
    cle: prochaineCle(), id: null, code: '', description: '', unite: '', quantite: null, prixUnitaireHT: null,
    remise: null, fodec: null, tva: tvaPourcent, categorieId: null, notes: '',
    ligneBordereauId: null,
  };
}

export const partVide = (): PartBrouillon => ({ cle: prochaineCle(), projetId: null, taux: null });

/** TVA par défaut du modèle, en % ; null si le modèle n'en donne pas. */
export const tvaParDefautPourcent = (m: ModelePieceAchatDto): number | null => enPourcent(m.tvaParDefaut);

export function depuisModele(m: ModelePieceAchatDto): BrouillonPiece {
  const tva = tvaParDefautPourcent(m);
  return {
    nature: m.nature,
    dateDocument: m.dateDocument,
    dateEcheance: m.dateEcheance ?? '',
    dateLivraisonSouhaitee: m.dateLivraisonSouhaitee ?? '',
    societeId: m.societeId,
    moduleId: m.moduleId,
    fournisseurId: m.fournisseurId,
    projetId: m.projetId,
    lotId: m.lotId,
    typeMarcheId: m.typeMarcheId,
    declencheurId: m.declencheurId,
    personneAContacter: m.personneAContacter ?? '',
    referenceInterne: m.referenceInterne ?? '',
    referenceBureauOrdre: m.referenceBureauOrdre ?? '',
    notes: m.notes ?? '',
    notes2: m.notes2 ?? '',
    montantRegul: m.montantRegul,
    timbreFiscal: m.timbreFiscal,
    categorieId: m.categorieId,
    lignes: m.lignes.length
      ? m.lignes.map((l) => ({
          cle: prochaineCle(), id: null, code: l.code ?? '', description: l.description, unite: l.unite ?? '',
          quantite: l.quantite, prixUnitaireHT: l.prixUnitaireHT, remise: enPourcent(l.remise), fodec: enPourcent(l.fodec),
          tva: enPourcent(l.tva), categorieId: l.categorieId, notes: l.notes ?? '',
          ligneBordereauId: l.ligneBordereauId ?? null,
        }))
      : [ligneVide(tva)],
    parts: m.ventilationProjets.map((p) => ({ cle: prochaineCle(), projetId: p.cleId, taux: enPourcent(p.taux) })),
    sources: m.sources ?? [],
  };
}

export function depuisDetail(d: DocumentAchatDetailDto): BrouillonPiece {
  return {
    nature: d.nature ?? '',
    dateDocument: d.dateDocument ?? '',
    dateEcheance: d.dateEcheance ?? '',
    dateLivraisonSouhaitee: d.dateLivraisonSouhaitee ?? '',
    societeId: d.societeId,
    moduleId: d.moduleId,
    fournisseurId: d.fournisseurId,
    projetId: d.projetId,
    lotId: d.lotId,
    typeMarcheId: d.typeLotId,
    declencheurId: d.declencheurId,
    personneAContacter: d.personneAContacter ?? '',
    referenceInterne: d.reference ?? '',
    referenceBureauOrdre: d.referenceBureauOrdre ?? '',
    notes: d.notes ?? '',
    notes2: d.note2 ?? '',
    montantRegul: d.regularisation,
    timbreFiscal: d.timbreFiscal,
    categorieId: d.categorieId,
    lignes: d.lignes.map((l) => ({
      cle: prochaineCle(), id: l.id, code: l.code ?? '', description: l.designation ?? '', unite: l.unite ?? '',
      quantite: l.quantite, prixUnitaireHT: l.prixUnitaireHT, remise: l.remisePourcent, fodec: l.fodecPourcent,
      tva: l.tauxTVA, categorieId: l.categorieId, notes: l.notes ?? '', ligneBordereauId: null,
    })),
    parts: d.ventilationProjets.map((p) => ({ cle: prochaineCle(), projetId: p.projetId, taux: enPourcent(p.taux) })),
    sources: [],
  };
}

function erreurLigne(l: LigneBrouillon): string | null {
  if (!l.description.trim()) return 'désignation obligatoire';
  if (l.quantite == null) return 'quantité obligatoire';
  if (l.prixUnitaireHT == null) return 'prix unitaire HT obligatoire';
  if (l.tva == null) return 'TVA obligatoire';
  if (!l.categorieId) return 'catégorie obligatoire';
  return null;
}

const OBLIGATOIRES: [keyof BrouillonPiece, string][] = [
  ['societeId', 'Société obligatoire.'],
  ['moduleId', 'Module obligatoire.'],
  ['fournisseurId', 'Fournisseur obligatoire.'],
  ['typeMarcheId', 'Type obligatoire.'],
  ['dateDocument', 'Date de la pièce obligatoire.'],
];

/** Erreurs par clé de champ (`lignes`, `ventilation` pour les grilles) ; vide si la saisie peut partir. */
export function verifier(b: BrouillonPiece): Record<string, string> {
  const erreurs: Record<string, string> = {};
  for (const [cle, message] of OBLIGATOIRES) if (!b[cle]) erreurs[cle] = message;
  if (b.montantRegul == null) erreurs.montantRegul = 'Montant de régularisation obligatoire (0 si aucun).';
  if (b.timbreFiscal == null) erreurs.timbreFiscal = 'Timbre fiscal obligatoire (0 si aucun).';
  const indice = b.lignes.findIndex((l) => erreurLigne(l));
  if (indice >= 0) erreurs.lignes = `Ligne ${indice + 1} : ${erreurLigne(b.lignes[indice])}.`;
  if (b.parts.some((p) => !p.projetId || p.taux == null)) erreurs.ventilation = 'Chaque part de ventilation demande un projet et un taux.';
  else if (!b.projetId && !ventilationComplete(b.parts)) erreurs.ventilation = 'Sans projet, la ventilation par projet est obligatoire et doit totaliser 100 %.';
  return erreurs;
}

export const totalVentilation = (parts: PartBrouillon[]): number => parts.reduce((s, p) => s + (p.taux ?? 0), 0);
export const ventilationComplete = (parts: PartBrouillon[]): boolean => Math.abs(totalVentilation(parts) - 100) < 1e-6;

// L'ordre compte : `lignes[0].categorieId` doit désigner la grille, pas la catégorie d'en-tête.
const CHAMPS_SERVEUR: [string, string][] = [
  ['lignes', 'lignes'], ['ventilationProjets', 'ventilation'], ['societeId', 'societeId'], ['moduleId', 'moduleId'],
  ['fournisseurId', 'fournisseurId'], ['projetId', 'projetId'], ['lotId', 'lotId'], ['typeMarcheId', 'typeMarcheId'],
  ['declencheurId', 'declencheurId'], ['dateDocument', 'dateDocument'], ['dateEcheance', 'dateEcheance'],
  ['dateLivraisonSouhaitee', 'dateLivraisonSouhaitee'], ['categorieId', 'categorieId'], ['montantRegul', 'montantRegul'],
  ['timbreFiscal', 'timbreFiscal'],
];

/** Champ du formulaire nommé par le `detail` d'un 400 ; null s'il n'en nomme aucun. */
export const champErreurServeur = (detail: string): string | null => CHAMPS_SERVEUR.find(([nom]) => detail.includes(nom))?.[1] ?? null;

const vide = (s: string): string | null => (s.trim() === '' ? null : s);

/** À n'appeler qu'après `verifier` : les champs obligatoires sont alors renseignés. */
export function versRequete(b: BrouillonPiece): SaisiePieceAchatRequest {
  return {
    nature: b.nature,
    dateDocument: b.dateDocument,
    dateEcheance: vide(b.dateEcheance),
    dateLivraisonSouhaitee: vide(b.dateLivraisonSouhaitee),
    societeId: b.societeId ?? '',
    moduleId: b.moduleId ?? '',
    fournisseurId: b.fournisseurId ?? '',
    projetId: b.projetId,
    lotId: b.projetId ? b.lotId : null,
    typeMarcheId: b.typeMarcheId ?? '',
    declencheurId: b.declencheurId,
    personneAContacter: vide(b.personneAContacter),
    referenceInterne: vide(b.referenceInterne),
    referenceBureauOrdre: vide(b.referenceBureauOrdre),
    notes: vide(b.notes),
    notes2: vide(b.notes2),
    montantRegul: b.montantRegul,
    timbreFiscal: b.timbreFiscal,
    categorieId: b.categorieId,
    lignes: b.lignes.map((l) => ({
      id: l.id,
      code: vide(l.code),
      description: l.description.trim(),
      unite: vide(l.unite),
      quantite: l.quantite ?? 0,
      prixUnitaireHT: l.prixUnitaireHT ?? 0,
      remise: enFraction(l.remise),
      fodec: enFraction(l.fodec),
      tva: enFraction(l.tva) ?? 0,
      categorieId: l.categorieId ?? '',
      notes: vide(l.notes),
      ligneBordereauId: l.ligneBordereauId,
    })),
    ventilationProjets: b.parts.map((p) => ({ cleId: p.projetId ?? '', taux: enFraction(p.taux) ?? 0 })),
    sources: b.sources,
  };
}

export interface TotauxApercu {
  ht: number;
  tva: number;
  ttc: number;
}

/** Aperçu sans arrondi : la réponse du serveur fait foi. */
const netUnitaire = (l: LigneBrouillon): number => (l.prixUnitaireHT ?? 0) * (1 - (l.remise ?? 0) / 100) * (1 + (l.fodec ?? 0) / 100);

export function totauxLigne(l: LigneBrouillon): TotauxApercu {
  const ht = (l.quantite ?? 0) * netUnitaire(l);
  const tva = (ht * (l.tva ?? 0)) / 100;
  return { ht, tva, ttc: ht + tva };
}

export const prixUnitaireTTC = (l: LigneBrouillon): number => netUnitaire(l) * (1 + (l.tva ?? 0) / 100);

const somme = (s: TotauxApercu, t: TotauxApercu): TotauxApercu => ({ ht: s.ht + t.ht, tva: s.tva + t.tva, ttc: s.ttc + t.ttc });
const ZERO: TotauxApercu = { ht: 0, tva: 0, ttc: 0 };

export function apercuTotaux(lignes: LigneBrouillon[]): TotauxApercu {
  return lignes.map(totauxLigne).reduce(somme, ZERO);
}

/** Récap Base / TVA / Montant par taux de TVA (en %), taux croissants. */
export function recapParTaux(lignes: LigneBrouillon[]): (TotauxApercu & { taux: number })[] {
  const parTaux = new Map<number, TotauxApercu>();
  for (const l of lignes) {
    const taux = l.tva ?? 0;
    parTaux.set(taux, somme(parTaux.get(taux) ?? ZERO, totauxLigne(l)));
  }
  return [...parTaux.entries()].sort(([a], [b]) => a - b).map(([taux, t]) => ({ taux, ...t }));
}
