import type { ReactNode } from 'react';

export function TimelineList({ children }: { children: ReactNode }) {
  return <div className="flex flex-col">{children}</div>;
}

export function TimelineRow({
  titre,
  meta,
  note,
  badges,
  actions,
  dernier,
}: {
  titre: ReactNode;
  meta: ReactNode;
  note?: string | null;
  badges?: ReactNode;
  actions?: ReactNode;
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
          // `whitespace-pre-line` : les notes legacy sont des mémos multi-lignes
          // (tampon « date heure auteur » puis commentaire) qui sinon se collent.
          <div className="mt-1 whitespace-pre-line break-words text-body text-foreground">{note}</div>
        )}
        {badges && <div className="mt-1.5 flex flex-wrap gap-1.5">{badges}</div>}
        {actions && <div className="mt-1.5">{actions}</div>}
      </div>
    </div>
  );
}
