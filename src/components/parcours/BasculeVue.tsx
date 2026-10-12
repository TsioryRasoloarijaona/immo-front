import { Columns3, List } from 'lucide-react';
import { Button } from '../ui/button';
import type { VueProspections } from '../../lib/kanban';

/** Bascule Liste / Kanban des prospections ; le choix est mémorisé par l'appelant. */
export default function BasculeVue({ vue, onChange }: Readonly<{ vue: VueProspections; onChange: (v: VueProspections) => void }>) {
  return (
    <div role="group" aria-label="Affichage des prospections" className="inline-flex rounded-md border border-border p-0.5">
      <Button type="button" size="xs" variant={vue === 'liste' ? 'secondary' : 'ghost'} aria-pressed={vue === 'liste'} onClick={() => onChange('liste')}>
        <List data-icon="inline-start" aria-hidden /> Liste
      </Button>
      <Button type="button" size="xs" variant={vue === 'kanban' ? 'secondary' : 'ghost'} aria-pressed={vue === 'kanban'} onClick={() => onChange('kanban')}>
        <Columns3 data-icon="inline-start" aria-hidden /> Kanban
      </Button>
    </div>
  );
}
