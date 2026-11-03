import { Bot, Building2, CalendarDays, Contact, FileCode2, Gauge, History, KeyRound, Landmark, ListChecks, LockOpen, Mail, MonitorSmartphone, Settings2, ShieldCheck, Truck, Users, Zap } from 'lucide-react';
import type { ArbreModule } from '../arbre';

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
    entrees: [{ to: '/modeles-documents', libelle: 'Mail models', Icone: FileCode2 }],
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
    cle: 'arpent',
    titre: 'Propre à Arpent',
    entrees: [
      { to: '/utilisateurs/reinitialiser-mot-de-passe', libelle: 'Réinitialiser un mot de passe', Icone: KeyRound },
      { to: '/cles-api', libelle: "Clés d'API", Icone: Bot },
    ],
  },
];
