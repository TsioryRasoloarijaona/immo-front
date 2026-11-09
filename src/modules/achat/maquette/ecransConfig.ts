import { construire, nombre, texte } from '../../../components/maquette/colonnes';
import { configListe } from '../../../components/maquette/configListe';
import { configReferentiel } from '../../../components/maquette/referentiel';
import type { ConfigEcran } from '../../../components/maquette/types';
import { TRANSITIONS } from './donnees';

// Statuts et transitions : valeurs réelles d'OMRAN (PLAN-achat.md §2) ; groupements, nomenclature et types de crédit sont fictifs.
const DRAPEAUX = [{ nom: 'paiement', libelle: 'Autorise le paiement' }, { nom: 'compta', libelle: 'Validé en comptabilité' }];

export const CONFIG_ACHAT: Record<string, ConfigEcran> = {
  statuts: configReferentiel({
    titre: 'Statuts', unite: 'statut', nature: 'Statut de document', extras: DRAPEAUX,
    lignes: [
      ['ENC', 'EN COURS', 'Non', 'Non'], ['DDT', 'DDE VALIDATION DT', 'Non', 'Non'], ['VDT', 'VALIDÉ DT', 'Oui', 'Non'], ['RDT', 'REJET DT', 'Non', 'Non'],
      ['DDG', 'DDE VALIDATION DG', 'Non', 'Oui'], ['VDG', 'VALIDÉ DG', 'Oui', 'Non'], ['RDG', 'REJET DG', 'Non', 'Non'], ['VPP', 'VALIDE POUR PAIEMENT', 'Oui', 'Oui'],
      ['REG', 'REGLÉ', 'Non', 'Oui'], ['CLO', 'CLOTURÉ', 'Oui', 'Oui'], ['ANN', 'ANNULATION', 'Non', 'Non'],
    ],
  }),
  transitions: configListe({
    titre: 'Transitions', unite: 'transition', nature: 'Transition de statut',
    colonnes: [texte('origine', 'Statut d’origine', 20), texte('cible', 'Statut cible', 20), texte('role', 'Rôle autorisé', 20), nombre('usages', 'Utilisations', 8)],
    lignes: TRANSITIONS,
    filtres: ['origine', 'cible', 'role'],
  }),
  groupements: configListe({
    titre: 'Dossiers de groupement', unite: 'dossier de groupement', nature: 'Dossier de groupement',
    colonnes: [texte('code', 'Code', 10), texte('libelle', 'Libellé', 26), texte('projet', 'Projet', 10)],
    lignes: construire(['code', 'libelle', 'projet'], [['GRP-01', 'Gros œuvre Anfa', 'ANF-RES'], ['GRP-02', 'Second œuvre Palmeraie', 'PAL-VIL'], ['GRP-03', 'Frais généraux Tamesna', 'TAM-APP']]),
    filtres: ['projet'],
  }),
  familles: configReferentiel({ titre: 'Familles', unite: 'famille', nature: 'Famille d’articles', lignes: [['MAT', 'Matériaux'], ['LOC', 'Location de matériel'], ['SRV', 'Services']] }),
  'sous-familles': configReferentiel({
    titre: 'Sous-familles', unite: 'sous-famille', nature: 'Sous-famille d’articles', extras: [{ nom: 'famille', libelle: 'Famille' }],
    lignes: [['MAT-LIA', 'Liants et granulats', 'Matériaux'], ['MAT-ACI', 'Aciers', 'Matériaux'], ['LOC-ENG', 'Engins de chantier', 'Location de matériel']],
  }),
  articles: configReferentiel({
    titre: 'Articles', unite: 'article', nature: 'Article', extras: [{ nom: 'famille', libelle: 'Sous-famille' }, { nom: 'unite', libelle: 'Unité' }],
    lignes: [['CIM-45', 'Ciment CPJ 45', 'Liants et granulats', 'tonne'], ['ACI-HA12', 'Acier HA 12', 'Aciers', 'tonne'], ['PEL-01', 'Pelle hydraulique avec chauffeur', 'Engins de chantier', 'jour']],
  }),
  'types-credit': configReferentiel({ titre: 'Types de crédit', unite: 'type de crédit', nature: 'Type de crédit', lignes: [['INV', "Crédit d'investissement"], ['TRE', 'Crédit de trésorerie'], ['LEA', 'Crédit-bail']] }),
  'types-consultation': configReferentiel({ titre: 'Types de consultation', unite: 'type de consultation', nature: 'Type de consultation', lignes: [['AOO', "Appel d'offres ouvert"], ['CRE', 'Consultation restreinte']] }),
};
