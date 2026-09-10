import { Fragment, useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight, ChevronUp, Sigma } from 'lucide-react';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from './ui/table';
import { formatCurrency, formatDate, formatNumber } from '../lib/format';
import { cn } from '../lib/utils';
import type { TypeColonne } from '../types';

/** Grille de données partagée par tous les écrans de liste.
 *
 * Porte le chrome de la grille légataire Omran — bandeau de regroupement,
 * gouttière d'indicateur et de case à cocher, en-têtes triables, bascule Σ
 * avec pied de tableau, ligne de filtres par colonne — au-dessus du primitif
 * `ui/table`, qui porte la densité.
 *
 * Extraite de `ProspectionTable`, où ce chrome a été construit d'abord. Les
 * écrans déclarent des **colonnes** au lieu d'écrire du balisage : c'est ce
 * qui rend le chrome uniforme sans le recopier neuf fois.
 *
 * Tri, filtres et Σ sont **réels mais côté client, sur les lignes déjà
 * chargées** — le comportement par défaut de la grille DevExpress d'origine.
 * Le filtrage serveur reste l'affaire des volets de filtres de chaque page,
 * qui eux paginent. Ne pas fusionner les deux : ils ne répondent pas à la
 * même question. */
export type ColonneGrille<T> = {
  /** Clé technique. Sert d'identité de colonne et, par défaut, d'accesseur
   * dans la ligne (`row[nom]`). */
  nom: string;
  libelle: string;
  /** Porte l'alignement, le formatage par défaut et le glyphe d'opérateur de
   * la ligne de filtres. `TEXTE` par défaut. */
  type?: TypeColonne;
  /** Poids relatif de largeur, normalisé sur l'ensemble des colonnes
   * affichées. Reprendre les pourcentages en dur d'avant la migration donne
   * exactement les mêmes largeurs. */
  largeur?: number;
  /** Rendu riche — pastille, lien, seuil coloré. Sans lui, la valeur est
   * formatée selon `type`. */
  rendu?: (row: T) => ReactNode;
  /** Valeur pour le tri et le filtre, quand elle ne se lit pas directement
   * dans `row[nom]` (nom composé, repli entre deux champs…). */
  valeur?: (row: T) => unknown;
  classe?: string;
  /** Infobulle : le texte complet de ce que `truncate` a coupé. */
  titre?: (row: T) => string | undefined;
};

const TIRET = <span className="text-muted-foreground">—</span>;

const NUMERIQUES: TypeColonne[] = ['MONTANT', 'NOMBRE'];

/** Rendu par défaut, piloté par le `type` de la colonne. */
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

function typeDe<T>(c: ColonneGrille<T>): TypeColonne {
  return c.type ?? 'TEXTE';
}

function valeurDe<T>(row: T, c: ColonneGrille<T>): unknown {
  if (c.valeur) return c.valeur(row);
  return (row as unknown as Record<string, unknown>)[c.nom];
}

/** Texte sur lequel la ligne de filtres compare, dans la *forme affichée* :
 * l'utilisateur voit `09/09/2026` et tape `09/09`, pas `2026-09-09`. */
function texteComparable<T>(row: T, c: ColonneGrille<T>): string {
  const v = valeurDe(row, c);
  if (v === null || v === undefined) return '';
  const type = typeDe(c);
  if (type === 'DATE') return formatDate(String(v));
  if (type === 'BOOLEEN') return v ? 'oui' : 'non';
  return String(v);
}

/* `A` sur le texte, `=` sur tout ce qui se compare — les deux glyphes que la
   grille légataire pose dans sa ligne de filtres. Purement indicatifs :
   ils annoncent le mode de comparaison, ils ne l'ouvrent pas au choix. */
function glypheOperateur(type: TypeColonne): string {
  return type === 'TEXTE' ? 'A' : '=';
}

