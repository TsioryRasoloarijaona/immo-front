import { useEffect, useState } from 'react';
import { calculerEtude } from './apiFaisabilite';
import { useDebouncedValue, errorMessage } from './useApi';
import { champsDe, type ChampDef, type SectionSaisie, type TypeChamp } from './saisiePatrimoine';
import type { BadgeTone, ReferentielItemDto } from '../types';
import type { EtudeFaisabiliteDto, LigneTrancheEtudeDto, SaisieEtudeDto, ValeursFaisabilite } from '../types/faisabilite';

const saisie = (nom: string, libelle: string, type: TypeChamp, extra: Partial<ChampDef> = {}): ChampDef =>
  ({ nom, libelle, type, ...extra });
/** Valeur calculée par le serveur (aperçu `POST /calcul`) : affichée, jamais envoyée. */
const calcule = (nom: string, libelle: string, type: TypeChamp): ChampDef => saisie(nom, libelle, type, { lectureSeule: true });

/** Phase : délai après la précédente, début, durée (mois) et fin ; la fin et les débuts suivants sont calculés. */
function phase(titre: string, cle: string, delai?: string, debutSaisi = false): SectionSaisie {
  const debut = `debut${cle}`;
  return {
    titre,
    champs: [
      ...(delai ? [saisie(delai, 'Délai après la phase précédente (mois)', 'entier')] : []),
      debutSaisi ? saisie(debut, 'Début', 'date') : calcule(debut, 'Début', 'date'),
      saisie(`duree${cle}`, 'Durée (mois)', 'entier'),
      calcule(`fin${cle}`, 'Fin', 'date'),
    ],
  };
}

export const SECTIONS_IDENTITE: SectionSaisie[] = [{
  titre: 'Identité',
  champs: [
    saisie('code', 'Code', 'texte', { obligatoire: true }),
    saisie('description', 'Description', 'texte', { obligatoire: true }),
    saisie('dateDocument', 'Date du document', 'date', { obligatoire: true }),
    saisie('societeId', 'Société', 'liste', { obligatoire: true, liste: 'societes' }),
    saisie('terrainId', 'Terrain', 'liste', { liste: 'terrains' }),
    saisie('descriptionTerrain', 'Description du terrain', 'texte'),
    saisie('nombreArticlesAVendre', "Nombre d'articles à vendre", 'entier'),
    saisie('proportionTerrainPourTva', 'Proportion du terrain pour le calcul de la TVA', 'booleen'),
    saisie('tauxTvaDefaut', 'TVA par défaut', 'pourcent'),
    saisie('tauxTvaInterets', 'TVA sur les intérêts', 'pourcent'),
  ],
}];

/** Coefficient ↔ montant : l'un ou l'autre se saisit, l'autre est calculé (le coefficient gagne s'ils sont envoyés tous deux). */
const PAIRES: readonly (readonly [string, string])[] = [
  ['coefEquipements', 'superficieEquipements'],
  ['coefEmprise', 'empriseAuSol'],
  ['cuf', 'plancherCouvert'],
  ['coefVendable', 'plancherVendable'],
  ['prixAchatM2', 'prixTerrain'],
];

export const SECTIONS_TERRAIN: SectionSaisie[] = [
  {
    titre: 'Surfaces',
    champs: [
      saisie('superficie', 'Superficie du terrain', 'surface'),
      saisie('coefEquipements', 'Coefficient équipements', 'pourcent'),
      saisie('superficieEquipements', 'Superficie équipements', 'surface'),
      calcule('superficieNette', 'Superficie nette', 'surface'),
      saisie('coefEmprise', "Coefficient d'emprise au sol (COS)", 'pourcent'),
      saisie('empriseAuSol', 'Emprise au sol', 'surface'),
      saisie('cuf', "Coefficient d'utilisation du foncier (CUF)", 'pourcent'),
      saisie('plancherCouvert', 'Plancher couvert', 'surface'),
      saisie('coefVendable', 'Coefficient vendable', 'pourcent'),
      saisie('plancherVendable', 'Plancher vendable', 'surface'),
      calcule('surfaceNonBatie', 'Surface non bâtie', 'surface'),
    ],
  },
  {
    titre: 'Coût du terrain',
    champs: [
      saisie('prixAchatM2', "Prix d'achat au m² (TTC)", 'montant'),
      calcule('prixAchatM2Ht', "Prix d'achat au m² (HT)", 'montant'),
      calcule('prixAchatM2Tva', "TVA du prix d'achat au m²", 'montant'),
      saisie('prixTerrain', 'Prix du terrain (TTC)', 'montant'),
      calcule('prixTerrainHt', 'Prix du terrain (HT)', 'montant'),
      calcule('prixTerrainTva', 'TVA du prix du terrain', 'montant'),
      saisie('tauxTvaTerrain', 'TVA du terrain', 'pourcent'),
      saisie('tauxFraisEnregistrement', "Taux des frais d'enregistrement", 'pourcent'),
      calcule('fraisEnregistrement', "Frais d'enregistrement (TTC)", 'montant'),
      calcule('fraisEnregistrementHt', "Frais d'enregistrement (HT)", 'montant'),
      calcule('fraisEnregistrementTva', "TVA des frais d'enregistrement", 'montant'),
      saisie('tauxAutresFraisTerrain', 'Taux des autres frais de terrain', 'pourcent'),
      calcule('autresFraisTerrain', 'Autres frais de terrain (TTC)', 'montant'),
      calcule('autresFraisTerrainHt', 'Autres frais de terrain (HT)', 'montant'),
      calcule('autresFraisTerrainTva', 'TVA des autres frais de terrain', 'montant'),
      calcule('coutTotalTerrain', 'Coût total du terrain (TTC)', 'montant'),
      calcule('coutTotalTerrainHt', 'Coût total du terrain (HT)', 'montant'),
    ],
  },
  {
    titre: 'Construction',
    champs: [
      saisie('coutConstructionM2Bati', 'Coût de construction au m² bâti', 'montant'),
      calcule('coutBati', 'Coût du bâti', 'montant'),
      saisie('coutConstructionM2NonBati', 'Coût de construction au m² non bâti', 'montant'),
      calcule('coutNonBati', 'Coût du non bâti', 'montant'),
      saisie('tauxAutresFraisExecution', "Taux des autres frais d'exécution", 'pourcent'),
      calcule('autresFraisExecution', "Autres frais d'exécution", 'montant'),
    ],
  },
];

