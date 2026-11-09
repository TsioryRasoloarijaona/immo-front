import { construire, nombre, texte } from '../../../components/maquette/colonnes';
import { configListe } from '../../../components/maquette/configListe';
import { CONFIG_FOURNISSEURS, FOURNISSEURS, PROJETS, SOCIETE } from '../../../components/maquette/communes';
import { configReferentiel } from '../../../components/maquette/referentiel';
import type { ConfigEcran, DefReferentiel } from '../../../components/maquette/types';
import { LOTS } from './ecransLots';

const ref = (def: DefReferentiel): ConfigEcran => configReferentiel(def);

// Statuts, types et natures : valeurs réelles d'OMRAN (PLAN-projet.md §2) ; ordre, couleurs et noms de réserve inventés.
export const REFERENTIELS_PROJET: Record<string, ConfigEcran> = {
  nivellements: ref({
    titre: 'Nivellements', unite: 'nivellement', nature: 'Nivellement',
    lignes: [['SS1', 'Sous-sol 1'], ['RDC', 'Rez-de-chaussée'], ['R+1', 'Premier étage'], ['R+2', 'Deuxième étage'], ['R+3', 'Troisième étage'], ['TER', 'Terrasse']],
  }),
  'statuts-lots': ref({
    titre: 'Statuts des lots', unite: 'statut', nature: 'Statut de lot', extras: [{ nom: 'ordre', libelle: 'Ordre' }],
    lignes: [['EST', 'ESTIMATION', '1'], ['AO', "APPEL D'OFFRE", '2'], ['DEP', 'DEPOUILLEMENT', '3'], ['ADJ', 'ADJUDICATION', '4'], ['CMD', 'Commandes', '5'], ['EXE', 'EXCECUTION', '6'], ['ENC', 'En cours', '7'], ['CLO', 'Commandes clôturées', '8']],
  }),
  'types-lots': ref({ titre: 'Types de lot', unite: 'type de lot', nature: 'Type de lot', lignes: [['TRV', 'TRAVAUX'], ['DIV', 'DIVERS TRAVAUX'], ['AUT', 'AUTRE']] }),
  'statuts-reserves': ref({
    titre: 'Statuts des réserves', unite: 'statut de réserve', nature: 'Statut de réserve', extras: [{ nom: 'couleur', libelle: 'Couleur' }],
    lignes: [['OUV', 'OUVERTE', 'Rouge'], ['ENC', 'EN COURS DE TRAITEMENT', 'Bleu'], ['LEV', 'LEVÉE', 'Vert'], ['REP', 'REPORTÉE', 'Orange'], ['ANN', 'ANNULÉE', 'Gris']],
  }),
  'types-reception': ref({ titre: 'Types de réception', unite: 'type de réception', nature: 'Type de réception', lignes: [['PRO', 'Réception provisoire'], ['DEF', 'Réception définitive']] }),
  'natures-reception': ref({ titre: 'Natures de réception', unite: 'nature de réception', nature: 'Nature de réception', lignes: [['TOT', 'Totale'], ['PAR', 'Partielle']] }),
  'types-reunion': ref({ titre: 'Types de réunion', unite: 'type de réunion', nature: 'Type de réunion', lignes: [['CHA', 'Réunion de chantier'], ['COO', 'Réunion de coordination']] }),
};

const STANDINGS = ['Haut standing', 'Haut standing', 'Moyen standing', 'Moyen standing', 'Très haut standing'];

