import { Calculator, CalendarSync, Flag, RefreshCw, Save, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import type { DecompteDetailDto } from '../../types/projet';

export type ActionDecompte = 'enregistrer' | 'dernier' | 'lignes' | 'cumuls' | 'recalculer' | 'supprimer';

/** Boutons de la fiche (icônes seules, libellé en infobulle via la barre de `PageShell`), activés selon les drapeaux du serveur. */
export default function BarreActionsDecompte({
  d,
  occupe,
  onAction,
}: Readonly<{ d: DecompteDetailDto; occupe: boolean; onAction: (action: ActionDecompte) => void }>) {
  const bouton = (action: ActionDecompte, actif: boolean, Icone: typeof Save, libelle: string) => (
    <Button type="button" variant="outline" size="sm" disabled={occupe || !actif} onClick={() => onAction(action)}>
      <Icone data-icon="inline-start" /> {libelle}
    </Button>
  );
  return (
    <>
      {bouton('enregistrer', d.peutModifier, Save, 'Enregistrer')}
      {bouton('dernier', d.peutDefinirDernier, Flag, 'Définir en tant que dernier décompte')}
      {bouton('lignes', d.peutModifier, CalendarSync, 'Recharger les lignes jusqu’à la date')}
      {bouton('cumuls', d.peutModifier, RefreshCw, 'Recharger les cumuls')}
      {bouton('recalculer', d.peutRecalculer, Calculator, 'Recalculer le décompte')}
      {d.peutSupprimer && bouton('supprimer', true, Trash2, 'Supprimer')}
    </>
  );
}
