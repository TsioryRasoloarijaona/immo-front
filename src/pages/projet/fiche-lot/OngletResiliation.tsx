import { Card, FieldGrid } from '../../../components/ui';
import type { PropsOnglet } from '../../../lib/saisieLot';
import { ChampDate, ChampTexte } from './champsLot';

export default function OngletResiliation({ champs, maj, lectureSeule }: Readonly<PropsOnglet>) {
  return (
    <Card title="Résiliation">
      <FieldGrid>
        <ChampDate label="Date de résiliation" valeur={champs.dateResiliation} disabled={lectureSeule} onChange={(v) => maj('dateResiliation', v)} />
        <ChampTexte label="Cause de résiliation" valeur={champs.causeResiliation} disabled={lectureSeule} onChange={(v) => maj('causeResiliation', v)} />
      </FieldGrid>
    </Card>
  );
}
