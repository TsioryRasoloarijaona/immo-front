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

/** Disposition commune aux fiches prospection, pré-prospection et dossier.
 *
 * Reprend la géométrie du logiciel de bureau, qui range chaque fiche en trois
 * bandes : une ligne d'identité, un formulaire dense à deux colonnes, puis une
 * barre d'onglets ouvrant sur une grille. Le tout **tient dans une page** — le
 * commercial lit et corrige sans jamais faire défiler la fiche, et c'est le
 * point que la version précédente de cet écran avait perdu en empilant des
 * cartes sur trois hauteurs d'écran.
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
  /** Bande du haut : code, date, pastilles d'état. Toujours visible. */
  identite: ReactNode;
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
   * Placée entre le formulaire et les onglets : au contact du champ qu'on
   * vient de modifier, plutôt qu'en pied de page hors du regard. */
  barreAction?: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5">
      <div className="shrink-0">{identite}</div>

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
        <TabsList className="shrink-0">
          {onglets.map((o) => (
            <TabsTrigger key={o.id} value={o.id}>
              {o.libelle}
              {o.compteur !== undefined && (
                <span
                  className={cn(
                    'ml-1.5 rounded px-1 text-micro tabular-nums',
                    o.compteur > 0 ? 'bg-secondary text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {o.compteur}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

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
