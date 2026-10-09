import type { BadgeTone } from '../../../types';
import type { Meta, SocieteSaisie, StatutOrdre, TypeBeneficiaire, TypeVirement } from './types';

/** Seul libellé tenu en local : tout le reste des listes métier vient de `GET /meta`. */
export const STATUT_ORDRE: Record<StatutOrdre, { libelle: string; ton: BadgeTone }> = {
  emis: { libelle: 'Émis', ton: 'progress' },
  paye: { libelle: 'Payé', ton: 'success' },
  annule: { libelle: 'Annulé', ton: 'warning' },
};

export function statutItems(meta: Meta) {
  return meta.statuts.map((s) => ({ value: s, label: STATUT_ORDRE[s]?.libelle ?? s }));
}

/** La clé vient de `/meta`, la formulation du guide du service. */
export function libelleChoixType(meta: Meta, t: string): string {
  return t === 'fournisseur' ? "Règlement d'un fournisseur" : (meta.types_virement[t]?.libelle ?? t);
}

export function natureDuType(type: TypeVirement): TypeBeneficiaire {
  return type === 'salaire' ? 'salarie' : 'fournisseur';
}

export function pluriel(n: number, singulier: string, plurielForme = `${singulier}s`): string {
  return `${n} ${n > 1 ? plurielForme : singulier}`;
}

export function formatTaille(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${(octets / 1024 / 1024).toFixed(1).replace('.', ',')} Mo`;
}

export function normaliser(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
}

export const MODELE_GHRIZA: Omit<SocieteSaisie, 'nom' | 'banque' | 'ville' | 'compte' | 'signataire' | 'par_defaut'> = {
  police: 'helvetica',
  entete_mode: 'logo',
  entete_titre: null,
  entete_sous_titre: null,
  entete_droite: null,
  entete_taille: 22,
  entete_filet: 0,
  objet: 'Ordre de virements bancaires Express',
  phrase_corps:
    'Par la présente, Notre société « {societe} », Souhaiterait effectuer un virement de notre compte bancaire N° {compte} :',
  phrase_ligne: '{montant} DH à la Société {beneficiaire}',
  phrase_corps_salaire:
    'Par la présente, Notre société « {societe} », Souhaiterait effectuer un virement de salaire de notre compte bancaire N° {compte} :',
  phrase_ligne_salaire: '{montant} DH à {beneficiaire}',
  signataire_gauche: null,
  pied_page: null,
  avec_cloture: 1,
  salutation_grasse: 0,
  societe_grasse: 0,
  montants_gras: 0,
  beneficiaire_gras: 1,
};

/** Une action absente d'ici s'affiche par son code brut. */
export const LIBELLES_ACTION: Record<string, string> = {
  connexion: 'Connexion',
  connexion_refusee: 'Connexion refusée',
  acces_refuse: 'Accès refusé',
  ordre_cree: 'Ordre créé',
  ordre_modifie: 'Ordre modifié',
  ordre_supprime: 'Ordre SUPPRIMÉ',
  piece_ajoutee: 'Pièce ajoutée',
  piece_supprimee: 'Pièce supprimée',
  beneficiaire_cree: 'Bénéficiaire créé',
  beneficiaire_modifie: 'Bénéficiaire modifié',
  beneficiaire_rib_modifie: 'RIB modifié',
  beneficiaire_supprime: 'Bénéficiaire supprimé',
  import_beneficiaires: 'Import de bénéficiaires',
  pdf_regenere: 'PDF regénéré',
};
