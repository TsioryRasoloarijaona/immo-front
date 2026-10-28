import type { ReactNode } from 'react';

/** Enveloppe d'un écran de liste : toute la hauteur sous la barre du haut, la barre d'outils flottante s'y ancre. */
export default function PageListe({ titre, children }: Readonly<{ titre: string; children: ReactNode }>) {
  return (
    <div className="relative flex h-[calc(100svh_-_1rem_-_var(--hauteur-barre-haut,0px))] min-h-0 flex-col overflow-hidden">
      {/* Le seul `<h1>` de l'écran : ne pas le retirer, les lecteurs d'écran naviguent par titres. */}
      <h1 className="sr-only">{titre}</h1>
      {children}
    </div>
  );
}
