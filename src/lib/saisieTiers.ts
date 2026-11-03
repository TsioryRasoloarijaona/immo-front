import type { ListesChoix } from '../components/patrimoine/SectionsSaisie';
import { getBanques, getNationalites, getPays, getProfessions, getSexes, getSituationsFamiliales, getTitres, getTypesPieceIdentite } from './api';
import { listNaturesTiers, listReferentielTiers } from './apiAdministration';
import { listDevises } from './apiEntites';
import type { ConfigTiers } from './colonnesTiers';
import { brouillonDepuis, champsDe, corpsDepuis, type Brouillon, type ChampDef, type Choix, type SectionSaisie } from './saisiePatrimoine';
import { useApi } from './useApi';
import type { EcritureTiersRequest, FicheTiersDto } from '../types/administration';

export type OngletSaisie = 'general' | 'autres' | 'notes';

interface SectionTiers extends SectionSaisie {
  onglet: OngletSaisie;
  /** Section réservée aux fournisseurs. */
  fournisseur?: boolean;
  /** Section réservée aux personnes physiques. */
  physique?: boolean;
}

const texte = (nom: string, libelle: string): ChampDef => ({ nom, libelle, type: 'texte' });
const liste = (nom: string, libelle: string, cle: string): ChampDef => ({ nom, libelle, type: 'liste', liste: cle });

const SECTIONS: SectionTiers[] = [
  {
    onglet: 'general',
    titre: 'Identité',
    champs: [
      { nom: 'personneMorale', libelle: 'Personne morale', type: 'booleen' },
      texte('raisonSociale', 'Raison sociale'),
      texte('prenom', 'Prénom'),
      texte('nom', 'Nom'),
      liste('titreId', 'Titre', 'titres'),
      liste('sexeId', 'Sexe', 'sexes'),
      liste('natureId', 'Nature', 'natures'),
      liste('formeSocialeId', 'Forme sociale', 'formesSociales'),
      liste('deviseId', 'Devise', 'devises'),
    ],
  },
  {
    onglet: 'general',
    titre: 'Adresse',
    champs: [
      liste('paysResidenceId', 'Pays de résidence', 'pays'),
      liste('paysId', 'Pays', 'pays'),
      texte('ville', 'Ville'),
      texte('codePostal', 'Code postal'),
      texte('adresse', 'Adresse'),
      texte('adresse2', 'Adresse 2'),
      texte('adresse3', 'Adresse 3'),
    ],
  },
  {
    onglet: 'general',
    titre: 'Coordonnées',
    champs: [
      texte('mobileIndicatif', 'Indicatif mobile'),
      texte('mobile', 'Mobile'),
      texte('telephoneIndicatif', 'Indicatif téléphone'),
      texte('telephone', 'Téléphone'),
      texte('faxIndicatif', 'Indicatif fax'),
      texte('fax', 'Fax'),
      texte('email', 'E-mail'),
      texte('siteWeb', 'Site web'),
    ],
  },
  {
    onglet: 'autres',
    titre: 'Téléphones complémentaires',
    champs: [
      texte('telephone1Indicatif', 'Indicatif téléphone 1'),
      texte('telephone1', 'Téléphone 1'),
      texte('telephone2Indicatif', 'Indicatif téléphone 2'),
      texte('telephone2', 'Téléphone 2'),
    ],
  },
  {
    onglet: 'autres',
    titre: 'Identifiants',
    fournisseur: true,
    champs: [texte('ice', 'ICE'), texte('matriculeFiscal', 'Matricule fiscal'), texte('registreCommerce', 'Registre de commerce'), texte('douane', 'Douane')],
  },
  {
    onglet: 'autres',
    titre: 'Comptabilité',
    fournisseur: true,
    champs: [
      texte('codeComptable', 'Code comptable'),
      texte('codeComptableCollectif', 'Code comptable collectif'),
      liste('assujettissementId', 'Assujettissement', 'assujettissements'),
      { nom: 'tauxRetenue', libelle: 'Taux de retenue', type: 'ratio' },
      { nom: 'tauxTva', libelle: 'Taux de TVA', type: 'ratio' },
      { nom: 'delaiPaiement', libelle: 'Délai de paiement (jours)', type: 'entier' },
      { nom: 'estPrestataire', libelle: 'Est un prestataire', type: 'booleen' },
    ],
  },
  {
    onglet: 'autres',
    titre: 'Banque',
    fournisseur: true,
    champs: [liste('banqueId', 'Banque', 'banques'), texte('agence', 'Agence'), texte('rib', 'RIB'), texte('iban', 'IBAN')],
  },
  {
    onglet: 'autres',
    titre: 'État civil',
    physique: true,
    champs: [
      { nom: 'dateNaissance', libelle: 'Date de naissance', type: 'date' },
      texte('lieuNaissance', 'Lieu de naissance'),
      liste('situationFamilialeId', 'Situation familiale', 'situations'),
      liste('nationaliteId', 'Nationalité', 'nationalites'),
      liste('professionId', 'Profession', 'professions'),
      liste('typePieceId', "Type de pièce d'identité", 'typesPiece'),
      texte('numeroPiece', 'Numéro de pièce'),
    ],
  },
  {
    onglet: 'notes',
    titre: 'Notes',
    champs: [{ nom: 'notes', libelle: 'Notes', type: 'texteLong' }],
  },
  {
    onglet: 'notes',
    titre: 'Note',
    fournisseur: true,
    champs: [liste('noteId', 'Note', 'notes')],
  },
];

