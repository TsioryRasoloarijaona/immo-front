import { Building2, FileBarChart, Grid2x2, Home, Landmark, Layers, LayoutGrid, MapPinned, Ruler, Settings2, Trees, UserRound, UsersRound } from 'lucide-react';
import { estAdministrateur, estExempte } from '../../lib/roles';
import type { ArbreModule } from '../arbre';

const PROJET = 'var(--sec-projet)';
const TRANCHE = 'var(--sec-tranche)';

export const arbrePatrimoine: ArbreModule = () => [
  {
    cle: 'patrimoine',
    entrees: [
      { to: '/entites-juridiques', libelle: 'Entités juridiques', Icone: Landmark, couleur: PROJET, visible: estAdministrateur },
      { to: '/terrains-prospection', libelle: 'Prospections terrain', Icone: MapPinned, couleur: TRANCHE },
      { to: '/terrains', libelle: 'Terrains', Icone: Trees, couleur: TRANCHE },
      { to: '/etudes-faisabilite', libelle: 'Études de faisabilité', Icone: Ruler, couleur: PROJET, visible: estExempte },
      { to: '/projets', libelle: 'Programmes immobiliers', Icone: LayoutGrid, couleur: PROJET },
      { to: '/tranches', libelle: 'Tranches', Icone: Building2, couleur: TRANCHE },
      { to: '/articles', libelle: 'Articles', Icone: Home, couleur: TRANCHE },
      { to: '/sous-articles', libelle: 'Sous articles', Icone: Layers, couleur: TRANCHE },
      { to: '/lotissements', libelle: 'Lotissements', Icone: Grid2x2, couleur: TRANCHE },
    ],
  },
  {
    cle: 'tableaux',
    titre: 'Tableaux de bords',
    entrees: [{ to: '/patrimoine-rapports', libelle: 'Rapports', Icone: FileBarChart, couleur: PROJET }],
  },
  {
    cle: 'configuration',
    titre: 'Configuration',
    entrees: [
      { to: '/configuration/referentiels', actif: '/configuration', libelle: 'Référentiels', Icone: Settings2, couleur: PROJET },
      { to: '/actionnaires', libelle: 'Actionnaires', Icone: UserRound, couleur: PROJET, visible: estAdministrateur },
      { to: '/groupes-actionnaires', libelle: "Groupe d'actionnaires", Icone: UsersRound, couleur: PROJET, visible: estAdministrateur },
    ],
  },
];
