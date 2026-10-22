import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { getCategoriesBien, getVillesReferentiel } from './api';
import { apercuCalculProspectionTerrain } from './apiProspectionsTerrain';
import { listLignesReferentiel } from './apiReferentielsAdmin';
import { sansAccents } from './colonnes';
import { useTiersParType } from './editionDossier';
import { choixDepuisLignes } from './fraisTerrain';
import { libelleChoix } from './ongletsTranche';
import { referentielItems, useNiveauxTerrain, useOrientations, usePays, useTypesTerrain } from './referentiels';
import { brouillonDepuis, champsDe, corpsDepuis, type Brouillon, type Choix, type SectionSaisie } from './saisiePatrimoine';
import { errorMessage, useApi, useDebouncedValue } from './useApi';
import type { BadgeTone } from '../types';
import type {
  ApercuCalculDto, ProspectionTerrainDetailDto, ProspectionTerrainEcritureDto, SurfacesTerrain,
} from '../types/prospectionsTerrain';

const REFERENCES = ['categorie', 'type', 'niveau', 'vocation', 'pays', 'ville', 'courtier', 'notaire', 'orientation', 'statut'] as const;

/** Détail → source des champs : `xxxId` et `xxxLibelle` pour chaque référence. */
export function aplatir(p: ProspectionTerrainDetailDto): Record<string, unknown> {
  const plat: Record<string, unknown> = { ...p };
  for (const nom of REFERENCES) {
    const reference = p[nom];
    plat[`${nom}Id`] = reference?.id ?? '';
    plat[`${nom}Libelle`] = reference ? libelleChoix(reference) : undefined;
  }
  return plat;
}

/** Surfaces et prix qui se saisissent ; le serveur recalcule l'autre côté de chaque paire (aperçu). */
const SAISIES_APERCU = [
  'superficie', 'superficieEquipements', 'superficieEquipementACeder', 'superficieARegler', 'superficieACeder',
  'cos', 'superficieCos', 'cuf', 'superficieCuf', 'coefVendable', 'superficieVendable',
  'coefCommerce', 'superficieCommerce', 'coefBureau', 'superficieBureau', 'coefParking', 'superficieParking', 'prixM2', 'prix',
] as const;

const CALCULES = ['coefEquipements', 'superficieNette', 'superficieHabitat'] as const;

export const estSaisieApercu = (nom: string) => (SAISIES_APERCU as readonly string[]).includes(nom);

const DATES = ['date', 'dateValiditeStatut', 'dateEnregistrement', 'dateImmatriculation'];

export const SECTION_GENERAL: SectionSaisie = {
  titre: 'Général',
  champs: [
    { nom: 'code', libelle: 'Code', type: 'texte', obligatoire: true },
    { nom: 'description', libelle: 'Description', type: 'texte', obligatoire: true },
    { nom: 'date', libelle: 'Date', type: 'date' },
    { nom: 'categorieId', libelle: 'Catégorie', type: 'liste', liste: 'categories', obligatoire: true },
    { nom: 'typeId', libelle: 'Type', type: 'liste', liste: 'types', obligatoire: true },
    { nom: 'niveauId', libelle: 'Niveau', type: 'liste', liste: 'niveaux' },
    { nom: 'vocationId', libelle: 'Vocation', type: 'liste', liste: 'vocations' },
    { nom: 'paysId', libelle: 'Pays', type: 'liste', liste: 'pays', obligatoire: true },
    { nom: 'villeId', libelle: 'Ville', type: 'liste', liste: 'villes', obligatoire: true },
    { nom: 'courtierId', libelle: 'Courtier', type: 'liste', liste: 'courtiers' },
    { nom: 'notaireId', libelle: 'Notaire', type: 'liste', liste: 'notaires' },
    { nom: 'orientationId', libelle: 'Orientation', type: 'liste', liste: 'orientations' },
    { nom: 'lienGoogle', libelle: 'Lien Google Maps', type: 'texte' },
    { nom: 'adresse', libelle: 'Adresse', type: 'texte' },
    { nom: 'proprietaires', libelle: 'Propriétaires', type: 'texte' },
    { nom: 'estAmenage', libelle: 'Aménagé (décoché : terrain brut, avec zones)', type: 'booleen' },
    { nom: 'estArchivee', libelle: 'Archivée', type: 'booleen' },
    { nom: 'dateValiditeStatut', libelle: 'Date de validité du statut', type: 'date' },
    { nom: 'notes', libelle: 'Notes', type: 'texteLong' },
  ],
};

