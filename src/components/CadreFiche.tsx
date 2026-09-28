import type { ComponentProps } from 'react';
import PageShell from './PageShell';

/** Où une fiche est rendue : dans sa page, ou dans un dialogue ouvert
 * par-dessus un autre écran (le tableau de bord). */
export type VarianteFiche = 'page' | 'dialogue';

/**
 * Le cadre d'une fiche de détail, pour qu'une même fiche serve à la fois de
 * page et de contenu de dialogue.
 *
 * En `page` c'est `PageShell`, props inchangées. En `dialogue` il n'en reste
 * que ce qui a un sens hors de la page : la barre d'actions et le corps. Le
 * titre, l'icône et le fil d'Ariane sont abandonnés — le dialogue porte son
 * propre titre, et un fil d'Ariane y serait une invitation à quitter l'écran
 * qu'on a justement voulu garder.
 *
 * Le corps est un conteneur flex à hauteur bornée : `FicheShell` est en
 * `h-full` et compte dessus pour que seul l'onglet actif défile. C'est au
 * dialogue de fournir cette hauteur (`Modal pleineHauteur`).
 */
export default function CadreFiche({
  variante = 'page',
  ...props
}: ComponentProps<typeof PageShell> & { variante?: VarianteFiche }) {
  if (variante === 'page') return <PageShell {...props} />;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5">
      {props.actions && <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{props.actions}</div>}
      <div className="flex min-h-0 flex-1 flex-col">{props.children}</div>
    </div>
  );
}
