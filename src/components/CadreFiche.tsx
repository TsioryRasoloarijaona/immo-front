import type { ComponentProps, ReactNode } from 'react';
import PageShell from './PageShell';
import { Badge } from './ui';

/** Où une fiche est rendue : dans sa page, ou dans un dialogue ouvert
 * par-dessus un autre écran (le tableau de bord). */
export type VarianteFiche = 'page' | 'dialogue';

/**
 * Le cadre d'une fiche de détail, pour qu'une même fiche serve à la fois de
 * page et de contenu de dialogue. Le haut tient en **deux lignes** :
 *
 * 1. `entete` — l'identité (code, nom, statut, badges d'état). En page, dans
 *    l'en-tête de `PageShell` après le fil d'Ariane ; en dialogue, à la place
 *    de la barre de titre du `Modal` (`titreMasque`).
 * 2. `parcours` à gauche, `actions` à droite. Sans parcours, les actions
 *    remontent sur la ligne 1 — l'en-tête de page, ou la ligne d'identité du
 *    dialogue — et la ligne 2 n'existe pas.
 *
 * Le corps est un conteneur flex à hauteur bornée : `FicheShell` est en
 * `h-full` et compte dessus pour que seul l'onglet actif défile. C'est au
 * dialogue de fournir cette hauteur (`Modal pleineHauteur`).
 */
export default function CadreFiche({
  variante = 'page',
  entete,
  parcours,
  typeFiche,
  actions,
  children,
  ...props
}: ComponentProps<typeof PageShell> & {
  variante?: VarianteFiche;
  /** Ligne 2, à gauche des actions. */
  parcours?: ReactNode;
  /** Type de fiche (« Dossier de vente », « Prospection »…), petit libellé gris
   * en tête de ligne 1 en dialogue : le titre du `Modal` qui le portait est masqué. */
  typeFiche?: string;
}) {
  const ligneParcours = parcours ? (
    <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2">
      {parcours}
      {actions && <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">{actions}</div>}
    </div>
  ) : null;

  if (variante === 'page') {
    return (
      <PageShell {...props} entete={entete} actions={parcours ? undefined : actions}>
        {ligneParcours ? (
          <div className="flex min-h-0 flex-1 flex-col gap-2.5">
            {ligneParcours}
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          </div>
        ) : (
          children
        )}
      </PageShell>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5">
      {/* `pr-8` : la croix de fermeture du dialogue est posée en absolu dans ce coin. */}
      <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 pr-8">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          {typeFiche && entete && <span className="text-micro font-medium text-muted-foreground">{typeFiche}</span>}
          {entete ??<h2 className="text-title font-semibold text-foreground">{props.title}</h2>}
        </div>
        {!parcours && actions && <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">{actions}</div>}
      </div>
      {ligneParcours}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

/** Le contenu type de la ligne d'identité : code, nom, puis les pastilles
 * propres à la fiche (`children`). */
export function EnteteFiche({
  code,
  aideCode,
  nom,
  children,
}: {
  code?: string | null;
  /** Infobulle du code — portée par un `span`, le badge n'accepte pas de `title`. */
  aideCode?: string;
  nom: ReactNode;
  children?: ReactNode;
}) {
  return (
    <>
      {code && (
        <span className="inline-flex" title={aideCode}>
          <Badge tone="neutral" className="font-mono">{code}</Badge>
        </span>
      )}
      <h2 className="min-w-0 truncate text-title font-semibold text-foreground">{nom}</h2>
      {children}
    </>
  );
}