export const SECTION_SUPERFICIES: SectionSaisie = {
  titre: 'Superficies',
  champs: [
    { nom: 'superficie', libelle: 'Superficie', type: 'surface', obligatoire: true },
    { nom: 'superficieEquipements', libelle: "Superficie des voies d'aménagement", type: 'surface' },
    { nom: 'superficieEquipementACeder', libelle: 'Équipements à céder', type: 'surface' },
    { nom: 'superficieARegler', libelle: 'Superficie à régulariser', type: 'surface' },
    { nom: 'superficieACeder', libelle: 'Superficie à céder', type: 'surface' },
    { nom: 'coefEquipements', libelle: "Coefficient d'équipements", type: 'ratio', lectureSeule: true },
    { nom: 'superficieNette', libelle: 'Superficie nette', type: 'surface', lectureSeule: true },
    { nom: 'cos', libelle: 'COS', type: 'ratio' },
    { nom: 'superficieCos', libelle: 'Emprise au sol (superficie COS)', type: 'surface' },
    { nom: 'cuf', libelle: 'CUF', type: 'ratio' },
    { nom: 'superficieCuf', libelle: 'Plancher couvert (superficie CUF)', type: 'surface' },
    { nom: 'coefVendable', libelle: 'Coefficient vendable', type: 'ratio' },
    { nom: 'superficieVendable', libelle: 'Plancher vendable', type: 'surface' },
    { nom: 'coefCommerce', libelle: 'Coefficient commerce', type: 'ratio' },
    { nom: 'superficieCommerce', libelle: 'Superficie commerce', type: 'surface' },
    { nom: 'coefBureau', libelle: 'Coefficient bureau', type: 'ratio' },
    { nom: 'superficieBureau', libelle: 'Superficie bureau', type: 'surface' },
    { nom: 'superficieHabitat', libelle: 'Superficie habitat', type: 'surface', lectureSeule: true },
    { nom: 'coefParking', libelle: 'Coefficient parking sous-sol', type: 'ratio' },
    { nom: 'superficieParking', libelle: 'Superficie parking sous-sol', type: 'surface' },
    { nom: 'arreteAlignement', libelle: "Arrêté d'alignement", type: 'entier' },
    { nom: 'hauteurMax', libelle: 'Hauteur maximale', type: 'entier' },
  ],
};

/** Terrain brut : le détail par zone est dans la grille des zones. */
export const SECTION_BRUT: SectionSaisie = {
  titre: 'Terrain brut',
  champs: [
    { nom: 'identificationZone', libelle: 'Identification de la zone', type: 'texte' },
    { nom: 'conditionsRaccordement', libelle: 'Conditions de raccordement', type: 'texteLong' },
    { nom: 'assietteFonciere', libelle: 'Assiette foncière', type: 'texte' },
    { nom: 'leveeTopographique', libelle: 'Levée topographique', type: 'booleen' },
  ],
};

export const SECTION_PRIX: SectionSaisie = {
  titre: 'Prix',
  champs: [
    { nom: 'prixM2', libelle: 'Prix du m² du propriétaire', type: 'montant' },
    { nom: 'prix', libelle: 'Prix total du propriétaire', type: 'montant' },
    { nom: 'prixPropose', libelle: 'Prix proposé', type: 'montant' },
  ],
};

export const SECTION_ENREGISTREMENT: SectionSaisie = {
  titre: 'Enregistrement',
  champs: [
    { nom: 'dateEnregistrement', libelle: "Date d'enregistrement", type: 'date' },
    { nom: 'numeroEnregistrement', libelle: "Numéro d'enregistrement", type: 'texte' },
    { nom: 'lieuEnregistrement', libelle: "Lieu d'enregistrement", type: 'texte' },
    { nom: 'cpfImmatriculation', libelle: 'C.P.F. immatriculation', type: 'texte' },
    { nom: 'dateImmatriculation', libelle: "Date d'immatriculation", type: 'date' },
  ],
};

export const SECTION_ANOMALIES: SectionSaisie = {
  titre: 'Anomalies',
  champs: [{ nom: 'anomalies', libelle: 'Anomalies', type: 'texteLong' }],
};

export const CHAMPS_PROSPECTION = champsDe([
  SECTION_GENERAL, SECTION_SUPERFICIES, SECTION_BRUT, SECTION_PRIX, SECTION_ENREGISTREMENT, SECTION_ANOMALIES,
]);
const CHAMPS = CHAMPS_PROSPECTION;

/** OMRAN : une prospection naît Aménagée, d'une superficie de 1. */
export function brouillonProspection(p?: ProspectionTerrainDetailDto): Brouillon {
  return brouillonDepuis(CHAMPS, p ? aplatir(p) : { estAmenage: true, superficie: 1 });
}