/** Les 7 phases dans l'ordre : libellé, suffixe des champs (`debut…`, `duree…`, `fin…`) et champ du délai qui les précède. */
export const PHASES: readonly (readonly [string, string, string?])[] = [
  ['Achat du terrain', 'AchatTerrain'],
  ['Période de validation', 'PeriodeValidation', 'delaiAchatTerrainPeriodeValidation'],
  ['Permis de bâtir', 'PermisBatir', 'delaiPeriodeValidationPermisBatir'],
  ['Études', 'Etudes', 'delaiPermisBatirEtudes'],
  ['Travaux', 'Travaux', 'delaiPermisBatirTravaux'],
  ['Concrétisation', 'Concretisation', 'delaiTravauxConcretisation'],
  ['Finalisation', 'Finalisation', 'delaiTravauxFinalisation'],
];

export const SECTIONS_PHASES: SectionSaisie[] = [
  ...PHASES.map(([titre, cle, delai]) => phase(titre, cle, delai, delai === undefined)),
  {
    titre: 'Écarts-types et garanties',
    champs: [
      saisie('ecartTypeTravaux', 'Écart-type des travaux', 'entier'),
      saisie('ecartTypeConcretisation', 'Écart-type de la concrétisation', 'entier'),
      saisie('ecartTypeFinalisation', 'Écart-type de la finalisation', 'entier'),
      saisie('delaiRetourJours', 'Délai de retour (jours)', 'entier'),
      saisie('tauxRetenueGarantie', 'Taux de retenue de garantie', 'pourcent'),
      saisie('tauxApplicationRetenueGarantie', "Taux d'application de la retenue de garantie", 'pourcent'),
    ],
  },
];

export const SECTIONS_BILAN: SectionSaisie[] = [
  {
    titre: "Coûts et chiffre d'affaires",
    champs: [
      saisie('chiffreAffaires', "Chiffre d'affaires", 'montant'),
      saisie('coutExecution', "Coût d'exécution (TTC)", 'montant'),
      saisie('coutExecutionHt', "Coût d'exécution (HT)", 'montant'),
      saisie('coutTotal', 'Coût global (TTC)', 'montant'),
      saisie('coutTotalHt', 'Coût global (HT)', 'montant'),
      saisie('coutRevientM2', 'Coût de revient au m²', 'montant'),
      saisie('prixVenteM2', 'Prix de vente au m²', 'montant'),
    ],
  },
  {
    titre: 'Concrétisation et financement',
    champs: [
      saisie('pourcentageConcretisation', 'Concrétisation', 'pourcent'),
      saisie('montantConcretisation', 'Montant de la concrétisation', 'montant'),
      saisie('montantFinalisation', 'Montant de la finalisation', 'montant'),
      saisie('coutFinancement', 'Coût du financement', 'montant'),
      saisie('tauxAutofinancement', "Taux d'autofinancement", 'pourcent'),
      saisie('montantAutofinancement', "Montant de l'autofinancement", 'montant'),
      saisie('tauxFinancementClient', 'Financement client', 'pourcent'),
      saisie('tauxFinancementCredit', 'Financement par crédit', 'pourcent'),
    ],
  },
  {
    titre: 'Marges et rentabilité',
    champs: [
      saisie('margeBrute', 'Marge brute', 'montant'),
      saisie('tauxIs', "Taux d'impôt sur les sociétés", 'pourcent'),
      saisie('montantIs', "Montant de l'impôt sur les sociétés", 'montant'),
      saisie('margeNette', 'Marge nette', 'montant'),
      saisie('rentabiliteCoutProjet', 'Rentabilité sur le coût du projet', 'pourcent'),
      saisie('rentabiliteChiffreAffaires', "Rentabilité sur le chiffre d'affaires", 'pourcent'),
      saisie('rentabiliteFondsPropres', 'Rentabilité sur les fonds propres', 'pourcent'),
    ],
  },
];

