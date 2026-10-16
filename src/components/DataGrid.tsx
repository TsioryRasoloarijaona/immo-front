import { Fragment, useCallback, useDeferredValue, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';
import { ChevronDown, ChevronRight, ChevronUp, Sigma, SquareMinus, SquarePlus } from 'lucide-react';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from './ui/table';
import { sansAccents, useOrdreColonnes } from '../lib/colonnes';
import { formatCurrency, formatDate, formatNumber, texteBrut } from '../lib/format';
import { cn } from '../lib/utils';
import {
  LIBELLES_FONCTION,
  TAILLE_LOT_GROUPE,
  formatAgregat,
  identiteGroupe,
  jetonAgregat,
  libelleGroupeAffiche,
  type LignesGroupe,
} from '../lib/groupement';
import type { TotauxServeurGrille } from '../lib/totauxServeur';
import BandeTotauxServeur from './BandeTotauxServeur';
import MenuTotauxColonne from './MenuTotauxColonne';
import type { ColonneDto, FonctionAgregat, GroupeDto, TypeColonne, ValeurAgregat } from '../types';

/** Tri, filtres et Σ sont côté client, sur les lignes chargées seulement ; le filtrage
 * serveur reste aux volets de chaque page. Ne pas fusionner : deux questions différentes. */
export type ColonneGrille<T> = {
  nom: string;
  libelle: string;
  type?: TypeColonne;
  /** Plafond de largeur en poids, pas une part de la table : en `table-auto` chaque
   * colonne prend la largeur de son contenu. Converti en pixels par `plafondColonne`. */
  largeur?: number;
  rendu?: (row: T) => ReactNode;
  /** Obligatoire dès que le texte affiché n'est pas `row[nom]` : sinon tri et filtre
   * comparent le code brut (`IN_WORK`) alors que l'utilisateur voit et tape le libellé. */
  valeur?: (row: T) => unknown;
  classe?: string;
  /** Formateur d'une valeur nue, pour les bandes de totaux : sans lui un ratio typé
   * `NOMBRE` par le serveur s'affiche « 0,07 » au lieu de « 7 % ». */
  formatValeur?: (valeur: unknown) => string;
  titre?: (row: T) => string | undefined;
  sansSomme?: boolean;
  /** Valeur comptée par le Σ quand elle diffère de la cellule (ex. règlement annulé : `null`, hors somme). */
  valeurSomme?: (row: T) => unknown;
};

const TIRET = <span className="text-muted-foreground">—</span>;

export type GroupementGrille<T> = {
  liste: GroupeDto[];
  colonneLibelle: string;
  libelleGroupe?: (brut: string) => string;
  /** La fonction compte pour le formatage : un `MIN` sur une colonne date rend une chaîne ISO. */
  agregats: { jeton: string; colonne: ColonneDto; fonction: FonctionAgregat }[];
  /** Agrégats sur tout le périmètre filtré, à ne pas confondre avec le Σ (lignes chargées). */
  totaux: Partial<Record<string, ValeurAgregat>>;
  nombreTotal: number;
  estOuvert: (g: GroupeDto) => boolean;
  etat: (g: GroupeDto) => LignesGroupe<T> | undefined;
  basculer: (g: GroupeDto) => void;
  chargerPlus: (g: GroupeDto) => void;
  lignesChargees: T[];
};

const NUMERIQUES: TypeColonne[] = ['MONTANT', 'NOMBRE'];

/** `null` pour une cellule vide, rendue en tiret par l'appelant. */
function texteParType(valeur: unknown, type: TypeColonne): string | null {
  if (valeur === null || valeur === undefined || valeur === '') return null;
  switch (type) {
    case 'MONTANT':
      return typeof valeur === 'number' ? formatCurrency(valeur) : texteBrut(valeur);
    case 'NOMBRE':
      return typeof valeur === 'number' ? formatNumber(valeur) : texteBrut(valeur);
    case 'DATE':
      return formatDate(texteBrut(valeur));
    case 'BOOLEEN': {
      const vrai = Boolean(valeur);
      return vrai ? 'Oui' : 'Non';
    }
    default:
      return texteBrut(valeur);
  }
}

function typeDe<T>(c: ColonneGrille<T>): TypeColonne {
  return c.type ?? 'TEXTE';
}

function valeurDe<T>(row: T, c: ColonneGrille<T>): unknown {
  if (c.valeur) return c.valeur(row);
  return (row as unknown as Record<string, unknown>)[c.nom];
}

// Comparaison sur la forme affichée : l'utilisateur tape `09/09`, pas `2026-09-09`.
function texteComparable<T>(row: T, c: ColonneGrille<T>): string {
  const v = valeurDe(row, c);
  if (v === null || v === undefined) return '';
  const type = typeDe(c);
  if (type === 'DATE') return formatDate(texteBrut(v));
  const vrai = Boolean(v);
  if (type === 'BOOLEEN') return vrai ? 'oui' : 'non';
  return texteBrut(v);
}

// `\s` couvre aussi les espaces insécables des montants formatés.
function normaliserNombre(texte: string): string {
  return texte.replace(/\s/g, '').replace(/(dh|m²|m2|%)$/i, '').replace(',', '.');
}

function textesNumeriques<T>(v: unknown, c: ColonneGrille<T>): string[] {
  if (c.formatValeur) return [c.formatValeur(v), String(v)];
  if (typeof v !== 'number') return [String(v)];
  return [typeDe(c) === 'MONTANT' ? formatCurrency(v) : formatNumber(v), String(v)];
}

function predicatFiltre<T>(c: ColonneGrille<T>, saisie: string): (row: T) => boolean {
  if (!NUMERIQUES.includes(typeDe(c))) {
    const aiguille = sansAccents(saisie);
    return (r) => sansAccents(texteComparable(r, c)).includes(aiguille);
  }
  const aiguille = normaliserNombre(saisie).toLowerCase();
  const n = Number(aiguille);
  // Un ratio affiché en % (`formatValeur`) ne se compare qu'à sa forme affichée.
  if (!c.formatValeur && /^-?[\d.]+$/.test(aiguille) && Number.isFinite(n)) {
    const tolerance = typeDe(c) === 'MONTANT' ? 0.005 : 0;
    return (r) => {
      const v = valeurDe(r, c);
      if (v === null || v === undefined || v === '') return false;
      return Math.abs(Number(v) - n) <= tolerance;
    };
  }
  return (r) => {
    const v = valeurDe(r, c);
    if (v === null || v === undefined || v === '') return false;
    return textesNumeriques(v, c).some((t) => normaliserNombre(t).toLowerCase().includes(aiguille));
  };
}

/** Σ : somme sur une colonne numérique, nombre de cellules renseignées sinon. */
function resumeColonne<T>(lignes: T[], c: ColonneGrille<T>): string {
  const type = typeDe(c);
  if (NUMERIQUES.includes(type)) {
    let total = 0;
    for (const r of lignes) {
      const v = c.valeurSomme ? c.valeurSomme(r) : valeurDe(r, c);
      if (typeof v === 'number') total += v;
    }
    return type === 'MONTANT' ? formatCurrency(total) : formatNumber(total);
  }
  let renseignees = 0;
  for (const r of lignes) {
    const v = valeurDe(r, c);
    if (v !== null && v !== undefined && v !== '') renseignees++;
  }
  return formatNumber(renseignees);
}

function compteurLignes(
  groupes: { nbGroupes: number; nbChargees: number } | null,
  filtreActif: boolean,
  nbVisibles: number,
  nbLignes: number,
): string {
  if (groupes) {
    const base = `${formatNumber(groupes.nbGroupes)} groupe(s), ${formatNumber(nbVisibles)}`;
    return filtreActif
      ? `${base} / ${formatNumber(groupes.nbChargees)} ligne(s) dépliée(s) — filtre sur les lignes dépliées seulement`
      : `${base} ligne(s) dépliée(s)`;
  }
  return filtreActif
    ? `${formatNumber(nbVisibles)} / ${formatNumber(nbLignes)} ligne(s) chargée(s) — filtre sur la page affichée seulement`
    : `${formatNumber(nbLignes)} ligne(s)`;
}

function ariaTri(trie: boolean, sens: 'asc' | 'desc' | undefined): 'ascending' | 'descending' | 'none' {
  if (!trie) return 'none';
  return sens === 'asc' ? 'ascending' : 'descending';
}

function glypheOperateur(type: TypeColonne): string {
  return type === 'TEXTE' ? 'A' : '=';
}

/** Σ d'en-tête : menu de fonctions serveur si `totauxServeur`, sinon bascule du Σ client des lignes chargées. */
function boutonSigma<T>(
  c: ColonneGrille<T>,
  totauxServeur: TotauxServeurGrille | undefined,
  sommeActive: boolean,
  basculerSomme: (nom: string) => void,
): ReactNode {
  if (totauxServeur) {
    const fonctions = totauxServeur.fonctions(c.nom);
    if (fonctions.length === 0) return null;
    return (
      <MenuTotauxColonne
        libelle={c.libelle}
        fonctions={fonctions}
        actives={fonctions.filter((f) => totauxServeur.jetons.includes(jetonAgregat(c.nom, f)))}
        onBasculer={(f) => totauxServeur.basculer(c.nom, f)}
      />
    );
  }
  if (c.sansSomme) return null;
  return (
    <button
      type="button"
      className={cn(
        'shrink-0 rounded px-0.5 hover:bg-muted',
        sommeActive ? 'text-(--brand)' : 'text-muted-foreground/50',
      )}
      onClick={() => basculerSomme(c.nom)}
      title={
        NUMERIQUES.includes(typeDe(c)) ? `Afficher le total de ${c.libelle}` : `Compter les ${c.libelle} renseignés`
      }
      aria-pressed={sommeActive}
    >
      <Sigma className="size-2.75" aria-hidden />
    </button>
  );
}

/** Le bouton « N total(aux) — masquer » compte et vide le Σ en vigueur, serveur ou client. */
function commandeTotaux(
  totauxServeur: TotauxServeurGrille | undefined,
  nbSommes: number,
  viderSommes: () => void,
): { nbTotaux: number; masquerTotaux: () => void } {
  if (totauxServeur) return { nbTotaux: totauxServeur.jetons.length, masquerTotaux: totauxServeur.vider };
  return { nbTotaux: nbSommes, masquerTotaux: viderSommes };
}

function libelleAgregat(a: { colonne: ColonneDto; fonction: FonctionAgregat }): string {
  return a.fonction === 'SUM' ? a.colonne.libelle : `${a.colonne.libelle} (${LIBELLES_FONCTION[a.fonction].toLowerCase()})`;
}

export default function DataGrid<T extends { id: string }>({
  rows,
  colonnes: colonnesRecues,
  cleOrdre,
  onOuvrir,
  libelleLigne,
  minWidth,
  bandeauRegroupement = true,
  selection,
  classeLigne,
  rendreDetail,
  actions,
  groupes,
  totauxServeur,
}: Readonly<{
  rows: T[];
  colonnes: ColonneGrille<T>[];
  /** Absente, l'ordre des colonnes reste déplaçable mais ne vit qu'en mémoire. */
  cleOrdre?: string;
  onOuvrir?: (id: string) => void;
  libelleLigne?: (row: T) => string;
  minWidth?: string;
  /** À couper sur les listes à vrai groupement : elles rendent `BandeGroupement` au
   * niveau de l'écran, pour que la bande (et sa sortie) survive aux états vides. */
  bandeauRegroupement?: boolean;
  /** Sans elle, la gouttière de cases garde un état interne purement visuel. */
  selection?: {
    ids: Set<string>;
    onToggle: (id: string) => void;
    onToggleAll: (ids: string[]) => void;
  };
  classeLigne?: (row: T) => string | undefined;
  rendreDetail?: (row: T) => ReactNode;
  actions?: (row: T) => ReactNode;
  /** Fourni, `rows` est ignoré : les lignes de chaque groupe viennent de `etat`. */
  groupes?: GroupementGrille<T>;
  /** Fourni, remplace le Σ client (lignes chargées) par un menu de fonctions calculées par le serveur
   * sur tout le filtre, affichées dans une bande sous l'en-tête. */
  totauxServeur?: TotauxServeurGrille;
}>) {
  // Un plafond, pas une largeur : en `table-auto`, `max-width` ne mord que sur les colonnes qui dépassent.
  const plafondColonne = (c: ColonneGrille<T>) => `${Math.max(120, (c.largeur ?? 10) * 20)}px`;
  const aDroite = (c: ColonneGrille<T>) => NUMERIQUES.includes(typeDe(c));

  const [filtres, setFiltres] = useState<Record<string, string>>({});
  /* Les champs lisent `filtres` (immédiat), le tableau `filtresDiff` (différé) :
     refiltrer toute la page à chaque frappe bloquerait sinon la saisie. */
  const filtresDiff = useDeferredValue(filtres);
  const [tri, setTri] = useState<{ nom: string; sens: 'asc' | 'desc' } | null>(null);
  const [sommes, setSommes] = useState<Set<string>>(new Set());
  const [cocheesLocales, setCocheesLocales] = useState<Set<string>>(new Set());
  const [courante, setCourante] = useState<string | null>(null);

  const cochees = selection?.ids ?? cocheesLocales;
  const [depliee, setDepliee] = useState<string | null>(null);

  // Le glisser natif ne couvre pas le clavier : d'où `decaler` sur Alt+Flèches.
  const {
    colonnesOrdonnees: colonnes,
    deplacerVers,
    decaler,
    reinitialiser: reinitialiserOrdre,
    personnalise: ordrePersonnalise,
  } = useOrdreColonnes(cleOrdre, colonnesRecues);
  const [glissee, setGlissee] = useState<string | null>(null);
  const [surveeOrdre, setSurveeOrdre] = useState<string | null>(null);

  const parNom = useMemo(() => new Map(colonnes.map((c) => [c.nom, c])), [colonnes]);

  /* Filtre et tri s'appliquent à chaque groupe séparément en mode groupé : un tri
     global réordonnerait les lignes à travers les groupes. */
  const filtrer = useCallback(
    (source: T[]) => {
      const actifs: ((r: T) => boolean)[] = [];
      for (const c of colonnes) {
        const saisie = (filtresDiff[c.nom] ?? '').trim();
        if (saisie !== '') actifs.push(predicatFiltre(c, saisie));
      }
      return actifs.length ? source.filter((r) => actifs.every((p) => p(r))) : source;
    },
    [colonnes, filtresDiff],
  );

  const appliquer = useCallback(
    (source: T[]) => {
      const filtrees = filtrer(source);
      if (!tri) return filtrees;
      const col = parNom.get(tri.nom);
      if (!col) return filtrees;
      const signe = tri.sens === 'asc' ? 1 : -1;
      const numerique = NUMERIQUES.includes(typeDe(col));
      return [...filtrees].sort((a, b) => {
        const va = valeurDe(a, col);
        const vb = valeurDe(b, col);
        // Les vides finissent en bas quel que soit le sens.
        if (va === null || va === undefined || va === '') return 1;
        if (vb === null || vb === undefined || vb === '') return -1;
        if (numerique) return (Number(va) - Number(vb)) * signe;
        return texteBrut(va).localeCompare(texteBrut(vb), 'fr') * signe;
      });
    },
    [filtrer, parNom, tri],
  );

  const visibles = useMemo(() => appliquer(rows), [appliquer, rows]);
  const filtreActif = colonnes.some((c) => (filtresDiff[c.nom] ?? '').trim() !== '');

  // En mode groupé `rows` est vide : Σ et compteur portent sur les lignes des groupes ouverts.
  const lignesDepliees = groupes?.lignesChargees;
  const sommables = useMemo(
    () => (lignesDepliees ? filtrer(lignesDepliees) : visibles),
    [lignesDepliees, filtrer, visibles],
  );

  // Cycle croissant → décroissant → sans tri.
  const basculerTri = (nom: string) =>
    setTri((t) => {
      if (t?.nom !== nom) return { nom, sens: 'asc' };
      return t.sens === 'asc' ? { nom, sens: 'desc' } : null;
    });

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

  const resumes = useMemo(() => {
    const m = new Map<string, string>();
    if (sommes.size === 0) return m;
    for (const c of colonnes) {
      if (sommes.has(c.nom)) m.set(c.nom, resumeColonne(sommables, c));
    }
    return m;
  }, [colonnes, sommes, sommables]);

  const cliquable = Boolean(onOuvrir);

  const nbGouttieres = (rendreDetail ? 3 : 2) + (actions ? 1 : 0);
  const nbColonnes = colonnes.length + nbGouttieres;
  const { nbTotaux, masquerTotaux } = commandeTotaux(totauxServeur, sommes.size, () => setSommes(new Set()));


  const gestionnairesLigne = (id: string) => {
    if (!onOuvrir) return {};
    return {
      onClick: () => {
        setCourante(id);
        onOuvrir(id);
      },
      onKeyDown: (e: KeyboardEvent) => {
        if (e.key === 'Enter') onOuvrir(id);
      },
    };
  };

  const rendreLigne = (r: T) => {
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
          // un lien ne peut pas contenir de contrôle.
          className={cn(
            cliquable && 'cursor-pointer',
            // `classeLigne` avant cochée puis courante : twMerge garde la dernière
            // classe, la sélection doit rester lisible sur une ligne teintée.
            classeLigne?.(r),
            estCochee && 'bg-muted/40 hover:bg-muted/40',
            estCourante && 'bg-(--brand-bg) hover:bg-(--brand-bg)',
          )}
          {...gestionnairesLigne(r.id)}
          onFocus={() => setCourante(r.id)}
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
          {actions && (
            <TableCell
              className="px-1 text-center"
              /* Clic et Entrée arrêtés ici : sinon ils remontent à la ligne et
                 ouvrent la fiche par-dessus le menu. */
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              {actions(r)}
            </TableCell>
          )}
          {colonnes.map((c) => (
            <TableCell
              key={c.nom}
              className={cn('truncate', aDroite(c) && 'text-right tabular-nums', c.classe)}
              style={{ maxWidth: plafondColonne(c) }}
              title={c.titre?.(r)}
            >
              {c.rendu ? c.rendu(r) : (texteParType(valeurDe(r, c), typeDe(c)) ?? TIRET)}
            </TableCell>
          ))}
        </TableRow>
        {rendreDetail && estDepliee && (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={nbColonnes} className="bg-muted/30 py-3 whitespace-normal">
              {rendreDetail(r)}
            </TableCell>
          </TableRow>
        )}
        </Fragment>
      );
  };

  return (
    <div className="flex min-w-0 flex-col">
      {bandeauRegroupement && (
        <div className="flex h-6 shrink-0 items-center gap-1.5 bg-muted/40 px-2 text-micro text-muted-foreground">
          <span className="truncate opacity-70">
            Faites glisser un en-tête de colonne ici pour regrouper par cette colonne
          </span>
          <span className="shrink-0 rounded-full bg-(--amber-bg) px-1.25 font-bold text-(--amber)">Bientôt</span>
        </div>
      )}
      {/* Toujours rendue, vide au repos : la faire apparaître ou disparaître
          décale les lignes de sa hauteur et le clic suivant ouvre une fiche. */}
      <div className="flex h-5 shrink-0 items-center gap-3 border-b border-border/70 bg-card px-2 text-micro text-muted-foreground">
        {(tri !== null || nbTotaux > 0 || cochees.size > 0 || filtreActif || ordrePersonnalise) && (
        <>
          {cochees.size > 0 && <span className="shrink-0">{cochees.size} sélectionnée(s)</span>}
          {tri && (
            <button type="button" className="shrink-0 truncate hover:text-foreground hover:underline" onClick={() => setTri(null)}>
              Tri sur « {parNom.get(tri.nom)?.libelle ?? tri.nom} » — retirer
            </button>
          )}
          {nbTotaux > 0 && (
            <button type="button" className="shrink-0 hover:text-foreground hover:underline" onClick={masquerTotaux}>
              {nbTotaux} total(aux) — masquer
            </button>
          )}
          {ordrePersonnalise && (
            <button type="button" className="shrink-0 hover:text-foreground hover:underline" onClick={reinitialiserOrdre}>
              Ordre des colonnes modifié — rétablir
            </button>
          )}
          <span className="ml-auto shrink-0 tabular-nums">
            {compteurLignes(
              groupes ? { nbGroupes: groupes.liste.length, nbChargees: groupes.lignesChargees.length } : null,
              filtreActif,
              groupes ? sommables.length : visibles.length,
              rows.length,
            )}
          </span>
        </>
        )}
      </div>
      <Table
        className="w-max min-w-full table-auto"
        // Le défilement appartient au conteneur de la page : lui seul a une hauteur
        // bornée, donc une barre horizontale visible et une référence pour `sticky`.
        containerClassName="overflow-visible"
        style={minWidth ? { minWidth } : undefined}
      >
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {/* Gouttières volontairement non figées à gauche : il faudrait un fond opaque
                par cellule, donc rejouer à la main les teintes de ligne courante et de pied. */}
            {rendreDetail && <TableHead className="sticky top-0 z-10 w-(--gutter-check) bg-(--surface-hover) p-0" aria-label="Deplier" />}
            <TableHead className="sticky top-0 z-10 w-(--gutter-mark) bg-(--surface-hover) p-0" aria-label="Ligne courante" />
            <TableHead className="sticky top-0 z-10 w-(--gutter-check) bg-(--surface-hover) px-0 text-center">
              <input
                type="checkbox"
                className="size-3 cursor-pointer align-middle accent-(--brand)"
                checked={toutesCochees}
                onChange={basculerToutes}
                aria-label={toutesCochees ? 'Tout décocher' : 'Tout cocher'}
              />
            </TableHead>
            {actions && (
              <TableHead className="sticky top-0 z-10 bg-(--surface-hover) px-1 text-center whitespace-nowrap">
                Actions
              </TableHead>
            )}
            {colonnes.map((c, iCol) => {
              const trie = tri?.nom === c.nom;
              /* Vers la droite, le dépôt se fait après la colonne survolée, vers la gauche
                 avant (retrait puis réinsertion) : le trait d'insertion doit suivre. */
              const iGlissee = glissee ? colonnes.findIndex((x) => x.nom === glissee) : -1;
              const estCible = !!glissee && glissee !== c.nom && surveeOrdre === c.nom;
              const versLaDroite = iGlissee !== -1 && iGlissee < iCol;
              return (
                <TableHead
                  key={c.nom}
                  // `sticky` sur les cellules, pas la ligne : en `border-collapse` (preflight
                  // Tailwind) Chrome ignore un `sticky` sur `<tr>`. D'où un fond opaque par `<th>`.
                  className={cn(
                    'sticky top-0 z-10 bg-(--surface-hover) whitespace-nowrap cursor-grab',
                    glissee === c.nom && 'cursor-grabbing opacity-50',
                    // Ombre interne et non bordure : une bordure ferait tressauter la grille au survol.
                    estCible &&
                      (versLaDroite
                        ? 'shadow-[inset_-2px_0_0_0_var(--brand)]'
                        : 'shadow-[inset_2px_0_0_0_var(--brand)]'),
                  )}
                  style={{ maxWidth: plafondColonne(c) }}
                  aria-sort={ariaTri(trie, tri?.sens)}
                  draggable
                  onDragStart={(ev) => {
                    setGlissee(c.nom);
                    // Firefox n'amorce pas de glissement sans charge utile.
                    ev.dataTransfer.effectAllowed = 'move';
                    ev.dataTransfer.setData('text/plain', c.nom);
                  }}
                  onDragOver={(ev) => {
                    if (!glissee) return;
                    // Sans `preventDefault`, la cellule n'est pas une cible de dépôt.
                    ev.preventDefault();
                    ev.dataTransfer.dropEffect = 'move';
                    setSurveeOrdre(c.nom);
                  }}
                  onDrop={(ev) => {
                    ev.preventDefault();
                    const nom = glissee ?? ev.dataTransfer.getData('text/plain');
                    if (nom) deplacerVers(nom, c.nom);
                    setGlissee(null);
                    setSurveeOrdre(null);
                  }}
                  onDragEnd={() => {
                    setGlissee(null);
                    setSurveeOrdre(null);
                  }}
                >
                  <span className={cn('flex items-center gap-1', aDroite(c) && 'justify-end')}>
                    <button
                      type="button"
                      className="min-w-0 whitespace-nowrap hover:underline"
                      onClick={() => basculerTri(c.nom)}
                      /* Alt et non les flèches nues : celles-ci servent à parcourir les en-têtes. */
                      onKeyDown={(ev) => {
                        if (!ev.altKey) return;
                        if (ev.key === 'ArrowLeft') {
                          ev.preventDefault();
                          decaler(c.nom, -1);
                        } else if (ev.key === 'ArrowRight') {
                          ev.preventDefault();
                          decaler(c.nom, 1);
                        }
                      }}
                      title={`Trier par ${c.libelle} — glisser l'en-tête, ou Alt+← / Alt+→, pour déplacer la colonne`}
                    >
                      {c.libelle}
                    </button>
                    {trie &&
                      (tri.sens === 'asc' ? (
                        <ChevronUp className="size-3 shrink-0 text-(--brand)" aria-hidden />
                      ) : (
                        <ChevronDown className="size-3 shrink-0 text-(--brand)" aria-hidden />
                      ))}
                    {boutonSigma(c, totauxServeur, sommes.has(c.nom), basculerSomme)}
                  </span>
                </TableHead>
              );
            })}
          </TableRow>
          <TableRow className="hover:bg-transparent">
            {rendreDetail && <TableHead className="h-(--row-h-filter) w-(--gutter-check) bg-card p-0" />}
            <TableHead className="h-(--row-h-filter) w-(--gutter-mark) bg-card p-0" />
            <TableHead className="h-(--row-h-filter) w-(--gutter-check) bg-card p-0" />
            {actions && <TableHead className="h-(--row-h-filter) bg-card p-0" />}
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
          {totauxServeur && (
            <BandeTotauxServeur
              totaux={totauxServeur}
              colonnes={colonnes}
              gouttieres={nbGouttieres}
              nbColonnes={nbColonnes}
              plafond={plafondColonne}
              aDroite={aDroite}
            />
          )}
        </TableHeader>
        <TableBody>
          {groupes
            ? groupes.liste.map((g) => {
                const ouvert = groupes.estOuvert(g);
                const etat = groupes.etat(g);
                const lignes = etat ? appliquer(etat.lignes) : [];
                const reste = etat ? etat.total - etat.lignes.length : 0;
                return (
                  <Fragment key={identiteGroupe(g)}>
                    {/* Pleine largeur : aligner les totaux sous leurs colonnes supposerait
                        que celles-ci soient affichées, ce qu'une colonne décochée dément. */}
                    <TableRow
                      className="cursor-pointer bg-muted/60 hover:bg-muted"
                      tabIndex={0}
                      aria-expanded={ouvert}
                      aria-label={`${ouvert ? 'Replier' : 'Déplier'} le groupe ${libelleGroupeAffiche(g, groupes.libelleGroupe)} — ${g.nombre} ligne(s)`}
                      onClick={() => groupes.basculer(g)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') groupes.basculer(g);
                      }}
                    >
                      <TableCell colSpan={nbColonnes} className="whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          {ouvert ? (
                            <SquareMinus aria-hidden className="size-3 shrink-0 text-(--brand)" />
                          ) : (
                            <SquarePlus aria-hidden className="size-3 shrink-0 text-muted-foreground" />
                          )}
                          <span className="shrink-0 text-muted-foreground">{groupes.colonneLibelle} :</span>
                          <span
                            className={cn(
                              'truncate font-semibold',
                              /* Le groupe sans valeur est légitime : sans lui la somme
                                 des effectifs ne retomberait pas sur le total. */
                              g.libelle === null ? 'font-normal text-muted-foreground italic' : 'text-foreground',
                            )}
                          >
                            {libelleGroupeAffiche(g, groupes.libelleGroupe)}
                          </span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">
                            ({formatNumber(g.nombre)} item{g.nombre > 1 ? 's' : ''})
                          </span>
                          {groupes.agregats.length > 0 && (
                            <span className="flex shrink-0 items-center gap-3 pl-4 text-micro">
                              {groupes.agregats.map((a) => (
                                <span key={a.jeton}>
                                  <span className="text-muted-foreground">{libelleAgregat(a)} : </span>
                                  <span className="font-semibold tabular-nums">
                                    {formatAgregat(
                                      g.agregats?.[a.jeton],
                                      parNom.get(a.colonne.nom)?.formatValeur,
                                      a.fonction,
                                      a.colonne.type,
                                    )}
                                  </span>
                                </span>
                              ))}
                            </span>
                          )}
                        </span>
                      </TableCell>
                    </TableRow>
                    {ouvert && lignes.map(rendreLigne)}
                    {ouvert && etat?.erreur && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={nbColonnes} className="text-destructive">
                          {etat.erreur}
                        </TableCell>
                      </TableRow>
                    )}
                    {ouvert && etat?.chargement && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={nbColonnes} className="text-muted-foreground">
                          Chargement…
                        </TableCell>
                      </TableRow>
                    )}
                    {ouvert && !etat?.chargement && reste > 0 && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={nbColonnes}>
                          <button
                            type="button"
                            className="text-micro text-(--brand) hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              groupes.chargerPlus(g);
                            }}
                          >
                            {formatNumber(reste)} ligne(s) de plus dans ce groupe — en charger{' '}
                            {formatNumber(Math.min(reste, TAILLE_LOT_GROUPE))}
                          </button>
                        </TableCell>
                      </TableRow>
                    )}
                    {ouvert && !etat?.chargement && etat && etat.lignes.length === 0 && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={nbColonnes} className="text-muted-foreground">
                          Ce groupe ne contient aucune ligne avec les filtres actifs.
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
            : visibles.map(rendreLigne)}
          {/* Total serveur sur tout le périmètre filtré, distinct du pied Σ (lignes chargées) :
              chacun porte son étiquette, sinon les deux nombres se contrediraient. */}
          {groupes && groupes.agregats.length > 0 && (
            <TableRow className="border-t border-border bg-(--surface-hover) hover:bg-(--surface-hover)">
              <TableCell colSpan={nbColonnes} className="whitespace-nowrap">
                <span className="flex items-center gap-3 text-micro">
                  <span className="shrink-0 font-semibold">
                    Total sur {formatNumber(groupes.nombreTotal)} ligne(s)
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    {groupes.agregats.map((a) => (
                      <span key={a.jeton}>
                        <span className="text-muted-foreground">{libelleAgregat(a)} : </span>
                        <span className="font-semibold tabular-nums">
                          {formatAgregat(
                            groupes.totaux[a.jeton],
                            parNom.get(a.colonne.nom)?.formatValeur,
                            a.fonction,
                            a.colonne.type,
                          )}
                        </span>
                      </span>
                    ))}
                  </span>
                </span>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        {sommes.size > 0 && (
          <TableFooter>
            <TableRow className="hover:bg-muted/50">
              {rendreDetail && <TableCell className="w-(--gutter-check) p-0" />}
              <TableCell className="w-(--gutter-mark) p-0" />
              <TableCell className="w-(--gutter-check) p-0" />
              {actions && <TableCell className="px-1" />}
              {colonnes.map((c) => (
                <TableCell
                  key={c.nom}
                  className={cn('truncate text-micro', aDroite(c) && 'text-right tabular-nums')}
                  style={{ maxWidth: plafondColonne(c) }}
                >
                  {resumes.get(c.nom) ?? null}
                </TableCell>
              ))}
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}
