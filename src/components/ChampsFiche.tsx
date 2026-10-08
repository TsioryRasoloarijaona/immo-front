import type { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import RefSelect from './RefSelect';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { cn } from '../lib/utils';

/* Cellules de formulaire de fiche.
 *
 * Le logiciel de bureau pose son libellé **à gauche** du champ, en colonne
 * alignée. On garde l'alignement — c'est lui qui rend la grille lisible d'un
 * coup d'œil — mais le libellé passe **au-dessus**, en `--text-micro` : à
 * largeur de fenêtre égale, la colonne de libellés d'Omran mange un tiers de
 * la ligne, et c'est ce tiers qui manquait pour tenir en une page.
 *
 * L'état modifié est porté par un liseré gauche et non par un fond coloré :
 * Omran teinte ses champs éditables en jaune, ce qui à quinze champs revient à
 * teinter tout l'écran et ne distingue plus rien. Ici seul ce qui a **changé**
 * se signale, et rien d'autre. */

/* Colonnes restantes de la dernière ligne de `GrilleFiche` (2 / 4 colonnes),
   indexées par le nombre de cellules posées avant. Classes littérales : Tailwind
   ne voit pas les classes calculées. */
const RESTE_BASE = ['col-span-2', 'col-span-1'];
const RESTE_LG = ['lg:col-span-4', 'lg:col-span-3', 'lg:col-span-2', 'lg:col-span-1'];
function classeReste(apres: number | undefined) {
  return apres === undefined ? undefined : cn(RESTE_BASE[apres % 2], RESTE_LG[apres % 4]);
}

const ETIQUETTE ='mb-0.5 flex items-center gap-1 text-micro font-medium text-muted-foreground';

function Enveloppe({
  label,
  htmlFor,
  modifie,
  verrouille,
  aide,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  modifie?: boolean;
  verrouille?: boolean;
  aide?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'min-w-0 border-l-2 pl-2 transition-colors',
        modifie ? 'border-l-(--warning)' : 'border-l-transparent',
        className,
      )}
    >
      <label className={ETIQUETTE} htmlFor={htmlFor} title={aide}>
        {label}
        {verrouille && <Lock aria-hidden className="size-2.5 shrink-0 opacity-60" />}
        {modifie && <span className="text-(--warning)">•</span>}
      </label>
      {children}
    </div>
  );
}

/** Champ non modifiable — soit qu'aucun endpoint ne l'expose (`ancienClient`,
 * le commercial), soit qu'il soit calculé (le code, la société dérivée de la
 * tranche). Le cadenas dit *pourquoi* c'est gris, ce qu'un simple champ
 * désactivé ne dit pas. */
export function ChampLecture({
  label,
  valeur,
  aide,
  className,
  apres,
  multiligne,
}: {
  label: string;
  valeur: ReactNode;
  aide?: string;
  className?: string;
  /** Nombre de cellules posées avant celle-ci : elle prend alors les colonnes
   * restantes de la ligne (champ long en fin de grille). */
  apres?: number;
  /** Texte long : replié sur plusieurs lignes (défilant au-delà de quatre)
   * au lieu d'être tronqué. */
  multiligne?: boolean;
}) {
  const vide = valeur === null || valeur === undefined || valeur === '' || valeur === '—';
  return (
    <Enveloppe label={label} verrouille aide={aide} className={cn(classeReste(apres), className)}>
      <div
        className={cn(
          'min-h-7 py-1 text-label',
          multiligne ? 'max-h-24 overflow-y-auto whitespace-pre-wrap' : 'truncate',
          vide ? 'font-normal text-muted-foreground' : 'font-medium text-foreground',
        )}
        title={typeof valeur === 'string' && !multiligne ? valeur : undefined}
      >
        {vide ? '—' : valeur}
      </div>
    </Enveloppe>
  );
}

/** Champ adossé à un référentiel. Le gros du formulaire : origine, support,
 * vocation, type de contact, action commerciale, étape. */
export function ChampRef({
  id,
  label,
  valeur,
  onChange,
  items,
  modifie,
  aide,
  className,
}: {
  id: string;
  label: string;
  valeur: string | null;
  onChange: (v: string | null) => void;
  items: { label: string; value: string }[];
  modifie?: boolean;
  aide?: string;
  className?: string;
}) {
  return (
    <Enveloppe label={label} htmlFor={id} modifie={modifie} aide={aide} className={className}>
      <RefSelect id={id} value={valeur} onChange={onChange} items={items} size="sm" />
    </Enveloppe>
  );
}

export function ChampTexte({
  id,
  label,
  valeur,
  onChange,
  modifie,
  aide,
  placeholder,
  className,
}: {
  id: string;
  label: string;
  valeur: string;
  onChange: (v: string) => void;
  modifie?: boolean;
  aide?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Enveloppe label={label} htmlFor={id} modifie={modifie} aide={aide} className={className}>
      <Input id={id} value={valeur} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-7" />
    </Enveloppe>
  );
}

/** Le champ le plus rempli de la fiche (100 % sur l'échantillon). Il démarre
 * sur une ligne, grandit avec son contenu jusqu'à quatre puis défile : le
 * texte reste entier sans réserver un pavé vide sur les fiches courtes. */
export function ChampNotes({
  id,
  label,
  valeur,
  onChange,
  modifie,
  lignes = 1,
  className,
  apres,
}: {
  id: string;
  label: string;
  valeur: string;
  onChange: (v: string) => void;
  modifie?: boolean;
  lignes?: number;
  className?: string;
  /** Voir `ChampLecture`. */
  apres?: number;
}) {
  return (
    <Enveloppe label={label} htmlFor={id} modifie={modifie} className={cn(classeReste(apres), className)}>
      <Textarea
        id={id}
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        rows={lignes}
        className="max-h-24 min-h-7 resize-none overflow-y-auto py-1 text-label md:text-label"
      />
    </Enveloppe>
  );
}

/** Grille du formulaire : **une seule**, quatre colonnes (deux en écran
 * étroit), lignes complètes — pas de troisième palier, qui cassait le compte
 * des lignes et laissait des trous. Un champ long prend les colonnes restantes
 * de la dernière ligne (`col-span-*` côté appelant). */
export function GrilleFiche({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-x-4 gap-y-2 lg:grid-cols-4',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** La petite ligne grise de pied de carte : ce que la ligne d'identité ne
 * reprend pas (date de création, commercial…), pour ne rien perdre sans
 * répéter quatre champs en tête de grille. */
export function PiedFiche({ children }: { children: ReactNode }) {
  return (
    <p className="col-span-full flex flex-wrap items-center gap-x-1.5 gap-y-0.5 pt-0.5 text-micro text-muted-foreground">
      {children}
    </p>
  );
}
