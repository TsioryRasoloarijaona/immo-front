import { CalendarRange, RotateCcw } from 'lucide-react';
import { EmptyState } from '../ui';
import { Button } from '../ui/button';

/** Liste vide : « Réinitialiser les filtres » si des filtres sont actifs, sinon « Toutes les périodes » (défaut : le mois). */
export default function EtatVideListe({
  filtresActifs,
  sujet,
  surMois,
  onReinitialiser,
  onToutesPeriodes,
}: Readonly<{
  filtresActifs: boolean;
  /** Ex. « dossier de vente » : complète « Aucun … ne correspond aux filtres actifs. » */
  sujet: string;
  /** Ex. « Aucun dossier de vente réservé sur le mois en cours. » */
  surMois: string;
  onReinitialiser: () => void;
  onToutesPeriodes: () => void;
}>) {
  return (
    <EmptyState
      title={filtresActifs ? 'Aucun résultat' : 'Rien ce mois-ci'}
      message={filtresActifs ? `Aucun ${sujet} ne correspond aux filtres actifs.` : surMois}
      action={
        <Button type="button" variant="outline" size="sm" onClick={filtresActifs ? onReinitialiser : onToutesPeriodes}>
          {filtresActifs ? <RotateCcw data-icon="inline-start" /> : <CalendarRange data-icon="inline-start" />}
          {filtresActifs ? 'Réinitialiser les filtres' : 'Toutes les périodes'}
        </Button>
      }
    />
  );
}