/** Corps d'écriture : avec `initial`, les seuls champs changés ; les dates partent en `YYYY-MM-DD`. */
export function corpsProspection(brouillon: Brouillon, initial?: Brouillon): ProspectionTerrainEcritureDto {
  const corps = corpsDepuis(CHAMPS, brouillon, initial);
  for (const nom of DATES) {
    const valeur = corps[nom];
    if (typeof valeur === 'string') corps[nom] = valeur.slice(0, 10);
  }
  return corps;
}

/** Choix du formulaire ; les villes sont celles du pays choisi. */
export function useListesProspection(paysId: string): Record<string, Choix> {
  const pays = usePays();
  const types = useTypesTerrain();
  const niveaux = useNiveauxTerrain();
  const orientations = useOrientations();
  const categories = useApi(() => getCategoriesBien(undefined, 'PROS TER'), [], 'categories-prospection-terrain');
  const vocations = useApi(() => listLignesReferentiel('vocations-terrain'), []);
  const tiers = useTiersParType('FOU', true);
  const villes = useApi(
    () => (paysId ? getVillesReferentiel({ paysId }, { page: 0, size: 1000 }) : Promise.resolve(null)),
    [paysId],
  );
  return {
    categories: referentielItems(categories.data ?? []),
    types: referentielItems(types.data),
    niveaux: referentielItems(niveaux.data),
    vocations: referentielItems(choixDepuisLignes(vocations.data ?? undefined)),
    pays: referentielItems(pays.data),
    villes: referentielItems(villes.data?.content ?? []),
    courtiers: tiers.items,
    notaires: tiers.items,
    orientations: referentielItems(orientations.data),
  };
}

function valeursApercu(brouillon: Brouillon, champModifie: string): ApercuCalculDto {
  const corps: ApercuCalculDto = { champModifie };
  for (const nom of SAISIES_APERCU) {
    const texte = String(brouillon[nom] ?? '').trim();
    if (texte !== '' && Number.isFinite(Number(texte))) corps[nom] = Number(texte);
  }
  return corps;
}

function brouillonDepuisApercu(reponse: SurfacesTerrain, sauf: string): Brouillon {
  const valeurs: Brouillon = {};
  for (const nom of [...SAISIES_APERCU, ...CALCULES]) {
    const v = reponse[nom];
    if (nom !== sauf && v !== null && v !== undefined) valeurs[nom] = String(v);
  }
  return valeurs;
}

/**
 * Aperçu de calcul : chaque saisie du bloc surfaces / prix part au serveur (debounce) avec `champModifie`, et la
 * réponse remplit l'autre côté de la paire et les valeurs calculées. Une réponse périmée est ignorée.
 */
export function useApercuSurfaces(brouillon: Brouillon, setBrouillon: Dispatch<SetStateAction<Brouillon>>) {
  const [saisie, setSaisie] = useState<ApercuCalculDto | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const courante = useRef(saisie);
  const differee = useDebouncedValue(saisie);

  useEffect(() => {
    if (!differee) return;
    let annule = false;
    apercuCalculProspectionTerrain(differee)
      .then((reponse) => {
        if (annule || courante.current !== differee) return;
        setErreur(null);
        setBrouillon((b) => ({ ...b, ...brouillonDepuisApercu(reponse, differee.champModifie ?? '') }));
      })
      .catch((err: unknown) => {
        if (!annule) setErreur(errorMessage(err));
      });
    return () => {
      annule = true;
    };
  }, [differee, setBrouillon]);

  function modifier(nom: string, valeur: string) {
    const suivant = { ...brouillon, [nom]: valeur };
    setBrouillon(suivant);
    const demande = valeursApercu(suivant, nom);
    courante.current = demande;
    setSaisie(demande);
  }

  return { modifier, erreur };
}

/** Teinte du statut selon le type de statut (Nouveau, Terminé avec succès / échec, Annulation). */
export function toneStatut(type?: string | null): BadgeTone {
  const t = sansAccents(type ?? '');
  if (t.includes('succes')) return 'success';
  if (t.includes('echec')) return 'amber';
  if (t.includes('annul')) return 'warning';
  if (t.includes('nouveau')) return 'info';
  return 'neutral';
}

/** `ColorName` ARGB hexadécimal (`ffff8000`) → couleur CSS. */
export function couleurStatut(argb?: string | null): string | undefined {
  return argb && /^[0-9a-f]{8}$/i.test(argb) ? `#${argb.slice(2)}` : undefined;
}
