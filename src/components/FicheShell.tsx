import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { cn } from '../lib/utils';
import { useOngletsMasques } from '../lib/useOngletsMasques';

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
  rembourrer,
}: Readonly<{
  identite?: ReactNode;
  formulaire?: ReactNode;
  panneau?: ReactNode;
  onglets: OngletFiche[];
  ongletActif: string;
  onOngletChange: (id: string) => void;
  barreAction?: ReactNode;
  /** Marge intérieure des onglets, pour des contenus qui n'en ont pas (ceux du dossier gèrent la leur). */
  rembourrer?: boolean;
}>) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-y-auto">
      {identite && <div className="shrink-0">{identite}</div>}

      {panneau ? (
        /* `min-w-0` des deux côtés : un tableau de montants large élargirait sinon la colonne. */
        <div className="grid shrink-0 items-stretch gap-2 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="min-w-0">{formulaire}</div>
          <div className="min-w-0">{panneau}</div>
        </div>
      ) : (
        formulaire && <div className="shrink-0">{formulaire}</div>
      )}

      {barreAction && <div className="shrink-0">{barreAction}</div>}

      {/* Au moins 45 % de la fenêtre pour les onglets, quelle que soit la hauteur du bloc du haut (le shell défile alors). */}
      <Tabs
        value={ongletActif}
        onValueChange={onOngletChange}
        className="flex min-h-[45dvh] min-w-0 flex-1 flex-col gap-2"
      >
        <OngletsLigne onglets={onglets} onChoisir={onOngletChange} />

        {onglets.map((o) => (
          <TabsContent
            key={o.id}
            value={o.id}
            /* `min-w-0` en plus de `min-h-0` : un tableau large remonterait sinon la
               chaîne flex et élargirait la page au lieu de défiler. */
            className={cn('min-h-0 min-w-0 flex-1 overflow-auto rounded-xl border border-border bg-card', rembourrer && 'p-2.5')}
          >
            {o.contenu}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

type OngletLigne = Pick<OngletFiche, 'id' | 'libelle' | 'compteur'>;

function Compteur({ valeur }: Readonly<{ valeur: number }>) {
  return (
    <span
      className={cn(
        'text-micro tabular-nums',
        valeur === 0 ? 'font-normal text-muted-foreground/70' : 'rounded-full bg-secondary px-1.5 font-medium text-foreground',
      )}
    >
      {valeur}
    </span>
  );
}

/**
 * À poser dans un `Tabs` : `TabsList` en lit le contexte. Avec `onChoisir`, les onglets qui ne tiennent pas sur la
 * ligne passent dans un menu « Plus… » ; sans, la ligne défile en largeur.
 */
export function OngletsLigne({
  onglets,
  onChoisir,
}: Readonly<{ onglets: OngletLigne[]; onChoisir?: (id: string) => void }>) {
  const [ligne, masques] = useOngletsMasques(
    !!onChoisir,
    onglets.map((o) => `${o.id}:${o.libelle}:${o.compteur ?? ''}`).join('|'),
  );
  const caches = onglets.filter((o) => masques.includes(o.id));
  return (
    <div ref={ligne} className="relative flex w-full shrink-0 items-center border-b border-border">
      <TabsList
        variant="line"
        className={cn(
          'min-w-0 flex-1 justify-start gap-4 rounded-none p-0 group-data-horizontal/tabs:h-9',
          onChoisir ? 'overflow-hidden' : 'overflow-x-auto',
        )}
      >
        {onglets.map((o) => (
          <TabsTrigger
            key={o.id}
            value={o.id}
            data-onglet={o.id}
            className={cn(
              /* `ring-inset` : la liste défile en largeur et rognerait un anneau extérieur. */
              'h-full flex-none rounded-none px-0.5 text-body after:bg-(--brand) group-data-horizontal/tabs:after:bottom-0 focus-visible:ring-inset data-active:font-semibold',
              o.compteur === 0 && 'text-muted-foreground/70',
              masques.includes(o.id) && 'invisible',
            )}
          >
            {o.libelle}
            {o.compteur !== undefined && <Compteur valeur={o.compteur} />}
          </TabsTrigger>
        ))}
      </TabsList>
      {onChoisir && caches.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-7 shrink-0 items-center gap-0.5 rounded px-1.5 text-body text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50">
            Plus…
            <ChevronDown className="size-3" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-auto min-w-44">
            {caches.map((o) => (
              <DropdownMenuItem key={o.id} onClick={() => onChoisir(o.id)}>
                {o.libelle}
                {o.compteur !== undefined && <Compteur valeur={o.compteur} />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export function LigneActivite({ children, action }: Readonly<{ children?: ReactNode; action?: ReactNode }>) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-body text-muted-foreground">
      {children}
      {action && <div className="ml-auto flex shrink-0 items-center gap-1.5">{action}</div>}
    </div>
  );
}

export function ElementResume({ libelle, children }: Readonly<{ libelle: string; children: ReactNode }>) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5">
      {libelle}
      <span className="font-medium text-foreground">{children}</span>
    </span>
  );
}
