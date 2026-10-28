import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CircleHelp,
  Copy,
  Filter,
  FileSpreadsheet,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  Trash2,
  Upload,
  type LucideIcon,
} from 'lucide-react';

export type IdOutil =
  | 'nouveau'
  | 'modifier'
  | 'dupliquer'
  | 'supprimer'
  | 'premier'
  | 'precedent'
  | 'suivant'
  | 'dernier'
  | 'rafraichir'
  | 'filtrer'
  | 'exporter'
  | 'importer'
  | 'imprimer'
  | 'aide';

export type FamilleOutil = 'suppr' | 'rafr' | 'export' | 'print' | 'import';

/** Une couleur par famille d'action, jamais seule : l'infobulle et le `aria-label` portent le sens. */
export const CLASSE_FAMILLE: Record<FamilleOutil, string> = {
  suppr: 'text-(--warning)',
  rafr: 'text-(--info)',
  export: 'text-(--success)',
  print: 'text-(--progress)',
  import: 'text-(--amber)',
};

export interface DefinitionOutil {
  id: IdOutil;
  libelle: string;
  icone: LucideIcon;
  raccourci?: string;
  famille?: FamilleOutil;
  /** Exige une ligne sélectionnée. */
  sel?: boolean;
  /** Les outils d'un même groupe se suivent ; un séparateur sépare deux groupes visibles. */
  groupe: number;
}

export const OUTILS: DefinitionOutil[] = [
  { id: 'nouveau', libelle: 'Nouveau', icone: Plus, raccourci: 'Inser', groupe: 0 },
  { id: 'modifier', libelle: 'Ouvrir / modifier', icone: Pencil, raccourci: 'Entrée', sel: true, groupe: 0 },
  { id: 'dupliquer', libelle: 'Dupliquer', icone: Copy, sel: true, groupe: 0 },
  { id: 'supprimer', libelle: 'Supprimer', icone: Trash2, raccourci: 'Suppr', famille: 'suppr', sel: true, groupe: 0 },
  { id: 'premier', libelle: 'Premier', icone: ChevronsLeft, raccourci: 'Début', groupe: 1 },
  { id: 'precedent', libelle: 'Précédent', icone: ChevronLeft, raccourci: '↑', groupe: 1 },
  { id: 'suivant', libelle: 'Suivant', icone: ChevronRight, raccourci: '↓', groupe: 1 },
  { id: 'dernier', libelle: 'Dernier', icone: ChevronsRight, raccourci: 'Fin', groupe: 1 },
  { id: 'rafraichir', libelle: 'Rafraîchir', icone: RefreshCw, raccourci: 'F5', famille: 'rafr', groupe: 2 },
  { id: 'filtrer', libelle: 'Afficher / masquer les filtres', icone: Filter, groupe: 2 },
  { id: 'exporter', libelle: 'Exporter vers Excel', icone: FileSpreadsheet, famille: 'export', groupe: 2 },
  { id: 'importer', libelle: 'Importer', icone: Upload, famille: 'import', groupe: 2 },
  { id: 'imprimer', libelle: 'Imprimer la liste', icone: Printer, raccourci: 'Ctrl+P', famille: 'print', groupe: 2 },
  { id: 'aide', libelle: "Aide de l'écran", icone: CircleHelp, raccourci: 'F1', groupe: 3 },
];

/** Affichés d'emblée ; « Nouveau » s'y ajoute en tête quand la page le fournit. */
export const OUTILS_DEFAUT: IdOutil[] = ['supprimer', 'rafraichir', 'exporter', 'imprimer'];

const PREFIXE = 'arpent.liste.v1.';

function lire(cle: string): string | null {
  try {
    return localStorage.getItem(cle);
  } catch {
    return null;
  }
}

function ecrire(cle: string, valeur: string | null) {
  try {
    if (valeur === null) localStorage.removeItem(cle);
    else localStorage.setItem(cle, valeur);
  } catch {
    // Stockage indisponible : la préférence ne survit pas au rechargement, sans autre conséquence.
  }
}

/** Ids mémorisés pour cet écran, `null` tant que l'utilisateur n'a rien personnalisé. */
export function lireOutils(cle: string): string[] | null {
  try {
    const v: unknown = JSON.parse(lire(`${PREFIXE}${cle}.outils`) ?? 'null');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : null;
  } catch {
    return null;
  }
}

/** `null` rétablit le défaut. */
export function ecrireOutils(cle: string, ids: string[] | null) {
  ecrire(`${PREFIXE}${cle}.outils`, ids === null ? null : JSON.stringify(ids));
}

/** Barre repliée : réglage global, commun à tous les écrans. */
export const CLE_DOCK_PLIE = `${PREFIXE}dock-plie`;

/** Clé du panneau de filtres replié, par écran. */
export function cleFiltresFermes(cle: string): string {
  return `${PREFIXE}${cle}.filtres-fermes`;
}

/** Booléen mémorisé (`'1'`/`'0'`) sous une clé complète : panneau de filtres replié, barre repliée. */
export function useBooleenMemorise(cleComplete: string): [boolean, () => void] {
  const [valeur, setValeur] = useState(() => lire(cleComplete) === '1');
  function basculer() {
    ecrire(cleComplete, valeur ? '0' : '1');
    setValeur(!valeur);
  }
  return [valeur, basculer];
}