export const SECTIONS_ETUDE: SectionSaisie[] = [...SECTIONS_IDENTITE, ...SECTIONS_TERRAIN, ...SECTIONS_PHASES];
export const CHAMPS_ETUDE: ChampDef[] = champsDe(SECTIONS_ETUDE);

/** Champs de la paire que le serveur recalcule : celui que l'utilisateur n'a pas saisi en dernier. */
export function suiveurs(montantsPilotes: readonly string[]): string[] {
  return PAIRES.map(([coef, montant]) => (montantsPilotes.includes(montant) ? coef : montant));
}

/** Pose le pilote de la paire du champ saisi (le coefficient reprend la main quand on le retape). */
export function pilotesApres(nom: string, montantsPilotes: readonly string[]): string[] {
  const paire = PAIRES.find(([coef, montant]) => coef === nom || montant === nom);
  if (!paire) return [...montantsPilotes];
  const sansPaire = montantsPilotes.filter((m) => m !== paire[1]);
  return nom === paire[1] ? [...sansPaire, nom] : sansPaire;
}

/** Corps d'écriture ou d'aperçu sans le champ recalculé de chaque paire. */
export function sansSuiveurs(corps: Record<string, unknown>, montantsPilotes: readonly string[]): Record<string, unknown> {
  const retire = new Set(suiveurs(montantsPilotes));
  return Object.fromEntries(Object.entries(corps).filter(([nom]) => !retire.has(nom)));
}

/** Champs dont l'écran affiche la valeur de l'aperçu serveur plutôt que le brouillon. */
export function nomsCalcules(montantsPilotes: readonly string[]): Set<string> {
  return new Set([...CHAMPS_ETUDE.filter((c) => c.lectureSeule).map((c) => c.nom), ...suiveurs(montantsPilotes)]);
}

/**
 * Aperçu serveur (`POST /calcul`, sans écriture) du corps courant, après débounce. `erreurs` porte les messages Verif
 * des grilles enregistrées ; en cas d'échec on garde la dernière valeur et on remonte le message.
 */
export function useCalculEtude(corps: SaisieEtudeDto, actif: boolean) {
  const cle = useDebouncedValue(JSON.stringify(corps));
  const [valeurs, setValeurs] = useState<ValeursFaisabilite | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  useEffect(() => {
    if (!actif) return;
    let perime = false;
    void calculerEtude(JSON.parse(cle) as SaisieEtudeDto).then((v) => {
      if (perime) return;
      setValeurs(v);
      setErreur(null);
    }, (err: unknown) => {
      if (!perime) setErreur(errorMessage(err));
    });
    return () => { perime = true; };
  }, [cle, actif]);
  return { valeurs, erreur };
}

const TONES: Record<string, BadgeTone> = {
  Green: 'success', LimeGreen: 'success', DodgerBlue: 'info', Blue: 'info', RoyalBlue: 'info',
  Orange: 'amber', Gold: 'amber', Yellow: 'amber', Red: 'warning', Crimson: 'warning', OrangeRed: 'warning',
};

/** Couleur .NET du statut OMRAN → pastille. */
export const toneStatut = (couleur: string | null | undefined): BadgeTone => TONES[couleur ?? ''] ?? 'neutral';

/** Liste de choix qui garde toujours la valeur de la ligne (affichage en lecture sans accès au référentiel). */
export function choixAvec(liste: ReferentielItemDto[], id: string | null | undefined, repli: Omit<ReferentielItemDto, 'id'>): ReferentielItemDto[] {
  if (!id || liste.some((c) => c.id === id)) return liste;
  return [...liste, { id, ...repli }];
}

/** Tranche neuve de rang `rang` : dates des phases de l'étude (OMRAN `AddCfgTranche`). */
export function trancheNeuve(fiche: EtudeFaisabiliteDto, rang: number): LigneTrancheEtudeDto {
  const v = fiche.valeurs;
  return {
    code: `Tranche ${rang}`,
    sorting: rang,
    trancheId: null,
    poids: null,
    debutTravaux: v.debutTravaux,
    finTravaux: v.finTravaux,
    debutCommercialisation: v.debutConcretisation,
    finCommercialisation: v.finFinalisation,
    finConcretisation: v.finConcretisation,
    debutFinalisation: v.debutFinalisation,
    dateLivraison: v.debutFinalisation,
    datePermisHabiter: v.debutPermisBatir,
    unites: [],
  };
}
