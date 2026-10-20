import type { ReactNode } from 'react';

/** Ouvre une fiche en dialogue (jamais de navigation) ; sans cible, le texte seul. */
export default function LienFiche({ onOuvrir, children }: Readonly<{ onOuvrir?: () => void; children: ReactNode }>) {
  if (!onOuvrir) return <>{children}</>;
  return (
    <button type="button" onClick={onOuvrir} className="font-medium text-(--brand) hover:underline">
      {children}
    </button>
  );
}
