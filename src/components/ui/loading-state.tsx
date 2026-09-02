import { Loader2 } from 'lucide-react';
import { Empty } from './empty';

/** Extrait de `components/ui.tsx` pour rester hors du chunk d'entrée.
 *
 * `App.tsx` s'en sert comme `fallback` du `Suspense` des routes, et c'était
 * son seul import *eager* de `ui.tsx` — un fichier de 300 lignes qui tire
 * `badge`, `card`, `empty`, `avatar`, `class-variance-authority` et
 * `tailwind-merge` avec lui. Isolé ici, le chunk d'entrée ne garde que
 * `empty` + une icône. `ui.tsx` le ré-exporte, donc les 38 autres importeurs
 * (tous dans des routes paresseuses) ne changent pas. */
export function LoadingState() {
  return (
    <Empty className="border-none py-17.5">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
      <p className="text-label text-muted-foreground">Chargement des données…</p>
    </Empty>
  );
}
