import { Card } from '../../../components/ui';
import { Textarea } from '../../../components/ui/textarea';
import type { PropsOnglet } from '../../../lib/saisieLot';

export default function OngletAutres({ champs, maj, lectureSeule }: Readonly<PropsOnglet>) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Card title="Description détaillée">
        <Textarea aria-label="Description détaillée" rows={6} value={champs.descriptionDetaillee ?? ''} disabled={lectureSeule} onChange={(e) => maj('descriptionDetaillee', e.target.value || null)} />
      </Card>
      <Card title="Notes">
        <Textarea aria-label="Notes" rows={6} value={champs.notes ?? ''} disabled={lectureSeule} onChange={(e) => maj('notes', e.target.value || null)} />
      </Card>
    </div>
  );
}
