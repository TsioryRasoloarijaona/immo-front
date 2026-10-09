import { Info } from 'lucide-react';

/** Mention neutre sous un champ prix pré-rempli par le prix plancher
 * (`prixSuggereEstPlancher`) : le prix commercial de l'article vaut 0, le
 * serveur a donc proposé le plancher. Informatif, jamais bloquant. */
export default function MentionPrixPlancher() {
  return (
    <p className="mt-1 flex items-start gap-1 text-micro text-muted-foreground">
      <Info className="mt-px size-3 shrink-0" aria-hidden="true" />
      <span>Prix plancher proposé — le prix commercial de l'article n'est pas renseigné. Vous pouvez le modifier.</span>
    </p>
  );
}
