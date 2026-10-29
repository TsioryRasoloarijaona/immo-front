import {
  Activity, BarChart3, BookUser, Bot, Briefcase, Building2, CalendarDays, Cog, Contact, FileCode2, FileText, Flag, Gauge, Globe, Hash, Heart, History, Home,
  IdCard, Image as ImageIcon, KeyRound, Landmark, Layers, Link2, ListChecks, ListOrdered, ListTodo, Lock, Mail, MapPin, Monitor, Paperclip, Percent,
  Scale, ScrollText, Settings2, ShieldCheck, Sliders, Smile, Tag, Truck, UserCheck, Users, Wallet, Workflow,
} from 'lucide-react';
import type { ArbreModule, EntreeArbre } from '../arbre';

const m = (cle: string, libelle: string, Icone: EntreeArbre['Icone']): EntreeArbre => ({ to: `/administration/${cle}`, libelle, Icone });

export const arbreAdministration: ArbreModule = () => [
  {
    cle: 'taches',
    titre: 'Tâches',
    entrees: [m('taches', 'Tâches', ListTodo), m('calendrier', 'Calendrier', CalendarDays)],
  },
  {
    cle: 'droits',
    titre: 'Droits',
    entrees: [
      m('roles', 'Rôles', ShieldCheck),
      { to: '/utilisateurs', libelle: 'Utilisateurs', Icone: Users, exact: true },
      m('historique', 'Historique', History),
      m('email-historique', 'EMail Historique', Mail),
      m('sessions', 'Sessions', Monitor),
      m('fiches-verrouillees', 'Fiches verrouillées', Lock),
      m('actions', 'Actions', Activity),
    ],
  },
  {
    cle: 'tiers',
    titre: 'Tiers',
    entrees: [m('fournisseurs', 'Fournisseurs', Truck), m('banques', 'Banques', Landmark), m('organismes', 'Organismes', Building2), m('personnels', 'Personnels', UserCheck), m('contacts', 'Contacts', BookUser)],
  },
  {
    cle: 'tableaux-de-bord',
    titre: 'Tableaux de bords',
    entrees: [m('fichiers-attaches', 'Fichiers attachés', Paperclip), m('rapports-tdb', 'Rapports', BarChart3)],
  },
  {
    cle: 'configuration',
    titre: 'Configuration',
    entrees: [
      m('entites-fonctionnelles', 'Entités fonctionnelles', Workflow),
      m('parametres-systeme', 'Paramètres système', Cog),
      m('rapports', 'Rapports', FileText),
      m('sequences', 'Séquences', ListOrdered),
      m('types-attachements', 'Types des attachements', Link2),
      { to: '/modeles-documents', libelle: 'Mail models', Icone: FileCode2 },
      m('images', 'Images', ImageIcon),
      m('pays', 'Pays', Globe),
      m('villes', 'Villes', MapPin),
      m('statuts-listes', 'Statuts des listes à faire', ListChecks),
      m('champs-specifiques', 'Champs spécifiques', Sliders),
    ],
  },
  {
    cle: 'configuration-tiers',
    titre: 'Configuration · Tiers',
    entrees: [
      m('sexes', 'Sexes', Smile),
      m('titres', 'Titres', Tag),
      m('formes-sociales', 'Formes sociales', Scale),
      m('types-tiers', 'Types', Layers),
      m('natures', 'Natures', Hash),
      m('assujettissements', 'Assujettissements', Percent),
      m('situations-familiales', 'Situations familiales', Heart),
      m('types-residence', 'Types de résidence', Home),
      m('regimes-matrimoniaux', 'Régimes matrimoniaux', ScrollText),
      m('types-piece-identite', "Types de pièce d'identité", IdCard),
      m('nationalites', 'Nationalités', Flag),
      m('professions', 'Professions', Briefcase),
      m('salaires', 'Salaires', Wallet),
      m('types-relation', 'Types de relation', Contact),
    ],
  },
  {
    cle: 'configuration-taches',
    titre: 'Configuration · Tâches',
    entrees: [m('type-tache', 'Type', Settings2), m('priorite-tache', 'Priorité', Gauge)],
  },
  {
    cle: 'arpent',
    titre: 'Propre à Arpent',
    entrees: [
      { to: '/utilisateurs/reinitialiser-mot-de-passe', libelle: 'Réinitialiser un mot de passe', Icone: KeyRound },
      { to: '/cles-api', libelle: "Clés d'API", Icone: Bot },
    ],
  },
];
