import type { ComponentProps, ReactNode } from 'react';
import PageShell from './PageShell';
import { Badge } from './ui';

export type VarianteFiche = 'page' | 'dialogue';

/** `FicheShell` (en `h-full`) compte sur un corps à hauteur bornée pour que seul
 * l'onglet actif défile : en dialogue, c'est `Modal pleineHauteur` qui la fournit. */
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
  parcours?: ReactNode;
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

export function EnteteFiche({
  code,
  aideCode,
  nom,
  children,
}: Readonly<{
  code?: string | null;
  /** Infobulle du code — portée par un `span`, le badge n'accepte pas de `title`. */
  aideCode?: string;
  nom: ReactNode;
  children?: ReactNode;
}>) {
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