const PHYSIQUE = ['prenom', 'nom', 'titreId', 'sexeId'];

/** Champs requis par les règles 6 et 9 : une seule liste pour l'étoile du formulaire et la vérification. */
function obligatoires(morale: boolean): Set<string> {
  return new Set(['formeSocialeId', 'deviseId', 'paysResidenceId', ...(morale ? ['raisonSociale'] : PHYSIQUE)]);
}

function visible(section: SectionTiers, cfg: ConfigTiers, morale: boolean): boolean {
  return (!section.fournisseur || cfg.champsFournisseur) && (!section.physique || !morale);
}

/** Tous les champs de la famille, quelle que soit la bascule : le brouillon les porte tous. */
export function champsTiers(cfg: ConfigTiers): ChampDef[] {
  return champsDe(SECTIONS.filter((s) => visible(s, cfg, false)));
}

/** Sections d'un onglet pour la bascule courante : morale = raison sociale, physique = prénom, nom, titre, sexe. */
export function sectionsTiers(cfg: ConfigTiers, onglet: OngletSaisie, morale: boolean): SectionSaisie[] {
  const requis = obligatoires(morale);
  const masques = morale ? PHYSIQUE : ['raisonSociale'];
  return SECTIONS.filter((s) => s.onglet === onglet && visible(s, cfg, morale)).map((s) => ({
    titre: s.titre,
    champs: s.champs.filter((c) => !masques.includes(c.nom)).map((c) => (requis.has(c.nom) ? { ...c, obligatoire: true } : c)),
  }));
}

export function brouillonTiers(cfg: ConfigTiers, fiche?: FicheTiersDto): Brouillon {
  const brouillon = brouillonDepuis(champsTiers(cfg), fiche);
  return fiche ? brouillon : { ...brouillon, personneMorale: cfg.moraleParDefaut };
}

/** Lève la première règle 6, 8 ou 9 non respectée ; le message commence par le libellé du champ fautif. */
export function verifierTiers(cfg: ConfigTiers, brouillon: Brouillon): void {
  const requis = obligatoires(brouillon.personneMorale === true);
  const manquant = champsTiers(cfg).find((c) => requis.has(c.nom) && String(brouillon[c.nom]).trim() === '');
  if (manquant) throw new Error(`${manquant.libelle} : champ requis.`);
  if (String(brouillon.mobile).trim() === '' && String(brouillon.email).trim() === '') {
    throw new Error('Mobile ou e-mail requis.');
  }
}

/** Mobile et e-mail portent ensemble le message de la règle 8. */
export function champsFautifs(champ: string | null): string[] {
  if (champ === 'mobile' || champ === 'email') return ['mobile', 'email'];
  return champ ? [champ] : [];
}

export function corpsTiers(cfg: ConfigTiers, brouillon: Brouillon): EcritureTiersRequest {
  const corps = corpsDepuis(champsTiers(cfg), brouillon);
  if (typeof corps.dateNaissance === 'string') corps.dateNaissance = corps.dateNaissance.slice(0, 10);
  return corps as unknown as EcritureTiersRequest;
}

const versChoix = (items: { id: string; description?: string | null; code?: string | null }[]): Choix =>
  items.map((i) => ({ value: i.id, label: i.description || i.code || i.id }));

/** Listes déroulantes de la fiche, chargées ensemble. */
export function useListesTiers(cfg: ConfigTiers) {
  const { data, error } = useApi(async (): Promise<ListesChoix> => {
    const [titres, sexes, natures, formesSociales, devises, assujettissements, pays, banques, nationalites, situations, typesPiece, professions, notes] =
      await Promise.all([
        getTitres(), getSexes(), listNaturesTiers(cfg.famille), listReferentielTiers('formes-sociales'), listDevises(),
        listReferentielTiers('assujettissements'), getPays(), getBanques(), getNationalites(), getSituationsFamiliales(),
        getTypesPieceIdentite(), getProfessions(), listReferentielTiers('notes'),
      ]);
    return {
      titres: versChoix(titres), sexes: versChoix(sexes),
      natures: versChoix(natures.map((n) => ({ id: n.id, description: n.libelle, code: n.code }))),
      formesSociales: versChoix(formesSociales), devises: versChoix(devises), assujettissements: versChoix(assujettissements),
      pays: versChoix(pays), banques: versChoix(banques), nationalites: versChoix(nationalites), situations: versChoix(situations),
      typesPiece: versChoix(typesPiece), professions: versChoix(professions), notes: versChoix(notes),
    };
  }, [cfg.famille]);
  return { listes: data ?? {}, erreur: error };
}
