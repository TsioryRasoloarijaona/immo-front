import { useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp, Sigma } from 'lucide-react';
import { Badge } from './ui';
import { InactiviteBadge } from './ActiviteProspection';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from './ui/table';
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
  prospectCode: 'tabular-nums text-muted-foreground',
  prospectNom: 'font-medium text-foreground',
  dateDocument: 'text-muted-foreground',
  commercialNom: 'text-muted-foreground',
  commercialCode: 'tabular-nums text-muted-foreground',
  societeCode: 'tabular-nums text-muted-foreground',
  societeLibelle: 'text-muted-foreground',
  derniereAlerteDate: 'text-muted-foreground',
  telephone: 'tabular-nums text-muted-foreground',
  indicatifMobile: 'tabular-nums text-muted-foreground',
  mobileProspect: 'tabular-nums text-muted-foreground',
  email: 'text-muted-foreground',
  emailFiche: 'text-muted-foreground',
  cin: 'tabular-nums text-muted-foreground',
  pays: 'text-muted-foreground',
  prix: 'font-semibold tabular-nums text-(--success)',
  dossierCode: 'tabular-nums text-foreground',
  dateFermeture: 'text-muted-foreground',
  raisonFermeture: 'text-muted-foreground',
  creeLe: 'text-muted-foreground',
  creePar: 'text-muted-foreground',
  modifieLe: 'text-muted-foreground',
  modifiePar: 'text-muted-foreground',
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
  societeLibelle: (p) => p.societeLibelle || undefined,
  emailFiche: (p) => p.emailFiche || undefined,
  raisonFermeture: (p) => p.raisonFermeture || undefined,
  actionCommerciale: (p) => p.actionCommerciale || undefined,
  origineSupport: (p) => p.origineSupport || undefined,
};

/** Valeur brute d'une colonne, avant tout rendu — c'est sur elle que filtrent
 * et trient la ligne de filtres et l'en-tête, jamais sur le JSX rendu. */
function valeurBrute(p: ProspectionListItemDto, nom: string): unknown {
  return (p as unknown as Record<string, unknown>)[nom];
}

/** Texte sur lequel la ligne de filtres compare, dans la *forme affichée* :
 * l'utilisateur voit `09/09/2026` et tape `09/09`, pas `2026-09-09`. */
function texteComparable(p: ProspectionListItemDto, c: ColonneDto): string {
  const v = valeurBrute(p, c.nom);
  if (v === null || v === undefined) return '';
  if (c.type === 'DATE') return formatDate(String(v));
  if (c.type === 'BOOLEEN') return v ? 'oui' : 'non';
  return String(v);
}

/* `A` sur le texte, `=` sur tout ce qui se compare — les deux glyphes que la
   grille légataire pose dans sa ligne de filtres. Purement indicatifs ici :
   ils annoncent le mode de comparaison, ils ne l'ouvrent pas au choix. */
function glypheOperateur(type: TypeColonne): string {
  return type === 'TEXTE' ? 'A' : '=';
}

