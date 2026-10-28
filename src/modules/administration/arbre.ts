import { Bot, FileCode2, KeyRound, Users } from 'lucide-react';
import type { ArbreModule } from '../arbre';

export const arbreAdministration: ArbreModule = () => [
  {
    cle: 'droits',
    titre: 'Droits',
    entrees: [{ to: '/utilisateurs', libelle: 'Utilisateurs', Icone: Users, exact: true }],
  },
  {
    cle: 'configuration',
    titre: 'Configuration',
    entrees: [{ to: '/modeles-documents', libelle: 'Mail models', Icone: FileCode2 }],
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
