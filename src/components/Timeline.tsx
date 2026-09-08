import type { ReactNode } from 'react';

/* ---------------------------------------------------------------------------
   La frise chronologique partagée par tous les historiques de l'application.

   Le même rail (pastille + trait de liaison) et le même corps à trois lignes
   étaient recopiés à six endroits : Parcours et Actions d'une prospection,
   Historique d'un prospect, Historique d'un dossier, et les deux onglets de la
   Hotline. Deux formes seulement les distinguaient — l'« évènement » (titre,
   méta, note) et l'« interaction », qui est la même chose plus une icône de
   sens, un badge de résultat et des badges RDV/alerte. La seconde est donc la
   première avec des props optionnelles, pas un composant à part.

   Les divergences qui n'étaient qu'accidentelles disparaissent au passage :
   l'espacement valait `pb-4.5` sur les pages de détail et `pb-3.5` sur la
   Hotline, sans raison.

   L'intérêt du regroupement n'est pas l'économie de lignes : c'est qu'une
   règle d'affichage d'historique — comment on rend une note, si on montre
   l'heure — n'a désormais qu'un seul endroit où être juste.
--------------------------------------------------------------------------- */

export function TimelineList({ children }: { children: ReactNode }) {
  return <div className="flex flex-col">{children}</div>;
}

export function TimelineRow({
  titre,
  meta,
  note,
  badges,
  dernier,
}: {
  /** Ligne de titre. Reçoit du JSX et non une chaîne : la forme
   * « interaction » y glisse une icône de sens et un badge de résultat. */
  titre: ReactNode;
  /** Date et auteur, en gris. */
  meta: ReactNode;
  /** Le commentaire libre saisi avec l'action. */
  note?: string | null;
  /** Badges de pied de ligne (RDV, alerte). */
  badges?: ReactNode;
  /** Coupe le trait de liaison sous la dernière ligne. */
  dernier: boolean;
}) {
  return (
    <div className="relative flex gap-3 pb-4.5 last:pb-0">
      <div className="flex shrink-0 flex-col items-center">
        <div className="mt-1 size-2.5 shrink-0 rounded-full bg-primary" />
        {!dernier && <div className="mt-1 w-0.5 flex-1 bg-border" />}
      </div>
      <div className="min-w-0 flex-1 pb-0.5">
        <div className="text-label font-semibold text-foreground">{titre}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{meta}</div>
        {note && (
          // `whitespace-pre-line` : les notes du système historique arrivent en
          // mémo multi-ligne (un tampon « date heure auteur » suivi du
          // commentaire, parfois plusieurs entrées empilées). Sans cela le
          // navigateur écrase les retours à la ligne et tout se lit d'un seul
          // tenant — le commentaire se retrouve collé au tampon qui le précède.
          // `break-words` pour qu'une référence collée sans espace ne déborde
          // pas de la colonne.
          <div className="mt-1 whitespace-pre-line break-words text-body text-foreground">{note}</div>
        )}
        {badges && <div className="mt-1.5 flex flex-wrap gap-1.5">{badges}</div>}
      </div>
    </div>
  );
}
