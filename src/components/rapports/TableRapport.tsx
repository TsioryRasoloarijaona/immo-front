import { Fragment, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight } from 'lucide-react';
import { estNumerique, formatCellule, groupesDeColonnes, preparerLignes, type Tri } from '../../lib/rapports';
import { cn } from '../../lib/utils';
import type { ColonneRapportDto, SectionRapportDto, ValeurRapport } from '../../types/rapports';

const CELLULE = 'h-(--row-h) whitespace-nowrap border-r border-border/60 px-(--cell-px) last:border-r-0';

function alignement(colonne: ColonneRapportDto): string {
  return estNumerique(colonne) ? 'text-right tabular-nums' : 'text-left';
}

/** Croissant, décroissant, puis retour à l'ordre du serveur. */
function triSuivant(tri: Tri | null, nom: string): Tri | null {
  if (tri?.nom !== nom) return { nom, sens: 1 };
  return tri.sens === 1 ? { nom, sens: -1 } : null;
}

function EnteteColonne({ colonne, tri, onTri }: Readonly<{ colonne: ColonneRapportDto; tri: Tri | null; onTri: (nom: string) => void }>) {
  const actif = tri?.nom === colonne.nom;
  let ariaSort: 'ascending' | 'descending' | 'none' = 'none';
  if (actif) ariaSort = tri.sens === 1 ? 'ascending' : 'descending';
  return (
    <th scope="col" aria-sort={ariaSort} className={cn(CELLULE, 'h-(--row-h-head) text-micro font-semibold text-muted-foreground', alignement(colonne))}>
      <button type="button" className="inline-flex items-center gap-1" onClick={() => onTri(colonne.nom)}>
        {colonne.libelle}
        {actif && (tri.sens === 1 ? <ArrowUp aria-hidden className="size-3" /> : <ArrowDown aria-hidden className="size-3" />)}
      </button>
    </th>
  );
}

function LigneValeurs({
  colonnes,
  valeurs,
  libelle,
  gras,
}: Readonly<{ colonnes: ColonneRapportDto[]; valeurs: Record<string, ValeurRapport>; libelle?: string; gras?: boolean }>) {
  return (
    <tr className={cn('border-b border-border bg-muted/40', gras && 'font-semibold')}>
      {colonnes.map((c, i) => {
        const v = valeurs[c.nom] as ValeurRapport | undefined;
        const vide = v === undefined || v === null;
        let texte = '';
        if (!vide) texte = formatCellule(c, v);
        else if (i === 0) texte = libelle ?? '';
        return (
          <td key={c.nom} className={cn(CELLULE, alignement(c))}>
            {i === 0 && !vide && libelle ? `${libelle} · ${texte}` : texte}
          </td>
        );
      })}
    </tr>
  );
}

/** Tableau d'une section : en-têtes de groupe, tri, regroupement avec sous-totaux, pied « Total » du serveur. */
export default function TableRapport({ section, filtre }: Readonly<{ section: SectionRapportDto; filtre: string }>) {
  const { colonnes, groupePar, totaux, sousTotaux } = section;
  const [tri, setTri] = useState<Tri | null>(null);
  const [replies, setReplies] = useState<ReadonlySet<string>>(new Set());
  const lots = preparerLignes(section.lignes, colonnes, groupePar, tri, filtre);
  const entetes = groupesDeColonnes(colonnes);

  function basculerTri(nom: string) {
    setTri((t) => triSuivant(t, nom));
  }
  function basculerGroupe(cle: string) {
    setReplies((r) => {
      const suivant = new Set(r);
      if (!suivant.delete(cle)) suivant.add(cle);
      return suivant;
    });
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-body">
        <thead className="bg-muted/60">
          {entetes && (
            <tr className="border-b border-border">
              {entetes.map((g, i) => (
                <th key={`${g.titre}-${i}`} colSpan={g.span} scope="colgroup" className={cn(CELLULE, 'text-center text-micro font-semibold')}>
                  {g.titre}
                </th>
              ))}
            </tr>
          )}
          <tr className="border-b border-border">
            {colonnes.map((c) => (
              <EnteteColonne key={c.nom} colonne={c} tri={tri} onTri={basculerTri} />
            ))}
          </tr>
        </thead>
        <tbody>
          {lots.map((lot) => (
            <Fragment key={lot.cle}>
              {groupePar && (
                <tr className="border-b border-border bg-muted/30">
                  <td colSpan={colonnes.length} className="h-(--row-h) px-(--cell-px) font-medium">
                    <button type="button" aria-expanded={!replies.has(lot.cle)} className="inline-flex items-center gap-1" onClick={() => basculerGroupe(lot.cle)}>
                      {replies.has(lot.cle) ? <ChevronRight aria-hidden className="size-3.5" /> : <ChevronDown aria-hidden className="size-3.5" />}
                      {lot.cle || 'Non renseigné'}
                      <span className="font-normal text-muted-foreground">({lot.lignes.length})</span>
                    </button>
                  </td>
                </tr>
              )}
              {!replies.has(lot.cle) &&
                lot.lignes.map((l, i) => (
                  <tr key={i} className="border-b border-border/60 hover:bg-muted/30">
                    {colonnes.map((c) => (
                      <td key={c.nom} className={cn(CELLULE, alignement(c))}>
                        {formatCellule(c, l[c.nom])}
                      </td>
                    ))}
                  </tr>
                ))}
              {groupePar && sousTotaux?.[lot.cle] && <LigneValeurs colonnes={colonnes} valeurs={sousTotaux[lot.cle]} libelle="Sous-total" />}
            </Fragment>
          ))}
        </tbody>
        {totaux && (
          <tfoot>
            <LigneValeurs colonnes={colonnes} valeurs={totaux} libelle="Total" gras />
          </tfoot>
        )}
      </table>
    </div>
  );
}
