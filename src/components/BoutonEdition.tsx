import { Pencil } from 'lucide-react';
import { Button } from './ui/button';

/** Bascule « Modifier » / « Terminé » d'une carte éditable sur place. */
export default function BoutonEdition({
  enEdition,
  onBasculer,
}: Readonly<{ enEdition: boolean; onBasculer: (enEdition: boolean) => void }>) {
  if (enEdition) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => onBasculer(false)}>
        Terminé
      </Button>
    );
  }
  return (
    <Button type="button" variant="outline" size="sm" onClick={() => onBasculer(true)}>
      <Pencil data-icon="inline-start" /> Modifier
    </Button>
  );
}
