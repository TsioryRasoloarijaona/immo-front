import type { ReactNode } from 'react';
import ContactBoutons from './ContactBoutons';
import { cn } from '../../lib/utils';
import type { LigneTriDto } from '../../types';

export type GesteTri = 'contact' | 'injoignable' | 'qualifier' | 'archiver';

function Tuile({ touche, titre, aide, danger, onClick, disabled, children }: Readonly<{
  touche: string;
  titre: string;
  aide?: string;
  danger?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  children?: ReactNode;
}>) {
  const contenu = (
    <>
      <span className="flex items-center gap-2">
        <kbd className="rounded border border-border bg-muted px-1.5 text-micro font-semibold text-muted-foreground">{touche}</kbd>
        <span className={cn('text-label font-semibold', danger ? 'text-destructive' : 'text-foreground')}>{titre}</span>
      </span>
      {aide && <span className="text-micro text-muted-foreground">{aide}</span>}
    </>
  );
  const classe = 'flex min-h-20 flex-col items-start justify-between gap-2 rounded-xl border border-border bg-card p-3 text-left';
  if (!onClick) {
    return <div className={classe}>{contenu}{children}</div>;
  }
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={cn(classe, 'hover:border-primary disabled:opacity-50', danger && 'hover:border-destructive')}>
      {contenu}
    </button>
  );
}

/** Les quatre gestes du tri, raccourcis 1 à 4 (gérés par la page). */
export default function GestesTri({ ligne, busy, onGeste }: Readonly<{ ligne: LigneTriDto; busy: boolean; onGeste: (g: GesteTri) => void }>) {
  const nom = ligne.nom || ligne.code || 'ce lead';
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
      <Tuile touche="1" titre="Appeler / WhatsApp" aide="Puis noter l'échange">
        <ContactBoutons nom={nom} telephone={ligne.telephone} indicatif={ligne.indicatif} libelles onContact={() => onGeste('contact')} />
      </Tuile>
      <Tuile touche="2" titre="Pas joignable" aide={busy ? 'Enregistrement…' : 'Relance demain 10:00'} disabled={busy} onClick={() => onGeste('injoignable')} />
      <Tuile
        touche="3"
        titre="Qualifier et attribuer"
        aide={ligne.prospectId ? 'Devient une prospection' : "Créer d'abord le prospect"}
        disabled={busy}
        onClick={() => onGeste('qualifier')}
      />
      <Tuile touche="4" titre="Archiver" aide="Avec une raison" danger disabled={busy} onClick={() => onGeste('archiver')} />
    </div>
  );
}
