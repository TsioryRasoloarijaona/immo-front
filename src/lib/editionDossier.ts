import { useState } from 'react';
import { listProspects } from './api';
import { getDroitsEdition, modifierDossier } from './apiEdition';
import { toApiDateTime } from './format';
import { messageProspectionsArchivees } from './prospectionsArchivees';
import { useToast } from './toastContext';
import { errorMessage, refetchAllApis, useApi } from './useApi';
import type { DossierFicheDto, ProspectListItemDto, UUID } from '../types';
import type { ChampVerrouille, GroupeEdition, ModifierDossierRequest } from '../types/edition';

export type CleEdition = Exclude<keyof ModifierDossierRequest, 'champsAVider'>;

/** Valeurs d'un formulaire d'onglet : dates `YYYY-MM-DD`, textes, ids ('' = vide), cases. */
export type ValeursEdition = Partial<Record<CleEdition, string | boolean>>;

/** Nom affiché d'un tiers de `GET /api/prospects`. */
export function nomTiers(t: ProspectListItemDto): string {
  const personne = [t.prenom, t.nom].filter(Boolean).join(' ');
  return personne || t.raisonSociale || t.code || t.id;
}

/**
 * Tiers d'un type (`EMP` gestionnaires, `FOU` notaire — les sélecteurs d'OMRAN), chargés
 * seulement quand le formulaire est ouvert. Quelques centaines de lignes au plus.
 */
export function useTiersParType(type: 'EMP' | 'FOU', actif: boolean): { items: { label: string; value: string }[]; chargement: boolean } {
  const page = useApi(
    () => (actif ? listProspects({ type: [type] }, { page: 0, size: 1000 }) : Promise.resolve(null)),
    [type, actif],
  );
  const items = (page.data?.content ?? []).map((t) => ({ label: nomTiers(t), value: t.id }));
  return { items, chargement: actif && page.loading };
}

/** Date du fil (`YYYY-MM-DDTHH:mm:ss`) → valeur d'un `<input type="date">`. */
export function jourSaisi(valeur: string | null | undefined): string {
  return valeur ? valeur.slice(0, 10) : '';
}

/** Forme comparable d'une valeur saisie : une case vaut 'true' / 'false', un texte est réduit de ses blancs. */
function comparable(v: string | boolean | undefined): string {
  if (typeof v === 'boolean') return String(v);
  return (v ?? '').trim();
}

/**
 * Corps du PATCH : les seuls champs changés ; un champ vidé part dans `champsAVider` (le serveur ignore
 * un champ absent ou nul). `dates` : clés à convertir au format date-heure du fil.
 */
export function corpsModification(
  initial: ValeursEdition,
  saisi: ValeursEdition,
  dates: ReadonlySet<CleEdition>,
): ModifierDossierRequest {
  const corps: Record<string, unknown> = {};
  const aVider: CleEdition[] = [];
  for (const cle of Object.keys(saisi) as CleEdition[]) {
    const valeur = saisi[cle];
    const apres = comparable(valeur);
    if (comparable(initial[cle]) === apres) continue;
    if (apres === '') aVider.push(cle);
    else if (typeof valeur === 'boolean') corps[cle] = valeur;
    else corps[cle] = dates.has(cle) ? toApiDateTime(apres) : apres;
  }
  if (aVider.length > 0) corps.champsAVider = aVider;
  return corps;
}

const VERROUILLABLES: ReadonlySet<string> = new Set<ChampVerrouille>(['concretisation', 'impressionContrat', 'remise']);

/** Faux si le champ est dans les `champsVerrouilles` de l'appelant : il reste en lecture en mode édition. */
export function champEditable(edition: EditionDossier, cle: string): boolean {
  return !(VERROUILLABLES.has(cle) && edition.verrouille(cle as ChampVerrouille));
}

function corpsVide(corps: ModifierDossierRequest): boolean {
  return Object.keys(corps).length === 0;
}

