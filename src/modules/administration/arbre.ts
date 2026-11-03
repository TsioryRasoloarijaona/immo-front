import { Bot, Building2, CalendarDays, Contact, FileCode2, Gauge, History, KeyRound, Landmark, ListChecks, LockOpen, Mail, MonitorSmartphone, Settings2, ShieldCheck, Truck, UserRound, Users, Zap, Globe, MapPin, Tags } from 'lucide-react';
import type { ArbreModule } from '../arbre';

const REFERENTIELS = '/administration/referentiels/';

/** Listes des tiers (FEATURE-admin-referentiels-tiers.md), dans l'ordre du menu OMRAN. */
const LISTES_TIERS: [string, string][] = [
  ['sexes', 'Sexes'], ['titres', 'Titres'], ['formes-sociales', 'Formes sociales'], ['types-tiers', 'Types de tiers'],
  ['natures-tiers', 'Natures'], ['assujettissements', 'Assujettissements'], ['situations-familiales', 'Situations familiales'],
  ['types-residence', 'Types de résidence'], ['regimes-matrimoniaux', 'Régimes matrimoniaux'],
  ['types-piece-identite', "Types de pièce d'identité"], ['nationalites', 'Nationalités'], ['professions', 'Professions'],
  ['salaires', 'Salaires'], ['types-relation', 'Types de relation'],
];

export const arbreAdministration: ArbreModule = () => [
  {
    cle: 'droits',
    titre: 'Droits',
    entrees: [
      { to: '/administration/roles', libelle: 'Rôles', Icone: ShieldCheck },
      { to: '/utilisateurs', libelle: 'Utilisateurs', Icone: Users, exact: true },
    ],
  },
  {
    cle: 'tiers',
    titre: 'Tiers',
    entrees: [
      { to: '/administration/fournisseurs', libelle: 'Fournisseurs', Icone: Truck },
      { to: '/administration/contacts', libelle: 'Contacts', Icone: Contact },
      { to: '/administration/banques', libelle: 'Banques', Icone: Landmark },
      { to: '/administration/organismes', libelle: 'Organismes', Icone: Building2 },
      { to: '/administration/personnels', libelle: 'Personnels', Icone: UserRound },
    ],
  },
  {
    cle: 'securite',
    titre: 'Sécurité',
    entrees: [
      { to: '/administration/historique', libelle: 'Historique', Icone: History },
      { to: '/administration/email-historique', libelle: 'EMail Historique', Icone: Mail },
      { to: '/administration/sessions', libelle: 'Sessions', Icone: MonitorSmartphone },
      { to: '/administration/fiches-verrouillees', libelle: 'Fiches verrouillées', Icone: LockOpen },
      { to: '/administration/actions', libelle: 'Actions', Icone: Zap },
    ],
  },
  {
    cle: 'configuration',
    titre: 'Configuration',
    entrees: [
      { to: '/modeles-documents', libelle: 'Mail models', Icone: FileCode2 },
      { to: `${REFERENTIELS}pays`, libelle: 'Pays', Icone: Globe },
      { to: `${REFERENTIELS}villes`, libelle: 'Villes', Icone: MapPin },
    ],
  },
  {
    cle: 'configuration-taches',
    titre: 'Configuration · Tâches',
    entrees: [
      { to: '/administration/taches', libelle: 'Tâches', Icone: ListChecks },
      { to: '/administration/calendrier', libelle: 'Calendrier', Icone: CalendarDays },
      { to: '/administration/type-tache', libelle: 'Type', Icone: Settings2 },
      { to: '/administration/priorite-tache', libelle: 'Priorité', Icone: Gauge },
    ],
  },
  {
    cle: 'configuration-tiers',
    titre: 'Configuration · Tiers',
    entrees: LISTES_TIERS.map(([slug, libelle]) => ({ to: REFERENTIELS + slug, libelle, Icone: Tags })),
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