export default function DataGrid<T extends { id: string }>({
  rows,
  colonnes,
  onOuvrir,
  libelleLigne,
  minWidth,
  bandeauRegroupement = true,
  selection,
  rendreDetail,
}: {
  rows: T[];
  colonnes: ColonneGrille<T>[];
  /** Sans lui, les lignes ne sont ni cliquables ni focusables — pour les
   * grilles de consultation pure. */
  onOuvrir?: (id: string) => void;
  /** Étiquette d'accessibilité de la ligne, p. ex. `Ouvrir la fiche de X`. */
  libelleLigne?: (row: T) => string;
  /** Largeur minimale de la table. Par défaut ~8rem par colonne, calibré sur
   * les métriques de cellule dense (12.5px de texte, 6px de gouttière). */
  minWidth?: string;
  /** Le bandeau « glisser un en-tête pour regrouper ». À couper sur une
   * grille courte où il pèserait plus que les données. */
  bandeauRegroupement?: boolean;
  /** Sélection **pilotée par la page**. Sans elle, la gouttière garde un état
   * interne purement visuel : elle coche, rien ne la consomme.
   *
   * L'écran Dossiers, lui, a une vraie sélection multiple — la génération de
   * documents en lot — et avait donc sa propre colonne de cases. Deux colonnes
   * de cases dont une décorative serait un bug d'interface : en passant sa
   * sélection ici, la gouttière *devient* le sélecteur de lot. */
  selection?: {
    ids: Set<string>;
    onToggle: (id: string) => void;
    onToggleAll: (ids: string[]) => void;
  };
  /** Panneau de détail dépliable sous la ligne (maître-détail).
   *
   * Ajoute une gouttière de chevron et, quand la ligne est dépliée, une
   * seconde `<tr>` en `colSpan` sur toute la largeur. Sans ce prop, aucune des
   * deux n'existe — les grilles plates n'y gagnent rien.
   *
   * C'est ce qui permet à l'écran Offres de garder son détail des montants
   * tout en recevant le même chrome que les autres listes : sans lui, le
   * convertir aurait voulu dire supprimer une fonctionnalité qui marche. */
  rendreDetail?: (row: T) => ReactNode;
}) {
  const totalPoids = colonnes.reduce((s, c) => s + (c.largeur ?? 10), 0) || 1;
  const aDroite = (c: ColonneGrille<T>) => NUMERIQUES.includes(typeDe(c));

  const [filtres, setFiltres] = useState<Record<string, string>>({});
  const [tri, setTri] = useState<{ nom: string; sens: 'asc' | 'desc' } | null>(null);
  const [sommes, setSommes] = useState<Set<string>>(new Set());
  const [cocheesLocales, setCocheesLocales] = useState<Set<string>>(new Set());
  const [courante, setCourante] = useState<string | null>(null);

  const cochees = selection?.ids ?? cocheesLocales;
  const [depliee, setDepliee] = useState<string | null>(null);

  const visibles = useMemo(() => {
    const actifs = colonnes.filter((c) => (filtres[c.nom] ?? '').trim() !== '');
    const filtrees = actifs.length
      ? rows.filter((r) =>
          actifs.every((c) =>
            texteComparable(r, c).toLowerCase().includes(filtres[c.nom].trim().toLowerCase()),
          ),
        )
      : rows;
    if (!tri) return filtrees;
    const col = colonnes.find((c) => c.nom === tri.nom);
    if (!col) return filtrees;
    const signe = tri.sens === 'asc' ? 1 : -1;
    return [...filtrees].sort((a, b) => {
      const va = valeurDe(a, col);
      const vb = valeurDe(b, col);
      // Les vides finissent en bas quel que soit le sens : « trier par date
      // de visite » veut dire « les visités d'abord », pas « les nulls ».
      if (va === null || va === undefined || va === '') return 1;
      if (vb === null || vb === undefined || vb === '') return -1;
      if (NUMERIQUES.includes(typeDe(col))) return (Number(va) - Number(vb)) * signe;
      return String(va).localeCompare(String(vb), 'fr') * signe;
    });
  }, [rows, colonnes, filtres, tri]);

  const basculerTri = (nom: string) =>
    setTri((t) => (t?.nom !== nom ? { nom, sens: 'asc' } : t.sens === 'asc' ? { nom, sens: 'desc' } : null));

  const basculerSomme = (nom: string) =>
    setSommes((s) => {
      const suivant = new Set(s);
      if (!suivant.delete(nom)) suivant.add(nom);
      return suivant;
    });

  const basculerCoche = (id: string) => {
    if (selection) {
      selection.onToggle(id);
      return;
    }
    setCocheesLocales((s) => {
      const suivant = new Set(s);
      if (!suivant.delete(id)) suivant.add(id);
      return suivant;
    });
  };

  const toutesCochees = visibles.length > 0 && visibles.every((r) => cochees.has(r.id));

  const basculerToutes = () => {
    const ids = visibles.map((r) => r.id);
    if (selection) {
      selection.onToggleAll(toutesCochees ? [] : ids);
      return;
    }
    setCocheesLocales(toutesCochees ? new Set() : new Set(ids));
  };

  /* Σ : somme pour les colonnes numériques, décompte des valeurs renseignées
     sinon — le comportement de la grille d'origine, où Σ sur une colonne
     texte affiche « Count ». */
  const resume = (c: ColonneGrille<T>): string => {
    if (NUMERIQUES.includes(typeDe(c))) {
      const total = visibles.reduce((s, r) => {
        const v = valeurDe(r, c);
        return s + (typeof v === 'number' ? v : 0);
      }, 0);
      return typeDe(c) === 'MONTANT' ? formatCurrency(total) : formatNumber(total);
    }
    const renseignees = visibles.filter((r) => {
      const v = valeurDe(r, c);
      return v !== null && v !== undefined && v !== '';
    }).length;
    return formatNumber(renseignees);
  };

  const cliquable = Boolean(onOuvrir);

  return (
    <div className="flex min-w-0 flex-col">
      {bandeauRegroupement && (
        /* Pas de bordure propre au bandeau : les pages l'enveloppent déjà
           d'une Card bordée, et un cadre de plus se lirait comme un double
           filet. Le glisser-déposer n'existe pas encore — le bandeau tient la
           place et l'énonce, plutôt que de mentir avec une cible inerte. */
        <div className="flex h-6 shrink-0 items-center gap-1.5 border-b border-border bg-muted/40 px-2 text-micro text-muted-foreground">
          <span className="truncate opacity-70">
            Faites glisser un en-tête de colonne ici pour regrouper par cette colonne
          </span>
          <span className="shrink-0 rounded-full bg-(--amber-bg) px-1.25 font-bold text-(--amber)">Bientôt</span>
        </div>
      )}
      {(tri || sommes.size > 0 || cochees.size > 0) && (
        <div className="flex h-5 shrink-0 items-center gap-3 border-b border-border bg-card px-2 text-micro text-muted-foreground">
          {cochees.size > 0 && <span className="shrink-0">{cochees.size} sélectionnée(s)</span>}
          {tri && (
            <button type="button" className="shrink-0 truncate hover:text-foreground hover:underline" onClick={() => setTri(null)}>
              Tri sur « {colonnes.find((c) => c.nom === tri.nom)?.libelle ?? tri.nom} » — retirer
            </button>
          )}
          {sommes.size > 0 && (
            <button type="button" className="shrink-0 hover:text-foreground hover:underline" onClick={() => setSommes(new Set())}>
              {sommes.size} total(aux) — masquer
            </button>
          )}
          <span className="ml-auto shrink-0 tabular-nums">
            {visibles.length === rows.length
              ? `${formatNumber(rows.length)} ligne(s)`
              : `${formatNumber(visibles.length)} / ${formatNumber(rows.length)} ligne(s)`}
          </span>
        </div>
      )}
      <Table
        className="w-full table-fixed"
        // Le défilement, dans les deux axes, appartient au conteneur de la
        // page : c'est lui qui a une hauteur bornée, donc lui seul peut placer
        // une barre horizontale visible et servir de référence au `sticky`.
        containerClassName="overflow-visible"
        style={{ minWidth: minWidth ?? `${Math.max(48, colonnes.length * 8)}rem` }}
      >
        <TableHeader>
          <TableRow className="hover:bg-card">
            {/* Gouttières. Volontairement NON figées à gauche : figer demande
                un fond opaque par cellule de gouttière pour occulter ce qui
                défile dessous, donc de rejouer à la main la couleur de ligne
                courante et de pied — et rien dans la capture de référence ne
                prouve que la grille d'origine les fige. */}
            {rendreDetail && <TableHead className="sticky top-0 z-10 w-(--gutter-check) bg-card p-0" aria-label="Deplier" />}
            <TableHead className="sticky top-0 z-10 w-(--gutter-mark) bg-card p-0" aria-label="Ligne courante" />
            <TableHead className="sticky top-0 z-10 w-(--gutter-check) bg-card px-0 text-center">
              <input
                type="checkbox"
                className="size-3 cursor-pointer align-middle accent-(--brand)"
                checked={toutesCochees}
                onChange={basculerToutes}
                aria-label={toutesCochees ? 'Tout décocher' : 'Tout cocher'}
              />
            </TableHead>
            {colonnes.map((c) => {
              const trie = tri?.nom === c.nom;
              return (
                <TableHead
                  key={c.nom}
                  // `sticky` sur les cellules et non sur la ligne : la
                  // preflight Tailwind pose `border-collapse: collapse`, mode
                  // dans lequel Chrome ignore un `sticky` porté par un `<tr>`.
                  // Le fond opaque doit alors suivre sur chaque `<th>`.
                  className="sticky top-0 z-10 bg-card"
                  style={{ width: `${((c.largeur ?? 10) / totalPoids) * 100}%` }}
                  aria-sort={trie ? (tri.sens === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <span className={cn('flex items-center gap-1', aDroite(c) && 'justify-end')}>
                    <button
                      type="button"
                      className="min-w-0 truncate hover:underline"
                      onClick={() => basculerTri(c.nom)}
                      title={`Trier par ${c.libelle}`}
                    >
                      {c.libelle}
                    </button>
                    {trie &&
                      (tri.sens === 'asc' ? (
                        <ChevronUp className="size-3 shrink-0 text-(--brand)" aria-hidden />
                      ) : (
                        <ChevronDown className="size-3 shrink-0 text-(--brand)" aria-hidden />
                      ))}
                    <button
                      type="button"
                      className={cn(
                        'shrink-0 rounded px-0.5 hover:bg-muted',
                        sommes.has(c.nom) ? 'text-(--brand)' : 'text-muted-foreground/50',
                      )}
                      onClick={() => basculerSomme(c.nom)}
                      title={
                        NUMERIQUES.includes(typeDe(c))
                          ? `Afficher le total de ${c.libelle}`
                          : `Compter les ${c.libelle} renseignés`
                      }
                      aria-pressed={sommes.has(c.nom)}
                    >
                      <Sigma className="size-2.75" aria-hidden />
                    </button>
                  </span>
                </TableHead>
              );
            })}
          </TableRow>
          {/* Ligne de filtres. Le glyphe annonce le mode de comparaison — `A`
              pour « contient », `=` pour une égalité de forme affichée. */}
          <TableRow className="hover:bg-transparent">
            {rendreDetail && <TableHead className="h-(--row-h-filter) w-(--gutter-check) bg-card p-0" />}
            <TableHead className="h-(--row-h-filter) w-(--gutter-mark) bg-card p-0" />
            <TableHead className="h-(--row-h-filter) w-(--gutter-check) bg-card p-0" />
            {colonnes.map((c) => (
              <TableHead key={c.nom} className="h-(--row-h-filter) bg-card p-0">
                <span className="flex h-full items-center">
                  <span
                    className="w-3.5 shrink-0 text-center font-mono text-micro text-muted-foreground/70"
                    aria-hidden
                    title={typeDe(c) === 'TEXTE' ? 'Contient' : 'Égal à'}
                  >
                    {glypheOperateur(typeDe(c))}
                  </span>
                  <input
                    value={filtres[c.nom] ?? ''}
                    onChange={(e) => setFiltres((f) => ({ ...f, [c.nom]: e.target.value }))}
                    className="h-full min-w-0 flex-1 bg-transparent pr-1 text-micro font-normal outline-none placeholder:text-muted-foreground/40 focus:bg-(--brand-bg)"
                    placeholder="…"
                    aria-label={`Filtrer sur ${c.libelle}`}
                  />
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibles.map((r) => {
            const estCourante = courante === r.id;
            const estCochee = cochees.has(r.id);
            const estDepliee = depliee === r.id;
            return (
              <Fragment key={r.id}>
              <TableRow
                tabIndex={cliquable ? 0 : undefined}
                aria-label={libelleLigne?.(r)}
                aria-selected={estCourante}
                // Pas de `role="link"` : la ligne porte une case à cocher, et
                // un lien ne peut pas contenir de contrôle. Le `<tr>` garde son
                // rôle `row` implicite, l'ouverture reste au clic et à Entrée.
                className={cn(
                  cliquable && 'cursor-pointer',
                  // Cochée puis courante, dans cet ordre : quand une ligne est
                  // les deux, c'est la teinte « courante » qui doit gagner, et
                  // twMerge garde la dernière classe pour une même propriété.
                  estCochee && 'bg-muted/40 hover:bg-muted/40',
                  estCourante && 'bg-(--brand-bg) hover:bg-(--brand-bg)',
                )}
                onClick={cliquable ? () => { setCourante(r.id); onOuvrir?.(r.id); } : undefined}
                onFocus={() => setCourante(r.id)}
                onKeyDown={
                  cliquable
                    ? (e) => {
                        if (e.key === 'Enter') onOuvrir?.(r.id);
                      }
                    : undefined
                }
              >
                {rendreDetail && (
                  <TableCell
                    className="w-(--gutter-check) p-0 text-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDepliee(estDepliee ? null : r.id);
                    }}
                  >
                    <button
                      type="button"
                      aria-expanded={estDepliee}
                      aria-label={estDepliee ? 'Replier le détail' : 'Déplier le détail'}
                      className="align-middle"
                    >
                      {estDepliee ? (
                        <ChevronDown className="size-3 text-(--brand)" aria-hidden />
                      ) : (
                        <ChevronRight className="size-3 text-muted-foreground" aria-hidden />
                      )}
                    </button>
                  </TableCell>
                )}
                <TableCell className="w-(--gutter-mark) p-0 text-center">
                  {estCourante && (
                    <span className="text-(--brand)" aria-hidden>
                      ▶
                    </span>
                  )}
                </TableCell>
                <TableCell
                  className="w-(--gutter-check) px-0 text-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    className="size-3 cursor-pointer align-middle accent-(--brand)"
                    checked={cochees.has(r.id)}
                    onChange={() => basculerCoche(r.id)}
                    aria-label={libelleLigne ? `Sélectionner — ${libelleLigne(r)}` : 'Sélectionner la ligne'}
                  />
                </TableCell>
                {colonnes.map((c) => (
                  <TableCell
                    key={c.nom}
                    className={cn('truncate', aDroite(c) && 'text-right tabular-nums', c.classe)}
                    title={c.titre?.(r)}
                  >
                    {c.rendu ? c.rendu(r) : rendreParType(valeurDe(r, c), typeDe(c))}
                  </TableCell>
                ))}
              </TableRow>
              {rendreDetail && estDepliee && (
                /* `colSpan` couvre les colonnes plus les gouttieres : chevron
                   (si present), indicateur, case a cocher. */
                <TableRow className="hover:bg-transparent">
                  {/* +3 : les colonnes, plus les trois gouttières — chevron,
                      indicateur de ligne courante, case à cocher. Cette
                      branche n'existe que si `rendreDetail` est fourni, donc
                      le chevron est toujours là. */}
                  <TableCell colSpan={colonnes.length + 3} className="bg-muted/30 py-3 whitespace-normal">
                    {rendreDetail(r)}
                  </TableCell>
                </TableRow>
              )}
              </Fragment>
            );
          })}
        </TableBody>
        {sommes.size > 0 && (
          <TableFooter>
            <TableRow className="hover:bg-muted/50">
              {rendreDetail && <TableCell className="w-(--gutter-check) p-0" />}
              <TableCell className="w-(--gutter-mark) p-0" />
              <TableCell className="w-(--gutter-check) p-0" />
              {colonnes.map((c) => (
                <TableCell key={c.nom} className={cn('truncate text-micro', aDroite(c) && 'text-right tabular-nums')}>
                  {sommes.has(c.nom) ? resume(c) : null}
                </TableCell>
              ))}
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}
