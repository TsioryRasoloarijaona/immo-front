import type { ReactNode } from 'react';
import { Badge } from './ui';
import { InactiviteBadge } from './ActiviteProspection';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { formatCurrency, formatDate, formatNumber, isPastOrToday } from '../lib/format';
import { etapeBadgeTone, prospectionDisplayName } from '../lib/domain';
import { poidsColonne } from '../lib/colonnes';
import { cn } from '../lib/utils';
import type { ColonneDto, ProspectionListItemDto, TypeColonne } from '../types';

const TIRET = <span className="text-muted-foreground">—</span>;

/** Rendu par défaut, piloté par le `type` que porte le catalogue serveur.
 *
 * C'est ce qui permet à une colonne **ajoutée côté serveur** d'apparaître sans
 * toucher à ce fichier : elle s'affiche formatée et alignée selon son type. Les
 * rendus ci-dessous ne traitent que les colonnes qui méritent mieux qu'un
 * texte — un badge, un seuil coloré. */
function rendreParType(valeur: unknown, type: TypeColonne): ReactNode {
  if (valeur === null || valeur === undefined || valeur === '') return TIRET;
  switch (type) {
    case 'MONTANT':
      return typeof valeur === 'number' ? formatCurrency(valeur) : String(valeur);
    case 'NOMBRE':
      return typeof valeur === 'number' ? formatNumber(valeur) : String(valeur);
    case 'DATE':
      return formatDate(String(valeur));
    case 'BOOLEEN':
      return valeur ? 'Oui' : 'Non';
    default:
      return String(valeur);
  }
}

const RENDUS: Record<string, (p: ProspectionListItemDto) => ReactNode> = {
  prospectNom: (p) => prospectionDisplayName(p),
  etape: (p) => <Badge tone={etapeBadgeTone(p.etape, p.fermee)}>{p.fermee ? 'Clôturée' : p.etape || '—'}</Badge>,
  origine: (p) => (p.origine ? <Badge tone="info">{p.origine}</Badge> : TIRET),
  trancheDescription: (p) => (p.trancheDescription ? <Badge tone="neutral">{p.trancheDescription}</Badge> : TIRET),
  trancheCode: (p) => (p.trancheCode ? <Badge tone="neutral">{p.trancheCode}</Badge> : TIRET),
  // Le message de l'alerte passe en infobulle plutôt qu'en colonne : c'est une
  // note libre, de longueur imprévisible, qui ferait éclater la largeur du
  // tableau. La date, elle, se compare d'un coup d'œil.
  derniereAlerteDate: (p) =>
    p.derniereAlerteDate ? (
      <Badge tone={isPastOrToday(p.derniereAlerteDate) ? 'warning' : 'neutral'}>{formatDate(p.derniereAlerteDate)}</Badge>
    ) : (
      TIRET
    ),
  // Mêmes seuils que la pastille de la fiche — 30/90 j en un seul endroit,
  // sinon la liste et le détail finiraient par colorer différemment la même
  // prospection.
  joursInactivite: (p) => (typeof p.joursInactivite === 'number' ? <InactiviteBadge jours={p.joursInactivite} /> : TIRET),
  derniereCommunicationResultat: (p) =>
    p.derniereCommunicationResultat ? <Badge tone="neutral">{p.derniereCommunicationResultat}</Badge> : TIRET,
  statutDossier: (p) => (p.statutDossier ? <Badge tone="success">{p.statutDossier}</Badge> : TIRET),
  prix: (p) => (p.prix ? formatCurrency(p.prix) : <span className="font-normal text-muted-foreground">—</span>),
  surface: (p) => (p.surface ? `${p.surface} m²` : TIRET),
};

/** Classes propres à une colonne, en plus de `truncate` et de l'alignement
 * déduit du type. Reprend la mise en forme d'avant le sélecteur. */
const CLASSES: Record<string, string> = {
  code: 'tabular-nums text-muted-foreground',
  prospectNom: 'font-medium text-foreground',
  dateDocument: 'text-muted-foreground',
  commercialNom: 'text-muted-foreground',
  derniereAlerteDate: 'text-muted-foreground',
  telephone: 'tabular-nums text-muted-foreground',
  email: 'text-muted-foreground',
  cin: 'tabular-nums text-muted-foreground',
  prix: 'font-semibold tabular-nums text-(--success)',
  dossierCode: 'tabular-nums text-foreground',
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
  trancheDescription: (p) => p.trancheDescription || undefined,
  projetLibelle: (p) => p.projetLibelle || undefined,
  derniereCommunicationResultat: (p) => p.derniereCommunicationResultat || undefined,
};

/** Tableau partagé par la liste des prospections et celle des
 * pré-prospections : les deux consomment le même `ProspectionListItemDto` et
 * affichaient jusqu'ici deux copies du même balisage. */
export default function ProspectionTable({
  rows,
  colonnes,
  onOuvrir,
  entite = 'prospection',
}: {
  rows: ProspectionListItemDto[];
  colonnes: ColonneDto[];
  onOuvrir: (id: string) => void;
  /** Nom de l'entité dans l'étiquette d'accessibilité de chaque ligne — les
   * deux écrans lisent le même DTO mais un lecteur d'écran doit entendre
   * « pré-prospection » sur l'un et « prospection » sur l'autre. */
  entite?: 'prospection' | 'pré-prospection';
}) {
  const totalPoids = colonnes.reduce((somme, c) => somme + poidsColonne(c.nom), 0) || 1;
  const aDroite = (c: ColonneDto) => c.type === 'MONTANT' || c.type === 'NOMBRE';

  return (
    <Table
      className="w-full table-fixed"
      // Le défilement, dans les deux axes, appartient au conteneur de la page :
      // c'est lui qui a une hauteur bornée, donc lui seul peut placer une barre
      // horizontale visible et servir de référence au `sticky top-0`.
      containerClassName="overflow-visible"
      // Une largeur minimale en dur ne tient plus avec une sélection variable :
      // trop large à trois colonnes, trop étroite à douze. ~9rem par colonne
      // redonne les 80rem d'origine sur une sélection de neuf.
      style={{ minWidth: `${Math.max(48, colonnes.length * 9)}rem` }}
    >
      <TableHeader>
        <TableRow className="hover:bg-card">
          {colonnes.map((c) => (
            <TableHead
              key={c.nom}
              className={cn(
                // `sticky` sur les cellules et non sur la ligne : la preflight
                // Tailwind pose `border-collapse: collapse`, mode dans lequel
                // Chrome ignore un `position: sticky` porté par un `<tr>`. Le
                // fond opaque doit alors suivre sur chaque `<th>`.
                'sticky top-0 z-10 bg-card',
                aDroite(c) && 'text-right',
              )}
              style={{ width: `${(poidsColonne(c.nom) / totalPoids) * 100}%` }}
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
            {colonnes.map((c) => (
              <TableCell
                key={c.nom}
                className={cn('truncate', aDroite(c) && 'text-right tabular-nums', CLASSES[c.nom])}
                title={TITRES[c.nom]?.(p)}
              >
                {RENDUS[c.nom]
                  ? RENDUS[c.nom](p)
                  : rendreParType((p as unknown as Record<string, unknown>)[c.nom], c.type)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
