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

const ETIQUETTE = 'mb-0.5 flex items-center gap-1 text-micro font-medium text-muted-foreground';

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
}: {
  label: string;
  valeur: ReactNode;
  aide?: string;
  className?: string;
}) {
  const vide = valeur === null || valeur === undefined || valeur === '' || valeur === '—';
  return (
    <Enveloppe label={label} verrouille aide={aide} className={className}>
      <div
        className={cn(
          'min-h-7 truncate py-1 text-label',
          vide ? 'font-normal text-muted-foreground' : 'font-medium text-foreground',
        )}
        title={typeof valeur === 'string' ? valeur : undefined}
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

/** Les notes d'Omran occupent un pavé de quatre lignes en bas à gauche du
 * formulaire, et c'est le champ le plus rempli de la fiche — 100 % sur
 * l'échantillon. Il garde sa place et sa taille. */
export function ChampNotes({
  id,
  label,
  valeur,
  onChange,
  modifie,
  lignes = 4,
  className,
}: {
  id: string;
  label: string;
  valeur: string;
  onChange: (v: string) => void;
  modifie?: boolean;
  lignes?: number;
  className?: string;
}) {
  return (
    <Enveloppe label={label} htmlFor={id} modifie={modifie} className={className}>
      <Textarea
        id={id}
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        rows={lignes}
        className="resize-none text-label"
      />
    </Enveloppe>
  );
}

/** Grille du formulaire. Quatre colonnes sur grand écran là où Omran en tient
 * deux : le libellé au-dessus libère la largeur, et une fiche qui tenait en
 * sept lignes de deux champs en tient quatre de quatre. C'est ce qui laisse la
 * place aux onglets sous la ligne de flottaison. */
export function GrilleFiche({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-x-3 gap-y-2 md:grid-cols-3 xl:grid-cols-4',
        className,
      )}
    >
      {children}
    </div>
  );
}