const NUMERIQUES: TypeColonne[] = ['MONTANT', 'NOMBRE'];

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
  const aDroite = (c: ColonneDto) => NUMERIQUES.includes(c.type);

  /* Chrome de grille. Tout est local à la table et *ne remonte pas* en
     paramètres serveur : la ligne de filtres et le tri portent sur les lignes
     déjà chargées, exactement comme la grille légataire dont ils viennent
     (DevExpress filtre et trie côté client par défaut). Le filtrage serveur
     reste le volet de filtres avancés, qui lui pagine. */
  const [filtres, setFiltres] = useState<Record<string, string>>({});
  const [tri, setTri] = useState<{ nom: string; sens: 'asc' | 'desc' } | null>(null);
  const [sommes, setSommes] = useState<Set<string>>(new Set());
  const [cochees, setCochees] = useState<Set<string>>(new Set());
  const [courante, setCourante] = useState<string | null>(null);

  const visibles = useMemo(() => {
    const actifs = colonnes.filter((c) => (filtres[c.nom] ?? '').trim() !== '');
    const filtrees = actifs.length
      ? rows.filter((p) =>
          actifs.every((c) =>
            texteComparable(p, c).toLowerCase().includes(filtres[c.nom].trim().toLowerCase()),
          ),
        )
      : rows;
    if (!tri) return filtrees;
    const col = colonnes.find((c) => c.nom === tri.nom);
    const signe = tri.sens === 'asc' ? 1 : -1;
    return [...filtrees].sort((a, b) => {
      const va = valeurBrute(a, tri.nom);
      const vb = valeurBrute(b, tri.nom);
      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;
      if (col && NUMERIQUES.includes(col.type)) return (Number(va) - Number(vb)) * signe;
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

  const basculerCoche = (id: string) =>
    setCochees((s) => {
      const suivant = new Set(s);
      if (!suivant.delete(id)) suivant.add(id);
      return suivant;
    });

  const toutesCochees = visibles.length > 0 && visibles.every((p) => cochees.has(p.id));

  /* Σ : somme pour les colonnes numériques, décompte sinon — le comportement
     de la grille d'origine, où Σ sur une colonne texte affiche « Count ». */
  const resume = (c: ColonneDto): string => {
    if (NUMERIQUES.includes(c.type)) {
      const total = visibles.reduce((s, p) => {
        const v = valeurBrute(p, c.nom);
        return s + (typeof v === 'number' ? v : 0);
      }, 0);
      return c.type === 'MONTANT' ? formatCurrency(total) : formatNumber(total);
    }
    const renseignees = visibles.filter((p) => {
      const v = valeurBrute(p, c.nom);
      return v !== null && v !== undefined && v !== '';
    }).length;
    return `${formatNumber(renseignees)}`;
  };

  return (
    <div className="flex min-w-0 flex-col">
      {/* Bandeau de regroupement. Repris tel quel de la grille légataire, où il
          reçoit un en-tête déposé pour grouper par cette colonne. Le
          glisser-déposer n'existe pas encore ici : le bandeau tient la place et
          l'énonce, plutôt que de mentir avec une cible qui n'attrape rien. */}
      {/* Pas de bordure propre au bandeau : les pages qui montent ce tableau
          l'enveloppent déjà d'une Card bordée, et un cadre de plus se lirait
          comme un double filet. Un fond et un filet bas suffisent à le poser
          au-dessus de l'en-tête. */}
      <div className="flex h-6 shrink-0 items-center gap-1.5 border-b border-border bg-muted/40 px-2 text-micro text-muted-foreground">
        <span className="opacity-70">
          Faites glisser un en-tête de colonne ici pour regrouper par cette colonne
        </span>
        <span className="rounded-full bg-(--amber-bg) px-1.25 font-bold text-(--amber)">Bientôt</span>
      </div>
      {(tri || sommes.size > 0 || cochees.size > 0) && (
        <div className="flex h-5 shrink-0 items-center gap-3 border-b border-border bg-card px-2 text-micro text-muted-foreground">
          {cochees.size > 0 && <span>{cochees.size} sélectionnée(s)</span>}
          {tri && (
            <button type="button" className="hover:text-foreground hover:underline" onClick={() => setTri(null)}>
              Tri sur « {colonnes.find((c) => c.nom === tri.nom)?.libelle ?? tri.nom} » — retirer
            </button>
          )}
          {sommes.size > 0 && (
            <button type="button" className="hover:text-foreground hover:underline" onClick={() => setSommes(new Set())}>
              {sommes.size} total(aux) — masquer
            </button>
          )}
          <span className="ml-auto tabular-nums">
            {visibles.length === rows.length
              ? `${formatNumber(rows.length)} ligne(s)`
              : `${formatNumber(visibles.length)} / ${formatNumber(rows.length)} ligne(s)`}
          </span>
        </div>
      )}
    <Table
      className="w-full table-fixed"
      // Le défilement, dans les deux axes, appartient au conteneur de la page :
      // c'est lui qui a une hauteur bornée, donc lui seul peut placer une barre
      // horizontale visible et servir de référence au `sticky top-0`.
      containerClassName="overflow-visible"
      // Une largeur minimale en dur ne tient plus avec une sélection variable :
      // trop large à trois colonnes, trop étroite à douze.
      //
      // 8rem et non plus 9 : le minimum par colonne était calibré sur les
      // anciennes métriques de cellule (14px de texte, 8px de gouttière). À
      // 12.5px et 6px, le même contenu tient dans ~8rem — garder 9 ferait
      // défiler horizontalement plus tôt que nécessaire, ce qui annulerait
      // précisément le gain de densité qu'on vient de chercher.
      style={{ minWidth: `${Math.max(48, colonnes.length * 8)}rem` }}
    >
      <TableHeader>
        <TableRow className="hover:bg-card">
          {/* Gouttières. Volontairement NON figées à gauche : figer demande un
              fond opaque sur chaque cellule de gouttière pour occulter ce qui
              défile dessous, donc de rejouer à la main la couleur de ligne
              courante et de pied — et rien dans la capture de référence ne
              prouve que la grille d'origine les fige. Simple par défaut. */}
          <TableHead className="sticky top-0 z-10 w-(--gutter-mark) bg-card p-0" aria-label="Ligne courante" />
          <TableHead className="sticky top-0 z-10 w-(--gutter-check) bg-card px-0 text-center">
            <input
              type="checkbox"
              className="size-3 cursor-pointer align-middle accent-(--brand)"
              checked={toutesCochees}
              onChange={() => setCochees(toutesCochees ? new Set() : new Set(visibles.map((p) => p.id)))}
              aria-label={toutesCochees ? 'Tout décocher' : 'Tout cocher'}
            />
          </TableHead>
          {colonnes.map((c) => {
            const trie = tri?.nom === c.nom;
            return (
              <TableHead
                key={c.nom}
                // `sticky` sur les cellules et non sur la ligne : la preflight
                // Tailwind pose `border-collapse: collapse`, mode dans lequel
                // Chrome ignore un `position: sticky` porté par un `<tr>`. Le
                // fond opaque doit alors suivre sur chaque `<th>`.
                className="sticky top-0 z-10 bg-card"
                style={{ width: `${(poidsColonne(c.nom) / totalPoids) * 100}%` }}
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
                      NUMERIQUES.includes(c.type)
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
            pour « contient », `=` pour une égalité de forme affichée. Elle
            n'interroge pas le serveur : voir le commentaire sur `filtres`. */}
        <TableRow className="hover:bg-transparent">
          <TableHead className="h-(--row-h-filter) w-(--gutter-mark) bg-card p-0" />
          <TableHead className="h-(--row-h-filter) w-(--gutter-check) bg-card p-0" />
          {colonnes.map((c) => (
            <TableHead key={c.nom} className="h-(--row-h-filter) bg-card p-0">
              <span className="flex h-full items-center">
                <span
                  className="w-3.5 shrink-0 text-center font-mono text-micro text-muted-foreground/70"
                  aria-hidden
                  title={c.type === 'TEXTE' ? 'Contient' : 'Égal à'}
                >
                  {glypheOperateur(c.type)}
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
        {visibles.map((p) => {
          const estCourante = courante === p.id;
          return (
            <TableRow
              key={p.id}
              tabIndex={0}
              aria-label={`Ouvrir la ${entite} ${prospectionDisplayName(p)}`}
              aria-selected={estCourante}
              // Plus de `role="link"` : la ligne porte maintenant une case à
              // cocher, et un lien ne peut pas contenir de contrôle. Le `<tr>`
              // garde son rôle `row` implicite, l'ouverture reste au clic et à
              // Entrée, et la case arrête la propagation pour elle seule.
              className={cn(
                'cursor-pointer',
                estCourante && 'bg-(--brand-bg) hover:bg-(--brand-bg)',
              )}
              onClick={() => {
                setCourante(p.id);
                onOuvrir(p.id);
              }}
              onFocus={() => setCourante(p.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onOuvrir(p.id);
              }}
            >
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
                  checked={cochees.has(p.id)}
                  onChange={() => basculerCoche(p.id)}
                  aria-label={`Sélectionner ${prospectionDisplayName(p)}`}
                />
              </TableCell>
              {colonnes.map((c) => (
                <TableCell
                  key={c.nom}
                  className={cn('truncate', aDroite(c) && 'text-right tabular-nums', CLASSES[c.nom])}
                  title={TITRES[c.nom]?.(p)}
                >
                  {RENDUS[c.nom] ? RENDUS[c.nom](p) : rendreParType(valeurBrute(p, c.nom), c.type)}
                </TableCell>
              ))}
            </TableRow>
          );
        })}
      </TableBody>
      {sommes.size > 0 && (
        <TableFooter>
          <TableRow className="hover:bg-muted/50">
            <TableCell className="w-(--gutter-mark) p-0" />
            <TableCell className="w-(--gutter-check) p-0" />
            {colonnes.map((c) => (
              <TableCell
                key={c.nom}
                className={cn('truncate text-micro', aDroite(c) && 'text-right tabular-nums')}
              >
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
