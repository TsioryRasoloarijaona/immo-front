import { Info } from 'lucide-react';

/** Affichée quand `prixSuggereEstPlancher` : le prix commercial vaut 0 et le
 * serveur a proposé le plancher. Informative, jamais bloquante. */
export default function MentionPrixPlancher() {
  return (
    <p className="mt-1 flex items-start gap-1 text-micro text-muted-foreground">
      <Info className="mt-px size-3 shrink-0" aria-hidden="true" />
      <span>Prix plancher proposé — le prix commercial de l'article n'est pas renseigné. Vous pouvez le modifier.</span>
    </p>
  );
}
