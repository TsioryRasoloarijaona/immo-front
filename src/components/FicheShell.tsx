import type { ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { cn } from '../lib/utils';

export type OngletFiche = {
  id: string;
  libelle: string;
  /** Pastille de comptage à droite du libellé. `undefined` n'en affiche pas —
   * distinct de `0`, qui en affiche une à zéro. */
  compteur?: number;
  contenu: ReactNode;
};

/** Disposition commune aux fiches prospection, pré-prospection, dossier et
 * encaissement : un formulaire dense, puis une zone à onglets. L'identité et
 * les actions sont au-dessus, dans les deux lignes de `CadreFiche` ; le haut
 * vise ~35 % de la hauteur, le bas ~65 % (voir docs/FEATURE-fiche-equilibre.md).
 * Le tout **tient dans une page** — le commercial lit et corrige sans jamais
 * faire défiler la fiche.
 *
 * Le premier onglet porte l'**état** du document — parcours de statut sur un
 * dossier, étape du pipeline sur une prospection — et s'ouvre par défaut. Le
 * loger dans un onglet lui rend la ligne qu'il occupait en permanence dans la
 * bande d'identité sans être toujours relu : utile les premiers jours d'un
 * dossier, jamais ensuite.
 *
 * Il reste **sous** le formulaire, et pas au-dessus : la zone à onglets est
 * celle qui absorbe la hauteur restante, donc la mettre en premier repoussait
 * le formulaire vers le bas de l'écran à mesure qu'un onglet se remplissait.
 * L'identité et les termes du document d'abord, ce qui s'y rattache ensuite.
 *
 * La contrainte se tient en une phrase : **le document ne défile pas, seul le
 * contenu d'onglet le fait.** D'où `fullHeight` sur `PageShell` côté appelant,
 * `min-h-0` sur toute la chaîne flex — sans lui un enfant refuse de rétrécir
 * sous sa taille intrinsèque et repousse le bas de la page hors du viewport —
 * et `overflow-auto` sur le seul panneau d'onglet.
 *
 * Ce qui est repris d'Omran : les trois bandes, la densité, l'ordre de lecture.
 * Ce qui ne l'est pas : les biseaux 3D, les champs jaunes, la barre d'icônes
 * muettes. La densité est une contrainte de métier, pas une esthétique. */
export default function FicheShell({
  identite,
  formulaire,
  panneau,
  onglets,
  ongletActif,
  onOngletChange,
  barreAction,
}: {
  /** Bandeaux d'exception au-dessus du formulaire (marqueur de tri, dossier
   * issu, dossier tout juste créé). L'identité elle-même vit dans la ligne de
   * titre (`CadreFiche`). */
  identite?: ReactNode;
  /** Le formulaire dense. Hauteur naturelle — il ne défile pas, c'est ce qui
   * oblige à le garder court. */
  formulaire: ReactNode;
  /** Panneau à droite du formulaire, sur la même ligne.
   *
   * Le logiciel de bureau n'en pose un que sur la fiche **dossier**, et pour
   * une raison précise : la synthèse Montant / Réglé / Reste doit rester lisible
   * pendant qu'on parcourt l'échéancier du bas. Deux zones d'onglets sur un
   * même écran ne se justifient que là — les fiches prospection et
   * pré-prospection n'ont rien à y mettre et ne passent pas cette prop. */
  panneau?: ReactNode;
  onglets: OngletFiche[];
  ongletActif: string;
  onOngletChange: (id: string) => void;
  /** Barre d'enregistrement, montée seulement quand quelque chose a changé.
   * Posée entre le formulaire et les onglets : au contact des champs qu'elle
   * enregistre, plutôt qu'en pied de page hors du regard. */
  barreAction?: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5">
      {identite && <div className="shrink-0">{identite}</div>}

      {panneau ? (
        /* `items-stretch` : le panneau prend la hauteur du formulaire plutôt
           que la sienne, sinon la synthèse flotte au-dessus d'un vide quand le
           formulaire est plus haut qu'elle. `min-w-0` des deux côtés — un
           tableau de montants large élargirait autrement la colonne. */
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
            /* Le seul endroit qui défile de toute la fiche. `min-w-0` en plus
               de `min-h-0` : un tableau large remonterait autrement la chaîne
               flex et élargirait la page au lieu de défiler. */
            className="min-h-0 min-w-0 flex-1 overflow-auto rounded-xl border border-border bg-card"
          >
            {o.contenu}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

/** La barre d'onglets des fiches : soulignement à l'accent sous l'onglet
 * actif, compteur sur chaque onglet de collection. Un compteur à zéro n'a pas
 * de pastille et atténue l'onglet — une pastille « 0 » se lisait comme du
 * contenu. À poser dans un `Tabs`. */
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

/** La ligne de résumé en tête de l'onglet d'activité : quelques faits
 * (`ElementResume`) puis l'action la plus fréquente de l'onglet, à droite,
 * juste au-dessus du tableau. */
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
