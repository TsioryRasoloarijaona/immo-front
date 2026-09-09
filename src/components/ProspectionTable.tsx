import type { ReactNode } from 'react';
import { Badge } from './ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { formatCurrency, formatDate, isPastOrToday } from '../lib/format';
import { etapeBadgeTone, prospectionDisplayName } from '../lib/domain';
import { cn } from '../lib/utils';
import type { ColonneDefinition } from '../lib/colonnes';
import type { ProspectionListItemDto } from '../types';

const TIRET = <span className="text-muted-foreground">—</span>;

/** Rendu de chaque colonne du catalogue. Clé = `ColonneDefinition.nom`.
 *
 * Une entrée manquante n'est pas une erreur silencieuse : la colonne est
 * ignorée à l'affichage (voir `colonnesRendables` plus bas), ce qui protège du
 * jour où le référentiel serveur annoncera une colonne que le front ne sait pas
 * encore dessiner. */
const CELLULES: Record<string, (p: ProspectionListItemDto) => ReactNode> = {
  code: (p) => p.code || TIRET,
  prospectNom: (p) => prospectionDisplayName(p),
  dateDocument: (p) => formatDate(p.dateDocument),
  etape: (p) => <Badge tone={etapeBadgeTone(p.etape, p.fermee)}>{p.fermee ? 'Clôturée' : p.etape || '—'}</Badge>,
  origine: (p) => (p.origine ? <Badge tone="info">{p.origine}</Badge> : TIRET),
  commercialNom: (p) => p.commercialNom || '—',
  // Le message de l'alerte passe en infobulle plutôt qu'en colonne : c'est une
  // note libre, de longueur imprévisible, qui ferait éclater la largeur du
  // tableau. La date, elle, se compare d'un coup d'œil.
  derniereAlerteDate: (p) =>
    p.derniereAlerteDate ? (
      <Badge tone={isPastOrToday(p.derniereAlerteDate) ? 'warning' : 'neutral'}>{formatDate(p.derniereAlerteDate)}</Badge>
    ) : (
      TIRET
    ),
  // Le numéro retombe sur celui du premier contact quand la fiche n'en porte
  // pas : 8 591 des 8 613 prospections ouvertes sont joignables ainsi, contre
  // 5 034 par la seule fiche.
  telephone: (p) => p.telephone || TIRET,
  // Absent dans 45 % des cas : un tiret neutre, pas un signal d'alerte.
  email: (p) => p.email || TIRET,
  tranche: (p) => {
    const libelle = p.trancheDescription || p.trancheCode;
    return libelle ? <Badge tone="neutral">{libelle}</Badge> : TIRET;
  },
  prix: (p) => (p.prix ? formatCurrency(p.prix) : <span className="font-normal text-muted-foreground">—</span>),
  surface: (p) => (p.surface ? `${p.surface} m²` : TIRET),
};

/** Classes propres à une colonne, en plus de `truncate` et de l'alignement
 * déduit du `type`. Reprend à l'identique la mise en forme d'avant le
 * sélecteur — le prix en vert semi-gras, les colonnes secondaires en gris. */
const CLASSES: Record<string, string> = {
  code: 'tabular-nums text-muted-foreground',
  prospectNom: 'font-medium text-foreground',
  dateDocument: 'text-muted-foreground',
  commercialNom: 'text-muted-foreground',
  derniereAlerteDate: 'text-muted-foreground',
  telephone: 'tabular-nums text-muted-foreground',
  email: 'text-muted-foreground',
  prix: 'font-semibold tabular-nums text-(--success)',
  surface: 'tabular-nums text-muted-foreground',
};

/** Infobulle par colonne — le texte complet de ce que `truncate` a coupé, et
 * pour la relance le message que la colonne ne montre pas. */
const TITRES: Record<string, (p: ProspectionListItemDto) => string | undefined> = {
  prospectNom: (p) => prospectionDisplayName(p),
  origine: (p) => p.origine || undefined,
  commercialNom: (p) => p.commercialNom || undefined,
  derniereAlerteDate: (p) => p.derniereAlerteMessage || undefined,
  telephone: (p) => p.telephone || undefined,
  email: (p) => p.email || undefined,
  tranche: (p) => p.trancheDescription || p.trancheCode || undefined,
};

/** Tableau partagé par la liste des prospections et celle des
 * pré-prospections : les deux consomment le même `ProspectionListItemDto` et
 * affichaient jusqu'ici deux copies du même balisage, qu'il fallait penser à
 * modifier deux fois. */
export default function ProspectionTable({
  rows,
  colonnes,
  onOuvrir,
  entite = 'prospection',
}: {
  rows: ProspectionListItemDto[];
  colonnes: ColonneDefinition[];
  onOuvrir: (id: string) => void;
  /** Nom de l'entité dans l'étiquette d'accessibilité de chaque ligne — les
   * deux écrans lisent le même DTO mais un lecteur d'écran doit entendre
   * « pré-prospection » sur l'un et « prospection » sur l'autre. */
  entite?: 'prospection' | 'pré-prospection';
}) {
  const colonnesRendables = colonnes.filter((c) => CELLULES[c.nom]);
  const totalPoids = colonnesRendables.reduce((somme, c) => somme + c.poids, 0) || 1;

  return (
    <Table
      className="w-full table-fixed"
      // Le défilement, dans les deux axes, appartient au conteneur de la page
      // (`overflow-auto` autour de ce composant) : c'est lui qui a une hauteur
      // bornée, donc lui seul peut placer une barre horizontale visible et
      // servir de référence au `sticky top-0` de l'en-tête.
      containerClassName="overflow-visible"
      // Une largeur minimale en dur ne tient plus avec une sélection variable :
      // trop large à trois colonnes, trop étroite à douze. ~9rem par colonne
      // redonne les 80rem d'origine sur la sélection par défaut, qui en compte
      // neuf.
      style={{ minWidth: `${Math.max(48, colonnesRendables.length * 9)}rem` }}
    >
      <TableHeader>
        <TableRow className="hover:bg-card">
          {colonnesRendables.map((c) => (
            <TableHead
              key={c.nom}
              className={cn(
                // `sticky` sur les cellules et non sur la ligne : la preflight
                // Tailwind pose `border-collapse: collapse`, mode dans lequel
                // Chrome ignore un `position: sticky` porté par un `<tr>`. Le
                // fond opaque doit alors suivre sur chaque `<th>`, sinon les
                // lignes défilent en transparence derrière l'en-tête.
                'sticky top-0 z-10 bg-card',
                (c.type === 'montant' || c.type === 'nombre') && 'text-right',
              )}
              style={{ width: `${(c.poids / totalPoids) * 100}%` }}
            >
              {c.libelle}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((p) => (
          <TableRow
            key={p.id}
            tabIndex={0}
            role="link"
            aria-label={`Ouvrir la ${entite} ${prospectionDisplayName(p)}`}
            className="cursor-pointer"
            onClick={() => onOuvrir(p.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onOuvrir(p.id);
            }}
          >
            {colonnesRendables.map((c) => (
              <TableCell
                key={c.nom}
                className={cn('truncate', (c.type === 'montant' || c.type === 'nombre') && 'text-right', CLASSES[c.nom])}
                title={TITRES[c.nom]?.(p)}
              >
                {CELLULES[c.nom](p)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
