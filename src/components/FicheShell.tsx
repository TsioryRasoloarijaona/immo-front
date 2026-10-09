import type { ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { cn } from '../lib/utils';

export type OngletFiche = {
  id: string;
  libelle: string;
  /** `undefined` : pas de pastille ; `0` : onglet atténué. */
  compteur?: number;
  contenu: ReactNode;
};

/** Seul le contenu d'onglet défile, jamais le document : `fullHeight` sur `PageShell` côté
 * appelant, et `min-h-0` sur toute la chaîne flex, sans quoi un enfant refuse de rétrécir
 * et repousse le bas de la page hors de l'écran. */
export default function FicheShell({
  identite,
  formulaire,
  panneau,
  onglets,
  ongletActif,
  onOngletChange,
  barreAction,
}: {
  identite?: ReactNode;
  formulaire: ReactNode;
  panneau?: ReactNode;
  onglets: OngletFiche[];
  ongletActif: string;
  onOngletChange: (id: string) => void;
  barreAction?: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5">
      {identite && <div className="shrink-0">{identite}</div>}

      {panneau ? (
        /* `min-w-0` des deux côtés : un tableau de montants large élargirait sinon la colonne. */
        <div className="grid shrink-0 items-stretch gap-2.5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="min-w-0">{formulaire}</div>
          <div className="min-w-0">{panneau}</div>
        </div>
      ) : (
        <div className="shrink-0">{formulaire}</div>
      )}

      {barreAction && <div className="shrink-0">{barreAction}</div>}

      <Tabs
        value={ongletActif}
        onValueChange={onOngletChange}
        className="flex min-h-0 min-w-0 flex-1 flex-col gap-2"
      >
        <OngletsLigne onglets={onglets} />

        {onglets.map((o) => (
          <TabsContent
            key={o.id}
            value={o.id}
            /* `min-w-0` en plus de `min-h-0` : un tableau large remonterait sinon la
               chaîne flex et élargirait la page au lieu de défiler. */
            className="min-h-0 min-w-0 flex-1 overflow-auto rounded-xl border border-border bg-card"
          >
            {o.contenu}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

// À poser dans un `Tabs` : `TabsList` en lit le contexte.
export function OngletsLigne({ onglets }: { onglets: Pick<OngletFiche, 'id' | 'libelle' | 'compteur'>[] }) {
  return (
    <TabsList
      variant="line"
      className="w-full max-w-full shrink-0 justify-start gap-4 overflow-x-auto rounded-none border-b border-border p-0 group-data-horizontal/tabs:h-9"
    >
      {onglets.map((o) => {
        const vide = o.compteur === 0;
        return (
          <TabsTrigger
            key={o.id}
            value={o.id}
            className={cn(
              /* `ring-inset` : la liste défile en largeur et rognerait un anneau extérieur. */
              'h-full flex-none rounded-none px-0.5 text-body after:bg-(--brand) group-data-horizontal/tabs:after:bottom-0 focus-visible:ring-inset data-active:font-semibold',
              vide && 'text-muted-foreground/70',
            )}
          >
            {o.libelle}
            {o.compteur !== undefined && (
              <span
                className={cn(
                  'text-micro tabular-nums',
                  vide ? 'font-normal text-muted-foreground/70' : 'rounded-full bg-secondary px-1.5 font-medium text-foreground',
                )}
              >
                {o.compteur}
              </span>
            )}
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
}

export function LigneActivite({ children, action }: { children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-body text-muted-foreground">
      {children}
      {action && <div className="ml-auto flex shrink-0 items-center gap-1.5">{action}</div>}
    </div>
  );
}

export function ElementResume({ libelle, children }: { libelle: string; children: ReactNode }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5">
      {libelle}
      <span className="font-medium text-foreground">{children}</span>
    </span>
  );
}