export interface EditionDossier {
  peut: (groupe: GroupeEdition) => boolean;
  /** Champ en lecture seule pour l'appelant même si son groupe est modifiable (`champsVerrouilles`). */
  verrouille: (champ: ChampVerrouille) => boolean;
  ouvert: boolean;
  ouvrir: () => void;
  annuler: () => void;
  enregistrer: (corps: ModifierDossierRequest) => Promise<boolean>;
  busy: boolean;
  erreur: string | null;
  ecart: number | null;
}

/**
 * Droits d'édition du dossier (une lecture partagée par tous les onglets) et cycle Modifier → Enregistrer.
 * Après un enregistrement, toutes les lectures montées sont relancées (en-tête, montants, historique…).
 */
export function useEditionDossier(dossierId: UUID | undefined, versionFiche: unknown): EditionDossier {
  const droits = useApi(
    () => (dossierId ? getDroitsEdition(dossierId) : Promise.resolve(null)),
    [dossierId],
    'dossier-edition',
  );
  const showToast = useToast();
  const [ouvert, setOuvert] = useState(false);
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  // L'écart du schéma ne vaut que pour la fiche relue juste après le PATCH : un échéancier ou des sous-articles
  // modifiés ensuite le rendraient faux. La lecture suivante de la fiche l'efface.
  const [ecart, setEcart] = useState<{ valeur: number; attendRelecture: boolean } | null>(null);
  const [versionVue, setVersionVue] = useState(versionFiche);
  if (versionVue !== versionFiche) {
    setVersionVue(versionFiche);
    if (ecart?.attendRelecture) setEcart({ valeur: ecart.valeur, attendRelecture: false });
    else if (ecart) setEcart(null);
  }

  async function enregistrer(corps: ModifierDossierRequest): Promise<boolean> {
    if (!dossierId) return false;
    if (corpsVide(corps)) {
      setOuvert(false);
      return true;
    }
    setBusy(true);
    setErreur(null);
    try {
      const resultat = await modifierDossier(dossierId, corps);
      setEcart(resultat.ecartSchema == null ? null : { valeur: resultat.ecartSchema, attendRelecture: true });
      const archivees = messageProspectionsArchivees(resultat.prospectionsArchivees);
      if (archivees) showToast(archivees);
      setOuvert(false);
      refetchAllApis();
      return true;
    } catch (err) {
      setErreur(errorMessage(err));
      return false;
    } finally {
      setBusy(false);
    }
  }

  return {
    peut: (groupe) => droits.data?.groupes.includes(groupe) ?? false,
    // Tant que les droits ne sont pas lus, tout est verrouillé : jamais d'envoi promis à un 403.
    verrouille: (champ) => droits.data?.champsVerrouilles.includes(champ) ?? true,
    ouvert,
    ouvrir: () => {
      setErreur(null);
      setOuvert(true);
    },
    annuler: () => {
      setErreur(null);
      setOuvert(false);
    },
    enregistrer,
    busy,
    erreur,
    ecart: ecart?.valeur ?? null,
  };
}

export interface FormulaireEdition {
  edition: EditionDossier;
  saisi: ValeursEdition;
  texte: (cle: CleEdition) => string;
  changer: (cle: CleEdition, valeur: string | boolean) => void;
  enregistrer: () => void;
}

/**
 * Formulaire d'un onglet : la saisie repart des valeurs de la fiche à chaque « Modifier », et seul l'écart
 * avec ces valeurs part au serveur. `dates` : clés converties en date-heure du fil.
 */
export function useFormulaireEdition(
  fiche: DossierFicheDto,
  initiales: () => ValeursEdition,
  dates: ReadonlySet<CleEdition>,
): FormulaireEdition {
  const edition = useEditionDossier(fiche.id, fiche);
  const [saisi, setSaisi] = useState<ValeursEdition>(initiales);
  return {
    edition: {
      ...edition,
      ouvrir: () => {
        setSaisi(initiales());
        edition.ouvrir();
      },
    },
    saisi,
    texte: (cle) => {
      const v = saisi[cle];
      return typeof v === 'string' ? v : '';
    },
    changer: (cle, valeur) => setSaisi((s) => ({ ...s, [cle]: valeur })),
    enregistrer: () => void edition.enregistrer(corpsModification(initiales(), saisi, dates)),
  };
}
