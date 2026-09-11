import { ChevronRight, CornerDownLeft } from 'lucide-react';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from './ui/table';
import { formatCurrency, formatNumber } from '../lib/format';
import { identiteGroupe, libelleGroupeAffiche } from '../lib/groupement';
import { cn } from '../lib/utils';
import type { ColonneDto, GroupeDto } from '../types';

/** La liste **repliée** en groupes — l'équivalent des en-têtes
 * « Client : Adnane ES-SAIYDY (1 item) » et de leurs bandes « Total : » du
 * logiciel de bureau.
 *
 * Un groupe ne porte pas de lignes : il porte un effectif et des sommes, tous
 * deux calculés par le serveur sur **tout le périmètre filtré**, pas sur une
 * page. C'est la raison d'être de l'endpoint `/groupes` et ce qui distingue ces
 * totaux du Σ des en-têtes de colonne, qui ne somme que la page chargée.
 *
 * Ouvrir un groupe ne déplie pas des lignes sous son en-tête : l'écran bascule
 * sur la liste restreinte à ce groupe. Les deux vues se paginent, et deux
 * paginations imbriquées dans un même tableau seraient illisibles — celle du
 * bas ne saurait plus si elle numérote les groupes ou les lignes. */
export default function TableauGroupes({
  groupes,
  colonneGroupee,
  agregats,
  onOuvrir,
}: {
  groupes: GroupeDto[];
  colonneGroupee: ColonneDto;
  /** Colonnes sommées, dans l'ordre choisi : une colonne de totaux chacune. */
  agregats: ColonneDto[];
  onOuvrir: (g: GroupeDto) => void;
}) {
  const formater = (c: ColonneDto, valeur: number | undefined) => {
    if (valeur === undefined) return null;
    // Les sommes arrivent bruitées en flottant (`17440269.999994`, somme SQL
    // sur des `float`) ; les deux formateurs l'absorbent via `toFixed`.
    return c.type === 'MONTANT' ? formatCurrency(valeur) : formatNumber(valeur, 2);
  };

  const totalLignes = groupes.reduce((s, g) => s + g.nombre, 0);
  const totalAgregat = (c: ColonneDto) => groupes.reduce((s, g) => s + (g.agregats?.[c.nom] ?? 0), 0);

  return (
    <Table className="w-max min-w-full table-auto" containerClassName="overflow-visible">
      <TableHeader>
        <TableRow className="hover:bg-card">
          <TableHead className="sticky top-0 z-10 w-(--gutter-check) bg-card p-0" aria-label="Ouvrir" />
          <TableHead className="sticky top-0 z-10 bg-card whitespace-nowrap">{colonneGroupee.libelle}</TableHead>
          <TableHead className="sticky top-0 z-10 bg-card text-right whitespace-nowrap">Lignes</TableHead>
          {agregats.map((c) => (
            <TableHead key={c.nom} className="sticky top-0 z-10 bg-card text-right whitespace-nowrap">
              {c.libelle}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {groupes.map((g) => (
          <TableRow
            key={identiteGroupe(g)}
            tabIndex={0}
            className="cursor-pointer"
            aria-label={`Ouvrir le groupe ${libelleGroupeAffiche(g)} — ${g.nombre} ligne(s)`}
            onClick={() => onOuvrir(g)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onOuvrir(g);
            }}
          >
            <TableCell className="w-(--gutter-check) p-0 text-center">
              <ChevronRight aria-hidden className="inline size-3 align-middle text-muted-foreground" />
            </TableCell>
            <TableCell
              className={cn(
                'truncate font-medium',
                // Le groupe des lignes sans valeur est un groupe légitime, pas
                // une anomalie : il est servi pour que la somme des effectifs
                // retombe sur le total de la liste. Il se lit comme une
                // absence, sans se présenter comme une valeur.
                g.libelle === null ? 'text-muted-foreground italic' : 'text-foreground',
              )}
              title={libelleGroupeAffiche(g)}
            >
              {libelleGroupeAffiche(g)}
            </TableCell>
            <TableCell className="text-right tabular-nums">{formatNumber(g.nombre)}</TableCell>
            {agregats.map((c) => (
              <TableCell key={c.nom} className="text-right tabular-nums text-muted-foreground">
                {formater(c, g.agregats?.[c.nom]) ?? <span className="text-muted-foreground">—</span>}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        {/* Totaux de la **page de groupes affichée**, et le pied le dit. Le
            total plein périmètre est le `totalElements` de la liste, que la
            pagination affiche déjà juste en dessous : deux nombres qui se
            contrediraient sans être étiquetés seraient pires que pas de pied. */}
        <TableRow className="hover:bg-muted/50">
          <TableCell className="w-(--gutter-check) p-0" />
          <TableCell className="text-micro whitespace-nowrap text-muted-foreground">
            Cumul des groupes affichés
          </TableCell>
          <TableCell className="text-right text-micro tabular-nums">{formatNumber(totalLignes)}</TableCell>
          {agregats.map((c) => (
            <TableCell key={c.nom} className="text-right text-micro tabular-nums">
              {formater(c, totalAgregat(c))}
            </TableCell>
          ))}
        </TableRow>
      </TableFooter>
    </Table>
  );
}

/** Le fil d'Ariane du groupe ouvert, au-dessus de la liste restreinte.
 *
 * Sans lui, une liste dépliée est indiscernable d'une liste filtrée : mêmes
 * colonnes, moins de lignes, et rien à l'écran pour dire pourquoi. */
export function BandeauGroupeOuvert({
  colonneLibelle,
  groupeLibelle,
  nombre,
  onRetour,
}: {
  colonneLibelle: string;
  groupeLibelle: string;
  /** Vient du `totalElements` de la liste et non du `nombre` du groupe : il
   * reste juste après un changement de filtre, là où une valeur recopiée au
   * moment de l'ouverture deviendrait fausse en silence. */
  nombre: number;
  onRetour: () => void;
}) {
  return (
    <div className="flex min-h-6 shrink-0 flex-wrap items-center gap-1.5 border-b border-border bg-(--brand-bg) px-2 py-0.5 text-micro">
      <button
        type="button"
        className="flex shrink-0 items-center gap-1 rounded px-1 py-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        onClick={onRetour}
      >
        <CornerDownLeft aria-hidden className="size-3" />
        Tous les groupes
      </button>
      <span className="opacity-60">/</span>
      <span className="opacity-70">{colonneLibelle}</span>
      <span className="truncate font-semibold text-(--brand)">{groupeLibelle}</span>
      <span className="shrink-0 tabular-nums opacity-70">— {formatNumber(nombre)} ligne(s)</span>
    </div>
  );
}
