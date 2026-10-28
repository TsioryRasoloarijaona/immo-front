import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export type TypeChamp = 'texte' | 'montant' | 'liste' | 'case';

/** Grille à deux colonnes de la bande d'identité (ou d'une page du classeur d'en-tête). */
export function BandeFiche({ children, className }: Readonly<{ children: ReactNode; className?: string }>) {
  return <div className={cn('grid grid-cols-2 content-start gap-x-4 gap-y-1.5', className)}>{children}</div>;
}

function estVide(valeur: ReactNode): boolean {
  return valeur === null || valeur === undefined || valeur === '' || valeur === '—';
}

/**
 * Champ en lecture seule : libellé (104 px) + zone de 24 px. Les modifications passent par les boutons du ruban.
 * `lien` rend la valeur en lien ; `case` attend un booléen.
 */
export default function ChampFiche({
  libelle,
  valeur,
  type = 'texte',
  lien,
  large,
}: Readonly<{
  libelle: string;
  valeur: ReactNode;
  type?: TypeChamp;
  lien?: string;
  /** Texte long : le champ prend toute la largeur de la grille. */
  large?: boolean;
}>) {
  const vide = estVide(valeur);
  let contenu: ReactNode = '—';
  if (type === 'case') {
    contenu = <input type="checkbox" checked={valeur === true} disabled readOnly aria-label={libelle} className="size-3.5 accent-(--brand)" />;
  } else if (!vide && typeof valeur !== 'boolean') {
    contenu = lien ? (
      <Link to={lien} className="truncate text-(--info) hover:underline" title={`Ouvrir : ${libelle}`}>
        {valeur}
      </Link>
    ) : (
      valeur
    );
  }
  const debordement = large ? 'max-h-24 overflow-y-auto py-0.5 whitespace-pre-wrap' : 'truncate';
  const zone = cn(
    type === 'case'
      ? 'flex h-6 items-center'
      : ['flex min-h-6 min-w-0 items-center gap-1.5 rounded border border-border bg-background px-2 text-body text-foreground', debordement],
    type === 'montant' && 'justify-end tabular-nums',
    vide && type !== 'case' && 'text-muted-foreground',
  );
  return (
    <div className={cn('grid min-w-0 grid-cols-[104px_minmax(0,1fr)] items-center gap-2', large && 'col-span-full items-start')}>
      <span className="truncate text-body text-muted-foreground" title={libelle}>
        {libelle}
      </span>
      <div className={zone} title={typeof valeur === 'string' && !large ? valeur : undefined}>
        {contenu}
        {type === 'liste' && <ChevronDown aria-hidden className="ml-auto size-3 shrink-0 text-muted-foreground" />}
      </div>
    </div>
  );
}