export const LISTES_CONFIG_PROJET: Record<string, ConfigEcran> = {
  tranches: configListe({
    titre: 'Tranches', unite: 'tranche', nature: 'Tranche',
    colonnes: [texte('code', 'Code', 12), texte('libelle', 'Libellé', 14), texte('projet', 'Projet', 12), texte('standing', 'Standing', 14), nombre('lots', 'Lots', 6)],
    lignes: PROJETS.flatMap((p) => p.tranches.map((t) => ({ code: `${p.code}-T${t.slice(-1)}`, libelle: t, projet: p.code, lots: LOTS.filter((l) => l.projet === p.code && l.tranche === t).length })))
      .map((t, i) => ({ id: String(i + 1), ...t, standing: STANDINGS[i] })),
    filtres: ['projet', 'standing'],
  }),
  projets: configListe({
    titre: 'Projets', unite: 'projet', nature: 'Projet',
    colonnes: [texte('code', 'Code', 10), texte('libelle', 'Libellé', 20), texte('societe', 'Société', 18), texte('ville', 'Ville', 12), nombre('lots', 'Lots', 6)],
    lignes: PROJETS.map((p, i) => ({ id: String(i + 1), code: p.code, libelle: p.libelle, societe: SOCIETE, ville: ['Casablanca', 'Marrakech', 'Rabat'][i], lots: LOTS.filter((l) => l.projet === p.code).length })),
    filtres: ['ville'],
  }),
  transitions: configListe({
    titre: 'Transitions', unite: 'transition', nature: 'Transition de lot',
    colonnes: [texte('origine', 'Statut d’origine', 16), texte('cible', 'Statut cible', 16), texte('role', 'Rôle autorisé', 18)],
    lignes: construire(
      ['origine', 'cible', 'role'],
      [
        ['ESTIMATION', "APPEL D'OFFRE", 'Chef de projet'], ["APPEL D'OFFRE", 'DEPOUILLEMENT', 'Chef de projet'], ['DEPOUILLEMENT', 'ADJUDICATION', 'Directeur technique'],
        ['ADJUDICATION', 'Commandes', 'Directeur technique'], ['Commandes', 'EXCECUTION', 'Conducteur de travaux'], ['EXCECUTION', 'Commandes clôturées', 'Directeur technique'],
      ],
    ),
    filtres: ['origine', 'role'],
  }),
  'plages-couleurs': configListe({
    titre: 'Plages des couleurs', unite: 'plage', nature: 'Plage de couleur',
    colonnes: [texte('couleur', 'Couleur', 12), nombre('de', 'Retard de (jours)'), nombre('a', 'Retard à (jours)'), texte('sens', 'Signification', 24)],
    lignes: construire(['couleur', 'de', 'a', 'sens'], [['Vert', 0, 0, 'Dans les délais'], ['Orange', 1, 15, 'Retard modéré'], ['Rouge', 16, 999, 'Retard à traiter en réunion']]),
  }),
  'modeles-simulation': configListe({
    titre: 'Modèles de simulation', unite: 'modèle', nature: 'Modèle de simulation',
    colonnes: [texte('code', 'Code', 10), texte('libelle', 'Libellé', 24), nombre('echeances', 'Échéances', 8), texte('profil', 'Profil de paiement', 22)],
    lignes: construire(['code', 'libelle', 'echeances', 'profil'], [['MOD-4T', 'Quatre paiements égaux', 4, 'Linéaire'], ['MOD-CB', 'Courbe en cloche sur 6 mois', 6, 'Concentré au milieu du chantier']]),
  }),
  fournisseurs: CONFIG_FOURNISSEURS,
  contacts: configListe({
    titre: 'Contacts', unite: 'contact', nature: 'Contact', recherche: 'Nom, fonction, société…',
    colonnes: [texte('nom', 'Nom', 16), texte('fonction', 'Fonction', 16), texte('societe', 'Société', 20), texte('telephone', 'Téléphone', 12), texte('email', 'E-mail', 22)],
    lignes: construire(
      ['nom', 'fonction', 'societe', 'telephone', 'email'],
      [
        ['Hicham Tazi', 'Directeur de travaux', FOURNISSEURS[0], '06 61 20 33 41', 'h.tazi@sogebat.example'],
        ['Nadia Bennani', 'Responsable commerciale', FOURNISSEURS[2], '06 62 54 18 07', 'n.bennani@atlas-etanch.example'],
        ['Mehdi Chraibi', 'Chef de chantier', FOURNISSEURS[4], '06 70 11 92 65', 'm.chraibi@electro-chantier.example'],
        ['Soumia Lahlou', 'Gérante', FOURNISSEURS[5], '06 64 08 77 23', 's.lahlou@alu-design.example'],
      ],
    ),
    filtres: ['societe'],
  }),
};
