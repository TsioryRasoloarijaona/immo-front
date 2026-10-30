import { Bot, FileCode2, Gauge, History, KeyRound, Mail, Settings2, Users } from 'lucide-react';
import type { ArbreModule } from '../arbre';

export const arbreAdministration: ArbreModule = () => [
  {
    cle: 'droits',
    titre: 'Droits',
    entrees: [{ to: '/utilisateurs', libelle: 'Utilisateurs', Icone: Users, exact: true }],
  },
  {
    cle: 'securite',
    titre: 'Sécurité',
    entrees: [
      { to: '/administration/historique', libelle: 'Historique', Icone: History },
      { to: '/administration/email-historique', libelle: 'EMail Historique', Icone: Mail },
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
