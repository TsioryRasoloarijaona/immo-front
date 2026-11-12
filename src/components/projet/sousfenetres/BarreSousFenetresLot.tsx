import { ChartColumn, FilePlus2, HandCoins, Lock, ReceiptText, Undo2, type LucideIcon } from 'lucide-react';
import BarreIcones from '../../BarreIcones';
import { Button } from '../../ui/button';
import { TITRES_SOUS_FENETRES, type SousFenetre } from '../../../lib/sousFenetresLot';

const ICONES: [SousFenetre, LucideIcon][] = [
  ['previsions', ChartColumn],
  ['avances', HandCoins],
  ['bordereau', Lock],
  ['avenants', FilePlus2],
  ['remboursements', Undo2],
  ['avoirs', ReceiptText],
];

/** Boutons des sous-fenêtres en lecture du lot, icônes seules (le nom passe en infobulle). */
export default function BarreSousFenetresLot({ onOuvrir }: Readonly<{ onOuvrir: (s: SousFenetre) => void }>) {
  return (
    <BarreIcones className="flex items-center gap-1">
      {ICONES.map(([cle, Icone]) => (
        <Button key={cle} type="button" variant="ghost" size="sm" onClick={() => onOuvrir(cle)}>
          <Icone /> {TITRES_SOUS_FENETRES[cle]}
        </Button>
      ))}
    </BarreIcones>
  );
}
